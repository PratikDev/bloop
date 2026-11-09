"""Independent NASA lightning climatologies for 5011 (GHRC, Earthdata Login): LIS/OTD 0.5° High Resolution Full Climatology
(HRFC, flash rate density, flashes km⁻² yr⁻¹) and Monthly Climatology (HRMC, 12 months), 1995–2014, from TRMM LIS and OTD,
not the ISS LIS that 5011 shows. Saved in data_raw/5011/truth/ (git-ignored); citations from CMR.
Usage (from pipeline/): python -m svs.records.lightning.truth"""
import numpy as np
from core.log import say
from core.ref import T
from svs import cmr
from svs.config import raw_dir
from . import SID

HRFC = ("C1995863244-GHRC_DAAC", "https://data.ghrc.earthdata.nasa.gov/ghrcw-protected/lohrfc__2.3.2015/LISOTD_HRFC_V2.3.2015.nc")
HRMC = ("C1995863290-GHRC_DAAC", "https://data.ghrc.earthdata.nasa.gov/ghrcw-protected/lohrmc__2.3.2015/LISOTD_HRMC_V2.3.2015.nc")
OUT = raw_dir(SID, "truth")

def fetch():
    s = T.earthdata().get_requests_https_session()
    for cid, url in (HRFC, HRMC):
        path = OUT / url.rsplit("/", 1)[1]
        if path.exists(): continue
        with s.get(url, stream=True, timeout=600) as r:
            r.raise_for_status()
            with open(path, "wb") as f:
                for chunk in r.iter_content(1 << 20): f.write(chunk)
        cmr.citation(cid)
        say(f"fetched {path.name} ({path.stat().st_size / 1e6:.1f} MB)")

def grid(path, var):
    """(values with row 0 = north, col 0 = 180° W, lat, lon) of a climatology variable."""
    import netCDF4
    with netCDF4.Dataset(path) as ds:
        v = np.ma.filled(ds[var][:].astype(np.float64), np.nan)
        lat, lon = ds["Latitude"][:], ds["Longitude"][:]
        dims = ds[var].dimensions
    if dims[-2:] == ("Longitude", "Latitude") or (len(dims) >= 2 and "lon" in dims[-2].lower()): v = np.swapaxes(v, -1, -2)
    if lat[0] < lat[-1]: v, lat = v[..., ::-1, :], lat[::-1]
    return v, np.asarray(lat), np.asarray(lon)

if __name__ == "__main__":
    fetch()
