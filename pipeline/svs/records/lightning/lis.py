"""NASA ISS LIS science flashes (isslis_v3_fin, GHRC, Earthdata Login) for the validation windows: N_WINDOWS 10-day windows
spread evenly in date over the period (chosen by date alone, before any frame was dated). Every orbit file of a window is
streamed (download, keep flash time/lat/lon and the view-time cells — lat, lon, effective seconds — delete), THREADS at a
time. Saved as data_raw/5011/lis/<window start>.npz.
Usage (from pipeline/): python -m svs.records.lightning.lis"""
import datetime as dt, json
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import requests
from core.log import say
from core.ref import T
from svs import disk
from svs.config import raw_dir
from . import ISSLIS, SID, WINDOW_DAYS, period

N_WINDOWS, THREADS = 12, 16
OUT = raw_dir(SID, "lis")
TAI93 = dt.datetime(1993, 1, 1, tzinfo=dt.timezone.utc)

def windows():
    start, end = period()
    span = (end - start - dt.timedelta(days=WINDOW_DAYS)).total_seconds()
    return [start + dt.timedelta(seconds=span * i / (N_WINDOWS - 1)) for i in range(N_WINDOWS)]

def granules(t0, t1):
    out, page = [], 1
    while True:
        r = requests.get("https://cmr.earthdata.nasa.gov/search/granules.json", timeout=120, params={
            "collection_concept_id": ISSLIS, "temporal": f"{t0:%Y-%m-%dT%H:%M:%SZ},{t1:%Y-%m-%dT%H:%M:%SZ}", "page_size": 2000, "page_num": page})
        entry = r.json()["feed"]["entry"]
        out += [l["href"] for e in entry for l in e["links"] if l["href"].startswith("https://") and l["href"].endswith(".nc") and "protected" in l["href"]]
        if len(entry) < 2000: return sorted(set(out))
        page += 1

def flashes(session, url):
    """(flashes [time, lat, lon], view time [start, lat, lon, effective seconds]) of one orbit file."""
    import netCDF4
    col = lambda ds, *ks: np.column_stack([np.asarray(ds[k][:], np.float64) for k in ks])
    for attempt in range(4):
        try:
            r = session.get(url, timeout=300); r.raise_for_status()
            with netCDF4.Dataset("lis", memory=r.content) as ds:
                f = col(ds, "lightning_flash_TAI93_time", "lightning_flash_lat", "lightning_flash_lon") if "lightning_flash_lat" in ds.variables else np.zeros((0, 3))
                v = col(ds, "viewtime_TAI93_start", "viewtime_lat", "viewtime_lon", "viewtime_effective_obs") if "viewtime_lat" in ds.variables else np.zeros((0, 4))
                return f, v
        except Exception as e:                         # network or a truncated file: retry, then report
            last = e
    raise RuntimeError(f"{url}: {last}")

def main():
    s = T.earthdata().get_requests_https_session()
    log = []
    for w0 in windows():
        out = OUT / f"{w0:%Y%m%d}.npz"
        if out.exists() and "vt_obs" in np.load(out).files: continue        # earlier windows were saved without view time
        w1 = w0 + dt.timedelta(days=WINDOW_DAYS)
        urls = granules(w0, w1)
        with ThreadPoolExecutor(THREADS) as ex:
            parts = list(ex.map(lambda u: flashes(s, u), urls))
        a = np.concatenate([p[0] for p in parts]) if parts else np.zeros((0, 3))
        v = np.concatenate([p[1] for p in parts]) if parts else np.zeros((0, 4))
        lo, hi = (w0 - TAI93).total_seconds(), (w1 - TAI93).total_seconds()
        keep = (a[:, 0] >= lo) & (a[:, 0] < hi)
        vk = (v[:, 0] >= lo) & (v[:, 0] < hi)
        np.savez_compressed(out, time_tai93=a[keep, 0], lat=a[keep, 1], lon=a[keep, 2], files=len(urls),
                            vt_lat=v[vk, 1], vt_lon=v[vk, 2], vt_obs=v[vk, 3])
        log.append({"window": f"{w0:%Y-%m-%d}", "files": len(urls), "flashes": int(keep.sum())})
        disk.record()
        say(f"ISS LIS {w0:%Y-%m-%d}: {len(urls)} orbit files, {int(keep.sum())} flashes, {v[vk, 3].sum() / 3600:.0f} h of view time")
    path = OUT / "lis.json"
    old = json.loads(path.read_text(encoding="utf-8"))["windows"] if path.exists() else []
    path.write_text(json.dumps({"collection": ISSLIS, "window_days": WINDOW_DAYS, "windows": old + log}, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
