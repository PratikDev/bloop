"""CAMS EAC4 global reanalysis (Copernicus Atmosphere Data Store, CC-BY since 2 Jul 2025; terms accepted by the team on
the ADS): one cached request per call site. A different model from GEOS (IFS + CAMS chemistry, assimilating MODIS AOD
and other satellites): the 'different model' rung of the independence ladder.
Credentials: ADSAPI_URL / ADSAPI_KEY from .env.local (never printed).
Usage: retrieve(request dict, path) → path; load(path) → dataset (zip members merged); to_1deg(dataarray) → (180, 360)
array, row 0 = north, col 0 = 180° W. download() is shared with the CDS (ERA5): env "CDSAPI" or "ADSAPI"."""
import os, zipfile
import numpy as np
import core.env  # noqa: F401
from .onboard.sources import to_1deg as points_to_1deg

DATASET = "cams-global-reanalysis-eac4"
MOLAR = {"carbon_monoxide": 28.010, "nitrogen_dioxide": 46.006, "nitrogen_monoxide": 30.006, "ozone": 47.998}
AIR = 28.9647

def download(env, dataset, request, path):
    """One cached CDS/ADS request; written to a .part file first so an interrupted download is never reused."""
    import cdsapi
    if path.exists(): return path
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_suffix(path.suffix + ".part")
    cdsapi.Client(url=os.environ[f"{env}_URL"], key=os.environ[f"{env}_KEY"], quiet=True).retrieve(dataset, request, str(part))
    part.replace(path)
    return path

def retrieve(request, path):
    return download("ADSAPI", DATASET, {**request, "data_format": "netcdf"}, path)

def load(path):
    """The ADS zips multi-level requests (data_mlev.nc + data_sfc.nc): members merged into one dataset."""
    import xarray as xr
    if not zipfile.is_zipfile(path): return xr.open_dataset(path)
    out = path.with_suffix("")
    if not out.exists():
        with zipfile.ZipFile(path) as z: z.extractall(out)
    parts = [xr.open_dataset(f).drop_vars("model_level", errors="ignore").squeeze() for f in sorted(out.glob("*.nc"))]
    return xr.merge(parts, compat="override")

def to_1deg(da):
    lat, lon = np.meshgrid(da["latitude"].values, da["longitude"].values, indexing="ij")
    return points_to_1deg(lat.ravel(), lon.ravel(), np.asarray(da.values, np.float64).ravel())

def ppbv(mmr, gas):
    """Mass mixing ratio (kg/kg) → ppbv."""
    return mmr * AIR / MOLAR[gas] * 1e9
