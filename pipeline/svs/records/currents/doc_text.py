"""Method and limit sentences for docs/official/3912.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets by rule (`docs/official/3912_assets.md`): the 2048×1024 `orig` frame set, the SST colorbar image and SVS's "
    "per-frame date list (method a). Every {step}th frame was fetched ({frames} frames, one per {hours} h); raw frames deleted after decoding.",
    "Georeference: equirectangular −180…180 / −90…90 assumed and checked against Natural Earth 1:50m land: IoU {iou} (passes at "
    "{pass_at}); the same bounds shifted by ±{shifts}° scored {best}.",
    "Colorbar: OCR read the labels {ticks}; scale {scale}, {px_per_unit} px per °C; the SVS caption's stated range {stated} °C is the "
    "cross-check (strip ends decode to {ends}).",
    "SST: the streaks are the colorbar's colours with the grey floor removed and dimmed, so values come from hue (mode `{mode}`, "
    "matcher `{matcher}`, max distance {max_dist}, minimum chroma {min_k}). Between streaks stays empty: median {coverage} of ocean "
    "pixels lie on streaks; a 1° cell needs {min_cov} of its pixels on streaks.",
    "Motion: OpenCV Farnebäck between consecutive daily frames (pattern drift: how the drawn eddies and meanders move, not the "
    "water) and the structure-tensor streak axis (the current's axis, direction modulo 180°).",
]

LIMITS = [
    "ECCO2 is a model: SST differences against MUR include real model–observation differences.",
    "The pattern drift's 99th percentile is {drift_p99} km/day ({drift_p99_ms} m/s), while OSCAR's median in the strong-current "
    "cells is {oscar_strong} m/s: the drift is the pattern's speed, not the water's (motion along a long uniform streak is invisible "
    "to optical flow). The click voice says so.",
    "Direction from the streaks is an axis; its sign comes from the pattern drift, which follows the current only where features "
    "move downstream.",
    "Stored at {cell_deg}° and {days}-day means to stay under the {budget_mb} MB budget.",
]

def slots(m, checks):
    cb = m["colorbar"]
    return {"step": m["frame_times"]["subsample_every"], "hours": f"{m['frame_times']['subsample_hours']:.2f}", "frames": m["frame_times"]["count"],
            "shifts": "° / ±".join(f"{s:g}" for s in m["georef"]["shifts_deg"]), "min_cov": f"{m['confidence']['sst_min_cell_coverage']:.0%}",
            "stated": "–".join(f"{v:g}" for v in cb["fit"].get("stated_range", [])), "budget_mb": f"{m['size']['budget'] / 1e6:g}",
            "iou": ", ".join(f"{v:.3f}" for v in m["georef"]["iou"].values()), "pass_at": m["georef"]["pass_at"],
            "best": "lower in every case" if m["georef"]["best_is_assumed"] else "higher at least once",
            "ticks": ", ".join(t["text"] for t in cb["ticks"]), "scale": cb["scale"], "px_per_unit": f"{cb.get('px_per_unit', 0):.2f}",
            "ends": " to ".join(f"{v:.2f} °C" for v in cb["value_range"]), "mode": m["decode"]["mode"], "matcher": m["decode"]["matcher"],
            "max_dist": m["decode"]["max_dist"], "min_k": m["decode"]["min_k"], "coverage": f"{m['decode']['coverage_median']:.1%}",
            "cell_deg": m["size"]["choice"]["cell_deg"], "days": m["size"]["choice"]["days"],
            "drift_p99": f"{m['drift_speed_range_km_day'][1]:.1f}", "drift_p99_ms": f"{m['drift_speed_range_km_day'][1] / 86.4:.3f}",
            "oscar_strong": _oscar_strong(checks)}

def _oscar_strong(checks):
    regions = (checks.get("b_direction_oscar") or {}).get("metrics", {}).get("regions", {})
    vals = [r["median_oscar_speed_m_s"] for r in regions.values() if r.get("median_oscar_speed_m_s") is not None]
    return f"{sorted(vals)[len(vals) // 2]:.2f}" if vals else "not available"
