import datetime as dt, io, unittest
import numpy as np
from PIL import Image
from svs import frames

class PngPrefix(unittest.TestCase):
    def test_top_rows_are_exact(self):
        rng = np.random.default_rng(0)
        img = rng.integers(0, 255, (300, 200, 4), dtype=np.uint8)
        buf = io.BytesIO(); Image.fromarray(img).save(buf, format="PNG"); data = buf.getvalue()
        for frac in (0.2, 0.5, 0.9):
            arr, n = frames.png_top_rows(data[: int(len(data) * frac)])
            self.assertGreater(n, 0)
            np.testing.assert_array_equal(arr, img[:n])
        arr, n = frames.png_top_rows(data)
        self.assertEqual(n, 300)

class Times(unittest.TestCase):
    def test_linear(self):
        t0 = dt.datetime(2024, 7, 1, tzinfo=dt.timezone.utc)
        ts, step = frames.times_linear(t0, dt.datetime(2024, 9, 14, tzinfo=dt.timezone.utc), 1801)
        self.assertEqual(step, dt.timedelta(hours=1)); self.assertEqual(ts[-1].day, 14)

    def test_date_list(self):
        d = frames.times_from_list("23000  2007-03-25T12:00Z\n23004  2007-03-25T16:07Z\n")
        self.assertEqual(d[23004], dt.datetime(2007, 3, 25, 16, 7, tzinfo=dt.timezone.utc))

    def test_frame_number(self):
        self.assertEqual(frames.frame_number("flat_global_ecco2_2028x1024.23004.tif"), 23004)
        self.assertEqual(frames.frame_number("AirQuality_O3_Layer_2048x1024_0017.png"), 17)
        self.assertEqual(frames.frame_number("nightlights_2012-2024_KSC_SOS_04_plus2_1259_2k.png"), 1259)
        self.assertEqual(frames.frame_number("AirQuality_PM2.5_Layer_2048x1024_0000.png"), 0)

if __name__ == "__main__":
    unittest.main()
