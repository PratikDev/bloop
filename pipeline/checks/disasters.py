"""latest/landslide_class.* (SVS 5584)."""
import numpy as np
from common import PUBLIC
from core.grids import GRID_W, GRID_H
from .common import header_problems, info, load

def run(check):
    d = load("latest/landslide_class.json")
    if d is None: return
    g = np.fromfile(PUBLIC / "latest" / "landslide_class.bin", "u1")
    n = len(d["classes"])
    ok = (g.size == GRID_W * GRID_H and not header_problems(d, "landslide_class") and g.max() < n
          and len(d["legend_swatches_rgb"]) == n - 1 and np.bincount(g, minlength=n).tolist() == d["cells_per_class"])
    check("latest/landslide_class.* (5584): grid, legend classes, counts", ok, f"{header_problems(d, 'landslide_class')}; size {g.size}")
    info("5584 landslide classes", f"{n - 1} legend classes found in the picture (book: 3); exposed cells {sum(d['cells_per_class'][1:])}")
