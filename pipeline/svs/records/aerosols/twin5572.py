"""5572 (GEOS-FP aerosols, 1 Aug – 15 Sep 2024): the animated version of the 5669 rendering, with label-free 6480×3240
2:1 frames (Aerosols/; labels are a separate Annotations/ layer). Fixed 30 Oct before any GEOS-FP file was read:
  frames — FRAMES, 13:30 UTC on 1, 16, 31 Aug and 15 Sep 2024, with frame k = 1 Aug 2024 00:00 UTC + k × 30 min
           (2,208 frames = 46 days × 48; assumed linear: the page gives the period only);
  key    — 5572's own Aerosols_cbar.png, its swatches compared with 5669's (the decode uses 5669's named keys if they agree);
  decode — svs/records/aerosols/decode.py's classifier (type by hue, density by lightness above the ocean floor) and its
           georeference check (bare base-map pixels on Natural Earth land);
  check  — per type, on 1° cells, the frame's type density vs GEOS-FP tavg3_2d_aer_Nx species AOD in the 3-hour window
           holding the frame time (the same model; geosfp.py): Spearman per frame and pooled over the frames.
Writes data_raw/5669/twin5572.json.
Usage (from pipeline/): python -m svs.records.aerosols.twin5572"""
import datetime as dt, json
import cv2
import numpy as np
from PIL import Image
from core.log import say
from svs import frames, validate as V
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import GRID_DEG, SID, TYPES
from .decode import classify, georef_check, key_colours
from .geosfp import fields
from .validate import SPECIES, to_cells

ROOT = raw_dir(SID)
TWIN = 5572
BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005572/"
FOLDER = BASE + "frames/6480x3240_2x1_30p/Aerosols/"
FRAMES = (27, 747, 1467, 2187)
START = dt.datetime(2024, 8, 1, tzinfo=dt.timezone.utc)
Image.MAX_IMAGE_PIXELS = None

def key_check(keys):
    fetch = Fetcher(raw_dir(TWIN) / "manifest.jsonl", tries=20)
    p = raw_dir(TWIN, "assets") / "Aerosols_cbar.png"; fetch.get(BASE + "Aerosols_cbar.png", p, expect_bytes=200_000)
    k = frames.read_rgba(p); rgb = k[..., :3].astype(int)
    m = ((rgb.max(-1) - rgb.min(-1) > 20) & (k[..., 3] > 250)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    big = [i for i in range(1, n) if st[i, 4] > 0.2 * st[1:, 4].max()]
    sw = [np.median(rgb[lab == i], 0) for i in big]
    return float(max(min(np.abs(s - np.array(v["rgb"])).max() for s in sw) for v in keys.values()))

def grids(cls, density, names):
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    out = {}
    for i, t in enumerate(names):
        m = cls == i
        share = cv2.resize(m.astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
        dens = cv2.resize(np.where(m, density, 0).astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
        out[t] = share * np.where(share > 0, dens / np.maximum(share, 1e-9), 0)
    return out

def main():
    keys = key_colours()
    diff = key_check(keys)
    fetch = Fetcher(raw_dir(TWIN) / "manifest.jsonl", tries=30)
    per_frame, pool_f, pool_m = [], {t: [] for t in TYPES}, {t: [] for t in TYPES}
    for k in FRAMES:
        name = f"Aerosols_6840x3240_30p_{k:04d}.png"
        p = raw_dir(TWIN, "frames") / name; fetch.get(FOLDER + name, p, expect_bytes=40_000_000)
        rgb = np.asarray(Image.open(p).convert("RGB"))
        when = START + dt.timedelta(minutes=30 * k)
        cls, density, floor, names = classify(rgb, keys)
        geo = georef_check(rgb)
        g = grids(cls, density, names)
        p.unlink()
        mf = fields(when)
        row = {"frame": k, "time": when.strftime("%Y-%m-%dT%H:%MZ"), "georef_precision": geo["precision"], "georef_best_is_assumed": geo["best_is_assumed"]}
        for t in TYPES:
            model = to_cells(sum(mf[v] for v in SPECIES[t]), mf["lat"], mf["lon"])
            rho, n = V.spearman(g[t], model)
            row[t] = {"spearman": rho, "n": n}
            ok = np.isfinite(g[t]) & np.isfinite(model)
            pool_f[t].append(g[t][ok]); pool_m[t].append(model[ok])
        per_frame.append(row)
        say(f"5572 frame {k} ({row['time']}): georef {geo['precision']:.3f}; " + ", ".join(f"{t} {row[t]['spearman']:.2f}" for t in TYPES))
    pooled = {t: dict(zip(("spearman", "n"), V.spearman(np.concatenate(pool_f[t]), np.concatenate(pool_m[t])))) for t in TYPES}
    out = {"key_max_rgb_difference_vs_5669": diff, "frames": per_frame, "pooled": pooled, "folder": FOLDER,
           "timing": "frame k = 2024-08-01T00:00Z + k × 30 min (assumed linear)"}
    (ROOT / "twin5572.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    say(f"5572 pooled vs GEOS-FP: {pooled}; key difference {diff:.0f}")

if __name__ == "__main__":
    main()
