"""NASA Black Marble VNP46A4 v2 (annual night lights, S-NPP VIIRS, LAADS C3860065683-LAADS) for 2012 and 2023: the
product the visualization was made from, on tiles chosen from the decoded frame alone (before any VNP46A4 file was
read): the three tiles with the most 'lights out' cells and the three with the most 'new lights' cells (|change| ≥
VISIBLE), plus the two Bangladesh tiles. Each 10° tile (2400×2400, 15″) is streamed: downloaded, reduced to 0.1° cell
means of AllAngle_Composite_Snow_Free (nW·cm⁻²·sr⁻¹; fill → NaN), saved as data_raw/5313/truth/<tile>_<year>.npz,
and the HDF5 deleted. Citation from CMR.
Usage (from pipeline/): python -m svs.records.lights.truth"""
import json
import numpy as np
import requests
from core.log import say
from core.ref import T
from svs import disk
from svs.config import raw_dir
from . import SID, YEARS

COLLECTION = "C3860065683-LAADS"
FIELD = "HDFEOS/GRIDS/VIIRS_Grid_DNB_2d/Data Fields/AllAngle_Composite_Snow_Free"
VISIBLE = 0.2
BD_TILES = ((26, 6), (27, 6))               # Dhaka, Chattogram and the Padma corridor lie in these two 10° tiles
OUT = raw_dir(SID, "truth")
CMR = "https://cmr.earthdata.nasa.gov/search/granules.json"

def tile_name(h, v): return f"h{h:02d}v{v:02d}"

def tiles(change):
    """From the decoded 0.1° grid only: top 3 tiles per sign by cells with |change| ≥ VISIBLE, then the BD tiles."""
    counts = {(h, v): (int((b >= VISIBLE).sum()), int((b <= -VISIBLE).sum()))
              for v in range(18) for h in range(36) for b in [change[v * 100:(v + 1) * 100, h * 100:(h + 1) * 100]]}
    out = sorted(counts, key=lambda k: -counts[k][1])[:3] + sorted(counts, key=lambda k: -counts[k][0])[:3]
    return [t for i, t in enumerate(out + list(BD_TILES)) if t not in (out + list(BD_TILES))[:i]], counts

def granule(year, tile):
    r = requests.get(CMR, params={"collection_concept_id": COLLECTION, "readable_granule_name": f"VNP46A4.A{year}001.{tile}*",
                                  "options[readable_granule_name][pattern]": "true", "page_size": 5}, timeout=60)
    r.raise_for_status()
    hits = [(e["title"], next(l["href"] for l in e["links"] if l["href"].endswith(".h5"))) for e in r.json()["feed"]["entry"]]
    hits = [h for h in hits if f".A{year}001.{tile}." in h[1]]
    if not hits: raise RuntimeError(f"no VNP46A4 granule for {year} {tile}")
    return sorted(hits, key=lambda h: h[1])[-1]                   # newest production of version 2

def reduce(path):
    import h5py
    with h5py.File(path, "r") as f:
        d = f[FIELD]; a = d[:].astype(np.float64)
        fill = d.attrs.get("_FillValue", [65535])[0]; scale = d.attrs.get("scale_factor", [1.0])[0]; off = d.attrs.get("add_offset", [0.0])[0]
        units = d.attrs.get("units", b"").decode() if isinstance(d.attrs.get("units", b""), bytes) else str(d.attrs.get("units", ""))
    a = np.where(a == fill, np.nan, a * scale + off)
    b = a.reshape(100, 24, 100, 24)
    with np.errstate(invalid="ignore"):
        return np.nanmean(b, axis=(1, 3)), units, {"fill": float(fill), "scale": float(scale), "offset": float(off)}

def main():
    change = np.load(raw_dir(SID) / "grid.npz")["change"]
    chosen, counts = tiles(change)
    s = T.earthdata().get_requests_https_session()
    log = []
    for h, v in chosen:
        for year in YEARS:
            out = OUT / f"{tile_name(h, v)}_{year}.npz"
            if out.exists(): continue
            title, url = granule(year, tile_name(h, v))
            raw = raw_dir(SID, "truth_raw") / url.rsplit("/", 1)[1]
            with s.get(url, stream=True, timeout=600) as r:
                r.raise_for_status()
                with open(raw, "wb") as f:
                    for chunk in r.iter_content(1 << 20): f.write(chunk)
            disk.record()
            cells, units, enc = reduce(raw)
            np.savez_compressed(out, radiance=cells.astype(np.float32))
            log.append({"tile": tile_name(h, v), "year": year, "granule": title, "url": url, "bytes": raw.stat().st_size, "units": units, **enc})
            raw.unlink()
            say(f"VNP46A4 {year} {tile_name(h, v)}: {log[-1]['bytes'] / 1e6:.1f} MB → 0.1° cells")
    meta_path = OUT / "vnp46a4.json"
    old = json.loads(meta_path.read_text(encoding="utf-8"))["files"] if meta_path.exists() else []
    meta = {"collection": COLLECTION, "field": FIELD, "visible": VISIBLE, "tiles": [tile_name(*t) for t in chosen],
            "tile_counts_new_out": {tile_name(*t): counts[t] for t in chosen}, "files": old + log}
    meta_path.write_text(json.dumps(meta, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
