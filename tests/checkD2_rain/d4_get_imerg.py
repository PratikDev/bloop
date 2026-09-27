# Step R5: read the real IMERG half-hourly rain rate at the same points (Early and Late runs,
# for the half-hour starting at the frame time and the one ending at it)
import earthaccess, h5py, numpy as np, pandas as pd

DATE = "2026-09-18"          # date of the frame (from its filename)
CANDIDATES = [
    ("early_S0000", "GPM_3IMERGHHE", "20260918-S000000"),
    ("early_S2330", "GPM_3IMERGHHE", "20260917-S233000"),
    ("late_S0000",  "GPM_3IMERGHHL", "20260918-S000000"),
    ("late_S2330",  "GPM_3IMERGHHL", "20260917-S233000"),
]
TEMPORAL = ("2026-09-17T23:00:00", "2026-09-18T01:00:00")

earthaccess.login(strategy="interactive", persist=True)
pts = pd.read_csv("rain_points.csv")

for label, short, pattern in CANDIDATES:
    res = earthaccess.search_data(short_name=short, temporal=TEMPORAL)
    res = [r for r in res if any(pattern in l.split("/")[-1] for l in r.data_links())]
    if not res:
        print(f"{label}: no file found for {pattern}"); continue
    res = sorted(res, key=lambda r: r.data_links()[0])[-1:]     # newest version if several
    print(f"{label}: {res[0].data_links()[0].split('/')[-1]}")
    path = earthaccess.download(res, "imerg_files")[0]
    with h5py.File(path, "r") as f:
        lat = f["Grid/lat"][:]; lon = f["Grid/lon"][:]
        pr = f["Grid/precipitation"][0, :, :]                     # shape (lon, lat)
        pl = f["Grid/probabilityLiquidPrecipitation"][0, :, :] if "probabilityLiquidPrecipitation" in f["Grid"] else None
    if label == CANDIDATES[0][0]:
        print(f"  grid check: lon {lon[0]:.2f}..{lon[-1]:.2f} ({len(lon)}), lat {lat[0]:.2f}..{lat[-1]:.2f} ({len(lat)})"
              "  (expect -179.95..179.95 (3600), -89.95..89.95 (1800))")
    li = pts.x.values.astype(int)
    la = (len(lat) - 1 - pts.y.values).astype(int)                # frame row 0 = north
    v = pr[li, la].astype(float); v[v < 0] = np.nan
    pts[f"imerg_{label}"] = np.round(v, 4)
    if pl is not None:
        p = pl[li, la].astype(float); p[p < 0] = np.nan
        pts[f"pliquid_{label}"] = p
pts.to_csv("rain_points_with_imerg.csv", index=False)
print("Saved rain_points_with_imerg.csv")
