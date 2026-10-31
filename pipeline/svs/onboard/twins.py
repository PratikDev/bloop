"""The twin finder: for any SVS ID, the versions of the same visualization that give a flat 2:1 map (Science On a Sphere,
equirectangular, flat-map cuts). Candidates, in order: the record's own related / alternate / newer / older items, then
an SVS keyword search on its title plus 'Science On a Sphere' and 'equirectangular'. A candidate is a twin when its
title shares at least MIN_SHARED title words with the original (or it is listed as an alternate version) and it has a
2:1 frame set with frames, or a 2:1 movie. Twins inherit the original's colorbar when they list none.
Usage: find(record) → [{'id', 'title', 'reason', 'flat_sets', 'flat_movies', 'colorbars'}]."""
import json, re
from .. import choose, fetch, svs_api
from ..config import SVS
from ..discover import API

MIN_SHARED, SEARCH_TERMS, MAX_SEARCH = 2, ("Science On a Sphere", "equirectangular"), 12
STOP = {"the", "a", "of", "and", "in", "on", "for", "to", "version", "sos", "science", "sphere", "from", "with", "nasa", "s"}

def words(title):
    return {w for w in re.findall(r"[a-z0-9]+", (title or "").lower()) if w not in STOP and len(w) > 1}

def flat(rec):
    sets = [s for s in choose.frame_sets(rec) if s["height"] and abs(s["width"] / s["height"] - 2) < 0.01]
    movies = [m for m in rec["media"] if m["media_type"] == "Movie" and m["height"] and abs(m["width"] / m["height"] - 2) < 0.01]
    return sets, movies

def record(sid):
    try: return svs_api.fetch_record(sid, cache=API)
    except Exception: return None

def search(title):
    out = []
    for extra in SEARCH_TERMS:
        q = " ".join(sorted(words(title), key=len, reverse=True)[:3] + [extra])
        try: js = json.loads(fetch.text(f"{SVS}/api/search/?search={q}"))
        except Exception: continue
        out += [r["id"] for r in js.get("results", [])[:MAX_SEARCH]]
    return list(dict.fromkeys(out))

def find(rec):
    near = [(x["id"], k) for k in ("alternate_versions", "related", "newer_versions", "older_versions") for x in rec.get(k) or [] if x.get("id")]
    cands = list(dict.fromkeys(near)) + [(i, "search") for i in search(rec["title"]) if i not in {n for n, _ in near} and i != rec["id"]]
    own = words(rec["title"])
    out = []
    for sid, how in cands:
        r = record(sid)
        if not r or "error" in r: continue
        shared = len(own & words(r["title"]))
        if how != "alternate_versions" and shared < MIN_SHARED: continue
        sets, movies = flat(r)
        if not (sets or movies): continue
        out.append({"id": sid, "title": r["title"], "reason": f"{how}; {shared} title words shared",
                    "flat_sets": [{"layer": s["layer"], "size": f"{s['width']}×{s['height']}", "frames": s["frame_count"], "url": s["url"]} for s in sets],
                    "flat_movies": [{"file": m["filename"], "size": f"{m['width']}×{m['height']}", "url": m["url"]} for m in movies],
                    "colorbars": [m["filename"] for m in choose.colorbars(r)] or [m["filename"] for m in choose.colorbars(rec)],
                    "colorbar_inherited": not choose.colorbars(r)})
    return out
