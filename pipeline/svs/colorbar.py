"""Colorbar → calibrated 1-D colour curve. Steps: find the strip (reference suite's detector), measure its thickness and
outline, sample the median colour across the inner band (tick marks and outline never leak in), read the tick labels
(svs/ocr.py) under the strip, then calibrate position → value. A label is snapped to the tick mark it sits on (±6 px); positions
are then trusted to 1.5 px (tick mark) or 5 px (label centre only), and fits are weighted by 1/tolerance. Scale, decided from positions and labels alone (never
from validation data): linear if value is linear in position within those tolerances, else log if log10(value) is,
else piecewise between labels — log inside each segment when the labels have a constant ratio (decades), linear
otherwise (a stated assumption). The SVS text's stated range, when
there is one, is a cross-check; if OCR reads too few labels the stated range is used and the calibration says so."""
from dataclasses import dataclass, field, asdict
import numpy as np
from core.ref import T
from . import colour, ocr

TOL_TICK_PX, TOL_LABEL_PX = 1.5, 5.0

@dataclass
class Colorbar:
    rgb: np.ndarray                    # (N, 3) sRGB 0–255, low → high
    alpha: np.ndarray                  # (N,) 0–1 (an opacity transfer function when not all 1)
    geometry: dict
    ticks: list = field(default_factory=list)   # [{'px', 'value', 'text', 'engine'}] (px along the strip)
    scale: str = "unknown"             # linear | log | piecewise | stated-range
    fit: dict = field(default_factory=dict)
    notes: list = field(default_factory=list)

    @property
    def n(self): return len(self.rgb)

    def value_at(self, px):
        """Strip position (px, may be fractional) → value."""
        px = np.asarray(px, np.float64)
        f = self.fit
        if self.scale == "linear": return f["a"] + f["b"] * px
        if self.scale in ("log", "stated-log"): return 10 ** (f["a"] + f["b"] * px)
        if self.scale == "stated-range": return f["a"] + f["b"] * px
        xs, vs = np.array([t["px"] for t in self.ticks]), np.array([t["value"] for t in self.ticks])
        log = f.get("segment_interp") == "log"
        ys = np.log10(vs) if log else vs
        out = np.interp(px, xs, ys)
        lo, hi = px < xs[0], px > xs[-1]           # beyond the end labels: continue the end segments
        out[lo] = ys[0] + (px[lo] - xs[0]) * (ys[1] - ys[0]) / (xs[1] - xs[0])
        out[hi] = ys[-1] + (px[hi] - xs[-1]) * (ys[-1] - ys[-2]) / (xs[-1] - xs[-2])
        return 10 ** out if log else out

    def summary(self):
        d = {k: v for k, v in asdict(self).items() if k not in ("rgb", "alpha")}
        d.update(n_samples=self.n, value_range=[float(self.value_at(np.array([0.0]))[0]), float(self.value_at(np.array([self.n - 1.0]))[0])],
                 opacity_varies=bool(np.ptp(self.alpha) > 0.02))
        if self.scale == "linear": d["px_per_unit"] = 1 / self.fit["b"]
        if self.scale in ("log", "stated-log"): d["px_per_decade"] = 1 / self.fit["b"]
        return d

def _band(rgb, alpha, y, x0, x1, vertical):
    """Rows (or columns) belonging to the strip: neighbours whose colour profile matches the detected line."""
    img = rgb.transpose(1, 0, 2) if vertical else rgb
    ref = img[y, x0:x1 + 1].astype(float)
    top = bot = y
    while top > 0 and np.abs(img[top - 1, x0:x1 + 1] - ref).mean() < 25: top -= 1
    while bot < img.shape[0] - 1 and np.abs(img[bot + 1, x0:x1 + 1] - ref).mean() < 25: bot += 1
    return top, bot

def read(rgba, stated_range=None, n_labels_min=2):
    """Colorbar image (RGBA uint8) → calibrated Colorbar."""
    _, (x0, x1, y, vertical) = T.detect_colorbar_strip(rgba)
    rgb, a = rgba[..., :3].astype(float), rgba[..., 3].astype(float) / 255
    top, bot = _band(rgb, a, y, x0, x1, vertical)
    img = rgb.transpose(1, 0, 2) if vertical else rgb
    alp = a.T if vertical else a
    inner = slice(top + (bot - top) // 5, bot - (bot - top) // 5 + 1)
    edge = img[max(0, top - 2):top, x0:x1 + 1].reshape(-1, 3)           # outline colour, if the strip has one
    outline = np.median(edge, 0) if len(edge) and edge.std(0).max() < 20 else None
    thick = 0                                    # outline thickness = uniform rows above the strip
    while outline is not None and top - thick - 1 >= 0 and np.abs(img[top - thick - 1, x0:x1 + 1] - outline).max() < 30: thick += 1
    strip = np.median(img[inner, x0:x1 + 1], axis=0)
    trim = [0, 0]
    if outline is not None:                      # vertical outline lines at the ends: same colour top-to-bottom
        for side, idx in ((0, range(0, thick + 1)), (1, range(len(strip) - 1, len(strip) - thick - 2, -1))):
            for i in idx:
                col = img[top:bot + 1, x0 + i]
                if np.abs(col - outline).max() < 30: trim[side] += 1
                else: break
    s0, s1 = trim[0], len(strip) - trim[1]
    cb = Colorbar(rgb=strip[s0:s1][::-1] if vertical else strip[s0:s1],
                  alpha=np.median(alp[inner, x0 + s0:x0 + s1], axis=0)[::-1 if vertical else 1],
                  geometry={"x0": int(x0 + s0), "x1": int(x0 + s1 - 1), "band": [int(top), int(bot)], "vertical": bool(vertical),
                            "outline_rgb": None if outline is None else outline.round().tolist(), "image_size": list(rgba.shape[:2])})
    _calibrate(cb, rgba, stated_range, n_labels_min)
    return cb

def _labels_below(rgba, cb):
    """The first line of text under the strip (labels), read on a flat background (transparent pixels → panel colour)."""
    g = cb.geometry
    gray = rgba[..., :3].astype(float).mean(-1)
    opaque = rgba[..., 3] > 0
    if g["vertical"]:
        gray, opaque = gray[::-1].T, opaque[::-1].T   # rotate so the strip runs left → right, labels below
        lo = rgba.shape[0] - 1 - g["x1"]
        cols = slice(max(0, lo - 40), lo + (g["x1"] - g["x0"]) + 41)
    else:
        cols = slice(max(0, g["x0"] - 40), g["x1"] + 41)
    region = gray[g["band"][1] + 2: g["band"][1] + 80, cols]
    reg_op = opaque[g["band"][1] + 2: g["band"][1] + 80, cols]
    bg = np.median(region[reg_op]) if reg_op.any() else np.median(region)
    region = np.where(reg_op, region, bg)
    text = np.abs(region - bg) > 60
    text[text.mean(1) > 0.6] = False            # full-width rules (the strip's outline) are not text
    rows = np.where(text.any(1))[0]
    start = None
    for r0 in rows:                             # first block of ≥ 4 text rows = the label line
        r1 = r0
        while r1 + 1 < len(text) and text[r1 + 1].any(): r1 += 1
        if r1 - r0 >= 3: start = (r0, r1); break
    if start is None: return []
    block = region[start[0]:start[1] + 1]
    fg = np.percentile(block[text[start[0]:start[1] + 1]], 95)       # glyph cores, not anti-aliased edges
    ink = np.clip((block - bg) / (fg - bg), 0, 1)
    labs = [l for l in ocr.read_labels(ink) if l["value"] is not None]
    return [dict(l, x=l["x"] + cols.start) for l in labs]

def _calibrate(cb, rgba, stated_range, n_min):
    labs = _labels_below(rgba, cb)
    x0 = cb.geometry["x0"] if not cb.geometry["vertical"] else rgba.shape[0] - 1 - cb.geometry["x1"]
    ticks = sorted(({"px": l["x"] - x0, "value": l["value"], "text": l["text"], "engine": l["engine"]} for l in labs),
                   key=lambda t: t["px"])
    ticks = [t for t in ticks if -12 <= t["px"] <= cb.n + 11]
    marks = _tick_marks(rgba, cb)
    for t in ticks:                              # a label sits under its tick mark: snap to it when one is close
        near = [m for m in marks if abs(m - t["px"]) <= 6]
        t["label_px"] = t["px"]
        if near: t["px"] = min(near, key=lambda m: abs(m - t["px"])); t["tick_mark"] = True
    cb.ticks = ticks
    if len(ticks) < n_min or not np.all(np.diff([t["value"] for t in ticks]) > 0):
        if not stated_range:
            raise RuntimeError(f"colorbar: OCR read {[t['text'] for t in ticks]} and no stated range exists")
        lo, hi = stated_range
        cb.scale, cb.fit = "stated-range", {"a": lo, "b": (hi - lo) / (cb.n - 1)}
        cb.notes.append(f"OCR read {[t['text'] for t in ticks]}: too few increasing labels; the SVS text's range {lo}–{hi} "
                        "is used, linear between the strip ends.")
        return
    px, v = np.array([t["px"] for t in ticks]), np.array([t["value"] for t in ticks])
    marked = np.array([bool(t.get("tick_mark")) for t in ticks])
    tol = np.where(marked, TOL_TICK_PX, TOL_LABEL_PX)
    fits = {}
    for name, y in (("linear", v), ("log", np.log10(v) if np.all(v > 0) else None)):
        if y is None: continue
        b, a = np.polyfit(px, y, 1, w=1 / tol)          # weighted: tick-mark positions dominate label centres
        resid = (y - (a + b * px)) / b
        fits[name] = {"a": float(a), "b": float(b), "fit": "weighted 1/tolerance",
                      "max_resid_px": float(np.abs(resid).max()), "resid_px": [round(float(r), 2) for r in resid]}
        fits[name]["ok"] = bool(np.all(np.abs(resid) <= tol))
    ok = [k for k in ("linear", "log") if k in fits and fits[k]["ok"]]
    if len(px) == 2:          # two labels can't tell linear from log: geometric labels with ≥2 decades → log
        ok = ["log"] if _geometric(v) and v[-1] / v[0] >= 100 else ["linear"]
        cb.notes.append("Only two labels: scale chosen from the label values (≥ 2 decades → log), not from spacing.")
    cb.scale = ok[0] if ok else "piecewise"
    if cb.scale == "piecewise":
        cb.fit = {"segments": len(px) - 1, "segment_interp": "log" if _geometric(v) else "linear", "rejected": fits}
    else:
        cb.fit = fits[cb.scale]
    if (~marked).any() and len(marks):
        cb.notes.append(f"{int((~marked).sum())} label(s) not on a tick mark ({', '.join(t['text'] for t in ticks if not t.get('tick_mark'))}): "
                        f"label-centre position, ±{TOL_LABEL_PX:.0f} px.")
    if stated_range:
        lo, hi = cb.value_at(np.array([0.0, cb.n - 1.0]))
        cb.fit["stated_range"] = list(stated_range)
        cb.fit["strip_ends"] = [float(lo), float(hi)]

def _tick_marks(rgba, cb):
    """Tick marks drawn inside the strip's edge rows (narrow spikes against the strip colour), in strip px."""
    g = cb.geometry
    img = rgba[..., :3].astype(float)
    if g["vertical"]: img = img[::-1].transpose(1, 0, 2)
    top, bot = g["band"]
    inner_lo, inner_hi = top + (bot - top) // 5, bot - (bot - top) // 5
    x0 = g["x0"] if not g["vertical"] else rgba.shape[0] - 1 - g["x1"]
    marks = []
    for r in list(range(top, inner_lo)) + list(range(inner_hi + 1, bot + 1)):
        tk, _ = T.find_ticks(img[r, x0:x0 + cb.n])
        marks += tk
    marks = sorted(marks)
    groups = []
    for m in marks:
        if groups and m - groups[-1][-1] <= 1.5: groups[-1].append(m)
        else: groups.append([m])
    rows = list(range(top, inner_lo)) + list(range(inner_hi + 1, bot + 1))
    band = img[rows, x0:x0 + cb.n]
    out = []
    for g_ in groups:
        if len(g_) < 2: continue
        c = int(round(np.mean(g_)))                  # contrast-weighted centroid of the mark's columns
        lo, hi = max(0, c - 4), min(cb.n, c + 5)
        bg = np.median(band[:, max(0, c - 8):min(cb.n, c + 9)], axis=1, keepdims=True)
        contrast = np.abs(band[:, lo:hi] - bg).sum(-1).sum(0)
        w = np.clip(contrast - contrast.max() / 2, 0, None)
        out.append(float((np.arange(lo, hi) * w).sum() / w.sum()) if w.sum() > 0 else float(np.mean(g_)))
    return out

def _geometric(v):
    return len(v) >= 2 and np.all(v > 0) and np.ptp(np.diff(np.log10(v))) < 0.02

def lab_curve(cb):
    return colour.rgb_to_lab(cb.rgb)
