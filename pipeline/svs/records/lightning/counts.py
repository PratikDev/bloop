"""5011 marks → dated flash counts (shared by validate.py and export.py). A mark of area ≤ AREA_MAX px is one flash; a
larger one (neighbouring marks fused) counts as round(area / median single-mark area). Dates come from timing.model."""
import json
import numpy as np
from svs.config import raw_dir
from . import GRID_DEG, SID
from .decode import AREA_MAX
from .timing import model

ROOT = raw_dir(SID)

def load():
    """{'lon', 'lat', 'n' (flashes per mark), 'when' (POSIX seconds), 'model', 'meta'} for every new mark."""
    meta = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    z = np.load(ROOT / "marks.npz")
    W, H = meta["probe"]["width"], meta["probe"]["height"]
    m = model(z["centroid"])
    fx = np.array([a["frame"] for a in m["anchors"]])
    fy = np.array([m["date_of"](f).timestamp() for f in fx])
    area = z["area"].astype(float)
    return {"lon": (z["x"] + 0.5) / W * 360 - 180, "lat": 90 - (z["y"] + 0.5) / H * 180,
            "n": np.where(area <= AREA_MAX, 1, np.round(area / meta["median_mark_area"])),
            "when": np.interp(z["frame"], fx, fy), "frame": z["frame"], "model": m, "meta": meta}

def in_box(lat, lon, box):
    w, s, e, n = box
    return (lon >= w) & (lon <= e) & (lat >= s) & (lat <= n)

def grid(lat, lon, weight, deg=GRID_DEG):
    """Counts per cell (row 0 = north, col 0 = 180° W)."""
    gw, gh = int(360 / deg), int(180 / deg)
    i = np.clip(((90 - lat) / deg).astype(int), 0, gh - 1); j = np.clip(((lon + 180) / deg).astype(int), 0, gw - 1)
    out = np.zeros((gh, gw)); np.add.at(out, (i, j), weight)
    return out
