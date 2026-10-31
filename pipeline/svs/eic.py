"""EIC Content Database inventory (Part D): every item of the SVS Earth Information Center gallery
(https://svs.gsfc.nasa.gov/gallery/earth-information-center/, API page 40467) and of its sub-galleries, through the SVS API.
Per item: SVS ID, title, where it sits (gallery path), period, variable (keywords/datasets), model or observation (from
the datasets' types and names), projection (frame aspect), frame-set sizes, colorbar yes/no and cadence (frames over the
period). Classes, by rule:
  A — values recoverable: a colorbar with numbers (or a legend) and a flat map frame set or still → processed and validated;
  B — a data picture without a numeric colorbar (or not georeferenceable) → a 'pattern, not values' record;
  C — no data layer to read (documentary video, b-roll, interviews, a page of links) → listed with the reason.
Writes pipeline/svs/cache/eic_inventory.json and docs/official/EIC_INVENTORY.md.
Usage (from pipeline/): python -m svs.eic"""
import json, re
from common import now_utc
from core.log import say
from . import choose, fetch, svs_api
from .config import CACHE, DOCS_OFFICIAL, SVS

GALLERY = 40467
URL = "https://svs.gsfc.nasa.gov/gallery/earth-information-center/"
ID_IN_URL = re.compile(r"/a\d{6}/a\d{6}/a0*(\d+)/")
MODEL_RX = re.compile(r"\b(model|reanalysis|GEOS|MERRA|ECCO|DYAMOND|forecast|simulation|nature run|GISS|CMIP)\b", re.I)
OBS_RX = re.compile(r"\b(satellite|MODIS|VIIRS|Landsat|GEDI|LIS|OCO|GPM|IMERG|SMAP|GRACE|Terra|Aqua|Aura|Suomi|Sentinel|"
                    r"observ|measur|sensor|lidar|radar|TROPOMI|TEMPO|AIRS|CERES|ICESat|SWOT|Jason)\b", re.I)
VIDEO_RX = re.compile(r"\b(interview|b-roll|broll|narrated|documentary|video|smithsonian|jane goodall|resilience|joins)\b", re.I)

def gallery(gid, refresh=False):
    path = CACHE / f"gallery_{gid}.json"
    if path.exists() and not refresh: return json.loads(path.read_text(encoding="utf-8"))
    js = json.loads(fetch.text(f"{SVS}/api/{gid}"))
    path.write_text(json.dumps(js, indent=1, ensure_ascii=False), encoding="utf-8")
    return js

def crawl(gid=GALLERY, trail=(), seen=None, refresh=False):
    """{svs_id: {'via': [gallery path, …]}} for every details page reachable from the gallery."""
    seen = seen if seen is not None else set()
    seen.add(gid)
    js, out = gallery(gid, refresh), {}
    here = trail + (js.get("title") or str(gid),)
    for g in js.get("media_groups", []):
        for it in g.get("items", []):
            ins = it.get("instance") or {}
            kind = it.get("type")
            if kind == "gallery_page" and ins.get("id") not in seen:
                for k, v in crawl(ins["id"], here, seen, refresh).items(): out.setdefault(k, {"via": []})["via"] += v["via"]
                continue
            sid = ins.get("id") if kind == "details_page" else None
            if kind == "media_group":
                m = ID_IN_URL.search(ins.get("url") or "")
                sid = int(m.group(1)) if m else None
            if sid: out.setdefault(int(sid), {"via": []})["via"].append(" › ".join(here + ((g.get("title") or "").strip(),)))
    return out

def describe(rec):
    sets = choose.frame_sets(rec)
    stills = [m for m in rec["media"] if m["media_type"] == "Image" and m["width"] >= 1024]
    flat = [f for f in sets if f["height"] and abs(f["width"] / f["height"] - 2) < 0.01]
    flat_stills = [m for m in stills if m["height"] and abs(m["width"] / m["height"] - 2) < 0.01]
    bars = choose.colorbars(rec)
    text = " ".join([rec["title"] or "", rec["description"] or "", " ".join(map(str, rec.get("keywords") or [])),
                     " ".join(f"{d.get('name', '')} {d.get('type', '')}" for d in rec.get("datasets") or [])])
    kind = ("model" if MODEL_RX.search(text) else "") + ("/" if MODEL_RX.search(text) and OBS_RX.search(text) else "") + \
           ("observation" if OBS_RX.search(text) else "")
    dates = [d.get("date_range") for d in rec.get("datasets") or [] if d.get("date_range")]
    return {"id": rec["id"], "title": rec["title"], "url": rec["url"], "release_date": rec["release_date"],
            "period": dates[0] if dates else None,
            "variable": ", ".join(dict.fromkeys(d.get("name") or "" for d in rec.get("datasets") or []))[:160] or None,
            "model_or_obs": kind or "unclear",
            "projection": "equirectangular (2:1)" if flat or flat_stills else ("other" if sets or stills else "none"),
            "frame_sets": [{"layer": f["layer"], "size": f"{f['width']}×{f['height']}", "frames": f["frame_count"],
                            "gb": round((f["bytes_approx"] or 0) / 1e9, 2)} for f in sets],
            "movies": sum(1 for m in rec["media"] if m["media_type"] == "Movie"),
            "colorbar": bool(bars), "colorbars": [b["filename"] for b in bars][:4],
            "cadence": _cadence(rec, sets)}

def _cadence(rec, sets):
    if not sets: return "still" if any(m["media_type"] == "Image" for m in rec["media"]) else "movie only"
    n = max(f["frame_count"] for f in sets)
    return f"{n} frames per set" + (" (date list linked)" if choose.date_lists(rec) else "")

STORY_PAGES = ("Produced Video", "B-Roll", "Animation")     # SVS page types that tell a story, not show a data layer

def decoded_by():
    """{svs_id: product id} for items a Bloop product already reads (products/registry.py datasets 'svs<id>')."""
    from products.registry import PRODUCTS
    out = {}
    for p in PRODUCTS.values():
        for d in p.datasets:
            if d.id.startswith("svs") and d.id[3:].isdigit(): out.setdefault(int(d.id[3:]), p.id)
    return out

def records_built():
    """{svs_id: 'record (app title)'} from the official records' manifests."""
    from .config import PUBLIC_OFFICIAL
    out = {}
    for m in PUBLIC_OFFICIAL.glob("*/manifest.json"):
        d = json.loads(m.read_text(encoding="utf-8"))
        for sid in d["svs_ids"]: out.setdefault(sid, f"{d['record']} ({d['app_title']})")
    return out

def classify(d, page_type=None, product=None):
    if product: return "A", f"already decoded into values by Bloop product `{product}`"
    if page_type in STORY_PAGES: return "C", f"SVS page type '{page_type}': a narrated or illustrative piece, no data layer with a key"
    if VIDEO_RX.search(d["title"] or "") and not d["colorbar"]: return "C", "documentary / video without a data layer to read"
    if d["projection"] == "none": return "C", "no frames or stills to read"
    if d["colorbar"] and d["projection"].startswith("equirectangular"): return "A", "colorbar and a flat 2:1 map: values recoverable"
    if d["colorbar"]: return "B", "colorbar, but no flat map: pattern only unless a georeference can be fitted"
    return "B", "data picture without a colorbar: pattern, not values"

def main():
    items = crawl()
    products, built = decoded_by(), records_built()
    rows = []
    for sid, v in sorted(items.items()):
        try:
            rec = svs_api.fetch_record(sid)
        except Exception as e:                                   # a page the API cannot serve is listed, not dropped
            rows.append({"id": sid, "title": None, "via": v["via"], "class": "C", "reason": f"SVS API error: {e.__class__.__name__}"}); continue
        d = describe(rec)
        d["class"], d["reason"] = classify(d, rec.get("page_type"), products.get(sid))
        d["page_type"], d["via"], d["record"] = rec.get("page_type"), v["via"], built.get(sid) or products.get(sid)
        rows.append(d)
        say(f"EIC {sid}: {d['class']} {d['title']}")
    out = {"gallery": URL, "api_id": GALLERY, "items": rows, "generated_utc": now_utc(),
           "counts": {c: sum(1 for r in rows if r["class"] == c) for c in "ABC"}}
    (CACHE / "eic_inventory.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    write_doc(out)
    return out

def write_doc(inv):
    """docs/official/EIC_INVENTORY.md."""
    L = ["# EIC Content Database inventory", "", f"Generated by `pipeline/svs/eic.py` from {inv['gallery']} (SVS API page {inv['api_id']}) "
         f"on {inv['generated_utc']}; do not edit by hand.", "",
         f"Items: {len(inv['items'])} (A {inv['counts']['A']}, B {inv['counts']['B']}, C {inv['counts']['C']}). Classes: A = values "
         "recoverable (numeric colorbar + flat map), B = pattern, not values, C = nothing to read (reason given).", "",
         "| SVS ID | Title | Class | Reason | Where | Period | Model / obs | Projection | Frame sets | Colorbar | Cadence | Record |",
         "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in inv["items"]:
        fs = "; ".join(f"{f['layer']} {f['size']} ×{f['frames']} ({f['gb']} GB)" for f in r.get("frame_sets", [])[:3]) or (f"{r.get('movies', 0)} movies" if r.get("movies") else "—")
        L.append(f"| [{r['id']}](https://svs.gsfc.nasa.gov/{r['id']}) | {r['title'] or '—'} | {r['class']} | {r['reason']} | "
                 f"{'<br>'.join(r['via'][:2])} | {r.get('period') or '—'} | {r.get('model_or_obs', '—')} | {r.get('projection', '—')} | {fs} | "
                 f"{'yes' if r.get('colorbar') else 'no'} | {r.get('cadence', '—')} | {r.get('record') or '—'} |")
    (DOCS_OFFICIAL / "EIC_INVENTORY.md").write_text("\n".join(L) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
