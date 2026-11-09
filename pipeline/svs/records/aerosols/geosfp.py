"""GEOS-FP tavg3_2d_aer_Nx — the model the aerosol visualizations were made from (report correction 8) — for one time:
the 3-hour mean whose window contains it (files centred hh:30, hh = 1, 4, …, 22), read from the NCCS archive
(portal.nccs.nasa.gov/datashare/gmao/geos-fp/das/; its OPeNDAP copy only keeps the last ~8 months). Only the species AOD
fields are read (HDF5 over HTTP, 1 MB blocks), never the whole 122 MB file. Cached as data_raw/5669/truth/geosfp_<time>.npz.
Usage: fields(datetime) → {'lat', 'lon', 'BCEXTTAU', …}."""
import datetime as dt, time
import numpy as np
from core.log import say
from svs.config import raw_dir
from . import SID

ARCHIVE = "https://portal.nccs.nasa.gov/datashare/gmao/geos-fp/das/Y{t:%Y}/M{t:%m}/D{t:%d}/GEOS.fp.asm.tavg3_2d_aer_Nx.{t:%Y%m%d_%H}30.V01.nc4"
TRIES = 5
VARS = ("DUEXTTAU", "SSEXTTAU", "SUEXTTAU", "BCEXTTAU", "OCEXTTAU", "TOTEXTTAU")

def window(when):
    """The tavg3 file whose 3-hour window holds `when` (windows 00–03, 03–06, …; stamped at the window's hh:30 + 1 h)."""
    start = when.replace(minute=0, second=0, microsecond=0) - dt.timedelta(hours=when.hour % 3)
    return start + dt.timedelta(hours=1)

def fields(when):
    import fsspec, h5py
    t = window(when)
    out = raw_dir(SID, "truth") / f"geosfp_{t:%Y%m%dT%H}30.npz"
    if out.exists(): return dict(np.load(out))
    url = ARCHIVE.format(t=t)
    for attempt in range(TRIES):
        try:
            with fsspec.open(url, "rb", block_size=2 ** 20, timeout=600) as f, h5py.File(f, "r") as h:
                res = {"lat": h["lat"][:].astype(np.float64), "lon": h["lon"][:].astype(np.float64)}
                for v in VARS:
                    if v in h: res[v] = np.where(h[v][0] > 1e14, np.nan, h[v][0]).astype(np.float32)
            break
        except Exception as e:                                   # the archive drops connections under load: back off, retry
            if attempt == TRIES - 1: raise
            say(f"GEOS-FP {t:%Y-%m-%d %H}:30: {e.__class__.__name__}; retry {attempt + 1}"); time.sleep(60 * (attempt + 1))
    np.savez_compressed(out, **res, url=url)
    say(f"GEOS-FP {t:%Y-%m-%d %H}:30 window: {[v for v in VARS if v in res]}")
    return res
