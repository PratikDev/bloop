"""Pixel → value against a calibrated colorbar. Two matchers share one code path:
  rgb-nearest   — the existing lookup (common.nearest): nearest strip sample in sRGB, residual in RGB units;
  lab-curve     — projection onto the strip's curve in CIELAB (nearest segment, sub-sample position), residual ΔE76.
DEFAULT is set by the regression gate (svs/regression_sst.py → docs/official/INVERSION_REGRESSION.md): on Check C the
CIELAB curve was worse on the median (0.332 vs 0.307 °C on the book's MUR column), so the old lookup stays the default.
Residual above `max_dist` → NaN (labels, coastlines, land, text, blended pixels); the residual grid is the confidence.
Modes:
  exact  — the frame shows colormap colours as they are;
  chroma — colours dimmed by a factor k (trails fading over black, opacity over a black background): curve and pixels
           are brightness-normalised first and k is returned so the caller can require a minimum brightness. Where the
           colormap itself only changes brightness (jet's dark-blue end), normalised colours of distant positions
           coincide: uncertain() lists those strip positions so the record can say which values are ambiguous."""
import numpy as np
from . import colour

DEFAULT = "rgb-nearest"
METHODS = ("rgb-nearest", "lab-curve")

class Inverter:
    def __init__(self, cb, mode="exact", method=DEFAULT, dense=2048):
        assert mode in ("exact", "chroma") and method in METHODS
        self.cb, self.mode, self.method = cb, mode, method
        self.px = np.linspace(0, cb.n - 1, dense) if method == "lab-curve" else np.arange(cb.n, dtype=float)
        self.px = np.unique(self.px)
        rgb = np.stack([np.interp(self.px, np.arange(cb.n), cb.rgb[:, c]) for c in range(3)], -1)
        self.curve, _ = self._space(rgb)

    def uncertain(self, tol, max_span=0.03):
        """Strip positions the matcher cannot place to better than max_span of the strip: all positions whose colour is
        within `tol` (the colour noise) of it span more than that (a fold-back, a stretch where the normalised colour
        stands still such as jet's dark-blue end in chroma mode, or a plateau too flat for the noise)."""
        C, px = self.curve, self.px
        near = np.sqrt(((C[:, None, :] - C[None, :, :]) ** 2).sum(-1)) < tol
        lo = np.where(near, px[None, :], np.inf).min(1); hi = np.where(near, px[None, :], -np.inf).max(1)
        return px[(hi - lo) > max_span * (self.cb.n - 1)].copy()

    def _space(self, rgb):
        """Colours in the matcher's space (after brightness normalisation in chroma mode) and their brightness k."""
        rgb = np.asarray(rgb, np.float64)
        if self.mode == "chroma":
            lin = colour.to_linear(rgb); k = lin.max(-1)
            rgb = colour.from_linear(lin / np.maximum(k, 1e-6)[..., None])
        else:
            k = np.ones(rgb.shape[:-1])
        return (colour.rgb_to_lab(rgb) if self.method == "lab-curve" else rgb), k

    def project_colours(self, rgb, chunk=4096):
        """(N, 3) colours → (strip position px, residual, brightness k)."""
        p_all, k = self._space(rgb)
        C = self.curve
        seg_a, seg_d = C[:-1], np.diff(C, axis=0)
        seg_len2 = np.maximum((seg_d ** 2).sum(1), 1e-12)
        pos, res = np.empty(len(p_all)), np.empty(len(p_all))
        for i in range(0, len(p_all), chunk):
            p = p_all[i:i + chunk]
            d2 = ((p[:, None, :] - C[None, :, :]) ** 2).sum(-1)
            j = d2.argmin(1)
            best_t, best_r = self.px[j].astype(float), np.sqrt(d2[np.arange(len(p)), j])
            if self.method == "lab-curve":
                for s in (j - 1, j):                     # the two segments touching the nearest sample
                    s = np.clip(s, 0, len(seg_a) - 1)
                    t = np.clip(((p - seg_a[s]) * seg_d[s]).sum(1) / seg_len2[s], 0, 1)
                    r = np.sqrt(((p - (seg_a[s] + t[:, None] * seg_d[s])) ** 2).sum(1))
                    better = r < best_r
                    best_r[better] = r[better]
                    best_t[better] = (self.px[s] + t * (self.px[s + 1] - self.px[s]))[better]
            pos[i:i + chunk], res[i:i + chunk] = best_t, best_r
        return pos, res, k

    def invert(self, rgb_img, max_dist, min_k=0.0):
        """Image (H, W, 3) → (values with NaN, strip position, residual, brightness k). Works on distinct colours."""
        H, W, _ = rgb_img.shape
        flat = rgb_img.reshape(-1, 3).astype(np.int64)
        keys = (flat[:, 0] << 16) | (flat[:, 1] << 8) | flat[:, 2]
        uk, inv = np.unique(keys, return_inverse=True)
        ucol = np.stack([(uk >> 16) & 255, (uk >> 8) & 255, uk & 255], 1)
        pos, res, k = self.project_colours(ucol)
        val = self.cb.value_at(pos).astype(np.float32)
        val[(res > max_dist) | (k < min_k)] = np.nan
        shape = lambda a: a[inv].reshape(H, W)
        return shape(val), shape(pos.astype(np.float32)), shape(res.astype(np.float32)), shape(np.asarray(k, np.float32))
