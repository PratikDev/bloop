"""Method and limit sentences for docs/official/5425.md; every number is a slot filled from the record's files."""

METHOD = [
    "Camera path probed every 250 frames (dates layer by the built-in date OCR, land mask silhouettes); the steady views "
    "were named by eye from the coastline (Japan → Kuroshio, southern Africa → Agulhas, US east coast → Gulf Stream).",
    "Frames decoded per view: {frames}. Temperature and salinity inverted against their own colorbars (labels read below the "
    "strip: {ticks}); ocean = the land-mask layer's dark pixels.",
    "Checks: the frame's regional mean against MUR25 SST and SMAP RSS 8-day SSS box means on the same dates.",
]

LIMITS = [
    "No map position (perspective camera views): regional comparisons only; flow speed cannot be scaled to m/s.",
    "SVS served ≈ 20 KB/s on 29 Oct 2026, so two frames per view were decoded; map layers exist for {gridded}; the other "
    "frames (decoded before their grids were kept) give the regional numbers only.",
    "The temperature layer is drawn as flow streaks, so few pixels decode ({cov}).",
]

def slots(m, checks):
    t = checks["a_temperature_mur"]["metrics"]["per_current"]
    cov = ", ".join(f"{v}: {sum(x['frame_coverage'] for x in r) / len(r):.1%}" for v, r in t.items())
    gridded = ", ".join(f"{l['view']} {l['time_labels']}" for l in m["layers"] if l["id"].startswith("temperature")) or "no frame"
    return {"gridded": gridded, "frames": ", ".join(f"{v} {list(f)}" for v, f in m["view_frames"].items()),
            "ticks": "; ".join(f"{k} {', '.join(x['text'] for x in cb['ticks'])}" for k, cb in m["colorbars"].items()), "cov": cov}
