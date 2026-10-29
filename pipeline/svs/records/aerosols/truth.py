"""Per-type aerosol optical depth for 5669's hour (19 Aug 2025 20:00 UTC). GEOS-FP's OPeNDAP archive is rolling (about
eight months of tavg3_2d_aer_Nx on 29 Oct 2026), so it no longer holds that day; the comparison uses MERRA-2
M2T1NXAER (GES DISC), a different model in the same GEOS family, and says so. Pairing, fixed before reading: the mean of
the two hourly averages either side of 20:00 (indices 19 and 20). OPeNDAP DAP4 subset of five variables (names checked in
the file; whole daily file streamed): dust, sea salt, sulfate, black carbon and organic carbon extinction AOD at 550 nm.
Saved as data_raw/5669/truth/merra2_20250819T20.npz (row 0 = north, col 0 = 180° W, 0.5° × 0.625°).
Usage (from pipeline/): python -m svs.records.aerosols.truth"""
import numpy as np
from core.log import say
from core.ref import T
from svs import cmr
from svs.config import raw_dir
from . import SID

COLLECTION = "C1276812830-GES_DISC"
GRANULE = "M2T1NXAER.5.12.4:MERRA2_400.tavg1_2d_aer_Nx.20250819.nc4"
VARS = ("DUEXTTAU", "SSEXTTAU", "SUEXTTAU", "BCEXTTAU", "OCEXTTAU")
HOURS = (19, 20)
OUT = raw_dir(SID, "truth") / "merra2_20250819T20.npz"

URL = "https://data.gesdisc.earthdata.nasa.gov/data/MERRA2/M2T1NXAER.5.12.4/2025/08/MERRA2_400.tavg1_2d_aer_Nx.20250819.nc4"

def main():
    """The whole daily file is streamed (the DAP4 subset returned HTTP 500 on 29 Oct 2026), reduced, and deleted."""
    if OUT.exists(): return np.load(OUT)
    import netCDF4
    s = T.earthdata().get_requests_https_session()
    raw = raw_dir(SID, "truth_raw") / URL.rsplit("/", 1)[1]
    with s.get(URL, stream=True, timeout=900) as r:
        r.raise_for_status()
        with open(raw, "wb") as f:
            for chunk in r.iter_content(1 << 20): f.write(chunk)
    with netCDF4.Dataset(raw) as ds:
        lat, lon = np.asarray(ds["lat"][:]), np.asarray(ds["lon"][:])
        out = {v: np.ma.filled(ds[v][HOURS[0]:HOURS[1] + 1].astype(np.float64), np.nan).mean(0)[::-1] for v in VARS}
        units = {v: getattr(ds[v], "units", "") for v in VARS}
    size = raw.stat().st_size
    raw.unlink()
    np.savez_compressed(OUT, lat=lat[::-1], lon=lon, bytes=size, **out)
    cmr.citation(COLLECTION)
    say(f"MERRA-2 {GRANULE} ({size / 1e6:.0f} MB, deleted): {list(out)} at hours {HOURS}; units {units}")
    return np.load(OUT)

if __name__ == "__main__":
    main()
