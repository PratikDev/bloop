"""Shared helpers for the Earth Jukebox data pipeline (L1). Python 3.10+."""
import os, re, json, time, hashlib, datetime as dt, urllib.request
from pathlib import Path
import numpy as np

PIPE = Path(__file__).resolve().parent
ROOT = PIPE.parent
PUBLIC = ROOT / "public" / "data"
RAW, WORK, INPUTS = PIPE / "raw", PIPE / "work", PIPE / "inputs"
for d in (RAW, WORK, PUBLIC / "latest", PUBLIC / "sequence", PUBLIC / "context", PUBLIC / "demo", PUBLIC / "truth"):
    d.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "earth-jukebox-pipeline/1.0"}

def now_utc():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_params():
    p = json.load(open(PIPE / "lut_params.json"))
    missing = [k for k in ("start", "end", "across", "exr_encoding") if p["sst"].get(k) in (None, "", "FILL_ME")]
    if missing:
        raise SystemExit(f"lut_params.json: fill in sst {missing} first (values from s2_build_lut.py / s2b_choose_encoding.py).")
    return p

def http_get(url, timeout=120, retries=3):
    last = None
    for i in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except Exception as e:
            last = e; time.sleep(2 * (i + 1))
    raise RuntimeError(f"GET failed after {retries} tries: {url} ({last})")

def download(url, path, force=False):
    path = Path(path)
    if path.exists() and not force and path.stat().st_size > 0:
        return path
    tmp = path.with_suffix(path.suffix + ".part")
    tmp.write_bytes(http_get(url, timeout=600))
    tmp.replace(path)
    return path

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def date_in(name):
    """Return datetime found in a file name (ISO with time, or YYYY-MM-DD, or YYYYMMDD), else None."""
    import urllib.parse
    name = urllib.parse.unquote(name)
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):?(\d{2}):?(\d{2})", name)
    if m:
        return dt.datetime(*map(int, m.groups()), tzinfo=dt.timezone.utc)
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", name) or re.search(r"(20\d{2})(\d{2})(\d{2})", name)
    if m:
        try:
            return dt.datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), tzinfo=dt.timezone.utc)
        except ValueError:
            return None
    return None

def safe_name(name):
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)

# ---------------- colour lookup tables ----------------
def read_rgb(path):
    from PIL import Image
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32)

def strip(arr, orientation, start, end, across):
    if orientation == "horizontal":
        return arr[across, start:end + 1]
    return arr[start:end + 1, across][::-1]          # vertical: index 0 = low end (bottom)

def strip_values(n, vmin, vmax, scale):
    t = np.arange(n) / (n - 1)
    if scale == "log":
        return 10 ** (np.log10(vmin) + t * (np.log10(vmax) - np.log10(vmin)))
    return vmin + t * (vmax - vmin)

def nearest(colors, lut_rgb, chunk=20000):
    """colors: (N,3) float; lut_rgb: (M,3). Returns (index, distance)."""
    idx = np.empty(len(colors), np.int32); dist = np.empty(len(colors), np.float32)
    L = lut_rgb.astype(np.float32)
    for i in range(0, len(colors), chunk):
        c = colors[i:i + chunk].astype(np.float32)
        d = ((c[:, None, :] - L[None, :, :]) ** 2).sum(axis=2)
        j = d.argmin(axis=1)
        idx[i:i + chunk] = j; dist[i:i + chunk] = np.sqrt(d[np.arange(len(c)), j])
    return idx, dist

def invert_rgb_image(rgb_u8, lut_rgb, lut_val, max_dist, extra_mask=None):
    """Full-image inversion via unique colours. Returns (values float32 with NaN, lut index, distance)."""
    H, W, _ = rgb_u8.shape
    flat = rgb_u8.reshape(-1, 3).astype(np.int64)
    keys = (flat[:, 0] << 16) | (flat[:, 1] << 8) | flat[:, 2]
    uk, inv = np.unique(keys, return_inverse=True)
    ucol = np.stack([(uk >> 16) & 255, (uk >> 8) & 255, uk & 255], axis=1).astype(np.float32)
    j, d = nearest(ucol, lut_rgb)
    vals = lut_val[j].astype(np.float32)
    vals[d > max_dist] = np.nan
    out = vals[inv].reshape(H, W); ji = j[inv].reshape(H, W); di = d[inv].reshape(H, W)
    if extra_mask is not None:
        out[extra_mask] = np.nan
    return out, ji, di

# ---------------- encodings (must match the data contract) ----------------
SST_NODATA = 65535
def encode_sst(v):
    e = np.round((v + 5.0) * 1000.0)
    e = np.clip(e, 0, 65534)
    e[~np.isfinite(v)] = SST_NODATA
    return e.astype("<u2")

def decode_sst(u):
    v = u.astype(np.float32) / 1000.0 - 5.0
    v[u == SST_NODATA] = np.nan
    return v

def encode_rain(r):
    """r: mm/h (0 = dry, NaN = no data)."""
    e = np.zeros(r.shape, np.float64)
    wet = np.isfinite(r) & (r > 0)
    e[wet] = np.round((np.log10(np.clip(r[wet], 0.1, 50.0)) + 1.0) * 20000.0) + 1
    e[~np.isfinite(r)] = 65535
    return e.astype("<u2")

def decode_rain(u):
    r = np.zeros(u.shape, np.float32)
    wet = (u > 0) & (u < 65535)
    r[wet] = 10 ** ((u[wet].astype(np.float32) - 1) / 20000.0 - 1.0)
    r[u == 65535] = np.nan
    return r

RAIN_U8_LEVELS = 126
def encode_rain_u8(r, phase):
    """One byte per cell: 0 dry; 1..127 liquid; 128..254 frozen; 255 no data. Log steps of ~5% (well inside the ±27%
    verified accuracy). Used for the time-lapse to keep downloads small."""
    t = (np.log10(np.clip(np.nan_to_num(r, nan=0.1), 0.1, 50.0)) + 1.0) / (np.log10(50.0) + 1.0)
    lvl = np.round(t * RAIN_U8_LEVELS).astype(np.int32)
    out = np.where(phase == 2, 128 + lvl, 1 + lvl)
    out[~(np.nan_to_num(r, nan=0) > 0)] = 0
    out[~np.isfinite(r)] = 255
    return out.astype(np.uint8)

def decode_rain_u8(u):
    u = u.astype(np.int32); r = np.zeros(u.shape, np.float32); ph = np.zeros(u.shape, np.uint8)
    liq = (u >= 1) & (u <= 127); fro = (u >= 128) & (u <= 254)
    for m, base, code in ((liq, 1, 1), (fro, 128, 2)):
        r[m] = 10 ** (-1.0 + (u[m] - base) / RAIN_U8_LEVELS * (np.log10(50.0) + 1.0)); ph[m] = code
    r[u == 255] = np.nan
    return r, ph

def block_nanmean(v, f):
    H, W = v.shape
    b = v[: H - H % f, : W - W % f].reshape(H // f, f, W // f, f)
    with np.errstate(invalid="ignore"):
        cnt = np.isfinite(b).sum(axis=(1, 3))
        s = np.nansum(b, axis=(1, 3))
        out = np.where(cnt > 0, s / np.maximum(cnt, 1), np.nan)
    return out.astype(np.float32)

def block_max_with_phase(rate, phase, f):
    """rate: mm/h (0 dry, NaN none); returns max rate per block and the phase of that max."""
    H, W = rate.shape
    r = np.nan_to_num(rate, nan=-1.0)[: H - H % f, : W - W % f]
    p = phase[: H - H % f, : W - W % f]
    rb = r.reshape(H // f, f, W // f, f).transpose(0, 2, 1, 3).reshape(H // f, W // f, f * f)
    pb = p.reshape(H // f, f, W // f, f).transpose(0, 2, 1, 3).reshape(H // f, W // f, f * f)
    k = rb.argmax(axis=2)
    mx = np.take_along_axis(rb, k[..., None], axis=2)[..., 0]
    ph = np.take_along_axis(pb, k[..., None], axis=2)[..., 0]
    mx = mx.astype(np.float32); mx[mx < 0] = np.nan
    ph[~np.isfinite(mx)] = 0
    return mx, ph.astype(np.uint8)

def write_json(path, obj):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False))
    return path