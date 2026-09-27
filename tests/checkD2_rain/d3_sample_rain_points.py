# Step R4: sample rain and no-rain points from the frame; convert rain colours to mm/hour
import numpy as np, pandas as pd
from PIL import Image

FRAME = "rain_frame.png"
N_RAIN, N_DRY = 150, 150
MIN_ALPHA_RAIN = 13        # alpha >= 13 (5% opacity) counts as "frame shows rain"
MAX_MATCH_DIST = 25        # colour must be this close to a colorbar entry
SEED = 7

L = np.load("rain_luts.npz")
table, vals, phase = [], [], []
for name in ("liquid", "frozen"):
    pm, al, v = L[f"{name}_premult"], L[f"{name}_alpha"], L[f"{name}_values"]
    table.append(pm); vals.append(v); phase += [name] * len(v)
table = np.vstack(table); vals = np.concatenate(vals); phase = np.array(phase)

a = np.asarray(Image.open(FRAME).convert("RGBA")).astype(float)
H, W = a.shape[:2]
alpha = a[:, :, 3]
rng = np.random.default_rng(SEED)
rows = []

ys, xs = np.where(alpha >= MIN_ALPHA_RAIN)
pick = rng.choice(len(ys), size=min(N_RAIN, len(ys)), replace=False)
unmatched = 0
for i in pick:
    y, x = ys[i], xs[i]
    r, g, b, al = a[y, x]
    vec = np.array([r, g, b])  # premultiplied + alpha
    d = np.sqrt(((table - vec) ** 2).sum(axis=1))
    j = int(d.argmin())
    if d[j] > MAX_MATCH_DIST:
        unmatched += 1
    rows.append(dict(kind="rain", x=x, y=y, alpha=int(al), frame_rate=round(float(vals[j]), 4),
                     frame_phase=phase[j], match_dist=round(float(d[j]), 1)))

ys, xs = np.where(alpha == 0)
pick = rng.choice(len(ys), size=min(N_DRY, len(ys)), replace=False)
for i in pick:
    rows.append(dict(kind="dry", x=xs[i], y=ys[i], alpha=0, frame_rate=0.0,
                     frame_phase="none", match_dist=0.0))

df = pd.DataFrame(rows)
df["lat"] = 90 - (df.y + 0.5) * 180 / H
df["lon"] = -180 + (df.x + 0.5) * 360 / W
df.to_csv("rain_points.csv", index=False)
r = df[df.kind == "rain"]
print(f"Saved {len(df)} points ({len(r)} rain, {len(df)-len(r)} dry) to rain_points.csv")
print(f"Rain points whose colour was NOT close to either colorbar: {unmatched}")
print(f"Rain points matched to liquid: {(r.frame_phase=='liquid').sum()}, frozen: {(r.frame_phase=='frozen').sum()}")
print(r[["frame_rate", "match_dist", "alpha"]].describe().round(3))
