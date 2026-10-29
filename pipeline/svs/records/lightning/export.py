"""Export 5011 under the data contract: public/data/official/lightning_5011/: flashes per 1° cell per 10-day window (the
frames' marks, counted once when they appear; dates from the seasonal-anchor model, approximate) and the full list of
marks in the Bangladesh box (bd_events.json: approximate date, lat, lon, flashes). The budget picks the cell size.
Usage (from pipeline/): python -m svs.records.lightning.export"""
import datetime as dt, gzip, json
import numpy as np
from core.log import say
from core.places import CITY_CELLS
from svs import export, georef
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.records import common
from svs.validate import _clean
from . import GRID_DEG, MOVIE, RECORD, SID, WINDOW_DAYS, period, regions
from .counts import grid, in_box, load

ROOT = raw_dir(SID)
OPTIONS = [(1, 1), (2, 1), (1, 3), (2, 3)]          # (1° cells per output cell, windows per step)
PLAY_STEPS_PER_SECOND = 6                           # design choice: the 6½ years play in about 40 s

def main():
    c = load()
    start, end = period()
    edges = [start + dt.timedelta(days=WINDOW_DAYS * k) for k in range(int((end - start).days // WINDOW_DAYS) + 1)]
    cube = np.stack([grid(c["lat"][s], c["lon"][s], c["n"][s]) for s in
                     [(c["when"] >= a.timestamp()) & (c["when"] < b.timestamp()) for a, b in zip(edges[:-1], edges[1:])]]).astype(np.float32)
    (f, tf), tried = common.budget_search({"flashes": cube}, OPTIONS, codecs={"flashes": ("linear", 1.0)})
    say(f"budget choice: {GRID_DEG * f:g}° cells, {tf} windows per step; tried {tried}")
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    red = export.time_mean(export.block_mean(cube, f), tf) * f * f * tf           # sums, not means: counts stay counts
    t_out = edges[:-1][::tf][:len(red)]
    layer = export.layer(RECORD, "flashes", red, t_out, (-180, -90, 180, 90), "flashes per cell", step=1.0,
                         label=f"Lightning flashes detected from the ISS ({WINDOW_DAYS * tf}-day windows, {GRID_DEG * f:g}° cells)",
                         aggregation=f"sum of the new marks in {f}×{f} 1° cells over {tf} window(s)",
                         time_labels=[f"{t:%d %b %Y} (approx.)" for t in t_out])
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    common.layer_status([layer], val["checks"], {"flashes": "a_region_counts_isslis"})
    bd = in_box(c["lat"], c["lon"], regions()["Bangladesh"])
    events = [{"date_approx": dt.datetime.fromtimestamp(float(t), dt.timezone.utc).strftime("%Y-%m-%d"), "lat": round(float(a), 3),
               "lon": round(float(o), 3), "flashes": int(n)} for t, a, o, n in zip(c["when"][bd], c["lat"][bd], c["lon"][bd], c["n"][bd])]
    (PUBLIC_OFFICIAL / RECORD / "bd_events.json.gz").write_bytes(gzip.compress(json.dumps({"box": regions()["Bangladesh"], "events": events},
                                                                                           separators=(",", ":")).encode(), mtime=0))
    dec = c["meta"]; geo = dec["georef"]
    prov = common.provenance(RECORD, [SID], "observation", (start, end))
    dhaka = CITY_CELLS["Dhaka"]
    man = {"record": RECORD, "app_title": "Lightning from the ISS (observation, 2017–23)", **prov,
           "frame_times": {"method": "seasonal-anchors", "approximate": True, "count": dec["probe"]["frames"],
                           "source": "no date in the movie: seasons of the marks' mean latitude anchored to the LIS/OTD HRMC climatology",
                           "anchors": c["model"]["anchors"]},
           "georef": {"projection": "equirectangular", "bounds": [-180, -90, 180, 90], "pass_at": georef.IOU_PASS, "shifts_deg": list(georef.SHIFTS_DEG),
                      "iou": {"texture land mask": round(geo["iou"], 4)}, "pass": geo["pass"], "best_is_assumed": geo["best_is_assumed"],
                      "graticule_lat": geo["graticule_lat"], "coast_edge_peak_px": geo["coast_edge_peak_px"], "rule": geo["pass_rule"]},
           "decode": {k: dec[k] for k in ("yellow", "area_min", "area_max", "marks", "median_mark_area", "merged_share", "lifetime_frames")},
           "movie": MOVIE, "layers": [layer], "voices": {"flashes": "lightningClicks"},
           "play": [common.option("flashes", "Lightning flashes from the ISS: one click per flash in the cell", "flashes",
                                  [("lightningClicks", ["flashes"])], dhaka, PLAY_STEPS_PER_SECOND)],
           "flash_range": [0.0, float(np.percentile(red[red > 0], 99))], "bd_events": {"file": "bd_events.json.gz", "count": len(events)},
           "validation": common.validation_summary(val["checks"]),
           "size": {"choice": {"cell_deg": GRID_DEG * f, "windows_per_step": tf}, "tried": tried},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
