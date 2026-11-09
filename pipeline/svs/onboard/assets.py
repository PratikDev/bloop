"""Onboarding, assets: which pictures to read and how to get them, by rule.
  order  — a flat 2:1 frame set (the item's, then a twin's), then any frame set, then a 2:1 movie (item's, then a twin's),
           then any movie, then the largest still ≤ MAX_W; within a kind the smallest tier ≥ MIN_W wins (SVS can be slow);
  frames — N evenly spaced frames of the chosen set (files streamed and deleted), or of the movie (ffmpeg, one pass);
  layers — label, date, annotation and other-projection cuts lose to a clean data layer (DIRTY, on layer and file names).
Returns a list of (RGBA uint8 — alpha 0 = no data in *_alpha sets, 255 for movies — name, index, total) per frame."""
import re
import numpy as np
from .. import choose, frames, svs_api
from ..config import raw_dir
from ..fetch import Fetcher

MIN_W, MAX_W = 1024, 4096
DIRTY = re.compile(r"annot|label|composite|date|caption|robinson|mollweide|_comp\b|with_|colou?rbar", re.I)   # overlays, other projections

def clean(s):
    """A data layer, not a labelled/annotated/date/other-projection cut (judged on the layer name and its first file)."""
    return not DIRTY.search(f"{s.get('layer', '')} {s.get('first') or ''}")

def local(name):
    return re.sub(r'[<>:"/\|?*]', "-", name)                     # SVS names can carry ':' (times), which Windows refuses

def flat21(w, h):
    return bool(h) and abs(w / h - 2) < 0.01

def tier(w, s=None):
    return (s is not None and not clean(s), w < MIN_W, w > MAX_W, w)

def pick(rec, twins):
    """(kind, owner id, media/set dict) by the rule in the docstring."""
    own = choose.frame_sets(rec)
    tw_sets = [(t["id"], s) for t in twins for s in t["flat_sets"]]
    flat_own = sorted([s for s in own if flat21(s["width"], s["height"])], key=lambda s: tier(s["width"], s))
    if flat_own: return "frames", rec["id"], flat_own[0]
    if tw_sets:
        sid, s = sorted(tw_sets, key=lambda x: tier(int(x[1]["size"].split("×")[0]), x[1]))[0]
        w, h = (int(x) for x in s["size"].split("×"))
        return "frames", sid, {"url": s["url"], "width": w, "height": h, "layer": s["layer"]}
    if own: return "frames", rec["id"], sorted(own, key=lambda s: tier(s["width"], s))[0]
    movies = [m for m in rec["media"] if m["media_type"] == "Movie" and m["url"].lower().endswith((".mp4", ".mov", ".webm"))]
    flat_m = sorted([m for m in movies if flat21(m["width"], m["height"])], key=lambda m: tier(m["width"]))
    if flat_m: return "movie", rec["id"], flat_m[0]
    tw_m = [(t["id"], m) for t in twins for m in t["flat_movies"]]
    if tw_m:
        sid, m = tw_m[0]; w, h = (int(x) for x in m["size"].split("×"))
        return "movie", sid, {"url": m["url"], "width": w, "height": h, "filename": m["file"]}
    if movies: return "movie", rec["id"], sorted(movies, key=lambda m: tier(m["width"]))[0]
    stills = sorted([m for m in rec["media"] if m["media_type"] == "Image" and m["width"] and m["width"] <= MAX_W
                     and m["url"].lower().endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff")) and not choose.BAR_RX.search(m["filename"] or "")],
                    key=lambda m: -m["width"])
    if stills: return "still", rec["id"], stills[0]
    return None, None, None

def fetch_frames(sid, kind, asset, n):
    fetch = Fetcher(raw_dir(sid) / "manifest.jsonl", tries=20)
    out = []
    if kind == "frames":
        files = sorted(svs_api.list_folder(asset["url"], depth=0)["files"], key=lambda f: f["name"])
        files = [f for f in files if f["name"].lower().endswith((".png", ".jpg", ".jpeg", ".tif", ".tiff", ".exr"))]
        for i in np.linspace(0, len(files) - 1, min(n, len(files))).round().astype(int):
            p = raw_dir(sid, "frames") / local(files[i]["name"]); fetch.get(files[i]["url"], p, expect_bytes=80_000_000)
            out.append((frames.read_rgba(p), files[i]["name"], int(i), len(files))); p.unlink()
    elif kind == "movie":
        p = raw_dir(sid, "movie") / local(asset["url"].rsplit("/", 1)[1]); fetch.get(asset["url"], p, expect_bytes=2_000_000_000)
        info = frames.probe_movie(p)
        every = max(1, info["frames"] // n)
        for k, f in frames.movie_frames(p, every=every):
            out.append((np.concatenate([f, np.full(f.shape[:2] + (1,), 255, np.uint8)], -1), f"{p.name}#frame{k}", int(k), info["frames"]))
            if len(out) >= n: break
        p.unlink()
    elif kind == "still":
        p = raw_dir(sid, "assets") / local(asset["url"].rsplit("/", 1)[1]); fetch.get(asset["url"], p, expect_bytes=80_000_000)
        out.append((frames.read_rgba(p), p.name, 0, 1))
    return out
