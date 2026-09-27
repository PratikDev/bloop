# Step 7: pick ocean points and convert their colours to temperatures
from PIL import Image
import numpy as np, pandas as pd

FRAME = "sst_frame.png"
N_POINTS = 60
MAX_LAT = 60          # stay between 60S and 60N (avoids sea-ice rendering)
MAX_COLOUR_DIST = 20  # colour must be this close to the colorbar to count as "matched"
SEED = 42

lut = np.load("lut.npz")
lc, lv = lut["colours"].astype(float), lut["values"]
a = np.asarray(Image.open(FRAME).convert("RGB")).astype(float)
H, W = a.shape[:2]
rng = np.random.default_rng(SEED)

def nearest(c):
    d = np.sqrt(((lc - c) ** 2).sum(axis=1))
    i = int(d.argmin())
    return lv[i], d[i]

rows, tried, unmatched = [], 0, 0
bands = np.linspace(-MAX_LAT, MAX_LAT, 7)           # 6 latitude bands
per_band = int(np.ceil(N_POINTS / 6))
for b in range(6):
    got = 0
    while got < per_band and tried < 200000:
        tried += 1
        lat = rng.uniform(bands[b], bands[b + 1]); lon = rng.uniform(-180, 180)
        x = int((lon + 180) / 360 * W); y = int((90 - lat) / 180 * H)
        x = min(max(x, 3), W - 4); y = min(max(y, 3), H - 4)
        block = a[y - 3:y + 4, x - 3:x + 4].reshape(-1, 3)
        dists = [nearest(c)[1] for c in block[::6]]
        if max(dists) > MAX_COLOUR_DIST * 3:        # land/coast/label nearby: skip
            continue
        val, dist = nearest(a[y, x])
        if dist > MAX_COLOUR_DIST:
            unmatched += 1
            continue
        lon_c = -180 + (x + 0.5) * 360 / W; lat_c = 90 - (y + 0.5) * 180 / H
        rows.append(dict(x=x, y=y, lat=round(lat_c, 4), lon=round(lon_c, 4),
                         r=int(a[y, x, 0]), g=int(a[y, x, 1]), b=int(a[y, x, 2]),
                         frame_temp_C=round(float(val), 3), colour_dist=round(float(dist), 2)))
        got += 1
df = pd.DataFrame(rows)
df.to_csv("points.csv", index=False)
print(f"Saved {len(df)} points to points.csv")
print(f"Ocean-looking pixels rejected because colour not on colorbar: {unmatched}")
print(df.describe()[["frame_temp_C", "colour_dist"]].round(2))
