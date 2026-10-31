"""Method and limit sentences for docs/official/4950.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets (`docs/official/4950_assets.md`): the four 3840×2160 print TIFs of the global view with its burned-in colorbar.",
    "Colorbar, read from each frame: ticks {ticks}; scale {scale}, {ppm} px per metre. {notes} Of the page's three colorbar "
    "files (0–40, 0–50, 0–75 m), the stills carry the {bar} bar: their own scale spans {span} m, as the 0–50 m file does "
    "(0–40 m spans 43 m, 0–75 m spans 81 m).",
    "Height (layer): chroma-mode inversion of land pixels (the globe is lit, so brightness follows the light), max distance "
    "{max_dist}; {share} of globe land pixels decode.",
    "Height (validation, added 30 Oct): flat, unshaded pixels only — colours within RGB distance {flat_dist} of the colorbar "
    "itself, i.e. no lighting change ({flat_share} of land pixels).",
    "Georeference for validation: each still's globe is fitted as a perspective view (circle, then sub-camera point, roll and "
    "camera distance by Natural Earth land IoU in the inner disc): IoU {ious}.",
    "Check: GEDI L2B RH100 footprints (GEDI02_B v002, {granules} granules, {shots} quality shots, May 2019 – Apr 2020; the "
    "source SVS names: dataset 'Relative Height', 'derived from the L2B LIDAR metric RH100'), projected into each still and "
    "gridded with the flat pixels into {cell}-px cells.",
]

LIMITS = [
    "Pattern only: over all four stills the flat heights do not meet the check (Spearman {rho}, median difference {diff} m, "
    "{cells} cells). Per still: {per}. Where the globe fit is good (IoU ≥ 0.9) heights agree within a few metres; where it is "
    "poor they do not — the georeference of a 3D view, not the colour decode, limits this check (an observation, not a pass).",
    "Before (superseded): all decoded pixels vs GEDI L3 over all land, no location: median {mf} m vs {mg} m, KS {ks}.",
    "No map position for the layer: the needle moves across the picture, not across the Earth.",
]

def slots(m, checks):
    cb, a, c = m["colorbar"], checks["a_l2b_frame_cells"]["metrics"], checks["c_l3_superseded"]["metrics"]
    fl = [s for s in a["per_still"].values()]
    return {"ticks": ", ".join(t["text"] for t in cb["ticks"]), "scale": cb["scale"], "ppm": f"{cb.get('px_per_unit', 0):.2f}",
            "notes": " ".join(cb["notes"]), "bar": m["bar"], "span": f"{cb['value_range'][1] - cb['value_range'][0]:.1f}",
            "max_dist": m["decode"]["max_dist"], "share": f"{c['decoded_share_of_globe_land']:.1%}", "flat_dist": a["flat_dist"],
            "flat_share": "–".join(f"{x:.1%}" for x in a["flat_share_range"]), "ious": ", ".join(f"{s['view_iou']:.2f}" for s in fl),
            "granules": a["l2b_granules"], "shots": f"{a['l2b_shots']:,}", "cell": a["cell_px"], "rho": f"{a['spearman']:.2f}", "diff": f"{a['median_diff_m']:+.1f}",
            "cells": a["cells"], "per": "; ".join(f"IoU {s['view_iou']:.2f}: ρ {s['spearman']:.2f}, {s['median_diff_m']:+.1f} m ({s['cells']} cells)" for s in fl),
            "mf": f"{c['median_decoded_m']:.1f}", "mg": f"{c['median_l3_m']:.1f}", "ks": f"{c['ks']:.2f}"}
