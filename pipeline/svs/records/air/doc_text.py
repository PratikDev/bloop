"""Method and limit sentences for docs/official/5533.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets by rule (`docs/official/5533_assets.md`): 5533 has no flat 2:1 frame set, so the 2048×1024 species layers of its "
    "Science On a Sphere version 5518 are used ({species}), each with its own colorbar; the banded composite is not used.",
    "Frames: {frames} per species. One frame in {full_every} was fetched whole; for the others only the PNG prefix holding the rows down "
    "to the Bangladesh box was fetched and decoded (bit-identical to a full decode). Raw frames deleted after decoding.",
    "Frame times: {time_method}: {time_source}. The GEOS-CF v1 hourly axis has exactly one step "
    "per frame over the same span, which supports the mapping.",
    "Georeference: equirectangular assumed; coastline outlines found as thin dark lines on all four species, ocean flood-filled from "
    "fixed seeds, IoU against Natural Earth 1:50m land {iou} (passes at {pass_at}; 1-px outline growth gives {iou_grow}); the same "
    "bounds shifted by ±{shifts}° scored {best}.",
    "Colorbars (OCR, labels and scale): {bars}.",
    "Colour model per species, chosen by rule on a frame's own colours: {modes}.",
    "Opacity ramps (O3, NOx): learned as a monotone curve from colours whose value is identifiable, then frozen; below the curve's "
    "lowest opacity a pixel is 'below range': {ramps}.",
    "Outputs: a global daily layer per species ({cell_deg}° cells, {days}-day means of the {full_every}-hourly frames) and the "
    "Bangladesh box ({box}) at native resolution for every hourly frame.",
]

LIMITS = [
    "GEOS-CF is a model: these are model values, not measurements.",
    "Frame times are approximate (linear over the stated period); the validation pairs each frame with the hourly mean that starts "
    "at its time and reports ±1 h as sensitivity.",
    "The SVS page links the GEOS-CF v2 datashare, but no public v2 archive covers the period (the v2 replay store starts {v2_start}); "
    "the same-model check uses v1.",
    "O3 and NOx below their colorbars' visible range are censored, not decoded: decoded share {cover_o3} (O3) and {cover_nox} (NOx) "
    "of pixels; below range {below_o3} and {below_nox}.",
    "The CO and NOx colorbars are not uniform scales (CO: evenly spaced ticks labelled {co_labels}; NOx: labels not on the tick "
    "marks), so values between labels are interpolated ({co_interp} for CO, {nox_interp} for NOx).",
    "Ground comparison: of the {ground_all} PM2.5 sensors within {radius_km} km of Dhaka, {ground_n} had data in the period.",
]

def slots(m, checks):
    sp = m["species"]
    pct = lambda x: f"{x:.1%}"
    g = (checks.get("b_pm25_dhaka_ground") or {}).get("metrics", {})
    return {"species": ", ".join(v["label"] for v in sp.values()), "frames": m["frame_times"]["count"],
            "full_every": m["frame_times"]["full_every"], "time_method": m["frame_times"]["method"], "time_source": m["frame_times"]["source"],
            "box": "lat {1:g}–{3:g}, lon {0:g}–{2:g}".format(*next(l["grid"]["bounds"] for l in m["layers"] if l["id"].endswith("_bd"))),
            "v2_start": m["geoscf_v2_replay_start"], "co_labels": ", ".join(t["text"] for t in sp["co"]["colorbar"]["ticks"]),
            "co_interp": sp["co"]["colorbar"]["fit"].get("segment_interp", "—"), "nox_interp": sp["nox"]["colorbar"]["fit"].get("segment_interp", "—"),
            "ground_all": g.get("sensors_listed", "?"), "radius_km": f"{g.get('radius_m', 0) / 1000:g}",
            "iou": ", ".join(f"{v:.3f}" for v in m["georef"]["iou"].values()),
            "iou_grow": ", ".join(f"{v:.3f}" for v in m["georef"]["iou_outline_grow1"].values()), "pass_at": m["georef"]["pass_at"],
            "shifts": "° / ±".join(f"{s:g}" for s in m["georef"]["shifts_deg"]),
            "best": "lower in every case" if m["georef"]["best_is_assumed"] else "higher at least once",
            "bars": "; ".join(f"{v['label']}: {', '.join(t['text'] for t in v['colorbar']['ticks'])} ({v['colorbar']['scale']})" for v in sp.values()),
            "modes": "; ".join(f"{v['label']}: {v['mode']} ({pct(v['evidence']['exact_share_within_max_dist'])} of pixels on the colorbar)" for v in sp.values()),
            "ramps": "; ".join(f"{v['label']}: opaque from {v['ramp']['alpha_full_from_value']:.3g}, below range under {v['ramp']['below_range_bound']:.3g} {v['unit']}"
                               for v in sp.values() if v.get("ramp")),
            "cell_deg": m["size"]["choice"]["cell_deg"], "days": m["size"]["choice"]["days"],
            "cover_o3": pct(sp["o3"]["coverage"]["decoded_median"]), "cover_nox": pct(sp["nox"]["coverage"]["decoded_median"]),
            "below_o3": pct(sp["o3"]["coverage"]["below_range_median"]), "below_nox": pct(sp["nox"]["coverage"]["below_range_median"]),
            "ground_n": g.get("stations_with_data", "none")}
