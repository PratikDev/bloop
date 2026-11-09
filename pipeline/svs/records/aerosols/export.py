"""Export 5669 under the data contract: public/data/official/aerosols_5669/: one layer per aerosol type (relative density
on 1° cells: share of the cell's pixels of that type × their mean relative density; no values in the key), one time
step (19 Aug 2025 20:00 UTC). Play options: all four types together and each type solo.
Usage (from pipeline/): python -m svs.records.aerosols.export"""
import datetime as dt, json
import numpy as np
from svs import export, georef
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from core.places import CITY_CELLS
from . import ALTS, RECORD, SID, TYPES
from .validate import frame_density

ROOT = raw_dir(SID)
STEP = 0.0005                                         # relative density 0–1: finer than 8-bit
VOICE = {"sea salt": "aerosolSeaSalt", "dust": "aerosolDust", "smoke": "aerosolSmoke", "sulfate": "aerosolSulfate"}
WHEN = dt.datetime(2025, 8, 19, 20, tzinfo=dt.timezone.utc)

def main():
    g = np.load(ROOT / "grid.npz")
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    layers = []
    for t in TYPES:
        d = frame_density(g, t)
        layers.append(export.layer(RECORD, t.replace(" ", "_"), np.where(d > 0, d, np.nan)[None], [WHEN], (-180, -90, 180, 90),
                                   "relative density (0–1)", step=STEP, label=f"Aerosols: {t} (model, relative)",
                                   aggregation="share of the 1° cell's pixels of this type × their mean relative density",
                                   key_rgb=dec["keys"][t]["rgb"], display=common.ramp_display(0, float(np.nanpercentile(np.where(d > 0, d, np.nan), 99)),
                                                                                               tuple(dec["keys"][t]["rgb"]))))
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    per = next(c for c in val["checks"] if c["id"] == "a_type_merra2")["metrics"]["per_type"]
    common.layer_status(layers, val["checks"], {l["id"]: "a_type_merra2" for l in layers})
    for l, t in zip(layers, TYPES):
        l["statement"] = f"relative: where the GEOS picture shows {t}; rank vs MERRA-2 ρ {per[t]['spearman']:.2f}"
        if l["status"] == "verified": l["status"] = "relative"
    dhaka = CITY_CELLS["Dhaka"]
    ids = [l["id"] for l in layers]
    prov = common.provenance(RECORD, [SID, *ALTS[:1]], "model", (WHEN, WHEN))
    man = {"record": RECORD, "app_title": "Aerosols by type (model, 19 Aug 2025)", **prov,
           "frame_times": {"method": "date-list", "approximate": False, "count": 1, "source": "the still's file name and SVS text (2025-08-19T20:00 UTC)"},
           "georef": {"projection": "equirectangular stretched to 16:9", "bounds": [-180, -90, 180, 90], "pass_at": 0.9,
                      "shifts_deg": [1.0, 2.0], "iou": {"bare-land precision": round(dec["georef"]["precision"], 4)},
                      "pass": dec["georef"]["pass"], "best_is_assumed": dec["georef"]["best_is_assumed"]},
           "decode": {k: dec[k] for k in ("keys", "floor", "shares", "none_share", "size")},
           "layers": layers, "voices": {l["id"]: VOICE[t] for l, t in zip(layers, TYPES)},
           "play": [common.option("all", "All four aerosol types together", ids[TYPES.index("sulfate")],
                                  [(VOICE[t], [i]) for t, i in zip(TYPES, ids)], dhaka, 1)]
                   + [common.option(f"solo_{i}", f"{t.capitalize()} alone", i, [(VOICE[t], [i])], dhaka, 1) for t, i in zip(TYPES, ids)],
           "density_range": {i: float(np.nanpercentile(np.where(frame_density(g, t) > 0, frame_density(g, t), np.nan), 99)) for t, i in zip(TYPES, ids)},
           "validation": common.validation_summary(val["checks"]),
           "size": {"choice": {"cell_deg": float(g["grid_deg"])}, "tried": []},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
