"""The Bangladesh box at native resolution and native cadence (every hourly frame), decoded from the crops acquire.py
kept, with the decoders frozen by decode.py (same colorbars, modes and learned ramps). Output: work/bd_<species>.npz
(values (1801, h, w), below-range mask, the box's pixel geometry).
Usage (from pipeline/): python -m svs.records.air.decode_bd"""
import json, pickle
import numpy as np
from core.log import say
from svs import frames, georef
from svs.config import raw_dir
from . import ALT, BD_BOX

ROOT, WORK = raw_dir(ALT), raw_dir(ALT, "work")

class _Unpickler(pickle.Unpickler):
    """decode.py pickles its decoders while running as __main__: point those names back at the module."""
    def find_class(self, module, name):
        return super().find_class("svs.records.air.decode" if module == "__main__" else module, name)

def main():
    with open(WORK / "decoders.pkl", "rb") as fh:
        decoders = _Unpickler(fh).load()
    crop = json.loads((ROOT / "crop.json").read_text())
    W, H = crop["frame"]
    rows, cols = georef.box_slices(BD_BOX, W, H)
    r0, c0 = crop["rows"][0], crop["cols"][0]
    rs, cs = slice(rows.start - r0, rows.stop - r0), slice(cols.start - c0, cols.stop - c0)
    lat, lon = georef.pixel_centres(W, H)
    for sp, dec in decoders.items():
        files = sorted((ROOT / "bd" / sp).glob("*.png"), key=lambda p: int(p.stem))
        n = 1801
        vals = np.full((n, rows.stop - rows.start, cols.stop - cols.start), np.nan, np.float32)
        below = np.zeros(vals.shape, bool)
        for p in files:
            v, b, _ = dec.decode(frames.read_rgba(p)[..., :3])
            vals[int(p.stem)], below[int(p.stem)] = v[rs, cs], b[rs, cs]
        missing = sorted(set(range(n)) - {int(p.stem) for p in files})
        np.savez_compressed(WORK / f"bd_{sp}.npz", values=vals, below=below, lat=lat[rows], lon=lon[cols], missing=np.array(missing, int))
        say(f"{sp}: box {vals.shape[1]}×{vals.shape[2]} px × {n - len(missing)} hours (missing {len(missing)}); decoded {np.isfinite(vals).mean():.1%}, below range {below.mean():.1%}")

if __name__ == "__main__":
    main()
