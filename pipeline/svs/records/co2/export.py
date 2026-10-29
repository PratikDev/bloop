"""Export 5196 / 5436 under the data contract: public/data/official/co2_5196/: CO2 ppm as seen along the view (opacity-
weighted, model nature run) on 0.5° cells for the decoded frames; cells in the colorbar's white end (not invertible) are
written as 'at or below' its top; plume area and edge length per frame in the manifest.
Usage (from pipeline/): python -m svs.records.co2.export"""
import datetime as dt, json
import numpy as np
from core.places import CITY_CELLS
from svs import export, georef
from svs.config import PUBLIC_OFFICIAL
from svs.records import common
from svs.validate import _clean
from . import ALT, RECORD, SID
from .decode import ROOT
from .transfer import read as read_transfer

PLAY_STEPS_PER_SECOND = 2

def main():
    g = np.load(ROOT / "grids.npz")
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    syn = next(c for c in val["checks"] if c["id"] == "a_synthetic_round_trip")["metrics"]
    white_top = syn["uncertain_spans_ppm"][0][1]
    cb = read_transfer(ROOT / "assets" / "dyamondCbar_6-27-2024a.png")
    times = [dt.datetime.fromisoformat(str(t).replace("Z", "+00:00")) for t in g["times"]]
    ppm = g["ppm"].astype(float)
    below = np.isfinite(ppm) & (ppm <= white_top)
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    layer = export.layer(RECORD, "co2", np.where(below, np.nan, ppm), times, (-180, -90, 180, 90), "ppm", step=common.colorbar_step(cb.summary()),
                         below=below, below_range_bound=white_top, below_kind="at_or_below",
                         label="CO2 along the view (model nature run, relative ppm)", display=common.display(cb),
                         aggregation="opacity-weighted mean of the decoded pixels in each 0.5° cell",
                         time_labels=[f"{t:%d %b %Y}" for t in times])
    common.layer_status([layer], val["checks"], {"co2": "a_synthetic_round_trip"})
    layer["status"], layer["statement"] = "relative", (f"model nature run; relative values (opacity-weighted along the view; "
                                                      f"≤ {white_top:.0f} ppm is the colorbar's white end)")
    start, end = times[0], times[-1]
    prov = common.provenance(RECORD, [SID, ALT], "model", (start, end))
    man = {"record": RECORD, "app_title": "CO₂ nature run (model, Jan–Mar 2020)", **prov,
           "frame_times": {"method": "date-list", "approximate": False, "count": int(len(times)), "source": "dyamond_timestamps.txt (SVS 5436)",
                           "of": dec["frames_total"]},
           "georef": {"projection": "equirectangular (SOS)", "bounds": [-180, -90, 180, 90], "pass_at": georef.IOU_PASS,
                      "shifts_deg": list(georef.SHIFTS_DEG), "iou": {"surface layer": round(dec["georef"]["iou"], 4)},
                      "pass": dec["georef"]["iou"] >= georef.IOU_PASS, "best_is_assumed": dec["georef"]["best_is_assumed"]},
           "colorbar": dec["colorbar"], "decode": {k: dec[k] for k in ("matcher", "mode", "alpha_min", "max_dist", "plume_ppm")},
           "plumes": dec["plumes"], "layers": [layer], "voices": {"co2": "co2Ppm"},
           "play": [common.option("co2", "CO2 in the nature run: higher pitch = more CO2 along the view", "co2", [("co2Ppm", ["co2"])],
                                  CITY_CELLS["Dhaka"], PLAY_STEPS_PER_SECOND)],
           "ppm_range": [white_top, float(cb.summary()["value_range"][1])],
           "validation": common.validation_summary(val["checks"]),
           "size": {"choice": {"cell_deg": float(dec.get("grid_deg", 0.5)), "frames": int(len(times))}, "tried": []},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
