"""Decode 4950's global-view stills (3840×2160, colorbar burned in). Fixed before the GEDI L3 file was read:
  colorbar — read from the frame itself (svs/colorbar.py on the bottom-left quarter: strip, tick marks, OCR labels, px/m);
  globe    — the disc is everything brighter than the black of space; ocean = blue-dominant pixels (B > G + OCEAN_MARGIN and
             B > R + OCEAN_MARGIN); the colorbar quarter and the title are excluded;
  height   — chroma-mode inversion (the globe is lit, so brightness varies with the light, not with height) with the
             toolkit's default matcher; pixels whose residual exceeds MAX_DIST stay undecoded;
  output   — the height histogram (1 m bins, 0–COLORBAR_MAX) of every decoded vegetation pixel per still, and stills
             (frame | decoded | confidence). Globe view: georef 'none' (no per-pixel location).
Usage (from pipeline/): python -m svs.records.forest.decode"""
import json
import numpy as np
from PIL import Image
from core.log import say
from svs import colorbar, frames
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from . import BASE, SID, STILLS

ROOT = raw_dir(SID)
OCEAN_MARGIN, SPACE_MAX, MAX_DIST, MIN_K = 20, 12, 12.0, 0.1
Image.MAX_IMAGE_PIXELS = None

def bar_region(rgba):
    H, W = rgba.shape[:2]
    return rgba[int(0.75 * H):, :int(0.35 * W)]

def main():
    fetch = Fetcher(ROOT / "manifest.jsonl", tries=20)
    hist, per_still, cbs = None, {}, []
    for name in STILLS:
        path = ROOT / "assets" / name
        fetch.get(BASE + name, path, expect_bytes=5_000_000)
        rgba = frames.read_rgba(path)
        cb = colorbar.read(bar_region(rgba)); cbs.append(cb.summary())
        rgb = rgba[..., :3]
        H, W = rgb.shape[:2]
        f = rgb.astype(np.int16)
        ocean = (f[..., 2] > f[..., 1] + OCEAN_MARGIN) & (f[..., 2] > f[..., 0] + OCEAN_MARGIN)
        space = f.max(-1) <= SPACE_MAX
        keep = ~ocean & ~space
        keep[int(0.75 * H):, :int(0.35 * W)] = False
        inv = Inverter(cb, mode="chroma", method=DEFAULT)
        val, pos, res, k = inv.invert(rgb, MAX_DIST, min_k=MIN_K)
        val[~keep] = np.nan
        lo, hi = cb.summary()["value_range"]
        h, edges = np.histogram(val[np.isfinite(val)], bins=np.arange(0, np.ceil(hi) + 1, 1.0))
        hist = h if hist is None else hist + h
        per_still[name] = {"decoded_pixels": int(np.isfinite(val).sum()), "globe_land_pixels": int(keep.sum()),
                           "median_m": float(np.nanmedian(val)), "p90_m": float(np.nanpercentile(val, 90))}
        dec = np.where(np.isfinite(val)[..., None], cb.rgb[np.clip(np.nan_to_num(pos), 0, cb.n - 1).astype(int)], 30).astype(np.uint8)
        conf = np.where(np.isfinite(val), np.clip(255 - res * 255 / MAX_DIST, 0, 255), 0).astype(np.uint8)
        row = np.concatenate([rgb, dec, np.repeat(conf[..., None], 3, -1)], 1)
        (ROOT / "stills").mkdir(exist_ok=True)
        Image.fromarray(row).resize((row.shape[1] // 4, row.shape[0] // 4), Image.LANCZOS).save(ROOT / "stills" / name.replace(".tif", ".png"))
        say(f"4950 {name}: ticks {[t['text'] for t in cb.ticks]}, {cb.summary().get('px_per_unit', 0):.2f} px/m; decoded {per_still[name]}")
    np.savez_compressed(ROOT / "hist.npz", counts=hist, edges=edges)
    meta = {"stills": per_still, "colorbars": cbs, "matcher": DEFAULT, "mode": "chroma", "max_dist": MAX_DIST, "min_k": MIN_K,
            "ocean_margin": OCEAN_MARGIN, "space_max": SPACE_MAX}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")

if __name__ == "__main__":
    main()
