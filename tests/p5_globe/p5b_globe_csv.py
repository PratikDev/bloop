# P5b: analyse a downloaded GLOBE clouds CSV (no API needed)
import sys, re, pandas as pd, numpy as np

CSV = sys.argv[1] if len(sys.argv) > 1 else "globe_clouds_2025.csv"   # <- your file name
BBOX = (88.0, 20.5, 92.8, 26.7)                                        # Bangladesh lon0, lat0, lon1, lat1

df = pd.read_csv(CSV, low_memory=False,index_col=False)
cols = list(df.columns)
def find(pattern):   # match on the part after any "protocol:" prefix
    return [c for c in cols if re.search(pattern, c.split(":")[-1], re.I)]
lat_c = next((c for c in find(r"lat") if pd.to_numeric(df[c], errors="coerce").notna().mean() > 0.5), None)
lon_c = next((c for c in find(r"lon") if pd.to_numeric(df[c], errors="coerce").notna().mean() > 0.5), None)
date_c = next(iter(find(r"measured|date|time")), None)
id_c = next(iter(find(r"observation.?id|measurement.?id|^id$|userid")), None)
country_c = next(iter(find(r"country")), None)
print(f"File: {CSV}\nRows: {len(df)}  Columns: {len(cols)}")
print(f"Detected -> lat: {lat_c} | lon: {lon_c} | date: {date_c} | id: {id_c} | country: {country_c}")
if not (lat_c and lon_c):
    print("Could not find lat/lon columns. First 40 column names:", cols[:40]); raise SystemExit

lat = pd.to_numeric(df[lat_c], errors="coerce"); lon = pd.to_numeric(df[lon_c], errors="coerce")
inside = df[(lon.between(BBOX[0], BBOX[2])) & (lat.between(BBOX[1], BBOX[3]))].copy()
if country_c:
    by_country = df[df[country_c].astype(str).str.contains("Bangladesh", case=False, na=False)]
    print(f"Rows with country = Bangladesh: {len(by_country)}")
print(f"Rows inside the Bangladesh box: {len(inside)}")

key = [id_c] if id_c else [c for c in (date_c, lat_c, lon_c) if c]
uniq = inside.drop_duplicates(subset=key)
print(f"UNIQUE observations in Bangladesh (by {key}): {len(uniq)}")
sites = uniq.groupby([lat_c, lon_c]).size().sort_values(ascending=False)
print(f"Distinct locations: {len(sites)}; top 5 locations (lat, lon, count):")
print(sites.head(5).to_string())
if date_c:
    d = pd.to_datetime(uniq[date_c], errors="coerce", utc=True)
    print(f"Date range: {d.min()} .. {d.max()}")
    print("Observations per month:"); print(d.dt.tz_localize(None).dt.to_period("M").value_counts().sort_index().to_string())
sat_cols = find(r"sat|match|goes|himawari|meteosat|aqua|terra|calipso|ceres|modis")
print(f"\nSatellite-match columns found ({len(sat_cols)}): {sat_cols[:25]}")
if sat_cols:
    filled = uniq[sat_cols].notna().any(axis=1).sum()
    print(f"Bangladesh observations with any satellite-match value: {filled}")
cloud_cols = find(r"cloud.?cover|total.?cloud|coverage")
print(f"Cloud-cover columns: {cloud_cols[:15]}")
uniq.to_csv("globe_bangladesh_unique.csv", index=False)
print("\nSaved globe_bangladesh_unique.csv")
