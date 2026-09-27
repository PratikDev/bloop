# Step C3e: decide which PNG version of the EXR matches the colorbar colours better
import numpy as np, shutil
from PIL import Image

lut = np.load("lut.npz"); lc = lut["colours"].astype(float)
rng = np.random.default_rng(0)
res = {}
for name in ["sst_frame.png", "sst_frame_raw.png"]:
    a = np.asarray(Image.open(name).convert("RGB")).astype(float)
    H, W = a.shape[:2]
    ys = rng.integers(int(H * 1 / 6), int(H * 5 / 6), 3000)   # 60S-60N
    xs = rng.integers(0, W, 3000)
    px = a[ys, xs]
    d = np.sqrt(((px[:, None, :] - lc[None, :, :]) ** 2).sum(axis=2)).min(axis=1)
    good = d[d < 60]                          # ignore land / labels
    res[name] = np.median(good) if len(good) else 999
    print(f"{name}: median colour distance to colorbar = {res[name]:.2f} "
          f"({len(good)} of 3000 sampled pixels look like ocean)")
best = min(res, key=res.get)
if best == "sst_frame_raw.png":
    shutil.copy("sst_frame.png", "sst_frame_srgb_backup.png")
    shutil.copy("sst_frame_raw.png", "sst_frame.png")
print(f"\nUsing: {best}  -> now saved as sst_frame.png")
print("Expect the chosen one to have a median distance of a few units (under ~10).")
