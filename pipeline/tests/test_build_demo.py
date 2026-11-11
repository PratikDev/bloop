"""Mentor item 9: both rain sources get one baseline and one recent decade, ending in GPCC's last full June-September.
Run: cd pipeline && python -m unittest tests.test_build_demo"""
import unittest
from build_demo import WIN_A, RAIN, last_full_year, rain_windows


def cell(first, last, stop_month=12):
    months = [f"{y}-{m:02d}" for y in range(first, last + 1) for m in range(1, 13) if y < last or m <= stop_month]
    return {"months": months, "mm_per_day": [1.0] * len(months)}


class RainWindows(unittest.TestCase):
    def test_last_full_year_needs_every_month(self):
        self.assertEqual(last_full_year(cell(1980, 2019), "mm_per_day", RAIN), 2019)
        self.assertEqual(last_full_year(cell(1980, 2020, stop_month=8), "mm_per_day", RAIN), 2019)  # 2020 lacks September

    def test_recent_decade_ends_at_gpcc_end_and_matches_baseline_length(self):
        a, b = rain_windows({"cells": {"X": cell(1891, 2019), "Y": cell(1891, 2019)}})
        self.assertEqual(a, WIN_A)
        self.assertEqual(b[1], 2019)
        self.assertEqual(b[1] - b[0], WIN_A[1] - WIN_A[0])

    def test_shortest_city_decides(self):
        _, b = rain_windows({"cells": {"X": cell(1891, 2020), "Y": cell(1891, 2018)}})
        self.assertEqual(b[1], 2018)


if __name__ == "__main__":
    unittest.main()
