"""4950, report correction 1 (fixed 30 Oct before any GEDI L2B file was read):
  bar      — the 0–50 m bar (bar_id.py: the stills' own scale matches the 0–50 m overlay, not 0–40 or 0–75);
  flat     — 'flat, unshaded' pixels only: exact-mode inversion within FLAT_DIST (RGB) of the colorbar, i.e. the colour is
             the colormap's own, with no lighting change (lit sides and shadows of the extruded columns drop out);
  georef   — each still's globe view fitted with svs/globe.py (circle, then perspective view by Natural Earth land IoU in
             the inner disc); the IoU is recorded per still.
Writes data_raw/4950/flat/<still>.npy (height in m, NaN elsewhere, float16) and data_raw/4950/flat.json.
Usage (from pipeline/): python -m svs.records.forest.flat"""
import json
import numpy as np
from core.log import say
from svs import colorbar, frames, globe
from svs.config import raw_dir
from svs.invert import DEFAULT, Inverter
from . import SID, STILLS
from .decode import OCEAN_MARGIN, SPACE_MAX, bar_region

ROOT = raw_dir(SID)
FLAT_DIST = 10.0

def masks(rgb):
    f = rgb.astype(np.int16); H, W = f.shape[:2]
    ocean = (f[..., 2] > f[..., 1] + OCEAN_MARGIN) & (f[..., 2] > f[..., 0] + OCEAN_MARGIN)
    nonspace = f.max(-1) > SPACE_MAX
    nonspace[int(0.75 * H):, :int(0.35 * W)] = False
    return nonspace, nonspace & ~ocean

def main():
    out = {}
    for name in STILLS:
        rgba = frames.read_rgba(ROOT / "assets" / name); rgb = rgba[..., :3]
        cb = colorbar.read(bar_region(rgba))
        nonspace, land = masks(rgb)
        d = globe.disc(nonspace)
        view, iou, info = globe.fit(land, d)
        val, _, res, k = Inverter(cb, mode="exact", method=DEFAULT).invert(rgb, FLAT_DIST)
        val[~land] = np.nan
        (ROOT / "flat").mkdir(exist_ok=True)
        np.save(ROOT / "flat" / name.replace(".tif", ".npy"), val.astype(np.float16))
        ok = np.isfinite(val)
        out[name] = {"disc": d, "view": {"lat0": view[0], "lon0": view[1], "roll": view[2], "distance_radii": view[3]}, "iou": iou, "fit": info,
                     "flat_pixels": int(ok.sum()), "land_pixels": int(land.sum()), "flat_share": float(ok.sum() / max(1, land.sum())),
                     "median_flat_m": float(np.nanmedian(val)) if ok.any() else None}
        say(f"4950 {name}: view {[round(x, 1) for x in view]} IoU {iou:.3f}; flat {ok.sum():,} px ({out[name]['flat_share']:.1%}), median {out[name]['median_flat_m']}")
    (ROOT / "flat.json").write_text(json.dumps({"flat_dist": FLAT_DIST, "bar": "0–50 m", "stills": out}, indent=1, default=float), encoding="utf-8")

if __name__ == "__main__":
    main()
