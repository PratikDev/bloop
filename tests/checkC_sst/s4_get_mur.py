# Step 8: read the real MUR SST values at the same points, for 3 candidate dates
import datetime as dt
import earthaccess, xarray as xr, pandas as pd, numpy as np

CANDIDATE_DATES = ["2026-09-21", "2026-09-22", "2026-09-23"]   # <- see guide, Step 8.2
MODE = "stream"      # "stream" reads only what it needs; "download" saves whole files (~hundreds of MB each)
W, H = 4096, 2048    # frame size from Step 5

earthaccess.login(strategy="interactive", persist=True)
pts = pd.read_csv("points.csv")
dx, dy = 360 / W, 180 / H

for date in CANDIDATE_DATES:
    d = dt.date.fromisoformat(date)
    res = earthaccess.search_data(short_name="MUR-JPL-L4-GLOB-v4.1",
                                  temporal=(str(d - dt.timedelta(days=1)), str(d + dt.timedelta(days=1))))
    tag = date.replace("-", "")
    res = [r for r in res if any(l.split("/")[-1].startswith(tag) for l in r.data_links())]
    if not res:
        print(f"{date}: no MUR file found (may not be published yet)"); continue
    print(f"{date}: using {res[0].data_links()[0].split('/')[-1]}")
    if MODE == "download":
        f = earthaccess.download(res[:1], "mur_files")[0]
    else:
        f = earthaccess.open(res[:1])[0]
    ds = xr.open_dataset(f, engine="h5netcdf")
    sst = ds["analysed_sst"].isel(time=0)
    centre, boxmean = [], []
    for _, p in pts.iterrows():
        lon0 = -180 + p.x * dx; lat1 = 90 - p.y * dy
        box = sst.sel(lat=slice(lat1 - dy, lat1), lon=slice(lon0, lon0 + dx))
        boxmean.append(float(box.mean()) - 273.15)
        centre.append(float(sst.sel(lat=p.lat, lon=p.lon, method="nearest")) - 273.15)
        print(".", end="", flush=True)
    pts[f"mur_centre_{tag}"] = np.round(centre, 3)
    pts[f"mur_box_{tag}"] = np.round(boxmean, 3)
    print(f"\n{date}: done")
    pts.to_csv("points_with_mur.csv", index=False)   # saved after each date, in case of a crash
print("Saved points_with_mur.csv")
