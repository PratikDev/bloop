"""5533 against Sentinel-5P TROPOMI NO2 (S5P_L2__NO2____HiR v2, C2089270961-GES_DISC; KNMI/ESA, Copernicus Sentinel
data terms; an independent satellite). Read from NASA GES DISC through Earthdata cloud OPeNDAP (the same Sentinel files
the Copernicus Data Space serves). Fixed 3 Nov before reading: on each of the 25 validation days, the daytime orbit
over the Bangladesh box (BD_BOX); its pixels with qa_value ≥ 0.75; their tropospheric NO2 column averaged on the
box's frame cells (work/bd_nox.npz); the hourly frame nearest the overpass. Pooled Spearman, frame NOx (surface, ppbv)
vs column; no threshold: a column and a surface mixing ratio are different quantities, so the result is pattern
agreement only. Adds g_nox_tropomi to air_5533. Usage (from pipeline/): python -m svs.records.air.tropomi"""
import datetime as dt, io, itertools, zlib
import numpy as np
import requests
from core.log import say
from svs import validate as V
from svs.config import raw_dir
from svs.records.ocean2.truth import dap_bytes
from . import ALT, BD_BOX, PERIOD
from .cams import hours
from .validate import RECORD, WORK

CID = "C2089270961-GES_DISC"
QA = 0.75
EPOCH = dt.datetime(2010, 1, 1, tzinfo=dt.timezone.utc)
FIRST = PERIOD[0] + dt.timedelta(minutes=30)                    # bd frame i is FIRST + i hours (decode_bd / truth times)

def orbit(day):
    w, s, e, n = BD_BOX
    r = requests.get("https://cmr.earthdata.nasa.gov/search/granules.json", timeout=120, params={
        "collection_concept_id": CID, "temporal": f"{day:%Y-%m-%d}T00:00:00Z,{day:%Y-%m-%d}T23:59:59Z",
        "point": f"{(w + e) / 2},{(s + n) / 2}", "page_size": 10}).json()["feed"]["entry"]
    return [g["title"] for g in r if "_OFFL_" in g["title"] or "_RPRO_" in g["title"]]

def fetch(title, ce, tries=3):
    """A DAP4 subset as {name: array}, retried when a response arrives truncated."""
    for attempt in range(tries):
        try: return decode(dap_bytes(CID, title, ce))
        except (zlib.error, OSError):
            if attempt == tries - 1: raise

def decode(content):
    """Hyrax's re-encoded chunks fail their Fletcher-32 checksum in HDF5, so each chunk is decoded here by its filter
    pipeline (skipping the checksum): inflate, unshuffle, drop the checksum where Hyrax left it in the stream."""
    import h5py
    out = {}
    with h5py.File(io.BytesIO(content)) as f:
        for name in ("latitude", "longitude", "nitrogendioxide_tropospheric_column", "qa_value", "time", "delta_time"):
            if f"PRODUCT/{name}" not in f: continue
            d = f[f"PRODUCT/{name}"]
            if d.chunks is None: out[name] = d[()]; continue
            a = np.empty(d.shape, d.dtype)
            size = int(np.prod(d.chunks)) * d.dtype.itemsize
            for off in itertools.product(*[range(0, s, c) for s, c in zip(d.shape, d.chunks)]):
                b = d.id.read_direct_chunk(off)[1]
                if "gzip" in d._filters: b = zlib.decompressobj().decompress(b)
                if "shuffle" in d._filters:                         # the checksum, when kept, was shuffled in as one more element
                    b = np.frombuffer(b, np.uint8).reshape(d.dtype.itemsize, -1).T.tobytes()
                b = b[:size]
                b = np.frombuffer(b, d.dtype).reshape(d.chunks)
                sl = tuple(slice(o, min(o + c, s)) for o, c, s in zip(off, d.chunks, d.shape))
                a[sl] = b[tuple(slice(0, x.stop - x.start) for x in sl)]
            fill = d.attrs.get("_FillValue")
            out[name] = np.where(a == fill, np.nan, a.astype(float)) if fill is not None and a.dtype.kind == "f" else a
    return out

def read(title):
    """The scanlines that cross the box: lat, lon, column (mol/m²) where qa ≥ QA, overpass time; cached per orbit."""
    path = raw_dir(ALT, "tropomi") / f"{title.split(':')[-1][:-3]}.npz"
    if path.exists():
        z = np.load(path)
        return (z["lat"], z["lon"], z["col"], dt.datetime.fromisoformat(str(z["when"]))) if z["lat"].size else None
    got = _read(title)
    path.parent.mkdir(parents=True, exist_ok=True)
    lat, lon, col, when = got or (np.zeros(0), np.zeros(0), np.zeros(0), dt.datetime.min)
    np.savez_compressed(path, lat=lat, lon=lon, col=col, when=str(when))
    return got

def _read(title):
    w, s, e, n = BD_BOX
    ds = fetch(title, "/PRODUCT/latitude;/PRODUCT/longitude")
    lat, lon = ds["latitude"][0], ds["longitude"][0]
    rows = np.where(((lat >= s) & (lat <= n) & (lon >= w) & (lon <= e)).any(axis=1))[0]
    if not rows.size: return None
    a, b = int(rows.min()), int(rows.max())
    sl = f"[0][{a}:{b}][0:{lat.shape[1] - 1}]"
    ce = ";".join(f"/PRODUCT/{v}{sl}" for v in ("nitrogendioxide_tropospheric_column", "qa_value")) + f";/PRODUCT/time;/PRODUCT/delta_time[0][{a}:{b}]"
    p = fetch(title, ce)
    col, qa = p["nitrogendioxide_tropospheric_column"][0], p["qa_value"][0].astype(float) * 0.01   # qa stored as 0–100
    when = EPOCH + dt.timedelta(seconds=float(np.ravel(p["time"])[0]), milliseconds=float(np.nanmedian(p["delta_time"][0])))
    return lat[a:b + 1], lon[a:b + 1], np.where(qa >= QA, col, np.nan), when

def on_cells(lat, lon, a, glat, glon):
    """Pixel values → mean per frame cell (cell centres glat, glon; even spacing)."""
    dy, dx = abs(glat[1] - glat[0]), abs(glon[1] - glon[0])
    i = np.round((lat - glat[0]) / (glat[1] - glat[0])).astype(int); j = np.round((lon - glon[0]) / dx).astype(int)
    ok = np.isfinite(a) & (i >= 0) & (i < glat.size) & (j >= 0) & (j < glon.size) & (abs(lat - glat[np.clip(i, 0, glat.size - 1)]) <= dy / 2)
    s, c = np.zeros((glat.size, glon.size)), np.zeros((glat.size, glon.size))
    np.add.at(s, (i[ok], j[ok]), a[ok]); np.add.at(c, (i[ok], j[ok]), 1)
    return np.where(c > 0, s / np.maximum(c, 1), np.nan)

def main():
    bd = np.load(WORK / "bd_nox.npz")
    _, steps = hours()
    F, T, used = [], [], []
    for day in sorted({s.date() for s in steps}):
        titles = orbit(day)
        got = next((x for x in (read(t) for t in titles) if x is not None), None)
        if got is None: say(f"{day}: no orbit over the box"); continue
        lat, lon, col, when = got
        i = round((when - FIRST).total_seconds() / 3600)
        if not 0 <= i < bd["values"].shape[0]: continue
        m = on_cells(lat.ravel(), lon.ravel(), col.ravel(), bd["lat"], bd["lon"])
        f = bd["values"][i].astype(float)
        ok = np.isfinite(m) & np.isfinite(f)
        F.append(f[ok]); T.append(m[ok]); used.append(f"{when:%Y-%m-%d %H:%M}")
        say(f"{day}: overpass {when:%H:%M} UTC, frame {i}, {int(ok.sum())} cells with qa ≥ {QA}")
    F, T = np.concatenate(F), np.concatenate(T)
    rho, n = V.spearman(F, T)
    check = V.check(RECORD, "g_nox_tropomi", "NOx over Bangladesh: hourly frame nearest the overpass vs TROPOMI tropospheric NO2 column (independent satellite)",
                    kind="model-vs-obs", source="Sentinel-5P TROPOMI NO2 L2 v2 (KNMI/ESA via NASA GES DISC, C2089270961-GES_DISC; Copernicus Sentinel data terms)",
                    passed=None, metrics={"spearman": rho, "n": n, "days": len(used), "overpasses": used, "qa_min": QA, "rung": "independent satellite"},
                    note="Surface NOx mixing ratio vs a tropospheric column: different quantities, so pattern agreement only; monsoon cloud removes most pixels.")
    V.save(RECORD, [check])
    say(f"5533 NOx vs TROPOMI: ρ {rho:.3f} over {n} cells, {len(used)} overpasses")

if __name__ == "__main__":
    main()
