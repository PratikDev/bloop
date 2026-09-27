# Step 5: inspect the SST frame and check the map layout
import sys
from PIL import Image
import numpy as np

FRAME = "sst_frame.png"          # <- change if your file has another name

img = Image.open(FRAME).convert("RGB")
a = np.asarray(img)
H, W = a.shape[:2]
print(f"Size: {W} x {H}  (expect 4096 x 2048, i.e. width = 2 x height)")

def px(lat, lon):
    x = int((lon + 180) / 360 * W)
    y = int((90 - lat) / 180 * H)
    return min(max(x, 0), W - 1), min(max(y, 0), H - 1)

tests = [
    ("Open Atlantic (0N, 30W) - should be OCEAN colour", 0, -30),
    ("Open Pacific (0N, 150W) - should be OCEAN colour", 0, -150),
    ("Indian Ocean (15S, 80E) - should be OCEAN colour", -15, 80),
    ("Sahara (23N, 13E) - should be LAND colour", 23, 13),
    ("Dhaka (23.7N, 90.4E) - should be LAND colour", 23.7, 90.4),
    ("Central Australia (25S, 134E) - should be LAND colour", -25, 134),
]
for name, lat, lon in tests:
    x, y = px(lat, lon)
    print(f"{name}: pixel ({x},{y}) RGB = {tuple(int(v) for v in a[y, x])}")

flat = a.reshape(-1, 3)
uniq = np.unique(flat[:: max(1, len(flat)//2_000_000)], axis=0)
print(f"Distinct colours (sampled): {len(uniq)}")
