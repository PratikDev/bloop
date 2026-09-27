# P1b — Is NASA POWER trustworthy for "Dhaka then vs now"? Cross-check against independent records.
# Needs power_dhaka.json from p1_power.py (same folder). Downloads ~45 MB + small station files.
import os, gzip, json, shutil, urllib.request, urllib.error, datetime as dt
import numpy as np, pandas as pd, xarray as xr
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt

LAT, LON = 23.81, 90.41
WIN_A, WIN_B = (1981, 1990), (2016, 2025)
WIN_B_GPCC = (2010, 2019)                      # GPCC full v2020 ends in 2019
HOT_M, RAIN_M = [4, 5], [6, 7, 8, 9]
# ---- PRE-WRITTEN RULES (do not change after running) --------------------------
RATIO_TOL = 0.30        # POWER's B/A rain ratio must be within ±30% of the independent ratio
MIN_CORR = 0.5          # year-to-year correlation with independent series
MIN_STATION_YEARS = 7   # station usable only if >= 7 years with >= 80% of days in each window
# -------------------------------------------------------------------------------
UA = {"User-Agent": "jukebox-crosscheck"}
def download(url, path):
    if os.path.exists(path): return path
    print(f"  downloading {url}")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=600) as r, open(path, "wb") as f:
        shutil.copyfileobj(r, f)
    return path

# ---------- POWER ----------
P = json.load(open("power_dhaka.json"))
pw = pd.DataFrame({k: pd.to_numeric(pd.Series(v), errors="coerce") for k, v in P["series"].items()})
pw.index = pd.to_datetime(P["dates"], format="%Y%m%d")
def seasonal(series, months, how="mean"):
    s = series[series.index.month.isin(months)]
    return s.groupby(s.index.year).agg(how)
pw_rain = seasonal(pw["PRECTOTCORR"], RAIN_M)           # mm/day JJAS mean per year
pw_tmax = seasonal(pw["T2M_MAX"], HOT_M)
pw_t2m = seasonal(pw["T2M"], HOT_M)
def wmean(s, w): return float(s[(s.index >= w[0]) & (s.index <= w[1])].mean())

results, series_for_plot = {}, {"POWER rain": pw_rain, "POWER Tmax": pw_tmax}

# ---------- GPCP v2.3 monthly (satellite + gauge, NASA-led project; hosted by NOAA PSL) ----------
try:
    f = download("https://downloads.psl.noaa.gov/Datasets/gpcp/precip.mon.mean.nc", "gpcp_precip.mon.mean.nc")
    ds_g = xr.open_dataset(f, decode_times=False)            # its time units string confuses the decoder
    g = ds_g["precip"].sel(lat=LAT, lon=LON, method="nearest").to_series()   # mm/day
    g.index = pd.Timestamp("1800-01-01") + pd.to_timedelta(g.index.astype(float), unit="D")
    gp = g[g.index.month.isin(RAIN_M)]; gp = gp.groupby(gp.index.year).mean()
    series_for_plot["GPCP rain"] = gp
    results["GPCP"] = {"A": wmean(gp, WIN_A), "B": wmean(gp, WIN_B)}
    print("GPCP ok (note: before 1988 GPCP relies on a coarser OLR-based estimate - treat 1981-87 with caution)")
except Exception as e:
    print(f"GPCP FAILED: {e}")

# ---------- GPCC Full Data v2020 (rain gauges only) ----------
try:
    f = download("https://downloads.psl.noaa.gov/Datasets/gpcc/full_v2020/precip.mon.total.2.5x2.5.v2020.nc", "gpcc_full_v2020_2.5.nc")
    c = xr.open_dataset(f)["precip"].sel(lat=LAT, lon=LON, method="nearest").to_series()   # mm/month
    c.index = pd.to_datetime(c.index); c = c / c.index.days_in_month                        # -> mm/day
    cp = c[c.index.month.isin(RAIN_M)]; cp = cp.groupby(cp.index.year).mean()
    series_for_plot["GPCC gauges rain"] = cp
    results["GPCC"] = {"A": wmean(cp, WIN_A), "B2010": wmean(cp, WIN_B_GPCC)}
    print("GPCC ok")
except Exception as e:
    print(f"GPCC FAILED: {e}")

# ---------- GISTEMP v4 250 km (NASA station-based temperature anomalies) ----------
try:
    gz = download("https://data.giss.nasa.gov/pub/gistemp/gistemp250_GHCNv4.nc.gz", "gistemp250.nc.gz")
    if not os.path.exists("gistemp250.nc"):
        with gzip.open(gz) as src, open("gistemp250.nc", "wb") as dst: shutil.copyfileobj(src, dst)
    t = xr.open_dataset("gistemp250.nc")["tempanomaly"].sel(lat=LAT, lon=LON, method="nearest").to_series()
    t.index = pd.to_datetime(t.index)
    ta = t[t.index.month.isin(HOT_M)]; ta = ta.groupby(ta.index.year).mean()
    series_for_plot["GISTEMP anomaly"] = ta
    results["GISTEMP"] = {"A": wmean(ta, WIN_A), "B": wmean(ta, WIN_B), "years_A": int(ta[(ta.index>=WIN_A[0])&(ta.index<=WIN_A[1])].notna().sum()),
                          "years_B": int(ta[(ta.index>=WIN_B[0])&(ta.index<=WIN_B[1])].notna().sum())}
    print("GISTEMP ok")
except Exception as e:
    print(f"GISTEMP FAILED: {e}")

# ---------- Dhaka station: NOAA Global Summary of the Day (WMO 41923) ----------
rows = []
for y in range(WIN_A[0], WIN_B[1] + 1):
    url = f"https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/{y}/41923099999.csv"
    try:
        path = download(url, f"gsod_41923_{y}.csv")
        d = pd.read_csv(path, usecols=["DATE", "MAX", "PRCP"])
        rows.append(d)
    except Exception:
        pass
if rows:
    s = pd.concat(rows); s["DATE"] = pd.to_datetime(s["DATE"])
    s = s.set_index("DATE").sort_index()
    s["TMAX_C"] = np.where(s["MAX"] > 900, np.nan, (s["MAX"] - 32) * 5 / 9)
    s["PRCP_MM"] = np.where(s["PRCP"] > 99, np.nan, s["PRCP"] * 25.4)
    am = s[s.index.month.isin(HOT_M)]
    cover = am.groupby(am.index.year)["TMAX_C"].count() / 61
    good = cover[cover >= 0.8].index
    st_tmax = am[am.index.year.isin(good)].groupby(am[am.index.year.isin(good)].index.year)["TMAX_C"].mean()
    series_for_plot["Station Tmax"] = st_tmax
    na = int(((st_tmax.index >= WIN_A[0]) & (st_tmax.index <= WIN_A[1])).sum())
    nb = int(((st_tmax.index >= WIN_B[0]) & (st_tmax.index <= WIN_B[1])).sum())
    results["STATION"] = {"A": wmean(st_tmax, WIN_A), "B": wmean(st_tmax, WIN_B), "years_A": na, "years_B": nb}
    print(f"Station GSOD 41923: usable Apr-May years A={na}, B={nb}")
else:
    print("Station GSOD FAILED: no files downloaded")

# ---------- Verdicts ----------
print("\n================ CROSS-CHECK ================")
pa, pb = wmean(pw_rain, WIN_A), wmean(pw_rain, WIN_B)
print(f"POWER monsoon rain (Jun-Sep, mm/day): {WIN_A}: {pa:.2f} | {WIN_B}: {pb:.2f} | ratio B/A {pb/pa:.2f}")
rain_ok = []
if "GPCP" in results:
    ga, gb = results["GPCP"]["A"], results["GPCP"]["B"]
    corr = pd.concat([pw_rain, series_for_plot["GPCP rain"]], axis=1).dropna().corr().iloc[0, 1]
    ok = abs((pb / pa) / (gb / ga) - 1) <= RATIO_TOL and corr >= MIN_CORR
    rain_ok.append(ok)
    print(f"GPCP  monsoon rain: {ga:.2f} | {gb:.2f} | ratio {gb/ga:.2f} | year-to-year corr with POWER {corr:.2f} -> {'CONSISTENT' if ok else 'INCONSISTENT'}")
if "GPCC" in results:
    ca, cb = results["GPCC"]["A"], results["GPCC"]["B2010"]
    pb2 = wmean(pw_rain, WIN_B_GPCC)
    corr = pd.concat([pw_rain, series_for_plot["GPCC gauges rain"]], axis=1).dropna().corr().iloc[0, 1]
    ok = abs((pb2 / pa) / (cb / ca) - 1) <= RATIO_TOL and corr >= MIN_CORR
    rain_ok.append(ok)
    print(f"GPCC  monsoon rain (gauges; B = {WIN_B_GPCC}): {ca:.2f} | {cb:.2f} | ratio {cb/ca:.2f} vs POWER ratio {pb2/pa:.2f} | corr {corr:.2f} -> {'CONSISTENT' if ok else 'INCONSISTENT'}")

ta_, tb_ = wmean(pw_tmax, WIN_A), wmean(pw_tmax, WIN_B)
ma_, mb_ = wmean(pw_t2m, WIN_A), wmean(pw_t2m, WIN_B)
print(f"\nPOWER Apr-May daily max: {ta_:.2f} -> {tb_:.2f} C (change {tb_-ta_:+.2f}); daily mean {ma_:.2f} -> {mb_:.2f} (change {mb_-ma_:+.2f})")
temp_ok = []
if "GISTEMP" in results:
    d = results["GISTEMP"]["B"] - results["GISTEMP"]["A"]
    ok = np.sign(d) == np.sign(mb_ - ma_)
    temp_ok.append(ok)
    print(f"GISTEMP Apr-May mean-temperature anomaly change: {d:+.2f} C (years A={results['GISTEMP']['years_A']}, B={results['GISTEMP']['years_B']}) -> {'SAME DIRECTION' if ok else 'OPPOSITE DIRECTION'} as POWER mean temperature")
if "STATION" in results and results["STATION"]["years_A"] >= MIN_STATION_YEARS and results["STATION"]["years_B"] >= MIN_STATION_YEARS:
    d = results["STATION"]["B"] - results["STATION"]["A"]
    corr = pd.concat([pw_tmax, series_for_plot["Station Tmax"]], axis=1).dropna().corr().iloc[0, 1]
    ok = (np.sign(d) == np.sign(tb_ - ta_)) and corr >= MIN_CORR
    temp_ok.append(ok)
    print(f"Dhaka station Apr-May daily max: {results['STATION']['A']:.2f} -> {results['STATION']['B']:.2f} (change {d:+.2f}); corr with POWER {corr:.2f} -> {'CONSISTENT' if ok else 'INCONSISTENT'}")
elif "STATION" in results:
    print("Dhaka station: not enough complete years in one or both windows -> not used for the verdict")

print("\nVERDICT")
print(f"  Rain:        {'POWER CONSISTENT' if rain_ok and all(rain_ok) else ('POWER NOT RELIABLE for this comparison' if rain_ok else 'no independent rain data')}")
print(f"  Temperature: {'POWER CONSISTENT' if temp_ok and all(temp_ok) else ('POWER NOT RELIABLE for this comparison' if temp_ok else 'no independent temperature data')}")

# ---------- Plot ----------
fig, ax = plt.subplots(2, 1, figsize=(9, 7), sharex=True)
for k in ["POWER rain", "GPCP rain", "GPCC gauges rain"]:
    if k in series_for_plot: ax[0].plot(series_for_plot[k].index, series_for_plot[k].values, marker=".", label=k)
ax[0].set_ylabel("Jun–Sep mean rain (mm/day)"); ax[0].legend()
for k in ["POWER Tmax", "Station Tmax"]:
    if k in series_for_plot: ax[1].plot(series_for_plot[k].index, series_for_plot[k].values, marker=".", label=k)
if "GISTEMP anomaly" in series_for_plot:
    a2 = ax[1].twinx(); s = series_for_plot["GISTEMP anomaly"]; s = s[s.index >= 1981]
    a2.plot(s.index, s.values, color="grey", alpha=.6, label="GISTEMP anomaly (right axis)"); a2.set_ylabel("anomaly (C)")
ax[1].set_ylabel("Apr–May daily max (C)"); ax[1].legend(loc="upper left")
plt.tight_layout(); plt.savefig("p1b_crosscheck.png", dpi=120)
json.dump({k: {kk: (float(vv) if isinstance(vv, (int, float, np.floating)) else vv) for kk, vv in v.items()} for k, v in results.items()},
          open("p1b_results.json", "w"), indent=2)
print("\nSaved p1b_crosscheck.png and p1b_results.json")