"""Step 5: small regional JSON files for Then vs Now / Place History / GRACE / FIRMS / NDVI / GLOBE, and truth images.
Inputs are the files you already downloaded in the tests (see L1 guide, Step 0)."""
import json, re, shutil
import pandas as pd, xarray as xr
from common import *

CELLS = {"Dhaka": (23.81, 90.41), "Chattogram": (22.36, 91.78), "Rajshahi": (24.37, 88.60), "Sylhet": (24.90, 91.87)}
BOXES = {"Bangladesh": (88.0, 20.5, 93.0, 26.7), "NW_India": (72.0, 26.0, 78.0, 32.0)}
CTX = INPUTS / "context"

def nearest_series(da, lat, lon):
    lons = da["lon"].values
    lon_q = lon % 360 if lons.max() > 180 else lon
    s = da.sel(lat=lat, lon=lon_q, method="nearest")
    return s, float(s["lat"]), float(s["lon"])

def gistemp():
    ds = xr.open_dataset(CTX / "gistemp250.nc")
    out = {}
    for name, (la, lo) in CELLS.items():
        s, glat, glon = nearest_series(ds["tempanomaly"], la, lo)
        ser = s.to_series(); ser.index = pd.to_datetime(ser.index); ser = ser[ser.index >= "1951-01-01"]
        out[name] = {"lat": glat, "lon": glon, "months": [f"{t:%Y-%m}" for t in ser.index],
                     "anom_C": [None if pd.isna(v) else round(float(v), 3) for v in ser.values]}
    return {"dataset": "NASA GISTEMP v4 (250 km smoothing), anomalies vs 1951-1980", "units": "degC",
            "credit": "GISTEMP Team, NASA Goddard Institute for Space Studies", "cells": out}

def gpcp():
    ds = xr.open_dataset(CTX / "gpcp_precip.mon.mean.nc", decode_times=False)
    out = {}
    for name, (la, lo) in CELLS.items():
        s, glat, glon = nearest_series(ds["precip"], la, lo)
        ser = s.to_series(); ser.index = pd.Timestamp("1800-01-01") + pd.to_timedelta(ser.index.astype(float), unit="D")
        out[name] = {"lat": glat, "lon": glon, "months": [f"{t:%Y-%m}" for t in ser.index],
                     "mm_per_day": [None if pd.isna(v) else round(float(v), 3) for v in ser.values]}
    return {"dataset": "GPCP v2.3 monthly (satellite + gauge), 2.5 deg", "units": "mm/day",
            "caveat": "Before 1988 GPCP uses a coarser estimate; cells are ~275 km wide.",
            "credit": "GPCP v2.3 (Adler et al.); data provided by NOAA PSL", "cells": out}

def gpcc():
    ds = xr.open_dataset(CTX / "gpcc_full_v2020_2.5.nc")
    out = {}
    for name, (la, lo) in CELLS.items():
        s, glat, glon = nearest_series(ds["precip"], la, lo)
        ser = s.to_series(); ser.index = pd.to_datetime(ser.index); ser = ser / ser.index.days_in_month
        out[name] = {"lat": glat, "lon": glon, "months": [f"{t:%Y-%m}" for t in ser.index],
                     "mm_per_day": [None if pd.isna(v) else round(float(v), 3) for v in ser.values]}
    return {"dataset": "GPCC Full Data v2020 (rain gauges), 2.5 deg, to 2019", "units": "mm/day",
            "credit": "GPCC, Deutscher Wetterdienst; data provided by NOAA PSL", "cells": out}

def grace():
    f = sorted(CTX.glob("GRCTellus*.nc"))
    if not f: raise SystemExit("GRACE file missing in inputs/context/")
    ds = xr.open_dataset(f[0], engine="h5netcdf"); lwe = ds["lwe_thickness"]
    out = {}
    for name, (x0, y0, x1, y1) in BOXES.items():
        if lwe["lon"].values.max() > 180: x0, x1 = x0 % 360, x1 % 360
        box = lwe.sel(lat=slice(y0, y1), lon=slice(x0, x1))
        s = box.weighted(np.cos(np.deg2rad(box["lat"]))).mean(("lat", "lon")).to_series()
        s.index = pd.to_datetime(s.index)
        yrs = (s.index - s.index[0]).days / 365.25
        trend = float(np.polyfit(yrs, s.values, 1)[0])
        mean_a = float(s["2003-01":"2006-12"].mean()); mean_b = float(s["2021-01":"2024-12"].mean())
        per = s.index.to_period("M"); dup = sorted({str(x) for x in per[per.duplicated()]})
        if dup: print(f"  GRACE {name}: {len(dup)} calendar months have two solutions (mid-dates in the same month): {dup} - averaged, and recorded in grace.json")
        monthly = s.groupby(per).mean()
        full = pd.period_range(monthly.index.min(), monthly.index.max(), freq="M")
        filled = monthly.reindex(full)
        out[name] = {"box_lon_lat": [x0, y0, x1, y1], "months": [str(p) for p in full],
                     "cm": [None if pd.isna(v) else round(float(v), 3) for v in filled.values],
                     "missing_months": int(filled.isna().sum()), "duplicate_months_averaged": dup, "trend_cm_per_yr": round(trend, 3),
                     "mean_A": round(mean_a, 3), "mean_B": round(mean_b, 3), "window_A": "2003-01..2006-12", "window_B": "2021-01..2024-12"}
    return {"dataset": "GRACE/GRACE-FO JPL mascons RL06.3Mv04 CRI (lwe_thickness, anomalies vs 2004-2009)", "units": "cm",
            "gap_note": "No satellite measurements Jul 2017 - May 2018 (between GRACE and GRACE-FO).",
            "credit": "GRACE/GRACE-FO JPL RL06.3Mv04 CRI mascons, NASA/JPL PO.DAAC", "boxes": out}

def firms():
    d = json.load(open(CTX / "firms_cases.json"))
    return {"dataset": "NASA FIRMS active fires (MODIS_SP standard; VIIRS_SNPP_SP)", "rule": "Compare MODIS with MODIS only; single years are example years.",
            "credit": "NASA FIRMS (LANCE/ESDIS)", "cases": d}

def ndvi():
    return {"dataset": "MODIS MOD13Q1 250 m 16-day NDVI (ORNL DAAC web service)", "caveat": "Single 250 m pixels.",
            "credit": "MODIS MOD13Q1, ORNL DAAC", "points": json.load(open(CTX / "ndvi_points.json"))}

def globe():
    csvs = sorted(CTX.glob("globe*bangladesh*.csv")) or sorted(CTX.glob("*.csv"))
    if not csvs: raise SystemExit("GLOBE CSV missing in inputs/context/")
    df = pd.read_csv(csvs[0], low_memory=False)
    short = lambda c: c.split(":")[-1]
    find = lambda pat: [c for c in df.columns if re.search(pat, short(c), re.I)]
    lat = next(c for c in find(r"lat") if pd.to_numeric(df[c], errors="coerce").notna().mean() > 0.5)
    lon = next(c for c in find(r"lon") if pd.to_numeric(df[c], errors="coerce").notna().mean() > 0.5)
    tcol = (find(r"measured") or find(r"date|time"))[0]
    cloud = find(r"cloud.?cover|total.?cloud|coverage")
    sat = [c for c in find(r"sat|match|goes|himawari|meteosat|aqua|terra|calipso|ceres|modis") if c not in cloud]
    country = [c for c in df.columns if re.search(r"country", short(c), re.I)]     # lets the duet filter to Bangladesh
    keep = [tcol, lat, lon] + country + cloud + sat
    def clean(v):                                      # NaN/inf -> null (JSON has no NaN; null = no data)
        if v is None: return None
        if isinstance(v, float) and not np.isfinite(v): return None
        if isinstance(v, (np.floating,)): return None if not np.isfinite(v) else float(v)
        if isinstance(v, (np.integer,)): return int(v)
        return v
    rows = [{k: clean(v) for k, v in r.items()} for r in df[keep].astype(object).to_dict(orient="records")]
    # Bangladesh test with the national outline (Natural Earth 1:50m), if fetch_bd_boundary.py has been run
    bfile = CTX / "bangladesh_boundary.geojson"
    if bfile.exists():
        geom = json.load(open(bfile))["features"][0]["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        def inside(x, y):
            hit = False
            for poly in polys:
                ring_hits = []
                for ring in poly:                          # outer ring then holes
                    r = np.asarray(ring); xs, ys = r[:, 0], r[:, 1]; x2, y2 = np.roll(xs, -1), np.roll(ys, -1)
                    cross = ((ys > y) != (y2 > y)) & (x < (x2 - xs) * (y - ys) / np.where(y2 != ys, y2 - ys, 1e-12) + xs)
                    ring_hits.append(bool(cross.sum() % 2))
                if ring_hits and ring_hits[0] and not any(ring_hits[1:]): hit = True
            return hit
        for r in rows:
            la_, lo_ = r.get(lat), r.get(lon)
            r["in_bangladesh"] = bool(inside(float(lo_), float(la_))) if la_ is not None and lo_ is not None else None
        n_in = sum(1 for r in rows if r["in_bangladesh"])
        print(f"  GLOBE: {n_in} of {len(rows)} observations inside Bangladesh (Natural Earth 1:50m outline)")
    else:
        print("  GLOBE: no bangladesh_boundary.geojson - run fetch_bd_boundary.py to enable the Bangladesh filter")
    print(f"  GLOBE: {len(rows)} rows from {csvs[0].name}; time='{tcol}', lat='{lat}', lon='{lon}', country columns {country}")
    print(f"         cloud-cover columns: {cloud[:8]}\n         satellite columns: {sat[:12]}")
    return {"dataset": "NASA GLOBE Clouds 2025 v3.4 matched (ground vs satellite)", "rows": len(rows),
            "columns": {"time": tcol, "lat": lat, "lon": lon, "country": country, "cloud_cover": cloud, "satellite": sat,
                        "in_bangladesh": "in_bangladesh" if (CTX / "bangladesh_boundary.geojson").exists() else None},
            "note": "Two perspectives, not right vs wrong.", "credit": "NASA GLOBE Program", "observations": rows}

def main():
    out = PUBLIC / "context"
    jobs = [("gistemp_bd.json", gistemp), ("gpcp_bd.json", gpcp), ("gpcc_bd.json", gpcc), ("grace.json", grace),
            ("firms.json", firms), ("ndvi.json", ndvi), ("globe_bd.json", globe)]
    for name, fn in jobs:
        obj = fn(); p = write_json(out / name, obj)
        print(f"Wrote context/{name} ({p.stat().st_size/1024:.0f} KB)")
    g = json.load(open(out / "grace.json"))["boxes"]
    for k, v in g.items():
        print(f"  GRACE {k}: trend {v['trend_cm_per_yr']:+.2f} cm/yr; A {v['mean_A']:+.2f}; B {v['mean_B']:+.2f}; missing months {v['missing_months']}")
    for src, dst in [("truth/compare.png", "sst_compare.png"), ("truth/rain_compare.png", "rain_compare.png"),
                     ("truth/p1b_crosscheck.png", "crosscheck.png")]:
        s = INPUTS / src
        if s.exists(): shutil.copy(s, PUBLIC / "truth" / dst); print(f"Copied truth/{dst}")
        else: print(f"  MISSING inputs/{src} (copy it from your test folder)")

if __name__ == "__main__":
    main()