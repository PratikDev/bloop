"""Method and limit sentences for docs/official/5196.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets (`docs/official/5196_assets.md`, `5436_assets.md`): 5196's frames are globe views; its Science On a Sphere version "
    "5436 has the CO2 volume alone as 8192×4096 EXR with alpha, the Earth surface alone, a per-frame date file and the "
    "colorbar. {frames} volume frames of {total}, evenly spaced, were streamed and deleted.",
    "Colorbar: labels {ticks} ppm; colour and opacity separated from the checkerboard drawn under the strip (P = α·C + (1 − α)·B "
    "with the two checker backgrounds). The colour is fully opaque from {plume} ppm.",
    "Values: each pixel un-premultiplied, normalised by its brightest channel (the render's lighting scales brightness) and "
    "matched in chroma mode. A volume render averages a column, so a value is the opacity-weighted ppm along the view.",
    "Georeference: the surface layer's land against Natural Earth: IoU {iou} ({best} at every shift; winter snow and sea ice "
    "are white like land).",
    "Plumes: pixels at or above {plume} ppm; area and edge length per frame (km, cos-latitude).",
]

LIMITS = [
    "Relative values from a model nature run; not measurements.",
    "Not invertible: {spans} ppm (the colorbar's white end, and a fold). Cells in the white end are stored as ≤ {white_top} ppm.",
    "Opacity below about 420 ppm is read from a checkerboard with cell-to-cell shading, so it is uncertain; it weights the "
    "column, not the matched colour.",
]

def slots(m, checks):
    a = checks["a_synthetic_round_trip"]["metrics"]
    return {"frames": m["frame_times"]["count"], "total": m["frame_times"]["of"], "ticks": ", ".join(t["text"] for t in m["colorbar"]["ticks"]),
            "plume": f"{m['decode']['plume_ppm']:.1f}", "iou": f"{next(iter(m['georef']['iou'].values())):.3f}",
            "best": "lower" if m["georef"]["best_is_assumed"] else "higher at least once",
            "spans": ", ".join(f"{s[0]:.0f}–{s[1]:.0f}" for s in a["uncertain_spans_ppm"]), "white_top": f"{a['uncertain_spans_ppm'][0][1]:.0f}"}
