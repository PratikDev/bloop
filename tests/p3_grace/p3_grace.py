# Test P3 — GRACE/GRACE-FO water storage as a bass line (needs Earthdata Login)
import earthaccess, xarray as xr, numpy as np, pandas as pd, json
from jb_audio import freq_map, sequence, save

SHORT = "TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4"
BOXES = {"Bangladesh": (88.0, 20.5, 93.0, 26.7), "NW_India": (72.0, 26.0, 78.0, 32.0)}  # lon0,lat0,lon1,lat1
WIN_A, WIN_B = ("2003-01", "2006-12"), ("2021-01", "2024-12")

earthaccess.login(strategy="interactive", persist=True)
res = earthaccess.search_data(short_name=SHORT)
print(f"Granules found: {len(res)}")
files = [str(f) for f in earthaccess.download(res, "grace_files") if str(f).endswith(".nc")]
ds = None
for path in files:
    cand = xr.open_dataset(path, engine="h5netcdf")
    if "lwe_thickness" in cand: ds = cand; print(f"Using {path}"); break
if ds is None: raise SystemExit(f"No file with lwe_thickness among: {files}")
print(ds)
lwe = ds["lwe_thickness"]
lon = ds["lon"].values; lon_is_360 = lon.max() > 180
out = {}
for name, (x0, y0, x1, y1) in BOXES.items():
    if lon_is_360: x0, x1 = x0 % 360, x1 % 360
    box = lwe.sel(lat=slice(y0, y1), lon=slice(x0, x1))
    if box.sizes["lat"] == 0: box = lwe.sel(lat=slice(y1, y0), lon=slice(x0, x1))   # descending latitude
    if box.sizes["lat"] == 0 or box.sizes["lon"] == 0: raise SystemExit(f"{name}: empty box - paste the printed dataset summary")
    w = np.cos(np.deg2rad(box["lat"]))
    s = box.weighted(w).mean(("lat", "lon")).to_series()
    s.index = pd.to_datetime(s.index)
    months = s.index.to_period("M")
    full = pd.period_range(months.min(), months.max(), freq="M")
    missing = [str(m) for m in full if m not in set(months)]
    yrs = (s.index - s.index[0]).days / 365.25
    trend = np.polyfit(yrs, s.values, 1)[0]
    a = s[WIN_A[0]:WIN_A[1]].mean(); b = s[WIN_B[0]:WIN_B[1]].mean()
    print(f"\n{name}: {len(s)} months, {months.min()} to {months.max()}; missing months: {len(missing)}")
    print(f"  gap Jul 2017–May 2018 present: {all(m in missing for m in [str(p) for p in pd.period_range('2017-08','2018-04',freq='M')])}")
    print(f"  linear trend: {trend:+.2f} cm/yr | mean {WIN_A[0]}–{WIN_A[1]}: {a:+.2f} cm | {WIN_B[0]}–{WIN_B[1]}: {b:+.2f} cm")
    out[name] = {"months": [str(m) for m in months], "cm": [round(float(v), 3) for v in s.values],
                 "missing": missing, "trend_cm_per_yr": float(trend), "mean_A": float(a), "mean_B": float(b)}
json.dump(out, open("grace_boxes.json", "w")); print("\nSaved grace_boxes.json")
print("KNOWN-ANSWER CHECK: NW India trend should be NEGATIVE (documented groundwater depletion).")

# Preview: Bangladesh monthly bass line, honest silence for missing months (80–320 Hz)
b = out["Bangladesh"]; lookup = dict(zip(b["months"], b["cm"]))
allm = [str(p) for p in pd.period_range(b["months"][0], b["months"][-1], freq="M")]
vals = np.array([lookup.get(m, np.nan) for m in allm], float)
lo, hi = np.nanpercentile(vals, 2), np.nanpercentile(vals, 98)
save("p3_grace_bangladesh_bassline.wav", sequence(list(freq_map(vals, lo, hi, 80, 320)), step=0.06))
