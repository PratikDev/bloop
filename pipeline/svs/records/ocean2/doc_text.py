"""Method and limit sentences for docs/official/5425.md; every number is a slot filled from the record's files."""

METHOD = [
    "Camera path probed every 250 frames (dates layer by the built-in date OCR, land mask silhouettes); the steady views "
    "were named by eye from the coastline (Japan → Kuroshio, southern Africa → Agulhas, US east coast → Gulf Stream).",
    "Frames decoded per view: {frames}. Temperature and salinity inverted against their own colorbars (labels read below the "
    "strip: {ticks}); ocean = the land-mask layer's dark pixels.",
    "Checks: the frame's regional mean against MUR25 SST and SMAP RSS 8-day SSS box means on the same dates.",
]

LIMITS = [
    "Which water (report correction 3, added 31 Oct): the page says 'the flows from the surface down to 600 meters deep are all "
    "white' and only deeper flows are coloured. On SVS 5479's flat maps of the same run, the decoded temperature sits closest to "
    "NOAA WOA23 at {t_best} ({t_levels}); salinity at {s_best} ({s_levels}). The surface checks (a) are kept for the record but "
    "compare the wrong depth. The temperature and salinity layers carry no white flows (0 % white); the white flows are the beauty "
    "version's. 5479 lists no colorbars, and only {t_match} of its temperature flow pixels and {s_match} of salinity lie on 5425's "
    "bars, so the bars are not simply reused.",
    "A different ocean model at depth (added 3 Nov, `svs/records/ocean2/glorys.py`): GLORYS12 monthly means on the same 5479 "
    "frames: {glorys}. Not run: the ECCO2 same-model check (no reachable 2021–2023 mirror). "
    "Period conflict kept: the text says 2021–2023; SVS 5505's dataset entry says 13 Nov 2022 – 25 Dec 2023; the dates layer "
    "and 5479's burned-in labels run 2021–2023.",
    "No map position (perspective camera views): regional comparisons only; flow speed cannot be scaled to m/s.",
    "SVS served ≈ 20 KB/s on 29 Oct 2026, so two frames per view were decoded; map layers exist for {gridded}; the other "
    "frames (decoded before their grids were kept) give the regional numbers only.",
    "The temperature layer is drawn as flow streaks, so few pixels decode ({cov}).",
]

def depth_slots(checks):
    out = {}
    for k, a in (("temperature", "t"), ("salinity", "s")):
        c = checks.get(f"d_depth_{k}", {}).get("metrics", {})
        lv = c.get("levels", {})
        out[f"{a}_best"] = c.get("best", "n/a")
        out[f"{a}_levels"] = "; ".join(f"{n}: ρ {v['spearman']:.2f}, Δ {v['median_diff']:+.2f}" for n, v in lv.items())
        share = c.get("bar_match_share") or [0]
        out[f"{a}_match"] = f"{sum(share) / len(share):.1%}"
    g = checks.get("e_glorys12_depth", {}).get("metrics", {}).get("per_variable")
    out["glorys"] = "; ".join(f"{k} " + ", ".join(f"{n} ρ {v['spearman']:.2f} / Δ {v['median_diff']:+.2f}" for n, v in r["levels"].items())
                              for k, r in g.items()) if g else "not run yet"
    return out

def slots(m, checks):
    t = checks["a_temperature_mur"]["metrics"]["per_current"]
    cov = ", ".join(f"{v}: {sum(x['frame_coverage'] for x in r) / len(r):.1%}" for v, r in t.items())
    gridded = ", ".join(f"{l['view']} {l['time_labels']}" for l in m["layers"] if l["id"].startswith("temperature")) or "no frame"
    return {**depth_slots(checks), "gridded": gridded, "frames": ", ".join(f"{v} {list(f)}" for v, f in m["view_frames"].items()),
            "ticks": "; ".join(f"{k} {', '.join(x['text'] for x in cb['ticks'])}" for k, cb in m["colorbars"].items()), "cov": cov}
