"""Method and limit sentences for docs/official/5011.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets (`docs/official/5011_assets.md`): the rule's movie is the 1920×1080 sphere view, which has no flat map; the page's "
    "Science On a Sphere movie ({movie}) is a 2:1 map of the same events and is the one decoded (override recorded). Every one of "
    "its {frames} frames was streamed through ffmpeg into memory; nothing was written to disk.",
    "Georeference: the drawn equator and tropic lines sit at {lines}° (expected 23.44, 0, −23.44); the frame's edges peak against "
    "Natural Earth coastline edges at shift {peak} px; a texture land mask scores IoU {iou} (the flat-water base map defeats a "
    "brightness mask, so the IoU is reported, not used).",
    "Marks: a pixel is lightning when min(R, G) − B > {yellow}. A flash is counted once, when its mark appears (lit now, not lit "
    "within 2 px in the previous frame); a fused mark larger than {area_max} px counts as area ÷ {median_area} (the median single "
    "mark). {marks} marks; {merged} were fused clusters.",
    "Frame times: the movie has no date and does not run at a constant rate (between anchors {rate_lo}–{rate_hi} days per frame). "
    "The marks' mean latitude per frame swings with the seasons; its maxima and minima are dated to the days on which the "
    "independent LIS/OTD monthly climatology peaks and bottoms out, the first and last active frames to the period's ends "
    "({anchors} anchors), and time is linear between them. Approximate.",
    "Window: an isolated mark stays lit for {life} frames (median), about {life_days} days at the model's rate, against the "
    "SVS text's 10-day window.",
    "Source version: the SVS page lists 'Quality Controlled LIS on ISS Science Data V1'; the checks use V3 ({v3_doi}), the "
    "current reprocessing, over 1 Mar 2017 (its first day) to 31 Jul 2023 (the movie's end); V2 and V3 both end 16 Nov 2023.",
    "View time (added 30 Oct): ISS LIS is also read as a flash rate, flashes per hour of effective view time in each box, which "
    "removes the station's uneven revisit. Per-region Spearman with rates: {rates} (counts: {counts}).",
    "The 60–90°E gap of the near-real-time plots is not in the quality-controlled data: view time there is {gap}× the mean of "
    "the neighbouring 30° bands (median over the 12 windows), so it does not explain the weak Bangladesh agreement.",
]

LIMITS = [
    "Dates are approximate (seasonal anchors), so counts per 10-day window carry timing error; the region check uses windows "
    "chosen by date before any frame was dated.",
    "Dense storms fuse marks; fused clusters are counted by area, which undercounts where marks overlap completely.",
    "ISS LIS sees ±{band}° of latitude only on orbit passes; the frames show what LIS saw, so outside its coverage there is "
    "nothing to hear.",
    "Stored at {cell_deg}° and {wps} window(s) per step to stay under the {budget_mb} MB budget; the Bangladesh box keeps every mark ({bd} marks).",
]

def slots(m, checks):
    d, g, e = m["decode"], m["georef"], checks["e_frame_times"]["metrics"]
    per = lambda k: ", ".join(f"{r} {v['spearman']:.2f}" for r, v in checks[k]["metrics"]["per_region"].items())
    gap = checks["f_gap_60_90E"]["metrics"]["median_view_ratio"]
    return {"v3_doi": "DOI 10.5067/LIS/ISSLIS/DATA114, isslis_v3_fin", "rates": per("a2_region_rates_isslis"), "counts": per("a_region_counts_isslis"),
            "gap": f"{gap:.2f}", "movie": m["movie"].rsplit("/", 1)[1], "frames": m["frame_times"]["count"],
            "lines": ", ".join(f"{x:.2f}" for x in g["graticule_lat"]), "peak": tuple(g["coast_edge_peak_px"]),
            "iou": f"{next(iter(g['iou'].values())):.3f}", "yellow": d["yellow"], "area_max": d["area_max"],
            "median_area": f"{d['median_mark_area']:g}", "marks": f"{d['marks']:,}", "merged": f"{d['merged_share']:.1%}",
            "rate_lo": f"{e['days_per_frame_range'][0]:.2f}", "rate_hi": f"{e['days_per_frame_range'][1]:.2f}", "anchors": len(e["anchors"]),
            "life": f"{e['lifetime_frames_median']:g}", "life_days": f"{e['lifetime_days_at_model_rate']:.0f}", "band": 52,
            "cell_deg": f"{m['size']['choice']['cell_deg']:g}", "wps": m["size"]["choice"]["windows_per_step"],
            "budget_mb": f"{m['size']['budget'] / 1e6:g}", "bd": f"{m['bd_events']['count']:,}"}
