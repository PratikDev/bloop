"""Export 3912 under the data contract: public/data/official/currents_3912/. Layers: SST (°C, from the frames), pattern
drift u/v (km/day; how the drawn eddies and meanders move, not water speed), streak axis (degrees from north, 0–180).
The size budget picks the (space, time) aggregation; the manifest records the choice and every number behind it.
Usage (from pipeline/): python -m svs.records.currents.export"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import export, frames, georef
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from core.places import BAY_BBOX
from . import MIN_COV, SID, STEP, grids

ROOT = raw_dir(SID)
RECORD = "currents_3912"
OPTIONS = [(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 7), (4, 1), (4, 3), (4, 7)]   # (0.5° cells per output cell, days)
DRIFT_STEP, AXIS_STEP = 0.01, 0.1                     # km/day and degrees: finer than the flow and axis resolve
PLAY_STEPS_PER_SECOND = 3                             # design choice: the year plays in about half a minute

def main():
    g = grids()
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    times = [dt.datetime.fromisoformat(t.replace("Z", "+00:00")) for t in g["times"]]
    readers = {"sst": lambda a, b: np.where(g["sst_cov"][a:b] >= MIN_COV, g["sst"][a:b], np.nan),
               "drift_u": lambda a, b: np.asarray(g["drift_u"][a:b]), "drift_v": lambda a, b: np.asarray(g["drift_v"][a:b]),
               "axis": lambda a, b: np.where(g["axis_w"][a:b] > 0, (np.degrees(np.arctan2(g["axis_s2"][a:b], g["axis_c2"][a:b])) / 2) % 180, np.nan)}
    T_all = len(times)
    cubes = {k: (lambda r: lambda f, tf: common.stream_reduce(r, T_all, f, tf))(r) for k, r in readers.items()}
    steps = {"sst": common.colorbar_step(dec["colorbar"]), "drift_u": DRIFT_STEP, "drift_v": DRIFT_STEP, "axis": AXIS_STEP}
    (f, tf), tried = common.budget_search(cubes, OPTIONS, codecs={k: ("linear", v) for k, v in steps.items()})
    deg = 0.5 * f
    say(f"budget choice: {deg}° cells, {tf}-day means; tried {tried}")
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    T = len(times) - len(times) % tf
    t_out = [times[i] for i in range(0, T, tf)]
    bounds = (-180, -90, 180, 90)
    reduce = lambda c: c(f, tf)
    meta_layers = []
    units = {"sst": "°C", "drift_u": "km/day", "drift_v": "km/day", "axis": "degrees from north (0–180)"}
    labels = {"sst": "Sea surface temperature (model, read from the frame colours)",
              "drift_u": "Pattern drift, eastward (how fast the drawn eddies and meanders move; not water speed)",
              "drift_v": "Pattern drift, northward (how fast the drawn eddies and meanders move; not water speed)",
              "axis": "Current axis from the drawn streaks (direction modulo 180°)"}
    from .decode import colorbar_3912
    shown = {"sst": common.display(colorbar_3912()[0])}
    for name, cube in cubes.items():
        if name in shown: labels_extra = {"display": shown[name]}
        else: labels_extra = {}
        meta_layers.append(export.layer(RECORD, name, reduce(cube), t_out, bounds, units[name], label=labels[name], step=steps[name],
                                        aggregation=f"mean of {f}×{f} 0.5° cells and {tf} daily frames", **labels_extra))
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    common.layer_status(meta_layers, val["checks"], {"sst": "a_sst_mur", "drift_u": "b_direction_oscar", "drift_v": "b_direction_oscar",
                                                     "axis": "b_direction_oscar"})
    sp = np.hypot(reduce(cubes["drift_u"]), reduce(cubes["drift_v"]))
    all_times = sorted(frames.times_from_list((ROOT / "dates.txt").read_text(encoding="utf-8")).values())
    prov = common.provenance(RECORD, [SID], "model", (all_times[0], all_times[-1]))      # the visualization's own span
    man = {"record": RECORD, "app_title": "Currents & SST (model, 2007–08)", **prov,
           "frame_times": {"method": "date-list", "approximate": False, "source": "flat_ecco2_dates.txt (SVS)",
                           "subsample_every": STEP, "subsample_hours": (times[1] - times[0]).total_seconds() / 3600, "count": len(times)},
           "georef": {"projection": "equirectangular", "bounds": [-180, -90, 180, 90], "pass_at": georef.IOU_PASS,
                      "shifts_deg": list(georef.SHIFTS_DEG),
                      "iou": {k: round(v["iou"], 4) for k, v in dec["georef"].items()}, "pass": all(v["pass"] for v in dec["georef"].values()),
                      "best_is_assumed": all(v["best_is_assumed"] for v in dec["georef"].values())},
           "colorbar": dec["colorbar"], "decode": {k: dec[k] for k in ("matcher", "mode", "max_dist", "min_k", "coverage_median", "coverage_range", "uncertain_values", "farneback")},
           "layers": meta_layers, "voices": {"sst": "ocean", "drift_speed": "currentDrift"},
           "play": [common.option("sst_drift", "Sea surface temperature, with the drift as clicks", "sst",
                                  [("ocean", ["sst"]), ("currentDrift", ["drift_u", "drift_v"])],
                                  ((BAY_BBOX[1] + BAY_BBOX[3]) / 2, (BAY_BBOX[0] + BAY_BBOX[2]) / 2), PLAY_STEPS_PER_SECOND)],
           "drift_speed_range_km_day": [float(np.nanpercentile(sp, 1)), float(np.nanpercentile(sp, 99))],
           "confidence": {"sst_min_cell_coverage": MIN_COV, "streak_coverage_median": dec["coverage_median"]},
           "validation": [{k: c[k] for k in ("id", "title", "kind", "pass", "threshold")} for c in val["checks"]],
           "size": {"choice": {"cell_deg": deg, "days": tf}, "tried": tried},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
