"""Method and limit sentences for docs/official/4960.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets (`docs/official/4960_assets.md`): {n} of the 3840×2160 frames, evenly spaced, each with its frame of the date-only "
    "layer; dates by the built-in date OCR (checked by eye on 20 frames). The dates read are {first} to {last}: the 2021 in the "
    "frame names is the render date.",
    "Transport: the blue shading has no colorbar, so relative transport = (B − R) / 255; the river is the Otsu-thresholded "
    "shading; land = green-dominant saturated pixels; contact = land within 5 px of the river.",
    "Check: MERRA-2 M2T1NXINT hourly vapour transport over the US west coast box {box} for every day in the span.",
    "Second reanalysis (`svs/records/river/era5.py`): ERA5 hourly vertical integrals of water vapour flux (C3S, CC-BY) over "
    "the same box and span, the same rules; ERA5 and MERRA-2 agree with each other (hourly ρ {e5m2:.2f}), so the frames' "
    "weak contact ranking (ρ {e5rho:.2f} vs ERA5) is not one reanalysis's quirk.",
]

LIMITS = [
    "Relative values only, and no map position (perspective 3D views): landfall latitude cannot be measured.",
    "The narrated movie revisits times between scenes, so movie order is not time order.",
]

def slots(m, checks):
    t = checks["a_landfall_timing_merra2"]["metrics"]
    dates = sorted(r["time"] for r in m["rows"] if r["time"])
    return {"n": len(m["rows"]), "first": dates[0][:10], "last": dates[-1][:10], "box": tuple(t["box"]),
            "e5m2": checks["f_era5_vs_merra2"]["metrics"]["spearman"], "e5rho": checks["e_contact_rank_era5"]["metrics"]["spearman"]}
