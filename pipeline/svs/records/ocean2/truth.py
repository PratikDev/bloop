"""Regional truth for 5425 (fixed before reading): the mean over each current's box (CURRENTS) on each decoded frame's date of
  MUR25-JPL-L4-GLOB-v04.2 analysed_sst (PO.DAAC, C2036880657-POCLOUD; K → °C) and
  SMAP RSS L3 SSS 8-day running mean V5 sss_smap (PO.DAAC, C2208425700-POCLOUD; PSU),
read as DAP4 subsets of the box through Earthdata cloud OPeNDAP. Cached as data_raw/5425/truth/<source>_<date>_<current>.json.
Usage: box_mean(source, date, box) — called by validate.py."""
import datetime as dt, json
from urllib.parse import quote
import numpy as np
import requests
from core.ref import T
from svs.config import raw_dir
from . import SID

SOURCES = {"mur": ("C2036880657-POCLOUD", "analysed_sst", -273.15), "smap": ("C2208425700-POCLOUD", "sss_smap", 0.0)}
_S = None

def session():
    global _S
    _S = _S or T.earthdata().get_requests_https_session()
    return _S

def granule(cid, day):
    r = requests.get("https://cmr.earthdata.nasa.gov/search/granules.json", timeout=120, params={
        "collection_concept_id": cid, "temporal": f"{day:%Y-%m-%d}T00:00:00Z,{day:%Y-%m-%d}T23:59:59Z", "page_size": 5}).json()["feed"]["entry"]
    if not r: raise RuntimeError(f"{cid}: no granule on {day}")
    return r[0]["title"]

def dap(cid, title, ce):
    import netCDF4
    url = f"https://opendap.earthdata.nasa.gov/collections/{cid}/granules/{quote(title)}.dap.nc4"
    for attempt in range(5):
        r = session().get(url, params={"dap4.ce": ce}, timeout=300)
        if r.status_code == 200: return netCDF4.Dataset("x", memory=r.content)
    r.raise_for_status()

def box_mean(source, day, box, name):
    path = raw_dir(SID, "truth") / f"{source}_{day:%Y%m%d}_{name.replace(' ', '_')}.json"
    if path.exists(): return json.loads(path.read_text(encoding="utf-8"))
    cid, var, offset = SOURCES[source]
    try:
        title = granule(cid, day)
    except RuntimeError as e:                              # a day the source has no file (e.g. SMAP's Aug 2022 safe mode)
        return {"source": source, "granule": None, "box": list(box), "mean": None, "gap": str(e)}
    ds = dap(cid, title, "/lat;/lon"); lat, lon = np.asarray(ds["lat"][:]), np.asarray(ds["lon"][:])
    w, s, e, n = box
    lon_w, lon_e = (w % 360, e % 360) if lon.max() > 180 else (w, e)
    yi = np.nonzero((lat >= s) & (lat <= n))[0]; xi = np.nonzero((lon >= lon_w) & (lon <= lon_e))[0]
    lead = "[0:1:0]" if source == "mur" else ""
    ds = dap(cid, title, f"/{var}{lead}[{yi.min()}:1:{yi.max()}][{xi.min()}:1:{xi.max()}]")
    a = np.ma.filled(ds[var][:].astype(np.float64), np.nan) + offset
    out = {"source": source, "granule": title, "box": list(box), "mean": float(np.nanmean(a)), "median": float(np.nanmedian(a)),
           "valid_share": float(np.isfinite(a).mean())}
    path.write_text(json.dumps(out), encoding="utf-8")
    return out
