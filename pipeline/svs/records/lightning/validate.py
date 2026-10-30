"""Validate 5011 (choices fixed before any ISS LIS flash was read; windows chosen by date in lis.py):
(a) per region (Bangladesh, Congo basin, Lake Maracaibo, Himalayan foothills): flashes counted from the frames in each
    10-day validation window vs ISS LIS V3 science flashes in the same window and box: Spearman across the windows
    (provisional ≥ 0.6 per region);
(b) per window: Spearman of 1° cell counts, frames vs ISS LIS, within ±BAND° (no threshold);
(c) pattern: all frame flashes per 1° cell vs the LIS/OTD HRFC climatology (an independent era and sensors; no threshold);
(d) Bangladesh: pre-monsoon (Mar–May) vs monsoon (Jun–Sep) flashes per year from the frames, with ISS LIS for the
    validation windows that fall in each season (context);
(e) frame times: the seasonal-anchor model (timing.py) and the measured mark lifetime against the stated 10-day window;
added 30 Oct (report corrections, fixed before any view time was read):
(a2) as (a), with ISS LIS as a flash RATE (flashes per hour of effective view time in the box), not a count;
(b2) as (b), with ISS LIS cell rates (flashes / view seconds; cells with < MIN_VIEW_S seconds dropped);
(f) the 60–90°E gap: per window, ISS LIS view seconds and flashes in 60–90°E (|lat| ≤ BAND) divided by the mean of the
    30–60°E and 90–120°E bands; the QC data 'share the gap' if the median view-time ratio is below GAP_RATIO.
The SVS page lists 'Quality Controlled LIS on ISS Science Data V1'; the check uses V3 (isslis_v3_fin), the current reprocessing.
Usage (from pipeline/): python -m svs.records.lightning.validate"""
import datetime as dt
import numpy as np
from core.log import say
from svs import validate as V
from svs.config import raw_dir
from . import RECORD, SID, WINDOW_DAYS, regions
from .counts import grid, in_box, load
from .lis import OUT as LIS, TAI93, windows
from .truth import HRFC, OUT as TRUTH, grid as clim_grid

BAND, MIN_VIEW_S, GAP_RATIO = 50.0, 60.0, 0.5
SOURCE = "ISS LIS V3 science flashes (isslis_v3_fin, GHRC DAAC)"
PRE, MONSOON = (3, 4, 5), (6, 7, 8, 9)

def lis_window(w0):
    z = np.load(LIS / f"{w0:%Y%m%d}.npz")
    return z["lat"], z["lon"]

def lis_view(w0):
    """(lat, lon, effective seconds) of the window's view-time cells, or None for a window saved before view time was kept."""
    z = np.load(LIS / f"{w0:%Y%m%d}.npz")
    return (z["vt_lat"], z["vt_lon"], z["vt_obs"]) if "vt_obs" in z.files else None

def band_seconds(lat, lon, w, lo, hi):
    m = (np.abs(lat) <= BAND) & (lon >= lo) & (lon < hi)
    return float(w[m].sum())

def main():
    c = load()
    regs = regions()
    wins = [w for w in windows() if (LIS / f"{w:%Y%m%d}.npz").exists()]
    rows, spatial, spatial_rate, gaps = [], [], [], []
    for w0 in wins:
        t0, t1 = w0.timestamp(), (w0 + dt.timedelta(days=WINDOW_DAYS)).timestamp()
        sel = (c["when"] >= t0) & (c["when"] < t1)
        la, lo = lis_window(w0)
        row = {"window": f"{w0:%Y-%m-%d}"}
        for name, box in regs.items():
            row[name] = {"frames": float(c["n"][sel & in_box(c["lat"], c["lon"], box)].sum()), "lis": int(in_box(la, lo, box).sum())}
        vt = lis_view(w0)
        if vt is not None:
            for name, box in regs.items():
                secs = float(vt[2][in_box(vt[0], vt[1], box)].sum())
                row[name]["view_h"] = secs / 3600
                row[name]["lis_rate_per_h"] = row[name]["lis"] / (secs / 3600) if secs > 0 else None
            fl = {b: band_seconds(la, lo, np.ones(len(la)), *b) for b in ((30, 60), (60, 90), (90, 120))}
            vs = {b: band_seconds(vt[0], vt[1], vt[2], *b) for b in fl}
            ref = lambda d: (d[(30, 60)] + d[(90, 120)]) / 2
            gaps.append({"window": row["window"], "view_ratio": vs[(60, 90)] / ref(vs) if ref(vs) else None,
                         "flash_ratio": fl[(60, 90)] / ref(fl) if ref(fl) else None, "view_h_60_90E": vs[(60, 90)] / 3600})
        rows.append(row)
        gf, gl = grid(c["lat"][sel], c["lon"][sel], c["n"][sel]), grid(la, lo, np.ones(len(la)))
        lat_c = 90 - (np.arange(gf.shape[0]) + 0.5)
        band = np.abs(lat_c) <= BAND
        rho, n = V.spearman(gf[band], gl[band]); spatial.append({"window": row["window"], "spearman": rho, "n_cells": n})
        if vt is not None:
            gv = grid(vt[0], vt[1], vt[2])
            rate = np.where(gv >= MIN_VIEW_S, gl / np.maximum(gv, 1e-9), np.nan)
            rho2, n2 = V.spearman(gf[band], rate[band]); spatial_rate.append({"window": row["window"], "spearman": rho2, "n_cells": n2})
    per_region = {name: dict(zip(("spearman", "n_windows"), V.spearman([r[name]["frames"] for r in rows], [r[name]["lis"] for r in rows])))
                  for name in regs}
    checks = [V.check(RECORD, "a_region_counts_isslis", "Flash counts per region and 10-day window vs ISS LIS", kind="value", source=SOURCE,
                      threshold="Spearman ≥ 0.6 per region (provisional)",
                      passed=all(r["spearman"] is not None and np.isfinite(r["spearman"]) and r["spearman"] >= 0.6 for r in per_region.values()),
                      metrics={"per_region": per_region, "windows": rows},
                      note="Frame dates come from the seasonal-anchor model (approximate); a window is the frames dated inside it. The SVS page "
                           "lists ISS LIS Science Data V1; this uses V3 (isslis_v3_fin, DOI 10.5067/LIS/ISSLIS/DATA114), Mar 2017 – 31 Jul 2023."),
              V.check(RECORD, "b_spatial_isslis", f"1° cell counts per window vs ISS LIS (|lat| ≤ {BAND:g}°)", source=SOURCE, passed=None,
                      metrics={"median_spearman": float(np.nanmedian([s["spearman"] for s in spatial])), "per_window": spatial})]
    if gaps:
        rated = [r for r in rows if all(r[n].get("lis_rate_per_h") is not None for n in regs)]
        per_rate = {name: dict(zip(("spearman", "n_windows"), V.spearman([r[name]["frames"] for r in rated], [r[name]["lis_rate_per_h"] for r in rated])))
                    for name in regs}
        vr = [g["view_ratio"] for g in gaps if g["view_ratio"] is not None]
        checks += [V.check(RECORD, "a2_region_rates_isslis", "Frame flash counts per region vs ISS LIS flash RATE (per hour of view time)",
                           kind="value", source=SOURCE, threshold="Spearman ≥ 0.6 per region (provisional, as (a))",
                           passed=all(r["spearman"] is not None and np.isfinite(r["spearman"]) and r["spearman"] >= 0.6 for r in per_rate.values()),
                           metrics={"per_region": per_rate}, note="Rates remove the ISS's uneven revisit, which counts do not."),
                   V.check(RECORD, "b2_spatial_rates_isslis", f"1° cell counts vs ISS LIS cell rates (≥ {MIN_VIEW_S:g} s of view)", source=SOURCE,
                           passed=None, metrics={"median_spearman": float(np.nanmedian([s["spearman"] for s in spatial_rate])), "per_window": spatial_rate}),
                   V.check(RECORD, "f_gap_60_90E", "Does the QC ISS LIS record share the 60–90°E gap of the NRT plots?", kind="context", source=SOURCE,
                           passed=None, metrics={"median_view_ratio": float(np.median(vr)) if vr else None, "rule": f"shares the gap if < {GAP_RATIO}",
                                                 "shares_gap": bool(vr and np.median(vr) < GAP_RATIO), "per_window": gaps},
                           note="View seconds and flashes in 60–90°E over the mean of the neighbouring 30° bands (|lat| ≤ 50°).")]
    hrfc, lat, lon = clim_grid(TRUTH / HRFC[1].rsplit("/", 1)[1], "HRFC_COM_FR")
    hr = np.nanmean(hrfc.reshape(180, 2, 360, 2), axis=(1, 3))
    total = grid(c["lat"], c["lon"], c["n"])
    band = np.abs(90 - (np.arange(180) + 0.5)) <= BAND
    rho, n = V.spearman(total[band], hr[band])
    checks.append(V.check(RECORD, "c_pattern_hrfc", "All frame flashes per 1° cell vs LIS/OTD HRFC flash rate (1995–2014)",
                          source="LIS/OTD 0.5° HRFC V2.3.2015 (GHRC DAAC)", kind="context", passed=None, metrics={"spearman": rho, "n_cells": n},
                          note="Different years and sensors (TRMM LIS + OTD): a check of the global pattern, not of values."))
    bd = in_box(c["lat"], c["lon"], regs["Bangladesh"])
    months = np.array([dt.datetime.fromtimestamp(t, dt.timezone.utc).month for t in c["when"][bd]])
    years = np.array([dt.datetime.fromtimestamp(t, dt.timezone.utc).year for t in c["when"][bd]])
    season = {int(y): {"pre_monsoon": float(c["n"][bd][(years == y) & np.isin(months, PRE)].sum()),
                  "monsoon": float(c["n"][bd][(years == y) & np.isin(months, MONSOON)].sum())} for y in sorted(set(years))}
    lis_season = {r["window"]: {"season": "pre_monsoon" if int(r["window"][5:7]) in PRE else "monsoon" if int(r["window"][5:7]) in MONSOON else "other",
                                "frames": r["Bangladesh"]["frames"], "lis": r["Bangladesh"]["lis"]} for r in rows}
    checks.append(V.check(RECORD, "d_bangladesh_seasons", "Bangladesh: pre-monsoon (Mar–May) vs monsoon (Jun–Sep) flashes", kind="context",
                          source="frames (all years) and ISS LIS (validation windows)", passed=None,
                          metrics={"frames_by_year": season, "validation_windows": lis_season}))
    m = c["model"]; life = c["meta"]["lifetime_frames"]
    seg = next(s for s in m["segments"] if s["frames"][0] <= life["sample"][0] <= s["frames"][1])
    checks.append(V.check(RECORD, "e_frame_times", "Frame times: seasonal anchors and the mark lifetime", kind="context", source="frames + HRMC",
                          passed=None, metrics={"anchors": m["anchors"], "days_per_frame_range": [min(s["days_per_frame"] for s in m["segments"]),
                                                                                                    max(s["days_per_frame"] for s in m["segments"])],
                                                "lifetime_frames_median": life["median"], "lifetime_days_at_model_rate": life["median"] * seg["days_per_frame"],
                                                "stated_window_days": WINDOW_DAYS},
                          note="The movie has no date; times are approximate. A drawn mark lasts lifetime_frames; at the model's rate that is the "
                               "window the picture shows, compared with the SVS text's 10 days."))
    V.save(RECORD, checks)
    say(f"(a) {per_region}; (b) median {checks[1]['metrics']['median_spearman']:.3f}; (c) {rho:.3f}; (e) lifetime "
        f"{life['median']} frames ≈ {checks[-1]['metrics']['lifetime_days_at_model_rate']:.1f} days")

if __name__ == "__main__":
    main()
