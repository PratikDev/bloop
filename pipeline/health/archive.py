"""Archive drift: for every SVS item behind an archive record (not the rolling daily ones), the SVS API read now against the
copy in pipeline/svs/cache/<id>.json (update date, title, media asset list), and up to SAMPLE whole-file assets from the
record's checksums.tsv.gz against the server's Content-Length. Reports what changed; never re-ingests."""
import gzip, json
from concurrent.futures import ThreadPoolExecutor
import requests
from svs import svs_api
from svs.config import CACHE, SVS, UA
from .files import manifest
from .inventory import DATA

SAMPLE = 5
ROLLING = {5101, 4285, 5176, 5315, 5113, 5584, 5147, 5148, 5149, 5150, 5151, 5152, 5153, 5154, 5544, 5624, 5650}

def archive_ids(recs):
    """{svs id: record} for archive records whose SVS item is cached."""
    out = {}
    for r in recs:
        if r.kind != "official" or r.layer: continue
        for sid in r.svs_ids:
            if sid not in ROLLING and (CACHE / f"{sid}.json").exists(): out.setdefault(sid, r)
    return out

def _assets(rec):
    return {m["url"] for m in rec.get("media", [])}

def _compare(sid):
    old = json.loads((CACHE / f"{sid}.json").read_text(encoding="utf-8"))
    try:
        r = requests.get(f"{SVS}/api/{sid}", headers=UA, timeout=60); r.raise_for_status()
        new = svs_api.normalise(r.json())
    except (requests.RequestException, ValueError, KeyError) as e:
        return {"svs_id": sid, "error": f"{e.__class__.__name__}"}
    a, b = _assets(old), _assets(new)
    return {"svs_id": sid, "update_date": [old.get("update_date"), new.get("update_date")],
            "title_changed": old.get("title") != new.get("title"),
            "assets_added": sorted(b - a)[:10], "assets_removed": sorted(a - b)[:10], "n_assets": [len(a), len(b)]}

def _sizes(record_manifest):
    d = (DATA / record_manifest).parent
    ac = manifest(record_manifest).get("asset_checksums")
    if not ac or not (d / ac["file"]).exists(): return [], []
    rows = [l.split("\t") for l in gzip.decompress((d / ac["file"]).read_bytes()).decode().splitlines()[1:]]
    rows = [r for r in rows if len(r) == 4 and r[1] == "whole" and "svs.gsfc.nasa.gov" in r[0]][:SAMPLE]
    changed, unchecked = [], []                 # a refusal or a timeout is "could not check", not a change
    for url, _, size, _ in rows:
        name = url.rsplit("/", 1)[-1]
        try:
            h = requests.head(url, headers=UA, timeout=30, allow_redirects=True)
            n = h.headers.get("Content-Length")
            if h.status_code >= 400: unchecked.append(f"{name}: HTTP {h.status_code}")
            elif n and int(n) != int(size): changed.append(f"{name}: {size} B at ingest, {n} B now")
        except requests.RequestException as e:
            unchecked.append(f"{name}: {e.__class__.__name__}")
    return changed, unchecked

def changed(row):
    return bool(row.get("error") or row.get("title_changed") or row.get("assets_added") or row.get("assets_removed")
                or row.get("size_changes") or (row.get("update_date") and row["update_date"][0] != row["update_date"][1]))

def run(recs):
    ids = archive_ids(recs)
    with ThreadPoolExecutor(16) as ex:
        rows = list(ex.map(_compare, sorted(ids)))
        sizes = dict(zip(sorted({r.manifest for r in ids.values()}), ex.map(_sizes, sorted({r.manifest for r in ids.values()}))))
    for row in rows:
        rec = ids[row["svs_id"]]
        row["record"] = rec.id
        row["size_changes"], row["size_unchecked"] = sizes.get(rec.manifest, ([], []))
        row["changed"] = changed(row)
    return rows
