"""Validate 5425 regionally (no thresholds: regional statistics, reported): per current and decoded frame, the frame's mean
over the visible ocean against the current box's mean on the same date, for temperature (MUR25) and salinity (SMAP RSS
8-day V5): differences per frame and current, and Spearman over all frames. Flow: not measured (no georeference, so the
picture's motion has no scale; OSCAR has nothing to be compared with).
Usage (from pipeline/): python -m svs.records.ocean2.validate"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import cmr, validate as V
from svs.config import raw_dir
from . import CURRENTS, SID
from .truth import SOURCES, box_mean

ROOT = raw_dir(SID)
RECORD = "ocean2_5425"
LAYER_SOURCE = {"temperature": "mur", "salinity": "smap"}

def main():
    views = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))["views"]
    checks = []
    for layer, src in LAYER_SOURCE.items():
        per, f_all, t_all = {}, [], []
        for view, rows in views.items():
            per[view] = []
            for r in rows:
                day = dt.date.fromisoformat(r["date"])
                t = box_mean(src, day, CURRENTS[view], view)
                f = r[layer]["mean"]
                d = None if f is None or t["mean"] is None else f - t["mean"]
                per[view].append({"date": r["date"], "frame": f, "truth": t["mean"], "difference": d, "frame_coverage": r[layer]["coverage"],
                                  "mode": r[layer]["mode"], "granule": t["granule"], **({"gap": t["gap"]} if t.get("gap") else {})})
                if d is not None: f_all.append(f); t_all.append(t["mean"])
        rho, n = V.spearman(f_all, t_all)
        diffs = [x["difference"] for v in per.values() for x in v if x["difference"] is not None]
        checks.append(V.check(RECORD, f"a_{layer}_{src}", f"{layer.capitalize()}: frame regional mean vs {src.upper()} box mean, same dates",
                              kind="model-vs-obs", source=f"{SOURCES[src][1]} ({SOURCES[src][0]})", passed=None,
                              metrics={"spearman_all_frames": rho, "n": n, "median_difference": float(np.median(diffs)) if diffs else None,
                                       "per_current": per},
                              note="Regional only: the views are perspective shots, so the frame mean covers what the camera sees, the box a fixed area."))
        cmr.citation(SOURCES[src][0])
    checks.append(V.check(RECORD, "c_flow_oscar", "Flow speed vs OSCAR", kind="none", passed=None,
                          metrics={"reason": "no georeference: the picture's motion has no physical scale"}))
    tw = raw_dir(5479) / "twin.json"
    if tw.exists():                                                    # report correction 3: which water do the colours show?
        t = json.loads(tw.read_text(encoding="utf-8"))
        for k, d in t["depth"].items():
            checks.append(V.check(RECORD, f"d_depth_{k}", f"5479 flat maps: {k} vs surface, 600 m and 1000 m (which water the colours describe)",
                                  kind="model-vs-obs", source="MUR25 / SMAP RSS (surface); NOAA WOA23 1991–2020 annual means at 600 and 1000 m",
                                  passed=None, metrics={"levels": d["levels"], "best": d["best"],
                                                        "bar_match_share": [r[k]["bar_match_share_of_flow"] for r in t["frames"]]},
                                  note="Independent observations (a climatology for depth). The page: flows above 600 m are white, "
                                       "colours are 600 m and deeper; only the pixels on 5425's bars decode (5479 lists no bars)."))
    checks.append(V.check(RECORD, "e_glorys12_depth", "GLORYS12 (Copernicus Marine) at the matching depth", kind="none", passed=None,
                          metrics={"reason": "needs a Copernicus Marine account: COPERNICUSMARINE_SERVICE_USERNAME and _PASSWORD in .env.local"}))
    checks.append(V.check(RECORD, "f_ecco2_same_model", "ECCO2 (the source model) at depth", kind="none", passed=None,
                          metrics={"reason": "mirrors retried 31 Oct 2026: APDRC's ECCO2 path returns 404; data.nas.nasa.gov/ecco lists the "
                                             "LLC90–LLC4320 runs only (no 2021–2023 ECCO2 output found); ECCO Drive did not respond"}))
    for c in checks:
        if c["id"] in ("a_temperature_mur", "a_salinity_smap"):
            c["note"] = "Wrong depth (report correction 3): the colours show water at 600 m and deeper, so a surface comparison is kept for the record, not as evidence."
    V.save(RECORD, checks)
    say(f"5425: {[(c['id'], c['metrics'].get('spearman_all_frames'), c['metrics'].get('median_difference')) for c in checks]}")

if __name__ == "__main__":
    main()
