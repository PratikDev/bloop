"""Optional step (additive): GLOBAL history cube - click anywhere on Earth and hear its record.
Layers (monthly, only cells that have data):
  heat  = NASA GISTEMP v4 250 km (land only), anomaly vs 1951-1980, 1981 -> latest, 0.01 C steps
  rain  = GPCP v2.3 (land + ocean, 2.5 deg), mm/day, 1981 -> latest, 0.01 mm/day steps
  water = GRACE/GRACE-FO JPL mascons averaged to 3 deg (its true resolution), cm, 2002-04 -> latest, 0.1 cm steps
Plus: per-rain-cell confidence (GPCP vs independent GPCC gauges), a world places list, quick-look maps.

Outputs: public/data/global/{heat,rain,water}.i16.gz + .json, confidence.json, places.json, manifest.json
  Built in pipeline/work/global_building/ (never inside public/), and moved into public/data/global only if EVERY
  self-check passes. Any failure or crash deletes the build folder and leaves public/data/global exactly as it was;
  the script then exits 1 (run_all.py treats that as a warning). Quick-look maps: pipeline/work/global_quicklook_*.png

places.json (consistency with the Section 16 demo, by design):
  heat/rain = ANNUAL means (keys heat_annual_then_now / rain_annual_then_now) - intentionally not the demo's April-May /
  June-September numbers; the file says so in `basis` and `demo_note`.
  water: Bangladesh places use the Bangladesh box from context/grace.json - the SAME national record as the demo - never a
  single 3-deg cell (the cell nearest Dhaka is mostly Bay of Bengal). Other places use their 3-deg GRACE cell, labelled.
  Places in the same cell/box are flagged (<layer>_shares_cell_with / <layer>_same_record_as).

Self-checks (pre-written; any failure = nothing published, exit 1):
 S1 round-trip: decoding the written files reproduces the source values within half a step (1000 samples/layer)
 S2 Dhaka heat/rain: the global layers equal the already-verified context files (gistemp_bd / gpcp_bd) within half a step
 S2b Bangladesh places use exactly the context files' grid cells for heat and rain
 S2c Bangladesh places' water equals the demo's national record (grace.json Bangladesh box means)
 S2d water layer: two 3-deg cells re-averaged DIRECTLY from the raw GRACE file (separate code) equal the published cells
 S3 known answers (catch flipped/shifted grids): Arctic land warmed more than global land; rainiest latitude in 10S..15N;
    GRACE trend negative at NW India (30N,75E) and West Greenland (70N,50W)
 S4 coverage: heat 3000-9000 land cells and no open-ocean cell; rain all cells; GRACE gap months (2017-08..2018-04) empty
 S5 size < 25 MB
 S6 no value was clipped to fit int16 (no silent data loss)"""
import json, gzip, sys, shutil, warnings
import numpy as np, pandas as pd
from common import *
warnings.filterwarnings("ignore")

CTX = INPUTS / "context"
FINAL = PUBLIC / "global"
OUT = WORK / "global_building"                # outside public/: `next dev` can never serve a half-built folder
START = pd.Period("1981-01", "M")
BD_BOX = (88.0, 20.5, 93.0, 26.7)             # same box as build_context.py / grace.json

class BuildFailure(Exception):
    pass

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

def grace_file():
    return sorted(CTX.glob("GRCTellus*.nc"))[0]

def load_grace_3deg():
    import xarray as xr
    da = xr.open_dataset(grace_file(), engine="h5netcdf")["lwe_thickness"]
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

def raw_grace_cell(lat_c, lon_c):
    """Independent re-computation of ONE 3-deg cell straight from the raw 0.5-deg file (used only by check S2d)."""
    import xarray as xr
    da = xr.open_dataset(grace_file(), engine="h5netcdf")["lwe_thickness"]
    lon360 = lon_c % 360
    sub = da.where((abs(da["lat"] - lat_c) < 1.5) & (abs(da["lon"] - lon360) < 1.5), drop=True)
    w = np.cos(np.deg2rad(sub["lat"]))
    s = sub.weighted(w).mean(("lat", "lon")).to_series()
    s.index = pd.to_datetime(s.index).to_period("M")
    return s.groupby(level=0).mean()

# ---------------- pure processing ----------------
def normalize(lat, lon, arr):
    """lon -> -180..180 ascending, lat north -> south. arr: [time, lat, lon]."""
    lon = np.where(lon > 180, lon - 360, lon)
    jo = np.argsort(lon); io = np.argsort(-lat)
    return lat[io], lon[jo], arr[:, io][:, :, jo]

def monthly(times, arr, start):
    """Keep start..latest, fill missing months with NaN. Returns (PeriodIndex, arr, duplicate_months).
    Duplicate months are averaged; callers decide whether duplicates are allowed (GRACE) or fatal (GISTEMP/GPCP)."""
    df = pd.DataFrame({"t": times, "i": np.arange(len(times))})
    groups = df.groupby("t")["i"].apply(list)
    dups = sorted(str(p) for p, g in groups.items() if len(g) > 1 and p >= start)
    full = pd.period_range(start, groups.index.max(), freq="M")
    out = np.full((len(full),) + arr.shape[1:], np.nan, np.float32)
    for j, p in enumerate(full):
        if p in groups.index:
            with np.errstate(invalid="ignore"): out[j] = np.nanmean(arr[groups[p]], axis=0)
    return full, out, dups

def to_layer(name, lat, lon, months, arr, scale, min_valid_months, meta):
    """Keep cells with enough data; int16 = round(value*scale); -32768 = no data. Returns (cells, clipped_count)."""
    T, H, W = arr.shape
    flat = arr.reshape(T, H * W)
    cells = np.where(np.isfinite(flat).sum(0) >= min_valid_months)[0]
    vals = flat[:, cells].T * scale                                                  # [cells, months]
    finite = np.isfinite(vals)
    clipped = int(np.sum(finite & ((vals > 32767) | (vals < -32767))))
    q = np.clip(np.round(np.where(finite, vals, 0)), -32767, 32767)
    q[~finite] = -32768
    with gzip.open(OUT / f"{name}.i16.gz", "wb", compresslevel=9) as f: f.write(q.astype("<i2").tobytes())
    js = {"layer": name, "file": f"{name}.i16.gz", "compression": "gzip", "dtype": "int16 little-endian",
          "layout": "[cell][month] row-major; value = int16 / scale; -32768 = no data",
          "scale": scale, "month_start": str(months[0]), "n_months": int(T),
          "grid": {"lat": [round(float(x), 4) for x in lat], "lon": [round(float(x), 4) for x in lon],
                   "cell_id": "row * n_lon + col (row 0 = northernmost, col 0 = westernmost)"},
          "cells": [int(c) for c in cells], **meta}
    write_json(OUT / f"{name}.json", js)
    return cells, clipped

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
    stack = np.stack([ann[y] for y in ys]); n = np.isfinite(stack).sum(0)
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
    """Nearest cell with data; for heat (land only) a cell up to max_steps away is allowed and flagged as a neighbour."""
    la = np.array(js["grid"]["lat"]); lo = np.array(js["grid"]["lon"])
    r = int(np.argmin(np.abs(la - lat))); c = int(np.argmin(np.abs(((lo - lon + 180) % 360) - 180)))
    cells = {cid: i for i, cid in enumerate(js["cells"])}; W = len(lo); best = None
    for dr in range(-max_steps, max_steps + 1):
        for dc in range(-max_steps, max_steps + 1):
            rr, cc = r + dr, (c + dc) % W
            if 0 <= rr < len(la) and rr * W + cc in cells:
                d = dr * dr + dc * dc
                if best is None or d < best[0]: best = (d, cells[rr * W + cc], rr, cc)
    if best is None: return None
    return {"index": best[1], "lat": float(la[best[2]]), "lon": float(lo[best[3]]), "neighbour": best[0] > 0}

def hemi(v, pos, neg):
    return f"{abs(v):g}°{pos if v >= 0 else neg}"

def build():
    fails = []
    def check(name, ok, detail=""):
        print(f"[{'PASS' if ok else 'FAIL'}] {name}  {detail}")
        if not ok: fails.append(name)

    print("Loading GISTEMP ..."); la, lo, t, a = load_gistemp(); la, lo, a = normalize(la, lo, a)
    hm, ha, d1 = monthly(t, a, START)
    if d1: raise BuildFailure(f"duplicate months in GISTEMP {d1[:5]} - unexpected, not averaging")
    print("Loading GPCP ..."); la2, lo2, t2, a2 = load_gpcp(); la2, lo2, a2 = normalize(la2, lo2, a2)
    rm, ra, d2 = monthly(t2, a2, START)
    if d2: raise BuildFailure(f"duplicate months in GPCP {d2[:5]} - unexpected, not averaging")
    print("Loading GPCC ..."); la3, lo3, t3, a3 = load_gpcc(); la3, lo3, a3 = normalize(la3, lo3, a3)
    cm, ca, _ = monthly(t3, a3, START)
    print("Loading GRACE (averaging to 3 deg, takes a few minutes) ..."); la4, lo4, t4, a4 = load_grace_3deg()
    la4, lo4, a4 = normalize(la4, lo4, a4); wm, wa, wdup = monthly(t4, a4, pd.Period("2002-04", "M"))
    print(f"  GRACE: {len(wdup)} calendar months have two solutions - averaged explicitly: {wdup}")

    hcells, hclip = to_layer("heat", la, lo, hm, ha, 100, 24, {"units": "degC anomaly vs 1951-1980",
                             "dataset": "NASA GISTEMP v4 250 km (land only)", "credit": "GISTEMP Team, NASA Goddard Institute for Space Studies"})
    rcells, rclip = to_layer("rain", la2, lo2, rm, ra, 100, 24, {"units": "mm/day", "dataset": "GPCP v2.3 monthly, 2.5 deg",
                             "credit": "GPCP v2.3 (Adler et al.); data provided by NOAA PSL", "caveat": "Before 1988 GPCP uses a coarser estimate."})
    wcells, wclip = to_layer("water", la4, lo4, wm, wa, 10, 24, {"units": "cm water-equivalent anomaly vs 2004-2009",
                             "dataset": "GRACE/GRACE-FO JPL mascons RL06.3Mv04 CRI, averaged to 3 deg", "credit": "NASA/JPL PO.DAAC",
                             "gap_note": "No satellite measurements Jul 2017 - May 2018.", "duplicate_months_averaged": wdup})
    print(f"Layers: heat {len(hcells)} cells x {len(hm)} months; rain {len(rcells)} x {len(rm)}; water {len(wcells)} x {len(wm)}")

    # rain confidence: GPCP vs independent GPCC gauges, annual means 1981-2019 (pre-written thresholds)
    ga, cc = annual(rm, ra), annual(cm, ca)
    yrs = [y for y in range(1981, 2020) if y in ga and y in cc]
    G = np.stack([ga[y] for y in yrs]); Cg = np.stack([cc[y] for y in yrs])
    conf = {}
    if G.shape == Cg.shape and np.allclose(la2, la3) and np.allclose(lo2, lo3):
        W2 = G.shape[2]
        for cid in rcells:
            i, j = divmod(int(cid), W2); g, c = G[:, i, j], Cg[:, i, j]; ok = np.isfinite(g) & np.isfinite(c)
            if ok.sum() < 30: conf[int(cid)] = "satellite-only"; continue
            r = float(np.corrcoef(g[ok], c[ok])[0, 1]) if np.std(g[ok]) > 0 and np.std(c[ok]) > 0 else 0.0
            ratio = float(np.mean(g[ok]) / max(np.mean(c[ok]), 1e-6))
            conf[int(cid)] = "high" if r >= 0.7 and abs(ratio - 1) <= 0.2 else ("medium" if r >= 0.5 and abs(ratio - 1) <= 0.35 else "low")
    else:
        print("  NOTE: GPCP and GPCC grids differ - confidence flags skipped")
    write_json(OUT / "confidence.json", {"layer": "rain", "method": "GPCP vs GPCC (independent gauges), annual means 1981-2019: "
               "high = r >= 0.7 and mean within 20%; medium = r >= 0.5 and within 35%; low otherwise; satellite-only = no gauge data (e.g. oceans)",
               "flags": {str(k): v for k, v in conf.items()}})
    print(f"Rain confidence flags: {pd.Series(list(conf.values())).value_counts().to_dict() if conf else {}}")

    # ---- places ----
    hjs, hv = decode_layer("heat"); rjs, rv = decode_layer("rain"); wjs, wv = decode_layer("water")
    gis = json.load(open(PUBLIC / "context" / "gistemp_bd.json"))["cells"]
    gpc = json.load(open(PUBLIC / "context" / "gpcp_bd.json"))["cells"]
    grb = json.load(open(PUBLIC / "context" / "grace.json"))["boxes"]["Bangladesh"]
    bd_names = set(gis.keys())                                                       # Dhaka, Chattogram, Rajshahi, Sylhet
    def cell_window(js, v, idx, y0, y1):
        ms = pd.period_range(js["month_start"], periods=js["n_months"], freq="M"); ys = np.array([p.year for p in ms])
        s = v[idx][(ys >= y0) & (ys <= y1)]
        return None if np.isfinite(s).sum() < 24 else round(float(np.nanmean(s)), 2)
    places = []
    for name, plat, plon in PLACES:
        in_bd = name in bd_names
        # Bangladesh places: exactly the context files' cells (same as the demo / cities files)
        h = nearest_cell(hjs, gis[name]["lat"], gis[name]["lon"], 0) if in_bd else nearest_cell(hjs, plat, plon, 1)
        r = nearest_cell(rjs, gpc[name]["lat"], gpc[name]["lon"], 0) if in_bd else nearest_cell(rjs, plat, plon, 0)
        e = {"name": name, "lat": plat, "lon": plon, "in_bangladesh": in_bd}
        e["heat_cell"] = None if h is None else {k: h[k] for k in ("index", "lat", "lon")}
        e["heat_cell_is_neighbour"] = bool(h and h["neighbour"])
        e["rain_cell"] = None if r is None else {k: r[k] for k in ("index", "lat", "lon")}
        e["heat_annual_then_now"] = [cell_window(hjs, hv, h["index"], 1981, 1990), cell_window(hjs, hv, h["index"], 2016, 2025)] if h else None
        e["rain_annual_then_now"] = [cell_window(rjs, rv, r["index"], 1981, 1990), cell_window(rjs, rv, r["index"], 2016, 2025)] if r else None
        e["rain_confidence"] = conf.get(rjs["cells"][r["index"]]) if r else None
        if in_bd:
            e["water_cell"] = None
            e["water_region"] = {"kind": "box", "label": "Bangladesh box (lon 88–93, lat 20.5–26.7): the same national record as the Dhaka demo"}
            e["water_then_now"] = [round(float(grb["mean_A"]), 2), round(float(grb["mean_B"]), 2)]
        else:
            w = nearest_cell(wjs, plat, plon, 0)
            e["water_cell"] = None if w is None else {k: w[k] for k in ("index", "lat", "lon")}
            e["water_region"] = None if w is None else {"kind": "cell", "label": (f"3° GRACE cell {hemi(w['lat'] - 1.5, 'N', 'S')}–"
                f"{hemi(w['lat'] + 1.5, 'N', 'S')}, {hemi(w['lon'] - 1.5, 'E', 'W')}–{hemi(w['lon'] + 1.5, 'E', 'W')}")}
            e["water_then_now"] = [cell_window(wjs, wv, w["index"], 2003, 2006), cell_window(wjs, wv, w["index"], 2021, 2024)] if w else None
        places.append(e)
    # same cell (or same box) = same record; the first listed place is the reference
    keyfn = {"heat": lambda p: p["heat_cell"] and p["heat_cell"]["index"], "rain": lambda p: p["rain_cell"] and p["rain_cell"]["index"],
             "water": lambda p: "BD_box" if p["water_region"] and p["water_region"]["kind"] == "box" else (p["water_cell"] and p["water_cell"]["index"])}
    for layer, kf in keyfn.items():
        for i, e in enumerate(places):
            k = kf(e)
            e[f"{layer}_shares_cell_with"] = [o["name"] for o in places if o is not e and k is not None and kf(o) == k]
            e[f"{layer}_same_record_as"] = next((o["name"] for o in places[:i] if k is not None and kf(o) == k), None)
    write_json(OUT / "places.json", {
        "note": "Computed with the same datasets as the Bangladesh files. Only Dhaka's April–May heat and June–September rain were "
                "cross-checked against independent records (P1b); the annual values here were not separately cross-checked. "
                "Places in the same grid cell (or the same box) are the same record: <layer>_same_record_as names the first listed "
                "place. Coordinates are approximate.",
        "basis": {"heat": "annual mean anomaly vs 1951–1980 (°C), 1981–1990 vs 2016–2025",
                  "rain": "annual mean (mm/day), 1981–1990 vs 2016–2025",
                  "water": "mean of monthly values (cm), 2003–2006 vs 2021–2024; Bangladesh places: national box, other places: their 3° cell"},
        "demo_note": "These heat and rain values are ANNUAL, so for Bangladesh cities they differ on purpose from the Dhaka demo and "
                     "cities files (April–May heat, June–September rain). Label them 'annual' in the UI. Bangladesh water here is "
                     "the same national record as the demo.",
        "places": places})
    write_json(OUT / "manifest.json", {"layers": ["heat", "rain", "water"], "files": ["heat.json", "rain.json", "water.json",
               "confidence.json", "places.json"], "generated_utc": now_utc(),
               "disclosure": "Three NASA records at their own resolutions (about 2, 2.5 and 3 degrees). Missing data = silence. "
                             "Voices moving together does not mean one causes the other."})

    # ---------------- self-checks ----------------
    rng = np.random.default_rng(0)
    for name, src, cells, js, v in (("heat", ha, hcells, hjs, hv), ("rain", ra, rcells, rjs, rv), ("water", wa, wcells, wjs, wv)):
        T = src.shape[0]; flat = src.reshape(T, -1)
        ci = rng.integers(0, len(cells), 1000); ti = rng.integers(0, T, 1000)
        a_src = flat[ti, cells[ci]]; a_dec = v[ci, ti]
        both = np.isfinite(a_src) & np.isfinite(a_dec); nan_ok = np.array_equal(np.isfinite(a_src), np.isfinite(a_dec))
        half = 0.5 / js["scale"] + 1e-6; md = float(np.max(np.abs(a_src[both] - a_dec[both]))) if both.any() else 0.0
        check(f"S1 {name} round-trip", nan_ok and md <= half, f"max diff {md:.4f} (limit {half:.4f}); missing identical: {nan_ok}")
    for label, src_cell, js, v, key in (("heat", gis["Dhaka"], hjs, hv, "anom_C"), ("rain", gpc["Dhaka"], rjs, rv, "mm_per_day")):
        cell = nearest_cell(js, src_cell["lat"], src_cell["lon"], 0)
        ms = pd.period_range(js["month_start"], periods=js["n_months"], freq="M")
        ref = pd.Series(src_cell[key], index=pd.PeriodIndex(src_cell["months"], freq="M"), dtype="float64").reindex(ms).values
        got = v[cell["index"]]; both = np.isfinite(ref) & np.isfinite(got)
        md = float(np.max(np.abs(ref[both] - got[both]))) if both.any() else 99
        check(f"S2 Dhaka {label} equals the verified context file", both.sum() > 100 and md <= 0.5 / js["scale"] + 1e-6,
              f"{both.sum()} months compared; max diff {md:.4f}")
    bad = [p["name"] for p in places if p["in_bangladesh"] and not (
           p["heat_cell"] and abs(p["heat_cell"]["lat"] - gis[p["name"]]["lat"]) < 1e-3 and abs(((p["heat_cell"]["lon"] - gis[p["name"]]["lon"] + 180) % 360) - 180) < 1e-3
           and p["rain_cell"] and abs(p["rain_cell"]["lat"] - gpc[p["name"]]["lat"]) < 1e-3 and abs(((p["rain_cell"]["lon"] - gpc[p["name"]]["lon"] + 180) % 360) - 180) < 1e-3)]
    check("S2b Bangladesh places use the context files' heat/rain cells", not bad, f"mismatched: {bad}")
    bad = [p["name"] for p in places if p["in_bangladesh"] and p["water_then_now"] != [round(float(grb["mean_A"]), 2), round(float(grb["mean_B"]), 2)]]
    check("S2c Bangladesh water = the demo's national record (grace.json box)", not bad,
          f"expected {[round(float(grb['mean_A']), 2), round(float(grb['mean_B']), 2)]}; mismatched: {bad}")
    for place, plat, plon in (("NW India", 28.5, 73.5), ("West Greenland", 70.5, -49.5)):
        try:
            c = nearest_cell(wjs, plat, plon, 0); raw = raw_grace_cell(c["lat"], c["lon"])
            ms = pd.period_range(wjs["month_start"], periods=wjs["n_months"], freq="M")
            ref = raw.reindex(ms).values; got = wv[c["index"]]; both = np.isfinite(ref) & np.isfinite(got)
            md = float(np.max(np.abs(ref[both] - got[both]))) if both.any() else 99
            check(f"S2d water cell {place} ({c['lat']}, {c['lon']}) = direct re-average of the raw GRACE file",
                  both.sum() > 100 and md <= 0.05 + 1e-6, f"{both.sum()} months; max diff {md:.4f} cm (limit 0.05)")
        except Exception as ex:
            check(f"S2d water cell {place}", False, f"could not re-compute from the raw file: {ex}")
    ann = annual(hm, ha); A = window_mean(ann, 1981, 1990, 8); B = window_mean(ann, 2016, 2025, 8)
    d = B - A; wlat = np.cos(np.deg2rad(la))[:, None] * np.ones((1, len(lo))); ok = np.isfinite(d)
    glob_ = np.sum(d[ok] * wlat[ok]) / np.sum(wlat[ok]); arc = ok & (la[:, None] > 60)
    arctic = np.sum(d[arc] * wlat[arc]) / np.sum(wlat[arc])
    check("S3 Arctic land warmed more than global land (documented)", arctic > glob_, f"Arctic {arctic:+.2f} C vs global land {glob_:+.2f} C")
    with np.errstate(invalid="ignore"): zon = np.nanmean(np.nanmean(ra, 0), 1)
    lat_max = float(la2[int(np.nanargmax(zon))])
    check("S3 rainiest latitude band is the tropics (ITCZ, documented)", -10 <= lat_max <= 15, f"max zonal rain at {lat_max:+.2f} deg")
    for place, plat, plon in (("NW India", 30, 75), ("West Greenland", 70, -50)):
        c = nearest_cell(wjs, plat, plon, 0); s = wv[c["index"]]; x = np.arange(len(s)); okk = np.isfinite(s)
        tr = np.polyfit(x[okk] / 12, s[okk], 1)[0]
        check(f"S3 GRACE trend negative at {place} (documented)", tr < 0, f"{tr:+.2f} cm/yr at cell ({c['lat']}, {c['lon']})")
    heat_ocean = nearest_cell(hjs, -48, -125, 0) is None
    check("S4 heat coverage (land only)", 3000 <= len(hcells) <= 9000 and heat_ocean, f"{len(hcells)} cells; open ocean empty: {heat_ocean}")
    check("S4 rain coverage (all cells)", len(rcells) == ra.shape[1] * ra.shape[2], f"{len(rcells)} of {ra.shape[1]*ra.shape[2]}")
    wms = [str(p) for p in pd.period_range(wjs["month_start"], periods=wjs["n_months"], freq="M")]
    gap = [wms.index(m) for m in ("2017-08", "2017-12", "2018-04") if m in wms]
    check("S4 GRACE gap months empty", len(gap) == 3 and np.all(~np.isfinite(wv[:, gap])), f"months checked {len(gap)}")
    size = sum(p.stat().st_size for p in OUT.glob("*") if p.is_file())
    check("S5 global data < 25 MB", size < 25e6, f"{size/1e6:.1f} MB")
    check("S6 no value clipped to fit int16", hclip == rclip == wclip == 0, f"clipped: heat {hclip}, rain {rclip}, water {wclip}")

    # quick-look maps (outside the published folder)
    try:
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        for fname, img, title, cmap, vmin, vmax, lat_ax, lon_ax in (
                ("heat_change", d, "GISTEMP change 1981-90 -> 2016-25 (C)", "RdBu_r", -3, 3, la, lo),
                ("rain_mean", np.nanmean(ra, 0), "GPCP mean rain (mm/day)", "Blues", 0, 10, la2, lo2)):
            plt.figure(figsize=(9, 4.5)); plt.imshow(img, extent=[lon_ax[0], lon_ax[-1], lat_ax[-1], lat_ax[0]], cmap=cmap, vmin=vmin, vmax=vmax, aspect="auto")
            plt.colorbar(); plt.title(title); plt.tight_layout(); plt.savefig(WORK / f"global_quicklook_{fname}.png", dpi=90); plt.close()
        tr = np.full(wa.shape[1:], np.nan); x = np.arange(wa.shape[0]) / 12
        for i in range(wa.shape[1]):
            for j in range(wa.shape[2]):
                s = wa[:, i, j]; k = np.isfinite(s)
                if k.sum() > 24: tr[i, j] = np.polyfit(x[k], s[k], 1)[0]
        plt.figure(figsize=(9, 4.5)); plt.imshow(tr, extent=[lo4[0], lo4[-1], la4[-1], la4[0]], cmap="RdBu", vmin=-5, vmax=5, aspect="auto")
        plt.colorbar(); plt.title("GRACE trend (cm/yr)"); plt.tight_layout(); plt.savefig(WORK / "global_quicklook_water_trend.png", dpi=90); plt.close()
        print("Saved work/global_quicklook_heat_change.png, _rain_mean.png, _water_trend.png - open them (Part E of the guide)")
    except Exception as ex:
        print(f"(quick-look maps skipped: {ex})")
    print(f"\nBuilt global data ({size/1e6:.1f} MB): heat, rain, water layers + confidence, places ({len(places)}), manifest")
    if fails: raise BuildFailure(f"self-checks failed: {fails}")

def main():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    try:
        build()
    except BaseException as ex:                    # any failure, crash or Ctrl+C: clean up, publish nothing
        shutil.rmtree(OUT, ignore_errors=True)
        print(f"FAILED: {ex}\nNothing published: public/data/global was left exactly as it was.")
        sys.exit(1)
    old = WORK / "global_previous"                 # the old published folder is parked outside public/ during the swap
    if old.exists(): shutil.rmtree(old)
    if FINAL.exists(): shutil.move(str(FINAL), str(old))
    shutil.move(str(OUT), str(FINAL))
    shutil.rmtree(old, ignore_errors=True)
    print("ALL GLOBAL SELF-CHECKS PASS - published to public/data/global")

if __name__ == "__main__":
    main()