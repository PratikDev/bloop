# Test P2 — FIRMS fire counts as percussion (needs a free FIRMS MAP_KEY)
import csv, io, time, urllib.request, datetime as dt, json, numpy as np
from jb_audio import sequence, silence, save

MAP_KEY = "PASTE_YOUR_MAP_KEY"
CASES = {   # name: (bbox west,south,east,north, start month-day, end month-day)
    "CHT_Bangladesh_MarApr": ("91.6,21.2,92.7,23.7", "03-01", "04-30"),
    "Punjab_India_OctNov":   ("73.8,29.5,77.0,32.5", "10-01", "11-30"),
}
RUNS = [("MODIS_SP", 2003), ("MODIS_SP", 2023), ("VIIRS_SNPP_SP", 2023)]   # same-sensor comparison = MODIS

def fetch(source, bbox, start, n_days):
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{source}/{bbox}/{n_days}/{start}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "jukebox-test"}), timeout=120) as r:
        text = r.read().decode("utf-8", "ignore")
    if not text.startswith("latitude"):
        raise RuntimeError(text[:200])
    return list(csv.DictReader(io.StringIO(text)))

if MAP_KEY.startswith("PASTE"): raise SystemExit("Put your FIRMS MAP_KEY in the script first (see guide).")
out = {}
for case, (bbox, md0, md1) in CASES.items():
    for source, year in RUNS:
        d0 = dt.date.fromisoformat(f"{year}-{md0}"); d1 = dt.date.fromisoformat(f"{year}-{md1}")
        per_day = {}; frp = 0.0; d = d0; t0 = time.time()
        while d <= d1:
            n = min(5, (d1 - d).days + 1)
            rows = fetch(source, bbox, d.isoformat(), n)
            for row in rows:
                per_day[row["acq_date"]] = per_day.get(row["acq_date"], 0) + 1
                try: frp += float(row.get("frp") or 0)
                except ValueError: pass
            d += dt.timedelta(days=n); time.sleep(1)
        days = [(d0 + dt.timedelta(days=i)).isoformat() for i in range((d1 - d0).days + 1)]
        counts = [per_day.get(x, 0) for x in days]
        key = f"{case}|{source}|{year}"; out[key] = {"days": days, "counts": counts, "total": sum(counts), "frp_sum_MW": round(frp, 1)}
        print(f"{key}: {sum(counts)} detections, busiest day {max(counts)}, FRP sum {frp:.0f} MW ({time.time()-t0:.0f}s)")
json.dump(out, open("firms_cases.json", "w")); print("Saved firms_cases.json")

# Preview: CHT MODIS 2003 vs 2023 — one step per day, click strength ~ log(count)
for case in CASES:
    a = np.array(out[f"{case}|MODIS_SP|2003"]["counts"]); b = np.array(out[f"{case}|MODIS_SP|2023"]["counts"])
    top = max(1, a.max(), b.max())
    ca, cb = np.log1p(a) / np.log1p(top), np.log1p(b) / np.log1p(top)
    save(f"p2_{case}_2003_vs_2023.wav", sequence([np.nan]*len(a), step=0.08, clicks=ca), silence(1.0),
         sequence([np.nan]*len(b), step=0.08, clicks=cb))
