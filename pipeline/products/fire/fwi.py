"""SVS 5315 Fire Weather Index (Robinson PNG, 6 legend classes) → latest/fwi_class.bin (u8 0–6, 1024×512) + .json, and
the daily archive SVS doesn't keep: archive/fwi/FWI_YYYYMMDD.u8.gz (rolling) + context/fwi_archive_index.json.
Acceptance test C5315 runs first: it downloads the day's PNG and reads the legend swatches; this module decodes that
same file with the suite's fwi_classify and Robinson maths.
Usage (from pipeline/): python -m products.fire.fwi"""
import gzip, json
from datetime import datetime, timedelta
import numpy as np
from common import PUBLIC
from core.ref import T, run_test
from core.grids import GRID_W, GRID_H, cell_centres, grid_info, mode_filter_classes, robinson_to_grid
from core.header import header, publish_json, publish_bin, iso
from core.log import say, main_guard
from core.places import BD_BBOX, CITY_CELLS, in_box

MAX_CHROMA_DIST = 0.25          # C5315's "decodes" threshold
LEGEND_BOX = (0.57, 0.17)       # the legend sits below 57% of the height, left of 17% of the width (as C5315 masks it)
KEEP_DAYS = 60
CHUNK = 200_000
ARCHIVE = PUBLIC / "archive" / "fwi"

def decode(img, swatches):
    """Per-pixel class 0..5, −1 = no calculation / legend / outside the map (chunked: fwi_classify is all-pairs)."""
    H, W = img.shape[:2]
    flat = img.reshape(-1, 3)
    k = np.empty(len(flat), np.int64); dist = np.empty(len(flat))
    for i in range(0, len(flat), CHUNK):
        k[i:i + CHUNK], dist[i:i + CHUNK] = T.fwi_classify(flat[i:i + CHUNK], swatches)
    k[dist >= MAX_CHROMA_DIST] = -1
    k = k.reshape(H, W)
    k[int(LEGEND_BOX[0] * H):, :int(LEGEND_BOX[1] * W)] = -1
    return mode_filter_classes(k)

def bd_summary(grid):
    """Class at each city cell and class counts in the Bangladesh box (codes 1..6; 0 = no calculation)."""
    lat, lon = cell_centres()
    LA, LO = np.meshgrid(lat, lon, indexing="ij")
    box = grid[in_box(LA, LO, BD_BBOX)]
    at = lambda la, lo: int(grid[int((90 - la) / 180 * GRID_H), int((lo + 180) / 360 * GRID_W)])
    return {"places": {n: at(*p) for n, p in CITY_CELLS.items()},
            "bd_box_counts": {str(c): int((box == c).sum()) for c in range(0, 7)}}

def write_archive(grid, day):
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    name = f"FWI_{day:%Y%m%d}.u8.gz"
    (ARCHIVE / name).write_bytes(gzip.compress(grid.tobytes(), mtime=0))
    for old in ARCHIVE.glob("FWI_*.u8.gz"):
        stamp = datetime.strptime(old.name[4:12], "%Y%m%d")
        if stamp < day.replace(tzinfo=None) - timedelta(days=KEEP_DAYS):
            old.unlink()
    return name

def main():
    status, detail, m = run_test("C5315")
    say(f"C5315 {status}: {detail}")
    if status not in (T.PASS, T.WARN):
        raise RuntimeError("C5315 did not run: nothing decoded")
    issued = datetime.fromisoformat(m["last_modified"])
    img = T.read_image_rgba(T.OUT / "fwi_archive" / m["file"])[:, :, :3]
    classes = decode(img, m["swatches"])
    grid, _ = robinson_to_grid(classes)
    grid = (grid + 1).astype(np.uint8)                    # −1 → 0 (no calculation); 0..5 → 1..6
    publish_bin("latest/fwi_class.bin", grid)
    summary = bd_summary(grid)
    labels = ["no calculation"] + list(T.FWI_CLASSES)
    publish_json("latest/fwi_class.json", {
        **header("fwi_class", iso(issued)), "svs_id": 5315, "svs_page": "https://svs.gsfc.nasa.gov/5315/",
        "frame_time_utc": iso(issued), "frame_time_source": "HTTP Last-Modified of FWI_forecast_latest.png",
        "forecast": "1-day", "source_file": "FWI_forecast_latest.png", "projection_of_source": "Robinson",
        "classes": [{"code": c, "label": labels[c]} for c in range(len(labels))],
        "grid": grid_info(GRID_W, GRID_H, "uint8_class", nodata=0,
                          aggregation="class of the nearest source pixel after a 3×3 majority filter (Robinson → equirectangular)"),
        "verified": {"test": "C5315", "status": status, "decoded_share": m.get("decoded_share"), "swatches": m.get("swatches")},
        "bangladesh": summary,
    })
    name = write_archive(grid, issued)
    idx_path = PUBLIC / "context" / "fwi_archive_index.json"
    days = {d["date"]: d for d in (json.load(open(idx_path))["days"] if idx_path.exists() else [])}
    days[f"{issued:%Y-%m-%d}"] = {"date": f"{issued:%Y-%m-%d}", "file": f"archive/fwi/{name}", "issued_utc": iso(issued), **summary}
    kept = sorted((d for d in days.values() if (PUBLIC / d["file"]).exists()), key=lambda d: d["date"])
    publish_json("context/fwi_archive_index.json", {**header("fwi_archive", iso(issued)), "keep_days": KEEP_DAYS,
                 "grid": {"width": GRID_W, "height": GRID_H, "encoding": "gzip of uint8_class (see latest/fwi_class.json)"},
                 "days": kept})

if __name__ == "__main__":
    main_guard(main)
