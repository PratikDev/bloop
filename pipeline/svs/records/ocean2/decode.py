"""Decode 5425's three current views. Fixed before any MUR/SMAP file was read:
  views   — the camera holds found by probe.py (consecutive land-mask silhouettes correlating ≥ HOLD_R), named by eye from
            the silhouette (Japan → Kuroshio, southern Africa → Agulhas, US east coast → Gulf Stream; recorded in HOLDS);
  frames  — VIEW_FRAMES per hold (its first and last frame; for the Kuroshio frame 6650, already fetched, replaces 6250
            when SVS served ≈ 20 KB/s on 29 Oct 2026); dates by linear interpolation between the 77 OCR'd probe dates;
  values  — each layer inverted against its own colorbar (colorbar.read_labelled_strip): exact mode when ≥ 50 % of ocean
            pixels lie within MAX_DIST of the strip, chroma mode otherwise; ocean = land-mask dark and not black space;
  output  — per frame and layer: the mean, median and coverage over the visible ocean (no georeference: the views are
            perspective camera shots, so the comparison is regional), and a 480×270 picture-space grid (rows/<frame>_<layer>.npy).
            Raw frames are deleted after reading.
Usage (from pipeline/): python -m svs.records.ocean2.decode [--grid <frame>]"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import colorbar, frames
from svs.config import raw_dir
from svs.fetch import Fetcher
from svs.invert import DEFAULT, Inverter
from . import BASE, COLORBARS, SID
from .probe import listing

ROOT = raw_dir(SID)
HOLDS = {"Kuroshio": (6250, 7250), "Agulhas": (9250, 10250), "Gulf Stream": (13250, 15750)}   # frames; see the docstring
HOLD_R, MAX_DIST = 0.8, 12.0
VIEW_FRAMES = {"Kuroshio": (6650, 7250), "Agulhas": (9250, 10250), "Gulf Stream": (13250, 15750)}

def frame_date(n):
    probe = json.loads((ROOT / "probe.json").read_text(encoding="utf-8"))
    fx = np.array([p["frame"] for p in probe if p["date"]], float)
    fy = np.array([dt.datetime.fromisoformat(p["date"]).replace(tzinfo=dt.timezone.utc).timestamp() for p in probe if p["date"]])
    return dt.datetime.fromtimestamp(float(np.interp(n, fx, fy)), dt.timezone.utc)

GRID = (480, 270)

def decode_layer(rgb, ocean, cb, save=None):
    exact = Inverter(cb, mode="exact", method=DEFAULT)
    v, _, res, _ = exact.invert(rgb, MAX_DIST)
    share = float(np.isfinite(v)[ocean].mean())
    mode = "exact"
    if share < 0.5:
        v, _, res, _ = Inverter(cb, mode="chroma", method=DEFAULT).invert(rgb, MAX_DIST, min_k=0.1); mode = "chroma"
    v[~ocean] = np.nan
    ok = np.isfinite(v)
    if save is not None:                                      # the picture-space grid (cell means of decoded pixels)
        import cv2
        s_ = cv2.resize(np.where(ok, v, 0).astype(np.float32), GRID, interpolation=cv2.INTER_AREA)
        n_ = cv2.resize(ok.astype(np.float32), GRID, interpolation=cv2.INTER_AREA)
        np.save(save, np.where(n_ > 0.05, s_ / np.maximum(n_, 1e-9), np.nan).astype(np.float32))
    return {"mean": float(np.nanmean(v)) if ok.any() else None, "median": float(np.nanmedian(v)) if ok.any() else None,
            "coverage": float(ok[ocean].mean()) if ocean.any() else 0.0, "mode": mode, "exact_share": share}

def main():
    fetch = Fetcher(ROOT / "manifest.jsonl", tries=30)
    bars = {}
    for k, n in COLORBARS.items():
        p = ROOT / "assets" / n; fetch.get(BASE + n, p, expect_bytes=1_000_000)
        bars[k] = colorbar.read_labelled_strip(frames.read_rgba(p))
    lists = {k: listing(k) for k in ("temperature", "salinity", "land_mask")}
    out = {}
    for view, picks in VIEW_FRAMES.items():
        rows = []
        for n in picks:
            cache = ROOT / "rows" / f"{n}.json"
            if cache.exists():                                 # decoded before grids were saved: its regional means stand
                rows.append(json.loads(cache.read_text(encoding="utf-8"))); continue
            row = {"frame": int(n), "date": frame_date(n).strftime("%Y-%m-%d")}
            paths = {}
            for k, files in lists.items():
                paths[k] = ROOT / "frames" / files[n]["name"]; fetch.get(files[n]["url"], paths[k], expect_bytes=40_000_000)
            land = frames.read_rgba(paths["land_mask"])[..., :3].max(-1) > 127
            for k in ("temperature", "salinity"):
                rgb = frames.read_rgba(paths[k])[..., :3]
                ocean = ~land & (rgb.max(-1) > 8)
                (ROOT / "rows").mkdir(exist_ok=True)
                row[k] = decode_layer(rgb, ocean, bars[k], save=ROOT / "rows" / f"{n}_{k}.npy")
            for p in paths.values(): p.unlink()
            cache.parent.mkdir(exist_ok=True); cache.write_text(json.dumps(row), encoding="utf-8")
            rows.append(row)
            say(f"5425 {view} frame {n} ({row['date']}): T {row['temperature']['mean']}, S {row['salinity']['mean']}")
        out[view] = rows
    meta = {"views": out, "holds": HOLDS, "view_frames": VIEW_FRAMES, "max_dist": MAX_DIST, "matcher": DEFAULT,
            "colorbars": {k: cb.summary() for k, cb in bars.items()}}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")

def grid_only(n):
    """The picture-space grids for one already-decoded frame (its regional numbers stay as cached)."""
    fetch = Fetcher(ROOT / "manifest.jsonl", tries=30)
    bars = {}
    for k, name in COLORBARS.items():
        bars[k] = colorbar.read_labelled_strip(frames.read_rgba(ROOT / "assets" / name))
    paths = {}
    for k in ("temperature", "salinity", "land_mask"):
        f = listing(k)[n]; paths[k] = ROOT / "frames" / f["name"]; fetch.get(f["url"], paths[k], expect_bytes=40_000_000)
    land = frames.read_rgba(paths["land_mask"])[..., :3].max(-1) > 127
    for k in ("temperature", "salinity"):
        rgb = frames.read_rgba(paths[k])[..., :3]
        decode_layer(rgb, ~land & (rgb.max(-1) > 8), bars[k], save=ROOT / "rows" / f"{n}_{k}.npy")
    for q in paths.values(): q.unlink()
    say(f"5425 grids for frame {n}")

if __name__ == "__main__":
    import sys
    if "--grid" in sys.argv: grid_only(int(sys.argv[sys.argv.index("--grid") + 1]))
    else: main()
