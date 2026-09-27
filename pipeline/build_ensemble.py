"""Step 6b (additive, safe): a multi-voice 'Bangladesh ensemble' on one shared monthly timeline, built ONLY from
context files that are already verified and published. No downloads. Does not change any existing file.
Output: public/data/context/ensemble_bd.json
Voices: heat (GISTEMP anomaly, Dhaka cell) + rain (GPCP, Dhaka cell) + water (GRACE, Bangladesh box).
Self-check (pre-written): every value in the ensemble equals the value in its source file for that month,
gap months are null, and the timeline has no duplicate or missing months. Exit code 1 if any check fails."""
import json, sys
import pandas as pd
from common import *

C = PUBLIC / "context"
gis = json.load(open(C / "gistemp_bd.json")); gp = json.load(open(C / "gpcp_bd.json")); gr = json.load(open(C / "grace.json"))

def series(months, values):
    s = pd.Series(values, index=pd.PeriodIndex(months, freq="M"), dtype="float64")
    return s.groupby(level=0).mean()          # guard against duplicate months

heat = series(gis["cells"]["Dhaka"]["months"], gis["cells"]["Dhaka"]["anom_C"])
rain = series(gp["cells"]["Dhaka"]["months"], gp["cells"]["Dhaka"]["mm_per_day"])
water = series(gr["boxes"]["Bangladesh"]["months"], gr["boxes"]["Bangladesh"]["cm"])

start = pd.Period("1981-01", "M")
end = max(heat.dropna().index.max(), rain.dropna().index.max(), water.dropna().index.max())
timeline = pd.period_range(start, end, freq="M")
def aligned(s):
    return [None if pd.isna(v) else round(float(v), 3) for v in s.reindex(timeline).values]

ens = {
    "title": "Bangladesh ensemble (monthly)",
    "months": [str(p) for p in timeline],
    "voices": {
        "heat":  {"values": aligned(heat), "units": "degC anomaly vs 1951-1980", "dataset": gis["dataset"],
                  "place": f"Dhaka grid cell ({gis['cells']['Dhaka']['lat']}, {gis['cells']['Dhaka']['lon']})", "resolution": "250 km smoothing",
                  "mapping_key": "Heat then vs now", "credit": gis["credit"]},
        "rain":  {"values": aligned(rain), "units": "mm/day", "dataset": gp["dataset"],
                  "place": f"Dhaka grid cell ({gp['cells']['Dhaka']['lat']}, {gp['cells']['Dhaka']['lon']})", "resolution": "2.5 deg (~275 km)",
                  "mapping_key": "Monsoon then vs now", "caveat": gp.get("caveat"), "credit": gp["credit"]},
        "water": {"values": aligned(water), "units": "cm water-equivalent anomaly vs 2004-2009", "dataset": gr["dataset"],
                  "place": "Bangladesh box (lon 88-93, lat 20.5-26.7)", "resolution": "about 3 deg true resolution",
                  "mapping_key": "Water (bass)", "gap_note": gr["gap_note"],
                  "starts": "2002-04 (GRACE launch) - the water voice is silent before this", "credit": gr["credit"]},
    },
    "disclosure": "Three independent NASA records at different resolutions (one grid cell, one grid cell, a national box). "
                  "Voices moving together does not mean one causes the other. Null = no measurement (played as silence).",
    "generated_utc": now_utc(),
}
out = write_json(C / "ensemble_bd.json", ens)

# ---- self-checks ----
fails = []
if len(set(ens["months"])) != len(ens["months"]): fails.append("duplicate months")
if len(ens["months"]) != len(pd.period_range(start, end, freq="M")): fails.append("missing months")
for name, src in (("heat", heat), ("rain", rain), ("water", water)):
    vals = ens["voices"][name]["values"]
    for i, p in enumerate(timeline):
        a = src.get(p, float("nan")); b = vals[i]
        if (pd.isna(a) and b is not None) or (not pd.isna(a) and (b is None or abs(a - b) > 0.0006)):
            fails.append(f"{name} {p}: source {a} vs ensemble {b}"); break
w = ens["voices"]["water"]["values"]; m = ens["months"]
if any(w[m.index(x)] is not None for x in ("2017-08", "2017-12", "2018-03") if x in m): fails.append("GRACE gap months not null")
if any(v is not None for v, mm in zip(w, m) if mm < "2002-04"): fails.append("water values before 2002-04")
counts = {k: sum(v is not None for v in ens["voices"][k]["values"]) for k in ens["voices"]}
print(f"Wrote context/ensemble_bd.json ({out.stat().st_size/1024:.0f} KB): {len(m)} months {m[0]}..{m[-1]}; values per voice {counts}")
if fails:
    print("FAIL:", fails[:5]); sys.exit(1)
print("Self-checks PASS: values identical to the verified source files; gaps and pre-2002 water are null.")
