"""A record must play from the moment it opens: no time step without a single value (a silent frame), and every play
option's needle starting on a cell the app can read (src/lib/data/official.ts officialValueAt: row/col by floor,
code 65535 = no value). fix() is applied by export.write_manifest to every record it writes; run as a module it applies
the same fix to the records already in public/data (manifest edits and re-chunked steps only; values never change).
Usage (from pipeline/): python -m svs.playable [--write]"""
import gzip, json, sys
import numpy as np
from .config import PUBLIC_OFFICIAL, PUBLIC_RELATED, record_dir

NODATA, BELOW = 65535, 65534

def cell(layer, lat, lon):
    """(row, col) the app reads for a needle; None outside the layer's bounds."""
    w, s, e, n = layer["grid"]["bounds"]
    W, H = layer["grid"]["width"], layer["grid"]["height"]
    if lat < s or lat > n or lon < w or lon > e: return None
    return min(H - 1, int((n - lat) / (n - s) * H)), min(W - 1, int((lon - w) / (e - w) * W))

def centre(layer, r, c):
    w, s, e, n = layer["grid"]["bounds"]
    return {"lat": round(n - (r + 0.5) * (n - s) / layer["grid"]["height"], 4), "lon": round(w + (c + 0.5) * (e - w) / layer["grid"]["width"], 4)}

def codes(record, layer):
    """(T, H, W) uint16 codes of one layer, read from its chunks."""
    g, d = layer["grid"], record_dir(record)
    parts = [np.frombuffer(gzip.decompress((d / c["file"]).read_bytes()), "<u2").reshape(c["t1"] - c["t0"], g["height"], g["width"])
             for c in sorted(layer["chunks"], key=lambda c: c["t0"])]
    return np.concatenate(parts) if parts else np.zeros((0, g["height"], g["width"]), "<u2")

def _gz(arr):
    from .export import gz
    return gz(arr)

def drop_empty_steps(record, man):
    """Remove time steps that are empty in every layer (only when all layers share one time axis). → steps dropped."""
    layers = man.get("layers", [])
    if not layers or len({len(l["times"]) for l in layers}) != 1: return []
    q = {l["id"]: codes(record, l) for l in layers}
    T = len(layers[0]["times"])
    empty = [t for t in range(T) if all(not (q[l["id"]][t] < NODATA).any() for l in layers)]
    if not empty or len(empty) == T: return []
    keep = [t for t in range(T) if t not in empty]
    for l in layers:
        k = q[l["id"]][keep]
        chunk_t = max((c["t1"] - c["t0"] for c in l["chunks"]), default=32)
        for c in l["chunks"]: (record_dir(record) / c["file"]).unlink(missing_ok=True)
        l["chunks"] = []
        for i, t0 in enumerate(range(0, len(keep), chunk_t)):
            name, data = f"{l['id']}_{i:03d}.u16.gz", _gz(k[t0:t0 + chunk_t])
            (record_dir(record) / name).write_bytes(data)
            l["chunks"].append({"file": name, "t0": t0, "t1": min(len(keep), t0 + chunk_t), "bytes": len(data)})
        l["times"] = [l["times"][t] for t in keep]
        if l.get("time_labels"): l["time_labels"] = [l["time_labels"][t] for t in keep]
        l["coverage"] = float((k < BELOW).mean())
    if "frame_times" in man: man["frame_times"]["count"] = len(keep)
    man.setdefault("playable", {})["dropped_empty_steps"] = empty
    return empty

def snap_starts(record, man):
    """Move each play option's start to the nearest cell where its map and first voice have a value at step 0. → moved ids."""
    layers = {l["id"]: l for l in man.get("layers", [])}
    moved = []
    for opt in man.get("play", []):
        ids = list(dict.fromkeys([opt["map"], *(opt["channels"][0]["layers"] if opt["channels"] else [])]))
        if any(i not in layers for i in ids): continue
        m = layers[opt["map"]]
        q = {i: codes(record, layers[i]) for i in ids}
        if any(q[i].shape[0] == 0 for i in ids): continue
        def has(lat, lon):
            for i in ids:
                rc = cell(layers[i], lat, lon)
                if rc is None or q[i][0][rc] >= NODATA: return False
            return True
        if has(opt["start"]["lat"], opt["start"]["lon"]): continue
        H, W = m["grid"]["height"], m["grid"]["width"]
        cand = [(r, c) for r, c in zip(*np.nonzero(q[opt["map"]][0] < NODATA)) if has(**centre(m, r, c))]
        if not cand: continue
        r0, c0 = cell(m, opt["start"]["lat"], max(m["grid"]["bounds"][0], min(m["grid"]["bounds"][2], opt["start"]["lon"]))) or (H // 2, W // 2)
        wrap = m["grid"].get("space") != "frame" and m["grid"]["bounds"][2] - m["grid"]["bounds"][0] >= 360
        def dist(rc):
            dc = abs(int(rc[1]) - c0)
            return (int(rc[0]) - r0) ** 2 + (min(dc, W - dc) if wrap else dc) ** 2
        best = min(cand, key=dist)
        opt["start"] = {**centre(m, *best)}
        moved.append(opt["id"])
    if moved: man.setdefault("playable", {})["moved_starts"] = moved
    return moved

def fix(record, man):
    """Both fixes, in place on the manifest dict (chunks rewritten only if a step is dropped)."""
    drop_empty_steps(record, man)
    snap_starts(record, man)
    return man

def main(write):
    for path in sorted([*PUBLIC_OFFICIAL.glob("*/manifest.json"), *PUBLIC_RELATED.glob("*/manifest.json")]):
        man = json.loads(path.read_text(encoding="utf-8"))
        if not man.get("play"): continue
        before = json.dumps(man)
        if write: fix(man["record"], man)
        else:
            dry = json.loads(before)
            empty = [t for t in range(len(dry["layers"][0]["times"])) if all(not (codes(man["record"], l)[t] < NODATA).any() for l in dry["layers"])] \
                if len({len(l["times"]) for l in dry["layers"]}) == 1 else []
            moved = snap_starts(man["record"], dry)
            if empty or moved: print(f"{man['record']}: empty steps {empty}, starts to move {moved}")
            continue
        if json.dumps(man) != before:
            from .export import write_size
            write_size(man["record"], man)
            path.write_text(json.dumps(man, indent=1, ensure_ascii=False, allow_nan=False), encoding="utf-8")
            print(f"{man['record']}: {man.get('playable')}")

if __name__ == "__main__":
    main("--write" in sys.argv)
