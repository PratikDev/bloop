"""Georeferencing. A flat frame has bounds (west, south, east, north) on an equirectangular grid; 2:1 frames start
from the assumption −180…180 / −90…90 and must pass the coastline check (IoU ≥ 0.90 against Natural Earth 1:50 m land,
rasterised on the same grid). Non-2:1 flat maps get their bounds fitted by maximising that IoU. Camera / globe views are
georef "none": regional statistics only, no per-pixel geolocation, and the record says so."""
import numpy as np

GLOBAL = (-180.0, -90.0, 180.0, 90.0)
IOU_PASS = 0.90
SHIFTS_DEG = (0.5, 1.0)             # the assumed bounds must beat the same bounds shifted by these

def pixel_centres(W, H, bounds=GLOBAL):
    w, s, e, n = bounds
    lon = w + (np.arange(W) + 0.5) * (e - w) / W
    lat = n - (np.arange(H) + 0.5) * (n - s) / H
    return lat, lon

def box_slices(box, W, H, bounds=GLOBAL, margin=0.0):
    """Row/column slices of the pixels whose centres fall in box (W, S, E, N) widened by margin degrees."""
    lat, lon = pixel_centres(W, H, bounds)
    w, s, e, n = box[0] - margin, box[1] - margin, box[2] + margin, box[3] + margin
    rows = np.where((lat >= s) & (lat <= n))[0]; cols = np.where((lon >= w) & (lon <= e))[0]
    return slice(int(rows[0]), int(rows[-1]) + 1), slice(int(cols[0]), int(cols[-1]) + 1)

def lonlat_to_px(lon, lat, W, H, bounds=GLOBAL):
    w, s, e, n = bounds
    return (np.asarray(lon) - w) / (e - w) * W - 0.5, (n - np.asarray(lat)) / (n - s) * H - 0.5

def km_per_px(lat, W, H, bounds=GLOBAL):
    """Ground size of one pixel (x, y) in km at latitude lat."""
    w, s, e, n = bounds
    deg_x, deg_y = (e - w) / W, (n - s) / H
    return 111.320 * deg_x * np.cos(np.radians(lat)), 110.574 * deg_y

# ---------------------------------------------------------------------------------------------------------------------
# Coastline check: Natural Earth 1:50 m land (public domain), rasterised on the frame's grid.
NE_LAND_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson"

def natural_earth_land():
    """Path + SHA-256 of the cached Natural Earth 1:50 m land GeoJSON (data_raw/ref/, git-ignored)."""
    from .config import raw_dir
    from .fetch import Fetcher
    root = raw_dir("ref")
    e = Fetcher(root / "manifest.jsonl").get(NE_LAND_URL, root / "ne_50m_land.geojson", expect_bytes=5_000_000)
    return root / "ne_50m_land.geojson", e["sha256"]

def rasterise_land(W, H, bounds=GLOBAL, path=None):
    """Boolean land mask (H, W) of Natural Earth land on an equirectangular grid with the given bounds."""
    import json, cv2
    path = path or natural_earth_land()[0]
    feats = json.loads(open(path, encoding="utf-8").read())["features"]
    mask = np.zeros((H, W), np.uint8)
    scale = 8                                            # sub-pixel vertex precision for cv2.fillPoly
    for f in feats:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            rings = []
            for ring in poly:
                r = np.asarray(ring, float)
                x, y = lonlat_to_px(r[:, 0], r[:, 1], W, H, bounds)
                rings.append(np.round(np.stack([x + 0.5, y + 0.5], 1) * scale).astype(np.int32))
            cv2.fillPoly(mask, rings, 1, shift=3)
    return mask.astype(bool)

def iou(a, b):
    a, b = np.asarray(a, bool), np.asarray(b, bool)
    return float((a & b).sum() / max(1, (a | b).sum()))

def majority(mask, size=5):
    import cv2
    m = cv2.blur(mask.astype(np.float32), (size, size))
    return m > 0.5

def ocean_fill(lines, seeds_lonlat, bounds=GLOBAL, grow=1):
    """Outline-only maps: ocean = everything reachable from open-ocean seeds without crossing an outline pixel
    (outlines dilated by `grow` px to close anti-aliasing gaps). Returns a boolean land mask; outline pixels take the
    label of their neighbourhood majority."""
    import cv2
    H, W = lines.shape
    barrier = cv2.dilate(lines.astype(np.uint8), np.ones((2 * grow + 1, 2 * grow + 1), np.uint8)) > 0
    fill = barrier.astype(np.uint8)
    ff = np.zeros((H + 2, W + 2), np.uint8)
    for lon, lat in seeds_lonlat:
        x, y = lonlat_to_px(lon, lat, W, H, bounds)
        x, y = int(round(float(x))), int(round(float(y)))
        if fill[y, x] == 0: cv2.floodFill(fill, ff, (x, y), 2)
    ocean = fill == 2
    land = ~ocean & ~barrier
    near_ocean = cv2.blur(ocean.astype(np.float32), (2 * grow + 5,) * 2)
    near_land = cv2.blur(land.astype(np.float32), (2 * grow + 5,) * 2)
    land[barrier] = (near_land > near_ocean)[barrier]
    return land

# Seeds (lon, lat), fixed for every frame: open oceans plus the enclosed seas Natural Earth 1:50 m land treats as water.
# They only label regions; every boundary still comes from the frame's own outlines.
WATER_SEEDS = [(-150.0, 0.0), (-30.0, -30.0), (80.0, -25.0), (-30.0, 40.0), (160.0, -50.0), (-85.0, 60.0), (19.0, 57.0),
               (18.0, 35.0), (34.0, 43.0), (38.0, 20.0), (51.5, 27.0), (51.0, 42.0)]

def outline_mask(rgb, size=5, thresh=25):
    """Thin dark outlines (coastlines, borders) drawn over a field: morphological black-hat on luminance, which responds
    to dark lines narrower than `size` px whatever the field's colour underneath."""
    import cv2
    lum = rgb.astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (size, size))
    return cv2.morphologyEx(lum, cv2.MORPH_BLACKHAT, k) > thresh

def verify(land_frame, bounds=GLOBAL, shifts=SHIFTS_DEG):
    """IoU at the assumed bounds and at shifted bounds (the assumption should be the best)."""
    H, W = land_frame.shape
    path, sha = natural_earth_land()
    ref = rasterise_land(W, H, bounds, path)
    out = {"bounds": list(bounds), "iou": iou(land_frame, ref), "pass": None, "reference": "Natural Earth 1:50m land",
           "reference_sha256": sha, "shifted": {}}
    w, s, e, n = bounds
    for d in shifts:
        for name, b in ((f"lon+{d}", (w + d, s, e + d, n)), (f"lon-{d}", (w - d, s, e - d, n)),
                        (f"lat+{d}", (w, s + d, e, n + d)), (f"lat-{d}", (w, s - d, e, n - d))):
            out["shifted"][name] = iou(land_frame, rasterise_land(W, H, b, path))
    out["best_is_assumed"] = out["iou"] >= max(out["shifted"].values())
    out["pass"] = out["iou"] >= IOU_PASS
    return out

def fit_bounds(land_frame, guess, span=(10.0, 3.0, 1.0, 0.25), max_rounds=6):
    """Non-2:1 flat maps: bounds (W, S, E, N) maximising IoU with Natural Earth land, by coordinate search at shrinking step
    sizes starting from `guess`. Returns (bounds, iou)."""
    H, W = land_frame.shape
    path, _ = natural_earth_land()
    score = lambda b: iou(land_frame, rasterise_land(W, H, b, path))
    best = tuple(map(float, guess)); best_iou = score(best)
    for step in span:
        for _ in range(max_rounds):
            improved = False
            for i in range(4):
                for d in (-step, step):
                    b = list(best); b[i] += d
                    if b[2] - b[0] < 1 or b[3] - b[1] < 1: continue
                    s = score(tuple(b))
                    if s > best_iou: best, best_iou, improved = tuple(b), s, True
            if not improved: break
    return best, best_iou
