# Step R6: compare frame-derived rain with IMERG and give the verdict
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

AGREE_LIMIT = 0.90       # rain/no-rain agreement  <- your pre-written rule
LOGERR_LIMIT = 0.15      # median |log10(frame/IMERG)|  <- your pre-written rule
RAIN_T = 0.1             # mm/h, the colorbar's lowest value

df = pd.read_csv("rain_points_with_imerg.csv")
rows = []
for col in [c for c in df.columns if c.startswith("imerg_")]:
    d = df[df[col].notna()]
    frame_rain = d.kind == "rain"; imerg_rain = d[col] >= RAIN_T
    agree = (frame_rain == imerg_rain).mean()
    both = d[frame_rain & imerg_rain]
    le = np.log10(both.frame_rate / both[col])
    phase_ok = np.nan
    pc = col.replace("imerg_", "pliquid_")
    if pc in d.columns and len(both):
        imerg_phase = np.where(both[pc] >= 50, "liquid", "frozen")
        phase_ok = (imerg_phase == both.frame_phase).mean()
    rows.append(dict(candidate=col, n=len(d), agreement=agree,
                     dry_ok=(~imerg_rain[~frame_rain]).mean(), rain_ok=imerg_rain[frame_rain].mean(),
                     n_both_rain=len(both), median_abs_log=le.abs().median(), median_log_bias=le.median(),
                     phase_agreement=phase_ok))
r = pd.DataFrame(rows).sort_values(["median_abs_log"])
print(r.round(3).to_string(index=False))
best = r.iloc[0]
passed = best.agreement >= AGREE_LIMIT and best.median_abs_log <= LOGERR_LIMIT
print(f"\nBest match: {best.candidate}")
print(f"RESULT vs your thresholds: {'PASS' if passed else 'FAIL'}")

col = best.candidate
both = df[(df.kind == "rain") & (df[col] >= RAIN_T)]
plt.figure(figsize=(5, 5))
plt.scatter(both[col], both.frame_rate, s=12)
plt.plot([0.1, 50], [0.1, 50], "k--", lw=1)
plt.xscale("log"); plt.yscale("log"); plt.xlim(0.05, 100); plt.ylim(0.05, 100)
plt.xlabel("IMERG rain rate (mm/h)"); plt.ylabel("Rate read from frame colour (mm/h)")
plt.title(col); plt.tight_layout(); plt.savefig("rain_compare.png", dpi=120)
both.assign(abs_log=np.abs(np.log10(both.frame_rate / both[col]))) \
    .sort_values("abs_log", ascending=False).head(5)[["lat", "lon", "frame_rate", col, "frame_phase", "match_dist"]] \
    .to_csv("rain_worst5.csv", index=False)
print("Saved rain_compare.png and rain_worst5.csv")
