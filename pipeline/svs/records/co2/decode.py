"""Decode 5436's CO2 volume frames (8192×4096 EXR, premultiplied linear RGBA, no background) → data_raw/5436/grids.npz.
Fixed before the context data were read:
  colour  — un-premultiply (rgb / α where α ≥ ALPHA_MIN), divide by the brightest channel (the render's lighting scales
            brightness, up to 3.7× in linear light), encode sRGB, and match in chroma mode against the colour transfer
            function (transfer.py); value = ppm along the view, opacity-weighted (a volume render averages the column);
  cells   — per 0.5° cell: α-weighted mean ppm, mean α (confidence);
  plume   — pixels at or above PLUME ppm = the lowest ppm whose opacity reaches 0.95 (the fully opaque part of the
            transfer function): area (km², cos-latitude) and edge length (km) per frame, on a 2048×1024 grid;
  georef  — the surface layer's first frame (Blue Marble, same SOS projection): land = pixels away from its own ocean
            colour (median of an open-ocean box), 5×5 majority, IoU vs Natural Earth with shifted bounds;
  dates   — dyamond_timestamps.txt: line n is frame n (method a).
Usage (from pipeline/): python -m svs.records.co2.decode"""
import datetime as dt, json
import cv2
import numpy as np
from core.log import say
from svs import georef
from svs.config import raw_dir
from svs.invert import DEFAULT, Inverter
from svs.records.lights.decode import box_px
from svs.frames import frame_number
from . import ALT, GRID_DEG, SID
from .transfer import read as read_transfer

ROOT = raw_dir(ALT)
ALPHA_MIN, MAX_DIST, PLUME_GRID = 0.05, 20.0, (2048, 1024)
OCEAN_BOX = (-150, -40, -130, -20)
EARTH_KM = 6371.0

def srgb(v):
    v = np.clip(v, 0, 1)
    return np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)

def colours(exr):
    a = cv2.imread(str(exr), cv2.IMREAD_UNCHANGED).astype(np.float32)
    return colours_of(a[..., [2, 1, 0]], a[..., 3])

def colours_of(rgb, al):
    """Premultiplied linear RGB + alpha → (sRGB uint8 of the brightness-normalised colour, alpha, decodable mask)."""
    ok = al >= ALPHA_MIN
    un = np.where(ok[..., None], rgb / np.maximum(al, 1e-6)[..., None], 0)
    norm = un / np.maximum(un.max(-1, keepdims=True), 1e-9)
    return (srgb(norm) * 255).round().astype(np.uint8), al, ok

def dates():
    lines = (ROOT / "assets" / "dyamond_timestamps.txt").read_text(encoding="utf-8").splitlines()
    return {i + 1: dt.datetime.strptime(l.strip(), "%b %d, %Y").replace(tzinfo=dt.timezone.utc) for i, l in enumerate(lines) if l.strip()}

def georef_surface():
    p = sorted((ROOT / "surface").glob("*.exr"))[0]
    a = cv2.imread(str(p), cv2.IMREAD_UNCHANGED).astype(np.float32)[..., [2, 1, 0]]
    rgb = (srgb(cv2.resize(a, (2048, 1024), interpolation=cv2.INTER_AREA)) * 255).astype(np.float32)
    ys, xs = box_px(OCEAN_BOX, 2048, 1024)
    ocean = np.median(rgb[ys, xs].reshape(-1, 3), 0)
    d = np.linalg.norm(rgb - ocean, axis=-1)
    tol = max(6.0, 4 * float(np.percentile(d[ys, xs], 99.9)))
    g = georef.verify(georef.majority(d > tol, 5)); g.update(ocean_rgb=ocean.tolist(), land_tolerance_rgb=tol, frame=p.name)
    return g

def plume_stats(ppm_px, plume):
    m = cv2.resize((ppm_px >= plume).astype(np.uint8), PLUME_GRID, interpolation=cv2.INTER_NEAREST)
    H, W = m.shape
    lat = np.radians(90 - (np.arange(H) + 0.5) * 180 / H)
    cell_km2 = (np.radians(360 / W) * EARTH_KM) * (np.radians(180 / H) * EARTH_KM) * np.cos(lat)
    area = float((m * cell_km2[:, None]).sum())
    contours, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    edge = 0.0
    for c in contours:
        pts = c[:, 0, :].astype(float)
        if len(pts) < 2: continue
        dx = np.diff(np.r_[pts[:, 0], pts[0, 0]]) * np.radians(360 / W) * EARTH_KM * np.cos(lat[np.clip(pts[:, 1].astype(int), 0, H - 1)])
        dy = np.diff(np.r_[pts[:, 1], pts[0, 1]]) * np.radians(180 / H) * EARTH_KM
        edge += float(np.hypot(dx, dy).sum())
    return area, edge

def main():
    cb = read_transfer(ROOT / "assets" / "dyamondCbar_6-27-2024a.png")
    plume = float(cb.value_at(np.array([float(np.argmax(cb.alpha >= 0.95))]))[0])
    inv = Inverter(cb, mode="chroma", method=DEFAULT)
    when = dates()
    files = sorted((ROOT / "volume").glob("*.exr"), key=lambda p: frame_number(p.name))
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    ppm, conf, nums, plumes = [], [], [], []
    for p in files:
        img, al, ok = colours(p)
        val, _, res, _ = inv.invert(img, MAX_DIST, min_k=0.0)
        val[~ok] = np.nan
        w = np.where(np.isfinite(val), al, 0).astype(np.float32)
        s = cv2.resize(np.nan_to_num(val * w).astype(np.float32), (gw, gh), interpolation=cv2.INTER_AREA)
        n = cv2.resize(w, (gw, gh), interpolation=cv2.INTER_AREA)
        ppm.append(np.where(n > 1e-4, s / np.maximum(n, 1e-9), np.nan)); conf.append(cv2.resize(al, (gw, gh), interpolation=cv2.INTER_AREA))
        plumes.append(plume_stats(np.nan_to_num(val, nan=0), plume)); nums.append(frame_number(p.name))
        say(f"5436 frame {nums[-1]} ({when[nums[-1]]:%Y-%m-%d}): decoded {np.isfinite(val).mean():.1%}; plume {plumes[-1][0]:,.0f} km²")
        p.unlink()
    np.savez_compressed(ROOT / "grids.npz", ppm=np.stack(ppm).astype(np.float32), alpha=np.stack(conf).astype(np.float32),
                        frames=np.array(nums), times=np.array([when[n].strftime("%Y-%m-%dT%H:%M:%SZ") for n in nums]))
    meta = {"colorbar": cb.summary(), "plume_ppm": plume, "alpha_min": ALPHA_MIN, "max_dist": MAX_DIST, "matcher": DEFAULT, "mode": "chroma",
            "georef": georef_surface(), "plumes": {str(n): {"area_km2": a, "edge_km": e} for n, (a, e) in zip(nums, plumes)},
            "frames": len(nums), "frames_total": len(when)}
    (ROOT / "decode.json").write_text(json.dumps(meta, indent=1, default=float), encoding="utf-8")
    say(f"5436: georef IoU {meta['georef']['iou']:.3f}; plume ≥ {plume:.1f} ppm")

if __name__ == "__main__":
    main()
