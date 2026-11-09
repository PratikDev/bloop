"""Every record Bloop ships, one row each, built from the repo (never typed): the product registry (live, integration,
history), public/data/official|related/index.json and their manifests (official, EIC class A, method, related, GIBS),
the EIC inventory's class-B items (each a layer of patterns_eic or a related record), and the history files the app
reads that no product owns. `problems()` is the completeness rule: a manifest nobody lists, or a listed record with no
manifest, is a failure."""
import json
from dataclasses import dataclass, field
from pathlib import Path
from products.registry import PRODUCTS
from svs.config import CACHE, REPO

DATA = REPO / "public" / "data"
CATEGORIES = {"live": "live layer", "integration": "data integration", "history": "history", "official": "official resource",
              "eic_a": "EIC class A", "eic_b": "EIC class B (pattern)", "related": "related", "gibs": "GIBS", "method": "method"}
LIVE = ("sst", "rain", "sequence")
TRUTH = ("sst_pairs", "rain_pairs", "threeway")
# History files the app reads (src/lib/data/paths.ts) that no registry product owns; global/manifest.json lists its layers.
HISTORY_FILES = ("context/ensemble_bd.json", "context/globe_duet.json", "demo/dhaka_then_now.json", "demo/cities_then_now.json",
                 "global/manifest.json")
NOT_RECORDS = ("meta/freshness.json", "meta/health.json", "official/index.json", "related/index.json")

@dataclass
class Record:
    id: str
    category: str
    title: str
    manifest: str                      # path under public/data
    kind: str                          # "official" (contract-15 manifest) | "product" (registry header JSON) | "file"
    svs_ids: tuple = ()
    source: str = ""
    status: str = ""
    product: str | None = None         # its freshness.json key
    layer: str | None = None           # one layer of a shared manifest (patterns_eic, rel_gibs)
    notes: list = field(default_factory=list)

def _json(rel):
    return json.loads((DATA / rel).read_text(encoding="utf-8"))

def _table_status(name):
    """Result column of the record's VALIDATION_TABLE.md rows, de-duplicated ("" when it has none)."""
    table = (REPO / "docs" / "official" / "VALIDATION_TABLE.md").read_text(encoding="utf-8")
    res = [r.rsplit("|", 2)[-2].strip().split(":")[0] for r in table.splitlines() if r.startswith(f"| {name} |")]
    return ", ".join(dict.fromkeys(res))

def _product_rows():
    live_of = {p: f"live_{p}" for p in PRODUCTS if (DATA / "official" / f"live_{p}").is_dir()}
    rows = []
    for p in PRODUCTS.values():
        if p.outputs[0].startswith(("official/", "related/")) and p.id != "oscar_3912": continue
        if p.id == "oscar_3912":
            cat, manifest, kind = "official", p.outputs[0], "voice"
        elif p.id in LIVE: cat, manifest, kind = "live", p.outputs[0], "product"
        elif p.module or p.id in TRUTH: cat, manifest, kind = "integration", p.outputs[0], "product"
        else: cat, manifest, kind = "history", p.outputs[0], "product"
        svs = tuple(int(d.id[3:]) for d in p.datasets if d.id.startswith("svs") and d.id[3:].isdigit())
        status = _table_status(live_of[p.id]) if p.id in live_of else ("baseline" if p.limit_days is None else "")
        rows.append(Record(p.id, cat, p.title, manifest, kind, svs, "; ".join(d.name for d in p.datasets), status, p.id))
    return rows

def _manifest_rows():
    rows = []
    for idx in ("official/index.json", "related/index.json"):
        for r in _json(idx)["records"]:
            name, rel = r["record"], f"{idx.split('/')[0]}/{r['manifest']}"
            m = _json(rel) if (DATA / rel).exists() else {"layers": [], "datasets": []}
            cat = ("eic_a" if name.startswith("eic_") else "eic_b" if name == "patterns_eic" else "method" if name.startswith("sonification")
                   else "gibs" if name == "rel_gibs" else "related" if name.startswith("rel_") else "official")
            src = "; ".join(d.get("name", "") for d in m.get("datasets", []) if isinstance(d, dict)) or ", ".join(f"SVS {i}" for i in r["svs_ids"])
            status = ", ".join(dict.fromkeys(l.get("status", "") for l in m["layers"]))
            prod = name if name in PRODUCTS else None
            if cat == "eic_b": continue                    # one row per class-B item instead (below)
            rows.append(Record(name, cat, r["title"], rel, "official", tuple(r["svs_ids"]), src, status, prod))
            if cat == "gibs":
                rows += [Record(f"{name}:{l['id']}", cat, l.get("label") or l["id"], rel, "official", (), l["id"], l.get("status", ""), None, l["id"])
                         for l in m["layers"]]
    for mp in sorted((DATA / "official").glob("*/manifest.json")):     # method evidence: a manifest with nothing to play, not indexed
        m = json.loads(mp.read_text(encoding="utf-8"))
        if not m.get("play"):
            rows.append(Record(m["record"], "method", m["app_title"], mp.relative_to(DATA).as_posix(), "official", tuple(m["svs_ids"]),
                               "; ".join(d.get("name", "") for d in m.get("datasets", []) if isinstance(d, dict)),
                               ", ".join(dict.fromkeys(l.get("status", "") for l in m["layers"])) or "method evidence", m["record"]))
    return rows

def _class_b_rows():
    inv = json.loads((CACHE / "eic_inventory.json").read_text(encoding="utf-8"))
    pat = _json("official/patterns_eic/manifest.json")
    layers = {l["id"]: l for l in pat["layers"]}
    covering = {sid: (idx, r["record"]) for idx in ("official", "related") for r in _json(f"{idx}/index.json")["records"]
                for sid in r["svs_ids"] if r["record"] != "patterns_eic"}
    rows = []
    for it in inv["items"]:
        if it["class"] != "B": continue
        lid = f"svs{it['id']}"
        if lid in layers:
            rows.append(Record(f"patterns_eic:{lid}", "eic_b", it["title"], "official/patterns_eic/manifest.json", "official",
                               (it["id"],), it.get("variable") or "", layers[lid].get("status", ""), "patterns_eic", lid))
        else:
            idx, rec = covering.get(it["id"], (None, None))
            rows.append(Record(f"eic_b:{it['id']}", "eic_b", it["title"], f"{idx}/{rec}/manifest.json" if rec else "", "official",
                               (it["id"],), it.get("variable") or "", "", rec if rec in PRODUCTS else None, None,
                               [f"covered by {idx} record {rec}"] if rec else ["no layer in patterns_eic and no record lists it"]))
    return rows

def _file_rows():
    return [Record(f"file:{f}", "history", f, f, "file", (), (_json(f).get("credit") or _json(f).get("disclosure") or "")[:200]
                   if (DATA / f).exists() else "", "baseline") for f in HISTORY_FILES]

def records():
    return _product_rows() + _manifest_rows() + _class_b_rows() + _file_rows()

def claimed(recs):
    """Every file under public/data that a record owns as its manifest or a declared output."""
    out = {r.manifest for r in recs if r.manifest}
    for p in PRODUCTS.values(): out |= set(p.outputs)
    gm = DATA / "global" / "manifest.json"
    if gm.exists(): out |= {f"global/{f}" for f in json.loads(gm.read_text(encoding="utf-8"))["files"]}
    return out

def problems(recs=None):
    """The completeness rule as a list of failures (empty = complete)."""
    recs = recs or records()
    bad, own = [], claimed(recs)
    for r in recs:
        if not r.manifest or not (DATA / r.manifest).exists(): bad.append(f"{r.id}: listed but has no manifest ({r.manifest or 'none'})")
    for p in sorted([*DATA.glob("official/*/manifest.json"), *DATA.glob("related/*/manifest.json")]):
        rel = p.relative_to(DATA).as_posix()
        if rel not in own: bad.append(f"{rel}: manifest not in the inventory")
    for d in sorted(DATA.glob("official/live_*")):
        if d.name[5:] not in PRODUCTS: bad.append(f"{d.relative_to(DATA).as_posix()}: live validation folder with no product")
    for p in sorted(DATA.glob("*/*.json")):
        rel = p.relative_to(DATA).as_posix()
        if rel in NOT_RECORDS or (p.parent.name == "sequence" and p.name != "index.json"): continue
        if rel not in own: bad.append(f"{rel}: data file no record owns")
    method = {r.id for r in recs if r.category == "method"}
    for idx in ("official", "related"):
        listed = {r["record"] for r in _json(f"{idx}/index.json")["records"]}
        for d in (DATA / idx).iterdir():
            if (d / "manifest.json").exists() and d.name not in listed and d.name not in method: bad.append(f"{idx}/{d.name}: manifest not in {idx}/index.json")
    return bad

if __name__ == "__main__":
    rs = records()
    for c in CATEGORIES: print(f"{CATEGORIES[c]:24} {sum(r.category == c for r in rs)}")
    print("\n".join(problems(rs)) or "complete")
