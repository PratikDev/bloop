# Step R2: inspect the IMERG rain frame (data-only layer with transparency)
import numpy as np
from PIL import Image

FRAME = "rain_frame.png"

img = Image.open(FRAME)
print(f"Mode: {img.mode}  (expect RGBA = colours + transparency)")
a = np.asarray(img.convert("RGBA")).astype(int)
H, W = a.shape[:2]
print(f"Size: {W} x {H}  (expect 3600 x 1800)")
alpha = a[:, :, 3]
tot = alpha.size
print(f"Fully transparent (no rain):   {(alpha == 0).sum()/tot*100:5.1f}%")
print(f"Partly transparent (1-242):   {((alpha > 0) & (alpha < 243)).sum()/tot*100:5.1f}%")
print(f"Nearly opaque (243-255):       {(alpha >= 243).sum()/tot*100:5.1f}%")
vis = a[alpha > 0][:, :3]
if len(vis):
    uniq = np.unique(vis[:: max(1, len(vis)//500000)], axis=0)
    print(f"Distinct colours in visible pixels (sampled): {len(uniq)}")
