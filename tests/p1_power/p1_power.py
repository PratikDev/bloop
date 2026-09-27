# Test P1 — NASA POWER: Bangladesh then-vs-now (no key needed)
import json, time, urllib.request, datetime as dt, numpy as np
from jb_audio import freq_map, sequence, silence, save

LAT, LON, PLACE = 23.81, 90.41, "Dhaka"
PARAMS = "T2M,T2M_MAX,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN"
WIN_A, WIN_B = (1981, 1990), (2016, 2025)
HOT_MONTHS, RAIN_MONTHS = (4, 5), (6, 7, 8, 9)       # Apr–May heat; Jun–Sep monsoon
HOT_C, RAINY_MM, EXTREME_MM = 35.0, 1.0, 50.0        # stated thresholds (pre-registered)

end = (dt.date.today() - dt.timedelta(days=1)).strftime("%Y%m%d")
url = (f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters={PARAMS}&community=AG"
       f"&longitude={LON}&latitude={LAT}&start=19810101&end={end}&format=JSON")
t0 = time.time()
with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "jukebox-test"}), timeout=300) as r:
    raw = r.read()
data = json.loads(raw)
print(f"POWER responded in {time.time()-t0:.1f}s, {len(raw)/1e6:.2f} MB")
par = data["properties"]["parameter"]
days = sorted(par["T2M"].keys())
dates = np.array([dt.date(int(d[:4]), int(d[4:6]), int(d[6:])) for d in days])
series = {}
for p in par:
    v = np.array([par[p][d] for d in days], float); v[v <= -900] = np.nan
    series[p] = v
    ok = np.where(~np.isnan(v))[0]
    print(f"  {p:18s} first {dates[ok[0]] if len(ok) else '-'}  last {dates[ok[-1]] if len(ok) else '-'}  missing {np.isnan(v).mean()*100:.2f}%")

years = np.array([d.year for d in dates]); months = np.array([d.month for d in dates])
def win(w, mset): return (years >= w[0]) & (years <= w[1]) & np.isin(months, mset)

def stull_wetbulb(T, RH):  # Stull (2011) approximation, T in C, RH in %
    return (T*np.arctan(0.151977*np.sqrt(RH+8.313659)) + np.arctan(T+RH) - np.arctan(RH-1.676331)
            + 0.00391838*RH**1.5*np.arctan(0.023101*RH) - 4.686035)

summary = {"place": PLACE, "lat": LAT, "lon": LON, "windows": [WIN_A, WIN_B], "thresholds": [HOT_C, RAINY_MM, EXTREME_MM]}
base = series["T2M_MAX"][win(WIN_A, HOT_MONTHS)]; p90 = np.nanpercentile(base, 90)
print(f"\nA1 HEAT ({PLACE}, Apr–May)  [baseline 90th percentile of daily max = {p90:.1f} C]")
for name, w in (("A", WIN_A), ("B", WIN_B)):
    m = win(w, HOT_MONTHS); n_years = len(set(years[m]))
    tmax = series["T2M_MAX"][m]
    s = {"years": n_years, "mean_tmax": float(np.nanmean(tmax)),
         "hot_days_per_season": float(np.nansum(tmax >= HOT_C) / max(n_years, 1)),
         "days_above_baseline_p90_per_season": float(np.nansum(tmax >= p90) / max(n_years, 1)),
         "mean_wetbulb_C": float(np.nanmean(stull_wetbulb(series["T2M"][m], series["RH2M"][m])))}
    summary[f"heat_{name}"] = s
    print(f"  {w[0]}–{w[1]} ({n_years} yrs): mean daily max {s['mean_tmax']:.2f} C | days >= {HOT_C} C: {s['hot_days_per_season']:.1f}/season"
          f" | days above baseline P90: {s['days_above_baseline_p90_per_season']:.1f}/season | mean wet-bulb {s['mean_wetbulb_C']:.2f} C")
print(f"\nA3 MONSOON RAIN ({PLACE}, Jun–Sep)")
for name, w in (("A", WIN_A), ("B", WIN_B)):
    m = win(w, RAIN_MONTHS); n_years = len(set(years[m])); r = series["PRECTOTCORR"][m]
    s = {"years": n_years, "rainy_days_per_season": float(np.nansum(r >= RAINY_MM) / max(n_years, 1)),
         "extreme_days_per_season": float(np.nansum(r >= EXTREME_MM) / max(n_years, 1)),
         "mean_mm_per_day": float(np.nanmean(r)), "day_to_day_std_mm": float(np.nanstd(r))}
    summary[f"rain_{name}"] = s
    print(f"  {w[0]}–{w[1]}: rainy days {s['rainy_days_per_season']:.1f} | extreme days (>= {EXTREME_MM} mm) {s['extreme_days_per_season']:.2f}"
          f" | mean {s['mean_mm_per_day']:.2f} mm/day | day-to-day spread {s['day_to_day_std_mm']:.2f} mm")
print("\nA15 SUNLIGHT (all-sky surface shortwave, annual mean; solar record starts 1984)")
for name, w in (("A", (1984, 1993)), ("B", WIN_B)):
    m = (years >= w[0]) & (years <= w[1]); v = float(np.nanmean(series["ALLSKY_SFC_SW_DWN"][m]))
    summary[f"sun_{name}"] = v; print(f"  {w[0]}–{w[1]}: {v:.2f} kWh/m2/day")

json.dump({"summary": summary, "dates": days, "series": {k: [None if np.isnan(x) else round(float(x), 3) for x in v] for k, v in series.items()}},
          open("power_dhaka.json", "w"))
print("\nSaved power_dhaka.json (prototype-ready)")

# Preview sound: average Apr–May day-by-day in each window; pitch = daily max (10–40 C -> 220–880 Hz),
# click strength = share of years with a hot day on that date
def season_profile(w):
    m = win(w, HOT_MONTHS); doy = np.array([(d.month, d.day) for d in dates[m]]); v = series["T2M_MAX"][m]
    keys = sorted(set(map(tuple, doy)))
    mean = [np.nanmean(v[(doy[:, 0] == a) & (doy[:, 1] == b)]) for a, b in keys]
    hot = [np.nanmean(v[(doy[:, 0] == a) & (doy[:, 1] == b)] >= HOT_C) for a, b in keys]
    return np.array(mean), np.array(hot)
ma, ha = season_profile(WIN_A); mb, hb = season_profile(WIN_B)
save("p1_heat_then_vs_now.wav", sequence(freq_map(ma, 10, 40), clicks=ha), silence(1.0), sequence(freq_map(mb, 10, 40), clicks=hb))
print("Listen: first half = 1981–1990 average Apr–May, second half = 2016–2025.")
