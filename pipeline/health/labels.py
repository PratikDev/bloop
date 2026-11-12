"""Labels are honest (data side; the app side is e2e/health-records.e2e.ts): the index row, freshness.json and
VALIDATION_TABLE.md say exactly what the manifest and validation.json say, and credits and licence lines are present."""
import json
from functools import lru_cache
from common import nested_credits
from svs.config import REPO
from .files import manifest
from .inventory import DATA
from .result import res

@lru_cache(maxsize=1)
def _index():
    return {r["record"]: r for idx in ("official", "related") for r in json.loads((DATA / idx / "index.json").read_text(encoding="utf-8"))["records"]}

@lru_cache(maxsize=1)
def _table():
    return (REPO / "docs" / "official" / "VALIDATION_TABLE.md").read_text(encoding="utf-8").splitlines()

@lru_cache(maxsize=1)
def _fresh():
    return json.loads((DATA / "meta" / "freshness.json").read_text(encoding="utf-8"))["products"]

def table_result(c):
    """The Result cell validate._table writes for a check."""
    r = "no threshold" if c.get("pass") is None else ("PASS" if c["pass"] else "MISS")
    return f"{r}: {c['decision']['table']}" if c.get("decision") else r

def _validation_rows(record, folder):
    p = DATA / folder / record / "validation.json"
    if not p.exists(): return res("validation table = validation.json", None, "no validation.json")
    checks = json.loads(p.read_text(encoding="utf-8"))["checks"]
    rows = [r for r in _table() if r.startswith(f"| {record} |")]
    bad = []
    for c in checks:
        row = next((r for r in rows if r.startswith(f"| {record} | {c['id']}: ")), None)
        if row is None: bad.append(f"{c['id']}: no table row")
        elif row.rstrip().rstrip("|").rsplit("|", 1)[-1].strip() != table_result(c): bad.append(f"{c['id']}: table says {row.rsplit('|', 2)[-2].strip()!r}, file {table_result(c)!r}")
    if len(rows) != len(checks): bad.append(f"{len(rows)} table rows vs {len(checks)} checks")
    return res("validation table = validation.json", not bad, "; ".join(bad[:3]) or f"{len(checks)} checks")

def _official(rec):
    m = manifest(rec.manifest)
    out = []
    name = m["record"]
    row = _index().get(name)
    if row:
        diffs = [k for k, a, b in (("period", row["period"], m["period"]["label"]), ("badge", row["badge"], m["badge"]),
                                   ("title", row["title"], m["app_title"]), ("svs_ids", row["svs_ids"], m["svs_ids"])) if a != b]
        out.append(res("index = manifest (period, badge, title)", not diffs, f"differs: {diffs}" if diffs else m["period"]["label"]))
    f = _fresh().get(name)
    if f:
        per = f.get("period") or []
        ok = not per or (per[0] == m["period"]["start"] and per[1] == m["period"]["end"])
        out.append(res("freshness.json period = manifest", ok, f"{per} vs {m['period']['start']}…{m['period']['end']}"))
    out.append(_validation_rows(name, rec.manifest.split("/")[0]))
    missing = [k for k in ("credit_line", "licence") if not (m.get(k) or "").strip()]
    if m.get("svs_pages") and not m.get("credits_by_role"): missing.append("credits_by_role")
    out.append(res("credits and licence present", not missing, f"missing {missing}" if missing else m["credit_line"][:80]))
    return out

def _product(rec):
    from products.registry import PRODUCTS
    p = PRODUCTS.get(rec.product)
    head = manifest(rec.manifest) if rec.manifest.endswith(".json") else {}
    credit = (p.credit if p and p.credit else "") or head.get("credit") or ""
    if not str(credit).strip():
        parts = nested_credits(head) + [c for f in head.get("files", []) if (DATA / "global" / f).exists() and rec.manifest.startswith("global/")
                                        for c in nested_credits(json.loads((DATA / "global" / f).read_text(encoding="utf-8")))]
        credit = "; ".join(dict.fromkeys(parts))
    out = [res("credits present", bool(str(credit).strip()), str(credit)[:80] or "no credit")]
    if rec.product and rec.product in _fresh():
        out.append(res("in freshness.json", True, _fresh()[rec.product]["status"]))
    elif p:
        out.append(res("in freshness.json", False, "registry product missing from meta/freshness.json"))
    live = DATA / "official" / f"live_{rec.product}"
    if live.is_dir(): out.append(_validation_rows(f"live_{rec.product}", "official"))
    return out

def check(rec):
    if not rec.manifest or not (DATA / rec.manifest).exists(): return []
    if rec.kind == "official" and rec.layer is None: return _official(rec)
    if rec.kind in ("product", "file"): return _product(rec)
    return []
