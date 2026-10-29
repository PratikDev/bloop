"""Decode 4960: N_FRAMES main frames (3840×2160 EXR) evenly over the movie, each with its date-only frame (OCR, as tested
on 20 frames by svs/ocr_dates_check.py). Fixed before any MERRA-2 file was read:
  transport — the blue shading is water vapour transport with no colorbar: relative transport = (B − R) / 255, clipped 0–1
              (teal = low, bright blue = high; the grey ocean is ≈ 0);
  river     — Otsu threshold of the relative transport over pixels above TINT (the shading itself); area, mean width
              (2 × the median distance-transform value) and length ≈ area / width (px);
  landfall  — land = green-dominant saturated pixels (G > B, G > R, saturation ≥ 0.25); contact = land pixels within 5 px of
              the river mask (px);
  grid      — relative transport per cell of a 480×270 picture grid (no georeference: perspective 3D view).
Writes data_raw/4960/frames.json and grids.npz; frames are deleted after reading.
Usage (from pipeline/): python -m svs.records.river.decode"""
import json
import cv2
import numpy as np
from core.log import say
from svs import frames, ocr_dates, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import DATES, FRAMES, N_FRAMES, SID

ROOT = raw_dir(SID)
TINT, GRID = 0.15, (480, 270)

def listing(url):
    return {frames.frame_number(f["name"]): f for f in svs_api.list_folder(url)["files"]}

def measure(rgb):
    f = rgb.astype(np.float32)
    t = np.clip((f[..., 2] - f[..., 0]) / 255, 0, 1)
    tint = t > TINT
    thr, _ = cv2.threshold((t[tint] * 255).astype(np.uint8).reshape(-1, 1), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU) if tint.any() else (255, None)
    river = (t * 255 >= thr) & tint
    dist = cv2.distanceTransform(river.astype(np.uint8), cv2.DIST_L2, 5)
    width = 2 * float(np.median(dist[river])) if river.any() else 0.0
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    land = (f[..., 1] > f[..., 2]) & (f[..., 1] > f[..., 0]) & (hsv[..., 1] >= 64)
    contact = land & cv2.dilate(river.astype(np.uint8), np.ones((11, 11), np.uint8)).astype(bool)
    grid = cv2.resize(t, GRID, interpolation=cv2.INTER_AREA)
    return grid, {"river_px": int(river.sum()), "width_px": width, "length_px": float(river.sum() / width) if width else 0.0,
                  "contact_px": int(contact.sum()), "mean_transport": float(t[tint].mean()) if tint.any() else 0.0, "otsu": float(thr) / 255}

def main():
    main_f, date_f = listing(FRAMES), listing(DATES)
    nums = sorted(set(main_f) & set(date_f))
    pick = [nums[int(round(i))] for i in np.linspace(0, len(nums) - 1, N_FRAMES)]
    fetch = Fetcher(ROOT / "manifest.jsonl", tries=30)
    rows, grids = [], []
    for n in pick:
        pd = ROOT / "frames" / date_f[n]["name"]; fetch.get(date_f[n]["url"], pd, expect_bytes=1_000_000)
        r = ocr_dates.read_date(frames.read_rgba(pd)[..., :3].max(-1).astype(np.float32) / 255); pd.unlink()
        pm = ROOT / "frames" / main_f[n]["name"]; fetch.get(main_f[n]["url"], pm, expect_bytes=20_000_000)
        grid, m = measure(frames.read_rgba(pm)[..., :3]); pm.unlink()
        rows.append({"frame": n, "date_text": r["text"], "time": r["datetime"].strftime("%Y-%m-%dT%H:%MZ") if r["datetime"] else None, **m})
        grids.append(grid.astype(np.float32))
        say(f"4960 frame {n}: {r['text']}; river {m['river_px']} px, contact {m['contact_px']} px")
    np.savez_compressed(ROOT / "grids.npz", transport=np.stack(grids), frames=np.array(pick))
    (ROOT / "frames.json").write_text(json.dumps({"rows": rows, "tint": TINT, "grid": list(GRID)}, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
