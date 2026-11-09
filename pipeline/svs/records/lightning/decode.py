"""Decode 5011's SOS movie (4096×2048, 60 fps) by streaming every frame through ffmpeg (no frames on disk). Fixed before
any ISS LIS file was read:
  marks    — a pixel is drawn lightning when min(R, G) − B > YELLOW (the base map is grey, so this is 0 there; the frame's
             own 99.9th percentile outside marks is 55); marks fade out over a fixed number of frames (measured below);
  counting — a flash is counted once, when its mark appears: connected components of pixels lit now and not lit (within
             2 px) in the previous frame; area AREA_MIN–AREA_MAX px (larger = merged clusters, counted by area / median);
  georef   — on frame 100 (before any mark): (1) the drawn equator and tropic lines' rows vs where an equirectangular map
             puts 0° and ±23.44°; (2) the frame's edges cross-correlated with Natural Earth coastline edges over ±4° / ±1°
             (peak must be at 0, 0); (3) IoU of a texture land mask (the base map is Natural Earth Gray Earth with flat water:
             land = local texture or brighter than its row's water; luminance Otsu picked the coverage band instead, 0.26);
  seasons  — the marks' mean latitude per frame (every 10th frame), for the frame-time model (timing.py).
Writes data_raw/5011/marks.npz (frame, x, y, area per new mark), decode.json and two stills.
Usage (from pipeline/): python -m svs.records.lightning.decode [--georef]  (--georef: redo only the georeference check)"""
import json
import cv2
import numpy as np
from PIL import Image
from core.log import say
from svs import frames, georef
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import MOVIE, SID

ROOT = raw_dir(SID)
YELLOW, AREA_MIN, AREA_MAX, LIFETIME_FRAMES_SAMPLE = 60, 3, 200, (3000, 100)

def movie_path():
    path = ROOT / "movie" / MOVIE.rsplit("/", 1)[1]
    entry = Fetcher(ROOT / "manifest.jsonl").get(MOVIE, path, expect_bytes=300_000_000)
    return path, entry

def mark_mask(rgb):
    f = rgb.astype(np.int16)
    return (np.minimum(f[..., 0], f[..., 1]) - f[..., 2]) > YELLOW

TROPIC = 23.44

def georef_check(path, frame=100):
    from scipy.signal import find_peaks
    rgb = next(frames.movie_frames(path, start=frame, count=1, size=(2048, 1024)))[1]
    lum = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32); H, W = lum.shape
    pac = lum[:, int(10 / 360 * W):int(60 / 360 * W)].mean(1)                   # open Pacific, 170°–120° W
    prof = pac - cv2.blur(pac[:, None], (1, 31))[:, 0]
    pk, pr = find_peaks(prof, prominence=2)
    rows = np.sort(pk[np.argsort(pr["prominences"])[-3:]]) if len(pk) >= 3 else pk
    lines = (90 - (rows + 0.5) * 180 / H).tolist()
    g = np.hypot(cv2.Sobel(lum, cv2.CV_32F, 1, 0), cv2.Sobel(lum, cv2.CV_32F, 0, 1)); g -= g.mean()
    ne = georef.rasterise_land(W, H).astype(np.float32)
    e = cv2.GaussianBlur(cv2.morphologyEx(ne, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)), (0, 0), 1.5)
    score = {(dx, dy): float((np.roll(np.roll(e, dy, 0), dx, 1) * g).sum()) for dx in range(-23, 24) for dy in range(-6, 7)}
    peak = max(score, key=score.get)
    mode = np.array([np.bincount(r.astype(int), minlength=256).argmax() for r in lum])
    mu = cv2.blur(lum, (5, 5)); sd = np.sqrt(np.maximum(cv2.blur(lum * lum, (5, 5)) - mu * mu, 0))
    land = georef.majority((sd > 0.6) | (np.abs(lum - mode[:, None]) > 3), 9)
    land = cv2.morphologyEx(land.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)).astype(bool)
    v = georef.verify(land)
    expected = [TROPIC, 0.0, -TROPIC]
    return {**v, "graticule_lat": lines, "graticule_expected": expected,
            "graticule_max_error_deg": float(max(abs(a - b) for a, b in zip(lines, expected))) if len(lines) == 3 else None,
            "coast_edge_peak_px": list(peak), "coast_edge_px_deg": 360 / W, "frame": frame,
            "pass": bool(len(lines) == 3 and max(abs(a - b) for a, b in zip(lines, expected)) < 0.25 and peak == (0, 0)),
            "pass_rule": "graticule within 0.25° and coastline-edge peak at (0, 0); the IoU is reported, not used"}

def lifetimes(path):
    """Frames an isolated new mark stays lit (the window length in frames)."""
    start, n = LIFETIME_FRAMES_SAMPLE
    masks = [mark_mask(f).astype(np.uint8) for _, f in frames.movie_frames(path, start=start, count=n)]
    out = []
    for k in range(1, n // 3):
        new = masks[k] & (1 - cv2.dilate(masks[k - 1], np.ones((5, 5), np.uint8)))
        nb, _, st, cen = cv2.connectedComponentsWithStats(new, connectivity=8)
        for i in range(1, nb):
            if not AREA_MIN <= st[i, 4] <= 60: continue
            x, y = int(cen[i][0]), int(cen[i][1])
            if masks[k - 1][max(0, y - 6):y + 7, max(0, x - 6):x + 7].any(): continue
            L = next((j - k for j in range(k, n) if not masks[j][y, x]), None)
            if L is not None: out.append(L)
    return np.array(out)

def main():
    path, entry = movie_path()
    info = frames.probe_movie(path)
    W, H = info["width"], info["height"]
    lat_px = 90 - (np.arange(H) + 0.5) * 180 / H
    rows, cent, prev, kernel, areas = [], [], None, np.ones((5, 5), np.uint8), []
    for n, rgb in frames.movie_frames(path):
        m = mark_mask(rgb).astype(np.uint8)
        if n % 10 == 0:
            w = m.sum(1).astype(float); cent.append((n, float((w * lat_px).sum() / max(w.sum(), 1)), float(w.sum())))
        if prev is not None:
            new = m & (1 - cv2.dilate(prev, kernel))
            nb, _, st, cen = cv2.connectedComponentsWithStats(new, connectivity=8)
            for i in range(1, nb):
                if st[i, 4] >= AREA_MIN: rows.append((n, cen[i][0], cen[i][1], st[i, 4]))
        if n == 3000: Image.fromarray(rgb).resize((W // 2, H // 2)).save(raw_dir(SID, "stills") / "5011_frame3000.png")
        prev = m
        if n % 500 == 0: say(f"5011 frame {n}/{info['frames']}: {len(rows)} new marks so far")
    a = np.array(rows, np.float64)
    single = a[(a[:, 3] >= AREA_MIN) & (a[:, 3] <= AREA_MAX)]
    life = lifetimes(path)
    np.savez_compressed(ROOT / "marks.npz", frame=a[:, 0].astype(np.int32), x=a[:, 1].astype(np.float32), y=a[:, 2].astype(np.float32),
                        area=a[:, 3].astype(np.int32), centroid=np.array(cent))
    meta = {"movie": entry, "probe": info, "yellow": YELLOW, "area_min": AREA_MIN, "area_max": AREA_MAX, "georef": georef_check(path),
            "marks": int(len(a)), "median_mark_area": float(np.median(single[:, 3])), "merged_share": float(np.mean(a[:, 3] > AREA_MAX)),
            "lifetime_frames": {"n": int(len(life)), "p25": float(np.percentile(life, 25)), "median": float(np.median(life)),
                                "p75": float(np.percentile(life, 75)), "sample": list(LIFETIME_FRAMES_SAMPLE)}}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    say(f"5011: {len(a)} new marks; georef {meta['georef']['pass']} (IoU {meta['georef']['iou']:.3f}); lifetime median {meta['lifetime_frames']['median']} frames")

def regeoref():
    """Recompute only the georeference check into decode.json (the marks are unchanged)."""
    path, _ = movie_path()
    meta = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    meta["georef"] = georef_check(path)
    meta.pop("land_lum_threshold", None)
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    say(f"5011 georef: {meta['georef']['pass']}; lines {meta['georef']['graticule_lat']}; peak {meta['georef']['coast_edge_peak_px']}; IoU {meta['georef']['iou']:.3f}")

if __name__ == "__main__":
    import sys
    regeoref() if "--georef" in sys.argv else main()
