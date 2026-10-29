"""The DYAMOND colorbar (5436 dyamondCbar_6-27-2024a.png) → colour and opacity transfer functions on the ppm axis. The
strip is drawn over a checkerboard: in every column one checker row shows the light cell and the other the dark cell,
P = α·C + (1 − α)·B. With the two backgrounds B_light, B_dark taken at the strip's low end (380 ppm, assumed fully
transparent there), α = 1 − (P_light − P_dark) / (B_light − B_dark) and C = (P_dark − (1 − α)·B_dark) / α. Labels (OCR,
white on transparent) give ppm per column by a straight-line fit. Everything is read from the image."""
import numpy as np
from svs import frames, ocr
from svs.colorbar import Colorbar

EDGE, TICKS, SMOOTH = 5, 25, 27          # px: strip outline, tick marks' height inside the strip, half a checker cell

def read(path):
    a = frames.read_rgba(path).astype(np.float64)
    al = a[..., 3] > 0
    rows = np.where(al[:, int(0.15 * a.shape[1]):int(0.85 * a.shape[1])].mean(1) > 0.9)[0]
    top, bot = int(rows.min()), int(rows.max())
    mid = (top + bot) // 2
    cols = np.where(al[mid])[0]; x0, x1 = int(cols.min()), int(cols.max())
    band = a[top + EDGE:bot - TICKS, x0:x1 + 1, :3]                 # the tick marks sit in the strip's bottom rows
    lum = band.mean(-1)
    light = np.take_along_axis(band, lum.argmax(0)[None, :, None], 0)[0]
    dark = np.take_along_axis(band, lum.argmin(0)[None, :, None], 0)[0]
    B_light, B_dark = light[EDGE:3 * EDGE].mean(0), dark[EDGE:3 * EDGE].mean(0)   # just inside the low end
    alpha = np.clip(1 - (light - dark).mean(-1) / max(float((B_light - B_dark).mean()), 1e-9), 0, 1)
    colour = np.where(alpha[:, None] > 0.05, (dark - (1 - alpha[:, None]) * B_dark) / np.maximum(alpha[:, None], 1e-9), light)
    from scipy.ndimage import median_filter
    alpha = median_filter(alpha, SMOOTH, mode="nearest")                    # cell edges and checker shading are column noise
    colour = median_filter(np.clip(colour, 0, 255), (SMOOTH, 1), mode="nearest")
    lab_rows = a[bot + 30:bot + 110]
    labels = ocr.read_labels(lab_rows[..., :3].max(-1) * (lab_rows[..., 3] / 255) / 255)
    px = np.array([l["x"] - x0 for l in labels if l["value"] is not None]); v = np.array([l["value"] for l in labels if l["value"] is not None])
    b, c = np.polyfit(px, v, 1)
    resid = v - (c + b * px)
    cb = Colorbar(rgb=colour, alpha=alpha, geometry={"x0": x0, "x1": x1, "band": [top, bot], "vertical": False, "image_size": list(a.shape[:2]),
                                                       "checker_backgrounds": [B_light.tolist(), B_dark.tolist()]},
                  ticks=[{"px": float(p), "value": float(val), "text": f"{val:g}", "engine": "glyph"} for p, val in zip(px, v)],
                  scale="linear", fit={"a": float(c), "b": float(b), "max_resid_value": float(np.abs(resid).max())},
                  notes=["Colour and opacity separated from the checkerboard (backgrounds read at the 380 ppm end, assumed transparent "
                         "there), median-smoothed over half a checker cell."])
    return cb
