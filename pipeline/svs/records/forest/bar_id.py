"""Which of 4950's three colorbars (0–40, 0–50, 0–75 m; the page's GEDI_colorbar_0to*_01.tif full-frame overlays) is
burned into the decoded stills? The three share one colour ramp, so colour cannot tell them apart, and the overlays sit
at full size elsewhere in the frame (the stills draw the bar at half size), so a pixel difference is meaningless (tried
first: 0–40 m has no alpha and 0–50/0–75 m differ by ~132/255 everywhere). The test is the scale itself: each overlay
and each still's own bar are read by svs/colorbar.py; the overlay whose labels and value span (the strip's full length
in metres) match the still's own read is the bar used. Writes data_raw/4950/bar_id.json.
Usage (from pipeline/): python -m svs.records.forest.bar_id"""
import json
import numpy as np
from core.log import say
from svs import colorbar, frames
from svs.config import raw_dir
from svs.fetch import Fetcher
from . import BASE, SID, STILLS
from .decode import bar_region

ROOT = raw_dir(SID)
BARS = {"0–40 m": "GEDI_colorbar_0to40_01.tif", "0–50 m": "GEDI_colorbar_0to50_01.tif", "0–75 m": "GEDI_colorbar_0to75_01.tif"}

def composite(rgba):
    a = rgba.astype(np.float64)
    return np.concatenate([(a[..., :3] * a[..., 3:4] / 255).round(), np.full(a.shape[:2] + (1,), 255.0)], -1).astype(np.uint8)

def read(img):
    s = colorbar.read(img).summary()
    return {"ticks": [t["text"] for t in s["ticks"]], "span_m": float(s["value_range"][1] - s["value_range"][0]),
            "px_per_m": float(s.get("px_per_unit") or 0)}

def main():
    fetch = Fetcher(ROOT / "manifest.jsonl", tries=20)
    stills = {s: read(bar_region(frames.read_rgba(ROOT / "assets" / s))) for s in STILLS}
    bars = {}
    for name, fn in BARS.items():
        p = ROOT / "assets" / fn; fetch.get(BASE + fn, p, expect_bytes=60_000_000)
        rgba = frames.read_rgba(p)
        for img in (composite(rgba), bar_region(composite(rgba))):         # the overlay's bar is in the frame or its lower left
            try: bars[name] = {"file": fn, **read(img)}; break
            except RuntimeError as e: bars[name] = {"file": fn, "error": str(e)[:120]}
    span = float(np.median([v["span_m"] for v in stills.values()]))
    diff = {k: abs(v["span_m"] - span) for k, v in bars.items() if "span_m" in v}
    used = min(diff, key=diff.get)
    res = {"stills": stills, "bars": bars, "still_span_m": span, "span_difference_m": diff, "used": used,
           "labels_match": set(bars[used]["ticks"]) >= {t for v in stills.values() for t in v["ticks"]}}
    (ROOT / "bar_id.json").write_text(json.dumps(res, indent=1, default=float), encoding="utf-8")
    say(f"4950: stills span {span:.1f} m; overlays {[(k, round(v.get('span_m', 0), 1)) for k, v in bars.items()]} → {used}")

if __name__ == "__main__":
    main()
