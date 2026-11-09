"""Files: every file a record's manifest names exists and loads; chunk sizes and decoded lengths match the manifest; the
asset checksum list matches its digest; the manifest and validation.json validate against contract-15."""
import gzip, hashlib, json
from functools import lru_cache
from products.registry import PRODUCTS
from .contract import validate
from .inventory import DATA
from .result import res

@lru_cache(maxsize=None)
def manifest(rel):
    return json.loads((DATA / rel).read_text(encoding="utf-8"))

def _official(rec):
    out, d = [], (DATA / rec.manifest).parent
    try: m = manifest(rec.manifest)
    except (OSError, ValueError) as e: return [res("manifest loads", False, e)]
    probs = validate(m, "OfficialManifest")
    vp = d / "validation.json"
    if vp.exists(): probs += validate(json.loads(vp.read_text(encoding="utf-8")), "OfficialValidationFile", "validation")
    else: probs.append("validation.json missing")
    out.append(res("contract-15 schema", not probs, "; ".join(probs[:3])))
    layers = [l for l in m.get("layers", []) if rec.layer in (None, l["id"])]
    bad = []
    for l in layers:
        g, n = l["grid"], len(l["times"])
        if sorted((c["t0"], c["t1"]) for c in l["chunks"]) != [(c["t0"], c["t1"]) for c in sorted(l["chunks"], key=lambda c: c["t0"])] \
                or (l["chunks"] and (l["chunks"][0]["t0"] != 0 or max(c["t1"] for c in l["chunks"]) != n)):
            bad.append(f"{l['id']}: chunks do not cover {n} times")
        for c in l["chunks"]:
            p = d / c["file"]
            if not p.exists(): bad.append(f"{c['file']} missing"); continue
            if p.stat().st_size != c["bytes"]: bad.append(f"{c['file']} {p.stat().st_size} B vs manifest {c['bytes']}")
            try:
                if len(gzip.decompress(p.read_bytes())) != (c["t1"] - c["t0"]) * g["width"] * g["height"] * 2: bad.append(f"{c['file']} decoded length")
            except OSError as e: bad.append(f"{c['file']}: {e}")
    out.append(res("files exist and load", not bad, "; ".join(bad[:3]) or f"{sum(len(l['chunks']) for l in layers)} chunks"))
    ac = m.get("asset_checksums")
    if not ac: out.append(res("checksums match", None, "manifest lists no asset checksums"))
    else:
        try:
            body = gzip.decompress((d / ac["file"]).read_bytes())
            rows = body.decode().count("\n") - 1
            ok = hashlib.sha256(body).hexdigest() == ac["sha256_of_list"] and rows == ac["rows"]
            out.append(res("checksums match", ok, f"{rows} asset rows" + ("" if ok else f" (manifest {ac['rows']}, digest differs)")))
        except OSError as e: out.append(res("checksums match", False, e))
    return out

def _product(rec):
    p = PRODUCTS.get(rec.product)
    outs = p.outputs if p else (rec.manifest,)
    bad = []
    for o in outs:
        f = DATA / o
        if not f.exists() or f.stat().st_size == 0: bad.append(f"{o} missing or empty"); continue
        try:
            if o.endswith(".json"): json.loads(f.read_text(encoding="utf-8"))
            elif o.endswith(".gz"): gzip.decompress(f.read_bytes())
        except (OSError, ValueError) as e: bad.append(f"{o}: {e}")
    if rec.manifest == "sequence/index.json" and not bad:
        for fr in manifest("sequence/index.json")["frames"]:
            for k, v in fr.items():
                if isinstance(v, str) and v.endswith((".gz", ".png", ".json")) and not (DATA / "sequence" / v).exists(): bad.append(f"sequence/{v} missing")
    if rec.manifest == "global/manifest.json" and not bad:
        bad += [f"global/{f} missing" for f in manifest("global/manifest.json")["files"] if not (DATA / "global" / f).exists()]
    return [res("files exist and load", not bad, "; ".join(bad[:3]) or f"{len(outs)} files"),
            res("checksums match", None, "no checksum list for this kind (spotcheck checks the decode)")]

def check(rec):
    if not rec.manifest: return [res("files exist and load", False, "no manifest")]
    return _official(rec) if rec.kind in ("official", "voice") else _product(rec)
