"""Optional step (additive): 'Bangladesh ensemble' on one shared monthly timeline, built ONLY from verified, published
context files. No downloads; changes no existing file. Output: public/data/context/ensemble_bd.json
Voices: heat (GISTEMP anomaly, Dhaka cell) + rain (GPCP, Dhaka cell) + water (GRACE, Bangladesh box).
Independent self-checks (pre-written; exit 1 on failure):
 C1 no duplicate months in any source file (the script refuses to average them)
 C2 re-reading the WRITTEN file from disk: months start 1981-01, step exactly one month, end at the latest source month
 C3 re-reading the SOURCE files from disk (separate parser): every ensemble value equals the source value, missing = null
 C4 water is null before 2002-04 and in the GRACE gap months"""
import json, sys
import pandas as pd
from common import *

C = PUBLIC / "context"
def load(path, cell_path, key):
    d = json.load(open(C / path))
    node = d
    for k in cell_path: node = node[k]
    return d, node["months"], node[key]

gis, gm, gv = load("gistemp_bd.json", ["cells", "Dhaka"], "anom_C")
gpc, pm, pv = load("gpcp_bd.json", ["cells", "Dhaka"], "mm_per_day")
gra, wm, wv = load("grace.json", ["boxes", "Bangladesh"], "cm")

dups = {n: sorted({m for m in months if months.count(m) > 1}) for n, months in (("heat", gm), ("rain", pm), ("water", wm))}
if any(dups.values()):
    sys.exit(f"FAIL C1: duplicate months in source files: { {k: v[:5] for k, v in dups.items() if v} } - fix the source, don't average")

def series(months, values):
    return pd.Series(values, index=pd.PeriodIndex(months, freq="M"), dtype="float64")
heat, rain, water = series(gm, gv), series(pm, pv), series(wm, wv)
start = pd.Period("1981-01", "M")
end = max(s.dropna().index.max() for s in (heat, rain, water))
timeline = pd.period_range(start, end, freq="M")
aligned = lambda s: [None if pd.isna(v) else round(float(v), 3) for v in s.reindex(timeline).values]

ens = {
    "title": "Bangladesh ensemble (monthly)",
    "months": [str(p) for p in timeline],
    "voices": {
        "heat":  {"values": aligned(heat), "units": "degC anomaly vs 1951-1980", "dataset": gis["dataset"],
                  "place": f"Dhaka grid cell ({gis['cells']['Dhaka']['lat']}, {gis['cells']['Dhaka']['lon']})", "resolution": "250 km smoothing",
                  "mapping_key": "Heat then vs now", "credit": gis["credit"]},
        "rain":  {"values": aligned(rain), "units": "mm/day", "dataset": gpc["dataset"],
                  "place": f"Dhaka grid cell ({gpc['cells']['Dhaka']['lat']}, {gpc['cells']['Dhaka']['lon']})", "resolution": "2.5 deg (~275 km)",
                  "mapping_key": "Monsoon then vs now", "caveat": gpc.get("caveat"), "credit": gpc["credit"]},
        "water": {"values": aligned(water), "units": "cm water-equivalent anomaly vs 2004-2009", "dataset": gra["dataset"],
                  "place": "Bangladesh box (lon 88-93, lat 20.5-26.7)", "resolution": "about 3 deg true resolution",
                  "mapping_key": "Water", "gap_note": gra["gap_note"],
                  "starts": "2002-04 (GRACE launch) - the water voice is silent before this", "credit": gra["credit"]},
    },
    "disclosure": "Three independent NASA records at different resolutions (one grid cell, one grid cell, a national box). "
                  "Voices moving together does not mean one causes the other. Null = no measurement (played as silence).",
    "generated_utc": now_utc(),
}
write_json(C / "ensemble_bd.json", ens)

# ---- independent checks: everything re-read from disk ----
fails = []
out = json.load(open(C / "ensemble_bd.json"))
m = out["months"]
def ym(s): y, mo = map(int, s.split("-")); return y * 12 + mo - 1
steps_ok = all(ym(b) - ym(a) == 1 for a, b in zip(m, m[1:]))
src_last = max(max(x for x, v in zip(ms, vs) if v is not None) for ms, vs in ((gm, gv), (pm, pv), (wm, wv)))
if not (m[0] == "1981-01" and steps_ok and m[-1] == src_last): fails.append(f"C2 timeline (first {m[0]}, consecutive {steps_ok}, last {m[-1]} vs source {src_last})")
for name, fname, path, key in (("heat", "gistemp_bd.json", ["cells", "Dhaka"], "anom_C"), ("rain", "gpcp_bd.json", ["cells", "Dhaka"], "mm_per_day"),
                               ("water", "grace.json", ["boxes", "Bangladesh"], "cm")):
    raw = json.load(open(C / fname))
    for k in path: raw = raw[k]
    lookup = dict(zip(raw["months"], raw[key]))
    bad = [(mm, lookup.get(mm), v) for mm, v in zip(m, out["voices"][name]["values"])
           if (lookup.get(mm) is None) != (v is None) or (v is not None and abs(lookup[mm] - v) > 0.0006)]
    if bad: fails.append(f"C3 {name}: {len(bad)} mismatches, e.g. {bad[:2]}")
w = out["voices"]["water"]["values"]
if any(v is not None for v, mm in zip(w, m) if mm < "2002-04" or "2017-08" <= mm <= "2018-04"): fails.append("C4 water not null before 2002-04 / in the gap")
counts = {k: sum(v is not None for v in out["voices"][k]["values"]) for k in out["voices"]}
print(f"Wrote context/ensemble_bd.json: {len(m)} months {m[0]}..{m[-1]}; values per voice {counts}")
if fails: print("FAIL:", fails); sys.exit(1)
print("Independent checks PASS (C1 no duplicates, C2 timeline, C3 values vs re-read sources, C4 water gaps)")