"""Decode 5313 (via 5276/5475) → data_raw/5313/grid.npz on a 0.1° grid. Fixed before any validation data was read:
  georef — the 5475 2:1 frame's land base map against Natural Earth (IoU, shifts): land = every pixel whose colour is
           more than max(6, 4 × the 99.9th-percentile spread) RGB units from the ocean colour (the median of DARK_BOX in
           the same frame), 5×5 majority (luminance Otsu missed the dark rainforest base map: 0.83); the lights-only still is the same equirectangular world stretched to 16:9: its brightness is cross-correlated with
           the 5475 frame's lights (frame minus its 15-px median) over ±3° shifts, and the peak must be at 0;
  lit    — a pixel is lit when its brightest channel exceeds twice the 99.9th percentile of DARK_BOX (the still's JPEG
           noise floor, read from the still), and at least 1;
  change — chroma-mode inversion against the 5276 strip (lights over black: colour = brightness × colorbar colour), only
           where brightness ≥ MIN_K = 0.1 (as for 3912: below it 8-bit rounding is amplified > 10×); max_dist = 3 × the
           99th-percentile residual of bright pixels (≥ 4 × MIN_K); value −1 … +1;
  cells  — per 0.1° cell: lit fraction, mean brightness (0–1, relative) and the brightness-weighted mean change.
Usage (from pipeline/): python -m svs.records.lights.decode"""
import json
import cv2
import numpy as np
from PIL import Image
from core.log import say
from svs import colorbar, frames, georef
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from . import BASE_5276, COLORBAR, DARK_BOX, FRAME_2X1, GRID_DEG, SID, STILL, STRONG

ROOT = raw_dir(SID)
MIN_K = 0.1
Image.MAX_IMAGE_PIXELS = None

def fetch(url, name):
    path = ROOT / "assets" / name
    entry = Fetcher(ROOT / "manifest.jsonl").get(url, path)
    return path, entry

def change_colorbar():
    """The strip as a relative scale: its labels are words, so −1 … +1 linear between the strip ends; the white point's
    position (no change) is measured and recorded."""
    path, _ = fetch(BASE_5276 + COLORBAR, COLORBAR)
    cb = colorbar.read(frames.read_rgba(path), stated_range=(-1.0, 1.0))
    white = int(np.argmin(cb.rgb.max(1) - cb.rgb.min(1)))
    cb.ticks = []
    cb.notes = [f"Labels are words ('lights out', 'no change', 'new lights'), no numbers: read as relative change, −1 (lights out) … "
                f"+1 (new lights), linear between the strip ends. The white point (no change) sits at {white / (cb.n - 1):.3f} of the strip."]
    cb.geometry["white_point_rel"] = white / (cb.n - 1)
    return cb

def georef_2x1():
    path, _ = fetch(FRAME_2X1, FRAME_2X1.rsplit("/", 1)[1])
    rgb = frames.read_rgba(path)[..., :3]
    H, W = rgb.shape[:2]
    f = rgb.astype(np.float32)
    ocean = np.median(f[box_px(DARK_BOX, W, H)].reshape(-1, 3), 0)
    d = np.linalg.norm(f - ocean, axis=-1)
    tol = max(6.0, 4 * float(np.percentile(d[box_px(DARK_BOX, W, H)], 99.9)))
    g = georef.verify(georef.majority(d > tol, 5))
    g.update(ocean_rgb=ocean.tolist(), land_tolerance_rgb=tol)
    return rgb, g

def still_alignment(still_k, frame_rgb, max_shift=6):
    """Cross-correlation (0.5° grid) of the still's brightness with the 2:1 frame's lights; peak must be at (0, 0)."""
    a = cv2.resize(still_k, (720, 360), interpolation=cv2.INTER_AREA)
    f = frame_rgb.max(-1); fb = np.clip(f.astype(np.float32) - cv2.medianBlur(f, 15), 0, None)
    b = cv2.resize(fb, (720, 360), interpolation=cv2.INTER_AREA)
    r = {(dy, dx): float(np.corrcoef(np.roll(np.roll(a, dy, 0), dx, 1).ravel(), b.ravel())[0, 1])
         for dy in range(-max_shift, max_shift + 1) for dx in range(-max_shift, max_shift + 1)}
    (dy, dx), best = max(r.items(), key=lambda kv: kv[1])
    return {"grid_deg": 0.5, "peak_shift_cells": [dy, dx], "r_at_peak": best, "r_at_zero": r[(0, 0)], "pass": (dy, dx) == (0, 0)}

def box_px(box, W, H):
    w, s, e, n = box
    return slice(int((90 - n) / 180 * H), int((90 - s) / 180 * H)), slice(int((w + 180) / 360 * W), int((e + 180) / 360 * W))

def cells(a, valid, gw, gh):
    s = cv2.resize(np.where(valid, a, 0).astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    f = cv2.resize(valid.astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(f > 0, s / f, np.nan), f

def still_image(rgb, val, res, max_dist, cb, name, box=(80, 15, 100, 30)):
    """frame | decoded change (colorbar colours, no light = dark grey) | confidence, for a box (default: Bengal region)."""
    H, W = val.shape
    ys, xs = box_px(box, W, H)
    pos = np.clip((val[ys, xs] + 1) / 2 * (cb.n - 1), 0, cb.n - 1)
    dec = np.where(np.isfinite(val[ys, xs])[..., None], cb.rgb[np.nan_to_num(pos).astype(int)], 40).astype(np.uint8)
    conf = np.where(np.isfinite(val[ys, xs]), np.clip(255 - res[ys, xs] * 255 / max_dist, 0, 255), 0).astype(np.uint8)
    row = np.concatenate([rgb[ys, xs], dec, np.repeat(conf[..., None], 3, -1)], 1)
    (ROOT / "stills").mkdir(exist_ok=True)
    Image.fromarray(row).save(ROOT / "stills" / name)

def main():
    cb = change_colorbar()
    frame_rgb, geo = georef_2x1()
    path, still_entry = fetch(BASE_5276 + STILL, STILL)
    rgb = np.asarray(Image.open(path).convert("RGB"))
    H, W = rgb.shape[:2]
    k = rgb.max(-1).astype(np.float32)
    align = still_alignment(k, frame_rgb)
    floor = float(np.percentile(k[box_px(DARK_BOX, W, H)], 99.9))
    lit_thr = max(2 * floor, 1.0)
    inv = Inverter(cb, mode="chroma", method=DEFAULT)
    val, pos, res, kb = inv.invert(rgb, 255.0, min_k=MIN_K)
    bright = k >= 4 * MIN_K * 255
    max_dist = float(3 * np.percentile(res[bright & np.isfinite(res)], 99))
    val[(res > max_dist) | (k < MIN_K * 255)] = np.nan
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    lit = k >= lit_thr
    change, dec_frac = cells(val * k, np.isfinite(val), gw, gh)
    weight, _ = cells(k, np.isfinite(val), gw, gh)
    change = change / weight
    brightness, _ = cells(k / 255, np.ones_like(lit), gw, gh)
    lit_frac, _ = cells(lit.astype(np.float32), np.ones_like(lit), gw, gh)
    np.savez_compressed(ROOT / "grid.npz", change=change.astype(np.float32), brightness=brightness.astype(np.float32),
                        lit_frac=lit_frac.astype(np.float32), decoded_frac=dec_frac.astype(np.float32), grid_deg=GRID_DEG)
    still_image(rgb, val, res, max_dist, cb, "5313_bengal.png")
    still_image(rgb, val, res, max_dist, cb, "5313_europe.png", box=(-10, 40, 20, 55))
    meta = {"colorbar": cb.summary(), "georef_2x1": geo, "still_alignment": align, "still_size": [W, H], "still": still_entry,
            "noise_floor_k": floor, "lit_threshold_k": lit_thr, "min_k": MIN_K, "max_dist": max_dist, "matcher": DEFAULT, "mode": "chroma",
            "lit_pixels": float(lit.mean()), "decoded_of_lit": float(np.isfinite(val)[lit].mean()),
            "strong_cells": int((np.abs(change) >= STRONG).sum()), "uncertain_values": [float(x) for x in cb.value_at(inv.uncertain(tol=5))]}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    say(f"5313: georef IoU {geo['iou']:.3f} (pass {geo['pass']}); still alignment {align}; lit {meta['lit_pixels']:.2%}, "
        f"decoded {meta['decoded_of_lit']:.1%} of lit; noise floor {floor:.1f}; max_dist {max_dist:.1f}")

if __name__ == "__main__":
    main()
