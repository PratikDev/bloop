"""Method and limit sentences for docs/official/5313.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets by rule (`docs/official/5313_assets.md`): 5313's own frames are a 7680×2160 EIC cut with zooms, so its alternate "
    "versions are used: 5276's lights-only change still and annual frames (lights on black, no base map to unmix) and the "
    "change colorbar, and 5475's 2048×1024 Science On a Sphere frame for the georeference.",
    "Georeference: the 5475 frame's land base map (pixels away from its own ocean colour) against Natural Earth 1:50m land: "
    "IoU {iou} (passes at {pass_at}; shifted bounds score {best}). The 5276 still is the same world stretched to 16:9: its "
    "brightness peaks against the 5475 lights at shift {peak} (r {r_peak}).",
    "Colorbar: {cb_note}",
    "Change: chroma-mode inversion (matcher `{matcher}`, max distance {max_dist}) of pixels with brightness ≥ {min_k} (linear); "
    "{decoded} of lit pixels decode. Per {cell_deg}° cell, the brightness-weighted mean change.",
    "Annual brightness: the brightest channel of each annual frame ({years}), averaged per cell. These frames have no colorbar.",
]

LIMITS = [
    "Relative values only: the colorbar's labels are words, so the change is −1 … +1 with no unit, and the annual brightness is "
    "the picture's, not radiance.",
    "The change still is a JPEG: chroma subsampling mixes each small light with its dark neighbours, which pulls colours toward "
    "white ('no change'). Direction survives; magnitude is biased toward 0, so only {strong_cells} cells reach |change| ≥ {strong}.",
    "Most lit pixels are too dim to read a colour from: the change is known only where lights are bright enough.",
    "Validation tiles were chosen from the frame alone ({tiles}); VNP46A4 is the product the visualization was made from, so the "
    "check tests the decoding, not Black Marble.",
    "Stored at {cell_deg}° to stay under the {budget_mb} MB budget.",
]

def slots(m, checks):
    g, d = m["georef"], m["decode"]
    a = checks.get("a_direction_vnp46a4", {}).get("metrics", {})
    return {"iou": ", ".join(f"{v:.3f}" for v in g["iou"].values()), "pass_at": g["pass_at"],
            "best": "lower in every case" if g["best_is_assumed"] else "higher at least once",
            "peak": tuple(g["still_alignment"]["peak_shift_cells"]), "r_peak": f"{g['still_alignment']['r_at_peak']:.3f}",
            "cb_note": " ".join(m["colorbar"]["notes"]), "matcher": d["matcher"], "max_dist": f"{d['max_dist']:.1f}", "min_k": d["min_k"],
            "decoded": f"{d['decoded_of_lit']:.1%}", "cell_deg": f"{m['size']['choice']['cell_deg']:g}",
            "years": ", ".join(l for l in next(x for x in m["layers"] if x["id"] == "brightness")["time_labels"]),
            "strong_cells": f"{d['strong_cells']:,}", "strong": m["strong_change"], "tiles": ", ".join(a.get("tiles", [])),
            "budget_mb": f"{m['size']['budget'] / 1e6:g}"}
