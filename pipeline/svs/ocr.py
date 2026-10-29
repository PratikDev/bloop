"""OCR for colorbar labels (digits, '.', '-', superscript exponents as in 10⁻³). Engine: Tesseract via pytesseract when
its binary is installed (PATH or TESSERACT_CMD); otherwise a built-in glyph matcher: text components (Otsu + connected
components) matched against digits rendered from system sans-serif fonts. Every result says which engine read it."""
import os, re, shutil
from functools import lru_cache
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT_DIRS = [Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts", Path("/usr/share/fonts"), Path("/Library/Fonts")]
FONT_NAMES = ("arial.ttf", "arialbd.ttf", "Arial.ttf", "DejaVuSans.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Regular.ttf",
              "LiberationSans-Bold.ttf", "verdana.ttf", "tahoma.ttf", "segoeui.ttf", "calibri.ttf", "Helvetica.ttc")
DIGITS = "0123456789"

def tesseract_cmd():
    return os.environ.get("TESSERACT_CMD") or shutil.which("tesseract")

def engine():
    return "tesseract" if tesseract_cmd() else "glyph"

@lru_cache(maxsize=1)
def _fonts():
    found = {str(d / n).lower(): str(d / n) for d in FONT_DIRS for n in FONT_NAMES if (d / n).exists()}
    if not found: raise RuntimeError("no sans-serif font found for glyph OCR")
    return tuple(found.values())

def _ink_bbox(a, thr=0.5):
    ys, xs = np.nonzero(a > thr)
    return (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1) if len(ys) else None

@lru_cache(maxsize=None)
def _size_for(font, h):
    """Font size whose digit '0' has an ink height of h px (anti-aliased, threshold 0.5)."""
    best = None
    for size in range(4, 120):
        im = Image.new("L", (4 * size, 4 * size)); ImageDraw.Draw(im).text((size, size), "0", fill=255, font=ImageFont.truetype(font, size))
        b = _ink_bbox(np.asarray(im) / 255.0)
        if b and (best is None or abs((b[1] - b[0]) - h) < abs(best[1] - h)): best = (size, b[1] - b[0])
        if b and b[1] - b[0] > h + 2: break
    return best[0]

@lru_cache(maxsize=None)
def _templates(h):
    """Anti-aliased digit glyphs whose ink height matches h, for every font (rendering at the source's own size keeps
    the same anti-aliasing, which is what separates 3 from 8 at 13 px)."""
    out = []
    for font in _fonts():
        f = ImageFont.truetype(font, _size_for(font, h))
        for ch in DIGITS:
            im = Image.new("L", (6 * h + 8, 4 * h + 8)); ImageDraw.Draw(im).text((h, h), ch, fill=255, font=f)
            a = np.asarray(im, np.float32) / 255
            box = _ink_bbox(a)
            if box is None: continue                     # too small to render at this height
            y0, y1, x0, x1 = box
            out.append((ch, a[y0:y1, x0:x1]))
    return out

def _match_digit(patch):
    """Best digit for a normalised ink patch (text 1, background 0) and the margin to the best other digit."""
    h, w = patch.shape
    scores = {}
    for ch, t in _templates(h):
        d = float(np.abs(cv2.resize(t, (w, h), interpolation=cv2.INTER_AREA) - patch).mean())
        d += 0.05 * max(0, abs(w - t.shape[1]) - 1)          # ±1 px width is quantisation, not shape
        scores[ch] = min(scores.get(ch, 9.0), d)
    ranked = sorted(scores.items(), key=lambda kv: kv[1])
    if len(ranked) < 2: return "?", 0.0                # glyph too small for any template
    return ranked[0][0], ranked[1][1] - ranked[0][1]

def text_mask(gray):
    """Binary text mask; text = the minority Otsu class (works for light-on-dark and dark-on-light labels)."""
    _, m = cv2.threshold(gray.astype(np.uint8), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    m = m > 0
    return m if m.mean() < 0.5 else ~m

def components(mask, min_area=2):
    """Connected components; those touching the region's left or right edge are clipped text or frame lines."""
    W = mask.shape[1]
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    return [{"x0": int(st[i, 0]), "y0": int(st[i, 1]), "x1": int(st[i, 0] + st[i, 2]), "y1": int(st[i, 1] + st[i, 3]),
             "area": int(st[i, 4]), "mask": lab[st[i, 1]:st[i, 1] + st[i, 3], st[i, 0]:st[i, 0] + st[i, 2]] == i}
            for i in range(1, n) if st[i, 4] >= min_area and st[i, 0] > 0 and st[i, 0] + st[i, 2] < W]

def ink_patch(ink, c):
    """The component's own anti-aliased pixels (its mask grown by 1 px), from the normalised ink image."""
    m = cv2.dilate(c["mask"].astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    return ink[c["y0"]:c["y1"], c["x0"]:c["x1"]] * m

def group_labels(comps, gap=0.6):
    """Components → labels (left-to-right runs whose gaps are small relative to the digit height)."""
    if not comps: return []
    comps = sorted(comps, key=lambda c: c["x0"])
    h = np.percentile([c["y1"] - c["y0"] for c in comps], 75)          # digit height (dots and minus signs are small)
    groups = [[comps[0]]]
    for c in comps[1:]:
        if c["x0"] - max(g["x1"] for g in groups[-1]) <= gap * h: groups[-1].append(c)
        else: groups.append([c])
    return groups

DIGIT_ASPECT = 0.72                                # Arial-like digit ink width / digit height

def _pieces(c, cuts):
    """A component cut at columns `cuts` (relative), each piece re-split into its connected parts (global coords)."""
    out, w = [], c["x1"] - c["x0"]
    for a, b in zip([0] + cuts, cuts + [w]):
        for p in components(np.pad(c["mask"][:, a:b], ((0, 0), (1, 1))), min_area=1):
            out.append(dict(p, x0=c["x0"] + a + p["x0"] - 1, x1=c["x0"] + a + p["x1"] - 1, y0=c["y0"] + p["y0"], y1=c["y0"] + p["y1"]))
    return out

def _superscript_cut(c, H):
    """A full-height glyph whose trailing columns carry ink only in its top half has a fused superscript ('0' + '⁻').
    The main glyph must stay ≥ 0.55 H wide after the cut, so a '7' keeps its top bar."""
    m = c["mask"]
    if m.shape[0] < 0.8 * H: return [c]
    cols = np.where(m[int(round(0.6 * m.shape[0])):].any(0))[0]
    if not len(cols): return [c]
    cut = int(cols[-1]) + 1
    tail = m[:, cut:]
    top_only = tail.any() and not tail[int(round(0.55 * m.shape[0])):].any()
    return _pieces(c, [cut]) if tail.shape[1] >= 2 and cut >= 0.55 * H and top_only else [c]

def split_touching(group):
    """Anti-aliasing fuses neighbouring glyphs ('00', '32', '0' + a superscript): superscript columns are cut off first,
    then a component wider than ~1.3 digits is cut at its lowest-ink columns; pieces are re-split into connected parts."""
    H = max(c["y1"] - c["y0"] for c in group)
    out = []
    for c in (p for c0 in group for p in _superscript_cut(c0, H)):
        h, w = c["y1"] - c["y0"], c["x1"] - c["x0"]
        k = int(round(w / (DIGIT_ASPECT * h))) if h >= 0.5 * H else 1
        if k < 2:
            out.append(c); continue
        ink = c["mask"].sum(0).astype(float)
        dw, cuts = w / k, []
        for j in range(1, k):
            lo, hi = int(max(1, j * dw - dw / 3)), int(min(w - 1, j * dw + dw / 3))
            if hi >= lo: cuts.append(lo + int(np.argmin(ink[lo:hi + 1])))
        out += _pieces(c, cuts)
    return sorted(out, key=lambda c: c["x0"])

def read_label(group, ink):
    """One label's components → (text, value or None, smallest digit margin). Handles '.', '-', superscripts."""
    group = split_touching(group)
    H = max(c["y1"] - c["y0"] for c in group)
    base = max(c["y1"] for c in group if c["y1"] - c["y0"] >= 0.8 * H)
    main, sup, margin = "", "", 9.0
    for c in sorted(group, key=lambda c: c["x0"]):
        h, w = c["y1"] - c["y0"], c["x1"] - c["x0"]
        superscript = h < 0.8 * H and c["y1"] < base - 0.3 * H and main != ""      # a leading minus is a sign
        on_baseline = c["y1"] >= base - 0.15 * H
        if h <= 0.35 * H and on_baseline and not superscript: ch = "."
        elif h <= 0.35 * H and w >= 2 * h: ch = "-"
        else:
            ch, m = _match_digit(ink_patch(ink, c)); margin = min(margin, m)
        if superscript: sup += ch
        else: main += ch
    text = f"{main}^{sup}" if sup else main
    return text, parse_number(text), margin

def parse_number(text):
    m = re.fullmatch(r"(-?\d+(?:\.\d+)?)(?:\^(-?\d+))?", text)
    if not m: return None
    return float(m.group(1)) ** float(m.group(2)) if m.group(2) else float(m.group(1))

def read_labels(ink):
    """All labels in a normalised ink image (text 1.0, background 0.0) → [{'text', 'value', 'x' (centre col),
    'margin' (glyph-match margin; small = uncertain), 'engine'}]."""
    if engine() == "tesseract":
        return _tesseract_labels(np.clip(255 - ink * 255, 0, 255).astype(np.uint8))
    out = []
    comps = [c for c in components(ink > 0.5, min_area=1)        # a 1-px dot counts only at full strength
             if c["area"] > 1 or ink[c["y0"], c["x0"]] >= 0.9]
    for g in group_labels(comps):
        text, val, margin = read_label(g, ink)
        g = split_touching(g)
        main = [c for c in g if c["y1"] - c["y0"] >= 0.8 * max(c["y1"] - c["y0"] for c in g)]
        out.append({"text": text, "value": val, "x": float((min(c["x0"] for c in main) + max(c["x1"] for c in main)) / 2),
                    "margin": round(margin, 4), "engine": "glyph"})
    return out

def _tesseract_labels(gray_region):
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd()
    big = cv2.resize(gray_region, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    d = pytesseract.image_to_data(big, config="--psm 11 -c tessedit_char_whitelist=0123456789.-",
                                  output_type=pytesseract.Output.DICT)
    return [{"text": t, "value": parse_number(t), "x": (d["left"][i] + d["width"][i] / 2) / 3, "engine": "tesseract"}
            for i, t in enumerate(d["text"]) if t.strip()]
