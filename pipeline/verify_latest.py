"""Step 8 (recommended): re-verify the LATEST frames against NASA source data (needs Earthdata Login).
SST: 60 random ocean points vs MUR SST for 3 candidate dates. Rain: 150 rain + 150 dry points vs IMERG Late.
Same pass rules as Check C / D2. Writes work/verify_latest.json (not published unless you choose to)."""
import json, datetime as dt
import earthaccess, h5py, xarray as xr
from common import *

SST_MEDIAN, SST_P90 = 1.0, 2.0
RAIN_AGREE, RAIN_LOG = 0.90, 0.15
rng = np.random.default_rng(11)
earthaccess.login(strategy="interactive", persist=True)
man = json.load(open(RAW / "manifest.json"))
report = {}

# ---- SST ----
full = np.load(WORK / "sst_fullres.npy"); H, W = full.shape
lat = 90 - (np.arange(H) + 0.5) * 180 / H; lon = -180 + (np.arange(W) + 0.5) * 360 / W
ys, xs = np.where(np.isfinite(full) & (np.abs(lat)[:, None] < 60))
pick = rng.choice(len(ys), 60, replace=False); ys, xs = ys[pick], xs[pick]
ft = man["products"]["sst"]["frame_time_utc"]; d0 = dt.date.fromisoformat(ft[:10])
best = None
for off in (-1, 0, 1):
    day = d0 + dt.timedelta(days=off); tag = day.strftime("%Y%m%d")
    res = [r for r in earthaccess.search_data(short_name="MUR-JPL-L4-GLOB-v4.1", temporal=(str(day - dt.timedelta(days=1)), str(day + dt.timedelta(days=1))))
           if any(l.split("/")[-1].startswith(tag) for l in r.data_links())]
    if not res: print(f"SST {day}: no MUR file yet"); continue
    fobj = earthaccess.open(res[:1])[0]
    ds = xr.open_dataset(fobj, engine="h5netcdf"); sst = ds["analysed_sst"].isel(time=0)
    mur = np.array([float(sst.sel(lat=lat[y], lon=lon[x], method="nearest")) - 273.15 for y, x in zip(ys, xs)])
    ds.close()
    try: fobj.close()
    except Exception: pass
    err = full[ys, xs] - mur; ok = np.isfinite(err)
    stats = {"date": str(day), "n": int(ok.sum()), "median_abs": float(np.median(np.abs(err[ok]))),
             "p90_abs": float(np.percentile(np.abs(err[ok]), 90)), "bias": float(np.mean(err[ok]))}
    print(f"SST vs MUR {day}: median {stats['median_abs']:.2f}, p90 {stats['p90_abs']:.2f}, bias {stats['bias']:+.2f} (n={stats['n']})")
    if best is None or stats["median_abs"] < best["median_abs"]: best = stats
if best:
    best["pass"] = best["median_abs"] <= SST_MEDIAN and best["p90_abs"] <= SST_P90 and best["n"] >= 45
    report["sst"] = best; print(f"SST RESULT: {'PASS' if best['pass'] else 'FAIL'} (best date {best['date']})")

# ---- Rain ----
from convert_rain import invert_rain
from common import load_params
P = load_params()
RUNS = [("GPM_3IMERGHHL", "Late"), ("GPM_3IMERGHHE", "Early")]

def imerg_file(ft):
    pattern = ft.strftime("%Y%m%d-S%H%M%S")
    for short, run in RUNS:
        res = [r for r in earthaccess.search_data(short_name=short, temporal=(str(ft - dt.timedelta(hours=1)), str(ft + dt.timedelta(hours=1))))
               if any(pattern in l.split("/")[-1] for l in r.data_links())]
        if res:
            return earthaccess.download(sorted(res, key=lambda r: r.data_links()[0])[-1:], str(WORK / "imerg"))[0], run
    return None, None

def verify_rain(rate, ft, label):
    path, run = imerg_file(ft)
    if path is None:
        print(f"Rain {label} {ft:%Y-%m-%d %H:%M}: no IMERG Late or Early file yet"); return None
    with h5py.File(path, "r") as f:
        pr = f["Grid/precipitation"][0, :, :]
    wy, wx = np.where(rate > 0); dy, dx = np.where(rate == 0)
    pw = rng.choice(len(wy), min(150, len(wy)), replace=False); pd_ = rng.choice(len(dy), 150, replace=False)
    im_w = pr[wx[pw], 1799 - wy[pw]].astype(float); im_d = pr[dx[pd_], 1799 - dy[pd_]].astype(float)
    agree = (np.sum(im_w >= 0.1) + np.sum(im_d < 0.1)) / (len(pw) + len(pd_))
    both = im_w >= 0.1
    le = np.log10(rate[wy[pw], wx[pw]][both] / im_w[both])
    st = {"frame": label, "frame_time_utc": f"{ft:%Y-%m-%dT%H:%M:%SZ}", "imerg_run": run, "file": Path(path).name,
          "agreement": float(agree), "median_abs_log10": float(np.median(np.abs(le))),
          "median_log10_bias": float(np.median(le)), "n_both_rain": int(both.sum())}
    st["pass"] = st["agreement"] >= RAIN_AGREE and st["median_abs_log10"] <= RAIN_LOG
    print(f"Rain {label} vs IMERG {run} {st['file']}: agreement {agree*100:.1f}%, median |log10| {st['median_abs_log10']:.3f}, "
          f"bias {st['median_log10_bias']:+.3f} -> {'PASS' if st['pass'] else 'FAIL'}")
    return st

ft = dt.datetime.fromisoformat(man["products"]["rain"]["frame_time_utc"].replace("Z", "+00:00"))
st = verify_rain(np.load(WORK / "rain_fullres.npy"), ft, "latest frame")
if st is None:                                   # newest frame too fresh: verify the newest time-lapse frame that has data
    seq = sorted((RAW / "sequence").glob("*.png"), key=lambda f: date_in(f.name) or dt.datetime.min.replace(tzinfo=dt.timezone.utc), reverse=True)
    for f in seq[:24]:
        t = date_in(f.name)
        if t is None or t >= ft: continue
        _, _, rate, _, _, _, _, _ = invert_rain(f, P)
        st = verify_rain(rate, t, f"time-lapse frame {f.name}")
        if st is not None: break
if st is not None:
    report["rain"] = st
    print(f"RAIN RESULT: {'PASS' if st['pass'] else 'FAIL'} ({st['frame']}, IMERG {st['imerg_run']})")
else:
    print("RAIN RESULT: NOT TESTED - no IMERG file available for any recent frame yet; re-run later.")
write_json(WORK / "verify_latest.json", report); print("Saved work/verify_latest.json")
# record the result in the published metadata so the truth panel can show "also checked on today's frame"
for prod in ("sst", "rain"):
    mj = PUBLIC / "latest" / f"{prod}.json"
    if prod in report and mj.exists():
        m = json.load(open(mj)); m["latest_check"] = {**report[prod], "checked_utc": now_utc()}
        write_json(mj, m); print(f"Added latest_check to public/data/latest/{prod}.json ({'PASS' if report[prod]['pass'] else 'FAIL'})")