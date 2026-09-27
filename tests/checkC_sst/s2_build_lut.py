# Step 6: turn the colorbar image into a colour -> temperature lookup table
from PIL import Image
import numpy as np

COLORBAR = "sst_colorbar.png"   # <- your colorbar file
ORIENTATION = "horizontal"      # "horizontal" (cold on left) or "vertical" (cold at bottom)
START = 200     # pixel where the colour strip starts (x for horizontal, y for vertical)
END = 1400      # pixel where the colour strip ends
ACROSS = 450    # a row (horizontal) or column (vertical) through the MIDDLE of the strip
VMIN, VMAX = -5.0, 35.0   # labels at the two ends of the strip (deg C)

if END <= START:
    raise SystemExit("Set START, END and ACROSS first (see the guide).")

a = np.asarray(Image.open(COLORBAR).convert("RGB")).astype(int)
if ORIENTATION == "horizontal":
    colours = a[ACROSS, START:END + 1]
else:
    colours = a[START:END + 1, ACROSS][::-1]   # flip so index 0 = cold end
n = len(colours)
values = VMIN + (VMAX - VMIN) * np.arange(n) / (n - 1)

uniq = np.unique(colours, axis=0)
print(f"Strip length: {n} px, distinct colours in strip: {len(uniq)}")
print(f"Temperature step per strip pixel: {(VMAX - VMIN) / (n - 1):.3f} C")
print("First 3 colours (cold end):", colours[:3].tolist())
print("Last 3 colours (warm end):", colours[-3:].tolist())
# Repeated colours far apart would make inversion ambiguous
dup = 0
for i in range(n):
    same = np.where((colours == colours[i]).all(axis=1))[0]
    if same.max() - same.min() > max(3, n // 40):
        dup += 1
print(f"Pixels whose colour also appears far away in the strip: {dup} (0 is ideal)")
np.savez("lut.npz", colours=colours, values=values)
print("Saved lut.npz")
