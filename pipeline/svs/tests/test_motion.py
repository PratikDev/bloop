import unittest
import cv2
import numpy as np
from scipy import ndimage
from svs import blobs, flow

def texture(H=256, W=512, seed=0):
    rng = np.random.default_rng(seed)
    g = ndimage.gaussian_filter(rng.random((H, W)), 2.0)
    g = (g - g.min()) / (g.max() - g.min()) * 255
    return np.repeat(g[..., None], 3, -1).astype(np.uint8)

class OpticalFlow(unittest.TestCase):
    def test_recovers_a_known_shift(self):
        a = texture()
        b = np.roll(a, (2, -3), axis=(0, 1))                                  # 3 px west, 2 px south
        d = flow.farneback(a, b)[32:-32, 32:-32]
        self.assertAlmostEqual(float(np.median(d[..., 0])), -3, delta=0.15)
        self.assertAlmostEqual(float(np.median(d[..., 1])), 2, delta=0.15)
        u, v = flow.to_velocity(np.stack([np.full((256, 512), 1.0), np.zeros((256, 512))], -1), dt_hours=24)
        self.assertAlmostEqual(float(u[128, 0]), 111.32 * 360 / 512 * np.cos(np.radians(90 - 128.5 * 180 / 256)), places=2)
        self.assertEqual(float(flow.compass(np.array(1.0), np.array(0.0))), 90.0)

    def test_vorticity_of_solid_rotation(self):
        H, W = 64, 128
        y, x = np.mgrid[0:H, 0:W].astype(float)
        u, v = -(y - H / 2) * -1.0, (x - W / 2) * 1.0                         # counter-clockwise in a north-up frame
        vort, div = flow.derivatives(u, v, bounds=(-1, -0.5, 1, 0.5))
        self.assertGreater(float(np.median(vort)), 0); self.assertLess(abs(float(np.median(div))), 1e-6)

    def test_streak_axis(self):
        img = np.zeros((128, 256, 3), np.uint8)
        for k in range(0, 256, 6): cv2.line(img, (k, 0), (k, 127), (255, 255, 255), 1)    # north–south streaks
        axis, coh = flow.streak_axis(img, bounds=(-10, -5, 10, 5))
        a = axis[30:-30, 30:-30]
        self.assertLess(float(np.median(np.minimum(a, 180 - a))), 2.0)
        self.assertEqual(float(flow.sign_axis(np.array(0.0), np.array(0.0), np.array(-1.0))), 180.0)

class Blobs(unittest.TestCase):
    def test_new_marks_only(self):
        prev = np.zeros((100, 100), np.float32); prev[20, 20] = 1
        cur = prev.copy(); cur[70, 40] = 1
        prev, cur = ndimage.gaussian_filter(prev, 1.5) * 20, ndimage.gaussian_filter(cur, 1.5) * 20
        ev = blobs.geolocate(blobs.new_marks(prev, cur), 100, 100)
        self.assertEqual([(e["y"], e["x"]) for e in ev], [(70, 40)])
        self.assertEqual(int(blobs.cell_counts(ev, deg=36).sum()), 1)

if __name__ == "__main__":
    unittest.main()
