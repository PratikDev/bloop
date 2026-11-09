"""GEDI L2B footprints for 4950 (report correction 1: the visualization is built from L2B RH100, SVS dataset 1131). Fixed
before any L2B file was read: GEDI02_B version 002 (LP DAAC; DOI 10.5067/GEDI/GEDI02_B.002; version 003 also exists),
the first granule that starts on or after 00:00 UTC on the 1st and on the 15th of each month from May 2019 to April
2020 (the global view's period, April 2019 – April 2020); every beam's rh100 (cm → m), l2b_quality_flag and
geolocation lat/lon_lowestmode; shots with quality flag 1 kept. Granules are downloaded whole (GEDI is not on Earthdata
cloud OPeNDAP; partial HDF5 reads took ~200 s per beam), read and deleted. Writes data_raw/4950/l2b/<granule>.npz.
Usage (from pipeline/): python -m svs.records.forest.l2b"""
import datetime as dt, json
import numpy as np
from core.log import say
from core.ref import T
from svs import cmr, disk
from svs.config import raw_dir
from . import SID

OUT = raw_dir(SID, "l2b")
SHORT, VERSION, CONCEPT = "GEDI02_B", "002", "C2142776747-LPCLOUD"
MONTHS = [(2019 + (m - 1) // 12, (m - 1) % 12 + 1) for m in range(5, 17)]       # May 2019 … April 2020
DAYS = (1, 15)

def pick():
    import earthaccess
    out = []
    for y, m in MONTHS:
        for d in DAYS:
            t0 = dt.datetime(y, m, d)
            res = earthaccess.search_data(short_name=SHORT, version=VERSION, temporal=(t0.isoformat(), (t0 + dt.timedelta(hours=12)).isoformat()), count=20)
            res = sorted(res, key=lambda r: r["umm"]["TemporalExtent"]["RangeDateTime"]["BeginningDateTime"])
            if res: out.append(res[0])
    return out

def read(path):
    import h5py
    lat, lon, h = [], [], []
    with h5py.File(path, "r") as f:
        for b in (k for k in f if k.startswith("BEAM")):
            g = f[b]
            q = g["l2b_quality_flag"][:] == 1
            lat.append(g["geolocation/lat_lowestmode"][:][q]); lon.append(g["geolocation/lon_lowestmode"][:][q])
            h.append(g["rh100"][:][q].astype(np.float32) / 100)
    return np.concatenate(lat).astype(np.float32), np.concatenate(lon).astype(np.float32), np.concatenate(h)

def main():
    import earthaccess
    T.earthdata()
    log = []
    for g in pick():
        name = g["umm"]["GranuleUR"]
        out = OUT / f"{name}.npz"
        if out.exists(): continue
        path = earthaccess.download([g], str(OUT), show_progress=False)[0]
        lat, lon, h = read(path)
        np.savez_compressed(out, lat=lat, lon=lon, rh100_m=h)
        __import__("os").remove(path); disk.record()
        log.append({"granule": name, "shots_q1": int(len(h)), "median_rh100_m": float(np.median(h)) if len(h) else None})
        say(f"L2B {name}: {len(h):,} quality shots, median RH100 {log[-1]['median_rh100_m']}")
    (OUT / "l2b.json").write_text(json.dumps({"short_name": SHORT, "version": VERSION, "concept": CONCEPT, "granules": log}, indent=1), encoding="utf-8")
    cmr.citation(CONCEPT)

if __name__ == "__main__":
    main()
