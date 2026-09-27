"""Optional step (additive): data for the GLOBE duet teaser - what a person on the ground reported vs what a
geostationary satellite estimated, same place and day. Reads public/data/context/globe_bd.json (unchanged contract);
writes context/globe_duet.json (typed as GlobeDuetFile in src/types/data-contract.ts).

Pre-written rules
 R1 region: keep only observations INSIDE Bangladesh's national outline (inputs/context/bangladesh_boundary.geojson,
    Natural Earth 1:50m, from fetch_bd_boundary.py). The test happens here, so globe_bd.json stays unchanged. If the outline
    file is missing, the lat/lon box is kept and the title says 'Bangladesh and surrounding area'.
 R2 ground value: GLOBE cloud-cover CATEGORY ('Total Cloud Cover') for every pair -> category midpoints (approximate);
    the '%' range column only if the category is missing. Counts per source reported.
 R3 'obscured' skies are excluded and counted; so are unknown categories and missing values.
 R4 satellite value: 'GEO Total Cloud Cover' (numbers, 'x%', 'a-b%' ranges -> midpoint).
 R5 same day + same site: reports within 1 km of each other on the same date are merged (median), so repeated reports and
    tiny coordinate differences don't count as separate places. Raw and unique counts + busiest day reported.
 R6 status 'ok' only if >= 20 unique place-days with both values and all values in 0..100; otherwise the file is still
    written with status 'insufficient' and the script exits 1 (run_all treats this optional step as a warning).
Featured teaser = the place-day whose difference is the median difference (typical, not cherry-picked)."""
import json, re, sys
import numpy as np, pandas as pd
from common import *

CAT = {"overcast": 95, "broken": 70, "scattered": 37.5, "isolated": 17.5, "few": 5, "no clouds": 0, "none": 0, "clear": 0}
MERGE_KM = 1.0

def pct(v):
    if v is None: return None
    if isinstance(v, (int, float)): return float(v) if np.isfinite(v) else None
    s = str(v).strip().lower().replace(" ", "")
    for pat, fn in ((r"^(\d+(\.\d+)?)-(\d+(\.\d+)?)%?$", lambda m: (float(m.group(1)) + float(m.group(3))) / 2),
                    (r"^<(\d+(\.\d+)?)%?$", lambda m: float(m.group(1)) / 2),
                    (r"^>(\d+(\.\d+)?)%?$", lambda m: (float(m.group(1)) + 100) / 2),
                    (r"^(\d+(\.\d+)?)%?$", lambda m: float(m.group(1)))):
        m = re.match(pat, s)
        if m: return fn(m)
    return None

def category(v):
    if v is None: return None, None
    s = str(v).strip().lower()
    if "obscured" in s: return None, "obscured"
    for k, p in CAT.items():
        if k in s: return p, k
    return None, "unknown"

def load_outline():
    f = INPUTS / "context" / "bangladesh_boundary.geojson"
    if not f.exists(): return None
    geom = json.load(open(f))["features"][0]["geometry"]
    return geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]

def inside(polys, x, y):
    for poly in polys:
        hits = []
        for ring in poly:
            r = np.asarray(ring); xs, ys = r[:, 0], r[:, 1]; x2, y2 = np.roll(xs, -1), np.roll(ys, -1)
            cross = ((ys > y) != (y2 > y)) & (x < (x2 - xs) * (y - ys) / np.where(y2 != ys, y2 - ys, 1e-12) + xs)
            hits.append(bool(cross.sum() % 2))
        if hits and hits[0] and not any(hits[1:]): return True
    return False

def km(a_lat, a_lon, b_lat, b_lon):
    p1, p2 = np.radians(a_lat), np.radians(b_lat); dl = np.radians(b_lon - a_lon)
    h = np.sin((p2 - p1) / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2
    return 6371.0 * 2 * np.arcsin(np.sqrt(h))

def merge_sites(df):
    """Same date: union reports within MERGE_KM of each other; returns a site id per row."""
    site = np.zeros(len(df), int); nxt = 0
    for _, idx in df.groupby("date").groups.items():
        idx = list(idx); parent = list(range(len(idx)))
        def find(i):
            while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
            return i
        for a in range(len(idx)):
            for b in range(a + 1, len(idx)):
                ra, rb = df.loc[idx[a]], df.loc[idx[b]]
                if km(ra.lat, ra.lon, rb.lat, rb.lon) <= MERGE_KM: parent[find(a)] = find(b)
        roots = {}
        for a in range(len(idx)):
            r = find(a)
            if r not in roots: roots[r] = nxt; nxt += 1
            site[df.index.get_loc(idx[a])] = roots[r]
    return site

d = json.load(open(PUBLIC / "context" / "globe_bd.json"))
obs, cols = d["observations"], d["columns"]
cc = cols["cloud_cover"]
gcat = next((c for c in cc if c.lower() == "total cloud cover"), None)
grng = next((c for c in cc if c.lower() == "total cloud cover %"), None)
scol = next((c for c in cc if c.lower() == "geo total cloud cover"), None)
satname = next((c for c in cols.get("satellite", []) if c.lower() == "geo satellite"), None)
if scol is None or (gcat is None and grng is None):
    print("WARN: required cloud-cover columns not found - paste this output"); sys.exit(1)

polys = load_outline()
dropped = {"outside_bangladesh": 0, "obscured": 0, "unknown_category": 0, "missing_ground": 0, "missing_satellite": 0}
if polys:
    region = "Bangladesh"
    kept = []
    for o in obs:
        la_, lo_ = o.get(cols["lat"]), o.get(cols["lon"])
        if la_ is not None and lo_ is not None and inside(polys, float(lo_), float(la_)): kept.append(o)
        else: dropped["outside_bangladesh"] += 1
    region_note = (f"Filtered with Bangladesh's national outline (Natural Earth 1:50m, generalised: points within a few km of the "
                   f"border may be misclassified). Kept {len(kept)} of {len(obs)} observations.")
    obs = kept
else:
    region = "Bangladesh and surrounding area"
    region_note = "Outline file missing: observations come from a latitude/longitude box that also covers parts of India and Myanmar."
    print("R1 WARNING: no bangladesh_boundary.geojson - run fetch_bd_boundary.py; using the lat/lon box and renaming the region.")
print(f"R1 region: {region} - kept {len(obs)}; outside {dropped['outside_bangladesh']}")

src_counts = {"category": 0, "range_fallback": 0}; rows = []
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
    rows.append({"date": str(o.get(cols["time"]))[:10], "lat": float(o.get(cols["lat"])), "lon": float(o.get(cols["lon"])),
                 "ground_pct": float(g), "satellite_pct": float(s), "satellite": o.get(satname) if satname else None})
print(f"R2 ground values: {src_counts} | R3/R4 dropped: {dropped}")

pairs, feat, ok_range = [], None, False
summary = {"raw_pairs": len(rows), "unique_place_days": 0, "merge_radius_km": MERGE_KM}
if rows:
    df = pd.DataFrame(rows); df["site"] = merge_sites(df)
    u = df.groupby("site").agg(date=("date", "first"), lat=("lat", "mean"), lon=("lon", "mean"), ground_pct=("ground_pct", "median"),
                               satellite_pct=("satellite_pct", "median"), n_reports=("ground_pct", "size"), satellite=("satellite", "first"))
    u["lat"], u["lon"] = u.lat.round(4), u.lon.round(4)
    u["difference_pct"] = (u.satellite_pct - u.ground_pct).round(1)
    diffs = u.difference_pct.abs().values; med = float(np.median(diffs))
    busiest = df.groupby("date").site.nunique().sort_values(ascending=False).head(1)
    ok_range = bool(((u[["ground_pct", "satellite_pct"]] >= 0) & (u[["ground_pct", "satellite_pct"]] <= 100)).all().all())
    cols_out = ["date", "lat", "lon", "ground_pct", "satellite_pct", "n_reports", "satellite", "difference_pct"]
    pairs = [{k: (None if (isinstance(v, float) and not np.isfinite(v)) else (int(v) if k == "n_reports" else v))
              for k, v in r.items()} for r in u[cols_out].to_dict(orient="records")]
    feat = pairs[int(np.argmin(np.abs(diffs - med)))]
    summary.update({"unique_place_days": len(pairs), "busiest_day": {str(busiest.index[0]): int(busiest.iloc[0])},
                    "median_abs_difference_pct": round(med, 1), "share_within_25_points": round(float((diffs <= 25).mean()), 3)})
ok = summary["unique_place_days"] >= 20 and ok_range
out = {"title": f"Ground vs satellite cloud cover (GLOBE, {region}, 2025)", "status": "ok" if ok else "insufficient",
       "region": region, "region_note": region_note,
       "ground_value": {"primary": f"{gcat} (category midpoints)", "fallback": f"{grng} (range midpoints)", "counts": src_counts,
                        "category_midpoints": CAT, "note": "Approximate: GLOBE reports categories/ranges, not exact percentages."},
       "satellite_value": scol, "dropped": dropped, "summary": summary, "featured": feat, "pairs": pairs,
       "disclosure": "Two perspectives, not right vs wrong: an observer sees the sky from below at one spot; the satellite sees from "
                     "above over a wider area. Differences are expected. Reports from the same day within 1 km are combined.",
       "credit": "NASA GLOBE Program (GLOBE Clouds 2025 v3.4, satellite-matched)", "generated_utc": now_utc()}
p = write_json(PUBLIC / "context" / "globe_duet.json", out)
print(f"R5 summary: {summary}\nFeatured (typical) place-day: {feat}\nWrote context/globe_duet.json ({p.stat().st_size/1024:.0f} KB), status {out['status']}")
if not ok:
    print("WARN: fewer than 20 unique place-days or values outside 0..100 - file written with status 'insufficient'"); sys.exit(1)
print("PASS")