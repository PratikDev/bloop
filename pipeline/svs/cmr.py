"""Collection citations from NASA CMR, cached in pipeline/svs/cache/cmr_<concept id>.json: every validation or voice
source that is not an SVS page gets its credit line from here (copied from CMR, never typed)."""
import json
from .config import CACHE
from .fetch import text

UMM = "https://cmr.earthdata.nasa.gov/search/collections.umm_json?concept_id={cid}"

def collection(cid, refresh=False):
    path = CACHE / f"cmr_{cid}.json"
    if path.exists() and not refresh: return json.loads(path.read_text(encoding="utf-8"))
    umm = json.loads(text(UMM.format(cid=cid)))["items"][0]["umm"]
    path.write_text(json.dumps(umm, indent=1, ensure_ascii=False), encoding="utf-8")
    return umm

def citation(cid):
    """{short_name, version, title, creator, publisher, doi, text}; text follows the DAAC citation pattern."""
    u = collection(cid)
    c = (u.get("CollectionCitations") or [{}])[0]
    doi = (u.get("DOI") or {}).get("DOI")
    year = (c.get("ReleaseDate") or "")[:4]
    parts = [c.get("Creator"), year, c.get("Title") or u.get("EntryTitle"), f"Ver. {c.get('Version') or u.get('Version')}",
             ", ".join(p for p in (c.get("Publisher"), c.get("ReleasePlace")) if p), f"https://doi.org/{doi}" if doi else None]
    return {"concept_id": cid, "short_name": u["ShortName"], "version": u.get("Version"), "title": c.get("Title") or u.get("EntryTitle"),
            "creator": c.get("Creator"), "publisher": c.get("Publisher"), "doi": doi,
            "text": ". ".join(p for p in parts if p) + "."}
