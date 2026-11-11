"""public/data/meta/freshness.json: for every product in products/registry.py its newest source time, age at build
time, freshness limit, status, badges, credit and output sizes. The app's data-age badge, source badges and credits
drawer read this one file (the app recomputes the age from source_time_utc at view time).
Usage: python build_freshness.py [--only=id1,id2] [--datasets]
  --only      updates just those entries, keeping the others as built
  --datasets  rewrites only each entry's datasets and checked_against from the registry (names, badges, links), keeping
              every time, status and size as built"""
import json, sys
from datetime import datetime, timezone
from common import PUBLIC, now_utc, write_json
from products.registry import PRODUCTS

def dig(obj, path):
    """'a.b.-1.c' → obj['a']['b'][-1]['c'] (None when any step is missing)."""
    for k in path.split("."):
        if isinstance(obj, list):
            try:
                obj = obj[int(k)]
            except (ValueError, IndexError):
                return None
        elif isinstance(obj, dict):
            obj = obj.get(k)
        else:
            return None
    return obj

def age_days(t, now):
    try:
        return round((now - datetime.fromisoformat(str(t).replace("Z", "+00:00"))).total_seconds() / 86400, 2)
    except ValueError:
        return None

def dataset_fields(p):
    return {"datasets": [d.as_json() for d in p.datasets], "checked_against": [d.id for d in p.checked_against]}

def entry(p, now):
    base = {"product": p.id, "title": p.title, "outputs": list(p.outputs), "cadence": p.cadence, "pairing": p.pairing,
            **dataset_fields(p), "limit_days": p.limit_days}
    main = PUBLIC / p.outputs[0]
    if not main.exists():
        return {**base, "status": "missing", "source_time_utc": None, "age_days": None, "period": None,
                "credit": p.credit, "bytes": 0}
    doc = json.load(open(main, encoding="utf-8"))
    t = dig(doc, p.time_key)
    age = age_days(t, now) if t else None
    status = ("baseline" if p.limit_days is None else "no-time" if age is None else "stale" if age > p.limit_days else "ok")
    return {**base, "status": status, "source_time_utc": t, "age_days": age,
            "period": [dig(doc, k) for k in p.period_keys] if p.period_keys else None,
            "credit": p.credit or doc.get("credit", ""),
            "bytes": sum((PUBLIC / o).stat().st_size for o in p.outputs if (PUBLIC / o).exists())}

def main():
    now = datetime.now(timezone.utc)
    only = next((a.split("=", 1)[1].split(",") for a in sys.argv if a.startswith("--only=")), None)
    if "--datasets" in sys.argv:
        path = PUBLIC / "meta" / "freshness.json"
        doc = json.load(open(path, encoding="utf-8"))
        doc["products"] = {pid: {**e, **dataset_fields(PRODUCTS[pid])} if pid in PRODUCTS else e for pid, e in doc["products"].items()}
        write_json(path, doc)
        print(f"Rewrote the datasets of {sum(pid in PRODUCTS for pid in doc['products'])} products in public/data/meta/freshness.json")
        return
    old = json.load(open(PUBLIC / "meta" / "freshness.json", encoding="utf-8"))["products"] if only else {}
    products = {pid: (entry(p, now) if not only or pid in only else old[pid]) for pid, p in PRODUCTS.items() if not only or pid in only or pid in old}
    write_json(PUBLIC / "meta" / "freshness.json", {"generated_utc": now_utc(), "products": products})
    for e in products.values():
        print(f"  {e['product']:16} {e['status']:9} age {e['age_days']} d (limit {e['limit_days']})")
    print(f"Wrote public/data/meta/freshness.json ({len(products)} products)")

if __name__ == "__main__":
    main()
