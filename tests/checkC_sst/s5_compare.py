# Step 9: compare frame-derived temperatures with MUR, and pick the best-matching date
import pandas as pd, numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

MEDIAN_LIMIT = 1.0   # deg C  <- your pre-written threshold
P90_LIMIT = 2.0      # deg C  <- your pre-written threshold

df = pd.read_csv("points_with_mur.csv")
results = []
for col in [c for c in df.columns if c.startswith("mur_")]:
    ok = df[col].notna()
    err = (df.loc[ok, "frame_temp_C"] - df.loc[ok, col])
    results.append(dict(column=col, n=int(ok.sum()), bias=err.mean(),
                        median_abs=err.abs().median(), p90_abs=err.abs().quantile(0.9),
                        max_abs=err.abs().max()))
r = pd.DataFrame(results).sort_values("median_abs")
print(r.round(3).to_string(index=False))
best = r.iloc[0]
passed = best.median_abs <= MEDIAN_LIMIT and best.p90_abs <= P90_LIMIT
print(f"\nBest match: {best.column}")
print(f"RESULT vs your thresholds: {'PASS' if passed else 'FAIL'}")

col = best.column; ok = df[col].notna()
plt.figure(figsize=(5, 5))
plt.scatter(df.loc[ok, col], df.loc[ok, "frame_temp_C"], s=14)
lo, hi = -3, 33
plt.plot([lo, hi], [lo, hi], "k--", lw=1)
plt.xlabel("MUR SST (C)"); plt.ylabel("Temperature read from frame colour (C)")
plt.title(f"Frame vs MUR ({col})"); plt.tight_layout(); plt.savefig("compare.png", dpi=120)
df.assign(error=df["frame_temp_C"] - df[col]).sort_values("error", key=abs, ascending=False) \
  .head(5)[["lat", "lon", "frame_temp_C", col, "colour_dist"]].to_csv("worst5.csv", index=False)
print("Saved compare.png and worst5.csv")
