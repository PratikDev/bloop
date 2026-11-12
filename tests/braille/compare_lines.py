"""The braille explorer redesign must not change any braille output (Pratik, 2026-11-11).

Compares the value and shape lines the protocol test saved (data_raw/_tmp/braille-lines-<browser>[-bn].json, written
by e2e/braille-protocol.e2e.ts) with the lines saved before the redesign (tests/braille/snapshots/), for the same
frames and the same needle: the live voices in each shape, the caret step, review, widths 20 and 40, and the official
records. Not a screen-reader viewer test.

The live frames change when the data is refreshed; the snapshot is only comparable while the frames are the ones it
was taken with (the date and time in its value lines). A refresh shows as a difference in the time and the values.
Usage (repo root): python tests/braille/compare_lines.py [chromium] [bn]"""
import json, os, sys

browser = next((a for a in sys.argv[1:] if a != "bn"), "chromium")
suffix = "-bn" if "bn" in sys.argv[1:] else ""
now_path = os.path.join("data_raw", "_tmp", f"braille-lines-{browser}{suffix}.json")
before_path = os.path.join("tests", "braille", "snapshots", f"lines-before-redesign-{browser}{suffix}.json")
now, before = (json.load(open(p, encoding="utf8")) for p in (now_path, before_path))

def lines(d):
    """Every braille line in a saved file, by where it comes from (the a11y snapshots and dates left out)."""
    out = {}
    def walk(prefix, v):
        if isinstance(v, dict):
            for k, x in v.items():
                if k in ("snapshot", "date", "browser", "liveRegion", "valueLineFocused") or prefix.split("/")[0] in ("map", "shapeLine", "valueLine", "recordCard"):
                    continue
                walk(f"{prefix}/{k}" if prefix else k, x)
        elif isinstance(v, str):
            out[prefix] = v
    walk("", d)
    return out

a, b = lines(before), lines(now)
missing = sorted(set(a) - set(b))
different = sorted(k for k in set(a) & set(b) if a[k] != b[k])
print(f"{len(a)} lines in the snapshot, {len(b)} now; {len(different)} different, {len(missing)} missing")
for k in different:
    print(f"  DIFFERENT {k}\n    before: {a[k]!r}\n    now:    {b[k]!r}")
for k in missing:
    print(f"  MISSING {k}")
sys.exit(1 if different or missing else 0)
