import unittest
import numpy as np
from svs import colour
from svs.colorbar import Colorbar
from svs.invert import Inverter
from svs.tests import synth

def bar(cmap=synth.viridis, n=400, lo=0.0, hi=40.0):
    rgb = cmap(np.arange(n) / (n - 1))
    return Colorbar(rgb=rgb, alpha=np.ones(n), geometry={}, scale="linear", fit={"a": lo, "b": (hi - lo) / (n - 1)})

class Inversion(unittest.TestCase):
    def test_exact_both_methods(self):
        t = np.linspace(0, 1, 300)
        img = synth.field_pixels(synth.viridis, t)[None]
        for m in ("rgb-nearest", "lab-curve"):
            v, _, res, _ = Inverter(bar(), method=m).invert(img, max_dist=12)
            self.assertLess(np.nanmax(np.abs(v[0] - 40 * t)), 0.3, m)

    def test_off_curve_is_nan(self):
        img = np.array([[[255, 0, 255], [0, 0, 0]]], np.uint8)        # magenta and black: not on viridis
        v, _, _, _ = Inverter(bar(), method="lab-curve").invert(img, max_dist=8)
        self.assertTrue(np.isnan(v).all())

    def test_chroma_mode_reads_dimmed_colours(self):
        """Streaks fading over black (3912): colour × k decodes to the same value; k is reported."""
        jet = synth.mpl("jet")
        t = np.linspace(0.14, 0.86, 50)                                       # jet's full-brightness part
        amb = Inverter(bar(jet), mode="chroma").uncertain(tol=5) / 399
        self.assertTrue(amb.size and amb.min() < 0.05 and amb.max() > 0.95 and not ((amb > 0.14) & (amb < 0.86)).any())
        lin = colour.to_linear(jet(t)) * 0.4                                   # dimmed to 40 % in linear light
        img = np.round(colour.from_linear(lin)).astype(np.uint8)[None]
        for m in ("rgb-nearest", "lab-curve"):
            v, _, _, k = Inverter(bar(jet), mode="chroma", method=m).invert(img, max_dist=25)
            self.assertLess(np.nanmax(np.abs(v[0] - 40 * t)), 0.8, m)
            self.assertTrue(np.allclose(k[0], 0.4, atol=0.05))
        v, _, _, _ = Inverter(bar(jet), method="rgb-nearest").invert(img, max_dist=20)
        self.assertGreater(np.isnan(v).mean(), 0.5)                           # exact mode rejects the dimmed pixels

if __name__ == "__main__":
    unittest.main()
