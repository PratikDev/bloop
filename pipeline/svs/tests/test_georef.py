import unittest
import cv2
import numpy as np
from svs import georef

class Geometry(unittest.TestCase):
    def test_box_slices_bangladesh(self):
        rows, cols = georef.box_slices((88, 20, 93, 27), 2048, 1024)
        lat, lon = georef.pixel_centres(2048, 1024)
        self.assertTrue(20 <= lat[rows.stop - 1] and lat[rows.start] <= 27)
        self.assertTrue(88 <= lon[cols.start] and lon[cols.stop - 1] <= 93)

    def test_km_per_px(self):
        kx, ky = georef.km_per_px(np.array([0.0, 60.0]), 2048, 1024)
        self.assertAlmostEqual(kx[1] / kx[0], 0.5, places=6); self.assertAlmostEqual(float(ky), 19.44, places=1)

class Coastlines(unittest.TestCase):
    """The real check needs Natural Earth (downloaded once); the logic is tested on synthetic masks."""
    def test_iou(self):
        a = np.zeros((10, 10), bool); a[:5] = True
        b = np.zeros((10, 10), bool); b[:4] = True
        self.assertAlmostEqual(georef.iou(a, b), 0.8)

    def test_ocean_fill_from_outlines(self):
        H, W = 180, 360
        land = np.zeros((H, W), np.uint8); cv2.circle(land, (180, 90), 40, 1, -1)          # a round continent
        outline = cv2.morphologyEx(land, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
        got = georef.ocean_fill(outline, [(-150.0, 0.0)], grow=0)
        self.assertGreater(georef.iou(got, land.astype(bool)), 0.97)

    def test_outline_mask_on_any_colour(self):
        img = np.full((60, 60, 3), (200, 120, 40), np.uint8); img[30, :] = (10, 10, 10)
        m = georef.outline_mask(img)
        self.assertTrue(m[30].all() and not m[10].any())


class FitBounds(unittest.TestCase):
    def test_recovers_a_known_box(self):
        truth = (-100.0, -40.0, 60.0, 50.0)                               # a 16:9 flat map of part of the world
        frame = georef.rasterise_land(320, 180, truth)
        (w, s, e, n), score = georef.fit_bounds(frame, (-95.0, -36.0, 64.0, 47.0))
        self.assertGreater(score, 0.97)
        self.assertLess(max(abs(w - truth[0]), abs(s - truth[1]), abs(e - truth[2]), abs(n - truth[3])), 1.0)

if __name__ == "__main__":
    unittest.main()
