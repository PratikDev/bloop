"""Step 6: 'Then vs Now' demo files - numbers, series and captions (single source of truth for the app).
Outputs
  public/data/demo/dhaka_then_now.json   - the killer demo (DhakaThenNowDemo in src/types/data-contract.ts, unchanged shape)
  public/data/demo/cities_then_now.json  - OPTIONAL: the same heat + rain comparison for every city in the context files
                                           (CitiesThenNowFile, contract section 13)
Captions follow TEAM_BUILD_PLAN Section 16 word for word; every signed number uses the true minus sign (U+2212).
City captions use the same templates with the city name. Only Dhaka's heat and rain were cross-checked against independent
records (P1b); other cities are flagged cross_checked: false, and cities that share a dataset grid cell are listed."""
import json
import pandas as pd
from common import *

WIN_A, WIN_B, WIN_B_GPCC = (1981, 1990), (2016, 2025), (2010, 2019)
HOT, RAIN = [4, 5], [6, 7, 8, 9]
C = PUBLIC / "context"

def signed(x, fmt):
    """Signed number with a true minus sign (U+2212), as in TEAM_BUILD_PLAN Section 16."""
    return format(x, fmt).replace("-", "\u2212")

def yearly(cell, key, months):
    s = pd.Series(cell[key], index=pd.PeriodIndex(cell["months"], freq="M"), dtype="float64")
    s = s[s.index.month.isin(months)]
    return s.groupby(s.index.year).mean()

def window(s, w):
    x = s[(s.index >= w[0]) & (s.index <= w[1])].dropna()
    return {"years": [int(i) for i in x.index], "values": [round(float(v), 3) for v in x.values],
            "mean": round(float(x.mean()), 3), "spread": round(float(x.std(ddof=0)), 3), "n_years": int(len(x))}

# ---- caption templates (Section 16) ----
def heat_caption(place, change, n_years):
    return (f"{place}, April–May: {signed(change, '+.2f')} °C (NASA GISTEMP, {WIN_A[0]}–{WIN_A[1]} vs "
            f"{WIN_B[0]}–{WIN_B[1]}, {n_years} years each).")

def rain_phrase(p_pct, c_pct):
    if p_pct <= 0 and c_pct <= 0: return "not wetter."
    if p_pct > 0 and c_pct > 0: return "wetter."
    return "no clear change."                      # the two independent records disagree in direction

def rain_caption(place, p_pct, c_pct):
    return (f"{place}, June–September: {rain_phrase(p_pct, c_pct)} GPCP {signed(p_pct, '+d')}% ({WIN_A[0]}–{WIN_A[1]} vs "
            f"{WIN_B[0]}–{WIN_B[1]}); rain gauges (GPCC) {signed(c_pct, '+d')}% ({WIN_A[0]}–{WIN_A[1]} vs "
            f"{WIN_B_GPCC[0]}–{WIN_B_GPCC[1]}).")

def water_caption(bd, nw):
    return (f"Water storage (GRACE): Bangladesh {signed(bd['mean_A'], '+.2f')} → {signed(bd['mean_B'], '+.2f')} cm; "
            f"NW India {signed(nw['mean_A'], '+.2f')} → {signed(nw['mean_B'], '+.2f')} cm (2003–06 vs 2021–24). "
            f"Silence = no satellite measurements (Jul 2017–May 2018).")

def city_blocks(name, gis, gp, gc):
    heat = yearly(gis["cells"][name], "anom_C", HOT)
    rain_p, rain_c = yearly(gp["cells"][name], "mm_per_day", RAIN), yearly(gc["cells"][name], "mm_per_day", RAIN)
    hA, hB = window(heat, WIN_A), window(heat, WIN_B)
    assert hA["n_years"] == hB["n_years"], f"{name}: heat windows have {hA['n_years']} vs {hB['n_years']} years - 'each' would be false"
    pA, pB = window(rain_p, WIN_A), window(rain_p, WIN_B)
    cA, cB = window(rain_c, WIN_A), window(rain_c, WIN_B_GPCC)
    d_heat = round(hB["mean"] - hA["mean"], 2)
    p_pct = round((pB["mean"] / pA["mean"] - 1) * 100); c_pct = round((cB["mean"] / cA["mean"] - 1) * 100)
    heat_block = {"dataset": "NASA GISTEMP v4, Dhaka cell, April-May anomaly vs 1951-1980".replace("Dhaka", name),
                  "A": {"window": list(WIN_A), **hA}, "B": {"window": list(WIN_B), **hB},
                  "change_C": d_heat, "caption": heat_caption(name, d_heat, hA["n_years"])}
    rain_block = {"gpcp": {"dataset": f"GPCP v2.3, {name} cell, June-September", "A": {"window": list(WIN_A), **pA},
                           "B": {"window": list(WIN_B), **pB}, "change_pct": p_pct},
                  "gpcc": {"dataset": f"GPCC gauges v2020, {name} cell, June-September", "A": {"window": list(WIN_A), **cA},
                           "B": {"window": list(WIN_B_GPCC), **cB}, "change_pct": c_pct},
                  "caption": rain_caption(name, p_pct, c_pct)}
    return heat_block, rain_block

def main():
    gis = json.load(open(C / "gistemp_bd.json")); gp = json.load(open(C / "gpcp_bd.json"))
    gc = json.load(open(C / "gpcc_bd.json")); gr = json.load(open(C / "grace.json"))["boxes"]
    heat, rain = city_blocks("Dhaka", gis, gp, gc)
    bd, nw = gr["Bangladesh"], gr["NW_India"]
    demo = {
        "title": "Dhaka then vs now",
        "story": "Hotter, not wetter, and the water underground is falling.",
        "heat": heat, "rain": rain,
        "water": {"dataset": "GRACE/GRACE-FO JPL mascons RL06.3Mv04 CRI",
                  "Bangladesh": {k: bd[k] for k in ("mean_A", "mean_B", "trend_cm_per_yr", "window_A", "window_B")},
                  "NW_India": {k: nw[k] for k in ("mean_A", "mean_B", "trend_cm_per_yr", "window_A", "window_B")},
                  "caption": water_caption(bd, nw)},
        "honesty_beat": "A popular reanalysis-based dataset disagreed with independent records at this location, so we checked before you heard it.",
        "not_claimed": ["more erratic rain (not tested)"],
        "generated_utc": now_utc()}
    write_json(PUBLIC / "demo" / "dhaka_then_now.json", demo)
    print(demo["heat"]["caption"]); print(demo["rain"]["caption"]); print(demo["water"]["caption"])
    print(f"  GPCP means {rain['gpcp']['A']['mean']:.2f} -> {rain['gpcp']['B']['mean']:.2f}; GPCC {rain['gpcc']['A']['mean']:.2f} -> "
          f"{rain['gpcc']['B']['mean']:.2f}; heat A {heat['A']['mean']:+.2f} B {heat['B']['mean']:+.2f}")
    print("Wrote public/data/demo/dhaka_then_now.json")

    # ---- optional: every city in the context files ----
    names = list(gis["cells"].keys())
    def sharing(ctx, name):
        me = (ctx["cells"][name]["lat"], ctx["cells"][name]["lon"])
        return [o for o in names if o != name and (ctx["cells"][o]["lat"], ctx["cells"][o]["lon"]) == me]
    cities = []
    for name in names:
        h, r = city_blocks(name, gis, gp, gc)
        h["cell"] = {"lat": gis["cells"][name]["lat"], "lon": gis["cells"][name]["lon"]}; h["shares_cell_with"] = sharing(gis, name)
        for key, ctx in (("gpcp", gp), ("gpcc", gc)):
            r[key]["cell"] = {"lat": ctx["cells"][name]["lat"], "lon": ctx["cells"][name]["lon"]}; r[key]["shares_cell_with"] = sharing(ctx, name)
        cities.append({"name": name, "cross_checked": name == "Dhaka", "heat": h, "rain": r})
        print(f"  {name:10s} heat {signed(h['change_C'], '+.2f')} °C (cell shared with {h['shares_cell_with'] or 'none'}); "
              f"GPCP {signed(r['gpcp']['change_pct'], '+d')}%, GPCC {signed(r['gpcc']['change_pct'], '+d')}% "
              f"(cell shared with {r['gpcp']['shares_cell_with'] or 'none'})")
    write_json(PUBLIC / "demo" / "cities_then_now.json", {
        "title": "Bangladesh cities then vs now",
        "note": "Same method and caption templates as Dhaka. Only Dhaka's heat and rain were cross-checked against independent "
                "records (P1b); other cities are computed, not individually cross-checked. Values come from each dataset's nearest "
                "grid cell, so some cities share a cell (see shares_cell_with) and are then the same record.",
        "water_note": "GRACE water storage is a national record (Bangladesh box); see dhaka_then_now.json water.",
        "cities": cities, "generated_utc": now_utc()})
    print("Wrote public/data/demo/cities_then_now.json (optional)")

if __name__ == "__main__":
    main()