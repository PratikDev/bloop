"""NASA OSCAR surface currents for the 3912 period, the data behind the record's currents voice (team decision A3: the
frames' motion is not a data claim). OSCAR_L4_OC_FINAL_V2.0 (PO.DAAC, C2098858642-POCLOUD) through PO.DAAC OPeNDAP:
u and v only, at the 1° cell centres (stride 4 from index 2: lat −89.5…89.5, lon 0.5…359.5), one file per day,
Earthdata Login session. Saved as data_raw/3912/oscar_daily/<YYYYMMDD>.npz (u, v in m/s, row 0 = north, col 0 = 180° W).
Usage (from pipeline/): python -m svs.records.currents.oscar"""
import datetime as dt
import numpy as np
from core.log import say
from core.ref import T
from svs import frames
from svs.config import raw_dir
from . import SID

COLLECTION = "C2098858642-POCLOUD"
URL = "https://opendap.earthdata.nasa.gov/collections/{c}/granules/oscar_currents_final_{d:%Y%m%d}.dap.nc4"
CE = "/u[0][2:4:1439][1:4:718];/v[0][2:4:1439][1:4:718];/lat[1:4:718];/lon[2:4:1439]"
OUT = raw_dir(SID, "oscar_daily")

def days():
    times = frames.times_from_list((raw_dir(SID) / "dates.txt").read_text(encoding="utf-8")).values()
    first, last = min(times).date(), max(times).date()
    return [first + dt.timedelta(days=i) for i in range((last - first).days + 1)]

def to_grid(a, lat, lon):
    """(lon, lat) as served → (lat north-first, lon from 180° W)."""
    g = np.asarray(a, np.float64).T[::-1]
    order = np.argsort(((np.asarray(lon) + 180) % 360) - 180)
    return g[:, order]

def main():
    import netCDF4
    s = T.earthdata().get_requests_https_session()
    for d in days():
        path = OUT / f"{d:%Y%m%d}.npz"
        if path.exists(): continue
        for attempt in range(5):
            r = s.get(URL.format(c=COLLECTION, d=d), params={"dap4.ce": CE}, timeout=300)
            if r.status_code == 200: break
            say(f"OSCAR {d}: HTTP {r.status_code}, retry"); __import__("time").sleep(10 * (attempt + 1))
        else:
            say(f"OSCAR {d}: no data"); continue
        ds = netCDF4.Dataset("oscar", memory=r.content)
        lat, lon = ds["lat"][:], ds["lon"][:]
        u = to_grid(np.ma.filled(ds["u"][0], np.nan), lat, lon); v = to_grid(np.ma.filled(ds["v"][0], np.nan), lat, lon)
        np.savez_compressed(path, u=u.astype(np.float32), v=v.astype(np.float32))
    say(f"OSCAR daily: {len(list(OUT.glob('*.npz')))} days in {OUT}")

if __name__ == "__main__":
    main()
