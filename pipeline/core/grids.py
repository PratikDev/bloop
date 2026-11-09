"""Grid helpers for new products. Same layout as the data contract: little-endian, row 0 = 90° N, col 0 = 180° W,
cell centres. Robinson maths is the reference suite's (Snyder's table, T.ROBINSON), vectorised."""
import numpy as np
from .ref import T

GRID_W, GRID_H = 1024, 512          # = latest/sst.bin (lut_params.json sst.grid_width)
I16_NODATA, U8_NODATA = -32768, 255

def cell_centres(w=GRID_W, h=GRID_H):
    lat = 90 - (np.arange(h) + 0.5) * 180 / h
    lon = -180 + (np.arange(w) + 0.5) * 360 / w
    return lat, lon

def grid_info(w, h, encoding, **extra):
    """The `grid` block every binary product carries (shape of the existing sst.json/rain.json grid block)."""
    return {"width": w, "height": h, "encoding": encoding, "byte_order": "little", "row0": "north (90N)", "col0": "180W", **extra}

def encode_i16(v, scale):
    e = np.round(np.asarray(v, np.float64) * scale)
    out = np.clip(np.nan_to_num(e, nan=0), -32767, 32767).astype("<i2")
    out[~np.isfinite(v)] = I16_NODATA
    return out

def decode_i16(u, scale):
    v = u.astype(np.float32) / scale
    v[u == I16_NODATA] = np.nan
    return v

def robinson_xy(lat, lon, W, H):
    """Vectorised T.robinson_px: float pixel coordinates of (lat, lon) arrays on a full-height, centred Robinson map."""
    lats = [r[0] for r in T.ROBINSON]
    a = np.abs(lat)
    X = np.interp(a, lats, [r[1] for r in T.ROBINSON]); Y = np.interp(a, lats, [r[2] for r in T.ROBINSON])
    wmap = H * (0.8487 * np.pi) / 1.3523
    x = W / 2 + X * (lon / 180) * (wmap / 2)
    y = H / 2 - np.sign(lat) * Y * (H / 2)
    return np.clip(x.astype(int), 0, W - 1), np.clip(y.astype(int), 0, H - 1)

def robinson_to_grid(classes, w=GRID_W, h=GRID_H):
    """Sample a per-pixel class image (Robinson) at every equirect cell centre (nearest pixel: categories never blend)."""
    H, W = classes.shape
    lat, lon = cell_centres(w, h)
    LA, LO = np.meshgrid(lat, lon, indexing="ij")
    x, y = robinson_xy(LA, LO, W, H)
    return classes[y, x], (x, y)

def mode_filter_classes(img_classes, size=3):
    """Majority class in a size×size window (ignores -1), so hill-shading speckle and borders don't flip a cell."""
    H, W = img_classes.shape
    pad = size // 2
    p = np.pad(img_classes, pad, constant_values=-1)
    stack = np.stack([p[dy:dy + H, dx:dx + W] for dy in range(size) for dx in range(size)])
    k = int(stack.max()) + 1
    counts = np.stack([(stack == c).sum(0) for c in range(k)])
    best = counts.argmax(0)
    best[counts.max(0) == 0] = -1
    return best
