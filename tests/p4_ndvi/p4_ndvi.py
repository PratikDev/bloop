# Test P4 — MODIS NDVI as a slow seasonal voice (ORNL DAAC MODIS web service; no key expected)
import json, time, urllib.request, numpy as np
from jb_audio import freq_map, sequence, silence, save

BASE = "https://modis.ornl.gov/rst/api/v1"
PRODUCT, BAND = "MOD13Q1", "250m_16_days_NDVI"
POINTS = {"Sundarbans": (21.95, 89.18), "Madhupur_forest": (24.62, 90.05), "Dhaka_city_control": (23.78, 90.40)}
WIN_A, WIN_B = (2001, 2003), (2021, 2023)

def get(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "jukebox-test"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

out = {}
for name, (lat, lon) in POINTS.items():
    d = get(f"{BASE}/{PRODUCT}/dates?latitude={lat}&longitude={lon}")
    if "dates" not in d or not d["dates"] or "modis_date" not in d["dates"][0]:
        raise SystemExit(f"Unexpected response format - paste this: {str(d)[:400]}")
    dates = d["dates"]; print(f"\n{name}: {len(dates)} dates available ({dates[0]['calendar_date']} .. {dates[-1]['calendar_date']})")
    res = {}
    for label, (y0, y1) in (("A", WIN_A), ("B", WIN_B)):
        sel = [x for x in dates if y0 <= int(x["calendar_date"][:4]) <= y1]
        vals, cal = [], []
        for i in range(0, len(sel), 10):                     # service returns up to 10 dates per call
            chunk = sel[i:i + 10]
            s = get(f"{BASE}/{PRODUCT}/subset?latitude={lat}&longitude={lon}&band={BAND}"
                    f"&startDate={chunk[0]['modis_date']}&endDate={chunk[-1]['modis_date']}&kmAboveBelow=0&kmLeftRight=0")
            for item in s["subset"]:
                v = item["data"][0]; vals.append(np.nan if v <= -2000 else v * 0.0001); cal.append(item["calendar_date"])
            time.sleep(0.5)
        v = np.array(vals); res[label] = {"dates": cal, "ndvi": [None if np.isnan(x) else round(float(x), 4) for x in v],
                                          "mean": float(np.nanmean(v)), "seasonal_range": float(np.nanpercentile(v, 90) - np.nanpercentile(v, 10))}
        print(f"  {y0}–{y1}: {len(v)} composites, mean NDVI {np.nanmean(v):.3f}, seasonal range (P90–P10) {res[label]['seasonal_range']:.3f}")
    out[name] = res
json.dump(out, open("ndvi_points.json", "w")); print("\nSaved ndvi_points.json")
a = np.array(out["Sundarbans"]["A"]["ndvi"], float); b = np.array(out["Sundarbans"]["B"]["ndvi"], float)
save("p4_ndvi_sundarbans_then_vs_now.wav", sequence(list(freq_map(a, 0, 1, 150, 600)), step=0.18), silence(1.0),
     sequence(list(freq_map(b, 0, 1, 150, 600)), step=0.18))
