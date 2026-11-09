"""Point events in frames (lightning flashes, fire pixels): multi-scale Laplacian-of-Gaussian blob detection, then frame
differencing so only marks that are new in this frame count. Output per frame: events (x, y, lon, lat, intensity,
sigma) and per-cell counts on a lat/lon grid."""
import numpy as np
from scipy import ndimage
from .georef import GLOBAL, pixel_centres

def log_blobs(gray, sigmas=(1.0, 1.5, 2.0, 3.0), threshold=0.05):
    """Bright blobs in a 0–1 image: scale-normalised −σ²∇²G maxima over space and scale above `threshold`."""
    g = np.asarray(gray, np.float32)
    stack = np.stack([-(s ** 2) * ndimage.gaussian_laplace(g, s) for s in sigmas])
    peak = ndimage.maximum_filter(stack, size=(len(sigmas), 3, 3)) == stack
    k, y, x = np.nonzero(peak & (stack > threshold))
    return [{"x": int(xi), "y": int(yi), "sigma": float(sigmas[ki]), "response": float(stack[ki, yi, xi])}
            for ki, yi, xi in zip(k, y, x)]

def new_marks(prev_gray, gray, sigmas=(1.0, 1.5, 2.0, 3.0), threshold=0.05):
    """Blobs present in `gray` but not in `prev_gray` (marks that persist are not counted twice)."""
    diff = np.clip(np.asarray(gray, np.float32) - np.asarray(prev_gray, np.float32), 0, None)
    return log_blobs(diff, sigmas, threshold)

def geolocate(events, W, H, bounds=GLOBAL):
    lat, lon = pixel_centres(W, H, bounds)
    for e in events:
        e["lat"], e["lon"] = float(lat[e["y"]]), float(lon[e["x"]])
    return events

def cell_counts(events, deg=1.0, bounds=GLOBAL):
    """Counts per deg×deg cell (row 0 = north, col 0 = west edge)."""
    w, s, e, n = bounds
    rows, cols = int(round((n - s) / deg)), int(round((e - w) / deg))
    out = np.zeros((rows, cols), np.int32)
    for ev in events:
        r = min(rows - 1, int((n - ev["lat"]) / deg)); c = min(cols - 1, int((ev["lon"] - w) / deg))
        out[r, c] += 1
    return out
