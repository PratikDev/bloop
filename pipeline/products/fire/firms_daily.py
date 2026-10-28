"""FIRMS NRT daily fire counts on NOAA-21 / NOAA-20 VIIRS and MODIS (no S-NPP: its products stop on 2 Nov 2026) for
Bangladesh (box query kept inside the national outline; the country endpoint answers "Invalid API call"), CHT and
Punjab (box queries; boxes from the reference suite). A query reaches back at most DAYS days, so each run merges into the
history already in context/firms.json → `daily` (additive; `cases` untouched).
Usage (from pipeline/): python -m products.fire.firms_daily"""
import io, json
from datetime import date, timedelta
import pandas as pd
from common import PUBLIC, now_utc
from core.ref import T
from core.header import header, publish_json
from core.log import say, main_guard, SkipProduct
from core.places import BD_BBOX, CHT_BBOX, PUNJAB_BBOX, in_bangladesh

SOURCES = ("VIIRS_NOAA21_NRT", "VIIRS_NOAA20_NRT", "MODIS_NRT")
REGIONS = {"Bangladesh": BD_BBOX, "CHT": CHT_BBOX, "Punjab": PUNJAB_BBOX}
DAYS = 5                         # the API's maximum (it said "Expects [1..5]" on 28 Oct 2026)
KEEP_DAYS = 120
API = "https://firms.modaps.eosdis.nasa.gov/api"

def query(key, src, region):
    r = T.http(f"{API}/area/csv/{key}/{src}/{','.join(map(str, REGIONS[region]))}/{DAYS}", timeout=180)
    if r.status_code != 200 or not r.text.startswith(("latitude", "country_id")):
        raise RuntimeError(T.redact(f"FIRMS {src} {region}: HTTP {r.status_code} {r.text[:120]}"))
    df = pd.read_csv(io.StringIO(r.text))
    return df[in_bangladesh(df.latitude, df.longitude)] if region == "Bangladesh" and len(df) else df

def main():
    key = T.secret("FIRMS_MAP_KEY")
    if not key:
        raise SkipProduct("FIRMS_MAP_KEY not set")
    path = PUBLIC / "context" / "firms.json"
    doc = json.load(open(path))
    hist = doc.get("daily", {}).get("series", {})
    today = date.today()
    window = [str(today - timedelta(days=i)) for i in range(DAYS, -1, -1)]
    for region in REGIONS:
        for src in SOURCES:
            df = query(key, src, region)
            k = f"{region}|{src}"
            got = {} if df.empty else {d: (int(len(g)), round(float(g["frp"].sum()), 1)) for d, g in df.groupby("acq_date")}
            old = {d: (c, f) for d, c, f in zip(hist.get(k, {}).get("days", []), hist.get(k, {}).get("counts", []),
                                                hist.get(k, {}).get("frp_sum_MW", []))}
            for d in window:                             # the API covers every day in the window: no row = 0 fires
                old[d] = got.get(d, (0, 0.0))
            days = sorted(d for d in old if d >= str(today - timedelta(days=KEEP_DAYS)))
            hist[k] = {"days": days, "counts": [old[d][0] for d in days], "frp_sum_MW": [old[d][1] for d in days]}
            say(f"  {k}: last {DAYS} days {sum(old[d][0] for d in window)} detections")
    doc["daily"] = {**header("firms_daily", now_utc()), "sources": list(SOURCES), "regions": list(REGIONS),
                    "boxes": {k: list(v) for k, v in REGIONS.items()}, "bangladesh_filter": "inside the Natural Earth 1:50m outline",
                    "query_days": DAYS, "keep_days": KEEP_DAYS, "series": hist}
    publish_json("context/firms.json", doc)

if __name__ == "__main__":
    main_guard(main)
