"""Known answers for the Then vs Now statistics (mentor item 10).
Run: cd pipeline && python -m unittest stats.tests.test_methods"""
import unittest
import numpy as np
from stats.methods import clear_change, compare, mann_kendall


class DecadeVsDecade(unittest.TestCase):
    def test_clear_shift_is_significant(self):
        rng = np.random.default_rng(1)
        a, b = rng.normal(10, 1, 10), rng.normal(14, 1, 10)
        c = compare(a, b)
        self.assertLess(c.p_welch, 0.001)
        self.assertLess(c.p_mann_whitney, 0.001)
        self.assertTrue(c.diff_ci[0] > 2 and c.diff_ci[1] < 6)
        self.assertTrue(clear_change(c.p_welch, c.p_mann_whitney, c.diff_ci))

    def test_pure_noise_is_not_significant(self):
        rng = np.random.default_rng(2)
        hits = 0
        for _ in range(200):
            a, b = rng.normal(10, 2, 10), rng.normal(10, 2, 10)
            c = compare(a, b, draws=2000)
            hits += clear_change(c.p_welch, c.p_mann_whitney, c.diff_ci)
        self.assertLess(hits / 200, 0.07)            # about the 5% false-positive rate, never much more

    def test_ci_contains_zero_for_identical_windows(self):
        c = compare([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])
        self.assertLessEqual(c.diff_ci[0], 0); self.assertGreaterEqual(c.diff_ci[1], 0)
        self.assertFalse(clear_change(c.p_welch, c.p_mann_whitney, c.diff_ci))

    def test_percent_change(self):
        c = compare([10, 10, 10.0], [9, 9, 9.0001])
        self.assertAlmostEqual(c.pct, -10, places=2)

    def test_fixed_seed_repeats(self):
        a, b = [1, 3, 2, 5, 4], [6, 4, 7, 5, 8]
        self.assertEqual(compare(a, b).diff_ci, compare(a, b).diff_ci)


class TrendTests(unittest.TestCase):
    def test_sen_slope_recovered(self):
        rng = np.random.default_rng(3)
        t = np.arange(1951, 2026, dtype=float)
        x = 0.02 * (t - 1951) + rng.normal(0, 0.1, len(t))
        r = mann_kendall(t, x)
        self.assertAlmostEqual(r.slope, 0.02, delta=0.004)
        self.assertTrue(r.slope_ci[0] < 0.02 < r.slope_ci[1])
        self.assertLess(r.p, 0.001)

    def test_exact_line_with_gap(self):
        t = np.array([0, 1, 2, 3, 10, 11, 12], float)
        r = mann_kendall(t, -3 * t + 5)
        self.assertAlmostEqual(r.slope, -3)

    def test_no_trend_in_noise(self):
        rng = np.random.default_rng(4)
        r = mann_kendall(np.arange(60.0), rng.normal(0, 1, 60))
        self.assertGreater(r.p, 0.05)

    def test_autocorrelation_widens_the_test(self):
        rng = np.random.default_rng(5)
        e = np.zeros(200)
        for i in range(1, 200):
            e[i] = 0.9 * e[i - 1] + rng.normal(0, 1)
        r = mann_kendall(np.arange(200.0), e)
        self.assertGreater(r.variance_factor, 1.5)
        self.assertEqual(r.test, "Mann-Kendall, Hamed-Rao modified")


if __name__ == "__main__":
    unittest.main()
