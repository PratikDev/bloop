"""Onboarding stages after the frames are in memory. Each returns its result and what it decided, for the manifest.
  times    — a linked date file (one date per frame or '<frame> <time>' lines), else the burned-in date box (OCR on the four
             corners), else a date in the file name, else the dataset's date range spread linearly, else undated;
  georef   — 2:1 frames: Natural Earth land IoU of the best of three land masks (pass at georef.IOU_PASS); otherwise none
             (the layer stays on the picture's own grid);
  colorbar — the page's colorbar files (the item's, then a twin's), then the frame's own bar regions; a strip with word
             labels only is read as 0–1 (relative);
  decode   — exact or chroma inversion (records/eic/run.decode), 1° cells on a map, 160×90 picture cells otherwise; with
             no key at all, the frames' brightness on the same cells (pattern only);
  check    — the sources.py source for the item's words, on the frame dates, 1° cells: Spearman and median relative error;
  status   — the fallback chain: verified (ρ ≥ 0.9, error ≤ 15 %) → values with stated error (ρ ≥ 0.9) → relative
             (ρ ≥ 0.6, or a word key) → pattern only → not usable (nothing decoded). Thresholds are provisional."""
import datetime as dt, re
import numpy as np
from .. import choose, colorbar, fetch as svs_fetch, frames, georef, ocr_dates, validate as V
from ..config import raw_dir
from ..fetch import Fetcher
from ..records.eic.run import comp, decode as decode_px

GOOD_RHO, GOOD_ERR, RELATIVE_RHO = 0.9, 0.15, 0.6
MAP_DEG, FRAME_GRID = 1.0, (160, 90)
DATE_FORMATS = ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%MZ", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%b %d, %Y", "%B %d, %Y", "%d %b %Y", "%B %Y", "%b %Y")
DATE_RX = re.compile(r"\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?Z?)?|[A-Z][a-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Z][a-z]{2} \d{4}|[A-Z][a-z]+ \d{4}")

def parse_dates(text):
    """Date-file text → {frame number (1-based line, or the stated number): datetime}."""
    stated = frames.times_from_list(text)
    if stated: return stated
    out = {}
    for i, line in enumerate((l.strip() for l in text.splitlines() if l.strip()), 1):
        m = DATE_RX.search(line)
        t = _loose(m.group(0).replace(",", ", ").replace(",  ", ", ")) if m else None
        if t: out[i] = t
    return out

def corner_date(rgb):
    H, W = rgb.shape[:2]
    for ys, xs in ((slice(int(0.9 * H), H), slice(0, int(0.3 * W))), (slice(0, int(0.1 * H)), slice(0, int(0.3 * W))),
                   (slice(int(0.9 * H), H), slice(int(0.7 * W), W)), (slice(0, int(0.1 * H)), slice(int(0.7 * W), W))):
        box = rgb[ys, xs].max(-1).astype(np.float32) / 255
        try:
            r = ocr_dates.read_date(np.where(box > 0.6, box, 0))
            if r["datetime"]: return r["datetime"], f"date box OCR: {r['text']}"
        except Exception:
            continue
    return None, None

def times(rec, picked):
    """[(datetime or None)], how — one per picked frame."""
    for url in choose.date_lists(rec):
        try:
            d = parse_dates(svs_fetch.text(url))
            if d: return [d.get(i + 1) or d.get(i) for _, _, i, _ in picked], f"date file {url.rsplit('/', 1)[1]}"
        except Exception:
            continue
    out, how = [], []                                        # how: in frame order, so the manifest says which frame read what
    for rgba, name, _, _ in picked:
        t, h = corner_date(rgba[..., :3])
        if not t:
            m = re.search(r"(20\d{2})[-_]?(\d{2})[-_]?(\d{2})(?:[T_ -]?(\d{2})[:-]?(\d{2}))?", name)
            if m:
                try: t, h = dt.datetime(int(m[1]), int(m[2]), int(m[3]), int(m[4] or 0), int(m[5] or 0), tzinfo=dt.timezone.utc), "file name"
                except ValueError: pass
        out.append(t); how.append(h)
    if any(out):
        out, fixed, estimated = monotonic(out)
        return out, "; ".join(h for h in dict.fromkeys(how) if h) + (f"; {fixed} out-of-order date(s) dropped as misreads" if fixed else "") + \
            (f"; {estimated} date(s) estimated from the dated frames' spacing" if estimated else "")
    ranges = [d.get("date_range") for d in rec.get("datasets") or [] if d.get("date_range")]
    span = re.findall(r"(\d{1,2}/\d{1,2}/\d{4}|\w+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}|\w+ \d{4})", ranges[0]) if ranges else []
    parsed = [p for p in (_loose(s) for s in span) if p]
    if len(parsed) >= 2:
        a, b = parsed[0], parsed[-1]
        return [a + (b - a) * (i / max(1, n - 1)) for _, _, i, n in picked], f"linear over the dataset's date range ({ranges[0]})"
    return [None] * len(picked), "undated"

def _ordered_run(ts):
    """Indices of the longest non-decreasing run of the dates read (fewest dates dropped; the earliest run on a tie)."""
    idx = [i for i, t in enumerate(ts) if t is not None]
    best = {}                                                # index → the longest run ending there
    for n, i in enumerate(idx):
        best[i] = max((best[j] for j in idx[:n] if ts[j] <= ts[i]), key=len, default=[]) + [i]
    return set(max(best.values(), key=len, default=[]))

def monotonic(ts):
    """Frames are picked in sequence order, so their dates cannot go backwards. The longest run of dates in order is kept;
    a date outside it is a misread (e.g. '31 Oct' read as 1 Oct, or the first frame's '03 Nov' read as 08 Nov, which an
    earlier neighbour-only rule kept while dropping the two right dates after it: SVS 5624, 6 Nov 2026) and is dropped.
    A frame without a date is interpolated between its dated neighbours; one before the first or after the last dated
    frame is estimated from the spacing of the two nearest dated frames (approximate). Returns (dates, how many were
    dropped as misreads, how many were estimated beyond the dated frames)."""
    keep = _ordered_run(ts)
    out = [t if i in keep else None for i, t in enumerate(ts)]
    fixed = sum(1 for i, t in enumerate(ts) if t is not None and i not in keep)
    dated = sorted(keep)
    estimated = 0
    for i, t in enumerate(out):
        if t is not None: continue
        j = next((k for k in reversed(dated) if k < i), None)
        k = next((k for k in dated if k > i), None)
        if j is not None and k is not None: out[i] = out[j] + (out[k] - out[j]) * ((i - j) / (k - j))
        elif len(dated) >= 2:                                 # beyond the dated frames: their own spacing per frame
            a, b = (dated[0], dated[1]) if k is not None else (dated[-2], dated[-1])
            out[i] = ts[a] + (ts[b] - ts[a]) * ((i - a) / (b - a)); estimated += 1
    return out, fixed, estimated

def _loose(s):
    s = s.strip().rstrip("Z")
    for f in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", *DATE_FORMATS, "%B %d %Y", "%b %d %Y",
              "%m/%d/%Y"):                                          # SVS dataset date ranges are US month/day/year
        try: return dt.datetime.strptime(s, f).replace(tzinfo=dt.timezone.utc)
        except ValueError: continue
    return None

def land_masks(rgb):
    f = rgb.astype(np.int16)
    grey = (f.max(-1) - f.min(-1)) < 20
    blue = (f[..., 2] > f[..., 1] + 10) & (f[..., 2] > f[..., 0] + 10)
    dark = f.max(-1) < 30
    return {"not blue, not black": ~blue & ~dark, "grey base map": grey & ~dark, "not dark": ~dark}

def georef_of(rgb):
    if not abs(rgb.shape[1] / rgb.shape[0] - 2) < 0.01: return {"projection": "none (not a flat 2:1 map)", "pass": False, "iou": None}
    import cv2
    small = cv2.resize(rgb, (1024, 512), interpolation=cv2.INTER_AREA)
    best = max(((name, georef.verify(georef.majority(m, 5))) for name, m in land_masks(small).items()), key=lambda x: x[1]["iou"])
    return {"projection": "equirectangular (2:1)", "mask": best[0], **{k: best[1][k] for k in ("iou", "pass", "best_is_assumed")}}

TIME_BAR = re.compile(r"time_?c?bar|timeline|date", re.I)            # time bars and date strips are not value keys

def colorbar_of(rec, owner_rec, sid, picked):
    """Every key file (full-size before print copies, time bars skipped) is tried for numeric labels first; a key with
    word labels only is the fallback (relative 0–1), then the frame's own bar regions."""
    fetch = Fetcher(raw_dir(sid) / "manifest.jsonl", tries=20)
    bars = [m for r in (rec, owner_rec) for m in choose.colorbars(r)
            if m["url"].lower().endswith((".png", ".tif", ".tiff", ".jpg")) and not TIME_BAR.search(m["filename"] or "")]
    bars = sorted({m["url"]: m for m in bars}.values(), key=lambda m: ("_print" in m["filename"], m["filename"].lower().endswith(".jpg")))[:6]
    words = None
    for m in bars:
        p = raw_dir(sid, "assets") / m["filename"]; fetch.get(m["url"], p, expect_bytes=20_000_000)
        rgba = frames.read_rgba(p)
        for reader in (lambda: colorbar.read(comp(rgba)), lambda: colorbar.read_labelled_strip(rgba)):
            try: return reader(), f"page colorbar {m['filename']}", False
            except Exception: pass
        if words is None:
            try: words = (colorbar.read(comp(rgba), stated_range=(0.0, 1.0)), f"page colorbar {m['filename']} (word labels: relative 0–1)", True)
            except Exception: pass
    rgba = picked[0][0]; H, W = rgba.shape[:2]
    for name, region in (("frame, lower left", rgba[int(0.75 * H):, :int(0.4 * W)]), ("frame, bottom strip", rgba[int(0.85 * H):]),
                         ("frame, right strip", rgba[:, int(0.85 * W):])):
        try: return colorbar.read(region), f"in-frame bar ({name})", False
        except Exception: pass
    return words or (None, "no colorbar found (page or frame)", False)

def brightness(picked, flat_map):
    """No key: the frames' own brightness (brightest channel, 0–1) on the same cells — pattern, not values."""
    import cv2
    size = (int(360 / MAP_DEG), int(180 / MAP_DEG)) if flat_map else FRAME_GRID
    grids = []
    for rgba, _, _, _ in picked:
        ok = rgba[..., 3] >= 128
        v = np.where(ok, rgba[..., :3].max(-1) / 255.0, 0).astype(np.float32)
        s, n = cv2.resize(v, size, interpolation=cv2.INTER_AREA), cv2.resize(ok.astype(np.float32), size, interpolation=cv2.INTER_AREA)
        grids.append(np.where(n > 0.5, s / np.maximum(n, 1e-9), np.nan))
    return np.stack(grids).astype(np.float32), {"mode": "brightness (no key)", "decoded_share": 1.0}

def decode(picked, cb, flat_map):
    if cb is None: return brightness(picked, flat_map)
    grids, metas = [], []
    for rgba, _, _, _ in picked:
        rgb, mask = np.ascontiguousarray(rgba[..., :3]), rgba[..., 3] < 128        # transparent = no data (*_alpha sets)
        g, m = decode_px(rgb, cb, mask, grid=(int(360 / MAP_DEG), int(180 / MAP_DEG)) if flat_map else FRAME_GRID)
        grids.append(g); metas.append(m)
    return np.stack(grids).astype(np.float32), {"mode": metas[0]["mode"], "decoded_share": float(np.mean([m["decoded_share"] for m in metas]))}

def check(cube, when, source, flat_map):
    if source is None: return None, "no validation source matches the item's words"
    if not flat_map: return None, "no georeference: spatial check not possible"
    name, rung, fetch, unit = source
    rhos, errs, used = [], [], []
    F, T = [], []
    static = "climatology" in name                                   # a climatology has no date to match
    for g, t in zip(cube, when):
        if t is None and not static: continue
        try: truth = fetch(t)
        except Exception as e: used.append({"date": t.strftime("%Y-%m-%d"), "error": f"{e.__class__.__name__}: {str(e)[:80]}"}); continue
        F.append(g); T.append(truth); used.append({"date": t.strftime("%Y-%m-%d") if t else "climatology"})
    if not F: return None, f"{name}: no date covered ({used[:2]})"
    F, T = np.stack(F), np.stack(T)
    rho, n = V.spearman(F, T)
    err = V.errors(F, T)
    return {"source": name, "rung": rung, "unit": unit, "spearman": rho, "n": n, "median_rel_error": err["median_rel"], "bias": err["bias"],
            "dates": used}, None

def status(cb, relative, cube, res):
    if cube is None or not np.isfinite(cube).any(): return "not usable"
    if cb is None: return "pattern only"                             # brightness, no key: never values
    if relative: return "relative"
    if res is None: return "pattern only"
    if res["spearman"] >= GOOD_RHO and res["median_rel_error"] <= GOOD_ERR: return "verified"
    if res["spearman"] >= GOOD_RHO: return "values with stated error"
    if res["spearman"] >= RELATIVE_RHO: return "relative"
    return "pattern only"
