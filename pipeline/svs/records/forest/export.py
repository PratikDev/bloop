"""Export 4950 under the data contract: public/data/official/forest_4950/: decoded height (m) on each still's own picture
grid (no georeference: grid.space 'frame', bounds −180…180 across by ±101.25 up), one step per still (a different side
of the globe), cell means of decoded pixels; plus the decoded and GEDI L3 histograms in the manifest.
Usage (from pipeline/): python -m svs.records.forest.export"""
import datetime as dt, json
import cv2
import numpy as np
from svs import colorbar, export, frames
from svs.config import PUBLIC_OFFICIAL, raw_dir
from svs.invert import Inverter
from svs.records import common
from svs.validate import _clean
from . import RECORD, SID, STILLS
from .decode import MAX_DIST, MIN_K, OCEAN_MARGIN, SPACE_MAX, bar_region

ROOT = raw_dir(SID)
GRID = (480, 270)                                  # cells across and up the 16:9 picture
BOUNDS = (-180, -101.25, 180, 101.25)
PERIOD = (dt.datetime(2019, 4, 18, tzinfo=dt.timezone.utc), dt.datetime(2020, 4, 30, tzinfo=dt.timezone.utc))   # SVS text: Apr 2019 – Apr 2020

def height_grid(path):
    rgba = frames.read_rgba(path); rgb = rgba[..., :3]
    cb = colorbar.read(bar_region(rgba))
    f = rgb.astype(np.int16); H, W = rgb.shape[:2]
    keep = ~((f[..., 2] > f[..., 1] + OCEAN_MARGIN) & (f[..., 2] > f[..., 0] + OCEAN_MARGIN)) & (f.max(-1) > SPACE_MAX)
    keep[int(0.75 * H):, :int(0.35 * W)] = False
    val, _, _, _ = Inverter(cb, mode="chroma").invert(rgb, MAX_DIST, min_k=MIN_K)
    ok = keep & np.isfinite(val)
    s = cv2.resize(np.where(ok, val, 0).astype(np.float32), GRID, interpolation=cv2.INTER_AREA)
    n = cv2.resize(ok.astype(np.float32), GRID, interpolation=cv2.INTER_AREA)
    return np.where(n > 0, s / np.maximum(n, 1e-9), np.nan), cb

def main():
    dec = json.loads((ROOT / "decode.json").read_text(encoding="utf-8"))
    grids, cbs = zip(*[height_grid(ROOT / "assets" / s) for s in STILLS])
    cb = cbs[0]
    for p in (PUBLIC_OFFICIAL / RECORD).glob("*.u16.gz"): p.unlink()
    layer = export.layer(RECORD, "height", np.stack(grids), [PERIOD[1]] * len(STILLS), BOUNDS, "m", step=common.colorbar_step(cb.summary()),
                         label="Forest height from GEDI (the picture's own view; no map position)",
                         aggregation=f"mean of decoded pixels in each of {GRID[0]}×{GRID[1]} picture cells",
                         time_labels=[f"view {i + 1} (frame {s.split('_')[-2]})" for i, s in enumerate(STILLS)], display=common.display(cb))
    layer["grid"]["space"] = "frame"
    val = json.loads((PUBLIC_OFFICIAL / RECORD / "validation.json").read_text(encoding="utf-8"))
    m = val["checks"][0]["metrics"]
    layer.update(status="pattern only", status_check="a_height_hist_gedi_l3",
                 statement=f"pattern only (values not verified): decoded median {m['median_decoded_m']:.1f} m vs GEDI L3 "
                           f"{m['median_l3_m']:.1f} m, KS {m['ks']:.2f}")
    hc = np.load(ROOT / "hist_compare.npz")
    prov = common.provenance(RECORD, [SID], "observation", PERIOD)
    man = {"record": RECORD, "app_title": "Forest height (observation, GEDI)", **prov,
           "frame_times": {"method": "date-list", "approximate": True, "count": len(STILLS),
                           "source": "the SVS text's period (April 2019 – April 2020); the stills are views, not times"},
           "georef": {"projection": "none (3D globe view)", "bounds": list(BOUNDS), "pass_at": 0.0, "shifts_deg": [], "iou": {},
                      "pass": False, "best_is_assumed": False},
           "colorbar": cb.summary(), "decode": {k: dec[k] for k in ("matcher", "mode", "max_dist", "min_k", "stills")},
           "layers": [layer], "voices": {"height": "forestHeight"},
           "play": [common.option("height", "Forest height: higher pitch = taller canopy (one view per second)", "height",
                                  [("forestHeight", ["height"])], (0.0, 0.0), 1)],
           "histograms": {"edges_m": hc["edges"].tolist(), "decoded": hc["decoded"].astype(int).tolist(), "gedi_l3": hc["l3"].astype(int).tolist()},
           "validation": common.validation_summary(val["checks"]),
           "size": {"choice": {"grid": list(GRID)}, "tried": []},
           "asset_checksums": common.checksums(RECORD, ROOT / "manifest.jsonl")}
    export.write_manifest(RECORD, _clean(man))
    common.write_index()

if __name__ == "__main__":
    main()
