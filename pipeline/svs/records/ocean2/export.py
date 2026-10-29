"""Export 5425 under the data contract: public/data/official/ocean2_5425/: for each current view (Kuroshio, Agulhas, Gulf
Stream) temperature and salinity on the picture's own 480×270 grid (no georeference: grid.space 'frame'), one step per
decoded frame; one play option per current (temperature → pitch, salinity on the second voice slot).
Usage (from pipeline/): python -m svs.records.ocean2.export"""
import datetime as dt, json
import numpy as np
from svs import export
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from . import SID
from .validate import RECORD

ROOT = raw_dir(SID)
BOUNDS = (-180, -101.25, 180, 101.25)
UNITS = {"temperature": "°C", "salinity": "PSU"}

def main():
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    by = {c["id"]: c for c in val["checks"]}
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    layers, options, times_all = [], [], []
    from svs import colorbar, frames
    from . import COLORBARS
    bars = {k: colorbar.read_labelled_strip(frames.read_rgba(ROOT / "assets" / n)) for k, n in COLORBARS.items()}
    for view, rows in dec["views"].items():
        rows = [r for r in rows if (ROOT / "rows" / f"{r['frame']}_temperature.npy").exists()]   # frames decoded with their grid
        if not rows: continue
        times = [dt.datetime.fromisoformat(r["date"]).replace(tzinfo=dt.timezone.utc) for r in rows]
        times_all += times
        ids = {}
        for k, cb in dec["colorbars"].items():
            cube = np.stack([np.load(ROOT / "rows" / f"{r['frame']}_{k}.npy") for r in rows]).astype(float)
            lid = f"{k}_{view.lower().replace(' ', '_')}"
            check = by[f"a_{k}_{'mur' if k == 'temperature' else 'smap'}"]["metrics"]
            lay = export.layer(RECORD, lid, cube, times, BOUNDS, UNITS[k], step=common.colorbar_step(cb),
                               label=f"{view}: {k} (model, the picture's own view)", aggregation="mean of decoded pixels per picture cell",
                               time_labels=[f"{r['date']} (frame {r['frame']})" for r in rows], view=view, display=common.display(bars[k]))
            lay["grid"]["space"] = "frame"
            lay.update(status="no check", status_check=f"a_{k}", statement=f"regional check only: median frame − truth {check['median_difference']:+.2f} {UNITS[k]}")
            layers.append(lay); ids[k] = lid
        options.append(common.option(view.lower().replace(" ", "_"), f"{view}: temperature → pitch, salinity on the second voice",
                                     ids["temperature"], [("ocean2Temperature", [ids["temperature"]]), ("ocean2Salinity", [ids["salinity"]])], (0.0, 0.0), 1))
    prov = common.provenance(RECORD, [SID], "model", (min(times_all), max(times_all)))
    man = {"record": RECORD, "app_title": "Perpetual Ocean 2: western boundary currents (model, 2021–23)", **prov,
           "frame_times": {"method": "ocr", "approximate": False, "count": sum(len(r) for r in dec["views"].values()),
                           "source": "the dates layer (built-in date OCR, 77 probes), interpolated by frame number"},
           "georef": {"projection": "none (camera views)", "bounds": list(BOUNDS), "pass_at": 0.0, "shifts_deg": [], "iou": {}, "pass": False,
                      "best_is_assumed": False},
           "colorbars": dec["colorbars"], "holds": dec["holds"], "view_frames": dec["view_frames"], "layers": layers,
           "voices": {"temperature": "ocean2Temperature", "salinity": "ocean2Salinity"}, "play": options,
           "ranges": {k: cb["value_range"] for k, cb in dec["colorbars"].items()},
           "validation": common.validation_summary(val["checks"]), "size": {"choice": {"grid": [480, 270]}, "tried": []},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
