import unittest
import numpy as np
from svs import colorbar
from svs.invert import Inverter
from svs.tests import synth

REPORT = {}          # measured errors, printed at the end (the checkpoint report quotes them)

def roundtrip(img, cmap, values, to_t, err_scale, method):
    """Read the synthetic bar, decode pixels drawn at `values`; errors as fractions of the range."""
    cb = colorbar.read(img)
    pos, _, _ = Inverter(cb, method=method).project_colours(synth.field_pixels(cmap, to_t(values)))
    return np.abs(err_scale(cb.value_at(pos)) - err_scale(values)), cb

def ideal_max(cmap, t):
    """Worst error of an ideal decoder that knows the exact colormap, on the same 8-bit pixels: the floor any decoder
    meets (published colormaps are 256-entry tables, and some neighbours round to the same 8-bit colour)."""
    tg = np.linspace(0, 1, 100001); C = cmap(tg)
    px = synth.field_pixels(cmap, t).astype(float)
    best = np.array([tg[np.argmin(((C - p) ** 2).sum(1))] for p in px])
    return float(np.abs(best - t).max())

class SyntheticColorbars(unittest.TestCase):
    """Synthetic linear, log and diverging bars (published matplotlib colormaps, labels read by OCR) must round-trip
    within 0.5 % of range at the 95th percentile, and every value within max(0.5 %, the ideal decoder's worst case on
    the same 8-bit pixels). Strips of 401 px (the real colorbars' length) and 801 px. All numbers are printed."""

    def check(self, name, labels, cmap, values, to_t, err_scale, rng, expect_scale):
        floor = ideal_max(cmap, to_t(values))
        for length in (401, 801):
            img = synth.colorbar_image(cmap, labels, length=length)
            for method in ("rgb-nearest", "lab-curve"):
                err, cb = roundtrip(img, cmap, values, to_t, err_scale, method)
                self.assertEqual(cb.scale, expect_scale, cb.fit)
                self.assertEqual([t["text"] for t in cb.ticks], [l[1] for l in labels])
                e = err / rng
                REPORT[(name, length, method)] = (float(np.median(e)), float(np.percentile(e, 95)), float(e.max()), floor)
                self.assertLessEqual(np.percentile(e, 95), 0.005, f"{name} {length}px {method}: p95 {np.percentile(e, 95):.4%}")
                self.assertLessEqual(e.max(), max(0.005, floor + 1e-4), f"{name} {length}px {method}: max {e.max():.4%}, floor {floor:.4%}")

    def test_linear(self):
        labels = [(k / 4, f"{v:g}") for k, v in enumerate((0, 10, 20, 30, 40))]
        vals = np.random.default_rng(1).uniform(0, 40, 500)
        self.check("linear", labels, synth.viridis, vals, lambda v: v / 40, lambda v: v, 40, "linear")

    def test_log(self):
        labels = [(k / 5, f"{0.4 * 4 ** k:g}") for k in range(6)]               # 0.4 … 409.6, like 5518 PM2.5
        lo, hi = np.log10(0.4), np.log10(409.6)
        vals = 10 ** np.random.default_rng(2).uniform(lo, hi, 500)
        self.check("log", labels, synth.plasma, vals, lambda v: (np.log10(v) - lo) / (hi - lo), np.log10, hi - lo, "log")

    def test_diverging(self):
        labels = [(k / 4, f"{v:g}") for k, v in enumerate((-4, -2, 0, 2, 4))]
        vals = np.random.default_rng(3).uniform(-4, 4, 500)
        self.check("diverging", labels, synth.rdbu, vals, lambda v: (v + 4) / 8, lambda v: v, 8, "linear")

    @classmethod
    def tearDownClass(cls):
        for (name, length, method), (med, p95, mx, floor) in sorted(REPORT.items()):
            print(f"  {name:9s} {length} px {method:11s}: median {med:.3%}  p95 {p95:.3%}  max {mx:.3%} of range "
                  f"(ideal decoder max {floor:.3%})")

    def test_piecewise_labels_follow_ticks(self):
        """Evenly spaced ticks with irregular labels (like 5518 CO) → piecewise, exact at the ticks."""
        labels = list(zip((0, 0.25, 0.5, 0.75, 1.0), ("40", "100", "130", "200", "500")))
        cb = colorbar.read(synth.colorbar_image(synth.viridis, labels))
        self.assertEqual(cb.scale, "piecewise")
        self.assertEqual([t["text"] for t in cb.ticks], ["40", "100", "130", "200", "500"])
        mid = [t["px"] for t in cb.ticks if t.get("tick_mark")]
        np.testing.assert_allclose(cb.value_at(np.array(mid)), [100, 130, 200], rtol=1e-6)

if __name__ == "__main__":
    unittest.main()
