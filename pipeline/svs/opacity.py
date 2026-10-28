"""Layers drawn with an opacity transfer function over a flat background (5518 O3/NOx: low values fade to (30, 30, 30);
DYAMOND CO₂ later). Model, in sRGB: pixel = α(v)·C(v) + (1 − α(v))·B, C = colorbar colour, B = background.
  1 per distinct colour, (v, α) by least squares over the colorbar samples; residual = fit error (0–255);
  2 a colour is identifiable when the samples whose fit is within IDENT_TOL of its best span ≤ IDENT_SPAN of the strip;
  3 α(v) is learned as a monotone (isotonic) curve from identifiable colours only — the frames' own pixels, never
    validation data — and frozen;
  4 an unidentifiable colour (white-ish C(v), where v is invisible in colour) takes v from its α through that curve,
    only inside the α range the curve covers;
  5 below range (censored, NaN + flag, with the bound recorded): pixels at the background colour, and unidentifiable
    colours whose α is under the curve's lowest α (α grows with v, so v is under the lowest identifiable value)."""
import numpy as np
from scipy.optimize import isotonic_regression

IDENT_TOL, IDENT_SPAN = 2.0, 0.03

class OpacityInverter:
    def __init__(self, cb, background):
        self.cb, self.B = cb, np.asarray(background, float)
        self.C = cb.rgb.astype(float)
        self.D = self.C - self.B
        self.ramp = None                                  # (strip px, α) monotone samples once learned

    def fit_colours(self, colours, chunk=2048):
        """(N, 3) → best strip px, α, residual, identifiable."""
        X = np.asarray(colours, float)
        den = (self.D ** 2).sum(1)
        px, al, res, ident = (np.empty(len(X)) for _ in range(4))
        for i in range(0, len(X), chunk):
            x = X[i:i + chunk] - self.B
            a = np.clip(x @ self.D.T / den, 0, 1)
            R = np.linalg.norm(x[:, None, :] - a[..., None] * self.D[None], axis=-1)
            j = R.argmin(1); r = R[np.arange(len(x)), j]
            near = R <= r[:, None] + IDENT_TOL
            idx = np.arange(self.cb.n)[None, :]
            span = np.where(near, idx, -1).max(1) - np.where(near, idx, 10 ** 9).min(1)
            px[i:i + chunk], al[i:i + chunk], res[i:i + chunk] = j, a[np.arange(len(x)), j], r
            ident[i:i + chunk] = span <= IDENT_SPAN * (self.cb.n - 1)
        return px, al, res, ident.astype(bool)

    def learn_ramp(self, colours, counts, max_dist=10.0):
        """Monotone α(strip px) from identifiable, well-fitted colours (weighted by pixel counts); returns a summary."""
        px, al, res, ident = self.fit_colours(colours)
        ok = ident & (res <= max_dist) & (al > 0.02)
        order = np.argsort(px[ok])
        x, y, w = px[ok][order], al[ok][order], np.asarray(counts, float)[ok][order]
        fit = isotonic_regression(y, weights=w, increasing=True).x
        grid = np.arange(self.cb.n, dtype=float)
        self.ramp = (grid, np.interp(grid, x, fit))
        self.below_value = float(self.cb.value_at(np.array([x.min()]))[0])     # censoring bound
        return {"identifiable_colours": int(ok.sum()), "below_range_bound": self.below_value, "px_range": [float(x.min()), float(x.max())],
                "value_range": [float(self.cb.value_at(np.array([x.min()]))[0]), float(self.cb.value_at(np.array([x.max()]))[0])],
                "alpha_at_values": {f"{v:.4g}": float(np.interp(p, *self.ramp)) for p, v in
                                    zip(np.linspace(x.min(), x.max(), 9), self.cb.value_at(np.linspace(x.min(), x.max(), 9)))},
                "alpha_full_from_value": float(self.cb.value_at(np.array([grid[np.argmax(self.ramp[1] >= 0.98)]]))[0])
                if (self.ramp[1] >= 0.98).any() else None}

    def invert(self, img, max_dist=10.0, bg_tol=3.0):
        """Image → (values, α, residual, flags): 0 ok, 1 from the ramp, 2 below range (censored), 3 rejected (bad fit)."""
        H, W, _ = img.shape
        flat = img.reshape(-1, 3).astype(np.int64)
        keys = (flat[:, 0] << 16) | (flat[:, 1] << 8) | flat[:, 2]
        uk, inv = np.unique(keys, return_inverse=True)
        u = np.stack([(uk >> 16) & 255, (uk >> 8) & 255, uk & 255], 1).astype(float)
        px, al, res, ident = self.fit_colours(u)
        flag = np.where(ident, 0, 1)
        if self.ramp is not None:                         # unidentifiable: v from α through the learned ramp
            g, a = self.ramp
            lo, hi = a.min(), a.max()
            from_ramp = (~ident) & (al >= lo) & (al <= hi)
            px = np.where(from_ramp, np.interp(al, a, g), px)       # ramp is monotone: α → px
            flag = np.where(~ident & (al < lo), 2, np.where(~ident & (al > hi), 3, flag))
        else:
            flag = np.where(~ident, 3, flag)
        flag = np.where((res > max_dist) & (flag != 2), 3, flag)
        flag = np.where(np.abs(u - self.B).max(1) <= bg_tol, 2, flag)
        val = self.cb.value_at(px).astype(np.float32)
        val[flag >= 2] = np.nan
        shape = lambda x: x[inv].reshape(H, W)
        return shape(val), shape(al.astype(np.float32)), shape(res.astype(np.float32)), shape(flag.astype(np.uint8))
