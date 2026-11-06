"""Offline tests of svs/records/common.py (no network)."""
import datetime as dt
import unittest
import cftime
import numpy as np
from svs.records import common

UNITS = "days since 1-1-1 00:00:0.0"                    # the GrADS OPeNDAP axis of GEOS-FP and GEOS-CF v2


class Axis:
    """A stand-in for an OPeNDAP time variable: values, units and calendar."""
    def __init__(self, hours):
        self.units, self.calendar = UNITS, "standard"
        start = cftime.DatetimeGregorian(2026, 10, 26, 0, 30)
        self.values = np.array([cftime.date2num(start + dt.timedelta(hours=h), UNITS, "standard") for h in hours])

    def __getitem__(self, k):
        return self.values[k]


class HourIndex(unittest.TestCase):
    def test_finds_the_frames_own_hour_not_two_days_off(self):
        # 6 Nov 2026: date2num on a Python datetime put 28 Oct frames on 26 Oct model hours
        i, got = common.hour_index(Axis(range(24 * 5)), dt.datetime(2026, 10, 28, 22, 30))
        self.assertEqual(got, dt.datetime(2026, 10, 28, 22, 30))
        self.assertEqual(i, 2 * 24 + 22)

    def test_nearest_hour_when_between(self):
        _, got = common.hour_index(Axis(range(0, 24 * 5, 3)), dt.datetime(2026, 10, 28, 23, 50))
        self.assertEqual(got, dt.datetime(2026, 10, 29, 0, 30))


if __name__ == "__main__":
    unittest.main()
