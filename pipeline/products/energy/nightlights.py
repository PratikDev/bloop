"""Black Marble VJ146A2 (NOAA-20 VIIRS; replaces S-NPP VNP46A2) → context/nightlights.json: daily radiance at Dhaka,
Chattogram and Khulna, median of a WIN×WIN window. Uses DNB_BRDF-Corrected_NTL, not the gap-filled layer, and keeps
only pixels whose Mandatory_Quality_Flag is high quality, so a cloudy night is a flagged rest, never a filled value.
Incremental: only days not already in the file are downloaded (each granule is deleted after reading).
Usage (from pipeline/): python -m products.energy.nightlights"""
import json, re
from datetime import date, datetime, timedelta, timezone
import numpy as np, h5py
from common import PUBLIC, WORK
from core.ref import T
from core.header import header, publish_json, iso
from core.log import say, main_guard
from core.places import BD_POINTS

SHORT_NAME = "VJ146A2"
WIN = 5
GOOD_FLAGS = (0, 1)              # Mandatory_Quality_Flag: 0/1 high quality (persistent/ephemeral); 2 poor; 255 no retrieval
MIN_VALID = 0.5                  # share of the window that must be good, else the night is "cloud-masked"
BACKFILL_DAYS = 21
KEEP_DAYS = 120

def tile_of(lat, lon):
    return int((lon + 180) // 10), int((90 - lat) // 10)

def dataset(f, pattern):
    names = []
    f.visititems(lambda k, o: names.append(k) if isinstance(o, h5py.Dataset) and re.search(pattern, k) else None)
    if not names:
        raise RuntimeError(f"{pattern} not in granule")
    return f[sorted(names, key=len)[0]]

def read_city(path, lat, lon):
    with h5py.File(path, "r") as f:
        ntl, flag = dataset(f, r"/DNB_BRDF-Corrected_NTL$"), dataset(f, r"/Mandatory_Quality_Flag$")
        H, W = ntl.shape
        h, v = tile_of(lat, lon)
        y, x = int((90 - v * 10 - lat) / 10 * H), int((lon - (h * 10 - 180)) / 10 * W)
        sl = (slice(max(0, y - WIN // 2), y + WIN // 2 + 1), slice(max(0, x - WIN // 2), x + WIN // 2 + 1))
        rad, q = ntl[sl].astype(float), flag[sl]
        fill = float(np.ravel(ntl.attrs.get("_FillValue", [-999.9]))[0]); scale = float(np.ravel(ntl.attrs.get("scale_factor", [1.0]))[0])
    good = np.isin(q, GOOD_FLAGS) & (rad != fill)
    share = float(good.mean())
    return (round(float(np.median(rad[good])) * scale, 2) if share >= MIN_VALID else None), round(share, 2)

def main():
    path = PUBLIC / "context" / "nightlights.json"
    prev = json.load(open(path)) if path.exists() else {}
    cities = {n: {"lat": la, "lon": lo, "tile": "h%02dv%02d" % tile_of(la, lo), "days": {}} for n, (la, lo) in BD_POINTS.items()}
    for n, c in prev.get("cities", {}).items():
        if n in cities:
            cities[n]["days"] = {d: (r, s) for d, r, s in zip(c["days"], c["radiance"], c["valid_share"])}
    ea = T.earthdata()
    lats, lons = [p[0] for p in BD_POINTS.values()], [p[1] for p in BD_POINTS.values()]
    start = date.today() - timedelta(days=BACKFILL_DAYS)
    res = ea.search_data(short_name=SHORT_NAME, temporal=(str(start), str(date.today())),
                         bounding_box=(min(lons) - .1, min(lats) - .1, max(lons) + .1, max(lats) + .1))
    tmp = WORK / "blackmarble"; tmp.mkdir(exist_ok=True)
    newest = None
    for g in res:
        name = g.data_links()[0].split("/")[-1]
        m = re.search(r"\.A(\d{7})\.(h\d\dv\d\d)\.", name)
        day = datetime.strptime(m.group(1), "%Y%j").date().isoformat()
        todo = [n for n, c in cities.items() if c["tile"] == m.group(2) and day not in c["days"]]
        if not todo:
            continue
        p = ea.download([g], str(tmp))[0]
        for n in todo:
            cities[n]["days"][day] = read_city(p, cities[n]["lat"], cities[n]["lon"])
            say(f"  {n} {day}: {cities[n]['days'][day]}")
        T.Path(p).unlink(missing_ok=True)
    for c in cities.values():
        if c["days"]:
            newest = max(newest or "", max(c["days"]))
    cutoff = str(date.today() - timedelta(days=KEEP_DAYS))
    out = {}
    for n, c in cities.items():
        days = sorted(d for d in c["days"] if d >= cutoff)
        out[n] = {"lat": c["lat"], "lon": c["lon"], "tile": c["tile"], "days": days,
                  "radiance": [c["days"][d][0] for d in days], "valid_share": [c["days"][d][1] for d in days],
                  "cloud_masked": [c["days"][d][0] is None for d in days]}
    t = iso(datetime.fromisoformat(newest).replace(tzinfo=timezone.utc)) if newest else None
    publish_json("context/nightlights.json", {**header("nightlights", t, fmt={"win": WIN}), "short_name": SHORT_NAME,
                 "variable": "DNB_BRDF-Corrected_NTL", "units": "nW·cm⁻²·sr⁻¹", "window_px": WIN,
                 "quality_rule": f"Mandatory_Quality_Flag in {list(GOOD_FLAGS)} on at least {MIN_VALID:.0%} of the window",
                 "cities": out})

if __name__ == "__main__":
    main_guard(main)
