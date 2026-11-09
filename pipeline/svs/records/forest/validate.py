"""Validate 4950 against GEDI L2B RH100 footprints (report correction 1). Fixed 30 Oct before any L2B file was read:
(a) per still, every quality-1 footprint (l2b.py) is projected into the frame with the still's fitted globe view (flat.py)
    and kept when visible and inside INNER × the disc radius; footprints and flat decoded pixels are gridded into CELL-px
    cells; a cell counts with ≥ MIN_SHOTS footprints and ≥ MIN_PX flat pixels. Per cell: median decoded height vs median
    RH100. Spearman over all cells of all stills, and the median difference; provisional pass: Spearman ≥ 0.6 and
    |median difference| ≤ 5 m;
(b) the distributions of those cell medians: KS statistic (context);
(c) the earlier check (histogram of all decoded pixels vs GEDI L3 rh100 mean over all land), kept as superseded context:
    L3 is gridded L2A RH100 over every land cell, not the footprints the visualization drew.
Usage (from pipeline/): python -m svs.records.forest.validate"""
import json
import numpy as np
from core.log import say
from svs import globe, validate as V
from svs.config import raw_dir
from . import RECORD, SID, STILLS
from .l2b import OUT as L2B, CONCEPT

ROOT = raw_dir(SID)
CELL, MIN_SHOTS, MIN_PX, INNER = 48, 20, 20, 0.75
PASS_RHO, PASS_DIFF_M = 0.6, 5.0

def footprints():
    zs = [np.load(p) for p in sorted(L2B.glob("*.npz"))]
    return (np.concatenate([z["lat"] for z in zs]), np.concatenate([z["lon"] for z in zs]), np.concatenate([z["rh100_m"] for z in zs]), len(zs))

def cells(name, fit, lat, lon, h):
    flat = np.load(ROOT / "flat" / name.replace(".tif", ".npy")).astype(np.float32)
    H, W = flat.shape
    cx, cy, R = fit["disc"]
    v = fit["view"]
    px, py, vis = globe.forward(lat.astype(np.float64), lon.astype(np.float64), (cx, cy, R, v["lat0"], v["lon0"], v["roll"], v["distance_radii"]))
    inner = vis & (np.hypot(px - cx, py - cy) < INNER * R) & (px >= 0) & (px < W) & (py >= 0) & (py < H)
    ci, cj = (py[inner] // CELL).astype(int), (px[inner] // CELL).astype(int)
    shots = {}
    for a, b, x in zip(ci, cj, h[inner]): shots.setdefault((a, b), []).append(x)
    yy, xx = np.nonzero(np.isfinite(flat))
    pix = {}
    for a, b, x in zip(yy // CELL, xx // CELL, flat[yy, xx]): pix.setdefault((a, b), []).append(x)
    rows = [(float(np.median(pix[c])), float(np.median(s)), len(s), len(pix[c])) for c, s in shots.items()
            if len(s) >= MIN_SHOTS and len(pix.get(c, ())) >= MIN_PX]
    return rows, int(inner.sum())

def main():
    lat, lon, h, n_gran = footprints()
    fl = json.loads((ROOT / "flat.json").read_text(encoding="utf-8"))
    per, allrows = {}, []
    for name in STILLS:
        rows, n_in = cells(name, fl["stills"][name], lat, lon, h)
        d, t = np.array([r[0] for r in rows]), np.array([r[1] for r in rows])
        rho, n = V.spearman(d, t) if len(rows) >= 8 else (None, len(rows))
        per[name] = {"cells": len(rows), "footprints_inside": n_in, "spearman": rho, "median_diff_m": float(np.median(d - t)) if len(rows) else None,
                     "view_iou": fl["stills"][name]["iou"]}
        allrows += rows
    d, t = np.array([r[0] for r in allrows]), np.array([r[1] for r in allrows])
    rho, n = V.spearman(d, t)
    diff = float(np.median(d - t)) if len(d) else None
    from scipy import stats
    ks = float(stats.ks_2samp(d, t).statistic) if len(d) >= 8 else None
    old = next((c for c in json.loads((ROOT.parents[1] / "public" / "data" / "official" / RECORD / "validation.json").read_text(encoding="utf-8"))["checks"]
                if c["id"] == "a_height_hist_gedi_l3"), None) if (ROOT.parents[1] / "public" / "data" / "official" / RECORD / "validation.json").exists() else None
    src = f"GEDI02_B v002 RH100 footprints ({CONCEPT}, DOI 10.5067/GEDI/GEDI02_B.002), {n_gran} granules May 2019 – Apr 2020"
    checks = [V.check(RECORD, "a_l2b_frame_cells", "Flat decoded heights vs GEDI L2B RH100, gridded into the frame's cells (fitted globe view)",
                      kind="value", source=src, threshold=f"Spearman ≥ {PASS_RHO} and |median difference| ≤ {PASS_DIFF_M:g} m (provisional)",
                      passed=bool(rho is not None and rho >= PASS_RHO and diff is not None and abs(diff) <= PASS_DIFF_M),
                      metrics={"spearman": rho, "cells": n, "median_diff_m": diff, "median_decoded_m": float(np.median(d)) if len(d) else None,
                               "median_l2b_m": float(np.median(t)) if len(t) else None, "per_still": per, "cell_px": CELL,
                               "min_shots": MIN_SHOTS, "min_px": MIN_PX, "flat_dist": fl["flat_dist"], "bar": fl["bar"],
                               "l2b_granules": n_gran, "l2b_shots": int(len(h)),
                               "flat_share_range": [min(v["flat_share"] for v in fl["stills"].values()), max(v["flat_share"] for v in fl["stills"].values())]},
                      note="Globe views georeferenced by an orthographic/perspective fit (IoU per still); the extruded columns lean "
                           "outward a little, so the comparison is per cell, not per footprint."),
              V.check(RECORD, "b_l2b_cell_distributions", "Distributions of the matched cell medians (decoded vs L2B): KS", kind="context",
                      source=src, passed=None, metrics={"ks": ks, "cells": n})]
    if old:
        checks.append(V.check(RECORD, "c_l3_superseded", "Superseded: all decoded pixels vs GEDI L3 rh100 mean over all land (before correction 1)",
                              kind="context", source=old["source"], passed=None, metrics=old["metrics"],
                              note="L3 is gridded L2A RH100 over every land cell; the visualization drew L2B RH100 footprints, and the "
                                   "comparison had no location. Kept for the before/after record."))
    V.save(RECORD, checks)
    say(f"4950 vs L2B: rho {rho}, cells {n}, median diff {diff} m, KS {ks}; per still {per}")

if __name__ == "__main__":
    main()
