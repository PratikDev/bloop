"""SVS 5584 daily landslide exposure (LHASA; Robinson PNG with a categorical legend) → latest/landslide_class.bin
(u8: 0 = none shown, 1..N = legend classes from lowest to highest) + .json. The legend swatches are read from the
picture itself (coloured boxes in the legend corner, top = highest), so no colour is typed by hand.
Usage (from pipeline/): python -m products.disasters.landslide"""
import numpy as np
from core.ref import T, run_test
from core.grids import GRID_W, GRID_H, grid_info, robinson_to_grid
from core.header import header, publish_json, publish_bin, iso
from core.log import say, main_guard

LABELS = ("low", "moderate", "high", "very high")   # the legend's words, lowest first
LEGEND = (0.62, 0.16)            # legend corner: below 62% of the height, left of 16% of the width
SWATCH_MIN_BRIGHT, SWATCH_MIN_CHROMA, SWATCH_MIN_PX = 150, 40, 30
MATCH_DIST = 40                  # anti-aliased polygon edges stay within this RGB distance of their swatch

def legend_swatches(rgb):
    H, W = rgb.shape[:2]
    y0, x1 = int(LEGEND[0] * H), int(LEGEND[1] * W)
    box = rgb[y0:, :x1].astype(int)
    m = (box.max(2) >= SWATCH_MIN_BRIGHT) & (box.max(2) - box.min(2) >= SWATCH_MIN_CHROMA)
    cols, inv, counts = np.unique(box[m], axis=0, return_inverse=True, return_counts=True)
    ys = np.nonzero(m)[0]
    found = [(float(ys[inv.ravel() == i].mean()), cols[i]) for i in np.flatnonzero(counts >= SWATCH_MIN_PX)]
    found.sort(key=lambda t: t[0])                      # top → bottom = highest → lowest
    return [c for _, c in found][::-1]                  # lowest first

def main():
    status, detail, m = run_test("C5584")              # freshness of the frame folder (the acceptance test)
    say(f"C5584 {status}: {detail}")
    js, _ = T.svs_api(5584)
    url = next(u for u in T.walk_urls(js) if u.lower().endswith(".png") and "landslides_daily" in u)
    dest = T.OUT / "samples" / "5584_landslides_daily.png"; dest.unlink(missing_ok=True)
    rgb = T.read_image_rgba(T.download(url, dest, max_mb=40))[:, :, :3]
    issued = T.last_modified(url)
    sw = legend_swatches(rgb)
    if len(sw) != len(LABELS):
        raise RuntimeError(f"5584 legend: found {len(sw)} coloured swatches, expected {len(LABELS)} ({LABELS}): not decoded")
    H, W = rgb.shape[:2]
    d = np.sqrt(((rgb[:, :, None, :].astype(np.float32) - np.asarray(sw, np.float32)[None, None]) ** 2).sum(-1))
    k = np.where(d.min(-1) <= MATCH_DIST, d.argmin(-1) + 1, 0)
    k[int(LEGEND[0] * H):, :int(LEGEND[1] * W)] = 0
    pad = np.pad(k, 1)                                   # highest class in the 3×3 neighbourhood: small polygons survive
    k = np.max(np.stack([pad[dy:dy + H, dx:dx + W] for dy in range(3) for dx in range(3)]), axis=0)
    grid, _ = robinson_to_grid(k)
    grid = grid.astype(np.uint8)
    publish_bin("latest/landslide_class.bin", grid)
    counts = np.bincount(grid.ravel(), minlength=len(LABELS) + 1)
    say(f"5584 issued {issued}: swatches {[tuple(int(x) for x in s) for s in sw]}; cells per class {counts.tolist()}")
    publish_json("latest/landslide_class.json", {
        **header("landslide_class", iso(issued)), "svs_id": 5584, "svs_page": "https://svs.gsfc.nasa.gov/5584/",
        "frame_time_utc": iso(issued), "frame_time_source": "HTTP Last-Modified of landslides_daily.png",
        "source_file": url.split("/")[-1], "projection_of_source": "Robinson",
        "classes": [{"code": 0, "label": "none shown"}] + [{"code": i + 1, "label": l} for i, l in enumerate(LABELS)],
        "legend_swatches_rgb": [[int(x) for x in s] for s in sw],
        "grid": grid_info(GRID_W, GRID_H, "uint8_class", nodata=0,
                          aggregation="highest class within 3×3 source pixels, nearest to each cell centre (Robinson → equirectangular)"),
        "cells_per_class": counts.tolist(),
        "verified": {"test": "C5584", "status": status, "age_days": m.get("age_days")},
    })

if __name__ == "__main__":
    main_guard(main)
