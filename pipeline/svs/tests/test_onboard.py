"""Offline tests of the onboarding and related-dataset logic (no network)."""
import datetime as dt
import unittest
import numpy as np
from svs import focus, gibs
from svs.onboard import record, sources, stages
from svs.onboard.diff import ids

U = dt.timezone.utc

class Dates(unittest.TestCase):
    def test_date_lines(self):
        d = stages.parse_dates("Jan 14, 2020\n2021-03-04\n15 Feb 2016\nMarch 2019\n")
        self.assertEqual([d[i].date() for i in (1, 2, 3, 4)], [dt.date(2020, 1, 14), dt.date(2021, 3, 4), dt.date(2016, 2, 15), dt.date(2019, 3, 1)])

    def test_out_of_order_date_is_interpolated(self):
        out, fixed = stages.monotonic([dt.datetime(2026, 10, 28, 20, tzinfo=U), dt.datetime(2026, 10, 1, tzinfo=U), dt.datetime(2026, 11, 1, 8, tzinfo=U)])
        self.assertEqual(fixed, 1)
        self.assertEqual(out[1], dt.datetime(2026, 10, 30, 14, tzinfo=U))

    def test_us_dataset_date_range(self):
        self.assertEqual(stages._loose("9/1/2011"), dt.datetime(2011, 9, 1, tzinfo=U))
        self.assertEqual(stages._loose("8/11/2014").date(), dt.date(2014, 8, 11))

class Routing(unittest.TestCase):
    def test_model_badge_words(self):
        badge = lambda title: record.badge({"title": title, "keywords": [], "datasets": [], "description": ""})
        self.assertEqual(badge("World Avoided Ozone"), "model")
        self.assertEqual(badge("What Would have Happened to the Ozone Layer if CFCs had not been Regulated?"), "model")
        self.assertEqual(badge("Accumulated Precipitation from the IMERG Global Precipitation Data"), "observation")

    def test_sources_by_words(self):
        name = lambda w: (sources.lookup(w) or ("none",))[0]
        self.assertIn("LIS", name("Global Lightning Flash Rate (TRMM Tropical Rainfall Measuring Mission)"))
        self.assertIn("IMERG", name("IMERG Global Precipitation Rates"))
        self.assertIn("MUR SST", name("Gulf Stream Sea Surface Currents and Temperatures"))
        self.assertNotIn("sea-ice", name("ECCO2 High Resolution Ocean and Sea Ice Model"))
        self.assertIn("aerosol index", name("OMPS aerosol index").lower())

    def test_focus_title_first(self):
        rec = lambda title, kw=(): {"title": title, "keywords": list(kw), "datasets": []}
        self.assertEqual(focus.focus(rec("Global Lightning Accumulation", ["electric field"])), "disasters")
        self.assertEqual(focus.focus(rec("Global Temperature Anomalies from 1880 to 2023", ["sea level"])), "other")
        self.assertEqual(focus.official(rec("Global Mean Sea Level 1993-2025", ["ocean"])), "3912")

    def test_pasted_ids_skip_years(self):
        self.assertEqual(ids("https://svs.gsfc.nasa.gov/5650/ and 4993 (2021) 2023-11-16"), [4993, 5650])

class Gibs(unittest.TestCase):
    XML = (b'<ColorMaps><ColorMap title="SST" units="C"><Entries>'
           b'<ColorMapEntry rgb="0,0,255" transparent="false" value="[0.0,1.0)"/>'
           b'<ColorMapEntry rgb="255,0,0" transparent="false" value="[30.0,+INF)"/>'
           b'<ColorMapEntry rgb="0,0,0" transparent="true" value="[-INF,-1)"/></Entries></ColorMap></ColorMaps>')

    def test_colormap_values(self):
        cm = gibs.parse_colormap(self.XML)
        self.assertEqual(cm["values"], {(0, 0, 255): 0.5, (255, 0, 0): 30.0})
        self.assertEqual(cm["units"], "C")

    def test_regrid_uneven_cells(self):
        v = np.full((640, 1280), 2.0, np.float32); v[:320] = np.nan
        g = gibs.regrid(v, 1.0)
        self.assertEqual(g.shape, (180, 360))
        self.assertTrue(np.isnan(g[0, 0]) and abs(g[-1, -1] - 2.0) < 1e-6)

if __name__ == "__main__":
    unittest.main()
