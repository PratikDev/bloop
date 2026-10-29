"""Decode 3912's daily frames → 0.5° daily grids in data_raw/3912/grids.npz (validation + export read these).
Fixed before any validation data was read (frame and colorbar colours only):
  SST     — hue-mode inversion: the render's streak colours are the colorbar's colours with the grey floor removed and
            dimmed (frame lowest channel 0 where the colorbar image's is 25–60; chroma mode left residuals of 26–70 RGB
            units, hue mode leaves 0.9 median / 2.8 p99 in every 4 °C band of frame 23000). max_dist 10 (> 3× p99);
            chroma ≥ MIN_K = 0.1 (below it 8-bit rounding is amplified > 10×); between streaks stays NaN;
  land    — grey relief pixels (saturation < 0.1, 0.10 < value < 0.35), 5×5 majority;
  motion  — Farnebäck (flow.FARNEBACK) between consecutive daily frames (24.75 h) = pattern drift; structure-tensor
            streak axis (σ 2 px) weighted by coherence.
Two stills (frame | decoded SST | confidence) are written to data_raw/3912/stills/ before the raw frames are deleted.
Usage (from pipeline/): python -m svs.records.currents.decode [--keep-frames] [--limit=N]   (--limit implies --keep-frames)"""
import json, sys
import cv2
import numpy as np
from PIL import Image
from core.log import say
from svs import choose, colorbar, flow, frames, georef, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from . import SID, STEP

ROOT = raw_dir(SID)
MODE, MAX_DIST, MIN_K, GRID_DEG = "hue", 10.0, 0.1, 0.5

def land_mask(rgb):
    hsv = cv2.cvtColor(np.ascontiguousarray(rgb), cv2.COLOR_RGB2HSV).astype(np.float32)
    s, v = hsv[..., 1] / 255, hsv[..., 2] / 255
    return georef.majority((s < 0.1) & (v > 0.10) & (v < 0.35), 5)

def cell_mean(values, valid, gw, gh):
    """Mean of values over valid pixels per cell, and the valid fraction."""
    v = np.where(valid, values, 0).astype(np.float32)
    s = cv2.resize(v, (gw, gh), interpolation=cv2.INTER_AREA)
    f = cv2.resize(valid.astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(f > 0, s / f, np.nan), f

def colorbar_3912():
    choice = choose.choose(svs_api.fetch_record(SID))
    bar = choice["colorbars"]["orig"]
    path = ROOT / bar["filename"]
    e = Fetcher(ROOT / "manifest.jsonl").get(bar["url"], path, expect_bytes=50_000)
    stated = (0.0, 32.0)                         # SVS caption: "blue is 0 degrees C … red is 32 degrees C" (cross-check)
    return colorbar.read(frames.read_rgba(path), stated_range=stated), e

def still(rgb, sst, res, name, cb):
    """frame | decoded SST (same colours, NaN = dark grey) | residual (confidence) — for the checkpoint report."""
    H, W = sst.shape
    pos = np.clip((sst - cb.fit["a"]) / cb.fit["b"], 0, cb.n - 1)
    dec = np.where(np.isfinite(sst)[..., None], cb.rgb[np.nan_to_num(pos).astype(int)], 40).astype(np.uint8)
    conf = np.clip(255 - res * 255 / MAX_DIST, 0, 255).astype(np.uint8)
    conf = np.where(np.isfinite(sst), conf, 0)
    row = np.concatenate([rgb, dec, np.repeat(conf[..., None], 3, -1)], 1)
    (ROOT / "stills").mkdir(exist_ok=True)
    Image.fromarray(row).resize((row.shape[1] // 2, row.shape[0] // 2), Image.LANCZOS).save(ROOT / "stills" / name)

def main():
    limit = next((int(a.split("=")[1]) for a in sys.argv if a.startswith("--limit=")), None)
    keep = "--keep-frames" in sys.argv or limit is not None
    cb, bar_entry = colorbar_3912()
    inv = Inverter(cb, mode=MODE, method=DEFAULT)
    times = frames.times_from_list((ROOT / "dates.txt").read_text(encoding="utf-8"))
    files = sorted((ROOT / "frames").glob("*.tif"), key=lambda p: frames.frame_number(p.name))[:limit]
    nums = [frames.frame_number(p.name) for p in files]
    T = len(files)
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    out = {k: np.full((T, gh, gw), np.nan, np.float32) for k in
           ("sst", "sst_cov", "ocean_frac", "drift_u", "drift_v", "axis_c2", "axis_s2", "axis_w")}
    georefs, prev, coverage = {}, None, []
    still_at = {0, T // 2}
    for k, p in enumerate(files):
        rgb = frames.read_rgba(p)[..., :3]
        H, W = rgb.shape[:2]
        land = land_mask(rgb)
        if k in still_at: georefs[nums[k]] = georef.verify(land)
        sst, _, res, kb = inv.invert(rgb, MAX_DIST, min_k=MIN_K)
        sst[land] = np.nan
        ocean = ~land
        coverage.append(float(np.isfinite(sst)[ocean].mean()))
        out["sst"][k], out["sst_cov"][k] = cell_mean(sst, np.isfinite(sst), gw, gh)
        out["ocean_frac"][k] = cell_mean(ocean.astype(np.float32), np.ones_like(ocean), gw, gh)[0]
        axis, coh = flow.streak_axis(rgb)
        a2 = np.radians(axis * 2); w = np.where(ocean, coh, 0).astype(np.float32)
        out["axis_c2"][k], _ = cell_mean(np.cos(a2) * w, ocean, gw, gh)
        out["axis_s2"][k], _ = cell_mean(np.sin(a2) * w, ocean, gw, gh)
        out["axis_w"][k], _ = cell_mean(w, ocean, gw, gh)
        if prev is not None:
            dt_h = (times[nums[k]] - times[nums[k - 1]]).total_seconds() / 3600
            u, v = flow.to_velocity(flow.farneback(prev, rgb), dt_h)
            both = ocean & prev_ocean
            out["drift_u"][k - 1], _ = cell_mean(u, both, gw, gh)        # drift k-1 → k, stamped at k-1
            out["drift_v"][k - 1], _ = cell_mean(v, both, gw, gh)
        if k in still_at: still(rgb, sst, res, f"3912_{nums[k]}.png", cb)
        prev, prev_ocean = rgb, ocean
        if not keep: (p.parent / f"{p.name}.done").touch()
        if k % 25 == 0: say(f"3912 decode {k + 1}/{T}: {times[nums[k]]:%Y-%m-%d %H:%M}, streak coverage {coverage[-1]:.1%}")
    np.savez_compressed(ROOT / "grids.npz", times=np.array([times[n].strftime("%Y-%m-%dT%H:%M:%SZ") for n in nums]),
                        frame_numbers=np.array(nums), grid_deg=GRID_DEG, coverage=np.array(coverage), **out)
    meta = {"colorbar": cb.summary(), "colorbar_entry": bar_entry, "georef": georefs, "matcher": DEFAULT, "mode": MODE,
            "max_dist": MAX_DIST, "min_k": MIN_K, "uncertain_values": [float(x) for x in cb.value_at(inv.uncertain(tol=5))],
            "frames": T, "step": STEP, "coverage_median": float(np.median(coverage)),
            "coverage_range": [float(np.min(coverage)), float(np.max(coverage))], "farneback": flow.FARNEBACK}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    if not keep:
        for p in files: p.unlink()
    say(f"3912 decoded {T} frames; streak coverage median {meta['coverage_median']:.1%}; georef {[(n, round(g['iou'], 4)) for n, g in georefs.items()]}")

if __name__ == "__main__":
    main()
