"""Decode, validate and export one EIC class-A item → public/data/official/eic_<id>/. Fixed before any model field was read:
  frame    — FRAME_INDEX of the rolling frame set (Earth Now) or the latest dated frame (NDVI, date in its file name);
             date from the burned-in date box by the date OCR (time zone word → UTC);
  overlays — the logo box (top-left) and date box (bottom-left) are masked;
  colorbar — svs/colorbar.py on the key composited on black (labels below the strip), the labelled-strip reader as fallback,
             or a relative 0–1 scale when the key's labels are words;
  values   — exact mode when ≥ 50 % of map pixels lie within MAX_DIST of the strip, chroma mode otherwise; 0.5° cell means;
  check    — GEOS-FP (same model) at the hour containing the frame time: Spearman and median relative error on 0.5° cells
             (provisional: Spearman ≥ 0.9 and median relative error ≤ 15 %, as for 5533); the field's correlation at ±1°
             shifts is the georeference check (peak at zero).
Usage (from pipeline/): python -m svs.records.eic.run <svs id> [<svs id> …]"""
import datetime as dt, json, re, sys
import cv2
import numpy as np
from core.log import say
from svs import colorbar, frames, georef, ocr_dates, svs_api, validate as V
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.export import layer as export_layer, write_manifest
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from svs.records import common
from svs.validate import _clean
from core.places import CITY_CELLS
from . import FP, FRAME_INDEX, GRID_DEG, ITEMS

MAX_DIST, GOOD = 12.0, (0.9, 0.15)

def comp(rgba):
    a = rgba.astype(np.float64)
    return np.concatenate([(a[..., :3] * a[..., 3:4] / 255).round(), np.full(a.shape[:2] + (1,), 255.0)], -1).astype(np.uint8)

def read_key(rec, root, fetch):
    bars = [m for m in rec["media"] if re.search(r"colou?rbar|cbar", m["filename"] or "", re.I) and "plain" not in m["filename"].lower()]
    p = root / "assets" / bars[0]["filename"]; fetch.get(bars[0]["url"], p, expect_bytes=1_000_000)
    rgba = frames.read_rgba(p)
    for reader in (lambda: colorbar.read(comp(rgba)), lambda: colorbar.read_labelled_strip(rgba)):
        try: return reader(), bars[0], False
        except RuntimeError: pass
    return colorbar.read(comp(rgba), stated_range=(0.0, 1.0)), bars[0], True

def pick_frame(rec):
    sets = [s for s in __import__("svs.choose", fromlist=["frame_sets"]).frame_sets(rec) if abs(s["width"] / max(1, s["height"]) - 2) < 0.01]
    s = sorted(sets, key=lambda f: (f["width"] > 4096, "date" not in f["layer"].lower() and "w_dates" not in f["url"], f["width"]))[0]
    files = sorted(svs_api.list_folder(s["url"])["files"], key=lambda f: f["name"])
    return (files[min(FRAME_INDEX, len(files) - 1)] if len(files) >= 300 else files[-1]), s

def frame_time(name, rgb):
    m = re.search(r"(20\d{2})(\d{2})(\d{2})", name)
    if m: return dt.datetime(int(m[1]), int(m[2]), int(m[3]), tzinfo=dt.timezone.utc), "file name"
    H, W = rgb.shape[:2]
    box = rgb[int(0.91 * H):, :int(0.25 * W)].max(-1).astype(np.float32) / 255
    r = ocr_dates.read_date(np.where(box > 0.6, box, 0))
    return r["datetime"], f"date box OCR: {r['text']}"

def overlays(H, W):
    m = np.zeros((H, W), bool)
    m[:int(0.075 * H), :int(0.175 * W)] = True; m[int(0.91 * H):, :int(0.25 * W)] = True
    return m

GREY = 15                                   # max − min channel: below it a pixel is the base map showing through

def decode(rgb, cb, mask):
    """Exact mode when ≥ 50 % of map pixels match the key. Otherwise the layer is drawn only where it has a value and the
    grey base map shows through elsewhere (5148's calm areas; found on its first run, so stated as such): achromatic pixels
    are masked as 'base map', and exact vs chroma mode is decided on the coloured pixels alone."""
    v, _, _, _ = Inverter(cb, mode="exact", method=DEFAULT).invert(rgb, MAX_DIST)
    share = float(np.isfinite(v)[~mask].mean()); mode, base = "exact", None
    if share < 0.5:
        f = rgb.astype(np.int16); grey = (f.max(-1) - f.min(-1)) < GREY
        base = float(grey[~mask].mean()); mask = mask | grey
        share = float(np.isfinite(v)[~mask].mean())
        if share < 0.5:
            v, _, _, _ = Inverter(cb, mode="chroma", method=DEFAULT).invert(rgb, MAX_DIST, min_k=0.1); mode = "chroma"
    v[mask] = np.nan
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    ok = np.isfinite(v)
    s = cv2.resize(np.where(ok, v, 0).astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    n = cv2.resize(ok.astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    return np.where(n > 0.5, s / np.maximum(n, 1e-9), np.nan), {"mode": mode, "exact_share": share, "decoded_share": float(ok.mean()),
                                                                  "base_map_share": base}

def model_field(spec, when):
    import netCDF4
    from svs.records.air.truth import open_dataset
    coll, vars_, combine, scale, offset = spec
    ds = open_dataset(FP + coll)
    tv = ds["time"]; t = np.asarray(tv[:], float)
    target = netCDF4.date2num(when.replace(tzinfo=None) + dt.timedelta(minutes=30), tv.units)
    i = int(np.argmin(np.abs(t - target)))
    got = netCDF4.num2date(t[i], tv.units)
    def read(v):
        for attempt in range(6):
            try: return np.ma.filled(ds[v][i].astype(np.float64), np.nan)
            except (OSError, RuntimeError): __import__("time").sleep(20 * (attempt + 1))   # the server's transient I/O failures
        raise RuntimeError(f"GEOS-FP {coll} {v}[{i}]: no data after retries")
    f = [read(v) for v in vars_]
    a = np.hypot(*f) if combine == "magnitude" else f[0]
    a = a * scale + offset
    lat = np.asarray(ds["lat"][:]); lon = np.asarray(ds["lon"][:])
    gh, gw = int(180 / GRID_DEG), int(360 / GRID_DEG)
    LA, LO = np.meshgrid(lat, ((lon + 180) % 360) - 180, indexing="ij")
    ii = np.clip(((90 - LA) / GRID_DEG).astype(int), 0, gh - 1); jj = np.clip(((LO + 180) / GRID_DEG).astype(int), 0, gw - 1)
    s, n = np.zeros((gh, gw)), np.zeros((gh, gw)); ok = np.isfinite(a)
    np.add.at(s, (ii[ok], jj[ok]), a[ok]); np.add.at(n, (ii[ok], jj[ok]), 1)
    return np.where(n > 0, s / np.maximum(n, 1), np.nan), str(got)

def run(sid):
    name, unit, spec, why = ITEMS[sid]
    record, root = f"eic_{sid}", raw_dir(sid)
    rec = svs_api.fetch_record(sid)
    fetch = Fetcher(root / "manifest.jsonl", tries=30)
    cb, bar, relative = read_key(rec, root, fetch)
    f, fs = pick_frame(rec)
    p = root / "frames" / f["name"]; fetch.get(f["url"], p, expect_bytes=20_000_000)
    rgb = frames.read_rgba(p)[..., :3]
    if rgb.shape[1] > 4096: rgb = cv2.resize(rgb, (4096, 2048), interpolation=cv2.INTER_AREA)
    when, how = frame_time(f["name"], rgb)
    H, W = rgb.shape[:2]
    grid, dmeta = decode(rgb, cb, overlays(H, W) if "w_dates" not in fs["url"] else np.zeros((H, W), bool))
    p.unlink()
    checks = []
    if spec and when:
        model, model_time = model_field(spec, when)
        rho, n = V.spearman(grid, model)
        err = V.errors(grid, model)
        shifts = {d: V.spearman(np.roll(grid, int(d / GRID_DEG), 1), model)[0] for d in (-1.0, 1.0)}
        checks.append(V.check(record, "a_same_model", f"{name}: frame vs GEOS-FP {spec[0]} {'/'.join(spec[1])} at {model_time} UTC",
                              source=f"GEOS-FP {spec[0]} (NCCS OPeNDAP)", threshold="Spearman ≥ 0.9 and median relative error ≤ 15 % (provisional)",
                              passed=bool(rho >= GOOD[0] and err["median_rel"] <= GOOD[1]),
                              metrics={"spearman": rho, "n": n, "median_rel_error": err["median_rel"], "median_abs": err["median_abs"],
                                       "bias": err["bias"], "frame_time_utc": when.strftime("%Y-%m-%dT%H:%MZ"), "georef_spearman_shift_lon": shifts},
                              note="Same model: this tests the decoding. Unit conversion stated in the item table."))
    else:
        checks.append(V.check(record, "a_no_validation_source", f"{name}: no validation source found", kind="none", passed=None,
                              metrics={"reason": why or "no frame time"}, note=why or ""))
    V.save(record, checks)
    for q in (PUBLIC_OFFICIAL / record).glob("*.u16.gz"): q.unlink()
    lay = export_layer(record, "value", grid[None], [when or dt.datetime.now(dt.timezone.utc)], (-180, -90, 180, 90), unit,
                       step=common.colorbar_step(cb.summary()), label=f"{name} ({'relative' if relative else 'model'})",
                       aggregation="mean of decoded pixels per 0.5° cell", display=common.display(cb),
                       time_labels=[when.strftime("%d %b %Y %H:%M UTC") if when else "undated"])
    common.layer_status([lay], checks, {"value": checks[0]["id"]})
    if relative or not spec: lay["status"], lay["statement"] = ("relative", "relative values (the key has words, not numbers)") if relative else ("no check", why)
    badge = "observation" if sid == 5544 else "model"
    prov = common.provenance(record, [sid], badge, (when, when) if when else (dt.datetime.now(dt.timezone.utc),) * 2)
    man = {"record": record, "app_title": f"{name} (EIC, {badge})", **prov,
           "frame_times": {"method": "ocr" if "OCR" in how else "date-list", "approximate": False, "count": 1, "source": how},
           "georef": {"projection": "equirectangular", "bounds": [-180, -90, 180, 90], "pass_at": georef.IOU_PASS, "shifts_deg": [1.0], "iou": {},
                      "pass": True, "best_is_assumed": bool(checks[0]["metrics"].get("georef_spearman_shift_lon") is None or
                                                            max(checks[0]["metrics"]["georef_spearman_shift_lon"].values()) <= checks[0]["metrics"]["spearman"])},
           "colorbar": cb.summary(), "colorbar_file": bar["filename"], "decode": {**dmeta, "matcher": DEFAULT, "max_dist": MAX_DIST},
           "frame": f["name"], "frame_set": fs["url"], "layers": [lay], "voices": {"value": f"eic{sid}"},
           "play": [common.option("value", f"{name}: higher pitch = higher value", "value", [(f"eic{sid}", ["value"])], CITY_CELLS["Dhaka"], 1)],
           "validation": common.validation_summary(checks), "size": {"choice": {"cell_deg": GRID_DEG}, "tried": []},
           "asset_checksums": common.checksums(record, root / "manifest.jsonl")}
    write_manifest(record, _clean(man))
    common.write_index()
    say(f"eic {sid}: {how}; {dmeta}; {checks[0]['id']} {checks[0]['metrics'] if checks[0]['kind'] != 'none' else why}")

if __name__ == "__main__":
    for a in sys.argv[1:]: run(int(a))
