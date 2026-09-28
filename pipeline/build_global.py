"""Step 6d (additive): GLOBAL history cube - click anywhere on Earth and hear its record.
Layers (monthly, only cells that have data):
  heat  = NASA GISTEMP v4 250 km (land only), anomaly vs 1951-1980, 1981 -> latest, 0.01 C steps
  rain  = GPCP v2.3 (land + ocean, 2.5 deg), mm/day, 1981 -> latest, 0.01 mm/day steps
  water = GRACE/GRACE-FO JPL mascons averaged to 3 deg (its true resolution), cm, 2002-04 -> latest, 0.1 cm steps
Plus: per-rain-cell confidence (GPCP vs independent GPCC gauges), a world places list, quick-look maps.
Outputs: public/data/global/{heat,rain,water}.i16.gz + .json, confidence.json, places.json, manifest.json
         (built in public/data/global_building/ and moved into place only if ALL self-checks pass; on failure the
          published folder is left untouched and the script exits 1 - run_all.py treats that as a warning)
         pipeline/work/global_quicklook_*.png (for your eyes only)
Self-checks (pre-written; exit 1 if any fails):
 S1 round-trip: decoding the published files reproduces the source values within half a step (1000 random samples/layer)
 S2 Dhaka: the global heat/rain layers equal the already-verified Dhaka context files within half a step
 S3 known answers (catch flipped/shifted grids): Arctic land (>60N) warmed more than global land; the rainiest latitude
    band lies between 10S and 15N (ITCZ); GRACE trend is negative at NW India (30N,75E) and West Greenland (70N,50W)
 S4 coverage: heat has 3000-9000 land cells and no open-ocean cells; rain has all 10368 cells; GRACE gap months
    (2017-08..2018-04) are empty
 S5 size: public/data/global < 25 MB"""
import json, gzip, sys, warnings
import numpy as np, pandas as pd
from common import *
warnings.filterwarnings("ignore")
import shutil
CTX = INPUTS / "context"; FINAL = PUBLIC / "global"
OUT = PUBLIC / "global_building"            # build here; replace public/data/global only if every self-check passes
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir(parents=True)
START = pd.Period("1981-01", "M")

# ---------------- loading (xarray only here) ----------------
def load_gistemp():
    import xarray as xr
    da = xr.open_dataset(CTX / "gistemp250.nc")["tempanomaly"]
    t = pd.to_datetime(da["time"].values).to_period("M")
    return da["lat"].values, da["lon"].values, t, da.values.astype(np.float32)

def load_gpcp():
    import xarray as xr
    ds = xr.open_dataset(CTX / "gpcp_precip.mon.mean.nc", decode_times=False)
    t = (pd.Timestamp("1800-01-01") + pd.to_timedelta(ds["time"].values.astype(float), unit="D")).to_period("M")
    return ds["lat"].values, ds["lon"].values, t, ds["precip"].values.astype(np.float32)

def load_gpcc():
    import xarray as xr
    da = xr.open_dataset(CTX / "gpcc_full_v2020_2.5.nc")["precip"]
    t = pd.to_datetime(da["time"].values)
    arr = da.values.astype(np.float32) / t.days_in_month.values[:, None, None]      # mm/month -> mm/day
    return da["lat"].values, da["lon"].values, t.to_period("M"), arr

def load_grace_3deg():
    import xarray as xr
    f = sorted(CTX.glob("GRCTellus*.nc"))[0]
    da = xr.open_dataset(f, engine="h5netcdf")["lwe_thickness"]
    lat, lon = da["lat"].values, da["lon"].values
    w = np.cos(np.deg2rad(lat))[:, None] * np.ones((1, len(lon)))
    k = 6                                                                           # 0.5 deg -> 3 deg blocks
    nl, nm = len(lat) // k, len(lon) // k
    wb = w.reshape(nl, k, nm, k)
    out = np.empty((da.sizes["time"], nl, nm), np.float32)
    for i in range(da.sizes["time"]):                                               # one month at a time (low memory)
        a = da.isel(time=i).values.reshape(nl, k, nm, k)
        m = np.isfinite(a)
        out[i] = np.where(m, a * wb, 0).sum((1, 3)) / np.maximum((wb * m).sum((1, 3)), 1e-9)
        out[i][m.sum((1, 3)) == 0] = np.nan
    blat = lat.reshape(nl, k).mean(1); blon = lon.reshape(nm, k).mean(1)
    t = pd.to_datetime(da["time"].values).to_period("M")
    return blat, blon, t, out

# ---------------- pure processing (tested without xarray) ----------------
def normalize(lat, lon, arr):
    """lon -> -180..180 ascending, lat north -> south. arr: [time, lat, lon]."""
    lon = np.where(lon > 180, lon - 360, lon)
    jo = np.argsort(lon); io = np.argsort(-lat)
    return lat[io], lon[jo], arr[:, io][:, :, jo]

def monthly(times, arr, start, end=None):
    """Average duplicate months, keep start..end, fill missing months with NaN. Returns (PeriodIndex, arr)."""
    df = pd.DataFrame({"t": times, "i": np.arange(len(times))})
    groups = df.groupby("t")["i"].apply(list)
    monthly.duplicates = sorted(str(p) for p, g in groups.items() if len(g) > 1 and p >= start)
    end = end or groups.index.max()
    full = pd.period_range(start, end, freq="M")
    out = np.full((len(full),) + arr.shape[1:], np.nan, np.float32)
    for j, p in enumerate(full):
        if p in groups.index:
            with np.errstate(invalid="ignore"): out[j] = np.nanmean(arr[groups[p]], axis=0)
    return full, out

def to_layer(name, lat, lon, months, arr, scale, min_valid_months, meta):
    """Keep cells with enough data; int16 = round(value*scale); -32768 = no data. Writes <name>.i16.gz and <name>.json."""
    T, H, W = arr.shape
    flat = arr.reshape(T, H * W)
    valid = np.isfinite(flat).sum(0) >= min_valid_months
    cells = np.where(valid)[0]
    q = np.round(flat[:, cells].T * scale)                                          # [cells, months]
    q[~np.isfinite(flat[:, cells].T)] = -32768
    q = np.clip(q, -32767, 32767); q[~np.isfinite(flat[:, cells].T)] = -32768
    data = q.astype("<i2")
    with gzip.open(OUT / f"{name}.i16.gz", "wb", compresslevel=9) as f: f.write(data.tobytes())
    js = {"layer": name, "file": f"{name}.i16.gz", "compression": "gzip", "dtype": "int16 little-endian",
          "layout": "[cell][month] row-major; value = int16 / scale; -32768 = no data",
          "scale": scale, "month_start": str(months[0]), "n_months": int(T),
          "grid": {"lat": [round(float(x), 4) for x in lat], "lon": [round(float(x), 4) for x in lon],
                   "cell_id": "row * n_lon + col (row 0 = northernmost, col 0 = westernmost)"},
          "cells": [int(c) for c in cells], **meta}
    write_json(OUT / f"{name}.json", js)
    return cells, data

def decode_layer(name):
    js = json.load(open(OUT / f"{name}.json"))
    raw = np.frombuffer(gzip.open(OUT / js["file"]).read(), dtype="<i2").reshape(len(js["cells"]), js["n_months"])
    v = raw.astype(np.float32) / js["scale"]; v[raw == -32768] = np.nan
    return js, v

def annual(months, arr):
    yrs = np.array([p.year for p in months]); out = {}
    for y in np.unique(yrs):
        sel = yrs == y
        if sel.sum() >= 10:
            with np.errstate(invalid="ignore"): out[int(y)] = np.nanmean(arr[sel], axis=0)
    return out

def window_mean(ann, y0, y1, min_years):
    ys = [y for y in ann if y0 <= y <= y1]
    if not ys: return None
    stack = np.stack([ann[y] for y in ys])
    n = np.isfinite(stack).sum(0)
    with np.errstate(invalid="ignore"): m = np.nanmean(stack, 0)
    m[n < min_years] = np.nan
    return m

PLACES = [  # approximate city/region coordinates (lat, lon)
    ("Dhaka", 23.81, 90.41), ("Chattogram", 22.36, 91.78), ("Rajshahi", 24.37, 88.60), ("Sylhet", 24.90, 91.87),
    ("Kolkata", 22.57, 88.36), ("Delhi", 28.61, 77.21), ("Punjab (Ludhiana)", 30.90, 75.85), ("Karachi", 24.86, 67.01),
    ("Kathmandu", 27.72, 85.32), ("Beijing", 39.90, 116.40), ("Shanghai", 31.23, 121.47), ("Tokyo", 35.68, 139.69),
    ("Jakarta", -6.21, 106.85), ("Manila", 14.60, 120.98), ("Sydney", -33.87, 151.21), ("Perth", -31.95, 115.86),
    ("Auckland", -36.85, 174.76), ("Tehran", 35.69, 51.39), ("Riyadh", 24.71, 46.68), ("Aral Sea region (Nukus)", 42.46, 59.60),
    ("Cairo (Nile delta)", 30.04, 31.24), ("Sahel (Niamey)", 13.51, 2.11), ("Lagos", 6.52, 3.38), ("Kinshasa", -4.44, 15.27),
    ("Nairobi", -1.29, 36.82), ("Johannesburg", -26.20, 28.05), ("Madrid", 40.42, -3.70), ("London", 51.51, -0.13),
    ("Amsterdam (Rhine delta)", 52.37, 4.90), ("Moscow", 55.76, 37.62), ("Reykjavik", 64.15, -21.94),
    ("Svalbard (Longyearbyen)", 78.22, 15.65), ("West Greenland (Ilulissat)", 69.22, -51.10), ("New York", 40.71, -74.01),
    ("Phoenix", 33.45, -112.07), ("California Central Valley (Fresno)", 36.74, -119.79), ("New Orleans (Mississippi delta)", 29.95, -90.07),
    ("Mexico City", 19.43, -99.13), ("Manaus (Amazon)", -3.12, -60.02), ("Lima", -12.05, -77.04), ("São Paulo", -23.55, -46.63),
    ("Buenos Aires", -34.60, -58.38)]

def nearest_cell(js, lat, lon, max_steps=1):
    la = np.array(js["grid"]["lat"]); lo = np.array(js["grid"]["lon"])
    r = int(np.argmin(np.abs(la - lat))); c = int(np.argmin(np.abs(((lo - lon + 180) % 360) - 180)))
    step = abs(la[1] - la[0]); cells = {cid: i for i, cid in enumerate(js["cells"])}; W = len(lo)
    best = None
    for dr in range(-max_steps, max_steps + 1):                                     # land cells may sit one step away
        for dc in range(-max_steps, max_steps + 1):
            rr, cc = r + dr, (c + dc) % W
            if 0 <= rr < len(la) and rr * W + cc in cells:
                d = dr * dr + dc * dc
                if best is None or d < best[0]: best = (d, cells[rr * W + cc], rr, cc)
    return None if best is None else {"index": best[1], "lat": float(la[best[2]]), "lon": float(lo[best[3]])}

# ---------------- main ----------------
def main():
    fails = []
    def check(name, ok, detail=""):
        print(f"[{'PASS' if ok else 'FAIL'}] {name}  {detail}"); (None if ok else fails.append(name))

    print("Loading GISTEMP ..."); la, lo, t, a = load_gistemp(); la, lo, a = normalize(la, lo, a)
    hm, ha = monthly(t, a, START)
    if monthly.duplicates: sys.exit(f"FAIL: duplicate months in GISTEMP {monthly.duplicates[:5]} - unexpected, not averaging")
    print("Loading GPCP ..."); la2, lo2, t2, a2 = load_gpcp(); la2, lo2, a2 = normalize(la2, lo2, a2)
    rm, ra = monthly(t2, a2, START)
    if monthly.duplicates: sys.exit(f"FAIL: duplicate months in GPCP {monthly.duplicates[:5]} - unexpected, not averaging")
    print("Loading GPCC ..."); la3, lo3, t3, a3 = load_gpcc(); la3, lo3, a3 = normalize(la3, lo3, a3)
    cm, ca = monthly(t3, a3, START)
    print("Loading GRACE (averaging to 3 deg, takes a few minutes) ..."); la4, lo4, t4, a4 = load_grace_3deg()
    la4, lo4, a4 = normalize(la4, lo4, a4); wm, wa = monthly(t4, a4, pd.Period("2002-04", "M")); wdup = monthly.duplicates
    print(f"  GRACE: {len(wdup)} calendar months have two solutions - averaged explicitly: {wdup}")

    hcells, _ = to_layer("heat", la, lo, hm, ha, 100, 24, {"units": "degC anomaly vs 1951-1980", "dataset": "NASA GISTEMP v4 250 km (land only)",
                         "credit": "GISTEMP Team, NASA Goddard Institute for Space Studies"})
    rcells, _ = to_layer("rain", la2, lo2, rm, ra, 100, 24, {"units": "mm/day", "dataset": "GPCP v2.3 monthly, 2.5 deg",
                         "credit": "GPCP v2.3 (Adler et al.); data provided by NOAA PSL", "caveat": "Before 1988 GPCP uses a coarser estimate."})
    wcells, _ = to_layer("water", la4, lo4, wm, wa, 10, 24, {"units": "cm water-equivalent anomaly vs 2004-2009",
                         "dataset": "GRACE/GRACE-FO JPL mascons RL06.3Mv04 CRI, averaged to 3 deg", "credit": "NASA/JPL PO.DAAC",
                         "gap_note": "No satellite measurements Jul 2017 - May 2018.",
                         "duplicate_months_averaged": wdup})
    print(f"Layers: heat {len(hcells)} cells x {len(hm)} months; rain {len(rcells)} x {len(rm)}; water {len(wcells)} x {len(wm)}")

    # confidence per rain cell: GPCP vs GPCC annual means 1981-2019 (pre-written thresholds)
    ga, cc = annual(rm, ra), annual(cm, ca)
    yrs = [y for y in range(1981, 2020) if y in ga and y in cc]
    G = np.stack([ga[y] for y in yrs]); Cg = np.stack([cc[y] for y in yrs])
    same_grid = G.shape == Cg.shape and np.allclose(la2, la3) and np.allclose(lo2, lo3)
    conf = {}
    if not same_grid: print("  NOTE: GPCP and GPCC grids differ - confidence flags skipped")
    else:
        H, W = G.shape[1:]
        for cid in rcells:
            i, j = divmod(int(cid), W); g, c = G[:, i, j], Cg[:, i, j]; ok = np.isfinite(g) & np.isfinite(c)
            if ok.sum() < 30: conf[int(cid)] = "satellite-only"; continue
            r = float(np.corrcoef(g[ok], c[ok])[0, 1]) if np.std(g[ok]) > 0 and np.std(c[ok]) > 0 else 0.0
            ratio = float(np.mean(g[ok]) / max(np.mean(c[ok]), 1e-6))
            conf[int(cid)] = "high" if r >= 0.7 and abs(ratio - 1) <= 0.2 else ("medium" if r >= 0.5 and abs(ratio - 1) <= 0.35 else "low")
    write_json(OUT / "confidence.json", {"layer": "rain", "method": "GPCP vs GPCC (independent gauges), annual means 1981-2019: "
               "high = r >= 0.7 and mean within 20%; medium = r >= 0.5 and within 35%; low otherwise; satellite-only = no gauge data (e.g. oceans)",
               "flags": {str(k): v for k, v in conf.items()}})
    counts = pd.Series(list(conf.values())).value_counts().to_dict() if conf else {}
    print(f"Rain confidence flags: {counts}")

    # places + then/now (annual means; same method as Dhaka, not individually cross-checked)
    hjs, hv = decode_layer("heat"); rjs, rv = decode_layer("rain"); wjs, wv = decode_layer("water")
    def cell_window(js, v, idx, y0, y1):
        ms = pd.period_range(js["month_start"], periods=js["n_months"], freq="M"); ys = np.array([p.year for p in ms])
        s = v[idx][(ys >= y0) & (ys <= y1)]; return None if np.isfinite(s).sum() < 24 else round(float(np.nanmean(s)), 2)
    places = []
    for name, plat, plon in PLACES:
        h = nearest_cell(hjs, plat, plon); r = nearest_cell(rjs, plat, plon, 0); w = nearest_cell(wjs, plat, plon, 0)
        e = {"name": name, "lat": plat, "lon": plon, "heat_cell": h, "rain_cell": r, "water_cell": w}
        if h: e["heat_then_now"] = [cell_window(hjs, hv, h["index"], 1981, 1990), cell_window(hjs, hv, h["index"], 2016, 2025)]
        if r:
            e["rain_then_now"] = [cell_window(rjs, rv, r["index"], 1981, 1990), cell_window(rjs, rv, r["index"], 2016, 2025)]
            e["rain_confidence"] = conf.get(rjs["cells"][r["index"]])
        if w: e["water_then_now"] = [cell_window(wjs, wv, w["index"], 2003, 2006), cell_window(wjs, wv, w["index"], 2021, 2024)]
        places.append(e)
    # places that fall in the same grid cell are the same record: the first listed place is the reference
    for layer in ("heat", "rain", "water"):
        key = f"{layer}_cell"
        for i, e in enumerate(places):
            c = e.get(key)
            same = [o["name"] for o in places if o is not e and o.get(key) and c and o[key]["index"] == c["index"]]
            first = next((o["name"] for o in places[:i] if o.get(key) and c and o[key]["index"] == c["index"]), None)
            e[f"{layer}_shares_cell_with"] = same
            e[f"{layer}_same_record_as"] = first
    write_json(OUT / "places.json", {"note": "Annual means; heat 1981-1990 vs 2016-2025; rain same; water 2003-06 vs 2021-24. "
               "Places in the same grid cell are the same record: <layer>_same_record_as names the first listed place with that cell. "
               "Computed with the same method as Dhaka (which was cross-checked); other places are not individually cross-checked. "
               "Coordinates are approximate.", "places": places})
    write_json(OUT / "manifest.json", {"layers": ["heat", "rain", "water"], "files": ["heat.json", "rain.json", "water.json",
               "confidence.json", "places.json"], "generated_utc": now_utc(),
               "disclosure": "Three NASA records at their own resolutions (about 2, 2.5 and 3 degrees). Missing data = silence. "
                             "Voices moving together does not mean one causes the other."})

    # ---------------- self-checks ----------------
    rng = np.random.default_rng(0)
    for name, src, cells, js_v in (("heat", ha, hcells, (hjs, hv)), ("rain", ra, rcells, (rjs, rv)), ("water", wa, wcells, (wjs, wv))):
        js, v = js_v; T = src.shape[0]; flat = src.reshape(T, -1)
        ci = rng.integers(0, len(cells), 1000); ti = rng.integers(0, T, 1000)
        a_src = flat[ti, cells[ci]]; a_dec = v[ci, ti]
        both = np.isfinite(a_src) & np.isfinite(a_dec); nan_ok = np.array_equal(np.isfinite(a_src), np.isfinite(a_dec))
        half = 0.5 / js["scale"] + 1e-6
        check(f"S1 {name} round-trip", nan_ok and np.all(np.abs(a_src[both] - a_dec[both]) <= half),
              f"max diff {np.max(np.abs(a_src[both]-a_dec[both])) if both.any() else 0:.4f} (limit {half:.4f}); missing identical: {nan_ok}")
    try:
        gb = json.load(open(PUBLIC / "context" / "gistemp_bd.json"))["cells"]["Dhaka"]; pb = json.load(open(PUBLIC / "context" / "gpcp_bd.json"))["cells"]["Dhaka"]
        for label, src_cell, js, v, key in (("heat", gb, hjs, hv, "anom_C"), ("rain", pb, rjs, rv, "mm_per_day")):
            cell = nearest_cell(js, src_cell["lat"], src_cell["lon"], 0)
            ms = pd.period_range(js["month_start"], periods=js["n_months"], freq="M")
            ref = pd.Series(src_cell[key], index=pd.PeriodIndex(src_cell["months"], freq="M"), dtype="float64").reindex(ms).values
            got = v[cell["index"]]; both = np.isfinite(ref) & np.isfinite(got)
            check(f"S2 Dhaka {label} equals the verified context file", both.sum() > 100 and np.max(np.abs(ref[both] - got[both])) <= 0.5 / js["scale"] + 1e-6,
                  f"{both.sum()} months compared; max diff {np.max(np.abs(ref[both]-got[both])):.4f}")
    except Exception as e:
        check("S2 Dhaka comparison", False, str(e))
    # S3 known answers
    ann = annual(hm, ha); A = window_mean(ann, 1981, 1990, 8); B = window_mean(ann, 2016, 2025, 8)
    d = B - A; wlat = np.cos(np.deg2rad(la))[:, None] * np.ones((1, len(lo))); ok = np.isfinite(d)
    glob = np.sum(d[ok] * wlat[ok]) / np.sum(wlat[ok]); arc = ok & (la[:, None] > 60)
    arctic = np.sum(d[arc] * wlat[arc]) / np.sum(wlat[arc])
    check("S3 Arctic land warmed more than global land (documented)", arctic > glob, f"Arctic {arctic:+.2f} C vs global land {glob:+.2f} C")
    with np.errstate(invalid="ignore"): zon = np.nanmean(np.nanmean(ra, 0), 1)
    lat_max = float(la2[int(np.nanargmax(zon))])
    check("S3 rainiest latitude band is the tropics (ITCZ, documented)", -10 <= lat_max <= 15, f"max zonal rain at {lat_max:+.2f} deg")
    for place, plat, plon in (("NW India", 30, 75), ("West Greenland", 70, -50)):
        c = nearest_cell(wjs, plat, plon, 0); s = wv[c["index"]]; x = np.arange(len(s)); okk = np.isfinite(s)
        tr = np.polyfit(x[okk] / 12, s[okk], 1)[0]
        check(f"S3 GRACE trend negative at {place} (documented)", tr < 0, f"{tr:+.2f} cm/yr at cell ({c['lat']}, {c['lon']})")
    # S4 coverage
    heat_ocean = nearest_cell(hjs, -48, -125, 0) is None                        # South Pacific near Point Nemo: no land data
    check("S4 heat coverage (land only)", 3000 <= len(hcells) <= 9000 and heat_ocean, f"{len(hcells)} cells; open ocean empty: {heat_ocean}")
    check("S4 rain coverage (all cells)", len(rcells) == ra.shape[1] * ra.shape[2], f"{len(rcells)} of {ra.shape[1]*ra.shape[2]}")
    wms = [str(p) for p in pd.period_range(wjs["month_start"], periods=wjs["n_months"], freq="M")]
    gap = [wms.index(m) for m in ("2017-08", "2017-12", "2018-04") if m in wms]
    check("S4 GRACE gap months empty", len(gap) == 3 and np.all(~np.isfinite(wv[:, gap])), f"months checked {len(gap)}")
    size = sum(p.stat().st_size for p in OUT.glob("*") if p.is_file())
    check("S5 global data < 25 MB", size < 25e6, f"{size/1e6:.1f} MB")

    # quick-look maps for your eyes
    try:
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        for fname, img, title, cmap, lim in (("heat_change", d, "GISTEMP change 1981-90 -> 2016-25 (C)", "RdBu_r", 3),
                                             ("rain_mean", np.nanmean(ra, 0), "GPCP mean rain (mm/day)", "Blues", 10)):
            plt.figure(figsize=(9, 4.5)); plt.imshow(img, extent=[lo[0], lo[-1], la[-1] if fname=='heat_change' else la2[-1], la[0] if fname=='heat_change' else la2[0]],
                                                     cmap=cmap, vmin=-lim if cmap=="RdBu_r" else 0, vmax=lim, aspect="auto")
            plt.colorbar(); plt.title(title); plt.tight_layout(); plt.savefig(WORK / f"global_quicklook_{fname}.png", dpi=90); plt.close()
        tr = np.full(wa.shape[1:], np.nan); x = np.arange(wa.shape[0]) / 12
        for i in range(wa.shape[1]):
            for j in range(wa.shape[2]):
                s = wa[:, i, j]; k = np.isfinite(s)
                if k.sum() > 24: tr[i, j] = np.polyfit(x[k], s[k], 1)[0]
        plt.figure(figsize=(9, 4.5)); plt.imshow(tr, extent=[lo4[0], lo4[-1], la4[-1], la4[0]], cmap="RdBu", vmin=-5, vmax=5, aspect="auto")
        plt.colorbar(); plt.title("GRACE trend (cm/yr)"); plt.tight_layout(); plt.savefig(WORK / "global_quicklook_water_trend.png", dpi=90); plt.close()
        print("Saved work/global_quicklook_heat_change.png, _rain_mean.png, _water_trend.png - open them (Step 2 of the guide)")
    except Exception as e:
        print(f"(quick-look maps skipped: {e})")
    print(f"\nBuilt global data ({size/1e6:.1f} MB): heat, rain, water layers + confidence, places ({len(places)}), manifest")
    if fails:
        shutil.rmtree(OUT, ignore_errors=True)
        print(f"FAILED: {fails}\nNothing published: public/data/global was left exactly as it was."); sys.exit(1)
    if FINAL.exists(): shutil.rmtree(FINAL)
    OUT.rename(FINAL)
    print("ALL GLOBAL SELF-CHECKS PASS - published to public/data/global")

if __name__ == "__main__":
    main()