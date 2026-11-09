"""Any regular lat/lon field → the toolkit's equal-angle cells (row 0 = north, col 0 = 180° W): mean of the finite source
values whose centres fall in each cell. Used for validation sources (MUR25, OSCAR, GEOS-CF)."""
import numpy as np

def to_cells(values, lat, lon, deg):
    lat, lon = np.asarray(lat, float), (np.asarray(lon, float) + 180) % 360 - 180
    v = np.asarray(values, np.float64)
    gh, gw = int(round(180 / deg)), int(round(360 / deg))
    r = np.clip(((90 - lat) / deg).astype(int), 0, gh - 1); c = np.clip(((lon + 180) / deg).astype(int), 0, gw - 1)
    R, C = np.meshgrid(r, c, indexing="ij")
    ok = np.isfinite(v)
    s = np.zeros((gh, gw)); n = np.zeros((gh, gw))
    np.add.at(s, (R[ok], C[ok]), v[ok]); np.add.at(n, (R[ok], C[ok]), 1)
    with np.errstate(invalid="ignore"):
        return np.where(n > 0, s / np.maximum(n, 1), np.nan).astype(np.float32)

def centres(deg):
    gh, gw = int(round(180 / deg)), int(round(360 / deg))
    return 90 - (np.arange(gh) + 0.5) * deg, -180 + (np.arange(gw) + 0.5) * deg
