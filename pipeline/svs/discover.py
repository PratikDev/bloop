"""Phase 0 of the related-datasets plan (docs/related/RELATED_DATASETS_REPORT.md): verify every SVS candidate live.
Sources of candidate IDs, all read fresh from the SVS API on the day:
  tree    — the EIC gallery (40467) and the child galleries named in the plan, crawled recursively, plus each item's
            related / alternate / newer / older items (one level);
  search  — api/search/?search=<term> for every TERM (all result pages, up to SEARCH_MAX hits per term);
  report  — every SVS ID the report names (svs.gsfc.nasa.gov links, and the IDs in its tables).
Every candidate's API record is read (frame folders listed, so counts and sizes are real) into data_raw/related/api/;
the committed outputs are the summary rows (discover_report.py). An ID the API does not serve is recorded as such.
Usage (from pipeline/): python -m svs.discover"""
import json, re
from concurrent.futures import ThreadPoolExecutor
from core.log import say
from . import choose, eic, fetch, svs_api
from .config import CACHE, REPO, SVS, raw_dir
from .resources import ids_in

TREE = (40467, 40509, 40473, 40477, 40479, 40529, 40531, 40512, 40476, 40483, 40503)
TERMS = ("sonification", "lightning", "atmospheric river", "sea level", "biodiversity", "energy", "flood", "drought",
         "wildfire", "smoke", "aerosol", "air quality", "carbon dioxide", "methane", "night lights", "Black Marble", "GEDI",
         "forest", "ocean currents", "salinity", "IMERG", "Science On a Sphere")
SEARCH_MAX, WORKERS = 60, 4
REPORT = REPO / "docs" / "related" / "RELATED_DATASETS_REPORT.md"
API = raw_dir("related", "api")
NOT_ID = re.compile(r"(\d)\s*[×x]\s*$|^\s*[×x]")           # a number next to × is a size, not an ID
YEARS = range(1800, 2031)
NOT_IDS = {100, 412, 422, 500, 600, 1131, 1851, 2392}       # in the report but not SVS IDs: scale values, SVS dataset 1131, NGC numbers

def report_ids():
    """SVS IDs the report names: its SVS links, and 3–5 digit numbers in its table cells that are not years or sizes."""
    text = REPORT.read_text(encoding="utf-8")
    ids = set(ids_in(text)) - NOT_IDS
    for line in text.splitlines():
        if not line.startswith("|"): continue
        cells = re.sub(r"\([^)]*\)", "", line)                              # drop link targets (DOIs, URLs)
        for m in re.finditer(r"(?<![\w./-])(?<!\d[.,])(\d{3,5})(?![\w/%°-])(?![.,]\d)", cells):
            n = int(m.group(1))
            before, after = cells[max(0, m.start() - 3):m.start()], cells[m.end():m.end() + 3]
            if n in YEARS or n in NOT_IDS or NOT_ID.search(before) or NOT_ID.search(after): continue
            ids.add(n)
        for a, b in re.findall(r"(\d{3,5})\s*[–-]\s*(\d{3,5})", cells):     # "186–189": a run of IDs
            if int(a) not in YEARS and 0 < int(b) - int(a) < 10: ids.update(range(int(a), int(b) + 1))
        for a, b in re.findall(r"(\d{4,5})/(\d{4,5})", cells): ids.update((int(a), int(b)))   # "30878/30877"
    return ids

def tree():
    """{id: [gallery paths]} for the EIC tree, read fresh."""
    out = {}
    for root in TREE:
        for sid, v in eic.crawl(root, refresh=True).items(): out.setdefault(sid, []).extend(v["via"])
    return {k: sorted(set(v)) for k, v in out.items()}

def search(term):
    """[{id, title, result_type, hits}] for one term, all pages up to SEARCH_MAX."""
    url, out = f"{SVS}/api/search/?search={term}", []
    while url and len(out) < SEARCH_MAX:
        js = json.loads(fetch.text(url))
        out += [{"id": r["id"], "title": r["title"], "result_type": r.get("result_type"), "hits": r.get("hits")} for r in js["results"]]
        url = svs_api.https(js.get("next"))
    return out[:SEARCH_MAX]

def record(sid):
    """The live API record (frames listed) or {'id', 'error'} when the API does not serve it."""
    try:
        return svs_api.fetch_record(sid, refresh=not (API / f"{sid}.json").exists(), cache=API)
    except Exception as e:                                                   # a missing or broken ID is a finding, not a crash
        return {"id": sid, "error": f"{e.__class__.__name__}: {str(e)[:160]}"}

def neighbours(rec):
    return {x["id"] for k in ("related", "alternate_versions", "newer_versions", "older_versions") for x in rec.get(k) or [] if x.get("id")}

def main():
    t = tree()
    say(f"tree: {len(t)} items")
    hits = {term: search(term) for term in TERMS}
    say(f"search: {sum(len(v) for v in hits.values())} hits over {len(TERMS)} terms")
    rep = report_ids()
    with ThreadPoolExecutor(WORKERS) as ex:
        first = dict(zip(t, ex.map(record, list(t))))
    near = {n for r in first.values() for n in neighbours(r)} - set(t)
    found = {h["id"] for v in hits.values() for h in v}
    rest = sorted((near | found | rep) - set(first))
    with ThreadPoolExecutor(WORKERS) as ex:
        recs = {**first, **dict(zip(rest, ex.map(record, rest)))}
    sources = {sid: sorted({*(["tree"] if sid in t else []), *(["related"] if sid in near else []), *(["search"] if sid in found else []),
                            *(["report"] if sid in rep else [])}) for sid in recs}
    out = {"tree": {str(k): v for k, v in t.items()}, "search": hits, "report_ids": sorted(rep), "sources": {str(k): v for k, v in sources.items()},
           "errors": {str(k): r["error"] for k, r in recs.items() if "error" in r}}
    (raw_dir("related") / "discover.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    say(f"records: {len(recs)} read, {len(out['errors'])} not served")

if __name__ == "__main__":
    main()
