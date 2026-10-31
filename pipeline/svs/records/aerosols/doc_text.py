"""Method and limit sentences for docs/official/5669.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets (`docs/official/5669_assets.md`): the largest still ≤ 7680 px wide ({size}) and its key; 5572 / 5552 are the animated "
    "2024 versions of the same rendering and are not used for values.",
    "Key: four swatches read from the key image ({keys}); each is named by matching its hue to the colour words of the SVS text.",
    "Georeference: the still is the whole globe stretched to 16:9. {precision} of its bare grey base-map pixels fall on Natural "
    "Earth land at the full-globe bounds ({best} at ±1° and ±2°).",
    "Type: CIELAB hue nearest a key colour, for pixels whose chroma is above the open ocean's 99th percentile ({c_floor}); pale "
    "pixels brighter than the ocean's 99th-percentile lightness ({l_floor}) in the sea-salt hue sector are sea salt. Density: "
    "lightness above the ocean's median, 0–1, relative. Shares of all pixels: {shares}.",
]

LIMITS = [
    "Same model first (added 30 Oct, report correction 8): against GEOS-FP tavg3_2d_aer_Nx — the model the frames were made "
    "from — the type pattern agrees no better than against MERRA-2 (Spearman per type, GEOS-FP / MERRA-2: {same_vs_family}). "
    "5572's label-free 2:1 frames (4 frames, Aug–Sep 2024) against GEOS-FP at their own times: {twin}. The weak dust and smoke "
    "agreement is not a model mismatch: hue alone does not separate the types where they mix.",
    "The key has no numbers: density is relative, and the record never states an optical depth.",
    "Colours mix where types overlap and where a faint tint sits on the dark ocean; the hue rule assigns each pixel one type. "
    "The hand-label confusion check measures that error once {labels_needed} labels per class exist ({labels_now}).",
    "The comparison is with MERRA-2, a different model in the GEOS family: GEOS-FP's own archive for the day has rolled off.",
    "Smoke and sulfate both play on the tone synth an octave apart (the app has three synth kinds for four types).",
]

def slots(m, checks):
    d = m["decode"]
    lab = checks.get("c_hand_labels", {}).get("metrics", {})
    fp, mr = checks["a0_type_geosfp"]["metrics"]["per_type"], checks["a_type_merra2"]["metrics"]["per_type"]
    tw = checks["a3_5572_type_geosfp"]["metrics"]["pooled"]
    same_vs_family = "; ".join(f"{t} {fp[t]['spearman']:.2f} / {mr[t]['spearman']:.2f}" for t in fp)
    twin = "; ".join(f"{t} {v['spearman']:.2f}" for t, v in tw.items())
    return {"same_vs_family": same_vs_family, "twin": twin, "size": "×".join(map(str, d["size"])), "keys": "; ".join(f"{t} {tuple(k['rgb'])}" for t, k in d["keys"].items()),
            "precision": f"{next(iter(m['georef']['iou'].values())):.1%}", "best": "lower" if m["georef"]["best_is_assumed"] else "higher at least once",
            "c_floor": f"{d['floor']['chroma_p99']:.1f}", "l_floor": f"{d['floor']['light_p99']:.1f}",
            "shares": ", ".join(f"{t} {v:.1%}" for t, v in d["shares"].items()) + f", none {d['none_share']:.1%}",
            "labels_needed": 200, "labels_now": f"{lab.get('labels', 0)} so far" if lab else "none yet"}
