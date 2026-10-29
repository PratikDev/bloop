"""Export 5313 under the data contract: public/data/official/lights_5313/. Layers: the relative change 2012→2023
(−1 lights out … +1 new lights, from the change map's colours) and the annual frames' relative brightness 2012–2023
(the picture's own, 0–1; no colorbar). The size budget picks the cell size; the manifest records every number behind it.
Usage (from pipeline/): python -m svs.records.lights.export"""
import datetime as dt, json
import numpy as np
from core.log import say
from core.places import CITY_CELLS
from svs import export, georef
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from . import GRID_DEG, RECORD, SID, STRONG, YEARS
from .decode import change_colorbar

ROOT = raw_dir(SID)
OPTIONS = [(1, 1), (2, 1), (3, 1), (5, 1)]          # (0.1° cells per output cell, —)
BRIGHT_STEP = 0.001                                 # relative brightness: finer than 8-bit (1/255)
PLAY_STEPS_PER_SECOND = 1                           # design choice: one year per second

def main():
    g, ann = np.load(ROOT / "grid.npz"), np.load(ROOT / "annual.npz")
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    years = [int(y) for y in ann["years"]]
    cubes = {"change": g["change"][None], "brightness": ann["brightness"]}
    steps = {"change": common.colorbar_step(dec["colorbar"]), "brightness": BRIGHT_STEP}
    (f, _), tried = common.budget_search(cubes, OPTIONS, codecs={k: ("linear", v) for k, v in steps.items()})
    deg = GRID_DEG * f
    say(f"budget choice: {deg:g}° cells; tried {tried}")
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    bounds = (-180, -90, 180, 90)
    cb = change_colorbar()
    year_t = lambda y: dt.datetime(y, 1, 1, tzinfo=dt.timezone.utc)
    layers = [export.layer(RECORD, "change", export.block_mean(cubes["change"], f), [year_t(YEARS[1])], bounds, "relative (−1 … +1)",
                           step=steps["change"], label=f"Change in night lights {YEARS[0]}→{YEARS[1]} (relative: lights out … new lights)",
                           aggregation=f"brightness-weighted mean of the decoded pixels in {f}×{f} 0.1° cells",
                           time_labels=[f"{YEARS[0]}→{YEARS[1]}"], display=common.display(cb)),
              export.layer(RECORD, "brightness", export.block_mean(cubes["brightness"], f), [year_t(y) for y in years], bounds,
                           "relative brightness (0–1)", step=BRIGHT_STEP, label="Night lights, annual (the picture's own brightness, not radiance)",
                           aggregation=f"mean of {f}×{f} 0.1° cells", time_labels=[str(y) for y in years])]
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    common.layer_status(layers, val["checks"], {"change": "a_direction_vnp46a4", "brightness": "c_annual_brightness"})
    by = {c["id"]: c["metrics"] for c in val["checks"]}
    statements = {"change": "relative change; its direction matches VNP46A4 in {agreement:.0%} of cells".format(**by["a_direction_vnp46a4"]),
                  "brightness": "the picture's brightness, not radiance (rank vs VNP46A4: ρ {0:.2f} in {2}, {1:.2f} in {3})".format(
                      by["c_annual_brightness"][f"spearman_{YEARS[0]}"], by["c_annual_brightness"][f"spearman_{YEARS[1]}"], *YEARS)}
    for l in layers:
        if l["status"] in ("verified", "no check"): l["status"], l["statement"] = "relative", statements[l["id"]]
    rng = lambda a: [float(np.nanpercentile(a, 1)), float(np.nanpercentile(a[a > 0], 99))]
    dhaka = CITY_CELLS["Dhaka"]
    prov = common.provenance(RECORD, [SID, 5276, 5475], "observation", (year_t(YEARS[0]), dt.datetime(YEARS[1], 12, 31, tzinfo=dt.timezone.utc)))
    man = {"record": RECORD, "app_title": f"Night lights {YEARS[0]}→{YEARS[1]} (observation)", **prov,
           "frame_times": {"method": "date-list", "approximate": False, "count": len(years) + 1,
                           "source": "the frame and file names (annual composites; the change map's own title years)"},
           "georef": {"projection": "equirectangular", "bounds": list(bounds), "pass_at": georef.IOU_PASS,
                      "shifts_deg": list(georef.SHIFTS_DEG), "iou": {"5475 frame 1259": round(dec["georef_2x1"]["iou"], 4)},
                      "pass": bool(dec["georef_2x1"]["pass"] and dec["still_alignment"]["pass"]),
                      "best_is_assumed": bool(dec["georef_2x1"]["best_is_assumed"]), "still_alignment": dec["still_alignment"]},
           "colorbar": dec["colorbar"], "decode": {k: dec[k] for k in ("matcher", "mode", "max_dist", "min_k", "noise_floor_k", "lit_threshold_k",
                                                                      "lit_pixels", "decoded_of_lit", "strong_cells")},
           "layers": layers, "voices": {"change": "lightsChange", "brightness": "lightsBrightness"},
           "play": [common.option("change", "Change 2012→2023: higher = new lights, lower = lights out", "change", [("lightsChange", ["change"])],
                                  dhaka, PLAY_STEPS_PER_SECOND),
                    common.option("annual", "Night lights, one year per second", "brightness", [("lightsBrightness", ["brightness"])],
                                  dhaka, PLAY_STEPS_PER_SECOND)],
           "brightness_range": rng(cubes["brightness"]), "strong_change": STRONG,
           "validation": common.validation_summary(val["checks"]),
           "size": {"choice": {"cell_deg": deg}, "tried": tried},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
