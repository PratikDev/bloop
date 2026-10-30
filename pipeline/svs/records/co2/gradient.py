"""5196 / 5436, report correction 2: the latitude-band CO2 gradient against observations. Fixed 30 Oct before either
source was read:
  bands   — 10° latitude bands from 60° S to 60° N, on each of the 12 decoded frame dates (Jan–Mar 2020);
  frame   — the band mean of decoded 0.5° cells above the colorbar's white end (cells in the white end are only '≤');
  OCO-2   — OCO2_L2_Lite_FP V11.2r (C2912085112-GES_DISC; the newest is 11.3r), soundings with xco2_quality_flag 0 on
            the same UTC day (the file whose name carries the date), via Earthdata cloud OPeNDAP;
  GHG     — US GHG Center oco2geos-co2-daygrid-v10r (CC0-1.0), the same day's xco2, through its raster API at the native grid;
  metrics — per source: Spearman of band means pooled over the dates (the frames are relative values: shape, not level),
            and the north-minus-south difference (30–60° N minus 30–60° S band means) in each, its sign compared.
DYAMOND is a free-running nature run, so day-to-day weather cannot match; the band structure can.
Writes data_raw/5436/gradient.json.
Usage (from pipeline/): python -m svs.records.co2.gradient"""
import datetime as dt, io, json, re, sys
from urllib.parse import quote
import numpy as np
import requests
from core.log import say
from core.ref import T
from svs import cmr, validate as V
from svs.config import raw_dir
from . import ALT

ROOT = raw_dir(ALT)
BANDS = [(lo, lo + 10) for lo in range(-60, 60, 10)]
OCO2 = "C2912085112-GES_DISC"
GHG = "https://earth.gov/ghgcenter/api/stac/collections/oco2geos-co2-daygrid-v10r/items"
GHG_TIF = ("https://earth.gov/ghgcenter/api/raster/collections/oco2geos-co2-daygrid-v10r/items/{item}"
           "/bbox/-180.3125,-90.25,179.6875,90.25/576x361.tif?assets=xco2")   # the item's native grid; its S3 asset is not public
WHITE_TOP_FALLBACK = 408.0
sys.path.append(r"D:\Jukebox\tools\pylib")

def band_means(lat, val):
    return np.array([np.nanmean(val[(lat >= lo) & (lat < hi)]) if ((lat >= lo) & (lat < hi) & np.isfinite(val)).any() else np.nan for lo, hi in BANDS])

def frame_bands(ppm, white_top):
    lat = (90 - (np.arange(ppm.shape[0]) + 0.5) * 180 / ppm.shape[0])[:, None] * np.ones(ppm.shape)
    v = np.where(ppm > white_top, ppm, np.nan)
    return band_means(lat.ravel(), v.ravel())

def oco2_day(session, day):
    path = raw_dir(ALT, "oco2") / f"{day:%Y%m%d}.npz"
    if path.exists(): z = np.load(path); return z["lat"], z["xco2"]
    r = requests.get("https://cmr.earthdata.nasa.gov/search/granules.json", timeout=120, params={
        "collection_concept_id": OCO2, "temporal": f"{day - dt.timedelta(days=1):%Y-%m-%d}T00:00:00Z,{day + dt.timedelta(days=1):%Y-%m-%d}T23:59:59Z",
        "page_size": 50}).json()["feed"]["entry"]
    g = next((e["title"] for e in r if f"_LtCO2_{day:%y%m%d}_" in e["title"]), None)
    if g is None:                                                    # no Lite file for the day: a gap, recorded as all-NaN bands
        say(f"OCO-2 Lite: no file for {day}"); return np.array([]), np.array([])
    import netCDF4
    x = session.get(f"https://opendap.earthdata.nasa.gov/collections/{OCO2}/granules/{quote(g)}.dap.nc4",
                    params={"dap4.ce": "/latitude;/xco2;/xco2_quality_flag"}, timeout=300)
    x.raise_for_status()
    ds = netCDF4.Dataset("x", memory=x.content)
    q = np.asarray(ds["xco2_quality_flag"][:]) == 0
    lat, xco2 = np.asarray(ds["latitude"][:])[q], np.asarray(ds["xco2"][:])[q]
    np.savez_compressed(path, lat=lat, xco2=xco2, granule=g)
    return lat, xco2

def ghg_day(day):
    import tifffile
    path = raw_dir(ALT, "ghg") / f"{day:%Y%m%d}.npz"
    if path.exists(): z = np.load(path); return z["lat"], z["xco2"]
    it = requests.get(GHG, params={"datetime": f"{day:%Y-%m-%d}T00:00:00Z/{day:%Y-%m-%d}T23:59:59Z", "limit": 1}, timeout=120).json()["features"][0]
    raw = requests.get(GHG_TIF.format(item=it["id"]), timeout=300).content
    with tifffile.TiffFile(io.BytesIO(raw)) as t:
        a = t.pages[0].asarray().astype(np.float64)
        tags = t.pages[0].tags
        sy = tags["ModelPixelScaleTag"].value[1]; y0 = tags["ModelTiepointTag"].value[4]
    if a.ndim == 3: a = np.where(a[..., 1] > 0, a[..., 0], np.nan)     # the raster API adds a validity band
    a[a <= 0] = np.nan
    lat = (y0 - (np.arange(a.shape[0]) + 0.5) * sy)[:, None] * np.ones(a.shape)
    np.savez_compressed(path, lat=lat.ravel(), xco2=a.ravel(), item=it["id"])
    return lat.ravel(), a.ravel()

def ns(b):
    idx = lambda lo, hi: [i for i, (a, _) in enumerate(BANDS) if lo <= a < hi]
    return float(np.nanmean(b[idx(30, 60)]) - np.nanmean(b[idx(-60, -30)]))

def main():
    g = np.load(ROOT / "grids.npz")
    val = json.loads((raw_dir().parent / "public" / "data" / "official" / "co2_5196" / "validation.json").read_text(encoding="utf-8"))
    white = next(c for c in val["checks"] if c["id"] == "a_synthetic_round_trip")["metrics"]["uncertain_spans_ppm"][0][1]
    s = T.earthdata().get_requests_https_session()
    rows = []
    for ppm, t in zip(g["ppm"], g["times"]):
        day = dt.datetime.fromisoformat(str(t).replace("Z", "+00:00")).date()
        f = frame_bands(ppm.astype(float), white)
        o = band_means(*oco2_day(s, day))
        h = band_means(*ghg_day(day))
        rows.append({"date": f"{day}", "frame": f.tolist(), "oco2": o.tolist(), "ghg": h.tolist()})
        say(f"5196 {day}: N–S frame {ns(f):+.2f}, OCO-2 {ns(o):+.2f}, GHG {ns(h):+.2f} ppm")
    F = np.array([r["frame"] for r in rows]); out = {"bands": BANDS, "white_top_ppm": white, "rows": rows}
    for k in ("oco2", "ghg"):
        S = np.array([r[k] for r in rows])
        rho, n = V.spearman(F.ravel(), S.ravel())
        dn = [ns(np.array(r["frame"])) for r in rows]; ds = [ns(np.array(r[k])) for r in rows]
        out[k] = {"spearman_band_means": rho, "n": n, "ns_frame_median": float(np.nanmedian(dn)), "ns_source_median": float(np.nanmedian(ds)),
                  "ns_sign_agreement": float(np.mean([np.sign(a) == np.sign(b) for a, b in zip(dn, ds) if np.isfinite(a) and np.isfinite(b)]))}
    (ROOT / "gradient.json").write_text(json.dumps(out, indent=1, default=float), encoding="utf-8")
    cmr.citation(OCO2)
    say(f"5196 gradient: OCO-2 {out['oco2']}; GHG {out['ghg']}")

if __name__ == "__main__":
    main()
