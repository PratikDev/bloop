"""Decode 5276's twelve annual lights-only frames (2012–2023, 7680×4320 TIF, the same stretched equirectangular world as
the change still) → data_raw/5313/annual.npz: per 0.1° cell, the mean brightness of the frame (its brightest channel,
0–1). No colorbar exists for these frames, so this is the picture's own relative brightness, not radiance: the record
ships it as a pattern (its rank against VNP46A4 radiance is the check). One frame at a time: fetch, reduce, delete.
Usage (from pipeline/): python -m svs.records.lights.decode_annual"""
import json
import numpy as np
from PIL import Image
from core.log import say
from svs import frames, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import GRID_DEG, SID
from .decode import cells

ROOT = raw_dir(SID)
FOLDER = "https://svs.gsfc.nasa.gov/vis/a000000/a005200/a005276/frames/7680x4320_16x9_3p/nightlights_flat_2012-2023_only_lights/"
Image.MAX_IMAGE_PIXELS = None

def main():
    files = sorted(svs_api.list_folder(FOLDER)["files"], key=lambda f: frames.frame_number(f["name"]))
    fetch = Fetcher(ROOT / "manifest.jsonl")
    gw, gh = int(360 / GRID_DEG), int(180 / GRID_DEG)
    years, cube = [], []
    for f in files:
        year = frames.frame_number(f["name"])
        p = raw_dir(SID, "annual") / f["name"]
        fetch.get(f["url"], p)
        k = frames.read_rgba(p)[..., :3].max(-1).astype(np.float32) / 255
        b, _ = cells(k, np.ones(k.shape, bool), gw, gh)
        years.append(year); cube.append(b.astype(np.float32))
        p.unlink()
        say(f"5313 annual {year}: lit share {(k > 0.08).mean():.2%}")
    np.savez_compressed(ROOT / "annual.npz", years=np.array(years), brightness=np.stack(cube), grid_deg=GRID_DEG)
    (ROOT / "annual.json").write_text(json.dumps({"folder": FOLDER, "years": years, "files": [f["name"] for f in files]}, indent=1),
                                      encoding="utf-8")

if __name__ == "__main__":
    main()
