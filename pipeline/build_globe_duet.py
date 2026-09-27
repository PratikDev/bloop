"""Step 6c (additive, safe): a small, clean file for the GLOBE duet teaser - ground cloud cover vs satellite cloud cover
for the same place and time in Bangladesh (2025). Reads public/data/context/globe_bd.json; writes context/globe_duet.json.
It first prints how many observations have a value in each cloud-cover column, so the choice is visible.

Pre-written rules:
 R1 ground value: 'Total Cloud Cover %' if it has numbers, else 'Total Cloud Cover' categories mapped to GLOBE's
    category midpoints (none 0, few 5, isolated 17.5, scattered 37.5, broken 70, overcast 95 - labelled approximate)
 R2 satellite value: 'GEO Total Cloud Cover' (same parsing)
 R3 PASS only if >= 20 observations have BOTH values and all values lie in 0..100 (P5 threshold)
Featured teaser observation = the one whose ground-satellite difference is the MEDIAN difference (a typical case, not
a cherry-picked one)."""
import json, re, sys
import numpy as np
from common import *

CAT = {"none": 0, "no clouds": 0, "clear": 0, "few": 5, "isolated": 17.5, "scattered": 37.5, "broken": 70, "overcast": 95}

def parse(v):
    """Returns (percent, 'number'|'category'|None)."""
    if v is None: return None, None
    if isinstance(v, (int, float)) and np.isfinite(v): return float(v), "number"
    s = str(v).strip().lower()
    m = re.match(r"^(-?\d+(\.\d+)?)\s*%?$", s)
    if m: return float(m.group(1)), "number"
    for k, pct in CAT.items():
        if k in s: return pct, "category"
    return None, None

d = json.load(open(PUBLIC / "context" / "globe_bd.json"))
obs, cols = d["observations"], d["columns"]
print(f"{len(obs)} observations. Values present per cloud-cover column:")
for c in cols["cloud_cover"]:
    n = sum(1 for o in obs if o.get(c) not in (None, "")); ex = next((o[c] for o in obs if o.get(c) not in (None, "")), None)
    print(f"  {c:28s} {n:4d}   e.g. {ex!r}")
gcol = next((c for c in cols["cloud_cover"] if c.lower() == "total cloud cover %"), None)
gcat = next((c for c in cols["cloud_cover"] if c.lower() == "total cloud cover"), None)
scol = next((c for c in cols["cloud_cover"] if c.lower() == "geo total cloud cover"), None)
satname = next((c for c in cols["satellite"] if c.lower() == "geo satellite"), None)
if scol is None: sys.exit("FAIL: no 'GEO Total Cloud Cover' column - paste this output.")

rows = []
for o in obs:
    g, gkind = parse(o.get(gcol)) if gcol else (None, None)
    if g is None and gcat: g, gkind = parse(o.get(gcat))
    s, skind = parse(o.get(scol))
    if g is None or s is None: continue
    rows.append({"time_utc": o.get(cols["time"]), "lat": o.get(cols["lat"]), "lon": o.get(cols["lon"]),
                 "ground_pct": round(g, 1), "ground_source": gkind, "ground_label": o.get(gcat) if gcat else None,
                 "satellite_pct": round(s, 1), "satellite_source": skind,
                 "satellite": o.get(satname) if satname else "geostationary", "difference_pct": round(s - g, 1)})
vals = [r["ground_pct"] for r in rows] + [r["satellite_pct"] for r in rows]
ok_range = all(0 <= v <= 100 for v in vals)
n = len(rows)
if n:
    diffs = np.array([abs(r["difference_pct"]) for r in rows])
    med = float(np.median(diffs)); featured = rows[int(np.argmin(np.abs(diffs - med)))]
    within25 = float((diffs <= 25).mean())
else:
    med, featured, within25 = None, None, None
out = {"title": "Ground vs satellite cloud cover (GLOBE, Bangladesh 2025)", "n_pairs": n,
       "ground_column": gcol or gcat, "satellite_column": scol,
       "category_mapping_note": "When only a category is available, GLOBE categories are mapped to approximate midpoints: " + str(CAT),
       "summary": {"median_abs_difference_pct": med, "share_within_25_points": within25},
       "featured": featured, "pairs": rows,
       "disclosure": "Two perspectives, not right vs wrong: an observer sees the sky from below at one spot; the satellite "
                     "sees from above over a wider area. Differences are expected.",
       "credit": "NASA GLOBE Program (GLOBE Clouds 2025 v3.4, satellite-matched)", "generated_utc": now_utc()}
p = write_json(PUBLIC / "context" / "globe_duet.json", out)
print(f"\nGround column: {gcol or gcat} | satellite column: {scol}")
print(f"Pairs with both values: {n}; median |ground - satellite| {med} points; within 25 points: {within25}")
print(f"Featured (typical) observation: {featured}")
print(f"Wrote context/globe_duet.json ({p.stat().st_size/1024:.0f} KB)")
if n < 20 or not ok_range:
    print(f"FAIL: pairs {n} (need >= 20), values in 0..100: {ok_range}"); sys.exit(1)
print("PASS")
