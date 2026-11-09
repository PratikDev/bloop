"""Georeference a globe view (a whole sphere seen from afar, as in 4950's stills) as an orthographic projection.
  disc     — the sphere's outline: least-squares circle through the edge of the largest non-space region, refitted
             without edge points more than 1 % of the radius off (extruded columns stick out past the limb);
  fit      — the view (sub-camera latitude and longitude, roll) that best matches the frame's land mask to Natural Earth
             land inside INNER × radius (the inner disc, where extrusion and perspective move little): a coarse grid
             search on a small copy, then Nelder–Mead on a finer one; the IoU is the georeference score;
  forward / inverse — lat/lon ↔ pixel for the fitted view (visible hemisphere only).
A perspective camera at distance D (sphere radii) is a sixth parameter (D = ORTHO is orthographic): a point at angular
distance c from the sub-camera point sits at screen radius sin c·√(D²−1)/(D − cos c) of the disc radius (1 at the limb,
cos c = 1/D). The IoU says how good the fit is."""
import numpy as np
from scipy import optimize
from . import georef

INNER, ORTHO = 0.75, 1e6
DISTANCES = (1.5, 2.0, 3.0, 5.0, ORTHO)
LAND_RES = (3600, 1800)                          # 0.1° Natural Earth raster for lookups

def disc(nonspace):
    import cv2
    n, lab, st, _ = cv2.connectedComponentsWithStats(nonspace.astype(np.uint8), connectivity=8)
    big = (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    cnt = max(cv2.findContours(big, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=len)[:, 0, :].astype(float)
    pts = cnt
    for _ in range(4):
        A = np.column_stack([2 * pts[:, 0], 2 * pts[:, 1], np.ones(len(pts))])
        b = (pts ** 2).sum(1)
        cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
        R = float(np.sqrt(c + cx ** 2 + cy ** 2))
        d = np.hypot(cnt[:, 0] - cx, cnt[:, 1] - cy)
        pts = cnt[np.abs(d - R) <= 0.01 * R]
    return float(cx), float(cy), R

def _rot(roll):
    c, s = np.cos(np.radians(roll)), np.sin(np.radians(roll))
    return c, s

def _c_of_r(r, D):
    """Angular distance from the sub-camera point for a normalised screen radius (perspective inverse, by table)."""
    if D >= ORTHO: return np.arcsin(np.clip(r, 0, 1))
    cl = np.arccos(1 / D)
    cs = np.linspace(0, cl, 2000)
    rs = np.sin(cs) * np.sqrt(D * D - 1) / (D - np.cos(cs))
    return np.interp(np.clip(r, 0, 1), rs, cs)

def inverse(px, py, view):
    """Pixel → (lat, lon, on-sphere mask) for view = (cx, cy, R, lat0, lon0, roll, D)."""
    cx, cy, R, lat0, lon0, roll, D = view
    c, s = _rot(roll)
    u, v = (px - cx) / R, (cy - py) / R
    x, y = u * c + v * s, -u * s + v * c
    r = np.hypot(x, y)
    with np.errstate(invalid="ignore", divide="ignore"):
        k = np.where(r > 0, np.sin(_c_of_r(r, D)) / r, 1.0)
    ok = r < 1
    x, y = x * k, y * k
    rho = np.hypot(x, y)
    cc = np.arcsin(np.clip(rho, 0, 1))
    p0 = np.radians(lat0)
    with np.errstate(invalid="ignore", divide="ignore"):
        lat = np.degrees(np.arcsin(np.clip(np.cos(cc) * np.sin(p0) + np.where(rho > 0, y * np.sin(cc) * np.cos(p0) / rho, 0), -1, 1)))
        lon = lon0 + np.degrees(np.arctan2(x * np.sin(cc), rho * np.cos(cc) * np.cos(p0) - y * np.sin(cc) * np.sin(p0)))
    return lat, (lon + 180) % 360 - 180, ok

def forward(lat, lon, view):
    """(lat, lon) → (px, py, visible) for the fitted view."""
    cx, cy, R, lat0, lon0, roll, D = view
    p, l, p0, l0 = np.radians(lat), np.radians(lon), np.radians(lat0), np.radians(lon0)
    cosc = np.sin(p0) * np.sin(p) + np.cos(p0) * np.cos(p) * np.cos(l - l0)
    x = np.cos(p) * np.sin(l - l0)
    y = np.cos(p0) * np.sin(p) - np.sin(p0) * np.cos(p) * np.cos(l - l0)
    if D < ORTHO:                                         # perspective: stretch the orthographic radius sin c
        sc = np.sqrt(np.clip(1 - cosc ** 2, 0, 1))
        with np.errstate(invalid="ignore", divide="ignore"):
            k = np.where(sc > 0, np.sqrt(D * D - 1) / (D - cosc), 1.0)
        x, y = x * k, y * k
    c, s = _rot(roll)
    u, v = x * c - y * s, x * s + y * c
    return cx + R * u, cy - R * v, cosc > (1 / D if D < ORTHO else 0)

_LAND = None
def land_lookup(lat, lon):
    global _LAND
    if _LAND is None: _LAND = georef.rasterise_land(*LAND_RES)
    W, H = LAND_RES
    i = np.clip(((90 - lat) / 180 * H).astype(int), 0, H - 1); j = np.clip(((lon + 180) / 360 * W).astype(int), 0, W - 1)
    return _LAND[i, j]

def score(land, d, angles, step):
    """IoU of the frame's land mask with Natural Earth inside the inner disc, on every `step`-th pixel."""
    cx, cy, R = d
    ys, xs = np.mgrid[0:land.shape[0]:step, 0:land.shape[1]:step]
    inner = np.hypot(xs - cx, ys - cy) < INNER * R
    lat, lon, _ = inverse(xs[inner].astype(float), ys[inner].astype(float), (cx, cy, R, *angles))   # angles = (lat0, lon0, roll, D)
    a, b = land[ys[inner], xs[inner]], land_lookup(lat, lon)
    return float((a & b).sum() / max(1, (a | b).sum()))

def fit(land, d, lat_range=(-40, 40), roll_range=(-30, 30)):
    """Best (lat0, lon0, roll, D) and its IoU: grid search (5°, the DISTANCES) on a coarse pixel step, then Nelder–Mead on
    the angles at the best distance, on a finer step."""
    step = max(4, int(d[2] / 60))
    best = max(((score(land, d, (la, lo, ro, D), step), (la, lo, ro, D)) for D in DISTANCES for la in range(lat_range[0], lat_range[1] + 1, 5)
                for lo in range(-180, 180, 5) for ro in range(roll_range[0], roll_range[1] + 1, 10)), key=lambda t: t[0])
    D = best[1][3]
    res = optimize.minimize(lambda a: -score(land, d, (*a, D), max(2, step // 4)), np.array(best[1][:3], float), method="Nelder-Mead",
                            options={"xatol": 0.1, "fatol": 1e-4, "maxiter": 400})
    ang = (*(float(x) for x in res.x), D)
    return ang, score(land, d, ang, 2), {"grid_best": best[1], "grid_iou": best[0]}
