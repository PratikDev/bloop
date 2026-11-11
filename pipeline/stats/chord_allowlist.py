"""Which records the value chord may play, from the lightness profile of each record's own colour bar
(public/data/meta/chord_allowlist.json; CV/ML build, piece B3, docs/cvml/BUILD.md).

The chord sounds values Bloop recovered by inverting a colour bar. Check 6 (docs/cvml/GO_NO_GO.md) found that value
modes survive any colour map, but a rainbow bar with a dark low end loses its low tail under compression. So, per record:
  - "sequential" (CIELAB L* rises or falls along the bar) or "diverging" (one turn, near the middle): the full chord;
  - the 3912 SVS bar (the bar Check 6 tested): the chord;
  - a rainbow bar whose low end is dark (jet-like): the chord with modes only (no P10 claims);
  - any other bar: no chord.
Colours: the live SST bar (pipeline/inputs/colorbars/sst_colorbar.png, strip from pipeline/lut_params.json) and each
official layer's `display.colours` (sampled along its SVS colour bar by the pipeline). Only records whose first voice has
a frequency rule are listed (the chord is pitch). Nothing here is typed by hand but the class thresholds below.

Run from the repo root: python pipeline/stats/chord_allowlist.py"""
import json
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, r"D:\Jukebox\tools\pylib")
OUT = REPO / "public" / "data" / "meta" / "chord_allowlist.json"
TESTED_BAR = "currents_3912"     # the bar Check 6 inverted (GO)
MONOTONIC_RHO = 0.95             # |Spearman| of L* along the bar for "sequential" (design choice)
HALF_RHO = 0.9                   # each half of a diverging bar (design choice)
TURN_ZONE = (0.25, 0.75)         # where a diverging bar's turn may sit (design choice)
DARK_END = 0.25                  # a low end in the darkest quarter of the bar's L* range is "dark" (design choice)
END_SHARE = 0.05                 # the share of the bar read as its low end


def lightness(rgb):
    """sRGB 0..255 (N x 3) -> CIELAB L* (D65)."""
    c = np.asarray(rgb, float) / 255
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    y = lin @ np.array([0.2126729, 0.7151522, 0.0721750])
    f = np.where(y > (6 / 29) ** 3, np.cbrt(y), y / (3 * (6 / 29) ** 2) + 4 / 29)
    return 116 * f - 16


def spearman(a):
    if len(a) < 3 or np.ptp(a) == 0:
        return 0.0
    r = np.argsort(np.argsort(a)).astype(float)
    x = np.arange(len(a), dtype=float)
    return float(np.corrcoef(r, x)[0, 1])


def classify(L):
    L = np.asarray(L, float)
    rho = spearman(L)
    if abs(rho) >= MONOTONIC_RHO:
        return "sequential", rho
    n = len(L)
    for turn in (int(np.argmax(L)), int(np.argmin(L))):
        if TURN_ZONE[0] * n <= turn <= TURN_ZONE[1] * n:
            a, b = spearman(L[: turn + 1]), spearman(L[turn:])
            if abs(a) >= HALF_RHO and abs(b) >= HALF_RHO and np.sign(a) != np.sign(b):
                return "diverging", rho
    k = max(1, int(round(END_SHARE * n)))
    low = L[:k].mean()
    dark = low <= L.min() + DARK_END * np.ptp(L)
    return ("rainbow, dark low end" if dark else "rainbow"), rho


def chord_for(cls, record):
    if cls in ("sequential", "diverging"):
        return "full"
    if record == TESTED_BAR:
        return "modes-only" if cls == "rainbow, dark low end" else "full"
    return "modes-only" if cls == "rainbow, dark low end" else "none"


def live_sst_colours():
    import cv2
    P = json.loads((REPO / "pipeline" / "lut_params.json").read_text())["sst"]
    img = cv2.imread(str(REPO / "pipeline" / P["colorbar_file"]), cv2.IMREAD_COLOR)[..., ::-1]
    assert P["orientation"] == "horizontal"
    return img[int(P["across"]), int(P["start"]):int(P["end"])], "pipeline/inputs/colorbars/sst_colorbar.png"


def pitch_voices():
    out = set()
    for f in ("mapping.json", "mapping-official.json"):
        for v in json.loads((REPO / "public" / f).read_text(encoding="utf8"))["voices"]:
            m = v.get("mapping") or {}
            if m.get("kind") == "continuous" and m["output"]["param"] == "frequency":
                out.add(v["id"])
    return out


def build():
    pitch = pitch_voices()
    rows = []
    rgb, src = live_sst_colours()
    cls, rho = classify(lightness(rgb))
    rows.append({"record": "ocean", "voice": "ocean", "colours_from": src, "class": cls, "rho": round(rho, 3), "chord": chord_for(cls, "ocean")})
    for f in sorted((REPO / "public" / "data" / "official").glob("*/manifest.json")):
        m = json.loads(f.read_text(encoding="utf8"))
        layers = {l["id"]: l for l in m["layers"]}
        seen = set()
        for opt in m["play"]:
            ch = opt["channels"][0]
            layer = layers.get(ch["layers"][0])
            if ch["combine"] != "value" or ch["voice"] not in pitch or not layer or not layer.get("display") or layer["id"] in seen:
                continue
            seen.add(layer["id"])
            cols = [[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in layer["display"]["colours"]]
            cls, rho = classify(lightness(cols))
            rows.append({"record": m["record"], "layer": layer["id"], "voice": ch["voice"],
                         "colours_from": f"public/data/official/{m['record']}/manifest.json layers.{layer['id']}.display.colours",
                         "class": cls, "rho": round(rho, 3), "chord": chord_for(cls, m["record"])})
    return {"generated_by": "pipeline/stats/chord_allowlist.py", "tested_bar": TESTED_BAR, "records": rows}


def main():
    doc = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=1) + "\n", encoding="utf8")
    for r in doc["records"]:
        print(f"{r['record']:16s} {r.get('layer', ''):22s} {r['class']:24s} rho {r['rho']:+.2f}  chord {r['chord']}")


if __name__ == "__main__":
    main()
