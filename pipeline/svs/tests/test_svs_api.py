import json, unittest
from svs import choose, svs_api
from svs.config import CACHE

OLD = """<table class='framesIndexTable'><tr><td><b>File size</b></td></tr><tr><td>6 MB</td><td>TIFF Image: 2048x1024
</td><td><a href="/vis/a000000/a003900/a003912/frames/2048x1024_1x1_30p/orig/flat_global_ecco2_2028x1024.23000.tif">x</a></td></tr>
<tr><td>6 MB</td><td>TIFF</td><td><a href="/vis/a000000/a003900/a003912/frames/2048x1024_1x1_30p/orig/flat_global_ecco2_2028x1024.23004.tif">x</a></td></tr>
<tr><td><a href="/css_svs/bootstrap.min.css">css</a></td></tr></table>"""
NEW = """<tbody><tr><td class="col text-nowrap"><a href=AirQuality/> <span></span> AirQuality/ </a><td>Jan 15, 2026<td>128.0 KB
<tr><td class="col text-nowrap"><a href=AirQuality_PM2.5_Layer_2048x1024_0000.png> A </a><td>Jan 15, 2026 2:03 PM<td>2.1 MB
<tr><td class="col text-nowrap"><a href=AirQuality_PM2.5_Layer_2048x1024_0001.png> B </a><td>Jan 15, 2026 1:58 PM<td>2.0\xa0MB"""

class Listing(unittest.TestCase):
    def test_old_table_format(self):
        rows = svs_api.parse_listing(OLD, "https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/frames/2048x1024_1x1_30p/orig/")
        self.assertEqual([r["name"] for r in rows], ["flat_global_ecco2_2028x1024.23000.tif", "flat_global_ecco2_2028x1024.23004.tif"])
        self.assertEqual(rows[0]["bytes"], 6_000_000)

    def test_new_minified_format(self):
        rows = svs_api.parse_listing(NEW, "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005518/frames/2048x1024_2x1_30p/PM2.5_Layer")
        self.assertEqual([(r["name"], r["is_dir"]) for r in rows],
                         [("AirQuality", True), ("AirQuality_PM2.5_Layer_2048x1024_0000.png", False), ("AirQuality_PM2.5_Layer_2048x1024_0001.png", False)])
        self.assertEqual(rows[1]["bytes"], 2_100_000); self.assertEqual(rows[2]["bytes"], 2_000_000)

class AssetRule(unittest.TestCase):
    """The rule on the cached records (pipeline/svs/cache, committed)."""
    def load(self, sid): return json.loads((CACHE / f"{sid}.json").read_text(encoding="utf-8"))

    def test_5533_takes_5518_species_layers(self):
        c = choose.choose(self.load(5533), alternates=[self.load(5518)])
        self.assertEqual(c["source_id"], 5518)
        self.assertEqual(sorted(f["layer"] for f in c["frames"]), ["CarbonMonoxide_Layer", "NitrogenOxides_Layer", "Ozone_Layer", "PM2.5_Layer"])
        self.assertTrue(all(f["width"] == 2048 and f["height"] == 1024 for f in c["frames"]))
        self.assertEqual(c["colorbars"]["Ozone_Layer"]["filename"], "Ozone_colorbar.png")

    def test_3912_clean_2048_set_and_dates(self):
        c = choose.choose(self.load(3912))
        self.assertEqual([f["layer"] for f in c["frames"]], ["orig"])
        self.assertTrue(c["date_lists"][0].endswith("flat_ecco2_dates.txt"))
        self.assertEqual(c["colorbars"]["orig"]["filename"], "sst_ecco2_cbar.png")

if __name__ == "__main__":
    unittest.main()
