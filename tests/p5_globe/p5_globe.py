# Test P5 — GLOBE citizen observations: public read access + how many in Bangladesh?
import json, time, urllib.request, urllib.error

BASE = "https://api.globe.gov/search/v1/measurement/protocol/measureddate/"
CANDIDATES = ["sky_conditions", "precipitations", "air_temperatures", "surface_temperatures", "land_covers", "aerosols"]
BBOX = (88.0, 20.5, 92.8, 26.7)             # Bangladesh (lon0, lat0, lon1, lat1)
WINDOWS = {"sky_conditions": ("2025-03-01", "2025-03-31")}   # clouds are very numerous: short window
DEFAULT_WINDOW = ("2024-01-01", "2024-12-31")

def get(url):
    t0 = time.time()
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "jukebox-test"}), timeout=300) as r:
        raw = r.read()
    return json.loads(raw), len(raw), time.time() - t0

def latlon(rec):
    lat = lon = None
    for k, v in rec.items():
        kl = k.lower()
        if lat is None and "latitude" in kl and isinstance(v, (int, float)): lat = v
        if lon is None and "longitude" in kl and isinstance(v, (int, float)): lon = v
    return lat, lon

summary = {}
for p in CANDIDATES:
    try:
        d, size, secs = get(f"{BASE}?protocols={p}&startdate=2024-01-01&enddate=2024-01-31&geojson=FALSE&sample=TRUE")
        n = len(d.get("results", d if isinstance(d, list) else []))
        print(f"{p}: ACCESS OK without key (sample returned {n} records, {secs:.1f}s)")
    except urllib.error.HTTPError as e:
        print(f"{p}: HTTP {e.code} — {e.read()[:150]!r}"); summary[p] = {"access": False, "error": e.code}; continue
    except Exception as e:
        print(f"{p}: FAILED — {e}"); summary[p] = {"access": False, "error": str(e)}; continue
    s, e_ = WINDOWS.get(p, DEFAULT_WINDOW)
    try:
        d, size, secs = get(f"{BASE}?protocols={p}&startdate={s}&enddate={e_}&geojson=FALSE&sample=FALSE")
        recs = d.get("results", [])
        inside = [r for r in recs if (lambda la, lo: la is not None and lo is not None and BBOX[1] <= la <= BBOX[3] and BBOX[0] <= lo <= BBOX[2])(*latlon(r))]
        print(f"   {s}..{e_}: {len(recs)} records worldwide ({size/1e6:.1f} MB, {secs:.0f}s); in Bangladesh box: {len(inside)}")
        if recs: print(f"   example fields: {list(recs[0].keys())[:12]}")
        summary[p] = {"access": True, "window": [s, e_], "worldwide": len(recs), "bangladesh": len(inside)}
    except Exception as e:
        print(f"   full query failed: {e}"); summary[p] = {"access": True, "full_query_error": str(e)}
json.dump(summary, open("globe_summary.json", "w"), indent=2); print("\nSaved globe_summary.json")
