"""Motion in frames. Two measurements, kept apart because they mean different things:
  optical flow  — OpenCV Farnebäck between consecutive frames: how the drawn pattern moves (px/frame → km/day with the
                  georef scale and the frame interval). On streak renderings (3912) this is pattern drift (eddies,
                  meanders), not water speed: motion along a uniform streak is invisible (the aperture problem).
  streak axis   — structure-tensor orientation of the drawn streaks: the current's axis, direction modulo 180°.
Directions are degrees clockwise from north, the way the water (or pattern) goes. Vorticity and divergence are computed
on the physical grid (km), so they are per day."""
import cv2
import numpy as np
from .georef import GLOBAL, km_per_px, pixel_centres

FARNEBACK = {"pyr_scale": 0.5, "levels": 5, "winsize": 15, "iterations": 5, "poly_n": 7, "poly_sigma": 1.5, "flags": 0}

def gray(rgb):
    return cv2.cvtColor(np.ascontiguousarray(rgb[..., :3]), cv2.COLOR_RGB2GRAY)

def farneback(prev_rgb, next_rgb, params=FARNEBACK):
    """(H, W, 2) displacement in px from prev to next: [..., 0] = +x (east), [..., 1] = +y (south)."""
    return cv2.calcOpticalFlowFarneback(gray(prev_rgb), gray(next_rgb), None, params["pyr_scale"], params["levels"],
                                        params["winsize"], params["iterations"], params["poly_n"], params["poly_sigma"], params["flags"])

def to_velocity(disp, dt_hours, bounds=GLOBAL):
    """px displacement → (u east, v north) in km/day."""
    H, W = disp.shape[:2]
    lat, _ = pixel_centres(W, H, bounds)
    kx, ky = km_per_px(lat, W, H, bounds)
    days = dt_hours / 24.0
    return disp[..., 0] * kx[:, None] / days, -disp[..., 1] * ky / days

def compass(u, v):
    """Direction the vector points to, degrees clockwise from north (0–360)."""
    return np.degrees(np.arctan2(u, v)) % 360

def derivatives(u, v, bounds=GLOBAL):
    """Relative vorticity ∂v/∂x − ∂u/∂y and divergence ∂u/∂x + ∂v/∂y, per day (u, v in km/day on the grid)."""
    H, W = u.shape
    lat, _ = pixel_centres(W, H, bounds)
    kx, ky = km_per_px(lat, W, H, bounds)
    dudx = np.gradient(u, axis=1) / kx[:, None]; dvdx = np.gradient(v, axis=1) / kx[:, None]
    dudy = -np.gradient(u, axis=0) / ky; dvdy = -np.gradient(v, axis=0) / ky       # rows run south
    return dvdx - dudy, dudx + dvdy

def streak_axis(rgb, sigma=2.0, bounds=GLOBAL):
    """Streak orientation from the structure tensor: (axis in degrees clockwise from north, 0–180; coherence 0–1).
    The streak runs perpendicular to the dominant intensity gradient. Pixel angles are converted to ground angles
    (x shrinks by cos(latitude) on an equirectangular grid)."""
    g = gray(rgb).astype(np.float32) / 255
    gx, gy = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3), cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    blur = lambda a: cv2.GaussianBlur(a, (0, 0), sigma)
    jxx, jyy, jxy = blur(gx * gx), blur(gy * gy), blur(gx * gy)
    theta_grad = 0.5 * np.arctan2(2 * jxy, jxx - jyy)                 # gradient direction in px space
    tx, ty = -np.sin(theta_grad), np.cos(theta_grad)                  # streak tangent (px: x east, y south)
    H, W = g.shape
    lat, _ = pixel_centres(W, H, bounds)
    kx, ky = km_per_px(lat, W, H, bounds)
    east, north = tx * kx[:, None], -ty * ky
    axis = compass(east, north) % 180
    lam = np.sqrt((jxx - jyy) ** 2 + 4 * jxy ** 2)
    coherence = lam / np.maximum(jxx + jyy, 1e-9)
    return axis, coherence

def axial_mean(axis_deg, weights=None, axis=None):
    """Mean of axial angles (mod 180) via angle doubling."""
    a = np.radians(np.asarray(axis_deg) * 2)
    w = np.ones_like(a) if weights is None else weights
    c, s = np.nansum(np.cos(a) * w, axis=axis), np.nansum(np.sin(a) * w, axis=axis)
    return (np.degrees(np.arctan2(s, c)) / 2) % 180, np.hypot(c, s) / np.maximum(np.nansum(w * np.isfinite(a), axis=axis), 1e-9)

def sign_axis(axis_deg, u, v):
    """Streak axis turned into a direction: of its two senses, the one closer to the drift (u, v)."""
    d = compass(u, v)
    diff = (d - axis_deg + 180) % 360 - 180
    return np.where(np.abs(diff) <= 90, axis_deg, (axis_deg + 180) % 360)
