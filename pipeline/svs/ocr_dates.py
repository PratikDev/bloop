"""Burned-in frame dates read by the built-in glyph OCR (used while Tesseract is not installed). A date line is cut
into tokens at gaps wider than WORD_GAP digit heights; a token of small marks is punctuation; every other token is
read both ways and the closer rendering wins: as a number (ocr.read_label) and as a month name (whole-word templates
rendered from the same fonts at the same digit height). Formats: 'Dec 11 2010 18:43', '11 December 2010',
'December 2010', '2010-12-11 18:00'. Every result carries the engine, the text read and the weakest match.
Usage: read_date(ink) with ink = normalised text image (text 1.0, background 0.0)."""
import datetime as dt, re
from functools import lru_cache
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from . import ocr

MONTHS = ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
MONTH_WORDS = {w: i + 1 for i, m in enumerate(MONTHS) for w in (m, m[:3], m.upper(), m[:3].upper())}
TZ_HOURS = {"UTC": 0, "GMT": 0, "EDT": -4, "EST": -5, "CDT": -5, "CST": -6, "MDT": -6, "MST": -7, "PDT": -7, "PST": -8}   # offsets from UTC
WORD_GAP, NUMBER_GAP = 0.3, 0.6                 # token split / digit-run merge, in digit heights (Arial: space ≈ 0.39)
MAX_DISTANCE = 0.5                              # neither reading closer than this → '?' (real reads: ≤ 0.32; a wrong month: 0.70)
PATTERNS = [                                    # (regex over the token string, field order)
    (r"(?P<mon>[A-Za-z]+) (?P<day>\d{1,2}) ?,? (?P<year>\d{4})(?: (?P<hh>\d{1,2}) ?: ?(?P<mm>\d{2}))?", None),
    (r"(?P<day>\d{1,2}) (?P<mon>[A-Za-z]+) ?,? (?P<year>\d{4})(?: (?P<hh>\d{1,2}) ?: ?(?P<mm>\d{2}))?", None),
    (r"(?P<mon>[A-Za-z]+) ?,? (?P<year>\d{4})", None),
    (r"(?P<year>\d{4}) ?- ?(?P<month>\d{2}) ?- ?(?P<day>\d{2})(?: (?P<hh>\d{1,2}) ?: ?(?P<mm>\d{2}))?", None),
]

@lru_cache(maxsize=None)
def _rendered(word, h):
    """The word's ink in every font, sized so a digit is h px tall: [(ink array, height ratio to h)]."""
    out = []
    for font in ocr._fonts():
        f = ImageFont.truetype(font, ocr._size_for(font, h))
        im = Image.new("L", (len(word) * 2 * h + 4 * h, 5 * h)); ImageDraw.Draw(im).text((h, h), word, fill=255, font=f)
        a = np.asarray(im, np.float32) / 255
        y0, y1, x0, x1 = ocr._ink_bbox(a)
        out.append((a[y0:y1, x0:x1], (y1 - y0) / h))
    return out

def word_distance(patch, h, word):
    """Mean |ink − rendering| after resizing to the patch, plus aspect and height penalties (best font)."""
    ph, pw = patch.shape
    best = 9.0
    for t, hr in _rendered(word, h):
        d = float(np.abs(cv2.resize(t, (pw, ph), interpolation=cv2.INTER_AREA) - patch).mean())
        d += 0.5 * abs(np.log((t.shape[1] / t.shape[0]) / (pw / ph))) + 0.5 * abs(hr - ph / h)
        best = min(best, d)
    return best

def _patch(ink, comps):
    y0, y1 = min(c["y0"] for c in comps), max(c["y1"] for c in comps)
    x0, x1 = min(c["x0"] for c in comps), max(c["x1"] for c in comps)
    m = np.zeros((y1 - y0, x1 - x0), bool)
    for c in comps: m[c["y0"] - y0:c["y1"] - y0, c["x0"] - x0:c["x1"] - x0] |= c["mask"]
    return ink[y0:y1, x0:x1] * (cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)

def _punctuation(comps, H):
    if len(comps) == 2 and abs(comps[0]["x0"] - comps[1]["x0"]) < 0.3 * H: return ":"
    c = comps[0]
    return "-" if c["x1"] - c["x0"] >= 2 * (c["y1"] - c["y0"]) else ("," if c["y1"] - c["y0"] > c["x1"] - c["x0"] else ".")

def tokens(ink):
    """[(kind 'num'|'word'|'punct', text, distance, x0, x1)] left to right."""
    comps = [c for c in ocr.components(ink > 0.5, min_area=2)]
    if not comps: return []
    comps.sort(key=lambda c: c["x0"])
    H = int(round(np.percentile([c["y1"] - c["y0"] for c in comps], 75)))
    runs = [[comps[0]]]
    for c in comps[1:]:
        if c["x0"] - max(r["x1"] for r in runs[-1]) > WORD_GAP * H: runs.append([c])
        else: runs[-1].append(c)
    small = lambda c: c["y1"] - c["y0"] <= 0.35 * H
    split = []                                   # '6:00:00' is one run: cut it at marks low in the line (colons, commas)
    top = min(c["y0"] for c in comps if not small(c))   # the line's cap top (marks are measured against the whole line)
    for run in runs:
        sep = lambda c: small(c) and (c["y0"] + c["y1"]) / 2 > top + 0.2 * H        # an i-dot sits at the top and stays
        for c in run:
            if split and split[-1][0] is run and sep(split[-1][1][-1]) == sep(c): split[-1][1].append(c)
            else: split.append((run, [c]))
    split = [g for _, g in split]
    runs = [r for r in split if r]
    out = []
    for run in runs:
        tail = []
        while len(run) > 1 and small(run[-1]) and not all(map(small, run)): tail.insert(0, run.pop())   # '4,' → '4' ','
        x0, x1 = min(c["x0"] for c in run), max(c["x1"] for c in run)
        if all(map(small, run)):
            out.append(("punct", _punctuation(run, H), 0.0, x0, x1)); continue
        patch = _patch(ink, run)
        month = min([*MONTH_WORDS, *TZ_HOURS], key=lambda w: word_distance(patch, H, w))
        dm = word_distance(patch, H, month)
        text, val, _ = ocr.read_label(run, ink)
        dn = word_distance(patch, H, text) if re.fullmatch(r"\d+", text) else 9.0
        if min(dm, dn) > MAX_DISTANCE: out.append(("unknown", "?", min(dm, dn), x0, x1))
        else: out.append(("num", text, dn, x0, x1) if dn <= dm else ("tz" if month in TZ_HOURS else "word", month, dm, x0, x1))
        if tail: out.append(("punct", _punctuation(tail, H), 0.0, tail[0]["x0"], tail[-1]["x1"]))
    merged = [out[0]]                            # '1' '1' with a wide side bearing → '11'
    for t in out[1:]:
        p = merged[-1]
        if t[0] == p[0] == "num" and t[3] - p[4] <= NUMBER_GAP * H and len(p[1]) + len(t[1]) <= 4 and len(p[1]) < 4:   # a year never absorbs the hour
            merged[-1] = ("num", p[1] + t[1], max(p[2], t[2]), p[3], t[4])
        else: merged.append(t)
    return merged

def read_date(ink):
    """→ {'text', 'datetime' (UTC, or None), 'distance' (worst token match), 'engine': 'glyph-date'}."""
    toks = tokens(ink)
    tz = next((t[1] for t in toks if t[0] == "tz"), None)
    text = " ".join(t[1] for t in toks if t[0] != "tz")
    when = None
    for rx, _ in PATTERNS:
        m = re.search(rx, text)
        if not m: continue
        g = m.groupdict()
        month = MONTH_WORDS.get(g["mon"]) if g.get("mon") else int(g["month"])
        if not month: continue
        try:
            when = dt.datetime(int(g["year"]), month, int(g.get("day") or 1), int(g.get("hh") or 0), int(g.get("mm") or 0),
                               tzinfo=dt.timezone.utc) - dt.timedelta(hours=TZ_HOURS.get(tz, 0))
            break
        except ValueError:
            continue
    return {"text": text + (f" {tz}" if tz else ""), "datetime": when, "timezone": tz, "distance": max((t[2] for t in toks), default=None),
            "engine": "glyph-date"}
