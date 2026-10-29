"""Validate 4950 against NASA GEDI L3 gridded canopy height (GEDI03 rh100 mean, 1 km EASE-Grid 2.0, Apr 2019 – Oct 2020,
ORNL DAAC; the closest L3 period to the visualization's Apr 2019 – Apr 2020). The globe view has no georeference, so the
check is distributional (fixed before the L3 file was read): the histogram of decoded heights (1 m bins over the
colorbar's range) against the histogram of every valid L3 cell (equal-area grid, so area-weighted) clipped to the same
range: two-sample KS statistic from the binned CDFs and the difference of medians. No threshold: reported.
The L3 GeoTIFF (LZW) is read once into a memory map in data_raw/4950/truth_raw/ and reduced to a histogram.
Usage (from pipeline/): python -m svs.records.forest.validate"""
import json
import numpy as np
from core.log import say
from svs import cmr, validate as V
from svs.config import raw_dir
from . import L3, RECORD, SID

ROOT = raw_dir(SID)

def l3_hist(edges):
    out = ROOT / "truth" / "l3_hist.npz"
    if out.exists(): return np.load(out)["counts"]
    import tifffile
    src = ROOT / "truth_raw" / L3[1].rsplit("/", 1)[1]
    a = tifffile.imread(src, out=str(ROOT / "truth_raw" / "l3.memmap"))
    counts = np.zeros(len(edges) - 1)
    for r in range(0, a.shape[0], 1024):
        v = np.asarray(a[r:r + 1024]).ravel(); v = v[v > -9000]
        counts += np.histogram(np.clip(v, edges[0], edges[-1] - 1e-6), bins=edges)[0]
    (ROOT / "truth").mkdir(exist_ok=True)
    np.savez_compressed(out, counts=counts, edges=edges, valid_cells=counts.sum())
    del a; (ROOT / "truth_raw" / "l3.memmap").unlink()
    cmr.citation(L3[0])
    return counts

def median_of(counts, edges):
    c = np.cumsum(counts) / counts.sum()
    i = int(np.searchsorted(c, 0.5))
    lo, hi, below = edges[i], edges[i + 1], (c[i - 1] if i else 0.0)
    return float(lo + (0.5 - below) / max(c[i] - below, 1e-12) * (hi - lo))

def main():
    h = np.load(ROOT / "hist.npz"); f, edges = h["counts"].astype(float), h["edges"]
    g = l3_hist(edges)
    cf, cg = np.cumsum(f) / f.sum(), np.cumsum(g) / g.sum()
    ks = float(np.max(np.abs(cf - cg)))
    mf, mg = median_of(f, edges), median_of(g, edges)
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    checks = [V.check(RECORD, "a_height_hist_gedi_l3", "Decoded heights vs GEDI L3 canopy height (histograms, 1 m bins)", kind="value",
                      source="GEDI L3 Gridded Land Surface Metrics V2, GEDI03 rh100 mean 2019108–2020287 (ORNL DAAC)", passed=None,
                      metrics={"ks": ks, "median_decoded_m": mf, "median_l3_m": mg, "median_difference_m": mf - mg,
                               "decoded_pixels": int(f.sum()), "l3_cells": int(g.sum()),
                               "decoded_share_of_globe_land": float(sum(s["decoded_pixels"] for s in dec["stills"].values()) /
                                                                    sum(s["globe_land_pixels"] for s in dec["stills"].values()))},
                      note="Same mission (GEDI); globe view, so no per-pixel comparison. The lit 3D render decodes mostly where "
                           "columns face the light, which favours tall canopy.")]
    V.save(RECORD, checks)
    np.savez_compressed(ROOT / "hist_compare.npz", decoded=f, l3=g, edges=edges)
    say(f"4950: KS {ks:.3f}; median decoded {mf:.1f} m vs L3 {mg:.1f} m (diff {mf - mg:+.1f}); decoded {checks[0]['metrics']['decoded_share_of_globe_land']:.1%} of globe land")

if __name__ == "__main__":
    main()
