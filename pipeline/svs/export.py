"""Data contract for official records (src/types/contract-15/official.ts). Per record, public/data/official/<record>/:
  manifest.json — provenance, period, badge, credits, frame times, georef, colorbars, layers, validation, checksums;
  <layer>_<k>.u16.gz — time chunks, each T×H×W little-endian uint16 (row 0 = north edge of the layer's bounds,
                       col 0 = west edge), gzip; value = q·scale + offset (encoding "linear") or 10^(q·scale + offset)
                       ("log10"); q = 65535 is no data.
A record stays ≤ RECORD_BUDGET_BYTES: fit() picks the first (space, time) reduction that fits and the manifest says so."""
import gzip, io, json, subprocess
import numpy as np
from common import now_utc
from core.log import say
from .config import PUBLIC_OFFICIAL, RECORD_BUDGET_BYTES, REPO

NODATA = 65535

def quantise(values, encoding="linear", vmin=None, vmax=None):
    """float array (NaN = no data) → (uint16, scale, offset). Range from the data unless given."""
    v = np.asarray(values, np.float64)
    x = np.log10(np.where(v > 0, v, np.nan)) if encoding == "log10" else v
    lo = np.nanmin(x) if vmin is None else (np.log10(vmin) if encoding == "log10" else vmin)
    hi = np.nanmax(x) if vmax is None else (np.log10(vmax) if encoding == "log10" else vmax)
    scale = max((hi - lo) / 65534.0, 1e-12)
    q = np.round((np.clip(x, lo, hi) - lo) / scale)
    q = np.where(np.isfinite(x), q, NODATA).astype("<u2")
    return q, float(scale), float(lo)

def dequantise(q, scale, offset, encoding="linear"):
    x = q.astype(np.float64) * scale + offset
    v = 10 ** x if encoding == "log10" else x
    return np.where(q == NODATA, np.nan, v)

def gz(arr):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", compresslevel=9, mtime=0) as f:
        f.write(np.ascontiguousarray(arr).tobytes())
    return buf.getvalue()

def block_mean(cube, f):
    """Mean over f×f blocks of the last two axes, NaN-aware (a cell with no valid pixel stays NaN)."""
    if f == 1: return cube
    *lead, H, W = cube.shape
    b = cube[..., : H - H % f, : W - W % f].reshape(*lead, H // f, f, W // f, f)
    with np.errstate(invalid="ignore"):
        cnt = np.isfinite(b).sum(axis=(-3, -1))
        return np.where(cnt > 0, np.nansum(b, axis=(-3, -1)) / np.maximum(cnt, 1), np.nan)

def time_mean(cube, f):
    if f == 1: return cube
    T = cube.shape[0] - cube.shape[0] % f
    with np.errstate(invalid="ignore"):
        b = cube[:T].reshape(T // f, f, *cube.shape[1:])
        cnt = np.isfinite(b).sum(1)
        return np.where(cnt > 0, np.nansum(b, 1) / np.maximum(cnt, 1), np.nan)

def layer(record, lid, cube, times, bounds, unit, encoding="linear", chunk_t=32, vmin=None, vmax=None, **meta):
    """Write one layer's chunks; returns its manifest entry. cube: (T, H, W) float, NaN = no data."""
    out = PUBLIC_OFFICIAL / record
    out.mkdir(parents=True, exist_ok=True)
    q, scale, offset = quantise(cube, encoding, vmin, vmax)
    T, H, W = q.shape
    chunks = []
    for k, t0 in enumerate(range(0, T, chunk_t)):
        name = f"{lid}_{k:03d}.u16.gz"
        data = gz(q[t0:t0 + chunk_t])
        (out / name).write_bytes(data)
        chunks.append({"file": name, "t0": t0, "t1": min(T, t0 + chunk_t), "bytes": len(data)})
    finite = np.isfinite(cube)
    return {"id": lid, "unit": unit, "encoding": encoding, "scale": scale, "offset": offset, "nodata": NODATA,
            "grid": {"width": W, "height": H, "bounds": list(bounds), "row0": "north", "col0": "west", "byte_order": "little"},
            "times": [t if isinstance(t, str) else t.strftime("%Y-%m-%dT%H:%M:%SZ") for t in times], "chunks": chunks,
            "coverage": float(finite.mean()), "value_range": [float(np.nanmin(cube)), float(np.nanmax(cube))] if finite.any() else None,
            **meta}

def fit(estimate, options):
    """First option whose estimated bytes ≤ budget. estimate(option) → bytes; options in preference order."""
    tried = []
    for opt in options:
        b = estimate(opt)
        tried.append({"option": opt, "estimated_bytes": int(b)})
        if b <= RECORD_BUDGET_BYTES * 0.95:
            return opt, tried
    raise RuntimeError(f"no option fits {RECORD_BUDGET_BYTES} bytes: {tried}")

def code_commit():
    try:
        h = subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True, text=True, check=True).stdout.strip()
        dirty = subprocess.run(["git", "status", "--porcelain", "--", "pipeline/svs"], cwd=REPO, capture_output=True, text=True).stdout.strip()
        return h + ("-dirty" if dirty else "")
    except Exception:
        return None

def write_manifest(record, manifest):
    out = PUBLIC_OFFICIAL / record
    files = [p for p in out.glob("*") if p.name != "manifest.json"]
    manifest = {**manifest, "code_commit": code_commit(), "generated_utc": now_utc()}
    body = json.dumps(manifest, indent=1, ensure_ascii=False, allow_nan=False)
    total = sum(p.stat().st_size for p in files) + len(body.encode())
    manifest["size"] = {**manifest.get("size", {}), "bytes": total, "budget": RECORD_BUDGET_BYTES}
    if total > RECORD_BUDGET_BYTES:
        raise RuntimeError(f"{record}: {total:,} bytes > budget {RECORD_BUDGET_BYTES:,}")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    say(f"wrote public/data/official/{record}/ ({total:,} bytes, {len(files) + 1} files)")
    return out / "manifest.json"
