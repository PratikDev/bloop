"""Final-report tables, from the records' own files: every official resource and EIC class-A item with its class, record,
status and key validation numbers; every missed threshold; sizes. Prints Markdown.
Usage (from pipeline/): python -m svs.report"""
import json
from .config import CACHE, DOCS_OFFICIAL, PUBLIC_OFFICIAL
from .eic import decoded_by
from .resources import eic_class_a, official_ids, records

def key_numbers(c):
    m = c["metrics"]
    keys = [k for k in m if isinstance(m[k], (int, float)) and not isinstance(m[k], bool)][:4]
    return "; ".join(f"{k} {m[k]:.3g}" if isinstance(m[k], float) else f"{k} {m[k]}" for k in keys) or (str(m.get("reason", ""))[:80])

def main():
    inv = {r["id"]: r for r in json.loads((CACHE / "eic_inventory.json").read_text(encoding="utf-8"))["items"]}
    from products.registry import PRODUCTS
    recs = records()
    live = {k: v for k, v in decoded_by().items() if not PRODUCTS[v].outputs[0].startswith("official/")}    # the app's live layers
    rows, misses = [], []
    for sid in sorted(set(official_ids()) | set(eic_class_a())):
        cls = inv.get(sid, {}).get("class", "—")
        if sid in recs:
            m = recs[sid]; name = m["record"]
            v = json.loads((PUBLIC_OFFICIAL / name / "validation.json").read_text(encoding="utf-8"))["checks"]
        elif sid in live:
            name = f"live_{live[sid]}"
            p = PUBLIC_OFFICIAL / name / "validation.json"
            v = json.loads(p.read_text(encoding="utf-8"))["checks"] if p.exists() else []
        else:
            rows.append(f"| {sid} | {cls} | — | missing | — |"); continue
        status = "; ".join(sorted({l["status"] for l in m.get("layers", [])})) if sid in recs else "live layer"
        nums = " / ".join(f"{c['id']}: {key_numbers(c)}" for c in v[:3])
        rows.append(f"| {sid} | {cls} | `{name}` | {status} | {nums} |")
        for c in v:
            if c["pass"] is False: misses.append(f"| {name} | {c['id']} | {c['threshold']} | {key_numbers(c)} | {(c.get('decision') or {}).get('status', 'pattern only')} |")
    size = sum(p.stat().st_size for p in PUBLIC_OFFICIAL.rglob("*") if p.is_file())
    print("| SVS ID | EIC class | Record | Status | Key numbers |\n|---|---|---|---|---|\n" + "\n".join(rows))
    print("\n| Record | Check | Threshold | Real numbers | Shipped as |\n|---|---|---|---|---|\n" + "\n".join(sorted(set(misses))))
    print(f"\npublic/data/official/: {size / 1e6:.1f} MB")

if __name__ == "__main__":
    main()
