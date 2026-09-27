# Step R3: build colour -> rain-rate lookups for BOTH colorbars (liquid and frozen), log scale
import numpy as np
from PIL import Image

# --- EDIT THESE (same meaning as in s2_build_lut.py) --------------------------
BARS = {
    "liquid": ("rainbarwhite2.png", "rainbarblack2.png", 40, 416, 37),
    "frozen": ("snowbarwhite2.png", "snowbarblack2.png", 40, 416, 37),
}
ORIENTATION = "horizontal"     # "horizontal" (small values on left) or "vertical" (small at bottom)
VMIN, VMAX = 0.1, 50.0         # mm/hour, from the labels
# -----------------------------------------------------------------------------

def strip(path, start, end, across):
    a = np.asarray(Image.open(path).convert("RGB")).astype(float)
    if ORIENTATION == "horizontal":
        return a[across, start:end + 1]
    return a[start:end + 1, across][::-1]

out = {}
for name, (fw, fb, start, end, across) in BARS.items():
    if end <= start:
        raise SystemExit(f"Set START, END, ACROSS for '{name}' first (see the guide).")
    w, b = strip(fw, start, end, across), strip(fb, start, end, across)
    if w.shape != b.shape:
        raise SystemExit(f"{name}: white and black strips have different sizes - check coordinates")
    # colour over white = a*C + (1-a)*255 ; colour over black = a*C  ->  solve for a and C
    alpha = np.clip(1 - (w - b).mean(axis=1) / 255.0, 0.0, 1.0)
    premult = b                                   # a*C, what we compare against (stable at low alpha)
    n = len(alpha)
    t = np.arange(n) / (n - 1)
    values = 10 ** (np.log10(VMIN) + t * (np.log10(VMAX) - np.log10(VMIN)))
    out[f"{name}_premult"] = premult
    out[f"{name}_alpha"] = alpha
    out[f"{name}_values"] = values
    print(f"\n{name}: strip length {n} px")
    print(f"  opacity at low end (first 5 px):  {np.round(alpha[:5], 2).tolist()}")
    print(f"  opacity at high end (last 5 px):  {np.round(alpha[-5:], 2).tolist()}")
    print(f"  distinct colours (black version): {len(np.unique(b, axis=0))}")
    print(f"  low-end colour (black bg):  {b[0].astype(int).tolist()}   high-end: {b[-1].astype(int).tolist()}")

# Do the two colorbars share colours? (would make liquid/frozen ambiguous)
lq = out["liquid_premult"]; fz = out["frozen_premult"]
d = np.sqrt(((lq[:, None, :] - fz[None, :, :]) ** 2).sum(axis=2)).min(axis=1)
print(f"\nLiquid colours that are within 10 units of a frozen colour: {(d < 10).sum()} of {len(lq)}")
np.savez("rain_luts.npz", **out)
print("Saved rain_luts.npz")
