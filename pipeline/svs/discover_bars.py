"""Phase 0: the numeric range of each candidate's colorbar, read from the file itself (svs/colorbar.py on the key
composited on black, then the labelled-strip reader); a key whose labels are words, or that no reader can place, is
recorded as 'unread' with the reason. Candidates: every planned ID and every EIC-tree item with frames or a movie.
Writes data_raw/related/bars.json; the key files stay in data_raw/related/bars/ (small; git-ignored).
Usage (from pipeline/): python -m svs.discover_bars"""
import json
import numpy as np
from core.log import say
from . import choose, colorbar, frames
from .config import raw_dir
from .discover import API
from .discover_plan import PLAN
from .fetch import Fetcher

def composite(rgba):
    a = rgba.astype(np.float64)
    return np.concatenate([(a[..., :3] * a[..., 3:4] / 255).round(), np.full(a.shape[:2] + (1,), 255.0)], -1).astype(np.uint8)

def read_bar(path):
    rgba = frames.read_rgba(path)
    errors = []
    for name, reader in (("strip", lambda: colorbar.read(composite(rgba))), ("labelled strip", lambda: colorbar.read_labelled_strip(rgba))):
        try:
            cb = reader(); s = cb.summary()
            return {"reader": name, "ticks": [t["text"] for t in s.get("ticks", [])], "range": [round(float(v), 4) for v in s["value_range"]],
                    "scale": s.get("scale")}
        except Exception as e:
            errors.append(f"{name}: {str(e)[:100]}")
    return {"reader": None, "unread": errors}

def main():
    disc = json.loads((raw_dir("related") / "discover.json").read_text(encoding="utf-8"))
    want = {int(k) for k in disc["tree"]} | set(PLAN)
    fetch = Fetcher(raw_dir("related") / "bars_manifest.jsonl", tries=8)
    out = {}
    for sid in sorted(want):
        p = API / f"{sid}.json"
        if not p.exists(): continue
        rec = json.loads(p.read_text(encoding="utf-8"))
        if not any(m["media_type"] in ("Frames", "Movie") for m in rec.get("media", [])): continue
        rows = []
        for m in choose.colorbars(rec)[:3]:
            if not (m.get("url") or "").lower().endswith((".png", ".tif", ".tiff", ".jpg")): continue
            dest = raw_dir("related", "bars", str(sid)) / m["filename"]
            try:
                fetch.get(m["url"], dest, expect_bytes=5_000_000)
                rows.append({"file": m["filename"], "size": f"{m['width']}×{m['height']}", **read_bar(dest)})
            except Exception as e:
                rows.append({"file": m["filename"], "error": f"{e.__class__.__name__}: {str(e)[:100]}"})
        if rows: out[str(sid)] = rows
        say(f"bars {sid}: {[(r['file'], r.get('range')) for r in rows]}")
    (raw_dir("related") / "bars.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

if __name__ == "__main__":
    main()
