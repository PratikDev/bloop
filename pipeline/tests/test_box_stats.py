"""Box statistics, browser vs numpy (the CV/ML gate's c1_boxstats.py, promoted to a test; docs/cvml/BUILD.md).
numpy computes n, % no data, P10/P50/P90 and the 16-bin histogram for every named box (src/lib/cv/boxes.json) in every
frame of live SST, the latest rain, the 48-frame rain sequence and SVS 3912's SST, from the shipped files only; the
browser's function (src/lib/cv/box-stats.ts, run by scripts/cv/box-stats.ts) must give the same numbers within rounding.
Run: cd pipeline && python -m unittest tests.test_box_stats"""
import gzip
import json
import math
import shutil
import subprocess
import unittest
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parents[2]
PUB = REPO / "public" / "data"
BOXES = json.loads((REPO / "src" / "lib" / "cv" / "boxes.json").read_text(encoding="utf8"))["boxes"]
MAPPING = {v["id"]: v for v in json.loads((REPO / "public" / "mapping.json").read_text(encoding="utf8"))["voices"]}
TOL = 1e-6


def rule_axis(voice):
    i = MAPPING[voice]["mapping"]["input"]
    return i["min"], i["max"], i["scale"] == "log"


def cells(H, W, bounds, box):
    gw, gs, ge, gn = bounds
    w, s, e, n = box
    lat = gn - (np.arange(H) + 0.5) * (gn - gs) / H
    lon = gw + (np.arange(W) + 0.5) * (ge - gw) / W
    return np.nonzero((lat >= s) & (lat <= n))[0], np.nonzero((lon >= w) & (lon <= e))[0]


def stats(sub, vmin, vmax, log):
    n = sub.size
    v = np.sort(sub[np.isfinite(sub)])
    d = {"n": int(n), "nodata_pct": 100 * (1 - v.size / n) if n else None}
    if v.size == 0:
        return d | {"p10": None, "p50": None, "p90": None, "hist": None}
    p10, p50, p90 = np.percentile(v, [10, 50, 90])
    x = np.log10(np.maximum(v, vmin)) if log else v
    lo, hi = (math.log10(vmin), math.log10(vmax)) if log else (vmin, vmax)
    h, _ = np.histogram(np.clip(x, lo, hi), bins=16, range=(lo, hi))
    return d | {"p10": float(p10), "p50": float(p50), "p90": float(p90), "hist": h.tolist()}


def live_sst():
    m = json.loads((PUB / "latest/sst.json").read_text()); g = m["grid"]
    c = np.fromfile(PUB / "latest/sst.bin", "<u2").reshape(g["height"], g["width"])
    return [np.where(c == g["nodata"], np.nan, c / g["scale"] + g["offset"])], rule_axis("ocean")


def rain_decode_u16(c):
    mm = 10 ** ((c.astype(float) - 1) / 20000 - 1)
    mm[c == 0] = 0.0
    mm[c == 65535] = np.nan
    return mm


def rain_latest():
    m = json.loads((PUB / "latest/rain.json").read_text()); g = m["grid"]
    c = np.fromfile(PUB / "latest/rain.bin", "<u2").reshape(g["height"], g["width"])
    return [rain_decode_u16(c)], rule_axis("rain")


def rain_sequence():
    idx = json.loads((PUB / "sequence/index.json").read_text())
    W, H = idx["grid"]["width"], idx["grid"]["height"]
    out = []
    for f in idx["frames"]:
        c = np.frombuffer(gzip.decompress((PUB / "sequence" / f["grid"]).read_bytes()), np.uint8).reshape(H, W).astype(float)
        base = np.where(c >= 128, 128, 1)
        mm = 10 ** (-1 + (c - base) / 126 * math.log10(500))
        mm[c == 0] = 0.0
        mm[c == 255] = np.nan
        out.append(mm)
    return out, rule_axis("rain")


def sst_3912():
    m = json.loads((PUB / "official/currents_3912/manifest.json").read_text(encoding="utf8"))
    L = next(l for l in m["layers"] if l["id"] == "sst")
    W, H = L["grid"]["width"], L["grid"]["height"]
    steps = []
    for ch in L["chunks"]:
        a = np.frombuffer(gzip.decompress((PUB / "official/currents_3912" / ch["file"]).read_bytes()), "<u2")
        steps += list(a.reshape(-1, H, W))
    out = []
    for c in steps:
        v = c * L["scale"] + L["offset"]
        out.append(np.where(c == 65535, np.nan, np.where(c == 65534, L["below_range_bound"], v)))
    lo, hi = L["value_range"]
    return out, (lo, hi, False)


RECORDS = {"live_sst_5101": live_sst, "rain_latest_4285": rain_latest, "rain_sequence_4285": rain_sequence, "currents_3912_sst": sst_3912}


class BoxStatsMatchBrowser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bun = shutil.which("bun")
        if bun is None:
            raise unittest.SkipTest("bun is not on PATH")
        run = subprocess.run([bun, "scripts/cv/box-stats.ts"], cwd=REPO, capture_output=True, check=True)
        cls.browser = json.loads(run.stdout)

    def test_every_box_every_frame(self):
        compared = 0
        for rid, load in RECORDS.items():
            frames, (vmin, vmax, log) = load()
            got = self.browser[rid]
            self.assertEqual(len(got["frames"]), len(frames), rid)
            self.assertEqual((got["axis"]["min"], got["axis"]["max"], got["axis"]["log"]), (vmin, vmax, log), rid)
            for fi, v in enumerate(frames):
                H, W = v.shape
                for b in BOXES:
                    r, c = cells(H, W, (-180, -90, 180, 90), b["bounds"])
                    want = stats(v[np.ix_(r, c)], vmin, vmax, log)
                    have = got["frames"][fi]["boxes"][b["id"]]
                    where = f"{rid} frame {fi} {b['name']}"
                    self.assertEqual(have["n"], want["n"], where)
                    self.assertEqual(have["hist"], want["hist"], where)
                    for k in ("nodata_pct", "p10", "p50", "p90"):
                        if want[k] is None:
                            self.assertIsNone(have[k], where)
                        else:
                            self.assertAlmostEqual(have[k], want[k], delta=TOL * max(1, abs(want[k])), msg=f"{where} {k}")
                    compared += 1
        print(f"\nbox stats: {compared} box-frames match (browser vs numpy)")
        self.assertGreater(compared, 500)


if __name__ == "__main__":
    unittest.main()
