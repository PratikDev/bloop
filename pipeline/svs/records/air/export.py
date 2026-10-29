"""Export 5533/5518 under the data contract: public/data/official/air_5533/. Per species: a global daily layer (mean of
the 3-hourly frames; the budget picks the cell size and day step) and the Bangladesh box (lat 20–27, lon 88–93) at the
frames' native resolution and hourly cadence. Cells mostly below the colorbar's range (opacity-decoded O3/NOx) are
written as 'below range' (code 65534) with the bound in the layer. Encoding: log10 for species whose voice scale is log.
Usage (from pipeline/): python -m svs.records.air.export"""
import json
import numpy as np
from core.log import say
from svs import export, frames, georef
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.records.voices import input_scale
from svs.validate import _clean
from core.places import BD_POINTS
from . import ALT, BD_BOX, FULL_EVERY, PERIOD, SID

ROOT, WORK = raw_dir(ALT), raw_dir(ALT, "work")
RECORD = "air_5533"
UNITS = {"pm25": "µg/m³", "co": "ppbv", "nox": "ppbv", "o3": "ppbv"}
LABELS = {"pm25": "PM2.5", "co": "Carbon monoxide (CO)", "nox": "Nitrogen oxides (NOx)", "o3": "Ozone (O3)"}
OPTIONS = [(2, 1), (2, 2), (4, 1), (2, 3), (4, 2), (4, 3)]           # (0.5° cells per output cell, days)
VOICES = {"pm25": "airPm25", "co": "airCo", "nox": "airNox", "o3": "airO3"}
PLAY_STEPS_PER_SECOND = {"global": 2, "bd": 12}                      # design choice: days over ~40 s; hours over ~2.5 min

def main():
    dec = json.loads((WORK / "decode.json").read_text(encoding="utf-8"))
    sps = list(dec["species"])
    daily = {sp: np.load(WORK / f"daily_{sp}.npz") for sp in sps}
    bd = {sp: np.load(WORK / f"bd_{sp}.npz") for sp in sps}
    days = daily[sps[0]]["values"].shape[0]
    cubes = {sp: daily[sp]["values"] for sp in sps}
    enc = {sp: "log10" if input_scale(dec["species"][sp]["colorbar"]) == "log" else "linear" for sp in sps}
    step = {sp: common.colorbar_step(dec["species"][sp]["colorbar"]) for sp in sps}
    fixed = sum(common.gz_bytes(bd[sp]["values"], 200, enc[sp], step[sp]) for sp in sps)    # the box ships at native resolution
    (f, tf), tried = common.budget_search(cubes, OPTIONS, fixed_bytes=fixed, codecs={sp: (enc[sp], step[sp]) for sp in sps})
    say(f"budget choice: {0.5 * f}° cells, {tf}-day means; tried {tried}")
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    day_times = [(PERIOD[0] + __import__("datetime").timedelta(days=d)) for d in range(0, days - days % tf, tf)]
    hours, hour_step = frames.times_linear(PERIOD[0], PERIOD[1], 1801)
    from .decode import bars
    shown = {sp: common.display(cb) for sp, (cb, _, _) in bars().items()}
    layers, species = [], {}
    for sp in sps:
        info = dec["species"][sp]
        bound = (info.get("ramp") or {}).get("below_range_bound")
        g = export.block_mean(export.time_mean(daily[sp]["values"], tf), f)
        gb = export.block_mean(export.time_mean(daily[sp]["below"], tf), f) >= 0.5 if bound else None
        layers.append(export.layer(RECORD, f"{sp}_global", g, day_times, (-180, -90, 180, 90), UNITS[sp], encoding=enc[sp], below=gb, step=step[sp],
                                   label=f"{LABELS[sp]}, {'daily' if tf == 1 else f'{tf}-day'} mean (model)", species=sp, display=shown[sp],
                                   aggregation=f"mean of the 3-hourly frames over {tf} day(s), {0.5 * f}° cells",
                                   **({"below_range_bound": bound} if bound else {})))
        b = bd[sp]
        layers.append(export.layer(RECORD, f"{sp}_bd", b["values"], hours, BD_BOX, UNITS[sp], encoding=enc[sp], chunk_t=200, step=step[sp],
                                   below=b["below"] if bound else None, label=f"{LABELS[sp]}, Bangladesh, hourly (model)", species=sp,
                                   display=shown[sp],
                                   aggregation="native frame pixels (≈0.18°), every hourly frame",
                                   missing_hours=[int(x) for x in b["missing"]], **({"below_range_bound": bound} if bound else {})))
        species[sp] = {"label": LABELS[sp], "unit": UNITS[sp], "colorbar": info["colorbar"], "mode": info["mode"],
                       "evidence": info["evidence"], "ramp": info["ramp"], "coverage": info["coverage"], "matcher": info["matcher"]}
    prov = common.provenance(RECORD, [SID, ALT], "model", PERIOD)
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    common.layer_status(layers, val["checks"], {l["id"]: f"a_{l['species']}_geoscf" for l in layers})
    man = {"record": RECORD, "app_title": "Air (model, Jul–Sep 2024)", **prov,
           "frame_times": {"method": "linear", "approximate": True, "source": "1 Jul 2024 00:00 – 14 Sep 2024 00:00 UTC ÷ 1801 frames "
                           "(hourly); no date is burned into any 5518/5533 frame", "count": 1801, "full_every": FULL_EVERY,
                           "step_hours": hour_step.total_seconds() / 3600},
           "georef": {"projection": "equirectangular", "bounds": [-180, -90, 180, 90], "pass_at": georef.IOU_PASS,
                      "shifts_deg": list(georef.SHIFTS_DEG),
                      "iou": {k: round(v["iou"], 4) for k, v in dec["georef"].items()},
                      "iou_outline_grow1": {k: round(v["grow1_iou"], 4) for k, v in dec["georef"].items()},
                      "pass": all(v["pass"] for v in dec["georef"].values()),
                      "best_is_assumed": all(v["best_is_assumed"] for v in dec["georef"].values())},
           "species": species, "layers": layers, "voices": VOICES,
           "play": [common.option(f"{sp}_{view}", LABELS[sp], f"{sp}_{view}", [(VOICES[sp], [f"{sp}_{view}"])], BD_POINTS["Dhaka"],
                                  PLAY_STEPS_PER_SECOND[view], view="global" if view == "global" else "box")
                    for sp in sps for view in ("global", "bd")],
           "validation": [{k: c[k] for k in ("id", "title", "kind", "pass", "threshold")} for c in val["checks"]],
           "size": {"choice": {"cell_deg": 0.5 * f, "days": tf, "box_bytes": fixed}, "tried": tried},
           "geoscf_v2_replay_start": json.loads((raw_dir(ALT, "truth") / "geoscf.json").read_text())["v2_replay_start"],
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
