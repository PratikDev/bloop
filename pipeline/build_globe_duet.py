"""Optional step (additive): data for the GLOBE duet teaser - what a person on the ground reported vs what a
geostationary satellite estimated, same place and day. Reads public/data/context/globe_bd.json; writes context/globe_duet.json.

Pre-written rules
 R1 region: keep only observations inside Bangladesh - by the country field if present, otherwise by Bangladesh's
    national outline (fetch_bd_boundary.py, Natural Earth 1:50m). If neither is available, keep the lat/lon box but title
    it 'Bangladesh and surrounding area' (and say so).
 R2 ground value: GLOBE's cloud-cover CATEGORY ('Total Cloud Cover') for every pair, mapped to category midpoints
    (few 5, isolated 17.5, scattered 37.5, broken 70, overcast 95, none/clear 0 - approximate). Only if the category is
    missing, the '%' range column is used (e.g. '90-100%' -> 95). Counts per source are reported.
 R3 'obscured' skies (the observer could not see the clouds) are excluded and counted.
 R4 satellite value: 'GEO Total Cloud Cover' (numbers, 'x%', or 'a-b%' ranges -> midpoint).
 R5 repeated reports of the same place and day are combined (median) so busy days/schools don't dominate; raw and
    unique counts are both reported, plus the busiest day.
 R6 OK only if >= 20 unique place-days with both values and all values in 0..100. Otherwise the file is still written
    with status 'insufficient' and the script exits 1 (run_all treats this optional step as a warning, never a block).
Featured teaser observation = the unique place-day whose difference is the median difference (typical, not cherry-picked)."""
import json, re, sys
import numpy as np, pandas as pd
from common import *

CAT = {"overcast": 95, "broken": 70, "scattered": 37.5, "isolated": 17.5, "few": 5, "no clouds": 0, "none": 0, "clear": 0}

def pct(v):
    """Numbers, 'x%', 'a-b%', '<x%', '>x%' -> percent (midpoint for ranges); else None."""
    if v is None: return None
    if isinstance(v, (int, float)): return float(v) if np.isfinite(v) else None
    s = str(v).strip().lower().replace(" ", "")
    m = re.match(r"^(\d+(\.\d+)?)-(\d+(\.\d+)?)%?$", s)
    if m: return (float(m.group(1)) + float(m.group(3))) / 2
    m = re.match(r"^<(\d+(\.\d+)?)%?$", s)
    if m: return float(m.group(1)) / 2
    m = re.match(r"^>(\d+(\.\d+)?)%?$", s)
    if m: return (float(m.group(1)) + 100) / 2
    m = re.match(r"^(\d+(\.\d+)?)%?$", s)
    return float(m.group(1)) if m else None

def category(v):
    if v is None: return None, None
    s = str(v).strip().lower()
    if "obscured" in s: return None, "obscured"
    for k, p in CAT.items():
        if k in s: return p, k
    return None, "unknown"

d = json.load(open(PUBLIC / "context" / "globe_bd.json"))
obs, cols = d["observations"], d["columns"]
colset = cols["cloud_cover"]
gcat = next((c for c in colset if c.lower() == "total cloud cover"), None)
grng = next((c for c in colset if c.lower() == "total cloud cover %"), None)
scol = next((c for c in colset if c.lower() == "geo total cloud cover"), None)
satname = next((c for c in cols.get("satellite", []) if c.lower() == "geo satellite"), None)
ccol = (cols.get("country") or [None])[0]
if scol is None or (gcat is None and grng is None):
    print("WARN: required cloud-cover columns not found - paste this output"); sys.exit(1)

# R1 region: country field, else the national-outline test from build_context.py, else rename
if not ccol and cols.get("in_bangladesh"):
    in_bd = [o for o in obs if o.get("in_bangladesh") is True]
    region = "Bangladesh"
    region_note = (f"Filtered with Bangladesh's national outline (Natural Earth 1:50m, generalised: points within a few km of "
                   f"the border may be misclassified). Kept {len(in_bd)} of {len(obs)} observations.")
    print(f"R1 region: kept {len(in_bd)} observations inside Bangladesh's outline; excluded {len(obs) - len(in_bd)}")
    obs = in_bd
elif ccol:
    in_bd = [o for o in obs if "bangladesh" in str(o.get(ccol, "")).lower()]
    region, region_note = "Bangladesh", f"Filtered on '{ccol}' = Bangladesh ({len(in_bd)} of {len(obs)} observations)."
    others = pd.Series([str(o.get(ccol)) for o in obs if o not in in_bd]).value_counts().head(5).to_dict()
    print(f"R1 region: kept {len(in_bd)} Bangladesh observations; excluded {len(obs) - len(in_bd)} (top other countries: {others})")
    obs = in_bd
else:
    region = "Bangladesh and surrounding area"
    region_note = "No country field in the input: observations come from a latitude/longitude box that also covers parts of India and Myanmar."
    print(f"R1 region: WARNING - no country field; using the lat/lon box and titling it '{region}'. Re-run build_context.py to add the country field.")

src_counts = {"category": 0, "range_fallback": 0}; dropped = {"obscured": 0, "unknown_category": 0, "missing_ground": 0, "missing_satellite": 0}
rows = []
for o in obs:
    g, how = category(o.get(gcat)) if gcat else (None, None)
    if how == "obscured": dropped["obscured"] += 1; continue
    src = "category" if g is not None else None
    if g is None:
        g = pct(o.get(grng)) if grng else None
        if g is not None: src = "range_fallback"
        elif how == "unknown": dropped["unknown_category"] += 1; continue
        else: dropped["missing_ground"] += 1; continue
    s = pct(o.get(scol))
    if s is None: dropped["missing_satellite"] += 1; continue
    src_counts[src] += 1
    rows.append({"date": str(o.get(cols["time"]))[:10], "lat": o.get(cols["lat"]), "lon": o.get(cols["lon"]), "ground_pct": g,
                 "satellite_pct": s, "satellite": o.get(satname) if satname else "geostationary"})
print(f"R2 ground values: {src_counts} | R3/R4 dropped: {dropped}")

df = pd.DataFrame(rows)
if len(df):
    df["lat_r"], df["lon_r"] = df.lat.astype(float).round(3), df.lon.astype(float).round(3)
    u = df.groupby(["date", "lat_r", "lon_r"], as_index=False).agg(ground_pct=("ground_pct", "median"), satellite_pct=("satellite_pct", "median"),
                                                                   n_reports=("ground_pct", "size"), satellite=("satellite", "first"))
    u = u.rename(columns={"lat_r": "lat", "lon_r": "lon"})
    u["difference_pct"] = (u.satellite_pct - u.ground_pct).round(1)
    busiest = df.date.value_counts().head(1)
    diffs = u.difference_pct.abs().values; med = float(np.median(diffs))
    feat = u.iloc[int(np.argmin(np.abs(diffs - med)))].to_dict()
    ok_range = bool(((u[["ground_pct", "satellite_pct"]] >= 0) & (u[["ground_pct", "satellite_pct"]] <= 100)).all().all())
    summary = {"raw_pairs": int(len(df)), "unique_place_days": int(len(u)), "busiest_day": {busiest.index[0]: int(busiest.iloc[0])},
               "median_abs_difference_pct": round(med, 1), "share_within_25_points": round(float((diffs <= 25).mean()), 3)}
    pairs = u.to_dict(orient="records")
else:
    ok_range, feat, pairs, summary = False, None, [], {"raw_pairs": 0, "unique_place_days": 0}
ok = summary["unique_place_days"] >= 20 and ok_range
out = {"title": f"Ground vs satellite cloud cover (GLOBE, {region}, 2025)", "status": "ok" if ok else "insufficient",
       "region": region, "region_note": region_note,
       "ground_value": {"primary": f"{gcat} (category midpoints)", "fallback": f"{grng} (range midpoints)", "counts": src_counts,
                        "category_midpoints": CAT, "note": "Approximate: GLOBE reports categories/ranges, not exact percentages."},
       "satellite_value": scol, "dropped": dropped, "summary": summary, "featured": feat, "pairs": pairs,
       "disclosure": "Two perspectives, not right vs wrong: an observer sees the sky from below at one spot; the satellite sees from "
                     "above over a wider area. Differences are expected. Repeated reports of the same place and day are combined.",
       "credit": "NASA GLOBE Program (GLOBE Clouds 2025 v3.4, satellite-matched)", "generated_utc": now_utc()}
p = write_json(PUBLIC / "context" / "globe_duet.json", out)
print(f"R5 summary: {summary}")
print(f"Featured (typical) place-day: {feat}")
print(f"Wrote context/globe_duet.json ({p.stat().st_size/1024:.0f} KB), status {out['status']}")
if not ok:
    print("WARN: fewer than 20 unique place-days or values outside 0..100 - teaser data marked 'insufficient'"); sys.exit(1)
print("PASS")