"""SVS API (https://svs.gsfc.nasa.gov/api/<id>, confirmed on 5533/5518/3912) → a normalised record cached as
pipeline/svs/cache/<id>.json (committed): title, dates, full description, credits by role, keywords, related items and
every media asset, with frame folders listed (count, bytes). Asset choice is a rule (choose.py), never a hand pick."""
import json, re
from urllib.parse import urljoin, urlparse
from common import now_utc
from .config import CACHE, SVS
from . import fetch

SIZE_RX = re.compile(r"([\d.]+)\s*(?:&nbsp;|\xa0|\s)?\s*(bytes|B|KB|MB|GB)\b")
UNITS = {"bytes": 1, "B": 1, "KB": 1e3, "MB": 1e6, "GB": 1e9}
HREF_RX = re.compile(r'href=(?:"([^"]+)"|([^\s>]+))')
FILE_EXT = (".png", ".tif", ".tiff", ".jpg", ".jpeg", ".exr", ".mp4", ".mov", ".webm", ".txt", ".csv")

def https(u):
    return "https://" + u[7:] if u and u.startswith("http://") else u

def parse_listing(html, base):
    """Rows of an SVS file listing (old table or new minified format) → [{name, url, bytes, is_dir}]."""
    base = https(base if base.endswith("/") else base + "/")
    base_path = urlparse(base).path
    out, seen = [], set()
    for row in re.split(r"<tr[\s>]", html)[1:]:
        m = HREF_RX.search(row)
        if not m: continue
        href = m.group(1) or m.group(2)
        url = urljoin(base, href)
        path = urlparse(url).path
        if not path.startswith(base_path) or path == base_path or url in seen: continue
        name = path[len(base_path):]
        is_dir = name.endswith("/")
        if not is_dir and not name.lower().endswith(FILE_EXT): continue
        s = SIZE_RX.search(re.sub(r"<[^>]+>", " ", row))
        seen.add(url)
        out.append({"name": name.rstrip("/"), "url": url, "is_dir": is_dir,
                    "bytes": int(float(s.group(1)) * UNITS[s.group(2)]) if s and not is_dir else None})
    return out

def list_folder(url, depth=1):
    """Files in a frame folder; descends `depth` levels of sub-folders (5518 keeps one folder per species)."""
    rows = parse_listing(fetch.text(https(url)), url)
    files = [r for r in rows if not r["is_dir"]]
    subs = {}
    if depth > 0:
        for r in rows:
            if r["is_dir"]: subs[r["name"]] = list_folder(r["url"], depth - 1)
    return {"url": https(url), "files": files, "subfolders": subs}

def folder_summary(listing):
    f = listing["files"]
    frames = [r for r in f if r["name"].lower().endswith((".png", ".tif", ".tiff", ".jpg", ".exr"))]
    return {"url": listing["url"], "frame_count": len(frames),
            "bytes_approx": sum(r["bytes"] or 0 for r in frames) or None,
            "first": frames[0]["name"] if frames else None, "last": frames[-1]["name"] if frames else None,
            "subfolders": {k: folder_summary(v) for k, v in listing["subfolders"].items()}}

def text_links(*texts):
    """Links written inside captions/descriptions (e.g. 3912's per-frame dates file)."""
    out = []
    for t in texts:
        for h in re.findall(r'href="([^"]+)"|\((https?://[^)\s]+)\)', t or ""):
            u = h[0] or h[1]
            if u: out.append(https(urljoin(SVS + "/", u)))
    return list(dict.fromkeys(out))

def normalise(js):
    groups, media, texts = js.get("media_groups", []), [], [js.get("description", "")]
    for gi, g in enumerate(groups):
        texts += [g.get("caption") or "", g.get("description") or ""]
        for it in g.get("items", []):
            ins = it.get("instance") or {}
            if not ins.get("url"): continue
            media.append({"group": gi, "group_title": g.get("title") or "", "widget": g.get("widget"),
                          "caption": g.get("caption") or "", "group_text": g.get("description") or "",
                          "url": https(ins["url"]), "filename": ins.get("filename"), "media_type": ins.get("media_type"),
                          "width": int(ins.get("width") or 0), "height": int(ins.get("height") or 0),
                          "alt_text": ins.get("alt_text") or ""})
    credits = {c["role"]: [f"{p['name']} ({p['employer']})" if p.get("employer") else p["name"] for p in c.get("people", [])]
               for c in js.get("credits", [])}
    brief = lambda xs: [{"id": x.get("id"), "title": x.get("title"), "url": https(x.get("url"))} for x in xs or []]
    long_text = "\n\n".join(dict.fromkeys(t.strip() for t in texts if t and t.strip()))
    return {"id": js["id"], "title": js.get("title"), "url": https(js.get("url")), "page_type": js.get("page_type"),
            "release_date": js.get("release_date"), "update_date": js.get("update_date"),
            "description": js.get("description", ""), "full_text": long_text, "credits_by_role": credits,
            "keywords": js.get("keywords", []), "datasets": js.get("datasets", []), "missions": js.get("missions", []),
            "related": brief(js.get("related")), "alternate_versions": brief(js.get("alternate_versions")),
            "newer_versions": brief(js.get("newer_versions")), "older_versions": brief(js.get("older_versions")),
            "media": media, "text_links": text_links(*texts)}

def fetch_record(sid, refresh=False, list_frames=True):
    """The cached record; refresh=True re-reads the API and re-lists every frame folder."""
    path = CACHE / f"{sid}.json"
    if path.exists() and not refresh:
        return json.loads(path.read_text(encoding="utf-8"))
    js = json.loads(fetch.text(f"{SVS}/api/{sid}"))
    rec = normalise(js)
    if list_frames:
        folders = {}
        for m in rec["media"]:
            if m["media_type"] == "Frames" and m["url"] not in folders:
                try:
                    folders[m["url"]] = folder_summary(list_folder(m["url"]))
                except RuntimeError as e:                      # a listing SVS will not serve is recorded, not fatal
                    folders[m["url"]] = {"url": m["url"], "frame_count": 0, "bytes_approx": None, "first": None, "last": None,
                                         "subfolders": {}, "listing_error": str(e)}
        rec["frame_folders"] = folders
    rec["api_url"] = f"{SVS}/api/{sid}"
    rec["fetched_utc"] = now_utc()
    path.write_text(json.dumps(rec, indent=1, ensure_ascii=False), encoding="utf-8")
    return rec
