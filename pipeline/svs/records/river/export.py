"""Export 4960 under the data contract: public/data/official/river_4960/: relative water vapour transport (0–1, from the
blue shading; no colorbar) on the picture's own 480×270 grid (no georeference: grid.space 'frame'), one step per sampled
frame in movie order, labelled with its OCR'd date; the river's area, width, length and land contact per frame.
Usage (from pipeline/): python -m svs.records.river.export"""
import datetime as dt, json
import numpy as np
from svs import export
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from . import RECORD, SID

ROOT = raw_dir(SID)
BOUNDS = (-180, -101.25, 180, 101.25)

def main():
    g = np.load(ROOT / "grids.npz"); fj = json.loads((ROOT / "frames.json").read_text(encoding="utf-8"))
    rows = fj["rows"]
    times = [dt.datetime.fromisoformat(r["time"].replace("Z", "+00:00")) if r["time"] else None for r in rows]
    known = [t for t in times if t]
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    layer = export.layer(RECORD, "transport", g["transport"].astype(float), [t or known[0] for t in times], BOUNDS, "relative (0–1)", step=0.001,
                         label="Water vapour transport (reanalysis, relative: the picture's blue shading)",
                         aggregation="mean of (B − R) / 255 per picture cell", time_labels=[r["date_text"] for r in rows],
                         display=common.ramp_display(0, 1, (60, 140, 255)))
    layer["grid"]["space"] = "frame"
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    tm = next(c for c in val["checks"] if c["id"] == "a_landfall_timing_merra2")["metrics"]
    layer.update(status="relative", status_check="a_landfall_timing_merra2",
                 statement=f"relative transport (no colorbar); landfall peak {tm['difference_hours']:+.0f} h from MERRA-2's")
    prov = common.provenance(RECORD, [SID], "reanalysis", (min(known), max(known)))
    man = {"record": RECORD, "app_title": "Atmospheric river (reanalysis, Dec 2010)", **prov,
           "frame_times": {"method": "ocr", "approximate": False, "count": len(rows), "source": "the date-only layer (built-in date OCR)"},
           "georef": {"projection": "none (3D perspective view)", "bounds": list(BOUNDS), "pass_at": 0.0, "shifts_deg": [], "iou": {},
                      "pass": False, "best_is_assumed": False},
           "rows": rows, "layers": [layer], "voices": {"transport": "riverTransport"},
           "play": [common.option("transport", "Atmospheric river: higher pitch = stronger vapour transport (movie order)", "transport",
                                  [("riverTransport", ["transport"])], (0.0, 0.0), 2)],
           "validation": common.validation_summary(val["checks"]), "size": {"choice": {"grid": fj["grid"]}, "tried": []},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
