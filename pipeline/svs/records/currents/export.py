"""Export 3912 under the data contract: public/data/official/currents_3912/. Layers: SST (°C, from the frames; cells
mostly at the colorbar's bottom are written as 'at or below 0 °C', team decision A6), NASA OSCAR surface currents u/v
(m/s, the currents voice, team decision A3) and the drawn streaks' pattern drift u/v (km/day; visual texture, not water
speed). The size budget picks the (space, time) aggregation; the manifest records the choice and every number behind it.
Usage (from pipeline/): python -m svs.records.currents.export"""
import datetime as dt, json
import numpy as np
from core.log import say
from svs import cmr, export, frames, georef
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from core.places import BAY_BBOX
from . import MIN_COV, SID, STEP, grids, limit_C, sst_at_limit, sst_cells, sst_floor
from .oscar import COLLECTION, OUT as OSCAR_DIR

ROOT = raw_dir(SID)
RECORD = "currents_3912"
OPTIONS = [(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 7), (4, 1), (4, 3), (4, 7)]   # (0.5° cells per output cell, days)
DRIFT_STEP, OSCAR_STEP = 0.01, 0.001                  # km/day and m/s: finer than the flow and OSCAR resolve
PLAY_STEPS_PER_SECOND = 3                             # design choice: the year plays in about half a minute

def oscar_reader(times):
    """OSCAR u/v for the record's daily frame times (the frame's UTC date), on the 0.5° grid (each 1° cell repeated 2×2,
    so the export's block means give back the 1° values). A day OSCAR does not serve stays NaN."""
    def read(comp):
        def r(a, b):
            out = []
            for t in times[a:b]:
                p = OSCAR_DIR / f"{t:%Y%m%d}.npz"
                g = np.load(p)[comp] if p.exists() else np.full((180, 360), np.nan, np.float32)
                out.append(np.repeat(np.repeat(g, 2, 0), 2, 1))
            return np.stack(out)
        return r
    return read("u"), read("v")

def main():
    g = grids()
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    times = [dt.datetime.fromisoformat(t.replace("Z", "+00:00")) for t in g["times"]]
    ou, ov = oscar_reader(times)
    limit = limit_C(g, dec["colorbar"])
    readers = {"sst": lambda a, b: sst_cells(g, a, b, limit), "oscar_u": ou, "oscar_v": ov,
               "drift_u": lambda a, b: np.asarray(g["drift_u"][a:b]), "drift_v": lambda a, b: np.asarray(g["drift_v"][a:b])}
    T_all = len(times)
    cubes = {k: (lambda r: lambda f, tf: common.stream_reduce(r, T_all, f, tf))(r) for k, r in readers.items()}
    steps = {"sst": common.colorbar_step(dec["colorbar"]), "oscar_u": OSCAR_STEP, "oscar_v": OSCAR_STEP, "drift_u": DRIFT_STEP, "drift_v": DRIFT_STEP}
    (f, tf), tried = common.budget_search(cubes, OPTIONS, codecs={k: ("linear", v) for k, v in steps.items()})
    deg = 0.5 * f
    say(f"budget choice: {deg}° cells, {tf}-day means; tried {tried}")
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    T = len(times) - len(times) % tf
    t_out = [times[i] for i in range(0, T, tf)]
    bounds = (-180, -90, 180, 90)
    reduce = lambda c: c(f, tf)
    from .decode import colorbar_3912, stated_range
    cb = colorbar_3912()[0]
    bottom = float(cb.value_at(np.array([0.0]))[0])
    at_limit = common.stream_reduce(lambda a, b: sst_at_limit(g, a, b, limit).astype(np.float32), T_all, f, tf) >= 0.5
    units = {"sst": "°C", "oscar_u": "m/s", "oscar_v": "m/s", "drift_u": "km/day", "drift_v": "km/day"}
    labels = {"sst": "Sea surface temperature (model, read from the frame colours)",
              "oscar_u": "NASA OSCAR surface currents, eastward", "oscar_v": "NASA OSCAR surface currents, northward",
              "drift_u": "Drawn streak motion, eastward (pattern of the drawing, not water speed)",
              "drift_v": "Drawn streak motion, northward (pattern of the drawing, not water speed)"}
    extra = {"sst": {"display": common.display(cb), "below_range_bound": stated_range()[0], "below_kind": "at_or_below",
                     "limit_rule": {"floor": sst_floor(g), "cut_C": limit, "strip_bottom_C": bottom}}}
    meta_layers = []
    for name, cube in cubes.items():
        meta_layers.append(export.layer(RECORD, name, reduce(cube), t_out, bounds, units[name], label=labels[name], step=steps[name],
                                        below=at_limit if name == "sst" else None,
                                        aggregation=f"mean of {f}×{f} 0.5° cells and {tf} daily frames", **extra.get(name, {})))
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    common.layer_status(meta_layers, val["checks"], {"sst": "a_sst_mur", "drift_u": "b_direction_oscar", "drift_v": "b_direction_oscar"})
    for l in meta_layers:
        if l["id"].startswith("oscar_"): l["status"], l["statement"] = "observation", None       # the reference itself
    sp = np.hypot(reduce(cubes["drift_u"]), reduce(cubes["drift_v"]))
    osp = np.hypot(reduce(cubes["oscar_u"]), reduce(cubes["oscar_v"]))
    oscar_days = sorted(p.stem for p in OSCAR_DIR.glob("*.npz"))
    o_period = [dt.datetime.strptime(d, "%Y%m%d") for d in (oscar_days[0], oscar_days[-1])]
    all_times = sorted(frames.times_from_list((ROOT / "dates.txt").read_text(encoding="utf-8")).values())
    prov = common.provenance(RECORD, [SID], "model", (all_times[0], all_times[-1]))      # the visualization's own span
    bay = ((BAY_BBOX[1] + BAY_BBOX[3]) / 2, (BAY_BBOX[0] + BAY_BBOX[2]) / 2)
    man = {"record": RECORD, "app_title": "Currents & SST (model, 2007–08)", **prov,
           "frame_times": {"method": "date-list", "approximate": False, "source": "flat_ecco2_dates.txt (SVS)",
                           "subsample_every": STEP, "subsample_hours": (times[1] - times[0]).total_seconds() / 3600, "count": len(times)},
           "georef": {"projection": "equirectangular", "bounds": [-180, -90, 180, 90], "pass_at": georef.IOU_PASS,
                      "shifts_deg": list(georef.SHIFTS_DEG),
                      "iou": {k: round(v["iou"], 4) for k, v in dec["georef"].items()}, "pass": all(v["pass"] for v in dec["georef"].values()),
                      "best_is_assumed": all(v["best_is_assumed"] for v in dec["georef"].values())},
           "colorbar": dec["colorbar"], "decode": {k: dec[k] for k in ("matcher", "mode", "max_dist", "min_k", "coverage_median", "coverage_range", "uncertain_values", "farneback")},
           "layers": meta_layers, "voices": {"sst": "ocean", "oscar_speed": "oscarCurrent", "drift_speed": "currentDrift"},
           "voice_sources": {"oscarCurrent": {"label": "NASA OSCAR surface currents", "badge": "observation",
                                              "period": common.period_label(*o_period), "days": len(oscar_days),
                                              "citation": cmr.citation(COLLECTION)}},
           "play": [common.option("sst_oscar", "Sea surface temperature, with NASA OSCAR surface currents as clicks", "sst",
                                  [("ocean", ["sst"]), ("oscarCurrent", ["oscar_u", "oscar_v"])], bay, PLAY_STEPS_PER_SECOND),
                    common.option("sst_texture", "Sea surface temperature, with the drawn streak motion as clicks (visual texture, not water speed)",
                                  "sst", [("ocean", ["sst"]), ("currentDrift", ["drift_u", "drift_v"])], bay, PLAY_STEPS_PER_SECOND)],
           "drift_speed_range_km_day": [float(np.nanpercentile(sp, 1)), float(np.nanpercentile(sp, 99))],
           "oscar_speed_range_m_s": [float(np.nanpercentile(osp, 1)), float(np.nanpercentile(osp, 99))],
           "confidence": {"sst_min_cell_coverage": MIN_COV, "streak_coverage_median": dec["coverage_median"],
                          "sst_at_limit_cells": float(at_limit.mean())},
           "validation": common.validation_summary(val["checks"]),
           "size": {"choice": {"cell_deg": deg, "days": tf}, "tried": tried},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
