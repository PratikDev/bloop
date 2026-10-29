"""Validation sources for 5533/5518.
(a) GEOS-CF v1 (the only public archive covering Jul–Sep 2024: the v2 replay Zarr starts 2025-08-04 and the v2 datashare
    'ana' starts 2025, although the SVS page links v2): OPeNDAP opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/
    chm_tavg_1hr_g1440x721_v1, surface level. Frame k ↔ the hourly mean starting at its time (2024-07-01T00:30 + k h),
    fixed before reading; ±1 h fetched for PM2.5 and O3 as a reported sensitivity only. The model is read at the 1°
    cell centres (OPeNDAP stride 4 from index 2 = −89.5…89.5, −179.5…179.5: full slices took ~7 min each) and compared
    with the frame's 1° cell means. NOx = no + no2. Units from the values (v/v → ppbv when < 1e-3), recorded.
(b) OpenAQ v3 (key OPENAQ_API_KEY, server-side): hourly PM2.5 at every sensor within 25 km of Dhaka, 1 Jul – 14 Sep 2024.
Usage (from pipeline/): python -m svs.records.air.truth"""
import datetime as dt, json, time
import numpy as np
from core.log import say
from core.ref import T
from svs.config import raw_dir
from . import ALT, PERIOD
from .decode import VALID_DEG, VALID_EVERY

OPENDAP = "https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/chm_tavg_1hr_g1440x721_v1"
VARS = {"pm25": ["pm25_rh35_gcc"], "pm25_gocart": ["pm25_rh35_gocar"], "o3": ["o3"], "co": ["co"], "nox": ["no", "no2"]}
SENSITIVITY = ("pm25", "o3")
T0 = dt.datetime(2024, 7, 1, 0, 30)
DHAKA, RADIUS_M = (23.81, 90.41), 25000
OUT = raw_dir(ALT, "truth")

def read_centres(var, t, tries=5):
    """One hour of a surface field at the 1° cell centres; works with or without a 'lev' dimension."""
    idx = (t, 0) if "lev" in var.dimensions else (t,)
    for attempt in range(tries):
        try:
            return np.ma.filled(var[idx + (slice(2, None, 4), slice(2, None, 4))].astype(np.float64), np.nan)
        except (OSError, RuntimeError) as e:                     # network errors only; anything else is a bug
            say(f"retry {var.name} t={t} ({e.__class__.__name__})"); time.sleep(15 * (attempt + 1))
    raise RuntimeError(f"GEOS-CF {var.name} t={t}: no data after {tries} tries")

def geoscf():
    import netCDF4
    ds = netCDF4.Dataset(OPENDAP)
    i0 = 56952                                         # verified: time[56952] = 2024-07-01 00:30, time[i0+1800] = 2024-09-14 00:30
    lat, lon = ds.variables["lat"][2::4], ds.variables["lon"][2::4]
    if abs(float(lat[0]) + 89.5) > 1e-6 or abs(float(lon[0]) + 179.5) > 1e-6: raise RuntimeError("unexpected GEOS-CF grid")
    meta = {"source": OPENDAP, "time_index_of_2024-07-01T00:30": i0, "sampling": "1° cell centres (stride 4 from index 2)", "row0": "north",
            "units": {}, "times": {}}
    for k in range(0, 1801, VALID_EVERY):
        for off in (0, -1, 1):
            for name, parts in VARS.items():
                if off and name not in SENSITIVITY: continue
                path = OUT / f"geoscf_{name}_{k:04d}_{off:+d}.npy"
                if path.exists(): continue
                field = 0
                for v in parts:
                    field = field + read_centres(ds.variables[v], i0 + k + off)
                scale = 1e9 if np.nanmax(field) < 1e-3 else 1.0          # v/v → ppbv; kg m-3 → µg m-3
                meta["units"][name] = (("µg m-3 (kg m-3 × 1e9)" if scale == 1e9 else "µg m-3 (as stored)") if name.startswith("pm25")
                                       else ("ppbv (v/v × 1e9)" if scale == 1e9 else "as stored"))
                np.save(path, (field * scale)[::-1].astype(np.float32))    # GEOS-CF latitude ascends: flip to row 0 = north
            meta["times"][f"{k}{off:+d}"] = (T0 + dt.timedelta(hours=k + off)).isoformat()   # axis verified hourly from i0
        say(f"GEOS-CF frame {k}: {meta['times'][f'{k}+0']}")
    (OUT / "geoscf.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")

def openaq():
    key = T.secret("OPENAQ_API_KEY")
    if not key: raise T.Skip("OPENAQ_API_KEY not set")
    hdr = {"X-API-Key": key}
    locs, _ = T.jget("https://api.openaq.org/v3/locations", headers=hdr,
                     params=dict(coordinates=f"{DHAKA[0]},{DHAKA[1]}", radius=RADIUS_M, limit=100))
    sensors = []
    for l in locs.get("results", []):
        for s in l.get("sensors", []):
            if (s.get("parameter") or {}).get("name") == "pm25":
                sensors.append({"sensor": s["id"], "location": l.get("name"), "location_id": l.get("id"),
                                "provider": (l.get("provider") or {}).get("name"),
                                "lat": l["coordinates"]["latitude"], "lon": l["coordinates"]["longitude"]})
    rows = []
    for s in sensors:
        page = 1
        while True:
            js, _ = T.jget(f"https://api.openaq.org/v3/sensors/{s['sensor']}/hours", headers=hdr,
                           params={"datetime_from": f"{PERIOD[0]:%Y-%m-%dT%H:%M:%SZ}", "datetime_to": f"{PERIOD[1]:%Y-%m-%dT%H:%M:%SZ}",
                                   "limit": 1000, "page": page})
            res = js.get("results", [])
            rows += [{**s, "utc_from": r["period"]["datetimeFrom"]["utc"], "value": r["value"]} for r in res if r.get("value") is not None]
            if len(res) < 1000: break
            page += 1
            time.sleep(1)
        say(f"OpenAQ sensor {s['sensor']} ({s['location']}): {sum(1 for r in rows if r['sensor'] == s['sensor'])} hours")
    (OUT / "openaq_dhaka.json").write_text(json.dumps({"sensors": sensors, "rows": rows, "radius_m": RADIUS_M}, indent=0), encoding="utf-8")

def v2_start():
    """Where the public GEOS-CF v2 replay store begins, read from its own metadata (begin_date of its time axis)."""
    zm = json.loads(T.http("https://smce-geos-cf-public.s3.us-west-2.amazonaws.com/geos-cf-v2-rpl.zarr/.zmetadata").text)
    d = str(zm["metadata"]["time/.zattrs"]["begin_date"])
    return f"{d[:4]}-{d[4:6]}-{d[6:]}"

def main():
    if not (OUT / "openaq_dhaka.json").exists(): openaq()
    geoscf()
    meta = json.loads((OUT / "geoscf.json").read_text(encoding="utf-8"))
    meta["v2_replay_start"] = v2_start()
    (OUT / "geoscf.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
