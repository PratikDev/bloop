"""sRGB ↔ linear ↔ CIELAB (D65), vectorised. Inputs are uint8 or float 0–255 sRGB arrays of shape (..., 3)."""
import numpy as np

_M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
_WHITE = _M.sum(1)

def to_linear(rgb):
    c = np.asarray(rgb, np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def from_linear(lin):
    c = np.clip(lin, 0, 1)
    return 255.0 * np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)

def _f(t):
    d = 6 / 29
    return np.where(t > d ** 3, np.cbrt(t), t / (3 * d * d) + 4 / 29)

def _finv(t):
    d = 6 / 29
    return np.where(t > d, t ** 3, 3 * d * d * (t - 4 / 29))

def linear_to_lab(lin):
    xyz = lin @ _M.T / _WHITE
    fx, fy, fz = _f(xyz[..., 0]), _f(xyz[..., 1]), _f(xyz[..., 2])
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)

def rgb_to_lab(rgb):
    return linear_to_lab(to_linear(rgb))

def lab_to_rgb(lab):
    lab = np.asarray(lab, np.float64)
    fy = (lab[..., 0] + 16) / 116
    xyz = np.stack([_finv(fy + lab[..., 1] / 500), _finv(fy), _finv(fy - lab[..., 2] / 200)], -1) * _WHITE
    return from_linear(xyz @ np.linalg.inv(_M).T)

def chroma_normalised_lab(rgb):
    """Brightness-invariant colour: scale linear RGB so its largest channel is 1, then Lab. A colour dimmed by a factor
    k (drawn over black with opacity k, or faded along a streak) maps to the same point; returns (lab, k)."""
    lin = to_linear(rgb)
    k = lin.max(-1)
    return linear_to_lab(lin / np.maximum(k, 1e-6)[..., None]), k
