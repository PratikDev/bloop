"""Helpers shared by the product checks."""
import json
from common import PUBLIC
from products.datasets import AGENCIES, KINDS
from products.registry import PAIRINGS, PRODUCTS

def info(name, detail):
    """A book comparison: printed, never a failure."""
    print(f"[INFO] {name}  {detail}")

def load(rel):
    """Parsed JSON, or None (with a WARN line) when the optional file is missing."""
    p = PUBLIC / rel
    if not p.exists():
        print(f"[WARN] optional {rel} missing (optional)")
        return None
    return json.load(open(p, encoding="utf-8"))

def header_problems(doc, pid):
    """The §15 ProductHeader: fields, vocabularies, and agreement with the registry (one source of truth)."""
    probs = []
    for k, t in (("product", str), ("title", str), ("pairing", str), ("datasets", list), ("credit", str),
                 ("disclosure", str), ("generated_utc", str)):
        if not isinstance(doc.get(k), t):
            probs.append(f"{k} missing or not {t.__name__}")
    if "source_time_utc" not in doc or not isinstance(doc["source_time_utc"], (str, type(None))):
        probs.append("source_time_utc missing")
    if doc.get("pairing") not in PAIRINGS:
        probs.append(f"pairing {doc.get('pairing')!r}")
    for d in doc.get("datasets", []):
        if d.get("agency") not in AGENCIES or d.get("kind") not in KINDS:
            probs.append(f"dataset {d.get('id')}: agency/kind {d.get('agency')}/{d.get('kind')}")
    p = PRODUCTS[pid]
    if doc.get("product") != pid or doc.get("credit") != p.credit or [d.get("id") for d in doc.get("datasets", [])] != [d.id for d in p.datasets]:
        probs.append("header differs from products/registry.py (re-run the product)")
    if "{" in doc.get("disclosure", ""):
        probs.append("disclosure has an unfilled {placeholder}")
    return probs
