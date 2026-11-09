"""Acquire 5518's species layers. Every FULL_EVERY-th frame is fetched whole (kept until decoded, then deleted); the
others are fetched as a PNG prefix just long enough to decode the rows of the Bangladesh crop, which is kept as a tiny
lossless PNG. Order: full frames 3-daily first, then daily, then 3-hourly, then the prefixes, so samples that span the
period arrive first. Resumable; every byte range is in data_raw/5518/manifest.jsonl with its SHA-256.
Usage (from pipeline/): python -m svs.records.air.acquire [--full-only]"""
import json, sys, threading
from PIL import Image
from core.log import say
from svs import acquire, choose, frames, georef, svs_api
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import ALT, BD_BOX, CROP_MARGIN, FULL_EVERY, SID, SPECIES

ROOT = raw_dir(ALT)

def plan():
    choice = choose.choose(svs_api.fetch_record(SID), alternates=[svs_api.fetch_record(ALT)])
    layers = {}
    for f in choice["frames"]:
        layers[SPECIES[f["layer"]]] = {"layer": f["layer"], "files": acquire.layer_files(f), "width": f["width"], "height": f["height"]}
    return layers

def crop_geometry(W, H):
    rows, cols = georef.box_slices(BD_BOX, W, H, margin=CROP_MARGIN)
    return {"rows": [rows.start, rows.stop], "cols": [cols.start, cols.stop], "frame": [W, H], "box": BD_BOX, "margin_deg": CROP_MARGIN}

def save_crop(rgba, geom, dest):
    r0, r1 = geom["rows"]; c0, c1 = geom["cols"]
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba[r0:r1, c0:c1]).save(dest)

class Prefix:
    """Adaptive prefix length per species: learns the byte fraction that reaches the crop's last row."""
    def __init__(self): self.frac, self.lock = {}, threading.Lock()

    def fetch(self, fetcher, key, url, size, need_rows):
        n = int(size * self.frac.get(key, 0.6)) if size else 1_500_000
        data, total = fetcher.head_bytes(url, n)
        rows = frames.png_rows_available(data)
        while rows < need_rows and (total is None or len(data) < total):
            more = max(100_000, int(len(data) * (need_rows / max(rows, 1) - 1) * 1.05))
            extra, total = fetcher.head_bytes(url, more, start=len(data))
            data += extra; rows = frames.png_rows_available(data)
        with self.lock:
            used = len(data) / (total or size or len(data))
            self.frac[key] = min(1.0, used * need_rows / max(rows, 1) + 0.03)
        return frames.png_top_rows(data)[0]

def main():
    full_only = "--full-only" in sys.argv
    layers = plan()
    fetcher = Fetcher(ROOT / "manifest.jsonl", min_interval=0.3)
    any_layer = next(iter(layers.values()))
    geom = crop_geometry(any_layer["width"], any_layer["height"])
    (ROOT / "crop.json").write_text(json.dumps(geom, indent=1))
    n = len(any_layer["files"])
    full_idx = sorted(range(0, n, FULL_EVERY), key=lambda i: (i % 72 != 0, i % 24 != 0, i))
    jobs = [(i, k, True) for i in full_idx for k in layers]
    if not full_only:
        jobs += [(i, k, False) for i in range(n) if i % FULL_EVERY for k in layers]
    prefix = Prefix()

    def work(job):
        i, key, full = job
        f = layers[key]["files"][i]
        crop = ROOT / "bd" / key / f"{i:04d}.png"
        dest = ROOT / "full" / key / f["name"]
        if crop.exists() and (not full or dest.exists() or dest.with_name(dest.name + ".done").exists()):
            return                                    # .done = decode.py has decoded and deleted this full frame
        if full:
            fetcher.get(f["url"], dest, expect_bytes=f["bytes"] or 3_000_000)
            save_crop(frames.read_rgba(dest), geom, crop)
        else:
            save_crop(prefix.fetch(fetcher, key, f["url"], f["bytes"], geom["rows"][1]), geom, crop)

    say(f"5518: {len(layers)} layers × {n} frames; {len(full_idx)} full per layer; jobs {len(jobs)}")
    acquire.run_jobs(work, jobs, label="5518")
    say(f"prefix fractions {prefix.frac}")

if __name__ == "__main__":
    main()
