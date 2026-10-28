import unittest
import numpy as np
from svs import export, segment, validate

class Export(unittest.TestCase):
    def test_quantise_roundtrip(self):
        v = np.array([[0.4, 3.0, np.nan], [409.6, 50.0, 1.0]])
        for enc in ("linear", "log10"):
            q, s, o = export.quantise(v, enc)
            back = export.dequantise(q, s, o, enc)
            self.assertTrue(np.isnan(back[0, 2]) and q[0, 2] == export.NODATA)
            np.testing.assert_allclose(back[np.isfinite(v)], v[np.isfinite(v)], rtol=1e-4 if enc == "log10" else 0, atol=0 if enc == "log10" else 0.01)

    def test_quantise_step(self):
        v = np.linspace(0, 30, 1000)
        q, scale, off = export.quantise(v, step=0.01)
        self.assertAlmostEqual(scale, 0.01)
        self.assertLessEqual(np.abs(export.dequantise(q, scale, off) - v).max(), 0.005 + 1e-9)

    def test_block_and_time_mean(self):
        c = np.arange(16, dtype=float).reshape(1, 4, 4); c[0, 0, 0] = np.nan
        b = export.block_mean(c, 2)
        self.assertAlmostEqual(b[0, 0, 0], (1 + 4 + 5) / 3)
        self.assertEqual(export.time_mean(np.ones((5, 2, 2)), 2).shape, (2, 2, 2))

    def test_fit_picks_first_option_under_budget(self):
        opt, tried = export.fit(lambda o: o * 10_000_000, [5, 3, 2, 1])
        self.assertEqual(opt, 2); self.assertEqual(len(tried), 3)

class Validate(unittest.TestCase):
    def test_stats(self):
        a = np.arange(20.0); b = a * 2 + 1
        self.assertAlmostEqual(validate.spearman(a, b)[0], 1.0)
        e = validate.errors(b, a)
        self.assertEqual(e["n"], 20); self.assertGreater(e["bias"], 0)
        self.assertEqual(validate.angle_diff(350, 10), 20)
        self.assertEqual(validate.angle_diff(170, 10, axial=True), 20)
        self.assertEqual(validate.sign_agreement([1, -1, 2], [3, -2, -1])[0], 2 / 3)
        self.assertLess(validate.distribution(a, a)["ks"], 1e-9)

class Segment(unittest.TestCase):
    def test_hue_classes_and_confusion(self):
        key = {"sea_salt": (40, 90, 230), "dust": (230, 60, 200), "smoke": (240, 120, 30), "sulfate": (60, 200, 60)}
        cent = segment.centroids_from_key(key)
        img = np.array([[key["dust"], key["smoke"], (128, 128, 128)]], np.uint8)
        cls, chroma = segment.classify(img, cent)
        names = list(cent)
        self.assertEqual([names[c] if c >= 0 else None for c in cls[0]], ["dust", "smoke", None])
        conf = segment.confusion(cls, [{"x": 0, "y": 0, "class": "dust"}, {"x": 1, "y": 0, "class": "smoke"}], names)
        self.assertEqual(conf["recall"]["dust"], 1.0)

if __name__ == "__main__":
    unittest.main()
