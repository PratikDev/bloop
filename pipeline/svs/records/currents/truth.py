"""Validation sources for 3912, fetched with earthaccess (Earthdata Login from .env.local / _netrc) and reduced on the fly
to the decode grid (0.5°): each NetCDF is opened, averaged, saved as a small .npz and deleted.
  MUR25-JPL-L4-GLOB-v04.2 (C2036880657-POCLOUD, PO.DAAC): MUR analysed_sst on 0.25°, 2002– (confirmed in CMR);
  OSCAR_L4_OC_FINAL_V2.0 (C2098858642-POCLOUD, PO.DAAC): surface currents u, v on 0.25°, 1993 – 2026-01 (confirmed).
Dates: every WEEKLY-th decoded frame (its UTC date). Variable names are read from the files and recorded.
Usage (from pipeline/): python -m svs.records.currents.truth"""
import datetime as dt, json
import numpy as np
from core.log import say
from core.ref import T
from svs import frames
from svs.regrid import to_cells
from svs.config import raw_dir
from . import SID, STEP

ROOT = raw_dir(SID)
WEEKLY, GRID_DEG = 7, 0.5
SOURCES = {"mur": "MUR25-JPL-L4-GLOB-v04.2", "oscar": "OSCAR_L4_OC_FINAL_V2.0"}

def sample_dates():
    times = frames.times_from_list((ROOT / "dates.txt").read_text(encoding="utf-8"))
    nums = sorted(times)[::STEP]
    return [(n, times[n]) for n in nums[::WEEKLY]]

def regrid(da):
    """(…lat…, …lon…) field → 0.5° cells; the lat/lon dimensions are found by name on the variable itself (OSCAR keeps
    them as 'latitude'/'longitude' dims with 'lat'/'lon' coordinates; MUR as 'lat'/'lon')."""
    lat_d = next(d for d in da.dims if "lat" in d); lon_d = next(d for d in da.dims if "lon" in d)
    da = da.transpose(lat_d, lon_d)
    coord = lambda d: next((da.coords[c].values for c in da.coords if da.coords[c].dims == (d,) and c != d), da[d].values)
    return to_cells(da.values, coord(lat_d), coord(lon_d), GRID_DEG)

def reduce_file(kind, path):
    import xarray as xr
    ds = xr.open_dataset(path, engine="h5netcdf")
    names = {"vars": list(ds.data_vars), "dims": dict(ds.sizes)}
    if kind == "mur":
        out = {"sst": regrid(ds["analysed_sst"].isel(time=0) - 273.15)}
    else:
        out = {"u": regrid(ds["u"].isel(time=0)), "v": regrid(ds["v"].isel(time=0))}
    ds.close()
    return out, names

def main():
    ea = T.earthdata()
    meta = {"sources": {}, "dates": []}
    for kind, short in SOURCES.items():
        d = raw_dir(SID, "truth", kind)
        for n, t in sample_dates():
            day = t.date()
            out = d / f"{day:%Y%m%d}.npz"
            if out.exists(): continue
            res = ea.search_data(short_name=short, temporal=(f"{day}T00:00:00", f"{day}T23:59:59"))
            if not res: say(f"{short}: no granule on {day}"); continue
            files = ea.download(res[:1], str(d))
            vals, names = reduce_file(kind, files[0])
            np.savez_compressed(out, **vals)
            meta["sources"][kind] = {"short_name": short, "granule_example": res[0]["umm"]["GranuleUR"], **names}
            for f in files: __import__("os").remove(f)
            say(f"{short} {day}: reduced to 0.5°")
    meta["dates"] = [(n, t.strftime("%Y-%m-%dT%H:%M:%SZ")) for n, t in sample_dates()]
    old = json.loads((ROOT / "truth" / "truth.json").read_text()) if (ROOT / "truth" / "truth.json").exists() else {}
    old.update({k: v for k, v in meta.items() if v})
    (ROOT / "truth" / "truth.json").write_text(json.dumps(old, indent=1, default=str), encoding="utf-8")

if __name__ == "__main__":
    main()
