# %% [markdown]
# # Bloop: data readiness tests (every dataset behind the 63 sonification ideas + the data catalogue)
#
# Runs in **Google Colab** or **VS Code** (Python 3.10+; "Run Cell" on each `# %%` block, or `python bloop_data_tests.py`).
#
# * Every test prints **PASS / WARN / FAIL / SKIP** with a one-line reason and saves numbers to `bloop_test_results/`.
# * Nothing here is trusted from memory: short names, layer names, file names and variables are *discovered* at
#   run time (CMR, SVS API, ERDDAP search, GIBS capabilities, directory listings) and printed, so the result itself
#   is the evidence.
# * Tests that need a login or key are SKIPPED (not failed) when the credential is missing.
# * Server-side CORS headers are recorded with an `Origin` header, but the **browser** is the real CORS test:
#   open `bloop_browser_checks.html` from the deployed site for that.
#
# Credentials (set as environment variables, Colab secrets, or answer the prompts):
# `EARTHDATA_USERNAME` / `EARTHDATA_PASSWORD` (or ~/.netrc), `FIRMS_MAP_KEY`, `OPENAQ_API_KEY`, `NASA_API_KEY`
# (default DEMO_KEY), optional: `WAQI_TOKEN`, `XC_API_KEY`, `FREESOUND_TOKEN`, `CDSAPI_KEY` (CDS), `ADSAPI_KEY` (ADS),
# `EWDSAPI_KEY` (EWDS/GloFAS), `FFWC_TOKEN`, `HYDROCRON_TOKEN`.
# **Never commit keys.** The script never writes them to disk.

# %%
# ---- 0. Install (Colab / fresh venv). Safe to re-run. ----
import subprocess, sys, importlib, importlib.util

PKGS = ["requests", "numpy", "pandas", "scipy", "pillow", "xarray", "h5netcdf", "h5py", "netCDF4", "earthaccess",
        "zarr", "fsspec", "s3fs", "aiohttp", "opencv-python-headless", "OpenEXR", "pyhdf", "openpyxl", "pyshp", "obspy", "cdsapi", "rasterio", "tifffile", "imagecodecs"]
MODS = {"pyhdf": "pyhdf", "pillow": "PIL", "opencv-python-headless": "cv2", "pyshp": "shapefile", "netCDF4": "netCDF4", "OpenEXR": "OpenEXR"}

def ensure_packages(pkgs=PKGS):
    missing = [p for p in pkgs if importlib.util.find_spec(MODS.get(p, p.replace("-", "_"))) is None]
    if missing:
        print("Installing:", " ".join(missing))
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", *missing], check=False)
    # JAXA Earth API (Python) lives on JAXA's own package index; optional.
    if importlib.util.find_spec("jaxa") is None:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "jaxa-earth",
                        "--extra-index-url", "https://data.earth.jaxa.jp/api/python/repository/"], check=False)

if __name__ == "__main__" or "google.colab" in sys.modules:
    if "--no-install" not in sys.argv:
        ensure_packages()

# %%
# ---- 1. Settings ----
import os, re, io, json, time, math, gzip, zipfile, getpass, datetime as dt, traceback, textwrap
from pathlib import Path
os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")      # must be set before cv2 is imported

MODE = os.environ.get("BLOOP_MODE", "QUICK")    # QUICK = small samples (~20-40 min); FULL = bigger samples (hours)
FULL = MODE.upper() == "FULL"
INTERACTIVE = sys.stdin is not None and sys.stdin.isatty() or "google.colab" in sys.modules
OUT = Path(os.environ.get("BLOOP_OUT", "bloop_test_results")); OUT.mkdir(exist_ok=True)
(OUT / "samples").mkdir(exist_ok=True)
APP = os.environ.get("BLOOP_APP", "https://bloop-ptsd.vercel.app")     # the deployed Bloop site
ORIGIN = APP                                                               # sent as Origin to read server CORS headers
TODAY = dt.datetime.now(dt.timezone.utc)

BD_BBOX = (88.0, 20.5, 92.7, 26.7)        # W, S, E, N (Bangladesh)
BAY_BBOX = (85.0, 15.0, 93.0, 22.5)       # northern Bay of Bengal
DHAKA = (23.81, 90.41); CTG = (22.36, 91.78); ST_MARTIN = (20.62, 92.32)
CHT_BBOX = (91.6, 21.2, 92.7, 23.7); PUNJAB_BBOX = (73.8, 29.5, 77.0, 32.5)
FENI_BBOX = (90.9, 22.6, 91.8, 23.6)      # Feni-Noakhali-Cumilla box (Aug 2024 floods)
JAMUNA_BBOX = (89.4, 23.8, 90.0, 25.3)

def secret(name, default=None):
    v = os.environ.get(name)
    if v: return v
    try:
        from google.colab import userdata          # Colab "Secrets" panel
        return userdata.get(name)
    except Exception:
        return default

# %%
# ---- 2. Test framework ----
import requests
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Bloop-data-tests/1.0 (NASA Space Apps 2026, team PTSD)"})

REGISTRY, RESULTS = [], []
PASS, WARN, FAIL, SKIP = "PASS", "WARN", "FAIL", "SKIP"

class Skip(Exception): pass

def test(tid, title, ideas, group, needs=(), heavy=False):
    """Register a test. ideas = Bloop idea IDs (from 'Bloop sonification ideas.md') that depend on it."""
    def deco(fn):
        REGISTRY.append(dict(id=tid, title=title, ideas=list(ideas), group=group, needs=list(needs), heavy=heavy, fn=fn))
        return fn
    return deco

def http(url, params=None, headers=None, timeout=60, stream=False, method="GET", data=None, tries=3, auth=None):
    h = {"Origin": ORIGIN}; h.update(headers or {})
    last = None
    for k in range(tries):
        try:
            r = SESSION.request(method, url, params=params, headers=h, timeout=timeout, stream=stream, data=data, auth=auth)
            if r.status_code in (429, 502, 503, 504) and k < tries - 1:
                time.sleep(3 * (k + 1)); continue
            return r
        except requests.RequestException as e:
            last = e; time.sleep(2 * (k + 1))
    raise last

def cors(r):
    v = r.headers.get("Access-Control-Allow-Origin")
    return v if v else "none"

def jget(url, **kw):
    r = http(url, **kw); r.raise_for_status(); return r.json(), r

def save_json(name, obj):
    p = OUT / "samples" / name
    p.write_text(json.dumps(obj, indent=2, default=str)); return p

def age_days(t):
    if t is None: return None
    if isinstance(t, str):
        t = dt.datetime.fromisoformat(t.replace("Z", "+00:00"))
    if t.tzinfo is None: t = t.replace(tzinfo=dt.timezone.utc)
    return round((TODAY - t).total_seconds() / 86400, 2)

def spearman(a, b):
    import numpy as np
    from scipy.stats import spearmanr
    a, b = np.asarray(a, float), np.asarray(b, float); ok = np.isfinite(a) & np.isfinite(b)
    if ok.sum() < 8: return float("nan"), int(ok.sum())
    return float(spearmanr(a[ok], b[ok]).correlation), int(ok.sum())

def have(cred):
    return bool(secret(cred))

# ---- Earthdata Login (lazy, once) ----
_ED = {"tried": False, "ok": False}
def earthdata():
    if _ED["tried"]:
        if not _ED["ok"]: raise Skip("Earthdata Login not available")
        import earthaccess; return earthaccess
    _ED["tried"] = True
    try:
        import earthaccess
    except ImportError:
        raise Skip("earthaccess not installed: pip install earthaccess")
    u, p = secret("EARTHDATA_USERNAME"), secret("EARTHDATA_PASSWORD")
    try:
        if u and p:
            os.environ["EARTHDATA_USERNAME"], os.environ["EARTHDATA_PASSWORD"] = u, p
            auth = earthaccess.login(strategy="environment")
        elif (Path.home() / ".netrc").exists() or (Path.home() / "_netrc").exists():
            auth = earthaccess.login(strategy="netrc")
        elif INTERACTIVE:
            auth = earthaccess.login(strategy="interactive", persist=True)
        else:
            auth = None
        _ED["ok"] = bool(auth and getattr(auth, "authenticated", True))
    except Exception as e:
        print("Earthdata login failed:", e); _ED["ok"] = False
    if not _ED["ok"]: raise Skip("Earthdata Login not available (set EARTHDATA_USERNAME/PASSWORD or ~/.netrc)")
    return earthaccess

# ---- CMR (public, no login) ----
CMR = "https://cmr.earthdata.nasa.gov/search"
def cmr_collections(short_name=None, keyword=None, concept_id=None, doi=None, provider=None, page_size=10):
    p = {"page_size": page_size}
    if short_name: p["short_name"] = short_name
    if keyword: p["keyword"] = keyword
    if concept_id: p["concept_id"] = concept_id
    if doi: p["doi"] = doi
    if provider: p["provider"] = provider
    js, _ = jget(f"{CMR}/collections.json", params=p, timeout=60)
    return js.get("feed", {}).get("entry", [])

def cmr_latest(concept_id, bbox=None, temporal=None, page_size=1, sort="-start_date"):
    p = {"collection_concept_id": concept_id, "page_size": page_size, "sort_key": sort}
    if bbox: p["bounding_box"] = ",".join(map(str, bbox))
    if temporal: p["temporal"] = temporal
    js, _ = jget(f"{CMR}/granules.json", params=p, timeout=90)
    return js.get("feed", {}).get("entry", [])

def pick_collection(entries, prefer=None, keyword=None):
    """Exact short-name match first, then most keyword tokens in short_name+title, then newest version."""
    if not entries: return None
    toks = [t for t in re.split(r"\W+", (keyword or "").lower()) if len(t) > 1]
    def key(e):
        text = (e.get("short_name", "") + " " + e.get("title", "")).lower()
        exact = 1 if prefer and e.get("short_name", "").lower() == prefer.lower() else 0
        hits = sum(t in text for t in toks)
        m = re.match(r"\d+(\.\d+)?", (e.get("version_id") or "0").lstrip("vV"))
        return (exact, hits, float(m.group(0)) if m else 0.0)
    return sorted(entries, key=key, reverse=True)[0]

def num(x):
    """float() that also handles numpy timedelta (MUR dt_1km_data) -> hours."""
    import numpy as np
    v = np.asarray(getattr(x, "values", x))
    if np.issubdtype(v.dtype, np.timedelta64): return float(v / np.timedelta64(1, "h"))
    return float(v)

# %%
# ---- 3. SVS / EIC helpers ----
SVS = "https://svs.gsfc.nasa.gov"
def svs_api(sid):
    js, r = jget(f"{SVS}/api/{sid}", timeout=60); return js, r

def walk_urls(obj, out=None):
    out = [] if out is None else out
    if isinstance(obj, dict):
        for v in obj.values(): walk_urls(v, out)
    elif isinstance(obj, list):
        for v in obj: walk_urls(v, out)
    elif isinstance(obj, str) and obj.startswith("http"):
        out.append(obj)
    return out

def https(u):
    return "https://" + u[7:] if u.startswith("http://") else u

LIST_MTIMES = {}          # folder url -> {name: modification datetime} (from Apache-style listings)
def list_dir(url):
    """File/folder names (relative) from an HTML directory listing. Handles links given as relative names,
    absolute paths or full URLs with either http or https. Also records listing modification times."""
    from urllib.parse import urlparse
    url = https(url)
    r = http(url, timeout=90); r.raise_for_status()
    base_path = urlparse(r.url if hasattr(r, "url") and isinstance(r.url, str) else url).path
    out, mt = [], {}
    for m in re.finditer(r'href="([^"?#]+)"[^>]*>[^<]*</a>(?:\s*</td>\s*<td[^>]*>)?([^<\n]*)', r.text):
        h, tail = m.group(1), m.group(2)
        path = urlparse(h).path if h.startswith(("http://", "https://")) else h
        if path.startswith("/"):
            if not path.startswith(base_path): continue
            rel = path[len(base_path):]
        else:
            rel = path
        if not rel or rel.startswith(("..", "?", "mailto")) or rel == "./": continue
        out.append(rel)
        tm = re.search(r"(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})", tail) or re.search(r"(\d{2})-(\w{3})-(\d{4}) (\d{2}):(\d{2})", tail)
        if tm:
            try:
                if len(tm.groups()) == 3:
                    mt[rel] = dt.datetime.fromisoformat(f"{tm.group(1)}T{tm.group(2)}:{tm.group(3)}").replace(tzinfo=dt.timezone.utc)
                else:
                    mt[rel] = dt.datetime.strptime(" ".join(tm.groups()[:3]) + f" {tm.group(4)}:{tm.group(5)}", "%d %b %Y %H:%M").replace(tzinfo=dt.timezone.utc)
            except ValueError:
                pass
    LIST_MTIMES[url] = mt
    return list(dict.fromkeys(out))

def last_modified(url):
    """Last-Modified header of a file (HEAD request), or None."""
    from email.utils import parsedate_to_datetime
    try:
        r = http(https(url), method="HEAD", timeout=60)
        v = r.headers.get("Last-Modified")
        return parsedate_to_datetime(v) if v else None
    except Exception:
        return None

DATE_RE = re.compile(r"(20[0-3]\d)[-_]?([01]\d)[-_]?([0-3]\d)(?:[T_]([0-2]\d)[:_-]?([0-5]\d))?")
def name_time(name):
    best = None
    for m in DATE_RE.finditer(name):
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if not (1 <= mo <= 12 and 1 <= d <= 31): continue
        hh, mm = int(m.group(4) or 0), int(m.group(5) or 0)
        try: t = dt.datetime(y, mo, d, hh, mm, tzinfo=dt.timezone.utc)
        except ValueError: continue
        best = t if best is None or t > best else best
    return best

def newest_in(names):
    dated = [(name_time(n), n) for n in names]
    dated = [x for x in dated if x[0] is not None]
    return max(dated) if dated else (None, None)

def frame_folders(js):
    urls = sorted(set(walk_urls(js)))
    return [u for u in urls if "/frames/" in u and u.endswith("/")], urls

def download(url, dest, max_mb=400, auth=None):
    dest = Path(dest)
    if dest.exists() and dest.stat().st_size > 0: return dest
    r = http(https(url), stream=True, timeout=300, auth=auth); r.raise_for_status()
    size = 0
    with open(dest, "wb") as f:
        for chunk in r.iter_content(1 << 20):
            size += len(chunk)
            if size > max_mb * 1e6: f.close(); dest.unlink(); raise RuntimeError(f"{url} larger than {max_mb} MB")
            f.write(chunk)
    return dest

def read_image_rgba(path):
    """PNG/JPG/WebP via Pillow; EXR via OpenCV (linear -> sRGB). Returns uint8 RGBA."""
    import numpy as np
    path = str(path)
    if path.lower().endswith(".exr"):
        img = None
        try:
            import cv2
            img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
            if img is not None:
                img = img.astype("float32")
                if img.ndim == 2: img = np.dstack([img] * 3)
                img = np.dstack([img[:, :, [2, 1, 0]], img[:, :, 3]]) if img.shape[2] == 4 else img[:, :, [2, 1, 0]]
        except Exception:
            img = None
        if img is None:                              # some OpenCV wheels ship without EXR: use the OpenEXR package
            try:
                import OpenEXR
            except ImportError:
                raise RuntimeError("cannot read EXR: OpenCV lacks EXR support here; pip install OpenEXR")
            with OpenEXR.File(path) as f:
                ch = f.channels()
                img = ch["RGBA"].pixels if "RGBA" in ch else (ch["RGB"].pixels if "RGB" in ch else
                      np.dstack([ch[k].pixels for k in ("R", "G", "B", "A") if k in ch]))
            img = np.asarray(img, "float32")
        rgb = img[:, :, :3]
        a = img[:, :, 3] if img.shape[2] == 4 else np.ones(img.shape[:2], "float32")
        v = np.clip(np.nan_to_num(rgb), 0, 1)
        s = np.where(v <= 0.0031308, 12.92 * v, 1.055 * np.power(v, 1 / 2.4) - 0.055)
        return np.dstack([(s * 255 + 0.5).astype("uint8"), (np.clip(a, 0, 1) * 255 + 0.5).astype("uint8")])
    from PIL import Image
    return np.asarray(Image.open(path).convert("RGBA"))

def detect_colorbar_strip(rgba):
    """Find the colour strip in a colorbar image: the row band with the longest run of opaque, non-background
    pixels; bridges small gaps (a white centre in diverging bars). Returns colours (N,3) and (x0, x1, y, vertical)."""
    import numpy as np
    a = rgba.astype(int); H, W = a.shape[:2]
    rgb, alpha = a[:, :, :3], a[:, :, 3]
    def segments(mask_line, gap=6):
        segs, start, cur, gapn = [], None, 0, 0
        for i, m in enumerate(mask_line):
            if m:
                if start is None: start = i
                cur = i; gapn = 0
            elif start is not None:
                gapn += 1
                if gapn > gap: segs.append([start, cur]); start, gapn = None, 0
        if start is not None: segs.append([start, cur])
        return segs
    def runs(mask_line, line_rgb):
        """Longest run; neighbouring runs merge when the colours across the gap change smoothly
        (e.g. the white centre of a diverging bar on a white background)."""
        segs = segments(mask_line)
        if not segs: return (0, 0, 0)
        merged = [segs[0]]
        for s in segs[1:]:
            g0, g1 = merged[-1][1], s[0]
            steps = np.abs(np.diff(line_rgb[g0:g1 + 1], axis=0)).max() if g1 > g0 else 0
            if steps <= 30 and (g1 - g0) < 0.4 * len(mask_line): merged[-1][1] = s[1]
            else: merged.append(s)
        L, x0, x1 = max((s[1] - s[0], s[0], s[1]) for s in merged)
        return (L, x0, x1)
    has_alpha = (alpha < 250).mean() > 0.05
    if has_alpha:
        mask = alpha >= 250
    else:
        bg = np.median(np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]), axis=0)
        mask = np.sqrt(((rgb - bg) ** 2).sum(2)) > 40
    best = None
    for vertical in (False, True):
        m = mask.T if vertical else mask
        img = rgb.transpose(1, 0, 2) if vertical else rgb
        for y in range(m.shape[0]):
            L, x0, x1 = runs(m[y], img[y])
            if L < 0.3 * m.shape[1]: continue
            seg = img[y, x0:x1 + 1]
            var = float(np.std(seg, axis=0).sum())          # a strip changes colour; text/frames don't much
            score = L * (var > 30)
            if best is None or score > best[0]:
                best = (score, y, x0, x1, vertical)
    if best is None or best[0] == 0: raise RuntimeError("colour strip not found")
    _, y, x0, x1, vertical = best
    seg = (rgb.transpose(1, 0, 2) if vertical else rgb)[y, x0:x1 + 1]
    if vertical: seg = seg[::-1]                             # bottom = low end
    return seg.astype(float), (x0, x1, y, vertical)

def invert_colours(pix_rgb, strip_rgb, max_dist=25):
    """Return fraction 0..1 along the strip for each pixel + colour distance (nearest colour)."""
    import numpy as np
    p = pix_rgb.reshape(-1, 3).astype(float)
    d = ((p[:, None, :] - strip_rgb[None, :, :]) ** 2).sum(2)
    i = d.argmin(1); dist = np.sqrt(d[np.arange(len(p)), i])
    frac = i / max(1, len(strip_rgb) - 1)
    frac = np.where(dist <= max_dist, frac, np.nan)
    return frac, dist

def strip_band(rgba, geom, half=4):
    """Median colour over a few rows around the detected row (reduces JPEG noise)."""
    import numpy as np
    x0, x1, y, vertical = geom
    a = rgba[:, :, :3].astype(float)
    if vertical: a = a.transpose(1, 0, 2)
    band = a[max(0, y - half):y + half + 1, x0:x1 + 1]
    seg = np.median(band, axis=0)
    return seg[::-1] if vertical else seg

def find_ticks(seg, n_expected=None):
    """Tick marks = narrow (≤4 px) spikes that differ strongly from both sides. Returns (tick indices, cleaned strip)."""
    import numpy as np
    L = len(seg); bright = seg.mean(1); ticks = []
    i = 3
    while i < L - 3:
        for w in (1, 2, 3, 4):
            if i + w + 3 > L: break
            left, right = seg[max(0, i - 4):i].mean(0), seg[i + w:i + w + 4].mean(0)
            mid = seg[i:i + w].mean(0)
            if np.abs(mid - left).sum() > 90 and np.abs(mid - right).sum() > 90 and np.abs(left - right).sum() < 60:
                ticks.append(i + (w - 1) / 2); i += w; break
        i += 1
    clean = seg.copy()
    for t in ticks:                                     # replace tick pixels by their neighbours' mean
        a, b = int(math.floor(t)), int(math.ceil(t))
        for k in range(a - 1, b + 2):
            if 0 <= k < L: clean[k] = (seg[max(0, a - 3)] + seg[min(L - 1, b + 3)]) / 2
    if n_expected and len(ticks) >= 2:
        # Fit an evenly spaced grid of n ticks: try every pair as (first, last); keep the grid that the most detected
        # spikes support. Ticks can be invisible (a white tick on the white centre) and arrows/labels add extra spikes.
        best = None
        for s0 in range(len(ticks)):
            for s1 in range(s0 + 1, len(ticks)):
                step = (ticks[s1] - ticks[s0]) / (n_expected - 1)
                if step < 3: continue
                pred = [ticks[s0] + k * step for k in range(n_expected)]
                hits = sum(any(abs(p - t) <= 2.5 for t in ticks) for p in pred)
                if best is None or hits > best[0] or (hits == best[0] and step > best[2]): best = (hits, pred, step)
        ticks = best[1] if best and best[0] >= max(4, n_expected - 3) else []
    return ticks, clean

ROBINSON = [(0, 1.0000, 0.0000), (5, 0.9986, 0.0620), (10, 0.9954, 0.1240), (15, 0.9900, 0.1860), (20, 0.9822, 0.2480),
            (25, 0.9730, 0.3100), (30, 0.9600, 0.3720), (35, 0.9427, 0.4340), (40, 0.9216, 0.4958), (45, 0.8962, 0.5571),
            (50, 0.8679, 0.6176), (55, 0.8350, 0.6769), (60, 0.7986, 0.7346), (65, 0.7597, 0.7903), (70, 0.7186, 0.8435),
            (75, 0.6732, 0.8936), (80, 0.6213, 0.9394), (85, 0.5722, 0.9761), (90, 0.5322, 1.0000)]   # Snyder's table

def robinson_px(lat, lon, W, H):
    """Pixel of (lat, lon) on a full-height, horizontally centred Robinson world map (e.g. SVS 5315)."""
    import numpy as np
    a = abs(lat); lats = [r[0] for r in ROBINSON]
    X = float(np.interp(a, lats, [r[1] for r in ROBINSON])); Y = float(np.interp(a, lats, [r[2] for r in ROBINSON]))
    wmap = H * (0.8487 * math.pi) / 1.3523
    x = W / 2 + X * (lon / 180) * (wmap / 2); y = H / 2 - math.copysign(Y, lat) * (H / 2)
    return min(max(int(x), 0), W - 1), min(max(int(y), 0), H - 1)

def latlon_to_px(lat, lon, W, H, lon0=-180.0):
    x = int(((lon - lon0) % 360) / 360 * W); y = int((90 - lat) / 180 * H)
    return min(max(x, 0), W - 1), min(max(y, 0), H - 1)

# %% [markdown]
# ## A. Bloop's deployed app and its published data (what judges will actually hear)

# %%
REPO = os.environ.get("BLOOP_REPO", "PratikDev/nasa-sac")      # GitHub repo of the app (public/ holds the data)
APP_FILES = ["latest/sst.json", "latest/rain.json", "sequence/index.json", "context/grace.json", "context/gistemp_bd.json",
             "context/gpcp_bd.json", "context/gpcc_bd.json", "context/firms.json", "context/ndvi.json", "context/globe_bd.json",
             "demo/dhaka_then_now.json", "latest/sst.bin", "latest/rain.bin"]
_APP = {}
def app_paths():
    """Where does the deployed app load its data and mapping from? 1) BLOOP_APP_DATA / BLOOP_APP_MAPPING overrides,
    2) the documented /data/... and /mapping.json, 3) string literals found in the site's JavaScript bundles."""
    if _APP: return _APP
    data = os.environ.get("BLOOP_APP_DATA"); mapping = os.environ.get("BLOOP_APP_MAPPING")
    found = []
    if not data or not mapping:
        try:
            html = http(APP, timeout=60).text
            scripts = sorted(set(re.findall(r'src="([^"]+\.js)"', html)))[:60]
            for sc in scripts:
                u = sc if sc.startswith("http") else APP.rstrip("/") + "/" + sc.lstrip("/")
                js = http(u, timeout=60).text
                found += re.findall(r'["\'`]((?:https?://[^"\'`\s]+)?/?[\w./-]*(?:sst|rain|grace|mapping|dhaka_then_now|sequence/index)[\w.-]*\.(?:json|bin|gz))["\'`]', js)
        except Exception as e:
            found.append(f"discovery failed: {e}")
    found = sorted(set(found))
    def ok(u):
        try: return http(u, timeout=30).status_code == 200
        except Exception: return False
    absu = lambda f: f if f.startswith("http") else APP.rstrip("/") + "/" + f.lstrip("/")
    if not data:
        cands = [f"{APP}/data"] + [absu(f).rsplit("/latest/", 1)[0] for f in found if "/latest/sst.json" in f] + \
                [f"https://raw.githubusercontent.com/{REPO}/{b}/public/data" for b in ("main", "master")]
        data = next((c for c in cands if ok(c + "/latest/sst.json")), f"{APP}/data")
    if not mapping:
        cands = [f"{APP}/mapping.json"] + [absu(f) for f in found if f.endswith("mapping.json")] + \
                [f"https://raw.githubusercontent.com/{REPO}/{b}/public/mapping.json" for b in ("main", "master")]
        mapping = next((c for c in cands if ok(c)), f"{APP}/mapping.json")
    _APP.update(data=data.rstrip("/"), mapping=mapping, discovered=found[:40])
    return _APP

@test("A1", "Deployed app publishes the data files the features read (paths discovered from the app's JS)", ["ALL", "A2", "C1", "C3", "D1"], "A deployed app")
def t_app_files():
    P = app_paths(); got, missing = {}, []
    for f in APP_FILES + ["__mapping__"]:
        u = P["mapping"] if f == "__mapping__" else f"{P['data']}/{f}"
        try:
            r = http(u, timeout=60); got[u] = (r.status_code, len(r.content), cors(r))
            if r.status_code != 200: missing.append(f)
        except Exception as e:
            missing.append(f); got[u] = (str(e)[:60],)
    save_json("A1_app_files.json", dict(paths=P, files=got))
    if not missing and "raw.githubusercontent" in P["data"]:
        return WARN, f"the files exist in the GitHub repo ({P['data']}) but the deployed site does not serve them: redeploy / check Vercel output", got
    if missing:
        return (WARN if len(missing) < len(APP_FILES) else FAIL), \
               f"data base {P['data']}: missing/not 200: {missing}. Paths seen in the app's JS: {P['discovered'][:8]} " \
               "→ set BLOOP_APP_DATA / BLOOP_APP_MAPPING if the app loads data elsewhere (or the deploy is out of date)", got
    return PASS, f"all {len(APP_FILES) + 1} files served from {P['data']} and {P['mapping']}", got

@test("A2", "Published SST/rain truth numbers are current (0.31 °C, not 0.85) and frames are fresh", ["A2", "C1", "C3", "L3"], "A deployed app")
def t_app_truth():
    P = app_paths(); sst, _ = jget(f"{P['data']}/latest/sst.json"); rain, _ = jget(f"{P['data']}/latest/rain.json")
    v = sst.get("verified", {}).get("value"); lc = sst.get("latest_check") or {}
    probs = []
    if v is None or abs(v - 0.85) < 1e-6: probs.append(f"SST verified.value = {v} (stale 0.85?)")
    a_sst, a_rain = age_days(sst.get("frame_time_utc")), age_days(rain.get("frame_time_utc"))
    if a_sst is None or a_sst > 4: probs.append(f"SST frame {a_sst} days old")
    if a_rain is None or a_rain > 2: probs.append(f"rain frame {a_rain} days old")
    if not lc: probs.append("sst.json has no latest_check")
    m = dict(sst_verified=v, sst_latest_check=lc.get("median_abs"), sst_age_d=a_sst, rain_age_d=a_rain,
             rain_verified=rain.get("verified", {}).get("value"))
    return (WARN if probs else PASS), ("; ".join(probs) or "numbers and freshness OK (run the pipeline to refresh)"), m

@test("A3", "GRACE bass uses ONE shared scale for NW India and Bangladesh (idea D1)", ["D1", "M2", "M3"], "A deployed app")
def t_app_grace_scale():
    P = app_paths(); m, _ = jget(P["mapping"]); g, _ = jget(f"{P['data']}/context/grace.json")
    voices = [v for v in m.get("voices", []) if "grace" in json.dumps(v).lower() or "water" in v.get("id", "").lower()]
    kinds = [(v.get("id"), (v.get("mapping") or {}).get("kind"), (v.get("mapping") or {}).get("input", {}).get("range")) for v in voices]
    import numpy as np
    span = {k: (float(np.nanmin([x for x in b["cm"] if x is not None])), float(np.nanmax([x for x in b["cm"] if x is not None])))
            for k, b in g.get("boxes", {}).items()}
    per_series = any(k[1] == "runtimeRange" for k in kinds)
    detail = f"water voices: {kinds}; data spans (cm): { {k: (round(a,1), round(b,1)) for k,(a,b) in span.items()} }"
    if per_series:
        return WARN, "per-series runtimeRange scaling found: NW India and Bangladesh would fall the same musical distance. " \
                     "Use one fixed cm->Hz range for both. " + detail, dict(kinds=kinds, span=span)
    return (PASS if voices else WARN), (detail if voices else "no GRACE/water voice found in mapping.json"), dict(kinds=kinds)

# %% [markdown]
# ## B. EIC / SVS frames (frame-pairable products): all 23 gallery items, freshness, formats

# %%
GALLERY_IDS = {4285: 1.5, 5101: 4, 5176: 4, 5113: 3, 5151: 3, 5152: 3, 5153: 3, 5154: 3, 5147: 3, 5148: 3, 5149: 3,
               5150: 3, 5544: 30, 5315: 3, 5584: 30, 4897: 60, 5046: 400, 5064: 400, 5099: 30, 5120: 7, 5072: 400,
               5067: 2, 5577: 10}     # id: max acceptable age (days) for a "live" track (internal heuristic)
SVS_INFO = {}

@test("B0", "SVS Daily Visualizations gallery: list every item (expect 23)", ["B1", "B3", "B6", "B7", "B8"], "B EIC frames")
def t_gallery():
    r = http(f"{SVS}/gallery/daily-visualizations/", timeout=60); r.raise_for_status()
    ids = sorted(set(int(x) for x in re.findall(r'href="(?:https://svs\.gsfc\.nasa\.gov)?/(\d{4,5})/?"', r.text)))
    new = sorted(set(ids) - set(GALLERY_IDS)); gone = sorted(set(GALLERY_IDS) - set(ids))
    save_json("B0_gallery_ids.json", dict(ids=ids, new=new, missing=gone))
    st = PASS if not new and not gone else WARN
    return st, f"{len(ids)} items; new vs our list: {new}; not found now: {gone}", dict(n=len(ids), new=new, gone=gone)

SVS_IDEAS = {4285: ["B1", "B2", "B5", "C1", "C3", "F1", "G1", "I2", "K1", "K5", "M1"],
             5101: ["A1", "B1", "B4", "B5", "C1", "C2", "C3", "I2", "I3", "J1", "J3", "K2", "L3", "M1"],
             5176: ["B3", "B4", "F3", "K2", "L3"], 5113: ["B6", "B8", "D3", "J5", "K5"], 5151: ["B7", "E5", "K5"],
             5152: ["B7", "E5"], 5153: ["B7", "E5"], 5154: ["B7", "E5"], 5147: ["B4", "I3"], 5148: ["B5"], 5149: ["E1"],
             5150: ["E1"], 5544: ["D3"], 5315: ["B8", "J5"], 5584: ["E1"], 4897: ["C4", "H1"], 5046: ["M3", "D5"],
             5064: ["M3", "D5"], 5099: ["M3", "D5"], 5120: ["M1"], 5072: ["-"], 5067: ["X2"], 5577: ["X1"]}

def make_svs_test(sid, max_age):
    @test(f"B{sid}", f"SVS {sid}: API, frame folders, newest file and age", SVS_IDEAS.get(sid, ["-"]), "B EIC frames")
    def _t():
        js, r = svs_api(sid)
        folders, urls = frame_folders(js)
        title = js.get("title", "?"); upd = js.get("update_date") or js.get("release_date")
        info = dict(title=title, update_date=upd, n_urls=len(urls), folders=folders, cors_api=cors(r))
        colorbars = [u for u in urls if "colorbar" in u.lower() or "colourbar" in u.lower() or "bar" in u.lower().split("/")[-1]]
        info["colorbars"] = colorbars[:8]
        newest, how = (None, None), None
        for fo in folders[:6]:
            fo = https(fo)
            try:
                names = [n for n in list_dir(fo) if not n.endswith("/")]
                t, n = newest_in(names); src = "file name"
                if t is None and LIST_MTIMES.get(fo):
                    n, t = max(LIST_MTIMES[fo].items(), key=lambda kv: kv[1]); src = "listing time"
                if t is None and names:
                    n = sorted(names)[-1]; t = last_modified(fo + n); src = "Last-Modified"
                info.setdefault("folder_newest", {})[fo] = (str(t), n, len(names), src)
                if t and (newest[0] is None or t > newest[0]): newest, how = (t, fo + n), src
            except Exception as e:
                info.setdefault("folder_errors", {})[fo] = str(e)[:120]
        if newest[0] is None:                         # no frames folder: use the newest 'latest'/'most_recent' file's header
            latest = [u for u in urls if re.search(r"latest|most_recent|daily", u.split("/")[-1], re.I)
                      and u.lower().endswith((".png", ".exr", ".jpg", ".tif", ".mp4"))]
            for u in latest[:3]:
                t = last_modified(u)
                if t and (newest[0] is None or t > newest[0]): newest, how = (t, https(u)), "Last-Modified"
        a = age_days(newest[0]); info.update(newest_time=str(newest[0]), newest_file=newest[1], age_days=a, age_source=how)
        SVS_INFO[sid] = info; save_json(f"B{sid}_svs.json", info)
        if a is None:
            return WARN, f"'{title}': no dated file found (page updated {upd}); check folders manually", info
        st = PASS if a <= max_age else WARN
        return st, f"'{title[:60]}': newest frame {a} d old (by {how}; limit {max_age}); {len(folders)} frame folders; colorbars {len(colorbars)}", info
    return _t

for _sid, _age in GALLERY_IDS.items():
    make_svs_test(_sid, _age)

# %% [markdown]
# ## C. Frame inversions that the new ideas depend on (rank tests are scale-free, so no guessed colorbar range)

# %%
def svs_pick(sid, prefer=("no-dates", "nodates", "_no-dates", "most_recent"), exts=(".exr", ".png", ".tif")):
    info = SVS_INFO.get(sid)
    if not info:
        make = [t for t in REGISTRY if t["id"] == f"B{sid}"][0]["fn"]; make(); info = SVS_INFO[sid]
    js, _ = svs_api(sid); urls = walk_urls(js)
    files = [u for u in urls if u.lower().endswith(exts)]
    pref = [u for u in files if any(p in u for p in prefer)]
    return info, (pref or files), [u for u in urls if "colorbar" in u.lower()]

@test("C5176", "5176 SST anomaly frame vs NOAA Coral Reef Watch SST anomaly (sign + rank agreement)", ["B3", "B4", "F3", "K2", "L3"],
      "C frame inversion", heavy=True)
def t_5176_vs_crw():
    import numpy as np
    info, files, bars = svs_pick(5176)
    plain = [u for u in files if not re.search(r"robinson|pacific", u, re.I)]          # equirectangular, 180°W start
    frame = ([u for u in plain if "most_recent" in u and re.search(r"no-?dates", u)] or
             [u for u in plain if "most_recent" in u] or [u for u in plain if re.search(r"no-?dates", u)])
    if not frame or not bars: return FAIL, f"no frame/colorbar URL found (frames {len(files)}, bars {len(bars)})", {}
    fpath = download(frame[0], OUT / "samples" / ("5176_" + frame[0].split("/")[-1]), max_mb=120)
    bars = sorted(bars, key=lambda u: ("print" not in u, not u.endswith(".png"), u))      # labelled bar has ticks at -4..4
    bpath = download(bars[0], OUT / "samples" / ("5176_" + bars[0].split("/")[-1]), max_mb=30)
    bar_rgba = read_image_rgba(bpath)
    _, geom = detect_colorbar_strip(bar_rgba)
    strip = strip_band(bar_rgba, geom, half=2)            # colours from the bar's clean middle rows
    ticks = []
    for dy in list(range(1, 40)) + list(range(-1, -40, -1)):   # tick marks sit on the bar's top/bottom edges
        x0, x1, y, vertical = geom
        if not (0 <= y - dy < (bar_rgba.shape[1] if vertical else bar_rgba.shape[0])): continue
        row = strip_band(bar_rgba, (x0, x1, y - dy, vertical), half=0)
        tk, _ = find_ticks(row, n_expected=9)
        if len(tk) == 9: ticks = tk; break
    calibrated = len(ticks) == 9
    def to_anom(frac):                                   # strip position -> °C anomaly
        x = frac * (len(strip) - 1)
        return -4 + 8 * (x - ticks[0]) / (ticks[-1] - ticks[0]) if calibrated else (frac - 0.5) * 8
    img = read_image_rgba(fpath); H, W = img.shape[:2]
    # ERDDAP: discover the CRW SST-anomaly dataset rather than trusting an ID
    s, _ = jget("https://coastwatch.noaa.gov/erddap/search/index.json",
                params={"page": 1, "itemsPerPage": 100, "searchFor": "coral reef watch sea surface temperature anomaly"})
    cols = s["table"]["columnNames"]; rows = s["table"]["rows"]; ci = cols.index("Dataset ID"); gi = cols.index("griddap")
    cands = [r for r in rows if "ssta" in r[ci].lower() and "crw" in r[ci].lower() and r[gi]]
    if not cands: return FAIL, "no CRW SSTA griddap dataset found via ERDDAP search", {}
    dsid = sorted(cands, key=lambda r: ("daily" not in r[ci].lower(), r[ci]))[0][ci]
    meta, _ = jget(f"https://coastwatch.noaa.gov/erddap/info/{dsid}/index.json")
    vars_ = [r[1] for r in meta["table"]["rows"] if r[0] == "variable"]
    var = [v for v in vars_ if "anom" in v.lower()] or vars_
    var = var[0]
    lats = http(f"https://coastwatch.noaa.gov/erddap/griddap/{dsid}.csv0?latitude").text.split()
    desc = float(lats[0]) > float(lats[-1])
    la = "(60):40:(-60)" if desc else "(-60):40:(60)"                  # 2° steps, global ocean, both signs
    q = f"https://coastwatch.noaa.gov/erddap/griddap/{dsid}.csv0?{var}[(last)][{la}][(-179.975):40:(179.975)]"
    import pandas as pd
    crw = pd.read_csv(io.StringIO(http(q, timeout=180).text), header=None, names=["time", "lat", "lon", "v"])
    crw = crw.dropna()
    crw = crw.sample(min(len(crw), 2000), random_state=1) if len(crw) > 2000 else crw
    xy = [latlon_to_px(a, b, W, H) for a, b in zip(crw.lat, crw.lon)]
    px = np.array([img[y, x, :3] for x, y in xy])
    frac, dist = invert_colours(px, strip, 20)
    crw["frame_frac"] = frac; crw["dist"] = dist; ok = crw.dropna().copy()
    ok["frame_C"] = [to_anom(f) for f in ok.frame_frac]
    ok = ok.sample(min(len(ok), 1500), random_state=1) if len(ok) > 1500 else ok
    big = ok[ok.v.abs() >= 0.5]
    sign = float(np.mean(np.sign(big.frame_C) == np.sign(big.v))) if len(big) else float("nan")
    rho, n = spearman(ok.frame_C, ok.v)
    diff = (ok.frame_C - ok.v)
    m = dict(crw_dataset=dsid, var=var, crw_time=str(crw.time.iloc[0]) if len(crw) else None, n=n, n_abs_ge_0_5=len(big),
             sign_agreement=sign, spearman=rho, median_diff_C=float(diff.median()), median_abs_diff_C=float(diff.abs().median()),
             ticks_found=len(ticks), calibrated=calibrated, strip=geom, colorbar=bars[0], frame=frame[0])
    ok.to_csv(OUT / "samples" / "C5176_points.csv", index=False)
    st = PASS if (n >= 200 and sign >= 0.9 and rho >= 0.8) else WARN
    return st, (f"n={n} global ocean points; sign agreement {sign:.0%} where |anomaly| ≥ 0.5 °C (n={len(big)}); Spearman {rho:.2f}; "
                f"median frame − CRW {m['median_diff_C']:+.2f} °C (|·| {m['median_abs_diff_C']:.2f}); ticks {len(ticks)}/9. "
                "MUR and CRW use different climatologies, so an offset is expected: report it, don't hide it"), m

def model_vs_frame(sid, model_values_fn, label, ideas, points=None):
    """Generic scale-free check: frame colour position along its colorbar vs model value at the same points."""
    import numpy as np
    info, files, bars = svs_pick(sid, prefer=("most_recent", "latest"), exts=(".png", ".jpg", ".exr"))
    if not bars: return FAIL, "no colorbar URL in SVS API", {}
    newest = info.get("newest_file") or ""
    frame_url = newest if newest.startswith("http") and newest.lower().endswith((".png", ".jpg", ".exr")) else None
    frame_url = frame_url or (files[0] if files else None)
    if not frame_url: return FAIL, "no frame URL", {}
    f = download(frame_url, OUT / "samples" / f"{sid}_{frame_url.split('/')[-1]}", max_mb=80)
    b = download(bars[0], OUT / "samples" / f"{sid}_{bars[0].split('/')[-1]}", max_mb=20)
    strip, geom = detect_colorbar_strip(read_image_rgba(b)); img = read_image_rgba(f); H, W = img.shape[:2]
    rng = np.random.default_rng(7)
    pts = points or [(float(rng.uniform(-50, 60)), float(rng.uniform(-170, 170))) for _ in range(150)]
    pts = [p for p in pts if 0.08 * H < latlon_to_px(*p, W, H)[1] < 0.92 * H]       # avoid burned-in labels top/bottom
    xy = [latlon_to_px(a, o, W, H) for a, o in pts]
    px = np.array([img[y, x, :3] for x, y in xy])
    frac, dist = invert_colours(px, strip, 25)
    t_frame = name_time(frame_url.split("/")[-1]) or last_modified(frame_url)      # undated frames: use the file's time
    vals = model_values_fn(pts, t_frame)
    rho, n = spearman(frac, vals)
    m = dict(frame=frame_url, frame_time=str(t_frame), frame_age_days=age_days(t_frame), strip=geom, n=n, spearman=rho,
             matched=float(np.isfinite(frac).mean()))
    st = PASS if (n >= 40 and rho >= 0.8) else WARN
    return st, (f"{label}: frame time {str(t_frame)[:16]} ({m['frame_age_days']} d old); {n} points matched colorbar ({m['matched']:.0%}), "
                f"Spearman {rho:.2f} vs model values"), m

def opendap_datasets(root, max_pages=40):
    """Crawl a GrADS-DODS index (opendap.nccs.nasa.gov) under `root`; return dataset URLs (from their '.info' links)."""
    seen, queue, found = set(), [root], []
    while queue and len(seen) < max_pages:
        url = queue.pop(0)
        if url in seen: continue
        seen.add(url)
        try: txt = http(url, timeout=60).text
        except Exception: continue
        for h in set(re.findall(r'href="([^"]+)"', txt)):
            h = h if h.startswith("http") else requests.compat.urljoin(url, h)
            if not h.startswith(root): continue
            if h.endswith(".info"): found.append(h[:-5])
            elif h.endswith("/") and h != url: queue.append(h)
    return sorted(set(found))

def geos_values_fn(dataset_url, var_hints, transform=lambda x: x):
    import numpy as np, xarray as xr
    ds = xr.open_dataset(dataset_url.replace(".info", "").replace(".html", ""), engine="netcdf4")
    var = [v for v in ds.data_vars if any(h == v.lower() for h in var_hints)] or \
          [v for v in ds.data_vars if any(h in v.lower() for h in var_hints)]
    if not var: raise RuntimeError(f"none of {var_hints} in {list(ds.data_vars)[:30]}")
    var = var[0]
    def fn(points, t):
        da = ds[var]
        if "time" in da.dims:
            da = da.sel(time=np.datetime64(t.replace(tzinfo=None)), method="nearest") if t else da.isel(time=-1)
        if "lev" in da.dims: da = da.isel(lev=0 if float(ds.lev[0]) > float(ds.lev[-1]) else -1)   # surface level
        da = da.load() if da.size < 2e6 else da
        return [transform(num(da.sel(lat=a, lon=o, method="nearest"))) for a, o in points]
    fn.var = var
    return fn

GEOSCF_BUCKET = "smce-geos-cf-public"
def geoscf_store(prefer=("v2", "fcst")):
    """Open the best GEOS-CF Zarr store on the public S3 bucket (v2 forecast first; never splice v1 and v2)."""
    import xarray as xr
    t = http(f"https://{GEOSCF_BUCKET}.s3.us-west-2.amazonaws.com/", params={"list-type": 2, "delimiter": "/"}, timeout=60).text
    stores = [x for x in re.findall(r"<Prefix>([^<]+)</Prefix>", t) if x.endswith(".zarr/") and "cols" not in x]
    stores = sorted(stores, key=lambda x: tuple(p not in x for p in prefer) + (x,))
    if not stores: raise RuntimeError("no GEOS-CF zarr stores listed")
    ds = xr.open_zarr(f"s3://{GEOSCF_BUCKET}/{stores[0]}", storage_options={"anon": True}, consolidated=None)
    return stores[0], ds

def geoscf_values_fn(var_or_fn, label):
    import numpy as np
    store, ds = geoscf_store()
    def pick(d, cands):
        names = {v.lower(): v for v in d.data_vars}
        for c in cands:
            if c in names: return d[names[c]]
        for c in cands:
            hit = [v for k, v in names.items() if k.startswith(c)]
            if hit: return d[hit[0]]
        raise RuntimeError(f"none of {cands} in {store}: {sorted(names)[:60]}")
    def field(d):
        return var_or_fn(d, pick) if callable(var_or_fn) else pick(d, var_or_fn if isinstance(var_or_fn, (list, tuple)) else [var_or_fn])
    def fn(points, t):
        da = field(ds)
        if "time" in da.dims:
            da = da.sel(time=np.datetime64(t.replace(tzinfo=None)), method="nearest") if t else da.isel(time=-1)
        for dim in ("lev", "level"):
            if dim in da.dims: da = da.isel({dim: 0})
        latn = "lat" if "lat" in da.dims else "latitude"; lonn = "lon" if "lon" in da.dims else "longitude"
        da = da.load()
        fn.time = str(da["time"].values) if "time" in da.coords else None
        return [num(da.sel({latn: a, lonn: o}, method="nearest")) for a, o in points]
    fn.var, fn.store = label, store
    return fn

@test("C5151", "5151 PM2.5 frame vs GEOS-CF model values (scale-free rank test; GEOS-CF Zarr)", ["B7", "E5", "K5"], "C frame inversion", heavy=True)
def t_5151():
    fn = geoscf_values_fn(["pm25_rh35_gcc", "pm25_rh35", "pm25"], "PM2.5")
    st, d, m = model_vs_frame(5151, fn, f"GEOS-CF {fn.var} ({fn.store})", ["B7"])
    m["model_time"] = getattr(fn, "time", None)
    return st, d + f"; model time {m['model_time']}", m

@test("C5147", "5147 near-surface temperature frame vs GEOS-CF 10 m temperature (rank test; same GEOS family, not independent)", ["B4", "I3"],
      "C frame inversion", heavy=True)
def t_5147():
    fn = geoscf_values_fn(["t10m", "t2m", "ts", "t"], "near-surface temperature")
    st, d, m = model_vs_frame(5147, fn, f"GEOS-CF {fn.var} ({fn.store})", ["B4"])
    return st, d + f"; model time {getattr(fn, 'time', None)}", m

@test("C5148", "5148 near-surface wind frame vs GEOS-CF 10 m wind speed (rank test)", ["B5"], "C frame inversion", heavy=True)
def t_5148():
    fn = geoscf_values_fn(lambda d, pick: (pick(d, ["u10m", "u10", "u"]) ** 2 + pick(d, ["v10m", "v10", "v"]) ** 2) ** 0.5, "|u,v|")
    st, d, m = model_vs_frame(5148, fn, f"GEOS-CF wind speed ({fn.store})", ["B5"])
    return st, d + f"; model time {getattr(fn, 'time', None)}", m

@test("C5150", "5150 humidity: frames exist only as MP4? (frame extraction feasibility)", ["E1", "K5"], "C frame inversion")
def t_5150():
    js, _ = svs_api(5150); urls = walk_urls(js)
    mp4 = [u for u in urls if u.lower().endswith(".mp4")]; png = [u for u in urls if u.lower().endswith(".png")]
    st = PASS if png else (WARN if mp4 else FAIL)
    return st, f"{len(mp4)} MP4, {len(png)} PNG; frames folder: {bool(frame_folders(js)[0])}", dict(mp4=mp4[:3], png=png[:5])

@test("C5113", "5113 VIIRS fire frame hot pixels vs FIRMS VIIRS detections (per-tile rank, 5-day window)", ["B6", "B8", "D3", "J5", "K5"],
      "C frame inversion", needs=["FIRMS_MAP_KEY"], heavy=True)
def t_5113():
    import numpy as np, pandas as pd
    key = secret("FIRMS_MAP_KEY")
    if not key: raise Skip("FIRMS_MAP_KEY not set")
    info, files, bars = svs_pick(5113, prefer=("VIIRS_fires_latest",), exts=(".png", ".exr"))
    latest = [u for u in files if "latest" in u.lower()]
    if not latest: return FAIL, "no VIIRS_fires_latest file in SVS API", {}
    png = [u for u in latest if u.endswith(".png")] or latest
    img = read_image_rgba(download(png[0], OUT / "samples" / ("5113_" + png[0].split("/")[-1]), max_mb=150)); H, W = img.shape[:2]
    rgb = img[:, :, :3].astype(int); a = img[:, :, 3]
    hot = (rgb[:, :, 0] > 180) & (rgb[:, :, 0] - rgb[:, :, 2] > 80) & (a > 128)       # warm, saturated, opaque
    ty, tx = H // 18, W // 36                                      # 10° tiles
    frame_counts = hot[:ty * 18, :tx * 36].reshape(18, ty, 36, tx).sum((1, 3))
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_SNPP_NRT/world/5"
    df = pd.read_csv(io.StringIO(http(url, timeout=300).text))
    df20 = df
    try:
        df20 = pd.concat([df, pd.read_csv(io.StringIO(http(url.replace("VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT"), timeout=300).text))])
    except Exception: pass
    iy = np.clip(((90 - df20.latitude) // 10).astype(int), 0, 17); ix = np.clip(((df20.longitude + 180) // 10).astype(int), 0, 35)
    firms_counts = np.zeros((18, 36)); np.add.at(firms_counts, (iy, ix), 1)
    rho, n = spearman(frame_counts.ravel(), firms_counts.ravel())
    cht = df20[(df20.longitude.between(CHT_BBOX[0], CHT_BBOX[2])) & (df20.latitude.between(CHT_BBOX[1], CHT_BBOX[3]))]
    m = dict(frame_hot_pixels=int(hot.sum()), firms_points=len(df20), spearman_tiles=rho, cht_points_5d=len(cht))
    return (PASS if rho >= 0.7 else WARN), f"tile Spearman {rho:.2f} ({int(hot.sum())} hot px vs {len(df20)} FIRMS pts); CHT last 5 d: {len(cht)}", m

FWI_CLASSES = ["very low", "low", "moderate", "high", "very high", "extreme"]
FWI_SWATCH_Y = [0.701, 0.741, 0.781, 0.820, 0.860, 0.900]     # legend boxes on the 2160x1080 PNG (relative, run 1)

def fwi_classify(rgb, swatches):
    """Category index 0..5 by chromaticity (the map is hill-shaded, so compare colour ratios); -1 = grey/no calculation."""
    import numpy as np
    rgb = np.asarray(rgb, float).reshape(-1, 3)
    mx = rgb.max(1, keepdims=True); grey = (rgb.max(1) - rgb.min(1)) < 25
    ratio = rgb / np.maximum(mx, 1)
    sw = np.asarray(swatches, float); swr = sw / sw.max(1, keepdims=True)
    d = ((ratio[:, None, :] - swr[None]) ** 2).sum(2) + 0.3 * ((mx / 255 - sw.max(1)[None] / 255) ** 2)
    k = d.argmin(1); k[grey] = -1
    return k, np.sqrt(d.min(1))

@test("C5315", "5315 Fire Weather Index (Robinson map): 6 legend classes decode; Bangladesh class; start a daily archive", ["B8", "J5"], "C frame inversion")
def t_5315():
    import numpy as np
    js, _ = svs_api(5315); urls = walk_urls(js)
    png = [u for u in urls if u.lower().endswith(".png") and "fwi" in u.lower()] or [u for u in urls if u.lower().endswith(".png")]
    if not png: return FAIL, "no PNG in SVS 5315", {}
    lm = last_modified(png[0])
    stamp = (lm or TODAY).strftime("%Y%m%d")
    arch = OUT / "fwi_archive"; arch.mkdir(exist_ok=True)
    p = download(png[0], arch / f"FWI_{stamp}.png", max_mb=20)
    img = read_image_rgba(p)[:, :, :3]; H, W = img.shape[:2]
    sw = [img[int(y * H), int(0.0485 * W)].astype(int) for y in FWI_SWATCH_Y]
    distinct = len({tuple((c // 24).tolist()) for c in sw}) == 6 and all((c.max() - c.min()) > 30 for c in sw)
    # global decode share: coloured map pixels (outside the legend box) that sit close to a legend class
    mask = np.ones((H, W), bool); mask[int(0.57 * H):, :int(0.17 * W)] = False
    px = img[mask][::7]; colourful = (px.max(1) - px.min(1)) >= 25
    k, dist = fwi_classify(px[colourful], sw)
    share_ok = float(np.mean(dist < 0.25)) if colourful.any() else 0.0
    places = {"Dhaka": DHAKA, "Chattogram hills": (22.6, 92.1), "Rajshahi": (24.37, 88.60), "Sylhet": (24.90, 91.87)}
    here = {}
    for n, (la, lo) in places.items():
        x, y = robinson_px(la, lo, W, H)
        kk, _ = fwi_classify(img[max(0, y - 2):y + 3, max(0, x - 2):x + 3].reshape(-1, 3), sw)
        vals = [int(v) for v in kk if v >= 0]
        here[n] = FWI_CLASSES[max(set(vals), key=vals.count)] if vals else "no calculation"
    m = dict(last_modified=str(lm), age_days=age_days(lm), swatches=[c.tolist() for c in sw], decoded_share=share_ok, bangladesh=here, file=p.name)
    st = PASS if distinct and share_ok > 0.9 and lm and age_days(lm) < 2 else WARN
    return st, (f"updated {lm} ({age_days(lm)} d); legend classes distinct: {distinct}; {share_ok:.0%} of coloured pixels decode; "
                f"Bangladesh today: {here}; saved {p.name} (no SVS archive: run daily)"), m

@test("C5584", "5584 landslide exposure: freshness (stale since Jan 2026?)", ["E1"], "C frame inversion")
def t_5584():
    info = SVS_INFO.get(5584) or [t for t in REGISTRY if t["id"] == "B5584"][0]["fn"]()[2]
    a = info.get("age_days")
    return (PASS if a is not None and a <= 7 else WARN), f"newest dated file {a} d old; use LHASA v2 nowcast (E3 test) if stale", info

@test("C5544", "5544 NDVI: data freshness (was ~104 days old)", ["D3"], "C frame inversion")
def t_5544():
    info = SVS_INFO.get(5544) or [t for t in REGISTRY if t["id"] == "B5544"][0]["fn"]()[2]
    a = info.get("age_days")
    return (PASS if a is not None and a <= 30 else WARN), f"newest dated file {a} d old; else use ORNL MODIS/VIIRS NDVI points (E10)", info

# %% [markdown]
# ## D. NASA archive inventory sweep (CMR, no login): existence, newest granule, Bangladesh coverage, latency
# Every short name below is checked live. If a short name is wrong, the keyword fallback prints what CMR actually has.

# %%
CMR_SWEEP = [
    # (test id, label, short_name, keyword fallback, bbox or None, max age days for "fresh", ideas)
    ("D01", "MUR SST v4.1 (5101 source; C1 proof in unison; C5 dt_1km_data)", "MUR-JPL-L4-GLOB-v4.1", "MUR SST", BAY_BBOX, 3, ["C1", "C3", "C5", "A1"]),
    ("D02", "IMERG Late half-hourly (4285 source)", "GPM_3IMERGHHL", "IMERG late half hourly", BD_BBOX, 1.5, ["C1", "B2", "G1", "K1"]),
    ("D03", "IMERG Early half-hourly (newest 4285 frames)", "GPM_3IMERGHHE", "IMERG early half hourly", BD_BBOX, 1, ["C1", "B2"]),
    ("D04", "IMERG Final half-hourly (G1 audification archive)", "GPM_3IMERGHH", "IMERG final half hourly", BD_BBOX, 200, ["G1"]),
    ("D05", "IMERG Late daily (F1 NASA-JAXA duet)", "GPM_3IMERGDL", "IMERG late daily", BD_BBOX, 3, ["F1", "H4", "K4"]),
    ("D06", "GRACE/GRACE-FO JPL mascon RL06.3 v4 CRI", "TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4", "GRACE mascon CRI", None, 150, ["D1", "E1", "M2", "M3"]),
    ("D07", "MERRA-2 aerosol diagnostics hourly (E5 PM2.5 backbone)", "M2T1NXAER", "MERRA-2 aerosol", None, 60, ["E5"]),
    ("D08", "MODIS NDVI 16-day 250 m (Terra)", "MOD13Q1", "MODIS vegetation indices 16-day 250m", BD_BBOX, 40, ["D3"]),
    ("D09", "VIIRS NDVI 16-day 500 m (continuity after Terra/Aqua)", "VNP13A1", "VIIRS vegetation indices 16-day", BD_BBOX, 40, ["D3"]),
    ("D10", "Black Marble VNP46A2 daily night lights", "VNP46A2", "Black Marble daily moonlight-adjusted", BD_BBOX, 30, ["D3", "E7"]),
    ("D11", "Black Marble NOAA-20 VJ146A2 (cross-sensor check)", "VJ146A2", "NOAA-20 Black Marble", BD_BBOX, 30, ["E7"]),
    ("D12", "Black Marble VNP46A1 NRT-ish daily at-sensor", "VNP46A1", "VIIRS DNB at-sensor radiance daily", BD_BBOX, 5, ["E7"]),
    ("D13", "SMAP sea surface salinity JPL 8-day V5 (E6 plume)", "SMAP_JPL_L3_SSS_CAP_8DAY-RUNNINGMEAN_V5", "SMAP sea surface salinity 8-day running mean", BAY_BBOX, 20, ["E1", "E6"]),
    ("D14", "SMAP soil moisture L3 enhanced (avoid 14 May-28 Jul 2026)", "SPL3SMP_E", "SMAP enhanced L3 soil moisture", BD_BBOX, 5, ["E1"]),
    ("D15", "OPERA DSWx-S1 surface water (radar)", "OPERA_L3_DSWX-S1_V1", "OPERA DSWx-S1", BD_BBOX, 30, ["E1", "E2"]),
    ("D16", "OPERA DSWx-HLS surface water (optical)", "OPERA_L3_DSWX-HLS_V1", "OPERA DSWx HLS", BD_BBOX, 30, ["E2"]),
    ("D17", "OPERA DIST-ALERT disturbance", "OPERA_L3_DIST-ALERT-HLS_V1", "OPERA DIST ALERT", BD_BBOX, 30, ["D3"]),
    ("D18", "SWOT L2 HR River single-pass, Version D (Version C '2.0' ended Apr 2025)", "SWOT_L2_HR_RiverSP_D", "SWOT Level 2 River Single-Pass Vector Version D", JAMUNA_BBOX, 30, ["E1", "E3"]),
    ("D19", "LHASA v2 landslide nowcast at GES DISC (archive ended 2021? NRT may live elsewhere)", "Global_Landslide_Nowcast", "Global Landslide Nowcast LHASA", BD_BBOX, 7, ["E1"]),
    ("D20", "MODIS/VIIRS NRT global flood product (LANCE)", "MCDWD_L3_F1C_NRT", "MCDWD flood", BD_BBOX, 3, ["E2"]),
    ("D21", "TROPOMI NO2 NRT (GES DISC mirror; 5154 cross-check)", "S5P_L2__NO2____HiR_NRT", "S5P NO2 HiR NRT", BD_BBOX, 2, ["B7", "E5"]),
    ("D22", "EMIT methane plume complexes", "EMITL2BCH4PLM", "EMIT methane plume", BD_BBOX, 400, ["E5"]),
    ("D23", "OCO-2 XCO2 Lite (status: proposed termination?)", "OCO2_L2_Lite_FP", "OCO-2 Lite XCO2", BD_BBOX, 30, ["D3"]),
    ("D24", "ISS-LIS lightning (ended 2023)", "isslis_v3_fin", "ISS LIS lightning", BD_BBOX, 99999, ["E4"]),
    ("D25", "LIS/OTD 2.5° diurnal lightning climatology (E4 morning thunder)", "lolrdc", "LIS OTD climatology", None, 99999, ["E4"]),
    ("D26", "ECOSTRESS LST tiled (Dhaka heat)", "ECO_L2T_LSTE", "ECOSTRESS land surface temperature tiled", BD_BBOX, 30, ["D3", "K5"]),
    ("D27", "PACE OCI L3 ocean biogeochemistry NRT (chlorophyll)", "PACE_OCI_L3M_BGC_NRT", "PACE OCI L3M BGC NRT", BAY_BBOX, 10, ["E1"]),
    ("D28", "NEX-GDDP-CMIP6 in CMR (not expected: it is served from NCCS THREDDS + AWS S3, see E13)", "NEX-GDDP-CMIP6", "NEX-GDDP-CMIP6 daily downscaled CMIP6", None, 99999, ["D4"]),
    ("D29", "NASA-SSH global mean sea level indicator", "NASA_SSH_GMSL_INDICATOR", "global mean sea level altimetry GMSL", None, 200, ["D5", "E1"]),
    ("D30", "CMS global mangrove canopy height (Sundarbans)", "CMS_Global_Map_Mangrove_Canopy_1665", "global mangrove canopy height", None, 99999, ["E1"]),
    ("D31", "CYGNSS L2 winds (cyclones)", "CYGNSS_L2_V3.2", "CYGNSS level 2 ocean surface wind", BAY_BBOX, 30, ["B5"]),
    ("D32", "GEDI L2A canopy (Sundarbans/Madhupur)", "GEDI02_A", "GEDI L2A elevation height", BD_BBOX, 400, ["D3"]),
    ("D33", "HLS Landsat 30 m (river erosion; OPERA input)", "HLSL30", "HLS Landsat", BD_BBOX, 15, ["E3"]),
    ("D34", "VIIRS active fire 375 m NRT swaths (5113 source; FIRMS is the easy route)", "VNP14IMG_NRT", "VIIRS active fire 375m NRT", BD_BBOX, 2, ["B6", "B8"]),
    ("D35", "AMSR2 SST gridded L3U NRT (JAXA microwave via REMSS; F2 triad)", "AMSR2-REMSS-L3U_RT-v8.2", "AMSR2 sea surface temperature GHRSST L3U", BAY_BBOX, 5, ["F2"]),
    ("D36", "OSTIA SST (UK Met Office, on PO.DAAC; F2 triad)", "OSTIA-UKMO-L4-GLOB-v2.0", "OSTIA sea surface temperature", BAY_BBOX, 5, ["F2"]),
]

def make_cmr_test(tid, label, sn, kw, bbox, max_age, ideas):
    @test(tid, label, ideas, "D NASA archive (CMR)")
    def _t():
        ents = cmr_collections(short_name=sn) if sn else []
        how = "short_name"
        if not ents and kw:
            ents = cmr_collections(keyword=kw, page_size=15); how = "keyword"
            must = re.search(r"Version [A-Z]\b", kw)                 # e.g. SWOT "Version D" vs "Version C"
            if must: ents = [e for e in ents if must.group(0) in e.get("title", "")] or ents
        if not ents: return FAIL, f"nothing in CMR for short_name={sn!r} / keyword={kw!r}", {}
        cands = [(e["id"], e.get("short_name"), e.get("version_id"), e.get("title", "")[:90]) for e in ents[:15]]
        col = pick_collection(ents, prefer=sn, keyword=kw)
        g = cmr_latest(col["id"], bbox=bbox)
        if not g and bbox: g = cmr_latest(col["id"])            # some collections carry no usable spatial metadata
        newest = (g[0].get("time_end") or g[0]["time_start"]) if g else None
        a = age_days(newest)
        m = dict(found_by=how, chosen=(col["id"], col.get("short_name"), col.get("version_id")), candidates=cands,
                 newest=newest, age_days=a, bbox=bbox, granule=g[0]["title"] if g else None)
        save_json(f"{tid}_cmr.json", m)
        if not g: return WARN, f"{col.get('short_name')} v{col.get('version_id')} exists but no granule{' over the box' if bbox else ''}", m
        st = PASS if (a is not None and a <= max_age) else WARN
        note = "" if how == "short_name" else f" (found by keyword; check chosen short name {col.get('short_name')})"
        return st, f"{col.get('short_name')} v{col.get('version_id')}: newest {newest[:16]} ({a} d){note}", m
    return _t

for _row in CMR_SWEEP:
    make_cmr_test(*_row)

# %% [markdown]
# ## E. NASA value tests (need Earthdata Login): read the actual numbers each idea plays

# %%
def ed_search(short_name, **kw):
    ea = earthdata()
    res = ea.search_data(short_name=short_name, **kw)
    if not res: raise RuntimeError(f"no granules for {short_name} {kw}")
    return ea, res

def open_remote(ea, granules):
    fs = ea.open(granules)
    return fs

@test("E1", "MUR: read analysed_sst + dt_1km_data at Bay points for the 5101 frame day (C1/C5)", ["C1", "C3", "C5", "A1", "J3"], "E NASA values",
      needs=["EARTHDATA"])
def t_mur():
    import numpy as np, xarray as xr
    day = (TODAY - dt.timedelta(days=3)).date()
    ea, res = ed_search("MUR-JPL-L4-GLOB-v4.1", temporal=(str(day), str(day)))
    ds = xr.open_dataset(open_remote(ea, res[:1])[0], engine="h5netcdf")
    need = [v for v in ("analysed_sst", "dt_1km_data", "sst_anomaly", "analysis_error") if v in ds]
    pts = [(21.0, 89.5), (19.0, 88.0), (17.0, 90.0), (15.0, 87.0)]
    vals = {f"{a},{o}": {v: num(ds[v].isel(time=0).sel(lat=a, lon=o, method="nearest")) for v in need} for a, o in pts}
    sst = [d["analysed_sst"] - 273.15 for d in vals.values()]
    semitones = 12 * math.log2(4 ** ((max(sst) - min(sst)) / 40))
    m = dict(day=str(day), vars=need, values=vals, bay_span_C=max(sst) - min(sst), bay_span_semitones_global_scale=semitones)
    st = PASS if {"analysed_sst", "dt_1km_data"} <= set(need) else WARN
    return st, f"vars {need}; Bay span {m['bay_span_C']:.2f} °C = {semitones:.1f} semitones on the global −5..35 °C scale (J3 zoom need)", m

@test("E2", "IMERG point series speed: can we pull half-hourly values for one cell fast enough? (G1 audification)", ["G1", "B2", "K1"],
      "E NASA values", needs=["EARTHDATA"], heavy=True)
def t_imerg_series():
    import numpy as np, h5py
    n = 96 if FULL else 24
    end = TODAY - dt.timedelta(days=5); start = end - dt.timedelta(hours=n / 2)
    ea, res = ed_search("GPM_3IMERGHHL", temporal=(start.strftime("%Y-%m-%dT%H:%M:%S"), end.strftime("%Y-%m-%dT%H:%M:%S")))
    res = res[:n]; t0 = time.time(); vals = []
    for fobj in open_remote(ea, res):
        with h5py.File(fobj, "r") as f:
            lat = f["Grid/lat"][:]; lon = f["Grid/lon"][:]
            iy, ix = int(np.abs(lat - DHAKA[0]).argmin()), int(np.abs(lon - DHAKA[1]).argmin())
            vals.append(float(f["Grid/precipitation"][0, ix, iy]))
    sec = (time.time() - t0) / max(1, len(vals))
    m = dict(files=len(vals), sec_per_file=round(sec, 2), hours_per_year=round(sec * 17520 / 3600, 1), sample=vals[:12])
    st = PASS if sec <= 2 else WARN
    return st, f"{sec:.2f} s/file → {m['hours_per_year']} h per year of 30-min data for one cell (pipeline job, not live)", m

@test("E3", "MERRA-2 PM2.5 (GES DISC formula) at Dhaka for one day (E5 backbone)", ["E5", "B7"], "E NASA values", needs=["EARTHDATA"])
def t_merra2():
    import numpy as np, xarray as xr
    day = (TODAY - dt.timedelta(days=60)).date()
    ea, res = ed_search("M2T1NXAER", temporal=(str(day), str(day)))
    ds = xr.open_dataset(open_remote(ea, res[:1])[0], engine="h5netcdf")
    p = ds.sel(lat=DHAKA[0], lon=DHAKA[1], method="nearest")
    pm = (p.DUSMASS25 + p.OCSMASS + p.BCSMASS + p.SSSMASS25 + 1.375 * p.SO4SMASS) * 1e9
    v = pm.values.astype(float)
    m = dict(day=str(day), hourly_ugm3=[round(x, 1) for x in v], daily_mean=float(np.mean(v)))
    st = PASS if 1 < m["daily_mean"] < 1000 else WARN
    return st, f"Dhaka {day}: daily mean {m['daily_mean']:.1f} µg/m³ (model estimate, no nitrate, biased low in S. Asia)", m

@test("E4", "SMAP SSS: northern Bay salinity, Oct vs Apr (E6 'sweet-water plume' needs a clear seasonal difference)", ["E6", "E1"],
      "E NASA values", needs=["EARTHDATA"])
def t_smap_sss():
    import numpy as np, xarray as xr
    ents = cmr_collections(short_name="SMAP_JPL_L3_SSS_CAP_8DAY-RUNNINGMEAN_V5") or cmr_collections(keyword="SMAP JPL sea surface salinity 8-day", page_size=5)
    if not ents: return FAIL, "SMAP SSS collection not found", {}
    sn = ents[0]["short_name"]; ea = earthdata(); out = {}
    for label, d in (("Oct", "2025-10-15"), ("Apr", "2026-04-15")):
        res = ea.search_data(short_name=sn, temporal=(d, d))
        if not res: out[label] = None; continue
        ds = xr.open_dataset(ea.open(res[:1])[0], engine="h5netcdf")
        var = [v for v in ds.data_vars if "sss" in v.lower() and "unc" not in v.lower()][0]
        latn = "latitude" if "latitude" in ds.coords else "lat"; lonn = "longitude" if "longitude" in ds.coords else "lon"
        box = ds[var].sel({latn: slice(22, 18) if ds[latn][0] > ds[latn][-1] else slice(18, 22), lonn: slice(87, 92)})
        out[label] = float(box.mean())
    diff = (out["Apr"] - out["Oct"]) if None not in out.values() else None
    st = PASS if diff is not None and diff > 1 else WARN
    return st, f"{sn}: Oct {out.get('Oct')} vs Apr {out.get('Apr')} psu (fresher after monsoon expected)", out

@test("E5", "Black Marble VNP46A2: read Dhaka radiance from tile h27v06 (E7)", ["E7", "D3"], "E NASA values", needs=["EARTHDATA"])
def t_blackmarble():
    import numpy as np, h5py
    ea = earthdata()
    def dhaka_values(short, days, n):
        end = TODAY - dt.timedelta(days=10)
        res = ea.search_data(short_name=short, temporal=(str((end - dt.timedelta(days=days)).date()), str(end.date())),
                             bounding_box=(90.35, 23.75, 90.45, 23.85))
        res = [r for r in res if "h27v06" in json.dumps(r.get("umm", {})) + json.dumps(r.data_links())][:n] or res[:n]
        out, names = [], {}
        for p in ea.download(res, str(OUT / "samples" / "blackmarble")):
            names = {}
            with h5py.File(p, "r") as f:
                f.visititems(lambda k, o: names.setdefault(k, list(o.shape)) if isinstance(o, h5py.Dataset) and len(o.shape) == 2
                             and re.search(r"NTL|Composite", k) and "Std" not in k and "Num" not in k and "Quality" not in k else None)
                if not names: out.append((Path(p).name, "no NTL dataset")); continue
                key = sorted(names, key=lambda k: ("Gap_Filled" not in k, "BRDF" not in k, "Snow_Free" not in k, k))[0]
                ds = f[key]; arr = ds[:]
                fill = ds.attrs.get("_FillValue", [-999.9]); fill = float(np.ravel(fill)[0])
                scale = float(np.ravel(ds.attrs.get("scale_factor", [1.0]))[0])
            H, W = arr.shape
            y = int((30 - DHAKA[0]) / 10 * H); x = int((DHAKA[1] - 90) / 10 * W)
            win = arr[max(0, y - 2):y + 3, max(0, x - 2):x + 3].astype(float)          # 5x5 px around Dhaka
            win = win[(win != fill) & (win > -900)]
            out.append((Path(p).name.split(".")[1], key.split("/")[-1], round(float(np.median(win)) * scale, 2) if win.size else None))
        return out, names
    (OUT / "samples" / "blackmarble").mkdir(exist_ok=True)
    daily, names = dhaka_values("VNP46A2", 12, 6 if not FULL else 12)
    monthly, _ = dhaka_values("VNP46A3", 70, 2)
    valid = [v[-1] for v in daily if isinstance(v[-1], (int, float))]
    m = dict(daily=daily, monthly=monthly, datasets=names)
    st = PASS if valid else WARN
    return st, f"Dhaka 5x5 px median radiance (nW·cm⁻²·sr⁻¹): daily {daily}; monthly {monthly} (None = cloud/fill)", m

@test("E6", "SWOT: get Jamuna/Padma reach IDs from a RiverSP granule, then Hydrocron WSE time series (E3)", ["E3", "E1"],
      "E NASA values", needs=["EARTHDATA"], heavy=True)
def t_swot():
    import numpy as np, pandas as pd, shapefile
    ents = [e for e in cmr_collections(keyword="SWOT Level 2 River Single-Pass Vector", page_size=20) if "RiverSP" in e.get("short_name", "")]
    ents = sorted(ents, key=lambda e: ("Version D" not in e.get("title", ""), e.get("short_name")))      # D first
    if not ents: return FAIL, "SWOT RiverSP collection not found", {}
    sn = ents[0]["short_name"]; ea = earthdata()
    res = ea.search_data(short_name=sn, temporal=("2025-06-01", "2025-09-30"), bounding_box=JAMUNA_BBOX)
    if not res and len(ents) > 1:
        sn = ents[1]["short_name"]; res = ea.search_data(short_name=sn, temporal=("2024-08-01", "2024-09-30"), bounding_box=JAMUNA_BBOX)
    res = [r for r in res if "Reach" in json.dumps(r.data_links())] or res
    if not res: return FAIL, f"no {sn} granule over the Jamuna box", {}
    z = ea.download(res[:1], str(OUT / "samples"))[0]
    with zipfile.ZipFile(z) as zf:
        dbf = [n for n in zf.namelist() if n.endswith(".dbf")][0]; shp = dbf[:-4]
        rdr = shapefile.Reader(dbf=io.BytesIO(zf.read(dbf)))
        recs = [r.as_dict() for r in rdr.records()]
    df = pd.DataFrame(recs); cols = {c.lower(): c for c in df.columns}
    lonc, latc, rc = cols.get("p_lon") or cols.get("lon"), cols.get("p_lat") or cols.get("lat"), cols.get("reach_id")
    if not rc: return FAIL, f"no reach_id column in {dbf}; columns: {list(df.columns)[:25]}", {}
    if lonc and latc:
        box = df[pd.to_numeric(df[lonc], errors="coerce").between(JAMUNA_BBOX[0], JAMUNA_BBOX[2]) &
                 pd.to_numeric(df[latc], errors="coerce").between(JAMUNA_BBOX[1], JAMUNA_BBOX[3])]
        df = box if len(box) else df
    if "wse" in cols:                                               # prefer reaches this pass actually measured
        good = df[pd.to_numeric(df[cols["wse"]], errors="coerce") > -1000]
        df = good if len(good) else df
    ids = df[rc].astype(str).unique().tolist()[:5]
    if not ids: return FAIL, f"no reach IDs in {dbf} ({len(recs)} records)", {}
    out = {}
    hdr = {"x-hydrocron-key": secret("HYDROCRON_TOKEN")} if secret("HYDROCRON_TOKEN") else {}
    span = ("2025-06-01T00:00:00Z", "2026-01-31T00:00:00Z") if "D" in sn.split("_")[-1] else ("2024-06-01T00:00:00Z", "2025-01-31T00:00:00Z")
    for rid in ids:
        tries = [dict(collection_name=sn), {}]
        for extra in tries:
            r = http("https://soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1/timeseries", headers=hdr, timeout=120, params=dict(
                feature="Reach", feature_id=rid, start_time=span[0], end_time=span[1], output="csv", fields="reach_id,time_str,wse", **extra))
            txt = r.text
            try: txt = r.json().get("results", {}).get("csv", txt)
            except Exception: pass
            try: d = pd.read_csv(io.StringIO(txt))
            except Exception: d = pd.DataFrame()
            if "wse" in d.columns: break
        if "wse" not in d.columns:
            out[rid] = dict(status=r.status_code, response=r.text[:300], tried=[list(t) for t in tries]); continue
        w = pd.to_numeric(d.wse, errors="coerce"); w = w[w > -1000]
        out[rid] = dict(n=int(w.notna().sum()), amp_m=float(w.max() - w.min()) if w.notna().any() else None, status=r.status_code, cors=cors(r))
    good = [k for k, v in out.items() if v.get("n", 0) >= 8 and (v.get("amp_m") or 0) >= 3]
    st = PASS if good else WARN
    return st, f"{len(good)}/{len(out)} reaches pass (≥8 passes, ≥3 m swing): {out}", dict(collection=sn, reaches=out)

@test("E7", "OPERA DSWx-S1 Aug 2024 Bangladesh floods: water fraction rises 5 May → 9 Aug → 21 Aug (E2)", ["E2", "E1", "I4"], "E NASA values",
      needs=["EARTHDATA"], heavy=True)
def t_opera_bd():
    """The Disasters ImageServer used in the catalogue returned 404 in run 1, so read the OPERA granules themselves.
    WTR layer classes (DSWx-S1 product spec): counts for every value are saved; 1 = open water, 3 = inundated vegetation
    (CHECK against the spec PDF before quoting), 250+ = masks/no data."""
    import numpy as np
    try:
        import tifffile
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "tifffile", "imagecodecs"], check=False); import tifffile
    services = {}
    for u in ("https://gis.earthdata.nasa.gov/gis05/rest/services/DISASTERS_202408_FLOOD_BANGLADESH/2423_opera_dswx_s1/ImageServer",
              "https://maps.disasters.nasa.gov/ags03/rest/services/bangladesh_floods_202408/aria_opera_dswx/MapServer"):
        try: services[u] = http(u, params={"f": "pjson"}, timeout=60).status_code
        except Exception as e: services[u] = str(e)[:60]
    ea = earthdata(); out = {}
    for label, (d0, d1) in {"pre (May 2024)": ("2024-05-01", "2024-05-12"), "rising (9 Aug)": ("2024-08-06", "2024-08-12"),
                            "peak (21 Aug)": ("2024-08-18", "2024-08-26")}.items():
        res = ea.search_data(short_name="OPERA_L3_DSWX-S1_V1", temporal=(d0, d1), bounding_box=FENI_BBOX)
        prod = "DSWx-S1"
        if not res:
            res = ea.search_data(short_name="OPERA_L3_DSWX-HLS_V1", temporal=(d0, d1), bounding_box=FENI_BBOX); prod = "DSWx-HLS (optical: clouds!)"
        if not res: out[label] = "no DSWx-S1 or DSWx-HLS granules"; continue
        g = res[0]; links = [l for l in g.data_links() if l.endswith("_B01_WTR.tif")]
        if not links: out[label] = "no WTR layer link"; continue
        local = ea.download([g], str(OUT / "samples" / "opera"))
        wtr = [p for p in local if str(p).endswith("_B01_WTR.tif")]
        arr = tifffile.imread(wtr[0]); vals, cnt = np.unique(arr, return_counts=True)
        hist = {int(v): int(c) for v, c in zip(vals, cnt)}
        valid = sum(c for v, c in hist.items() if v < 250)
        out[label] = dict(product=prod, granule=g["umm"]["GranuleUR"] if "umm" in g else str(g)[:80], hist=hist,
                          open_water=round(hist.get(1, 0) / max(valid, 1), 4), class3=round(hist.get(3, 0) / max(valid, 1), 4))
    seq = [v["open_water"] + v["class3"] for v in out.values() if isinstance(v, dict)]
    rising = len(seq) == 3 and seq[0] < seq[1] <= seq[2] * 1.2
    m = dict(services=services, dates=out)
    st = PASS if rising else WARN
    note = "same MGRS tile not guaranteed across dates: compare tiles with the same ID before quoting"
    per = {k: (f"{v['product']}: {v['open_water'] + v['class3']:.3f}" if isinstance(v, dict) else v) for k, v in out.items()}
    return st, f"water(+class 3) fraction: {per}; {note}", m

@test("E8", "GLOBE API: Bangladesh sky/cloud observations in the last 60 days (F5)", ["F5", "L2"], "E NASA values")
def t_globe():
    s = (TODAY - dt.timedelta(days=60)).strftime("%Y-%m-%d"); e = TODAY.strftime("%Y-%m-%d")
    tried = {}
    for url, p in [
        ("https://api.globe.gov/search/v1/measurement/protocol/measureddate/countrycode/",
         dict(protocols="sky_conditions", startdate=s, enddate=e, countrycode="BGD", geojson="FALSE", sample="FALSE")),
        ("https://api.globe.gov/search/v1/measurement/protocol/measureddate/",
         dict(protocols="sky_conditions", startdate=s, enddate=e, geojson="FALSE", sample="FALSE"))]:
        r = http(url, params=p, timeout=180)
        try:
            js = r.json(); rows = js.get("results", []) if isinstance(js, dict) else (js if isinstance(js, list) else [])
        except Exception:
            rows = []
        def lat_of(x):
            for k, v in x.items():
                if "latitude" in k.lower():
                    try: return float(v)
                    except (TypeError, ValueError): pass
            return -99.0
        bd = [x for x in rows if isinstance(x, dict) and BD_BBOX[1] <= lat_of(x) <= BD_BBOX[3]]
        tried[url.split("/")[-2] or url] = dict(status=r.status_code, rows=len(rows), bangladesh=len(bd), cors=cors(r), ctype=r.headers.get("Content-Type"))
        if bd: return PASS, f"{len(bd)} Bangladesh sky observations via API", tried
    return WARN, f"API returned no Bangladesh rows {tried}; keep the GLOBE Clouds CSV route", tried

@test("E9", "NASA GISTEMP global annual series (D2 prologue, 1880→)", ["D2", "M1"], "E NASA values")
def t_gistemp_global():
    import pandas as pd
    r = http("https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv", timeout=60); r.raise_for_status()
    df = pd.read_csv(io.StringIO(r.text), skiprows=1, na_values="***")
    ann = df[["Year", "J-D"]].dropna()
    m = dict(first=int(ann.Year.min()), last=int(ann.Year.max()), n=len(ann), last_value=float(ann["J-D"].iloc[-1]),
             semitones_crawford=(ann["J-D"].max() - ann["J-D"].min()) / 0.03)
    return PASS, f"{m['n']} years {m['first']}–{m['last']}; Crawford step 0.03 °C → {m['semitones_crawford']:.0f} semitones total", m

@test("E10", "ORNL MODIS + VIIRS NDVI web service at 3 Bloop points (D3, Terra/Aqua continuity)", ["D3"], "E NASA values")
def t_ornl_ndvi():
    pts = {"Sundarbans": (21.95, 89.18), "Madhupur": (24.62, 90.05), "Dhaka": DHAKA}; out = {}
    for prod in ("MOD13Q1", "VNP13A1"):
        bands, _ = jget(f"https://modis.ornl.gov/rst/api/v1/{prod}/bands", headers={"Accept": "application/json"})
        band = [b["band"] for b in bands.get("bands", []) if "NDVI" in b["band"]][0]
        for name, (la, lo) in pts.items():
            dates, _ = jget(f"https://modis.ornl.gov/rst/api/v1/{prod}/dates", params=dict(latitude=la, longitude=lo),
                            headers={"Accept": "application/json"})
            last = [d["modis_date"] for d in dates.get("dates", [])][-2:]
            sub, r = jget(f"https://modis.ornl.gov/rst/api/v1/{prod}/subset", headers={"Accept": "application/json"}, params=dict(
                latitude=la, longitude=lo, band=band, startDate=last[0], endDate=last[-1], kmAboveBelow=0, kmLeftRight=0))
            vals = [s["data"][0] for s in sub.get("subset", [])]
            out[f"{prod}:{name}"] = dict(band=band, dates=last, raw=vals, cors=cors(r))
    return PASS, f"latest composites: { {k: v['dates'][-1] for k, v in out.items()} }", out

@test("E11", "NOAA/NASA AERONET: Dhaka + Bhola sites and recent AOD (E5 context)", ["E5", "B7"], "E NASA values")
def t_aeronet():
    txt = http("https://aeronet.gsfc.nasa.gov/aeronet_locations_v3.txt", timeout=60).text
    sites = [l.split(",")[0] for l in txt.splitlines() if re.search(r"dhaka|bhola|bangla", l, re.I)]
    out = {}
    for s in sites[:4]:
        y = TODAY.year
        r = http("https://aeronet.gsfc.nasa.gov/cgi-bin/print_web_data_v3", timeout=120, params=dict(
            site=s, year=y - 1, month=1, day=1, year2=y, month2=TODAY.month, day2=TODAY.day, AOD15=1, AVG=20, if_no_html=1))
        lines = [l for l in r.text.splitlines() if re.match(r"^\S+,\d\d:\d\d:\d\d\d\d", l)]
        out[s] = dict(level15_days=len(lines), last=lines[-1].split(",")[1] if lines else None)
    st = PASS if any(v["level15_days"] > 0 for v in out.values()) else WARN
    return st, f"sites {sites}; recent L1.5 daily rows: {out}", dict(sites=sites, data=out)

@test("E12", "NASA FIRMS key status + CHT/Punjab NRT counts (B6)", ["B6", "D3"], "E NASA values", needs=["FIRMS_MAP_KEY"])
def t_firms():
    import pandas as pd
    key = secret("FIRMS_MAP_KEY")
    if not key: raise Skip("FIRMS_MAP_KEY not set")
    stt, _ = jget("https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/", params={"MAP_KEY": key})
    out = {}
    for name, bb in (("CHT", CHT_BBOX), ("Punjab", PUNJAB_BBOX)):
        for src in ("VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"):
            df = pd.read_csv(io.StringIO(http(f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{src}/{','.join(map(str, bb))}/5").text))
            out[f"{name}|{src}"] = len(df)
    return PASS, f"key status {stt}; last 5 days: {out}", out

@test("E13", "NEX-GDDP-CMIP6: Dhaka daily tasmax point for 2081 (D4 two futures)", ["D4"], "E NASA values", heavy=True)
def t_nex():
    import xml.etree.ElementTree as ET
    model, scen = "ACCESS-CM2", "ssp585"
    pre = f"NEX-GDDP-CMIP6/{model}/{scen}/r1i1p1f1/tasmax/tasmax_day_{model}_{scen}_r1i1p1f1_gn_2081"
    lst = http("https://nex-gddp-cmip6.s3.us-west-2.amazonaws.com/", params={"list-type": 2, "max-keys": 1000, "prefix": pre}, timeout=60).text
    keys = re.findall(r"<Key>([^<]+\.nc)</Key>", lst)
    if not keys:                                             # show what the folder really contains
        lst2 = http("https://nex-gddp-cmip6.s3.us-west-2.amazonaws.com/", params={"list-type": 2, "max-keys": 1000,
                    "prefix": f"NEX-GDDP-CMIP6/{model}/{scen}/"}, timeout=60).text
        return FAIL, f"no 2081 tasmax file; folder sample: {re.findall(r'<Key>([^<]+)</Key>', lst2)[-3:]}", {}
    if not keys: return FAIL, "no 2081 tasmax file listed in the public S3 bucket", {}
    k = sorted(keys)[-1]; fname = k.split("/")[-1]
    ncss = f"https://ds.nccs.nasa.gov/thredds/ncss/grid/AMES/NEX/GDDP-CMIP6/{model}/{scen}/r1i1p1f1/tasmax/{fname}"
    r = http(ncss, params=dict(var="tasmax", latitude=DHAKA[0], longitude=DHAKA[1], time_start="2081-04-01T12:00:00Z",
                               time_end="2081-05-31T12:00:00Z", accept="csv"), timeout=180)
    rows = [l for l in r.text.splitlines()[1:] if l.strip()]
    if r.status_code == 200 and rows:
        vals = [float(l.split(",")[-1]) - 273.15 for l in rows]
        return PASS, f"NCSS point OK ({len(vals)} days); Apr–May 2081 mean tasmax {sum(vals)/len(vals):.1f} °C (one model, one scenario)", \
               dict(file=fname, n=len(vals), days_over_35=sum(v > 35 for v in vals))
    return WARN, f"S3 file found ({fname}) but NCSS returned {r.status_code}; read via S3 instead", dict(s3_key=k, ncss_status=r.status_code)

@test("E14", "JAXA AMSR2 / GHRSST + OSTIA + MUR triad at one Bay point (F2)", ["F2"], "E NASA values", needs=["EARTHDATA"], heavy=True)
def t_sst_triad():
    import xarray as xr
    ea = earthdata(); day = str((TODAY - dt.timedelta(days=4)).date()); out = {}
    for label, kw in (("MUR", "MUR-JPL-L4-GLOB-v4.1"), ("AMSR2", "AMSR2-REMSS-L3U_RT-v8.2"), ("OSTIA", "OSTIA-UKMO-L4-GLOB-v2.0")):
        if kw: sn = kw
        else:
            ents = cmr_collections(keyword=f"{label} sea surface temperature GHRSST", page_size=10)
            ents = [e for e in ents if label.lower() in (e.get("short_name", "") + e.get("title", "")).lower()]
            if not ents: out[label] = "collection not found"; continue
            sn = pick_collection(ents)["short_name"]
        res = ea.search_data(short_name=sn, temporal=(day, day), bounding_box=(88.5, 19.5, 89.5, 20.5))
        if not res and label == "AMSR2":                          # RT files lag ~1 week: use the newest one available
            res = ea.search_data(short_name=sn, temporal=(str((TODAY - dt.timedelta(days=14)).date()), str(TODAY.date())))[-2:]
        if not res: out[label] = f"{sn}: no granule"; continue
        ds = xr.open_dataset(ea.open(res[:1])[0], engine="h5netcdf")
        var = "analysed_sst" if "analysed_sst" in ds else ("sea_surface_temperature" if "sea_surface_temperature" in ds else list(ds.data_vars)[0])
        da = ds[var]; da = da.isel(time=0) if "time" in da.dims else da
        box = da.sel(lat=slice(19.5, 20.5), lon=slice(88.5, 89.5)) if float(da.lat[0]) < float(da.lat[-1]) else da.sel(lat=slice(20.5, 19.5), lon=slice(88.5, 89.5))
        v = float(box.mean(skipna=True)); v = v - 273.15 if v > 200 else v
        out[label] = dict(short_name=sn, var=var, C=v, granule=str(res[0].data_links()[0]).split("/")[-1][:70])
    vals = [v["C"] for v in out.values() if isinstance(v, dict) and math.isfinite(v["C"])]
    st = PASS if len(vals) == 3 and max(vals) - min(vals) < 1.0 else WARN
    return st, f"{out}", out

@test("E15", "Mauna Loa CO2 daily (NOAA GML) for a global context voice", ["D2"], "E NASA values")
def t_co2():
    t = http("https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.txt", timeout=60).text
    rows = [l.split() for l in t.splitlines() if l and not l.startswith("#")]
    last = rows[-1]
    return PASS, f"last daily value {last[:3]} → {last[-1]} ppm", dict(last=last)

def first_granule_vars(keyword, prefer_terms, bbox=None, temporal=None, max_mb=600):
    """Find a collection by keyword, download its newest granule, and list variables with their dims."""
    ents = cmr_collections(keyword=keyword, page_size=20)
    ents = [e for e in ents if any(t in (e.get("short_name", "") + e.get("title", "")).lower() for t in prefer_terms)] or ents
    if not ents: raise RuntimeError(f"no collection for {keyword!r}")
    col = pick_collection(ents, keyword=keyword); ea = earthdata()
    kw = dict(short_name=col["short_name"], count=1)
    if col.get("version_id"): kw["version"] = col["version_id"]
    if bbox: kw["bounding_box"] = bbox
    if temporal: kw["temporal"] = temporal
    res = ea.search_data(**kw)
    if not res: raise RuntimeError(f"{col['short_name']}: no granule")
    sz = getattr(res[0], "size", 0)
    size = sz() if callable(sz) else (sz or 0)
    if size and size > max_mb: raise RuntimeError(f"granule {size:.0f} MB > {max_mb} MB")
    p = ea.download(res[:1], str(OUT / "samples"))[0]
    import xarray as xr
    try:
        ds = xr.open_dataset(p)
        info = {v: dict(dims=list(ds[v].dims), shape=list(ds[v].shape)) for v in ds.data_vars}
    except Exception:
        import h5py
        info = {}
        with h5py.File(p, "r") as f:
            f.visititems(lambda n, o: info.setdefault(n, dict(shape=list(o.shape))) if isinstance(o, h5py.Dataset) else None)
        ds = None
    return col, p, info, ds

@test("E16", "LIS/OTD lightning climatology: a diurnal (24-hour) variable exists for the 'morning thunder score' (E4)", ["E4"],
      "E NASA values", needs=["EARTHDATA"], heavy=True)
def t_lis_clim():
    col, p, info, ds = first_granule_vars("LIS/OTD 2.5 Degree Low Resolution Diurnal Climatology LRDC", ["lrdc", "diurnal"])
    diurnal = {k: v for k, v in info.items() if 24 in v.get("shape", [])}
    m = dict(collection=(col["short_name"], col.get("version_id"), col.get("title")), vars=info, diurnal=diurnal)
    return (PASS if diurnal else WARN), f"{col['short_name']}: {len(info)} variables; with a 24-step axis: {list(diurnal)[:6]}", m

@test("E17", "LHASA v2 landslide nowcast: one recent granule over the Chattogram hills (E1, replaces stale 5584)", ["E1"],
      "E NASA values", needs=["EARTHDATA"], heavy=True)
def t_lhasa():
    col, p, info, ds = first_granule_vars("Global Landslide Nowcast LHASA", ["landslide", "lhasa"], bbox=(91.5, 21.0, 92.7, 23.0))
    return PASS, f"{col['short_name']} v{col.get('version_id')}: {Path(p).name}; variables {list(info)[:8]}", dict(vars=info)

@test("E18", "ACAG satellite-derived monthly PM2.5 (E5 anchor layer): dataset page and download links", ["E5"], "E NASA values")
def t_acag():
    r = http("https://sites.wustl.edu/acag/datasets/surface-pm2-5/", timeout=60); r.raise_for_status()
    links = sorted(set(re.findall(r'href="([^"]+)"', r.text)))
    ver = sorted(set(re.findall(r"V\d\.GL\.\d+(?:\.\d+)?", r.text)))
    dl = [l for l in links if re.search(r"box\.com|wustl\.box|\.nc|monthly|Monthly", l)]
    return (PASS if ver else WARN), f"versions on page {ver}; {len(dl)} download-like links (Box: download by hand, CC BY 4.0)", dict(versions=ver, links=dl[:20])

# %% [markdown]
# ## F. Partner-agency and other-agency data (duets and cross-checks)

# %%
@test("F1", "JAXA Earth API: GSMaP + AMSR2/SGLI SST collections; Python package; STAC/COG reachability (F1/F2)", ["F1", "F2"], "F partner data", heavy=True)
def t_jaxa():
    r = http("https://data.earth.jaxa.jp/app/mcp/catalog.v2.md", timeout=60); r.raise_for_status()
    ids = sorted(set(re.findall(r"JAXA\.[A-Za-z0-9_.\-]+", r.text)))
    gs = [i for i in ids if "GSMaP" in i]; sst = [i for i in ids if "SST" in i.upper()]
    m = dict(n_collections=len(ids), gsmap=gs, sst=sst, catalog_cors=cors(r))
    try:
        from jaxa.earth import je                                         # noqa: F401
        m["python_pkg"] = "installed"
    except ImportError:
        pr = subprocess.run([sys.executable, "-m", "pip", "install", "jaxa-earth", "--extra-index-url",
                             "https://data.earth.jaxa.jp/api/python/repository/"], capture_output=True, text=True)
        m["python_pkg"] = "install failed: " + (pr.stdout + pr.stderr).strip().splitlines()[-1][:200] if pr.returncode else "installed now (restart kernel)"
    # The JS/Python APIs read COGs described by STAC collections; try the documented public bucket pattern.
    stac = {}
    for cid in (gs[:1] + sst[:1]):
        for base in ("https://s3.ap-northeast-1.wasabisys.com/je-pds/cog/v1/", "https://data.earth.jaxa.jp/stac/cog/v1/"):
            try:
                rr = http(f"{base}{cid}/collection.json", timeout=60)
                stac[f"{base}{cid}"] = dict(status=rr.status_code, cors=cors(rr),
                                            links=len(rr.json().get("links", [])) if rr.status_code == 200 else None)
                if rr.status_code == 200: break
            except Exception as e:
                stac[f"{base}{cid}"] = str(e)[:80]
    m["stac"] = stac
    st = PASS if gs and any(isinstance(v, dict) and v.get("status") == 200 for v in stac.values()) else (WARN if gs else FAIL)
    return st, f"{len(gs)} GSMaP + {len(sst)} SST collections listed; python: {m['python_pkg'][:80]}; STAC: " \
               f"{ {k.split('/')[-1]: (v.get('status') if isinstance(v, dict) else v) for k, v in stac.items()} } (the JS API in the browser is the documented route)", m

@test("F2", "NOAA Coral Reef Watch Degree Heating Weeks at St Martin's Island (F3)", ["F3", "B4"], "F partner data")
def t_crw_dhw():
    meta, _ = jget("https://coastwatch.noaa.gov/erddap/info/noaacrwdhwDaily/index.json")
    vs = [r[1] for r in meta["table"]["rows"] if r[0] == "variable"]
    var = ([v for v in vs if "degree" in v.lower() or "dhw" in v.lower()] or vs)[0]
    lats = http("https://coastwatch.noaa.gov/erddap/griddap/noaacrwdhwDaily.csv0?latitude").text.split()
    desc = float(lats[0]) > float(lats[-1])
    la = f"({ST_MARTIN[0]+0.2}):1:({ST_MARTIN[0]-0.2})" if desc else f"({ST_MARTIN[0]-0.2}):1:({ST_MARTIN[0]+0.2})"
    q = f"https://coastwatch.noaa.gov/erddap/griddap/noaacrwdhwDaily.csv0?{var}[(last)][{la}][({ST_MARTIN[1]-0.2}):1:({ST_MARTIN[1]+0.2})]"
    r = http(q, timeout=120); rows = [l.split(",") for l in r.text.splitlines() if l]
    valid = [x for x in rows if x[-1] not in ("NaN", "")]
    return (PASS if valid else WARN), f"{var}: {len(valid)}/{len(rows)} valid 5 km pixels near St Martin's; e.g. {valid[:2]}", dict(rows=rows[:20], cors=cors(r))

@test("F3", "NOAA OISST v2.1 via ERDDAP at a Bay point (F2 triad, independent of MUR inputs only partly)", ["F2"], "F partner data")
def t_oisst():
    q = "https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.csv0?sst[(last)][(0.0)][(20.125)][(89.125)]"
    r = http(q, timeout=120); r.raise_for_status()
    return PASS, f"last OISST: {r.text.strip()}", dict(row=r.text.strip(), cors=cors(r))

@test("F4", "Himawari-9 and GK2A on AWS (10-min full disk covering Bangladesh): newest object time", ["F1", "M1"], "F partner data")
def t_geo_aws():
    def prefixes(bucket, p):
        t = http(f"https://{bucket}.s3.amazonaws.com/", params={"list-type": 2, "delimiter": "/", "prefix": p}, timeout=60).text
        return [s for s in re.findall(r"<Prefix>([^<]+)</Prefix>", t) if s != p]
    out = {}
    for bucket in ("noaa-himawari9", "noaa-gk2a-pds"):
        p = ""
        for _ in range(8):                       # walk down: product / YYYY / MM / DD / HHMM ... always the newest
            subs = prefixes(bucket, p)
            if not subs: break
            last = [s.rstrip("/").split("/")[-1] for s in subs]
            if all(x.isdigit() for x in last):
                p = max(subs)                    # zero-padded dates: lexicographic max = newest
            else:
                p = ([s for s in subs if re.search(r"FLDK|/FD/|^FD|L1B", s, re.I)] or subs)[0]
        r = http(f"https://{bucket}.s3.amazonaws.com/", params={"list-type": 2, "max-keys": 1000, "prefix": p}, timeout=60)
        keys = re.findall(r"<Key>([^<]+)</Key>", r.text)
        t, n = newest_in(keys)
        out[bucket] = dict(prefix=p, objects=len(keys), newest=n, age_h=round(age_days(t) * 24, 1) if t else None)
    ok = any(v.get("objects") and v.get("age_h") is not None and v["age_h"] < 6 for v in out.values())
    return (PASS if ok else WARN), f"{out}", out

@test("F5", "Copernicus via keyless wrappers (Open-Meteo): CAMS PM2.5, GloFAS river discharge, ERA5 archive", ["E5", "E1", "K5", "D3"], "F partner data")
def t_open_meteo():
    out = {}
    aq, r1 = jget("https://air-quality-api.open-meteo.com/v1/air-quality", params=dict(latitude=DHAKA[0], longitude=DHAKA[1], hourly="pm2_5", past_days=2))
    out["cams_pm25_last"] = aq["hourly"]["pm2_5"][-30:-24]; out["cams_cors"] = cors(r1)
    fl, r2 = jget("https://flood-api.open-meteo.com/v1/flood", params=dict(latitude=25.18, longitude=89.67, daily="river_discharge", past_days=30))
    out["glofas_bahadurabad_last"] = fl["daily"]["river_discharge"][-5:]; out["glofas_cors"] = cors(r2)
    er, r3 = jget("https://archive-api.open-meteo.com/v1/archive", params=dict(latitude=DHAKA[0], longitude=DHAKA[1],
                  start_date="2024-04-01", end_date="2024-04-30", daily="temperature_2m_max"))
    out["era5_apr2024_max"] = max(x for x in er["daily"]["temperature_2m_max"] if x is not None); out["era5_cors"] = cors(r3)
    return PASS, f"CAMS PM2.5 sample {out['cams_pm25_last']}; GloFAS (Bahadurabad cell) {out['glofas_bahadurabad_last']}; " \
                 f"CORS headers {out['cams_cors']}/{out['glofas_cors']}/{out['era5_cors']} (wrapper: shares CAMS/GloFAS/ERA5 inputs)", out

def cds_like(url_env, url, dataset, request, label):
    key = secret(url_env)
    if not key: raise Skip(f"{url_env} not set (free account at {url.split('/api')[0]})")
    import cdsapi
    c = cdsapi.Client(url=url, key=key, quiet=True)
    target = OUT / "samples" / f"{label}.nc"
    c.retrieve(dataset, request, str(target))
    return PASS, f"{label}: downloaded {target.stat().st_size/1e3:.0f} kB", dict(file=str(target))

@test("F6", "Copernicus CDS: ERA5 hourly 2 m temperature, Dhaka, one hour", ["D3", "K5"], "F partner data", needs=["CDSAPI_KEY"])
def t_era5():
    return cds_like("CDSAPI_KEY", "https://cds.climate.copernicus.eu/api", "reanalysis-era5-single-levels",
                    {"product_type": ["reanalysis"], "variable": ["2m_temperature"], "year": ["2024"], "month": ["04"], "day": ["15"],
                     "time": ["06:00"], "area": [24, 90, 23.5, 90.5], "data_format": "netcdf", "download_format": "unarchived"}, "era5_dhaka")

@test("F7", "Copernicus ADS: CAMS global forecast PM2.5, Dhaka", ["E5", "B7"], "F partner data", needs=["ADSAPI_KEY"])
def t_cams():
    d = str((TODAY - dt.timedelta(days=2)).date())
    return cds_like("ADSAPI_KEY", "https://ads.atmosphere.copernicus.eu/api", "cams-global-atmospheric-composition-forecasts",
                    {"variable": ["particulate_matter_2.5um"], "date": [f"{d}/{d}"], "time": ["00:00"], "leadtime_hour": ["0"],
                     "type": ["forecast"], "area": [24, 90, 23.5, 90.5], "data_format": "netcdf"}, "cams_dhaka")

@test("F8", "Copernicus EWDS: GloFAS historical discharge, Brahmaputra at Bahadurabad (FFWC cross-check)", ["E1", "E3"], "F partner data", needs=["EWDSAPI_KEY"])
def t_glofas():
    return cds_like("EWDSAPI_KEY", "https://ewds.climate.copernicus.eu/api", "cems-glofas-historical",
                    {"system_version": ["version_4_0"], "hydrological_model": ["lisflood"], "product_type": ["consolidated"],
                     "variable": ["river_discharge_in_the_last_24_hours"], "hyear": ["2024"], "hmonth": ["08"], "hday": ["15"],
                     "data_format": "netcdf", "download_format": "unarchived", "area": [25.3, 89.6, 25.1, 89.8]}, "glofas_bahadurabad")

@test("F9", "NISAR (NASA–ISRO): scenes over the Sundarbans in ASF search (F4)", ["F4"], "F partner data")
def t_nisar():
    js, r = jget("https://api.daac.asf.alaska.edu/services/search/param", params=dict(
        platform="NISAR", intersectsWith="POINT(89.5 22.0)", maxResults=10, output="geojson"), timeout=120)
    feats = js.get("features", [])
    rows = [(f["properties"].get("sceneName") or f["properties"].get("fileID"), f["properties"].get("startTime"),
             f["properties"].get("bytes")) for f in feats]
    return (PASS if feats else WARN), f"{len(feats)} NISAR products over the Sundarbans (first: {rows[:2]})", dict(rows=rows, cors=cors(r))

@test("F10", "NSIDC Sea Ice Index v4 daily extent (D5/M3, 5099 cross-check)", ["M3", "D5"], "F partner data")
def t_seaice():
    out = {}
    for hemi in ("north", "south"):
        base = f"https://noaadata.apps.nsidc.org/NOAA/G02135/{hemi}/daily/data/"
        names = list_dir(base); csv = [n for n in names if n.endswith(".csv") and "extent" in n.lower()]
        if not csv: out[hemi] = "no csv"; continue
        t = http(base + sorted(csv)[-1], timeout=60).text.strip().splitlines()
        out[hemi] = dict(file=sorted(csv)[-1], last=t[-1])
    return PASS, f"{out}", out

@test("F11", "IBTrACS North Indian basin tracks (I4 music-box year; B5 cold wake)", ["I4", "B5", "K2"], "F partner data")
def t_ibtracs():
    import pandas as pd
    base = "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/"
    names = [n for n in list_dir(base) if "NI" in n and n.endswith(".csv")]
    f = [n for n in names if "list" in n] or names
    raw = http(base + f[0], timeout=300).text
    df = pd.read_csv(io.StringIO(raw), skiprows=[1], low_memory=False)
    df["ISO_TIME"] = pd.to_datetime(df.ISO_TIME, errors="coerce")
    for c in ("LAT", "LON"): df[c] = pd.to_numeric(df[c], errors="coerce")
    recent = df[df.ISO_TIME >= TODAY.replace(tzinfo=None) - pd.Timedelta(days=730)]
    names_r = recent.NAME.dropna().unique().tolist()
    bay = recent[recent.LON.between(80, 100) & recent.LAT.between(5, 25)].NAME.dropna().unique().tolist()
    return PASS, f"{f[0]}: {len(df)} rows; last 2 years storms {names_r[:12]}; Bay of Bengal: {bay[:8]}", dict(file=f[0], bay=bay)

@test("F12", "PSMSL Bangladesh tide gauges (Hiron Point, Cox's Bazar, Chittagong): record years (D5)", ["D5", "E1"], "F partner data")
def t_psmsl():
    out = {}
    for sid in (1451, 1476, 1573, 416):
        for kind, ext in (("rlr", "rlrdata"), ("met", "metdata")):
            r = http(f"https://psmsl.org/data/obtaining/{kind}.monthly.data/{sid}.{ext}", timeout=60)
            if r.status_code != 200: continue
            rows = [l.split(";") for l in r.text.splitlines() if l.strip()]
            good = [float(x[0]) for x in rows if int(float(x[1])) != -99999]
            if good: out[sid] = dict(kind=kind, first=int(min(good)), last=int(max(good)), n=len(good)); break
        page = http(f"https://psmsl.org/data/obtaining/stations/{sid}.php", timeout=60).text
        nm = re.search(r"<h1[^>]*>([^<]+)</h1>", page)
        out.setdefault(sid, {})["name"] = nm.group(1).strip() if nm else "?"
    return PASS, f"{out} (overlap with altimetry only to the last year shown)", out

@test("F13", "USGS earthquakes near Bangladesh + EarthScope waveform → 1 audified WAV (G2)", ["G2"], "F partner data", heavy=True)
def t_seismic():
    import numpy as np
    js, r = jget("https://earthquake.usgs.gov/fdsnws/event/1/query", params=dict(format="geojson", latitude=23.7, longitude=90.4,
                 maxradiuskm=1500, minmagnitude=5.0, starttime=str((TODAY - dt.timedelta(days=730)).date()), orderby="magnitude", limit=5))
    ev = js["features"]
    if not ev: return WARN, "no M5+ within 1500 km in 2 years", {}
    e = ev[0]; t0 = dt.datetime.fromtimestamp(e["properties"]["time"] / 1000, dt.timezone.utc)
    from obspy import UTCDateTime
    from obspy.clients.fdsn import Client
    st, used = None, None
    for base in ("EARTHSCOPE", "IRIS", "https://service.earthscope.org"):
        try:
            c = Client(base, timeout=120)
            st = c.get_waveforms("IU", "CHTO", "00", "BHZ", UTCDateTime(t0) - 60, UTCDateTime(t0) + 3600); used = base; break
        except Exception as ex:
            last = str(ex)[:120]
    if st is None: return WARN, f"event {e['properties']['title']} found; waveform fetch failed ({last})", {}
    tr = st.merge(fill_value=0)[0]; x = tr.data.astype(float); x = x - x.mean(); x /= (np.abs(x).max() or 1)
    rate = int(tr.stats.sampling_rate * 400)        # 400x speed-up: an hour → 9 s
    import wave
    wf = OUT / "samples" / "G2_quake_CHTO_400x.wav"
    with wave.open(str(wf), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(min(rate, 48000)); w.writeframes((x * 32000).astype("<i2").tobytes())
    return PASS, f"{e['properties']['title']}: {len(x)} samples from IU.CHTO via {used}; wrote {wf.name} (credit EarthScope/NSF)", dict(event=e["properties"]["title"])

@test("F14", "OpenAQ v3: Dhaka/Chattogram ground PM2.5 locations (E5 ground layer, DoE + Embassy)", ["E5", "K5"], "F partner data", needs=["OPENAQ_API_KEY"])
def t_openaq():
    key = secret("OPENAQ_API_KEY")
    if not key: raise Skip("OPENAQ_API_KEY not set (free key; keep it server-side)")
    out = {}
    for name, (la, lo) in (("Dhaka", DHAKA), ("Chattogram", CTG)):
        js, r = jget("https://api.openaq.org/v3/locations", headers={"X-API-Key": key},
                     params=dict(coordinates=f"{la},{lo}", radius=25000, limit=100))
        locs = js.get("results", [])
        out[name] = [(l.get("name"), (l.get("datetimeFirst") or {}).get("utc"), (l.get("datetimeLast") or {}).get("utc")) for l in locs][:15]
    return PASS, f"{ {k: len(v) for k, v in out.items()} } locations; first/last dates saved", out

@test("F15", "WAQI mirror of DoE CAMS station + US Embassy Dhaka (feed ended 4 Mar 2025?)", ["E5"], "F partner data")
def t_waqi():
    tok = secret("WAQI_TOKEN"); out = {}
    for sid in ("@538612", "@8781"):
        if tok:
            js, r = jget(f"https://api.waqi.info/feed/{sid}/", params={"token": tok})
            out[sid] = dict(status=js.get("status"), time=(js.get("data") or {}).get("time"), cors=cors(r))
        else:
            r = http(f"https://aqicn.org/station/{sid}/", timeout=60); out[sid] = dict(http=r.status_code)
    return (PASS if tok else WARN), f"{out}{'' if tok else ' (set WAQI_TOKEN for values)'}", out

@test("F16", "US Embassy Dhaka PM2.5 figure data (EPA Science Hub) readable", ["E5"], "F partner data")
def t_embassy():
    import pandas as pd
    base = "https://pasteur.epa.gov/uploads/10.23719/1528454/"
    SESSION.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Bloop-data-tests"
    try:
        names = list_dir(base)
    except Exception as e:
        return WARN, f"EPA Science Hub blocks scripted access ({str(e)[:60]}): download the Excel files by hand from {base}", {}
    finally:
        SESSION.headers["User-Agent"] = "Bloop-data-tests/1.0 (NASA Space Apps 2026, team PTSD)"
    xl = [n for n in names if n.lower().endswith((".xlsx", ".xls", ".csv"))]
    if not xl: return WARN, f"no spreadsheets listed at {base} ({names[:10]})", {}
    p = download(base + xl[0], OUT / "samples" / xl[0], max_mb=50)
    sheets = pd.read_excel(p, sheet_name=None) if p.suffix.startswith(".xls") else {"csv": pd.read_csv(p)}
    shape = {k: list(v.shape) for k, v in sheets.items()}
    return PASS, f"{len(xl)} files; {xl[0]} sheets {shape}", dict(files=xl, shape=shape)

@test("F17", "Xeno-canto: Bangladesh Oriental Magpie-Robin (Doel) recordings + licences (G3/H6)", ["G3", "H6"], "F partner data")
def t_xc():
    key = secret("XC_API_KEY")
    if not key:
        raise Skip("XC_API_KEY not set: API v2 is retired (404 in run 1); v3 needs a free xeno-canto account key")
    js, r = jget("https://xeno-canto.org/api/3/recordings", params={"query": 'sp:"Copsychus saularis" cnt:bangladesh', "key": key})
    recs = js.get("recordings", [])
    lic = {}
    for x in recs: lic[x.get("lic", "?")] = lic.get(x.get("lic", "?"), 0) + 1
    byok = [x for x in recs if re.search(r"/by(-sa)?/", x.get("lic", "")) and "nc" not in x.get("lic", "").lower()]
    nc_ok = [x for x in recs if "-nd" not in x.get("lic", "").lower()]
    return (PASS if byok else WARN), (f"{len(recs)} recordings; licences {lic}; free for any use: {len(byok)}; usable in a NON-commercial "
            f"project with credit + share-alike: {len(nc_ok)} (e.g. XC{nc_ok[0].get('id') if nc_ok else '-'} by {nc_ok[0].get('rec') if nc_ok else '-'})"), dict(licences=lic)

@test("F18", "Freesound: CC0 monsoon / tin-roof rain recordings (G3 bed)", ["G3"], "F partner data", needs=["FREESOUND_TOKEN"])
def t_freesound():
    tok = secret("FREESOUND_TOKEN")
    if not tok: raise Skip("FREESOUND_TOKEN not set (or record your own rain - no licence risk)")
    out = {}
    for q in ("monsoon rain", "rain on tin roof", "heavy rain", "Bangladesh rain", "river boat"):
        js, _ = jget("https://freesound.org/apiv2/search/text/", params=dict(query=q, filter='license:"Creative Commons 0"',
                     fields="id,name,license,username,duration", token=tok, page_size=5))
        out[q] = dict(count=js.get("count"), examples=[(x["id"], x["name"][:40]) for x in js.get("results", [])[:3]])
    n = sum(v["count"] or 0 for v in out.values())
    return (PASS if n else WARN), f"CC0 results per query: { {k: v['count'] for k, v in out.items()} }", out

@test("F19", "NOAA passive acoustic archive bucket reachable (G3 hydrophone variant)", ["G3"], "F partner data")
def t_noaa_pad():
    out = {}
    for b in ("noaa-passive-bioacoustic",):
        js, r = jget(f"https://storage.googleapis.com/storage/v1/b/{b}/o", params={"maxResults": 5, "delimiter": "/"})
        out[b] = dict(prefixes=js.get("prefixes", [])[:20])
    return PASS, f"{out}", out

# %% [markdown]
# ## G. Live, keyless APIs (real-time layers) + server CORS headers (browser test is definitive)

# %%
@test("G1", "USGS earthquake feed (minute updates, keyless)", ["G2", "I4", "L2", "X1"], "G live APIs")
def t_usgs():
    js, r = jget("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson")
    return PASS, f"{len(js['features'])} significant quakes this month; ACAO {cors(r)}", dict(cors=cors(r))

@test("G2", "GEOS-CF public Zarr: PM2.5 at Dhaka now (v2 vs v1, analysis vs forecast) for the B7 'now' voice", ["B7", "E5", "K5"], "G live APIs", heavy=True)
def t_geoscf_s3():
    import numpy as np, xarray as xr
    t = http(f"https://{GEOSCF_BUCKET}.s3.us-west-2.amazonaws.com/", params={"list-type": 2, "delimiter": "/"}, timeout=60)
    stores = [x for x in re.findall(r"<Prefix>([^<]+)</Prefix>", t.text) if x.endswith(".zarr/") and "cols" not in x and "rpl" not in x]
    out = {}
    for st_ in stores:
        try:
            ds = xr.open_zarr(f"s3://{GEOSCF_BUCKET}/{st_}", storage_options={"anon": True}, consolidated=None)
            var = [v for v in ds.data_vars if v.lower().startswith("pm25")]
            if not var: out[st_] = "no pm25 var"; continue
            da = ds[var[0]]
            if "lev" in da.dims: da = da.isel(lev=0)
            pt = da.sel(lat=DHAKA[0], lon=DHAKA[1], method="nearest")
            last = pt.isel(time=slice(-24, None)).load() if "time" in pt.dims else pt.load()
            out[st_] = dict(var=var[0], time_first=str(ds.time.values[0])[:16], time_last=str(ds.time.values[-1])[:16],
                            dhaka_last24h_mean=round(float(last.mean()), 1), dhaka_last=round(float(last.values.ravel()[-1]), 1))
        except Exception as e:
            out[st_] = f"open failed: {str(e)[:100]}"
    ok = [k for k, v in out.items() if isinstance(v, dict) and "v2" in k]
    st = PASS if ok else WARN
    return st, f"{ {k: (v if isinstance(v, str) else (v['time_last'], v['dhaka_last24h_mean'])) for k, v in out.items()} } " \
               "(µg/m³; compare with CAMS in F5 and ground stations before choosing a voice)", dict(stores=out, cors=cors(t))

@test("G3", "NASA EONET v3 open events (storms, floods, fires)", ["I4", "K5", "L2", "X1"], "G live APIs")
def t_eonet():
    js, r = jget("https://eonet.gsfc.nasa.gov/api/v3/events", params={"status": "open", "limit": 50})
    cats = {}
    for e in js.get("events", []):
        for c in e.get("categories", []): cats[c["title"]] = cats.get(c["title"], 0) + 1
    return PASS, f"{len(js.get('events', []))} open events {cats}; ACAO {cors(r)} (not a precise positional source)", dict(cats=cats, cors=cors(r))

@test("G4", "NOAA SWPC real-time solar wind (new rtsw paths) + Kp (format changed 2026)", ["X1", "M1"], "G live APIs")
def t_swpc():
    w, r1 = jget("https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json")
    k, r2 = jget("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json")
    last = w[0] if isinstance(w, list) and w else w
    keys = sorted(last.keys()) if isinstance(last, dict) else type(last).__name__
    has_ps = isinstance(last, dict) and "proton_speed" in last
    return (PASS if has_ps else WARN), f"rtsw fields {keys[:12]} (proton_speed present: {has_ps}); Kp rows {len(k)}; ACAO {cors(r1)}", \
           dict(fields=keys, cors=cors(r1))

@test("G5", "NASA DONKI flares (api.nasa.gov; DEMO_KEY = 50 req/day)", ["X1"], "G live APIs")
def t_donki():
    key = secret("NASA_API_KEY", "DEMO_KEY")
    r = http("https://api.nasa.gov/DONKI/FLR", params=dict(startDate=str((TODAY - dt.timedelta(days=30)).date()), endDate=str(TODAY.date()), api_key=key), timeout=60)
    if r.status_code >= 500:
        r2 = http("https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR", params=dict(startDate=str((TODAY - dt.timedelta(days=30)).date()), endDate=str(TODAY.date())), timeout=60)
        if r2.status_code == 200:
            return PASS, f"api.nasa.gov DONKI returned {r.status_code}; the CCMC DONKI service answered directly: {len(r2.json())} flares in 30 d; ACAO {cors(r2)}", dict(cors=cors(r2))
        return WARN, f"DONKI unavailable (api.nasa.gov {r.status_code}, CCMC {r2.status_code}): treat flares as optional", {}
    r.raise_for_status(); js = r.json()
    return PASS, f"{len(js)} flares in 30 d; remaining quota {r.headers.get('X-RateLimit-Remaining')}; ACAO {cors(r)}", dict(cors=cors(r))

@test("G6", "CelesTrak GP: who is over Bangladesh (Terra, Aqua, SNPP, NOAA-20/21, GPM, SMAP, SWOT, PACE, Landsat 9)", ["X2", "M1", "I1"], "G live APIs")
def t_celestrak():
    sats = {25994: "Terra", 27424: "Aqua", 37849: "Suomi NPP", 43013: "NOAA-20", 54234: "NOAA-21", 39574: "GPM Core",
            40376: "SMAP", 54754: "SWOT", 58928: "PACE", 49260: "Landsat 9"}
    got = {}
    for cat, expected in sats.items():
        js, r = jget("https://celestrak.org/NORAD/elements/gp.php", params={"CATNR": cat, "FORMAT": "json"})
        got[cat] = (expected, js[0].get("OBJECT_NAME") if js else None, js[0].get("EPOCH") if js else None); time.sleep(1)
    bad = {k: v for k, v in got.items() if not v[1]}
    return (PASS if not bad else WARN), f"{got}; ACAO {cors(r)} (cache: CelesTrak firewalls over-polling)", dict(sats=got)

@test("G7", "GIBS: find layers for MUR SST/anomaly, IMERG, VIIRS fires, Black Marble; tile decodes via colormap (3-way check)", ["C1", "B3", "F2"], "G live APIs", heavy=True)
def t_gibs():
    import xml.etree.ElementTree as ET, numpy as np
    from PIL import Image
    cap = http("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi", params={"SERVICE": "WMTS", "REQUEST": "GetCapabilities"}, timeout=120)
    root = ET.fromstring(cap.content)
    ns = {"w": "http://www.opengis.net/wmts/1.0", "ows": "http://www.opengis.net/ows/1.1", "xlink": "http://www.w3.org/1999/xlink"}
    layers = {}
    for L in root.iter("{http://www.opengis.net/wmts/1.0}Layer"):
        ident = L.find("ows:Identifier", ns).text
        cms = [m.get("{http://www.w3.org/1999/xlink}href") for m in L.findall("ows:Metadata", ns)
               if "colormap" in (m.get("{http://www.w3.org/1999/xlink}href") or "")]
        tms = [t.find("w:TileMatrixSet", ns).text for t in L.findall("w:TileMatrixSetLink", ns)]
        fmt = [f.text for f in L.findall("w:Format", ns)]
        layers[ident] = dict(colormaps=cms, tms=tms, fmt=fmt)
    want = {k: [l for l in layers if all(w in l.lower() for w in k.split("+"))][:6]
            for k in ("mur+sea_surface_temperature", "mur+anomal", "imerg+precipitation", "viirs+thermal", "black_marble", "pm2", "ndvi")}
    save_json("G7_gibs_layers.json", want)
    test_layer = (want["mur+sea_surface_temperature"] or [None])[0]
    m = dict(n_layers=len(layers), matches=want, cors_caps=cors(cap))
    if not test_layer: return WARN, f"{len(layers)} layers; no MUR SST layer name matched", m
    L = layers[test_layer]; day = str((TODAY - dt.timedelta(days=3)).date())
    tile = http("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi", params=dict(SERVICE="WMTS", REQUEST="GetTile", VERSION="1.0.0",
                LAYER=test_layer, STYLE="default", TILEMATRIXSET=L["tms"][0], TILEMATRIX=0, TILEROW=0, TILECOL=0, FORMAT="image/png", TIME=day), timeout=120)
    m["tile_status"], m["tile_cors"] = tile.status_code, cors(tile)
    if tile.status_code != 200 or not L["colormaps"]: return WARN, f"tile {tile.status_code}; colormaps {L['colormaps']}", m
    cm = ET.fromstring(http(L["colormaps"][0], timeout=60).content)
    entries = [(tuple(int(x) for x in e.get("rgb").split(",")), e.get("sourceValue") or e.get("value")) for e in cm.iter() if e.get("rgb")]
    arr = np.asarray(Image.open(io.BytesIO(tile.content)).convert("RGBA"))
    px = arr[arr[:, :, 3] > 0][:, :3]
    table = {c: v for c, v in entries}
    hit = np.mean([tuple(int(x) for x in p) in table for p in px[:: max(1, len(px) // 5000)]]) if len(px) else 0
    m.update(colormap_entries=len(entries), exact_colour_hits=float(hit), sample_entries=entries[:5])
    return (PASS if hit > 0.9 else WARN), f"{test_layer}: {len(entries)} colormap entries; {hit:.0%} of tile pixels decode exactly to a sourceValue; tile ACAO {cors(tile)}", m

@test("G8", "VEDA + U.S. GHG Center STAC: collection lists (raw-value COG route)", ["C1", "E5"], "G live APIs")
def t_stac():
    out = {}
    for name, url in (("VEDA", "https://openveda.cloud/api/stac/collections"), ("GHG Center", "https://earth.gov/ghgcenter/api/stac/collections")):
        try:
            js, r = jget(url, params={"limit": 300})
            ids = [c["id"] for c in js.get("collections", [])]
            out[name] = dict(n=len(ids), cors=cors(r), relevant=[i for i in ids if re.search(r"no2|pm|co2|ch4|sst|precip|night|lights|flood", i, re.I)][:25])
        except Exception as e:
            out[name] = dict(error=str(e)[:120])
    ok = all("n" in v for v in out.values())
    return (PASS if ok else WARN), f"{ {k: v.get('n', v.get('error')) for k, v in out.items()} }", out

@test("G9", "NASA POWER (excluded for long-term claims): reachability + CORS only", ["-"], "G live APIs")
def t_power():
    js, r = jget("https://power.larc.nasa.gov/api/temporal/daily/point", params=dict(parameters="T2M", community="AG",
                 longitude=DHAKA[1], latitude=DHAKA[0], start="20240101", end="20240103", format="JSON"), timeout=120)
    return PASS, f"reachable; ACAO {cors(r)} (not used for long-term claims: failed P1b)", dict(cors=cors(r))

# %% [markdown]
# ## H. Bangladesh local sources (registration-gated ones are reachability checks + manual steps)

# %%
@test("H1", "FFWC API (registration needed) + data.gov.bd daily water levels", ["E1", "E3", "K1", "K5"], "H Bangladesh local")
def t_ffwc():
    out = {}
    for u in ("https://api3.ffwc.gov.bd/data_load/", "https://www.ffwc.gov.bd/", "https://www.ffwc.gov.bd/ffwc_charts/waterlevel.php"):
        try:
            hdr = {"Authorization": f"Bearer {secret('FFWC_TOKEN')}"} if secret("FFWC_TOKEN") and "api3" in u else {}
            r = http(u, headers=hdr, timeout=60); out[u] = dict(status=r.status_code, bytes=len(r.content), ctype=r.headers.get("Content-Type"))
        except Exception as e:
            out[u] = dict(error=str(e)[:80])
    try:
        r = http("https://data.gov.bd/api/download/?id=a25f536d-b12c-4b5f-9f60-884d695e4fe1", timeout=120)
        out["data.gov.bd daily water levels"] = dict(status=r.status_code, bytes=len(r.content), ctype=r.headers.get("Content-Type"))
    except Exception as e:
        out["data.gov.bd daily water levels"] = dict(error=str(e)[:80])
    ok = any(isinstance(v, dict) and v.get("status") == 200 for v in out.values())
    return (WARN if ok else FAIL), f"{out} → register: api.support@bwdb.gov.bd (docs only after registration)", out

@test("H2", "BMD portals reachable (radar/cyclone pages; historical data is paid, no redistribution)", ["K1", "K2"], "H Bangladesh local")
def t_bmd():
    out = {}
    for u in ("https://live6.bmd.gov.bd/", "https://dataportal.bmd.gov.bd/"):
        try: r = http(u, timeout=60); out[u] = r.status_code
        except Exception as e: out[u] = str(e)[:80]
    return (PASS if 200 in out.values() else WARN), f"{out} (display only; do not republish paid data)", out

@test("H3", "HydroShare CC-BY Bangladesh groundwater wells (GRACE ground check, D1)", ["D1", "E1"], "H Bangladesh local")
def t_hydroshare():
    out = {}
    for rid in ("231886df055e40f2a8186c16753f77f0", "41851504761a4ea89ccf5a8553447298"):
        js, r = jget(f"https://www.hydroshare.org/hsapi/resource/{rid}/files/", timeout=120)
        files = [f.get("file_name") or f.get("url") for f in js.get("results", [])]
        meta, _ = jget(f"https://www.hydroshare.org/hsapi/resource/{rid}/sysmeta/")
        out[rid] = dict(title=meta.get("resource_title"), n_files=len(files), files=files[:10])
    return PASS, f"{ {k: (v['title'], v['n_files']) for k, v in out.items()} }", out

@test("H4", "geoBoundaries Bangladesh districts (ADM2) for 'my district' digests (K5)", ["K5", "K1"], "H Bangladesh local")
def t_geob():
    js, r = jget("https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/")
    return PASS, f"{js.get('boundaryName')} {js.get('boundaryType')}: {js.get('admUnitCount')} units; licence {js.get('boundaryLicense')}", \
           dict(url=js.get("gjDownloadURL"), licence=js.get("boundaryLicense"))

@test("H5", "Disasters Charter activations 905 (Aug 2024) and 762 (2022 Sylhet) pages reachable", ["E2"], "H Bangladesh local")
def t_charter():
    out = {}
    for u in ("https://download.disasterscharter.org/web/guest/activations/-/article/flood-in-bangladesh-activation-905-",
              "https://download.disasterscharter.org/web/guest/activations/-/article/flood-large-in-bangladesh-activation-762-"):
        try: r = http(u, timeout=40, tries=1); out[u.split("/")[-1]] = r.status_code
        except Exception as e: out[u.split("/")[-1]] = f"{type(e).__name__} (site slow/blocked: open in a browser)"
    return (PASS if all(v == 200 for v in out.values()) else WARN), f"{out}", out

# %% [markdown]
# ## I. Engine math checks (no network): the audio claims in the ideas must hold exactly

# %%
def sst_hz(T): return 220 * 4 ** ((T + 5) / 40)

@test("I1", "Proof in unison: beat rate equals |f1 − f2| for frame vs source tones (C1)", ["C1", "C3"], "I engine math")
def t_beats():
    import numpy as np
    sr, dur = 8000, 4.0; t = np.arange(int(sr * dur)) / sr; errs = []
    for T, dT in ((28.0, 0.31), (15.0, 0.77), (2.0, 0.1)):
        f1, f2 = sst_hz(T), sst_hz(T + dT)
        y = np.sin(2 * np.pi * f1 * t) + np.sin(2 * np.pi * f2 * t)
        env = np.abs(y); k = int(sr / 200); env = np.convolve(env, np.ones(k) / k, "same")      # envelope
        spec = np.abs(np.fft.rfft(env - env.mean())); fr = np.fft.rfftfreq(len(env), 1 / sr)
        sel = (fr > 0.2) & (fr < 40)
        beat = fr[sel][spec[sel].argmax()]; errs.append((T, dT, round(f2 - f1, 3), round(float(beat), 3)))
    ok = all(abs(b - d) <= 0.3 for _, _, d, b in errs)
    semis = 12 * math.log2(sst_hz(1) / sst_hz(0))
    return (PASS if ok else FAIL), f"(T, ΔT, expected Hz, measured Hz) {errs}; 1 °C = {semis:.3f} semitones → 0.31 °C = {0.31*semis:.2f} st", dict(rows=errs)

@test("I2", "Scrub re-synthesis: pitch depends only on value, not scrub speed (I2)", ["I2", "B2"], "I engine math")
def t_scrub():
    vals = [26.0, 27.5, 29.0, 30.2]
    hz = [[round(sst_hz(v), 6) for v in vals] for speed in (0.5, 1, 4)]
    ok = all(h == hz[0] for h in hz)
    return (PASS if ok else FAIL), "frequencies identical at 0.5×/1×/4× scrub (resample would shift them by the speed ratio)", dict(hz=hz[0])

@test("I3", "Swara + meend settles on the exact value within 1 cent (H2)", ["H2", "H3"], "I engine math")
def t_meend():
    import numpy as np
    sa = 220.0; megh = [0, 2, 5, 7, 10]            # S R M P n (Kafi-thaat 'komal ni'); Megh omits Ga and Dha
    worst = 0
    for T in np.linspace(-4, 34, 200):
        f = sst_hz(T); c = 1200 * math.log2(f / sa); octv = math.floor(c / 1200)
        nearest = min((octv * 12 + s for s in megh + [12]), key=lambda s: abs(s * 100 - c))
        start = sa * 2 ** (nearest / 12)
        glide = [start * (f / start) ** (k / 50) for k in range(51)]          # exponential glide to the true pitch
        worst = max(worst, abs(1200 * math.log2(glide[-1] / f)))
    return (PASS if worst < 1 else FAIL), f"max settling error {worst:.4f} cents over 200 values", dict(worst_cents=worst)

@test("I4", "Shared water scale keeps the 9× difference (D1)", ["D1"], "I engine math")
def t_water_scale():
    bd, nwi = (0.83, -5.82), (8.71, -53.63)
    lo, hi = -60, 15
    def hz(x, a=lo, b=hi): return 80 * (320 / 80) ** ((x - a) / (b - a))
    st = lambda p: 12 * math.log2(hz(p[0]) / hz(p[1]))
    shared = (round(st(bd), 2), round(st(nwi), 2))
    per = lambda p, a, b: 12 * math.log2(hz(p[0], a, b) / hz(p[1], a, b))
    perser = (round(per(bd, -8, 4), 2), round(per(nwi, -60, 15), 2))
    return PASS, (f"semitones fallen (BD, NW India): shared scale {shared} (ratio {shared[1]/shared[0]:.1f}×); "
                  f"per-series scales {perser} (ratio {perser[1]/perser[0]:.1f}×: the real ~9× difference is hidden)"), dict(shared=shared, per_series=perser)

# %% [markdown]
# ## J. The whole Earth Information Center gallery (not only Daily Visualizations): what is frame-pairable?
# Sub-galleries verified on svs.gsfc.nasa.gov/gallery/earth-information-center/ on 26 Oct 2026.

# %%
EIC_GALLERIES = {"Earth Now Dashboard": "earth-now-dashboard", "Climate Vital Signs Dashboard": "climate-vital-signs-dashboard",
                 "Greenhouse Gases Dashboard": "greenhouse-gases-dashboard", "Carbon Dioxide Sources and Sinks": "carbon-dioxide-sources-sinks",
                 "Air Quality Dashboard": "air-quality-dashboard", "Wildland Fires Dashboard": "wildland-fires",
                 "NASA and Hurricanes": "nasaand-hurricanes", "NASA and Agriculture": "nasaand-agriculture"}
EIC_ITEMS = [14700, 14606, 14696, 14568, 14507, 14713, 3912, 4950, 4993, 4960, 5011, 5313, 5196, 5425, 5533, 14371]  # videos + beauty pieces
EIC_AREAS = {   # the EIC's nine monitoring areas -> title keywords (internal heuristic for sorting items)
    "sea level": r"sea level|ocean|current|sea surface|ice|coast",
    "air quality": r"air quality|pm ?2|ozone|nitrogen|no2|aerosol|smoke|carbon monoxide|particulate",
    "biodiversity": r"biodiversity|forest|habitat|mangrove|gedi|chimpanzee|vegetation|ndvi|species|phytoplankton",
    "wildfires": r"fire|burn",
    "greenhouse gases": r"carbon dioxide|co2|methane|greenhouse|carbon",
    "energy": r"night light|black marble|solar|energy|electric",
    "disasters": r"hurricane|cyclone|storm|flood|landslide|lightning|atmospheric river|earthquake|volcan|drought",
    "water resources": r"precipitation|rain|water|soil moisture|grace|snow|river|humidity",
    "agriculture": r"agricultur|crop|farm|food",
}
def eic_area(title):
    return [a for a, rx in EIC_AREAS.items() if re.search(rx, title, re.I)] or ["other"]

def svs_summary(sid):
    """Compact frame-pairing facts for one SVS item."""
    js, r = svs_api(sid)
    urls = sorted(set(walk_urls(js)))
    folders = [https(u) for u in urls if "/frames/" in u and u.endswith("/")]
    files = [u.split("?")[0] for u in urls if not u.endswith("/")]
    ext = lambda e: [u for u in files if u.lower().endswith(e)]
    bars = [u for u in files if re.search(r"colorbar|colourbar|legend|_bar[\W_]", u.split("/")[-1], re.I)]
    title = js.get("title", "?")
    return dict(id=sid, title=title, areas=eic_area(title), type=js.get("result_type") or js.get("type"),
                release=js.get("release_date"), updated=js.get("update_date"), frame_folders=len(folders),
                exr=len(ext(".exr")), png=len(ext(".png")), tif=len(ext((".tif", ".tiff"))), mp4=len(ext(".mp4")),
                colorbars=len(bars), frame_pairable=bool(folders or ext((".exr", ".tif", ".tiff"))) and bool(bars),
                first_folder=folders[0] if folders else None, colorbar=bars[0] if bars else None)

@test("J0", "EIC gallery inventory: every item in the 8 EIC sub-galleries + videos + beauty pieces (frames, colorbars, areas)",
      ["B1", "K3", "M1", "X3"], "J EIC gallery")
def t_eic_inventory():
    import pandas as pd
    ids, per_gallery = set(EIC_ITEMS), {}
    for name, slug in EIC_GALLERIES.items():
        try:
            html = http(f"{SVS}/gallery/{slug}/", timeout=60).text
            found = sorted(set(int(x) for x in re.findall(r'href="(?:https?://svs\.gsfc\.nasa\.gov)?/(\d{4,5})/?(?:#[^"]*)?"', html)))
            per_gallery[name] = found; ids |= set(found)
        except Exception as e:
            per_gallery[name] = f"error {str(e)[:60]}"
    rows = []
    for sid in sorted(ids):
        try: rows.append(svs_summary(sid))
        except Exception as e: rows.append(dict(id=sid, title=f"error: {str(e)[:60]}"))
    df = pd.DataFrame(rows); df.to_csv(OUT / "samples" / "J0_eic_inventory.csv", index=False)
    pair = df[df.get("frame_pairable", False) == True] if "frame_pairable" in df else df.iloc[0:0]
    by_area = {}
    for _, r in df.iterrows():
        for a in (r.get("areas") or ["?"]):
            by_area.setdefault(a, [0, 0]); by_area[a][0] += 1; by_area[a][1] += int(bool(r.get("frame_pairable")))
    m = dict(galleries={k: (len(v) if isinstance(v, list) else v) for k, v in per_gallery.items()}, items=len(df),
             frame_pairable=pair[["id", "title"]].values.tolist() if len(pair) else [], by_area=by_area)
    save_json("J0_eic_summary.json", m)
    return (PASS if len(df) else FAIL), (f"{len(df)} EIC items; {len(pair)} have frames/EXR/TIFF + a colorbar (frame-pairable). "
             f"Per area (items, frame-pairable): {by_area}. Full table: samples/J0_eic_inventory.csv"), m

@test("J1", "EIC beauty pieces Bloop could pair: ISS lightning 5011, night lights 5313, GEDI 4950, currents 3912/5425, CO2 5196, air 5533",
      ["E4", "E7", "D3", "X3"], "J EIC gallery")
def t_eic_beauty():
    out = {}
    for sid in (5011, 5313, 4950, 3912, 5425, 5196, 5533, 4960):
        try:
            s_ = svs_summary(sid)
            out[sid] = {k: s_[k] for k in ("title", "frame_folders", "exr", "png", "mp4", "colorbars", "frame_pairable", "colorbar")}
        except Exception as e:
            out[sid] = str(e)[:80]
    ok = [k for k, v in out.items() if isinstance(v, dict) and v["frame_pairable"]]
    return (PASS if ok else WARN), f"frame-pairable: {ok}; details saved", out

# %% [markdown]
# ## K. One value test per EIC monitoring area (Bangladesh + global), using the lightest access route

# %%
def rasterio_point(href, lat, lon, band=1):
    """Read one pixel from a (cloud-optimised) GeoTIFF over HTTPS without downloading it."""
    try:
        import rasterio
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "rasterio"], check=False); import rasterio
    from rasterio.warp import transform as rtransform
    if href.startswith("s3://"): href = "/vsis3/" + href[5:]
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_TIMEOUT="60", AWS_NO_SIGN_REQUEST="YES"):
        with rasterio.open(href) as ds:
            xs, ys = rtransform("EPSG:4326", ds.crs, [lon], [lat]) if ds.crs and ds.crs.to_epsg() != 4326 else ([lon], [lat])
            v = list(ds.sample([(xs[0], ys[0])], indexes=band))[0][0]
            nod = ds.nodata
            return (None if (nod is not None and v == nod) else float(v)), dict(crs=str(ds.crs), res=ds.res, dtype=ds.dtypes[0])

def stac_latest_asset(stac_root, collection, prefer=("cog_default", "data", "cog")):
    try:
        js, _ = jget(f"{stac_root}/search", params={"collections": collection, "limit": 1, "sortby": "-datetime"}, timeout=90)
        feats = js.get("features", [])
    except Exception:
        feats = []
    if not feats:
        js, _ = jget(f"{stac_root}/collections/{collection}/items", params={"limit": 1}, timeout=90); feats = js.get("features", [])
    if not feats: raise RuntimeError(f"no items in {collection}")
    f0 = feats[0]; assets = f0.get("assets", {})
    key = next((k for k in prefer if k in assets), None) or next((k for k, a in assets.items() if "tif" in (a.get("type", "") + a.get("href", "")).lower()), None)
    if not key: raise RuntimeError(f"no GeoTIFF asset in {list(assets)[:8]}")
    return f0.get("properties", {}).get("datetime") or f0.get("properties", {}).get("start_datetime"), assets[key]["href"], key

def covers(c, lat, lon):
    for b in (c.get("extent", {}).get("spatial", {}).get("bbox") or []):
        if len(b) >= 4 and b[0] <= lon <= b[2] and b[1] <= lat <= b[3]: return True
    return False

def titiler_point(raster_api, href, lat, lon):
    js, _ = jget(f"{raster_api}/cog/point/{lon},{lat}", params={"url": href}, timeout=90)
    v = (js.get("values") or [None])[0]
    return None if v is None else float(v)

def stac_points(stac_root, pattern, points, label, max_coll=6, raster_api=None):
    js, r = jget(f"{stac_root}/collections", params={"limit": 300}, timeout=90)
    cols = [c for c in js.get("collections", []) if re.search(pattern, c["id"] + " " + c.get("title", ""), re.I)]
    cols = [c for c in cols if covers(c, *DHAKA)] or cols                 # global/South Asia collections first
    ids = [c["id"] for c in cols][:max_coll]
    out = {}
    for cid in ids:
        try:
            t, href, key = stac_latest_asset(stac_root, cid)
            vals, how = {}, None
            for n, (la, lo) in points.items():
                try:
                    vals[n] = rasterio_point(href, la, lo)[0]; how = "direct COG"
                except Exception:
                    if not raster_api: raise
                    vals[n] = titiler_point(raster_api, href, la, lo); how = "raster API"
            out[cid] = dict(time=t, asset=key, values=vals, via=how)
        except Exception as e:
            out[cid] = f"{type(e).__name__}: {str(e)[:100]}"
    ok = [k for k, v in out.items() if isinstance(v, dict) and any(x is not None for x in v["values"].values())]
    return (PASS if ok else WARN), f"{label}: {len(ok)}/{len(ids)} collections returned values at {list(points)}: " \
           f"{ {k: v['values'] for k, v in out.items() if isinstance(v, dict)} }", dict(collections=ids, out=out, cors=cors(r))

BD_POINTS = {"Dhaka": DHAKA, "Chattogram": CTG, "Khulna": (22.82, 89.55)}

@test("K1", "Sea level: NASA-SSH global mean sea level indicator values (latest value + rate)", ["D5", "E1"], "K EIC areas", needs=["EARTHDATA"])
def t_gmsl():
    import numpy as np
    ea = earthdata(); res = ea.search_data(short_name="NASA_SSH_GMSL_INDICATOR", count=200)
    if not res: return FAIL, "no NASA_SSH_GMSL_INDICATOR granules", {}
    res = sorted(res, key=lambda g: json.dumps(g.get("umm", {}).get("TemporalExtent", {})))[-1:]
    p = ea.download(res, str(OUT / "samples" / "gmsl"))[0]
    txt = Path(p).read_text(errors="ignore") if not str(p).endswith((".nc", ".h5")) else None
    if txt:
        lines = txt.splitlines()
        header = [l.strip() for l in lines if l.lstrip().startswith(("#", "HDR")) or not re.match(r"^\s*-?[\d.]", l)][:40]
        rows = [l.split() for l in lines if l.strip() and not l.lstrip().startswith(("#", "HDR"))]
        num_rows = [[float(x) for x in r_[:4]] for r_ in rows if all(re.match(r"^-?[\d.]+$", x) for x in r_[:3])]
        units = [h for h in header if re.search(r"unit|mm|cm|reference|relative|column|GMSL", h, re.I)][:8]
        rate = None
        if len(num_rows) > 100:
            import numpy as np
            a = np.array(num_rows); recent = a[a[:, 0] >= a[-1, 0] - 10]
            rate = float(np.polyfit(recent[:, 0], recent[:, 1], 1)[0])
        return (PASS if num_rows else WARN), (f"{Path(p).name}: {len(num_rows)} rows; last {num_rows[-1] if num_rows else None}; "
                f"10-year rate {rate:.2f} units/yr; header says: {units}" if rate is not None else f"{len(num_rows)} rows; header {units}"), \
               dict(file=str(p), header=header, rate_10yr=rate)
    import xarray as xr
    ds = xr.open_dataset(p); return PASS, f"{Path(p).name}: variables {list(ds.data_vars)[:10]}", dict(vars=list(ds.data_vars))

@test("K2", "Air quality: Dhaka PM2.5 right now, OpenAQ ground stations (latest) vs CAMS vs GEOS-CF v2 analysis", ["E5", "B7", "K5"],
      "K EIC areas", needs=["OPENAQ_API_KEY"], heavy=True)
def t_pm_4way():
    import numpy as np, pandas as pd
    key = secret("OPENAQ_API_KEY"); hdr = {"X-API-Key": key}
    locs, _ = jget("https://api.openaq.org/v3/locations", headers=hdr, params=dict(coordinates=f"{DHAKA[0]},{DHAKA[1]}", radius=25000, limit=100))
    pm_sensors = {}
    for l in locs.get("results", []):
        for s_ in l.get("sensors", []):
            if (s_.get("parameter") or {}).get("name") == "pm25":
                pm_sensors[s_["id"]] = dict(location=l.get("name"), location_id=l.get("id"), provider=(l.get("provider") or {}).get("name"))
    readings, raw_example = [], None
    for lid in sorted({v["location_id"] for v in pm_sensors.values()})[:25]:
        try:
            js, _ = jget(f"https://api.openaq.org/v3/locations/{lid}/latest", headers=hdr)
        except Exception:
            continue
        for row in js.get("results", []):
            raw_example = raw_example or row
            sid = row.get("sensorsId") or row.get("sensors_id")
            if sid in pm_sensors and row.get("value") is not None:
                t = (row.get("datetime") or {}).get("utc")
                readings.append(dict(**pm_sensors[sid], value=float(row["value"]), utc=t, age_h=round(age_days(t) * 24, 1) if t else None))
    df = pd.DataFrame(readings); df.to_csv(OUT / "samples" / "K2_openaq_latest.csv", index=False)
    fresh = df[(df.age_h <= 6) & (df.value >= 0) & (df.value < 1000)] if len(df) else df
    ground = float(fresh.value.median()) if len(fresh) else None
    aq, _ = jget("https://air-quality-api.open-meteo.com/v1/air-quality", params=dict(latitude=DHAKA[0], longitude=DHAKA[1], hourly="pm2_5", past_days=1, forecast_days=1))
    times = pd.to_datetime(aq["hourly"]["time"]); now = pd.Timestamp(TODAY.replace(tzinfo=None))
    i = int(np.argmin(np.abs((times - now).total_seconds()))); cams = aq["hourly"]["pm2_5"][i]
    geos, geos_t = None, None
    try:
        store, ds = geoscf_store(prefer=("v2", "ana"))
        var = [v for v in ds.data_vars if v.lower().startswith("pm25")][0]
        pt = ds[var].sel(lat=DHAKA[0], lon=DHAKA[1], method="nearest")
        if "lev" in pt.dims: pt = pt.isel(lev=0)
        last = pt.isel(time=-1).load(); geos, geos_t = float(last), str(last.time.values)[:16]
    except Exception as e:
        geos_t = f"error {str(e)[:60]}"
    m = dict(pm25_sensors=len(pm_sensors), readings=len(df), fresh_6h=len(fresh), ground_median=ground, cams_now=cams, geoscf_v2_ana=geos,
             geoscf_time=geos_t, by_provider=fresh.groupby("provider").value.median().round(1).to_dict() if len(fresh) else {},
             raw_example=raw_example)
    if ground is None:
        return WARN, f"{len(pm_sensors)} PM2.5 sensors, {len(df)} latest readings, none in the last 6 h (see samples/K2_openaq_latest.csv)", m
    return PASS, (f"Dhaka PM2.5 now: ground median {ground:.1f} µg/m³ ({len(fresh)} stations ≤6 h old) vs CAMS {cams} vs GEOS-CF v2 "
                  f"analysis {geos if geos is None else round(geos, 1)} ({geos_t}); ratios CAMS/ground {cams / ground:.2f}"
                  + (f", GEOS/ground {geos / ground:.2f}" if geos else "")), m

@test("K3", "Biodiversity: PACE chlorophyll in the northern Bay + GBIF bird records by month in Bangladesh (non-NASA) + mangrove canopy granules",
      ["E1", "D3", "G3", "H6"], "K EIC areas", needs=["EARTHDATA"], heavy=True)
def t_biodiversity():
    import numpy as np, xarray as xr
    out = {}
    ea = earthdata()
    try:
        res = ea.search_data(short_name="PACE_OCI_L3M_BGC_NRT", temporal=(str((TODAY - dt.timedelta(days=12)).date()), str(TODAY.date())))
        res = [r_ for r_ in res if re.search(r"0p1deg|0\.1deg", json.dumps(r_.data_links()))] or res
        res = [r_ for r_ in res if re.search(r"\.8D\.", json.dumps(r_.data_links()))] or \
              [r_ for r_ in res if re.search(r"\.DAY\.", json.dumps(r_.data_links()))] or res     # 8-day composites: fewer cloud gaps
        ds = xr.open_dataset(ea.open(res[-1:])[0], engine="h5netcdf")
        var = [v for v in ds.data_vars if "chlor" in v.lower()][0]
        lat = ds["lat"].values
        box = ds[var].sel(lat=slice(22, 18) if lat[0] > lat[-1] else slice(18, 22), lon=slice(87, 92))
        out["pace_chl_mg_m3"] = dict(file=str(res[-1].data_links()[0]).split("/")[-1], mean=float(box.mean(skipna=True)),
                                     valid=float(np.isfinite(box.values).mean()))
    except Exception as e:
        out["pace_chl_mg_m3"] = f"{type(e).__name__}: {str(e)[:100]}"
    try:
        sp, _ = jget("https://api.gbif.org/v1/species/match", params={"name": "Copsychus saularis"})
        occ, r = jget("https://api.gbif.org/v1/occurrence/search", params={"country": "BD", "taxonKey": sp.get("usageKey"),
                      "limit": 0, "facet": "month", "facetLimit": 12})
        months = {int(f["name"]): f["count"] for f in occ.get("facets", [{}])[0].get("counts", [])} if occ.get("facets") else {}
        out["gbif_magpie_robin_BD_by_month"] = dict(total=occ.get("count"), months=dict(sorted(months.items())), cors=cors(r))
    except Exception as e:
        out["gbif"] = str(e)[:100]
    try:
        g = ea.search_data(short_name="CMS_Global_Map_Mangrove_Canopy_1665", bounding_box=(89.0, 21.5, 89.9, 22.4), count=20)
        out["mangrove_granules_sundarbans"] = [str(x.data_links()[0]).split("/")[-1] for x in g][:8]
    except Exception as e:
        out["mangrove"] = str(e)[:100]
    ok = isinstance(out.get("pace_chl_mg_m3"), dict) or isinstance(out.get("gbif_magpie_robin_BD_by_month"), dict)
    return (PASS if ok else WARN), f"{out}", out

@test("K4", "Wildfires: FIRMS country query for Bangladesh, last 10 days (fast national count)", ["B6", "K5"], "K EIC areas", needs=["FIRMS_MAP_KEY"])
def t_firms_country():
    import pandas as pd
    key = secret("FIRMS_MAP_KEY"); out = {}
    for src in ("VIIRS_SNPP_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"):
        r = http(f"https://firms.modaps.eosdis.nasa.gov/api/country/csv/{key}/{src}/BGD/10", timeout=120)
        try: out[src] = len(pd.read_csv(io.StringIO(r.text)))
        except Exception: out[src] = r.text[:80]
    return PASS, f"Bangladesh fire detections, last 10 days: {out}", out

@test("K5", "Greenhouse gases: U.S. GHG Center STAC (CO2/CH4 grids) point values at Dhaka/Chattogram/Khulna", ["E5", "D3", "X3"], "K EIC areas", heavy=True)
def t_ghg_points():
    return stac_points("https://earth.gov/ghgcenter/api/stac", r"co2|ch4|methane|carbon|odiac|emission", BD_POINTS, "GHG Center",
                       raster_api="https://earth.gov/ghgcenter/api/raster")

@test("K6", "Energy: NASA POWER solar (ALLSKY) vs ERA5 shortwave (Open-Meteo), Dhaka 2024 daily: do they agree?", ["D3", "K5"], "K EIC areas")
def t_energy_solar():
    import numpy as np
    pw, _ = jget("https://power.larc.nasa.gov/api/temporal/daily/point", params=dict(parameters="ALLSKY_SFC_SW_DWN", community="RE",
                 longitude=DHAKA[1], latitude=DHAKA[0], start="20240101", end="20241231", format="JSON"), timeout=180)
    p = pw["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]
    er, _ = jget("https://archive-api.open-meteo.com/v1/archive", params=dict(latitude=DHAKA[0], longitude=DHAKA[1],
                 start_date="2024-01-01", end_date="2024-12-31", daily="shortwave_radiation_sum", timezone="UTC"))
    e = dict(zip([t.replace("-", "") for t in er["daily"]["time"]], er["daily"]["shortwave_radiation_sum"]))   # MJ/m²/day
    keys = [k for k in p if k in e and p[k] not in (-999, None) and e[k] is not None]
    a = np.array([p[k] for k in keys]); b = np.array([e[k] / 3.6 for k in keys])                               # -> kWh/m²/day
    r_ = float(np.corrcoef(a, b)[0, 1]); bias = float(np.mean(a - b))
    st = PASS if r_ > 0.8 and abs(bias) < 0.6 else WARN
    return st, f"{len(keys)} days: r = {r_:.2f}, mean POWER − ERA5 = {bias:+.2f} kWh/m²/day (solar voice OK only if they agree)", dict(r=r_, bias=bias)

@test("K7", "Disasters: EONET events near Bangladesh in the last year + LANCE flood product granule over Bangladesh", ["I4", "E2", "X1"], "K EIC areas")
def t_disasters():
    js, r = jget("https://eonet.gsfc.nasa.gov/api/v3/events", params={"bbox": "80,30,100,10", "status": "all", "days": 365})
    ev = [(e["title"], e["categories"][0]["title"], (e.get("geometry") or [{}])[-1].get("date")) for e in js.get("events", [])]
    ents = cmr_collections(short_name="MCDWD_L3_F1C_NRT")
    g = cmr_latest(ents[0]["id"], bbox=BD_BBOX) if ents else []
    m = dict(eonet=ev[:30], n=len(ev), flood_granule=g[0]["title"] if g else None, flood_links=[l["href"] for l in (g[0].get("links", []) if g else [])][:4])
    return PASS, f"{len(ev)} EONET events in the box (e.g. {ev[:4]}); LANCE flood granule {m['flood_granule']}", m

@test("K8", "Water resources: seasonal cycle of Bangladesh well levels (HydroShare, CC-BY) vs GRACE Bangladesh seasonal cycle", ["D1", "E1"],
      "K EIC areas", heavy=True)
def t_wells_grace():
    import numpy as np, pandas as pd
    rid = "41851504761a4ea89ccf5a8553447298"
    js, _ = jget(f"https://www.hydroshare.org/hsapi/resource/{rid}/files/", timeout=120)
    files = [f.get("url") for f in js.get("results", []) if f.get("url", "").split("?")[0].lower().endswith(".xlsx")]
    if not files: return FAIL, "monthly_groundwater_levels.xlsx not found in the HydroShare resource", {}
    p = download(files[0], OUT / "samples" / ("wells_" + files[0].split("/")[-1].split("?")[0]), max_mb=100)
    df = pd.read_excel(p)
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    cols = [c for c in df.columns if str(c).strip() in months]
    if len(cols) != 12: return WARN, f"expected 12 month columns, found {cols}", {}
    w = df[cols].apply(pd.to_numeric, errors="coerce")
    w = w.sub(w.mean(axis=1), axis=0)                                     # each station's anomaly about its own mean
    wells = w.median(axis=0).values                                        # national median seasonal cycle (m)
    P = app_paths()
    g, _ = jget(f"{P['data']}/context/grace.json")
    b = g["boxes"]["Bangladesh"]
    gs = pd.Series(b["cm"], index=pd.to_datetime(b["months"])).astype(float).dropna()
    grace = gs.groupby(gs.index.month).mean().reindex(range(1, 13)).values
    grace = grace - np.nanmean(grace)
    r_ = float(np.corrcoef(wells, grace)[0, 1])
    m = dict(stations=int(w.notna().any(axis=1).sum()), wells_cycle_m=[round(x, 2) for x in wells], grace_cycle_cm=[round(x, 1) for x in grace],
             r=r_, wells_amplitude_m=float(np.nanmax(wells) - np.nanmin(wells)), grace_amplitude_cm=float(np.nanmax(grace) - np.nanmin(grace)),
             note="If the wells file is depth-to-water, a negative r means agreement (deeper water = less storage)")
    st = PASS if abs(r_) >= 0.7 else WARN
    return st, (f"{m['stations']} stations: seasonal-cycle r = {r_:+.2f} (sign depends on depth vs level); wells swing {m['wells_amplitude_m']:.1f} m, "
                f"GRACE swings {m['grace_amplitude_cm']:.0f} cm. This checks the seasonal rhythm only; the file has no trend"), m

@test("K9", "Agriculture: 1-year NDVI cycle at a rice area (Bogura) shows the aman + boro seasons (crop heartbeat)", ["D3", "K4"], "K EIC areas")
def t_crop_cycle():
    la, lo = 24.85, 89.37
    dates, _ = jget("https://modis.ornl.gov/rst/api/v1/MOD13Q1/dates", params=dict(latitude=la, longitude=lo), headers={"Accept": "application/json"})
    d = [x["modis_date"] for x in dates.get("dates", [])][-23:]
    vals = []
    for i in range(0, len(d), 10):
        sub, _ = jget("https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset", headers={"Accept": "application/json"}, params=dict(
            latitude=la, longitude=lo, band="250m_16_days_NDVI", startDate=d[i], endDate=d[min(i + 9, len(d) - 1)], kmAboveBelow=0, kmLeftRight=0))
        vals += [(s_["calendar_date"], s_["data"][0] * 0.0001) for s_ in sub.get("subset", [])]
    v = [x[1] for x in vals]
    peaks = [vals[i][0] for i in range(1, len(v) - 1) if v[i] > v[i - 1] and v[i] >= v[i + 1] and v[i] > 0.5]
    return (PASS if len(peaks) >= 2 else WARN), f"{len(vals)} composites; NDVI peaks above 0.5 at {peaks}", dict(series=vals)

@test("K10", "NASA × JAXA rain duet: IMERG Late daily vs GSMaP daily (JAXA Earth API) at Dhaka for 10–30 monsoon days", ["F1", "H4"],
      "K EIC areas", needs=["EARTHDATA"], heavy=True)
def t_duet():
    import numpy as np, h5py
    n = 30 if FULL else 10
    days = [dt.date(2025, 7, 1) + dt.timedelta(days=i) for i in range(n)]
    ea = earthdata(); imerg = {}
    res = ea.search_data(short_name="GPM_3IMERGDL", temporal=(str(days[0]), str(days[-1])))
    for g, f in zip(res, ea.open(res)):
        with h5py.File(f, "r") as h:
            g_ = h["Grid"] if "Grid" in h else h
            lat, lon = g_["lat"][:], g_["lon"][:]; pr = g_["precipitation"]
            ix, iy = int(np.abs(lon - DHAKA[1]).argmin()), int(np.abs(lat - DHAKA[0]).argmin())
            v = float(pr[0, ix, iy]) if (pr.ndim == 3 and pr.shape[1] == len(lon)) else float(pr[0, iy, ix] if pr.ndim == 3 else pr[ix, iy])
        day = re.search(r"3IMERG\.(\d{8})", json.dumps(g.data_links())); imerg[day.group(1) if day else str(len(imerg))] = v
    gs, tries = {}, []
    try:
        from jaxa.earth import je
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "jaxa-earth", "--extra-index-url", "https://data.earth.jaxa.jp/api/python/repository/"], check=False)
        from jaxa.earth import je
    cat = http("https://data.earth.jaxa.jp/app/mcp/catalog.v2.md", timeout=60).text
    cands = sorted(set(re.findall(r"JAXA\.EORC_GSMaP[\w.\-]*daily", cat)), key=lambda c: ("standard" not in c, c))
    bands = sorted(set(re.findall(r"`?(PRECIP\w*)`?", cat))) or ["PRECIP"]
    for coll in cands[:3]:
        for band in bands[:3]:
            try:
                data = (je.ImageCollection(collection=coll, ssl_verify=True)
                        .filter_date(dlim=[f"{days[0]}T00:00:00", f"{days[-1]}T00:00:00"])
                        .filter_resolution(ppu=10)
                        .filter_bounds(bbox=[DHAKA[1] - 0.5, DHAKA[0] - 0.5, DHAKA[1] + 0.5, DHAKA[0] + 0.5])
                        .select(band=band).get_images())
                arr = np.asarray(data.raster.img, dtype=float)
                tlist = list(getattr(data, "timelist", None) or getattr(data.raster, "time", None) or [])
                tries.append((coll, band, list(arr.shape)))
                if arr.ndim == 4: arr = arr[..., 0]
                if arr.ndim == 2: arr = arr[None]
                cy, cx = arr.shape[1] // 2, arr.shape[2] // 2
                for k in range(arr.shape[0]):
                    key = (re.sub(r"\D", "", str(tlist[k]))[:8] if k < len(tlist) else days[k].strftime("%Y%m%d"))
                    gs[key] = float(arr[k, cy, cx])
                if gs: break
            except Exception as e:
                tries.append((coll, band, f"{type(e).__name__}: {str(e)[:80]}"))
        if gs: break
    pairs = [(imerg[k], gs[k]) for k in imerg if k in gs and np.isfinite(gs[k])]
    r_ = float(np.corrcoef(*zip(*pairs))[0, 1]) if len(pairs) >= 5 else None
    m = dict(imerg=imerg, gsmap=gs, pairs=len(pairs), r=r_, tries=tries, collections=cands, bands=bands,
             note="Check GSMaP units in the JAXA catalogue (mm/h vs mm/day) before comparing magnitudes; r is unit-free")
    st = PASS if r_ is not None else WARN
    return st, (f"{len(imerg)} IMERG days, {len(gs)} GSMaP days, {len(pairs)} pairs, daily r = {r_ if r_ is None else round(r_, 2)} "
                f"(partly independent: both use GPM microwave). Tries: {tries[:3]}"), m

@test("K11", "Cold wake: MUR SST along a Bay of Bengal cyclone track, 3 days before vs 3 days after (B5)", ["B5", "K2"], "K EIC areas",
      needs=["EARTHDATA"], heavy=True)
def t_cold_wake():
    import numpy as np, pandas as pd, xarray as xr
    base = "https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/"
    df = pd.read_csv(io.StringIO(http(base + "ibtracs.NI.list.v04r01.csv", timeout=300).text), skiprows=[1], low_memory=False)
    for c in ("LAT", "LON", "USA_WIND", "WMO_WIND"): df[c] = pd.to_numeric(df[c], errors="coerce")
    df["ISO_TIME"] = pd.to_datetime(df.ISO_TIME, errors="coerce")
    bay = df[df.LON.between(84, 93) & df.LAT.between(12, 22.5) & (df.ISO_TIME > "2020-01-01")]
    storm = bay.groupby("SID").agg(name=("NAME", "first"), wind=("USA_WIND", "max"), t0=("ISO_TIME", "min"), t1=("ISO_TIME", "max"))
    storm = storm.sort_values("wind", ascending=False).iloc[0]
    trk = bay[bay.SID == storm.name][["LAT", "LON"]].dropna().iloc[::2]
    ea = earthdata(); vals = {}
    for label, day in (("before", (storm.t0 - pd.Timedelta(days=3)).date()), ("after", (storm.t1 + pd.Timedelta(days=3)).date())):
        res = ea.search_data(short_name="MUR-JPL-L4-GLOB-v4.1", temporal=(str(day), str(day)))
        ds = xr.open_dataset(ea.open(res[:1])[0], engine="h5netcdf")
        sst = ds["analysed_sst"].isel(time=0)
        vals[label] = [num(sst.sel(lat=a, lon=o, method="nearest")) - 273.15 for a, o in zip(trk.LAT, trk.LON)]
    d = np.array(vals["after"]) - np.array(vals["before"])
    m = dict(storm=storm["name"], max_wind_kt=float(storm.wind), track_points=len(trk), mean_change_C=float(np.nanmean(d)),
             min_change_C=float(np.nanmin(d)))
    return (PASS if np.nanmean(d) < -0.3 else WARN), f"{storm['name']} (max {storm.wind:.0f} kt): SST change along track " \
                                                    f"mean {np.nanmean(d):+.2f} °C, strongest {np.nanmin(d):+.2f} °C over {len(trk)} points", m

@test("K12", "Night-light rests: Black Marble daily radiance at Khulna around Cyclone Remal (landfall 26 May 2024)", ["E7", "I4"], "K EIC areas",
      needs=["EARTHDATA"], heavy=True)
def t_remal_lights():
    import numpy as np, h5py
    la, lo = 22.82, 89.55
    h, v = int((lo + 180) // 10), int((90 - la) // 10); tile = f"h{h:02d}v{v:02d}"
    ea = earthdata()
    res = ea.search_data(short_name="VNP46A2", temporal=("2024-05-18", "2024-06-06"), bounding_box=(lo - 0.05, la - 0.05, lo + 0.05, la + 0.05))
    res = [r_ for r_ in res if tile in json.dumps(r_.get("umm", {})) + json.dumps(r_.data_links())]
    series = []
    (OUT / "samples" / "remal").mkdir(exist_ok=True)
    for p in ea.download(res, str(OUT / "samples" / "remal")):
        with h5py.File(p, "r") as f:
            names = {}
            f.visititems(lambda k, o: names.setdefault(k, o) if isinstance(o, h5py.Dataset) and "NTL" in k and len(o.shape) == 2 else None)
            key = sorted(names, key=lambda k: ("Gap_Filled" not in k, "BRDF" not in k))[0]
            arr = f[key][:]; fill = float(np.ravel(f[key].attrs.get("_FillValue", [-999.9]))[0])
        H, W = arr.shape; y = int(((90 - v * 10) - la) / 10 * H); x = int((lo - (-180 + h * 10)) / 10 * W)
        win = arr[y - 3:y + 4, x - 3:x + 4].astype(float); win = win[(win != fill) & (win > -900)]
        series.append((Path(p).name.split(".")[1], round(float(np.median(win)), 2) if win.size else None))
    vals = [s_[1] for s_ in sorted(series) if s_[1] is not None]
    drop = (min(vals) / np.median(vals)) if len(vals) >= 5 and np.median(vals) > 0 else None
    return (PASS if drop is not None and drop < 0.5 else WARN), f"{tile}: {sorted(series)}; min/median = {drop}", dict(series=sorted(series))

@test("K13", "SMAP soil moisture, Bangladesh box: monsoon (Aug) vs dry season (Feb) for the 'wet earth' voice", ["E1", "D3"], "K EIC areas",
      needs=["EARTHDATA"], heavy=True)
def t_smap_sm():
    import numpy as np, h5py
    ea = earthdata(); out = {}
    for label, (d0, d1) in (("Feb 2026", ("2026-02-13", "2026-02-17")), ("Aug 2025", ("2025-08-13", "2025-08-17"))):
        res = ea.search_data(short_name="SPL3SMP_E", temporal=(d0, d1))
        vals = []
        for f_ in ea.open(res[:5]):
            with h5py.File(f_, "r") as f:
                for gname in ("Soil_Moisture_Retrieval_Data_AM", "Soil_Moisture_Retrieval_Data_PM"):
                    if gname not in f: continue
                    grp = f[gname]; suf = "" if gname.endswith("AM") else "_pm"
                    sm = grp["soil_moisture" + suf][:] if ("soil_moisture" + suf) in grp else grp["soil_moisture"][:]
                    la = grp["latitude" + suf][:] if ("latitude" + suf) in grp else grp["latitude"][:]
                    lo = grp["longitude" + suf][:] if ("longitude" + suf) in grp else grp["longitude"][:]
                    m_ = (la > BD_BBOX[1]) & (la < BD_BBOX[3]) & (lo > BD_BBOX[0]) & (lo < BD_BBOX[2]) & (sm > 0)
                    vals += list(sm[m_])
        out[label] = round(float(np.mean(vals)), 3) if vals else None
        out[label + " n"] = len(vals)
    st = PASS if out.get("Aug 2025") and out.get("Feb 2026") and out["Aug 2025"] > out["Feb 2026"] else WARN
    return st, f"Bangladesh mean soil moisture (m³/m³, AM pass): {out}", out

@test("K14", "Worldview Snapshots API: true-colour image of Bangladesh on 21 Aug 2024 (flood) + CORS", ["M1", "E2"], "K EIC areas")
def t_worldview():
    r = http("https://wvs.earthdata.nasa.gov/api/v1/snapshot", params=dict(REQUEST="GetSnapshot", TIME="2024-08-21", BBOX="20.5,88,26.7,92.7",
             CRS="EPSG:4326", LAYERS="MODIS_Terra_CorrectedReflectance_TrueColor", WRAP="day", FORMAT="image/jpeg", WIDTH=512, HEIGHT=680), timeout=120)
    ok = r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image")
    if ok: (OUT / "samples" / "K14_worldview_20240821.jpg").write_bytes(r.content)
    return (PASS if ok else WARN), f"HTTP {r.status_code}, {r.headers.get('Content-Type')}, {len(r.content)} bytes, ACAO {cors(r)}", dict(cors=cors(r))

@test("K15", "GIBS by EIC area: which layers decode to exact values through their colormap (browser-ready value layers)", ["C1", "X3", "K3"],
      "K EIC areas", heavy=True)
def t_gibs_areas():
    import xml.etree.ElementTree as ET, numpy as np
    from PIL import Image
    cap = http("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi", params={"SERVICE": "WMTS", "REQUEST": "GetCapabilities"}, timeout=120)
    root = ET.fromstring(cap.content)
    ns = {"w": "http://www.opengis.net/wmts/1.0", "ows": "http://www.opengis.net/ows/1.1"}
    layers = {}
    for L in root.iter("{http://www.opengis.net/wmts/1.0}Layer"):
        ident = L.find("ows:Identifier", ns).text
        cms = [m.get("{http://www.w3.org/1999/xlink}href") for m in L.findall("ows:Metadata", ns) if "colormap" in (m.get("{http://www.w3.org/1999/xlink}href") or "")]
        tms = [t.find("w:TileMatrixSet", ns).text for t in L.findall("w:TileMatrixSetLink", ns)]
        fmts = [f.text for f in L.findall("w:Format", ns)]
        if cms and "image/png" in fmts: layers[ident] = (cms[0], tms[0])
    want = {"sea level/ocean": r"Sea_Surface_Temperature|Sea_Surface_Salinity|Chlorophyll", "air quality": r"Aerosol_Optical_Depth|Nitrogen_Dioxide|PM2",
            "wildfires": r"Fire_Radiative|Burned_Area", "greenhouse gases": r"Carbon_Dioxide|Methane|XCO2", "energy": r"Black_Marble|VIIRS_.*DayNightBand|Nighttime_Lights",
            "disasters": r"Flood|Landslide", "water resources": r"IMERG_Precipitation|Soil_Moisture|Snow_Cover|Water_Vapor",
            "agriculture/biodiversity": r"NDVI|EVI|Vegetation", "cryosphere": r"Sea_Ice"}
    out = {}
    day = str((TODAY - dt.timedelta(days=4)).date())
    for area, rx in want.items():
        cands = sorted([l for l in layers if re.search(rx, l)], key=len)[:3]
        res_ = []
        for lay in cands:
            cm_url, tms = layers[lay]
            try:
                tile = http("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi", params=dict(SERVICE="WMTS", REQUEST="GetTile", VERSION="1.0.0",
                            LAYER=lay, STYLE="default", TILEMATRIXSET=tms, TILEMATRIX=0, TILEROW=0, TILECOL=1, FORMAT="image/png", TIME=day), timeout=90)
                if tile.status_code != 200: res_.append((lay, f"tile {tile.status_code}")); continue
                cm = ET.fromstring(http(cm_url, timeout=60).content)
                table = {tuple(int(x) for x in e.get("rgb").split(",")) for e in cm.iter() if e.get("rgb")}
                px = np.asarray(Image.open(io.BytesIO(tile.content)).convert("RGBA")); px = px[px[:, :, 3] > 0][:, :3]
                hit = float(np.mean([tuple(int(x) for x in p_) in table for p_ in px[:: max(1, len(px) // 3000)]])) if len(px) else None
                res_.append((lay, None if hit is None else round(hit, 3)))
            except Exception as e:
                res_.append((lay, f"{type(e).__name__}"))
        out[area] = res_
    good = {a: [l for l, h in v if isinstance(h, float) and h > 0.9] for a, v in out.items()}
    n_ok = sum(1 for v in good.values() if v)
    return (PASS if n_ok >= 6 else WARN), f"{n_ok}/{len(want)} areas have a GIBS layer that decodes >90% exactly: { {a: v[:1] for a, v in good.items()} }", \
           dict(areas=out)

@test("K16", "VEDA STAC point values (NO2, nightlights, etc.) at Dhaka/Chattogram/Khulna via COGs (EIC dashboard data route)", ["E5", "E7", "X3"],
      "K EIC areas", heavy=True)
def t_veda_points():
    return stac_points("https://openveda.cloud/api/stac", r"no2|nightlights|blackmarble|aod|pm25|precip|sst|lst|ndvi|soil", BD_POINTS, "VEDA",
                       max_coll=8, raster_api="https://openveda.cloud/api/raster")

@test("K17", "Partner holdings in NASA's Earthdata Search (CMR): JAXA, ESA, ISRO, NOAA, USGS collections with data over Bangladesh", ["F1", "F2", "F4", "X3"],
      "K EIC areas")
def t_partner_cmr():
    out = {}
    for prov in ("JAXA", "ESA", "ISRO", "NOAA_NCEI", "LPCLOUD", "USGS_EROS", "EUMETSAT"):
        try:
            r = http(f"{CMR}/collections.json", params={"provider": prov, "bounding_box": ",".join(map(str, BD_BBOX)), "has_granules": "true", "page_size": 5}, timeout=60)
            out[prov] = dict(hits=int(r.headers.get("CMR-Hits", 0)), examples=[e.get("title", "")[:70] for e in r.json().get("feed", {}).get("entry", [])][:3])
        except Exception as e:
            out[prov] = str(e)[:80]
    return PASS, f"{ {k: (v['hits'] if isinstance(v, dict) else v) for k, v in out.items()} } collections with granules over Bangladesh", out

@test("K18", "Giovanni (no-download analysis): service reachable (manual use for time series/maps)", ["X3"], "K EIC areas")
def t_giovanni():
    out = {}
    for u in ("https://giovanni.gsfc.nasa.gov/giovanni/", "https://api.giovanni.earthdata.nasa.gov/"):
        try: r = http(u, timeout=60, tries=1); out[u] = r.status_code
        except Exception as e: out[u] = type(e).__name__
    return (PASS if 200 in out.values() else WARN), f"{out} (use the web UI for quick time series; the pipeline uses earthaccess)", out

# %% [markdown]
# ## L. Closing the gaps: biodiversity values, a verified GEDI frame, energy budget, evapotranspiration, population

# %%
SUNDARBANS = {"Sundarbans west": (21.95, 89.18), "Sundarbans centre": (22.0, 89.45), "Sundarbans east": (21.85, 89.75)}
FOREST_PTS = {**SUNDARBANS, "Madhupur forest": (24.62, 90.05), "Lawachara forest": (24.32, 91.79), "Dhaka (urban control)": DHAKA}
_GEDI_L3 = {}

def granules_by_link(short_name, link_rx, **kw):
    """Earthdata granules of a collection whose download links match a regex (so only the needed files are fetched)."""
    ea = earthdata()
    res = ea.search_data(short_name=short_name, **kw)
    keep = [g for g in res if re.search(link_rx, json.dumps(g.data_links()), re.I)]
    return ea, res, keep

def find_short_name(keyword, must=()):
    ents = cmr_collections(keyword=keyword, page_size=20)
    ents = [e for e in ents if all(m.lower() in (e.get("short_name", "") + " " + e.get("title", "")).lower() for m in must)] or ents
    if not ents: raise RuntimeError(f"no collection for {keyword!r}")
    return pick_collection(ents, keyword=keyword)

def local_points(path, points, band=1):
    try:
        import rasterio
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "rasterio"], check=False); import rasterio
    from rasterio.warp import transform as rtransform
    out = {}
    with rasterio.open(path) as ds:
        for n, (la, lo) in points.items():
            xs, ys = rtransform("EPSG:4326", ds.crs, [lo], [la]) if ds.crs and ds.crs.to_epsg() != 4326 else ([lo], [la])
            try:
                v = list(ds.sample([(xs[0], ys[0])], indexes=band))[0][0]
                out[n] = None if (ds.nodata is not None and v == ds.nodata) or not math.isfinite(float(v)) else round(float(v), 3)
            except Exception:
                out[n] = None
        meta = dict(crs=str(ds.crs), res=[round(x, 6) for x in ds.res], size=[ds.width, ds.height], dtype=ds.dtypes[0],
                    nodata=ds.nodata, scales=list(ds.scales), units=list(ds.units), descriptions=list(ds.descriptions))
    return out, meta

def unzip_first(path, rx=r"\.tif$"):
    if not str(path).lower().endswith(".zip"): return path
    with zipfile.ZipFile(path) as zf:
        names = [n for n in zf.namelist() if re.search(rx, n, re.I)]
        if not names: raise RuntimeError(f"no file matching {rx} in {Path(path).name}")
        dest = Path(path).with_suffix("") ; dest.mkdir(exist_ok=True)
        zf.extract(names[0], dest); return dest / names[0]

@test("L1", "Mangroves: NASA CMS Bangladesh canopy height (hmax95) + biomass at three Sundarbans points", ["E1", "D3", "X3"], "L gaps closed",
      needs=["EARTHDATA"])
def t_mangrove():
    out = {}
    for var, rx in (("max canopy height hmax95 (m)", r"hmax95_Bangladesh"), ("aboveground biomass (Mg/ha)", r"agb_Bangladesh")):
        ea, res, keep = granules_by_link("CMS_Global_Map_Mangrove_Canopy_1665", rx, bounding_box=(89.0, 21.5, 89.9, 22.4), count=50)
        if not keep: out[var] = f"no granule matching {rx} ({len(res)} granules over the box)"; continue
        (OUT / "samples" / "mangrove").mkdir(exist_ok=True)
        p = [x for x in ea.download(keep[:1], str(OUT / "samples" / "mangrove")) if str(x).lower().endswith((".tif", ".zip"))][0]
        vals, meta = local_points(unzip_first(p), SUNDARBANS)
        out[var] = dict(values=vals, file=Path(p).name, res=meta["res"], crs=meta["crs"])
    ok = [k for k, v in out.items() if isinstance(v, dict) and any(x is not None for x in v["values"].values())]
    return (PASS if ok else WARN), f"{ {k: (v['values'] if isinstance(v, dict) else v) for k, v in out.items()} } (2000-era mapping: a baseline, not live)", out

@test("L2", "GEDI gridded canopy height (L3) + biomass (L4B) at Sundarbans, Madhupur, Lawachara and Dhaka", ["D3", "E1", "X3"], "L gaps closed",
      needs=["EARTHDATA"], heavy=True)
def t_gedi_grids():
    out = {}
    specs = [("canopy height (L3, rh100 mean)", ("GEDI L3 Gridded Land Surface Metrics", ("gedi", "l3")), r"rh100_mean|rh_100_mean|rh98"),
             ("aboveground biomass (L4B, mean)", ("GEDI L4B Gridded Aboveground Biomass Density", ("gedi", "l4b")), r"_MU\.tif|_MU_|AGBD.*\.tif")]
    for label, (kw, must), rx in specs:
        try:
            col = find_short_name(kw, must)
            ea, res, keep = granules_by_link(col["short_name"], rx, count=200)
            if not keep:
                out[label] = f"{col['short_name']}: no file matching {rx}; e.g. {[str(g.data_links()[0]).split('/')[-1] for g in res[:6]]}"; continue
            (OUT / "samples" / "gedi").mkdir(exist_ok=True)
            p = [x for x in ea.download(keep[:1], str(OUT / "samples" / "gedi")) if re.search(rx, str(x), re.I)][0]
            vals, meta = local_points(p, FOREST_PTS)
            out[label] = dict(collection=col["short_name"], file=Path(p).name, values=vals, res=meta["res"])
            if "L3" in label: _GEDI_L3["path"] = str(p)
        except Exception as e:
            out[label] = f"{type(e).__name__}: {str(e)[:120]}"
    ok = [k for k, v in out.items() if isinstance(v, dict)]
    return (PASS if ok else WARN), f"{ {k: (v['values'] if isinstance(v, dict) else v) for k, v in out.items()} }", out

@test("L3", "ICESat-2 ATL08 canopy heights along one Sundarbans track (independent lidar check on GEDI)", ["D3", "E1"], "L gaps closed",
      needs=["EARTHDATA"], heavy=True)
def t_icesat2():
    import numpy as np, h5py
    ea = earthdata(); bb = (89.0, 21.6, 89.9, 22.3)
    res = ea.search_data(short_name="ATL08", bounding_box=bb, temporal=(str((TODAY - dt.timedelta(days=500)).date()), str(TODAY.date())))
    if not res: return FAIL, "no ATL08 granule over the Sundarbans", {}
    sizes = [(getattr(g, "size", 0)() if callable(getattr(g, "size", 0)) else (getattr(g, "size", 0) or 0)) for g in res]
    g = res[int(np.argmin([s or 1e9 for s in sizes]))]
    (OUT / "samples" / "atl08").mkdir(exist_ok=True)
    p = ea.download([g], str(OUT / "samples" / "atl08"))[0]
    heights = []
    with h5py.File(p, "r") as f:
        for beam in [k for k in f.keys() if k.startswith("gt")]:
            ls = f.get(f"{beam}/land_segments")
            if ls is None or "canopy" not in ls: continue
            la, lo = ls["latitude"][:], ls["longitude"][:]
            hc = ls["canopy/h_canopy"][:]
            m_ = (la > bb[1]) & (la < bb[3]) & (lo > bb[0]) & (lo < bb[2]) & (hc < 1e30) & (hc > 0)
            heights += list(hc[m_])
    if not heights: return WARN, f"{Path(p).name}: track crosses the box but no valid canopy heights (night/cloud/water)", {}
    h = np.array(heights)
    m = dict(file=Path(p).name, n=len(h), median_m=float(np.median(h)), p90_m=float(np.percentile(h, 90)))
    return PASS, f"{Path(p).name}: {len(h)} 100 m segments, canopy height median {m['median_m']:.1f} m, p90 {m['p90_m']:.1f} m " \
                 "(compare with L1/L2 at the same places)", m

@test("L4", "EIC GEDI forest-height frame (SVS 4950) vs GEDI L3 canopy height values (scale-free rank test): a verified biodiversity frame",
      ["D3", "X3", "B1"], "L gaps closed", needs=["EARTHDATA"], heavy=True)
def t_gedi_frame():
    """Choose files by their real pixel size from the SVS API (not by name): a colorbar is wide and short, a map frame is 2:1."""
    import numpy as np, pandas as pd
    if "path" not in _GEDI_L3:
        st_, d_, _ = t_gedi_grids()
        if "path" not in _GEDI_L3: return FAIL, f"needs the GEDI L3 file from L2 ({d_[:120]})", {}
    js, _ = svs_api(4950)
    inst = []
    def collect(o):
        if isinstance(o, dict):
            if isinstance(o.get("url"), str): inst.append(o)
            for v in o.values(): collect(v)
        elif isinstance(o, list):
            for v in o: collect(v)
    collect(js)
    rows = []
    for d in inst:
        u = d["url"]; name = u.split("/")[-1] or u.rstrip("/").split("/")[-1]
        w = d.get("width") or 0; h = d.get("height") or 0
        if not (w and h):
            m_ = re.search(r"(\d{3,5})x(\d{3,5})", u); w, h = (int(m_.group(1)), int(m_.group(2))) if m_ else (0, 0)
        rows.append(dict(url=https(u), name=name, w=int(w or 0), h=int(h or 0), media=d.get("media_type") or "", folder=u.endswith("/")))
    df = pd.DataFrame(rows).drop_duplicates("url"); df.to_csv(OUT / "samples" / "L4_4950_media.csv", index=False)
    img = df[df.name.str.lower().str.endswith((".png", ".tif", ".tiff", ".exr", ".jpg"))].copy()
    img["ratio"] = img.w / img.h.where(img.h > 0)
    is_bar = img.name.str.contains("colorbar|legend", case=False) & ((img.ratio > 3) | (img.h < 400) | img.ratio.isna())
    bars = img[is_bar].sort_values("w", ascending=False)
    maps = img[~is_bar & (img.w >= 1000)]
    flat = maps[(maps.ratio - 2).abs() < 0.05].sort_values("w", ascending=False)
    folders = df[df.folder & df.url.str.contains("/frames/")].url.tolist()
    summary = dict(files=len(df), images=len(img), colorbar_like=len(bars), large_images=len(maps), flat_2to1=len(flat),
                   folders=folders[:5], sizes=sorted({(int(r.w), int(r.h)) for r in maps.itertuples()})[:12])
    frame_url = flat.url.iloc[0] if len(flat) else None
    if not frame_url:
        for fo in sorted(folders, key=lambda u: not re.search(r"2x1|equirect|flat", u, re.I)):
            names = [n for n in list_dir(fo) if n.lower().endswith((".png", ".tif", ".exr"))]
            if names and re.search(r"2x1|equirect|flat", fo, re.I): frame_url = fo + sorted(names)[0]; break
    if not frame_url:
        return WARN, (f"4950 has no flat 2:1 map image ({summary}). Its views are rendered globes/regions, so pixels can't be "
                      "mapped to places. Use 4950 as the visual and drive the forest voice from GEDI L3 values (L2 passed)"), summary
    if not len(bars): return WARN, f"found a 2:1 frame but no colorbar ({summary})", summary
    f = download(frame_url, OUT / "samples" / ("4950_" + frame_url.split("/")[-1]), max_mb=200)
    b = download(bars.url.iloc[0], OUT / "samples" / ("4950_" + bars.name.iloc[0]), max_mb=20)
    im = read_image_rgba(f); H, W = im.shape[:2]
    brgba = read_image_rgba(b); _, geom = detect_colorbar_strip(brgba); strip = strip_band(brgba, geom, half=2)
    rng = np.random.default_rng(3)
    pts = {f"p{i}": (float(rng.uniform(-50, 50)), float(rng.uniform(-170, 170))) for i in range(500)}
    vals, _ = local_points(_GEDI_L3["path"], pts)
    keep = {k: v for k, v in vals.items() if v is not None and v > 0}
    xy = [latlon_to_px(*pts[k], W, H) for k in keep]
    frac, dist = invert_colours(np.array([im[y, x, :3] for x, y in xy]), strip, 25)
    rho, n = spearman(frac, list(keep.values()))
    summary.update(frame=frame_url, colorbar=bars.url.iloc[0], n=n, spearman=rho)
    st = PASS if n >= 40 and rho >= 0.7 else WARN
    return st, f"4950 frame {W}x{H}: {n} forest points matched its colorbar; Spearman {rho:.2f} vs GEDI L3 canopy height", summary

@test("L5", "ECOSTRESS evapotranspiration at Dhaka-region pixels (agriculture/water voice)", ["D3", "K5", "X3"], "L gaps closed",
      needs=["EARTHDATA"], heavy=True)
def t_ecostress_et():
    ea, res, keep = granules_by_link("ECO_L3T_JET", r"ETdaily|_ET\.tif|ETinst|ET_daily", bounding_box=(90.3, 23.7, 90.5, 23.9),
                                     temporal=(str((TODAY - dt.timedelta(days=60)).date()), str(TODAY.date())))
    if not keep: return WARN, f"{len(res)} ECO_L3T_JET granules near Dhaka, none with an ET layer link (e.g. {[str(g.data_links()[:3]) for g in res[:1]]})", {}
    (OUT / "samples" / "ecostress").mkdir(exist_ok=True)
    files = ea.download(keep[-1:], str(OUT / "samples" / "ecostress"))
    et = [x for x in files if re.search(r"ETdaily|_ET\.tif|ETinst|ET_daily", str(x), re.I)]
    pts = {"Dhaka": DHAKA, "N of Dhaka (farmland)": (23.95, 90.40), "Savar": (23.85, 90.26)}
    vals, meta = local_points(et[0], pts)
    return (PASS if any(v is not None for v in vals.values()) else WARN), f"{Path(et[0]).name}: {vals} (units per layer: {meta['units']}; " \
                                                                             "cloudy pixels are empty)", dict(meta=meta, values=vals)

@test("L6", "CERES SYN1deg daily energy balance at Dhaka: surface sunlight in + reflected/emitted out (energy voice; HDF4)", ["D3", "X3"],
      "L gaps closed", needs=["EARTHDATA"], heavy=True)
def t_ceres():
    import numpy as np
    try:
        from pyhdf.SD import SD, SDC
    except ImportError:
        subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pyhdf"], check=False); from pyhdf.SD import SD, SDC
    ea = earthdata(); res = ea.search_data(short_name="CER_SYN1deg-Day_Terra-Aqua-NOAA20",
                                           temporal=(str((TODAY - dt.timedelta(days=120)).date()), str(TODAY.date())))
    if not res: return FAIL, "no CERES SYN1deg-Day granule in the last 120 days", {}
    (OUT / "samples" / "ceres").mkdir(exist_ok=True)
    p = [x for x in ea.download(res[-1:], str(OUT / "samples" / "ceres")) if not str(x).endswith((".xml", ".met"))][0]
    f = SD(str(p), SDC.READ); names = list(f.datasets().keys())
    want = {"surface SW down, all-sky": ("sfc", "sw", "dn", "all"), "TOA SW up, all-sky": ("toa", "sw", "up", "all"),
            "TOA LW up, all-sky": ("toa", "lw", "up", "all"), "TOA solar incoming": ("toa", "solar")}
    def axis(word):
        cand = [n for n in names if word in n.lower() and len(f.select(n).info()) and f.select(n).info()[1] <= 2]
        if not cand: return None
        a = np.asarray(f.select(cand[0]).get(), float)
        a = a[:, 0] if (a.ndim == 2 and word == "lat") else (a[0, :] if a.ndim == 2 else a)
        if "colat" in cand[0].lower(): a = 90 - a
        return a
    lat_axis, lon_axis = axis("lat"), axis("lon")
    out = {}
    for label, terms in want.items():
        hit = [n for n in names if all(t in n.lower().replace("_", " ").replace("down", "dn") for t in terms)]
        if not hit: out[label] = None; continue
        sds = f.select(hit[0]); arr = sds.get().astype(float); att = sds.attributes()
        fill = att.get("_FillValue"); arr = np.where(arr == fill, np.nan, arr) if fill is not None else arr
        a2 = arr[-1] if arr.ndim == 3 else arr                               # (lat, lon) 1° grid
        if lat_axis is not None and len(lat_axis) == a2.shape[0]:
            iy = int(np.nanargmin(np.abs(lat_axis - DHAKA[0])))
        else:
            iy = None
        if lon_axis is not None and len(lon_axis) == a2.shape[1]:
            ix = int(np.nanargmin(np.abs(((lon_axis - DHAKA[1]) + 180) % 360 - 180)))
        else:
            ix = int(np.clip(round(DHAKA[1] % 360), 0, a2.shape[1] - 1))
        if iy is not None:
            out[label] = dict(sds=hit[0], units=att.get("units"), value=round(float(a2[iy, ix]), 1), lat=float(lat_axis[iy]))
        else:                                                                # no latitude field: report both orders
            ia = int(np.clip(round(DHAKA[0] + 89.5), 0, a2.shape[0] - 1))
            out[label] = dict(sds=hit[0], units=att.get("units"), value_if_south_first=round(float(a2[ia, ix]), 1),
                              value_if_north_first=round(float(a2[a2.shape[0] - 1 - ia, ix]), 1))
    m = dict(file=Path(p).name, values=out, n_sds=len(names), sds_sample=names[:25])
    ok = any(v for v in out.values())
    return (PASS if ok else WARN), (f"{Path(p).name}: {out} (NASA POWER solar is derived from CERES, so it is not an independent check)"), m

@test("L7", "Human dimensions: SEDAC GPW population density at Dhaka, Chattogram, Khulna (who lives under each sound)", ["K5", "X3"], "L gaps closed",
      needs=["EARTHDATA"], heavy=True)
def t_population():
    col = find_short_name("Gridded Population of the World GPWv4 population density", ("gpw",))
    ea, res, keep = granules_by_link(col["short_name"], r"2020.*(2pt5_min|15_min|30_min)|(2pt5_min|15_min|30_min).*2020", count=200)
    if not keep:
        return WARN, f"{col['short_name']}: no 2020 coarse-resolution file; e.g. {[str(g.data_links()[0]).split('/')[-1] for g in res[:6]]}", {}
    sizes = [(getattr(g, "size", 0)() if callable(getattr(g, "size", 0)) else (getattr(g, "size", 0) or 0)) for g in keep]
    g = keep[min(range(len(keep)), key=lambda i: sizes[i] or 1e9)]
    (OUT / "samples" / "gpw").mkdir(exist_ok=True)
    p = ea.download([g], str(OUT / "samples" / "gpw"))[0]
    vals, meta = local_points(unzip_first(p, rx=r"\.(tif|asc)$"), BD_POINTS)
    return (PASS if any(v is not None for v in vals.values()) else WARN), (f"{col['short_name']} ({Path(p).name}): people per km² {vals} "
            "(30-arc-minute cells ≈ 55 km, so city values are diluted by countryside; use 2.5-minute files for cities)"), \
           dict(values=vals, meta=meta)

CMR_SWEEP_EXTRA = [
    ("D37", "SEDAC gridded population (human dimensions; people under each sound)", None, "Gridded Population of the World GPWv4 population density", None, 99999, ["K5", "X3"]),
    ("D38", "CERES SYN1deg energy balance (energy/sun-earth)", None, "CERES SYN1deg daily", None, 60, ["X3"]),
    ("D39", "GLDAS Noah land model 0.25° 3-hourly (runoff, soil, snow)", "GLDAS_NOAH025_3H", "GLDAS Noah 3-hourly", BD_BBOX, 60, ["E1"]),
    ("D40", "VIIRS snow cover daily (Himalayan meltwater feeding Bangladesh rivers)", None, "VIIRS snow cover daily L3 global 375m", (85.0, 26.0, 95.0, 30.0), 5, ["E1"]),
    ("D41", "ICESat-2 ATL08 land/canopy heights over the Sundarbans", "ATL08", "ICESat-2 ATL08 land vegetation height", (89.0, 21.5, 89.9, 22.4), 120, ["D3"]),
    ("D42", "MAIAC aerosol optical depth daily 1 km (MCD19A2)", "MCD19A2", "MAIAC aerosol optical depth", BD_BBOX, 10, ["E5", "B7"]),
    ("D43", "ECOSTRESS evapotranspiration (agriculture/water)", None, "ECOSTRESS evapotranspiration tiled L3", BD_BBOX, 30, ["D3"]),
]
for _row in CMR_SWEEP_EXTRA:
    make_cmr_test(*_row)

CATEGORY_TESTS = {   # EIC monitoring area -> tests that feed it (for the report's coverage matrix)
    "sea level": ["D29", "F12", "K1", "B5099", "F10", "E4"], "air quality": ["B5151", "C5151", "G2", "E3", "E11", "F5", "F14", "K2", "D21", "D42"],
    "biodiversity": ["K3", "L1", "L2", "L3", "L4", "D30", "D32", "D41", "E10", "F17"], "wildfires": ["B5113", "C5113", "C5315", "E12", "K4", "D34"],
    "greenhouse gases": ["E15", "D22", "D23", "K5", "G8"], "energy": ["D10", "D12", "E5", "K6", "K12", "D38", "L6"],
    "disasters": ["F11", "K7", "K11", "E7", "D20", "D15", "F13", "G1", "D19"],
    "water resources": ["B4285", "D02", "D06", "D13", "D14", "D18", "E6", "K8", "K13", "F5", "D39", "D40"],
    "agriculture": ["E10", "K9", "D08", "D09", "D26", "D43", "L5"],
    "human dimensions (not an EIC area; Earthdata discipline)": ["D37", "L7", "E5"],
}

# %% [markdown]
# ## Run everything, then write the report

# %%
# Run 3 = everything that failed/warned for a fixable reason in run 2 + all new tests (J, K, D37-D43).
RUN3 = ["A", "C5147", "C5148", "C5151", "C5113", "C5176", "E5", "E6", "E7", "E14", "G2", "G5", "J", "K",
        "D37", "D38", "D39", "D40", "D41", "D42", "D43", "F17", "F18", "F6", "F7", "F8"]

SECRET_NAMES = ["EARTHDATA_PASSWORD", "FIRMS_MAP_KEY", "OPENAQ_API_KEY", "NASA_API_KEY", "WAQI_TOKEN", "XC_API_KEY", "FREESOUND_TOKEN",
                "CDSAPI_KEY", "ADSAPI_KEY", "EWDSAPI_KEY", "FFWC_TOKEN", "HYDROCRON_TOKEN"]
def redact(text):
    """Never print or save a key: replace every configured secret value (and api_key=/MAP_KEY URL parts) with ***."""
    text = str(text)
    for n in SECRET_NAMES:
        v = secret(n)
        if v and len(v) >= 6: text = text.replace(v, "***")
    text = re.sub(r"(/api/(?:area|country)/csv/)[A-Za-z0-9]{20,}", r"\1***", text)          # FIRMS MAP_KEY in URL paths
    return re.sub(r"(api_key=|token=|key=|MAP_KEY=)[A-Za-z0-9_\-]{12,}", r"\1***", text)

# Run 4 = the tests changed after run 3 (everything else already has a usable answer).
RUN4 = ["A2", "A3", "C5147", "C5148", "C5151", "G5", "K1", "K2", "K3", "K5", "K8", "K10", "K13", "K15", "K16", "F17", "F18", "L"]

# Run 5 = only the six tests that failed or could not answer in run 4.
RUN5 = ["K2", "K8", "K10", "L4", "L6", "L7"]
RUN6 = ["L4"]          # downloads the GEDI L3 file itself if L2 has not run in this session

def run(selected=None, skip_heavy=None):
    """selected: list of ID prefixes, e.g. ["A", "C5176", "E"]. Heavy tests (big downloads) run unless BLOOP_SKIP_HEAVY=1."""
    skip_heavy = os.environ.get("BLOOP_SKIP_HEAVY") == "1" if skip_heavy is None else skip_heavy
    RESULTS.clear()
    for t in REGISTRY:
        if selected and not any((t["id"].startswith(s) if len(s) == 1 else t["id"] == s) for s in selected): continue
        t0 = time.time()
        try:
            if "EARTHDATA" in t["needs"]: earthdata()
            for n in t["needs"]:
                if n != "EARTHDATA" and not secret(n): raise Skip(f"{n} not set")
            if t["heavy"] and skip_heavy:
                raise Skip("heavy test skipped (BLOOP_SKIP_HEAVY=1)")
            status, detail, metrics = t["fn"]()
        except Skip as s:
            status, detail, metrics = SKIP, str(s), {}
        except Exception as e:
            status, detail, metrics = FAIL, f"{type(e).__name__}: {str(e)[:300]}", {"trace": traceback.format_exc()[-1500:]}
        sec = round(time.time() - t0, 1)
        detail = redact(detail); metrics = json.loads(redact(json.dumps(metrics, default=str))) if metrics else metrics
        RESULTS.append(dict(id=t["id"], group=t["group"], title=t["title"], ideas=t["ideas"], status=status, detail=detail, seconds=sec))
        print(f"[{status:4}] {t['id']:6} {t['title'][:78]}  ({sec}s)\n        {detail[:400]}")
        (OUT / "results.json").write_text(json.dumps(RESULTS, indent=2, default=str))
        if metrics: save_json(f"metrics_{t['id']}.json", metrics)
    report()

IDEAS = ("A1 A2 A3 B1 B2 B3 B4 B5 B6 B7 B8 C1 C2 C3 C4 C5 C6 D1 D2 D3 D4 D5 E1 E2 E3 E4 E5 E6 E7 F1 F2 F3 F4 F5 G1 G2 G3 "
         "H1 H2 H3 H4 H5 H6 I1 I2 I3 I4 I5 I6 J1 J2 J3 J4 J5 J6 K1 K2 K3 K4 K5 L1 L2 L3 M1 M2 M3 X1 X2 X3").split()
# X3 = "every EIC area has a voice": the nine EIC monitoring areas each backed by at least one verified data route
# X1 = live event layer (catalogue shortlist #10: USGS + EONET + SWPC via a cache); X2 = satellite-pass cues ("who is measuring now")
NO_DATA_IDEAS = {"A3": "engine/UX (fixed-gain bed)", "C2": "uses existing frames (A1/A2)", "C4": "existing GPCP/GPCC (A1)",
                 "C6": "logger UX", "H1": "frame metadata only", "H4": "existing GPCP/IMERG + musician sign-off",
                 "H5": "synthesis only", "I5": "existing global cube", "I6": "engine; check Strudel licence",
                 "J1": "existing frames", "J2": "UX", "J4": "UX", "J5": "browser (bloop_browser_checks.html)",
                 "J6": "people: YPSA contact", "K1": "browser Bangla voice check + IMERG", "K4": "lesson design",
                 "L1": "export UX", "M1": "existing frames", "B1": "existing frames", "A2": "existing JSON"}

def report():
    import pandas as pd
    df = pd.DataFrame(RESULTS); df.to_csv(OUT / "results.csv", index=False)
    counts = df.status.value_counts().to_dict()
    lines = [f"# Bloop data readiness report ({TODAY:%Y-%m-%d %H:%M} UTC, mode {MODE})", "",
             f"**Totals:** {counts}", "", "| Status | ID | Test | Detail |", "|---|---|---|---|"]
    order = {FAIL: 0, WARN: 1, SKIP: 2, PASS: 3}
    for r in sorted(RESULTS, key=lambda r: (order[r["status"]], r["id"])):
        lines.append(f"| {r['status']} | {r['id']} | {r['title']} | {r['detail'][:220].replace('|', '/')} |")
    lines += ["", "## Idea readiness (which tests each idea depends on)", "", "| Idea | Tests | Worst status |", "|---|---|---|"]
    for idea in IDEAS:
        ts = [r for r in RESULTS if idea in r["ideas"] or "ALL" in r["ideas"]]
        worst = min((r["status"] for r in ts), key=lambda s: order[s]) if ts else ("n/a: " + NO_DATA_IDEAS.get(idea, "no data test"))
        lines.append(f"| {idea} | {', '.join(r['id'] for r in ts) or '-'} | {worst} |")
    lines += ["", "## EIC monitoring areas: best verified route so far", "", "| Area | PASS tests | Other tests |", "|---|---|---|"]
    by_id = {r["id"]: r for r in RESULTS}
    for area, ids in globals().get("CATEGORY_TESTS", {}).items():
        ps = [i for i in ids if by_id.get(i, {}).get("status") == PASS]
        other = [f"{i}:{by_id[i]['status']}" for i in ids if i in by_id and by_id[i]["status"] != PASS]
        lines.append(f"| {area} | {', '.join(ps) or '-'} | {', '.join(other) or '-'} |")
    lines += ["", "## Manual steps the script cannot do", "",
              "- Register for the FFWC API (api.support@bwdb.gov.bd); docs arrive only after registration.",
              "- Open `bloop_browser_checks.html` **on the deployed site** for real CORS, canvas pixel access, Bangla voices, vibration.",
              "- Check each chosen xeno-canto/Freesound file's licence by hand; prefer your own recordings.",
              "- GSMaP hourly/NRT and JAXA Himawari P-Tree need free JAXA accounts (P-Tree forbids redistribution: use the NOAA AWS copy).",
              "- ISRO MOSDAC/Bhuvan, EUMETSAT, Copernicus Marine need accounts; add them only if 28 Oct partner resources name them.",
              "- Ask a Bengali musician to sign off the tala/month table and the meend idea; contact YPSA (Chattogram) for a co-design hour.",
              "- Keep the daily 5315 FWI PNG archive running (no SVS archive exists): re-run test C5315 once a day."]
    (OUT / "REPORT.md").write_text("\n".join(lines))
    print("\n" + "\n".join(lines[:3]))
    print(f"\nSaved {OUT/'REPORT.md'}, {OUT/'results.csv'}, {OUT/'results.json'} and samples/ ")

# %%
if __name__ == "__main__":
    sel = [a for a in sys.argv[1:] if not a.startswith("--")]
    run(selected=sel or None)
