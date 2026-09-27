"""Step 6: numbers + series + captions for the killer demo 'Dhaka then vs now' (single source of truth for the app)."""
import json
import pandas as pd
from common import *

WIN_A, WIN_B, WIN_B_GPCC = (1981, 1990), (2016, 2025), (2010, 2019)
HOT, RAIN = [4, 5], [6, 7, 8, 9]

def yearly(cell, key, months):
    s = pd.Series(cell[key], index=pd.PeriodIndex(cell["months"], freq="M"), dtype="float64")
    s = s[s.index.month.isin(months)]
    return s.groupby(s.index.year).mean()

def window(s, w):
    x = s[(s.index >= w[0]) & (s.index <= w[1])].dropna()
    return {"years": [int(i) for i in x.index], "values": [round(float(v), 3) for v in x.values],
            "mean": round(float(x.mean()), 3), "spread": round(float(x.std(ddof=0)), 3), "n_years": int(len(x))}

def main():
    C = PUBLIC / "context"
    gis = json.load(open(C / "gistemp_bd.json"))["cells"]["Dhaka"]
    gp = json.load(open(C / "gpcp_bd.json"))["cells"]["Dhaka"]
    gc = json.load(open(C / "gpcc_bd.json"))["cells"]["Dhaka"]
    gr = json.load(open(C / "grace.json"))["boxes"]
    heat = yearly(gis, "anom_C", HOT); rain_p = yearly(gp, "mm_per_day", RAIN); rain_c = yearly(gc, "mm_per_day", RAIN)
    hA, hB = window(heat, WIN_A), window(heat, WIN_B)
    pA, pB = window(rain_p, WIN_A), window(rain_p, WIN_B)
    cA, cB = window(rain_c, WIN_A), window(rain_c, WIN_B_GPCC)
    d_heat = round(hB["mean"] - hA["mean"], 2)
    p_pct = round((pB["mean"] / pA["mean"] - 1) * 100); c_pct = round((cB["mean"] / cA["mean"] - 1) * 100)
    bd, nw = gr["Bangladesh"], gr["NW_India"]
    demo = {
        "title": "Dhaka then vs now",
        "story": "Hotter, not wetter, and the water underground is falling.",
        "heat": {"dataset": "NASA GISTEMP v4, Dhaka cell, April-May anomaly vs 1951-1980", "A": {"window": WIN_A, **hA}, "B": {"window": WIN_B, **hB},
                 "change_C": d_heat,
                 "caption": f"Dhaka, April–May: {d_heat:+.2f} °C (NASA GISTEMP, {WIN_A[0]}–{WIN_A[1]} vs {WIN_B[0]}–{WIN_B[1]}, {hA['n_years']} and {hB['n_years']} years)."},
        "rain": {"gpcp": {"dataset": "GPCP v2.3, Dhaka cell, June-September", "A": {"window": WIN_A, **pA}, "B": {"window": WIN_B, **pB}, "change_pct": p_pct},
                 "gpcc": {"dataset": "GPCC gauges v2020, Dhaka cell, June-September", "A": {"window": WIN_A, **cA}, "B": {"window": WIN_B_GPCC, **cB}, "change_pct": c_pct},
                 "caption": f"Dhaka, June–September: not wetter. GPCP {p_pct:+d}% ({WIN_A[0]}–{WIN_A[1]} vs {WIN_B[0]}–{WIN_B[1]}); rain gauges (GPCC) {c_pct:+d}% ({WIN_A[0]}–{WIN_A[1]} vs {WIN_B_GPCC[0]}–{WIN_B_GPCC[1]})."},
        "water": {"dataset": "GRACE/GRACE-FO JPL mascons RL06.3Mv04 CRI", "Bangladesh": {k: bd[k] for k in ("mean_A", "mean_B", "trend_cm_per_yr", "window_A", "window_B")},
                  "NW_India": {k: nw[k] for k in ("mean_A", "mean_B", "trend_cm_per_yr", "window_A", "window_B")},
                  "caption": f"Water storage (GRACE): Bangladesh {bd['mean_A']:+.2f} → {bd['mean_B']:+.2f} cm; NW India {nw['mean_A']:+.2f} → {nw['mean_B']:+.2f} cm (2003–06 vs 2021–24). Silence = no satellite measurements (Jul 2017–May 2018)."},
        "honesty_beat": "A popular reanalysis-based dataset disagreed with independent records at this location, so we checked before you heard it.",
        "not_claimed": ["more erratic rain (not tested)"],
        "generated_utc": now_utc()}
    write_json(PUBLIC / "demo" / "dhaka_then_now.json", demo)
    print(demo["heat"]["caption"]); print(demo["rain"]["caption"]); print(demo["water"]["caption"])
    print(f"  GPCP means {pA['mean']:.2f} -> {pB['mean']:.2f}; GPCC {cA['mean']:.2f} -> {cB['mean']:.2f}; heat A {hA['mean']:+.2f} B {hB['mean']:+.2f}")
    print("Wrote public/data/demo/dhaka_then_now.json")

if __name__ == "__main__":
    main()
