"""The common header of every new product file (data contract §15 `ProductHeader`) and the writers. Title, badges,
credit and disclosure come from products/registry.py; a disclosure with {placeholders} is filled from the parameters
the product actually used, so no number in it is typed by hand."""
import numpy as np
from common import PUBLIC, now_utc, write_json
from products.registry import PRODUCTS
from .log import say

def header(pid, source_time_utc, fmt=None):
    p = PRODUCTS[pid]
    return {"product": pid, "title": p.title, "pairing": p.pairing, "datasets": [d.as_json() for d in p.datasets],
            "credit": p.credit, "disclosure": p.disclosure.format(**(fmt or {})),
            "source_time_utc": source_time_utc, "generated_utc": now_utc()}

def publish_json(rel, obj):
    path = write_json(PUBLIC / rel, obj)
    say(f"wrote public/data/{rel} ({path.stat().st_size:,} bytes)")
    return path

def publish_bin(rel, arr: np.ndarray):
    path = PUBLIC / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    arr.tofile(path)
    say(f"wrote public/data/{rel} ({path.stat().st_size:,} bytes)")
    return path

def iso(t):
    """datetime → the contract's UTC string."""
    return t.strftime("%Y-%m-%dT%H:%M:%SZ") if t is not None else None
