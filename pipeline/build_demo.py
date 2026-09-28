"""Step 6 (required): the killer demo 'Dhaka then vs now' - numbers, series and captions (single source of truth for the app).
Output: public/data/demo/dhaka_then_now.json (DhakaThenNowDemo in src/types/data-contract.ts).
Captions follow TEAM_BUILD_PLAN Section 16 word for word; signed numbers use the true minus sign (U+2212).
The same templates are reused by the optional build_cities.py, so both files are always formatted identically."""
import json
import pandas as pd
from common import *

WIN_A, WIN_B, WIN_B_GPCC = (1981, 1990), (2016, 2025), (2010, 2019)
HOT, RAIN = [4, 5], [6, 7, 8, 9]
C = PUBLIC / "context"

class DataCheckError(Exception):
    """A data condition a caption depends on is not met (explicit check, never skipped like assert under python -O)."""

def signed(x, fmt):
    """Signed number with a true minus sign (U+2212); a value that rounds to zero prints without a sign ('0', '0.00')."""
    s = format(x, fmt)
    if float(s) == 0:
        s = s.lstrip("+-")
    return s.replace("-", "\u2212")

def yearly(cell, key, months):
    s = pd.Series(cell[key], index=pd.PeriodIndex(cell["months"], freq="M"), dtype="float64")
    s = s[s.index.month.isin(months)]
    return s.groupby(s.index.year).mean()

def window(s, w):
    x = s[(s.index >= w[0]) & (s.index <= w[1])].dropna()
    return {"years": [int(i) for i in x.index], "values": [round(float(v), 3) for v in x.values],
            "mean": round(float(x.mean()), 3), "spread": round(float(x.std(ddof=0)), 3), "n_years": int(len(x))}

# ---- caption templates (TEAM_BUILD_PLAN Section 16) ----
def heat_caption(place, change, n_years, same_record_as=None):
    text = (f"{place}, April–May: {signed(change, '+.2f')} °C (NASA GISTEMP, {WIN_A[0]}–{WIN_A[1]} vs "
            f"{WIN_B[0]}–{WIN_B[1]}, {n_years} years each).")
    if same_record_as:
        text += f" Same NASA GISTEMP grid cell as {same_record_as}: this is the same record."
    return text

def rain_phrase(p_pct, c_pct):
    if p_pct <= 0 and c_pct <= 0: return "not wetter."
    if p_pct > 0 and c_pct > 0: return "wetter."
    return "no clear change."                      # the two independent records disagree in direction

def rain_caption(place, p_pct, c_pct, same_record_as=None):
    text = (f"{place}, June–September: {rain_phrase(p_pct, c_pct)} GPCP {signed(p_pct, '+d')}% ({WIN_A[0]}–{WIN_A[1]} vs "
            f"{WIN_B[0]}–{WIN_B[1]}); rain gauges (GPCC) {signed(c_pct, '+d')}% ({WIN_A[0]}–{WIN_A[1]} vs "
            f"{WIN_B_GPCC[0]}–{WIN_B_GPCC[1]}).")
    if same_record_as:
        text += f" Same GPCP and GPCC grid cells as {same_record_as}: this is the same record."
    return text

def water_caption(bd, nw):
    return (f"Water storage (GRACE): Bangladesh {signed(bd['mean_A'], '+.2f')} → {signed(bd['mean_B'], '+.2f')} cm; "
            f"NW India {signed(nw['mean_A'], '+.2f')} → {signed(nw['mean_B'], '+.2f')} cm (2003–06 vs 2021–24). "
            f"Silence = no satellite measurements (Jul 2017–May 2018).")

def city_blocks(name, gis, gp, gc, heat_same=None, rain_same=None):
    """Heat + rain blocks for one city (shapes HeatDemo / RainDemo). Raises DataCheckError if a caption condition fails."""
    heat = yearly(gis["cells"][name], "anom_C", HOT)
    rain_p, rain_c = yearly(gp["cells"][name], "mm_per_day", RAIN), yearly(gc["cells"][name], "mm_per_day", RAIN)
    hA, hB = window(heat, WIN_A), window(heat, WIN_B)
    if hA["n_years"] != hB["n_years"]:
        raise DataCheckError(f"{name}: heat windows have {hA['n_years']} vs {hB['n_years']} years - '… years each' would be false")
    pA, pB = window(rain_p, WIN_A), window(rain_p, WIN_B)
    cA, cB = window(rain_c, WIN_A), window(rain_c, WIN_B_GPCC)
    d_heat = round(hB["mean"] - hA["mean"], 2)
    p_pct = round((pB["mean"] / pA["mean"] - 1) * 100); c_pct = round((cB["mean"] / cA["mean"] - 1) * 100)
    heat_block = {"dataset": f"NASA GISTEMP v4, {name} cell, April-May anomaly vs 1951-1980",
                  "A": {"window": list(WIN_A), **hA}, "B": {"window": list(WIN_B), **hB},
                  "change_C": d_heat, "caption": heat_caption(name, d_heat, hA["n_years"], heat_same)}
    rain_block = {"gpcp": {"dataset": f"GPCP v2.3, {name} cell, June-September", "A": {"window": list(WIN_A), **pA},
                           "B": {"window": list(WIN_B), **pB}, "change_pct": p_pct},
                  "gpcc": {"dataset": f"GPCC gauges v2020, {name} cell, June-September", "A": {"window": list(WIN_A), **cA},
                           "B": {"window": list(WIN_B_GPCC), **cB}, "change_pct": c_pct},
                  "caption": rain_caption(name, p_pct, c_pct, rain_same)}
    return heat_block, rain_block

def load_context():
    return (json.load(open(C / "gistemp_bd.json")), json.load(open(C / "gpcp_bd.json")),
            json.load(open(C / "gpcc_bd.json")), json.load(open(C / "grace.json"))["boxes"])

def main():
    gis, gp, gc, gr = load_context()
    try:
        heat, rain = city_blocks("Dhaka", gis, gp, gc)
    except DataCheckError as e:
        raise SystemExit(f"FAIL: {e}")
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

if __name__ == "__main__":
    main()