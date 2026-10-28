"""meta/freshness.json, plus the S-NPP rule for every new product (no S-NPP product may feed the app after 2 Nov 2026)."""
from products.registry import PRODUCTS
from .common import load

SNPP_MARKERS = ("SNPP", "S-NPP", "Suomi", "VNP")

def run(check):
    f = load("meta/freshness.json")
    if f is not None:
        missing = sorted(set(PRODUCTS) - set(f.get("products", {})))
        bad = [k for k, e in f["products"].items() if e.get("status") not in ("ok", "stale", "baseline", "missing", "no-time")]
        check("meta/freshness.json lists every registry product with a status", not missing and not bad,
              f"missing {missing}; bad status {bad}")
        stale = [k for k, e in f["products"].items() if e["status"] == "stale"]
        print(f"[{'WARN' if stale else 'PASS'}] freshness: products past their limit (play as 'recorded'): {stale}")
    live = [p for p in PRODUCTS.values() if p.limit_days is not None and p.module]
    snpp = [f"{p.id}:{d.id}" for p in live for d in p.datasets if any(m in d.name or m in d.id.upper() for m in SNPP_MARKERS)]
    check("no current product reads S-NPP (NOAA-20/21 only)", not snpp, f"{snpp}")
