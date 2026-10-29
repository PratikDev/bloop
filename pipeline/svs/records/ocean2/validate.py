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
    V.save(RECORD, checks)
    say(f"5425: {[(c['id'], c['metrics'].get('spearman_all_frames'), c['metrics'].get('median_difference')) for c in checks]}")

if __name__ == "__main__":
    main()
