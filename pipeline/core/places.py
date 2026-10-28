"""Named points and boxes, each defined once: the reference suite's constants (book §4.10) and build_context's city cells."""
import json
from functools import lru_cache
import numpy as np
from build_context import CELLS as CITY_CELLS          # Dhaka, Chattogram, Rajshahi, Sylhet (lat, lon)
from common import INPUTS
from .ref import T

BD_BBOX, BAY_BBOX, CHT_BBOX, PUNJAB_BBOX = T.BD_BBOX, T.BAY_BBOX, T.CHT_BBOX, T.PUNJAB_BBOX   # (W, S, E, N)
BD_POINTS = T.BD_POINTS                                 # Dhaka, Chattogram, Khulna
BD_BOUNDARY = INPUTS / "context" / "bangladesh_boundary.geojson"   # Natural Earth 1:50m (public domain)

def in_box(lat, lon, box):
    w, s, e, n = box
    return (lat >= s) & (lat <= n) & (lon >= w) & (lon <= e)

@lru_cache(maxsize=1)
def _bd_paths():
    from matplotlib.path import Path
    geom = json.load(open(BD_BOUNDARY))["features"][0]["geometry"]
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return [Path(np.asarray(p[0])) for p in polys]      # outer rings (the national outline has no holes that matter)

def in_bangladesh(lat, lon):
    pts = np.column_stack([np.asarray(lon, float), np.asarray(lat, float)])
    return np.any([p.contains_points(pts) for p in _bd_paths()], axis=0)
