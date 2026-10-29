"""Validate 5196 / 5436 (fixed before any context data were read):
(a) internal consistency: N_SYNTH values drawn evenly over the strip where its opacity ≥ ALPHA_MIN are rendered with the
    same colour and opacity transfer functions (sRGB → linear, a random lighting factor 0.3–3×, premultiplied by the
    opacity) and decoded by the record's own code path; provisional: every value within 1 % of the colorbar's range where
    the colour is invertible (outside the spans Inverter.uncertain(tol=UNCERTAIN_TOL) finds on the colorbar alone: the
    white end and a fold), with the whole-range numbers reported too;
(b) context, not pixel truth: NOAA GML Mauna Loa monthly mean CO2 for the months of the frames, next to the frames'
    opacity-weighted ppm in Mauna Loa's cell ("what the real atmosphere measured at one station then");
(c) georeference of the surface layer (decode.json).
Usage (from pipeline/): python -m svs.records.co2.validate"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import fetch, validate as V
from svs.invert import DEFAULT, Inverter
from . import GRID_DEG, RECORD
from .decode import ALPHA_MIN, MAX_DIST, ROOT, colours_of
from .transfer import read as read_transfer

N_SYNTH, SEED, UNCERTAIN_TOL = 20000, 5196, 2.0
MLO = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt"
MLO_SITE = (19.536, -155.576)                    # NOAA GML Mauna Loa Observatory (lat, lon), from the GML station page

def synthetic(cb):
    rng = np.random.default_rng(SEED)
    px = rng.uniform(0, cb.n - 1, N_SYNTH)
    keep = np.interp(px, np.arange(cb.n), cb.alpha) >= ALPHA_MIN
    px = px[keep]
    rgb8 = np.stack([np.interp(px, np.arange(cb.n), cb.rgb[:, c]) for c in range(3)], -1) / 255
    lin = np.where(rgb8 <= 0.04045, rgb8 / 12.92, ((rgb8 + 0.055) / 1.055) ** 2.4)
    al = np.interp(px, np.arange(cb.n), cb.alpha)
    lit = lin * rng.uniform(0.3, 3.0, len(px))[:, None]
    img, a, ok = colours_of((lit * al[:, None])[None].astype(np.float32), al[None].astype(np.float32))
    inv = Inverter(cb, mode="chroma", method=DEFAULT)
    got, _, _, _ = inv.invert(img, MAX_DIST, min_k=0.0)
    truth = cb.value_at(px)
    err = np.abs(got[0] - truth)
    lo, hi = cb.summary()["value_range"]
    unc = inv.uncertain(tol=UNCERTAIN_TOL)
    ok = ~np.isin(np.round(px), np.round(unc))
    stat = lambda e: {"n": int(len(e)), "median_abs_ppm": float(np.nanmedian(e)), "p99_abs_ppm": float(np.nanpercentile(e, 99)),
                      "max_abs_ppm": float(np.nanmax(e)), "max_pct_of_range": float(np.nanmax(e) / (hi - lo) * 100)}
    return {**stat(err[ok]), "range_ppm": float(hi - lo), "uncertain_spans_ppm": spans(cb.value_at(unc)), "whole_range": stat(err)}

def spans(values, gap=0.5):
    """Sorted values → [[start, end], …] runs (gap in ppm)."""
    v = np.sort(np.asarray(values, float)); out = []
    for x in v:
        if out and x - out[-1][1] <= gap: out[-1][1] = float(x)
        else: out.append([float(x), float(x)])
    return out

def mauna_loa(g):
    text = fetch.text(MLO)
    rows = [l.split() for l in text.splitlines() if l.strip() and not l.startswith("#")]
    monthly = {(int(r[0]), int(r[1])): float(r[3]) for r in rows}
    i, j = int((90 - MLO_SITE[0]) / GRID_DEG), int((MLO_SITE[1] + 180) / GRID_DEG)
    out = {}
    for t, p in zip(g["times"], g["ppm"]):
        d = dt.datetime.fromisoformat(str(t).replace("Z", "+00:00"))
        out.setdefault(f"{d:%Y-%m}", {"noaa_mlo_ppm": monthly.get((d.year, d.month)), "frame_ppm": []})["frame_ppm"].append(float(p[i, j]))
    return {k: {"noaa_mlo_ppm": v["noaa_mlo_ppm"], "frame_ppm_mean": float(np.nanmean(v["frame_ppm"])) if np.isfinite(v["frame_ppm"]).any() else None,
                "frames": len(v["frame_ppm"])} for k, v in out.items()}

def main():
    cb = read_transfer(ROOT / "assets" / "dyamondCbar_6-27-2024a.png")
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    g = np.load(ROOT / "grids.npz")
    s = synthetic(cb)
    checks = [V.check(RECORD, "a_synthetic_round_trip", "Synthetic render with the same transfer functions, decoded by the record's code",
                      kind="value", source="the record's own colorbar (colour + opacity)", threshold="every value within 1 % of the range (provisional)",
                      passed=bool(s["max_pct_of_range"] <= 1.0), metrics=s,
                      note="Tests the decoding of a single colour per pixel; a volume render averages a column, which this cannot test."),
              V.check(RECORD, "b_mauna_loa_context", "Context: NOAA GML Mauna Loa monthly CO2 vs the frames at Mauna Loa's cell", kind="context",
                      source="NOAA GML co2_mm_mlo.txt", passed=None, metrics=mauna_loa(g),
                      note="What the real atmosphere measured at one station then; the frames are a model nature run averaged along the view."),
              V.check(RECORD, "c_georef_surface", "Surface layer vs Natural Earth land (same SOS projection as the CO2 layer)", kind="context",
                      source="Natural Earth 1:50m land", passed=None, metrics={k: dec["georef"][k] for k in ("iou", "best_is_assumed", "shifted")},
                      note="Winter snow and sea ice are white like land, which lowers the IoU; the assumed bounds score best of all shifts.")]
    V.save(RECORD, checks)
    say(f"(a) {s}; (b) {checks[1]['metrics']}")

if __name__ == "__main__":
    main()
