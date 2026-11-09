import datetime as dt, unittest
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from svs import ocr, ocr_dates

def render(text, size=40):
    """White text on black in the first system font the OCR knows (synthetic; real frames: svs/ocr_dates_check.py)."""
    f = ImageFont.truetype(ocr._fonts()[0], size)
    im = Image.new("L", (len(text) * size, 3 * size)); ImageDraw.Draw(im).text((size // 2, size), text, fill=255, font=f)
    return np.asarray(im, np.float32) / 255

class Dates(unittest.TestCase):
    def test_every_month_abbreviated(self):
        for m, name in enumerate(ocr_dates.MONTHS, 1):
            r = ocr_dates.read_date(render(f"{name[:3]}   {m + 10}   2017     12 : 30"))
            self.assertEqual(r["datetime"], dt.datetime(2017, m, m + 10, 12, 30, tzinfo=dt.timezone.utc), r["text"])

    def test_full_names_and_orders(self):
        utc = dt.timezone.utc
        self.assertEqual(ocr_dates.read_date(render("15 September 2020"))["datetime"], dt.datetime(2020, 9, 15, tzinfo=utc))
        self.assertEqual(ocr_dates.read_date(render("March 2019"))["datetime"], dt.datetime(2019, 3, 1, tzinfo=utc))
        self.assertEqual(ocr_dates.read_date(render("July 4, 2023"))["datetime"], dt.datetime(2023, 7, 4, tzinfo=utc))

if __name__ == "__main__":
    unittest.main()
