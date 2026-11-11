"""Mentor item 10: uncertainty and significance for every Then vs Now claim, from the values the app already ships.

Reads public/data/demo/{dhaka,cities}_then_now.json (the yearly values each part plays) and public/data/context/
{gistemp,gpcp,gpcc}_bd.json, grace.json (full records, monthly totals, GRACE's own 1-sigma). Writes
public/data/thenvsnow/stats.json, which the app reads for its ranges and its wording. Method: docs/THEN_VS_NOW_STATS.md.
Run: cd pipeline && python -m stats.then_vs_now_stats"""
import calendar
import json
from collections import defaultdict
from common import PUBLIC, inherited_credit, now_utc, write_json
from stats import doc
from stats.methods import ALPHA, DRAWS, SEED, clear_change, compare, mann_kendall

OUT = PUBLIC / "thenvsnow" / "stats.json"
JJAS, AM, YEAR = (6, 7, 8, 9), (4, 5), tuple(range(1, 13))


def R(v, k=4):
    return None if v is None else round(float(v), k)


def pair(ci, k=4):
    return [R(ci[0], k), R(ci[1], k)]


def load(rel):
    return json.load(open(PUBLIC / rel, encoding="utf-8"))


def by_year(months, values, keep, total=False):
    """{year: mean (or total: mm/day x days) of the months in `keep`}, only for years where every one is present."""
    acc = defaultdict(dict)
    for m, v in zip(months, values):
        y, mo = int(m[:4]), int(m[5:7])
        if mo in keep and v is not None:
            acc[y][mo] = v * calendar.monthrange(y, mo)[1] if total else v
    return {y: (sum(d.values()) if total else sum(d.values()) / len(d)) for y, d in acc.items() if len(d) == len(keep)}


def in_window(series, w):
    return [series[y] for y in range(w[0], w[1] + 1) if y in series]


def comparison(a, b, wa, wb, shown, unit):
    c = compare(a, b)
    ci = c.pct_ci if shown == "change_pct" else c.diff_ci
    return {"shown": shown, "unit": unit,
            "A": {"window": list(wa), "n": c.n_a, "mean": R(c.mean_a)}, "B": {"window": list(wb), "n": c.n_b, "mean": R(c.mean_b)},
            "diff": R(c.diff), "diff_ci": pair(c.diff_ci), "change_pct": R(c.pct, 2), "change_pct_ci": pair(c.pct_ci, 2),
            "p_welch": R(c.p_welch, 5), "p_mann_whitney": R(c.p_mann_whitney, 5), "t": R(c.t, 3), "u": R(c.u, 1),
            "clear": clear_change(c.p_welch, c.p_mann_whitney, ci)}


def from_window(block, shown, unit):
    """A part's two shipped windows (the values the app plays)."""
    return comparison(block["A"]["values"], block["B"]["values"], block["A"]["window"], block["B"]["window"], shown, unit)


def trend(t, x, unit_per_year):
    r = mann_kendall(t, x)
    return {"years": [R(min(t), 2), R(max(t), 2)], "n": r.n, "test": r.test, "s": r.s, "z": R(r.z, 3), "p": R(r.p, 6),
            "tau": R(r.tau, 3), "sen_slope": R(r.slope), "sen_slope_ci": pair(r.slope_ci), "unit": unit_per_year,
            "lag1_autocorr": R(r.lag1_autocorr, 3), "variance_factor": R(r.variance_factor, 3),
            "clear": r.p < ALPHA and (r.slope_ci[0] > 0 or r.slope_ci[1] < 0)}


def rain_source(block, cell, unit):
    out = from_window(block, "change_pct", unit)
    wa, wb = block["A"]["window"], block["B"]["window"]
    for key, months in (("jjas_total_mm", JJAS), ("annual_total_mm", YEAR)):
        s = by_year(cell["months"], cell["mm_per_day"], months, total=True)
        out[key] = comparison(in_window(s, wa), in_window(s, wb), wa, wb, "change_pct", "mm")
    return out


def city_stats(c, gis, gp, gc):
    n = c["name"]
    heat_series = by_year(gis["cells"][n]["months"], gis["cells"][n]["anom_C"], AM)
    years = sorted(heat_series)
    return {
        "heat": {"source": "GISTEMP", "season": "April-May", **from_window(c["heat"], "diff", "°C"),
                 "trend": trend(years, [heat_series[y] for y in years], "°C per year")},
        "rain": {"season": "June-September", "shown_as": "JJAS mean daily rate (mm/day), change in %",
                 "gpcp": {"source": "GPCP", **rain_source(c["rain"]["gpcp"], gp["cells"][n], "mm/day")},
                 "gpcc": {"source": "GPCC", **rain_source(c["rain"]["gpcc"], gc["cells"][n], "mm/day")},
                 "gpcp_newer": {"source": "GPCP", **from_window(c["rain"]["gpcp_newer"], "change_pct", "mm/day")}}}


def water_stats(b, grace):
    months = [m for m, v in zip(b["months"], b["cm"]) if v is not None]
    vals = [v for v in b["cm"] if v is not None]
    by_month = defaultdict(list)
    for m, v in zip(months, vals):
        by_month[m[5:7]].append(v)
    clim = {k: sum(v) / len(v) for k, v in by_month.items()}
    t = [int(m[:4]) + (int(m[5:7]) - 0.5) / 12 for m in months]
    anom = [v - clim[m[5:7]] for m, v in zip(months, vals)]
    yearly = defaultdict(list)
    for m, v in zip(months, vals):
        yearly[int(m[:4])].append(v)
    yearly = {y: sum(v) / len(v) for y, v in yearly.items()}
    wa = [int(s[:4]) for s in b["window_A"].split("..")]
    wb = [int(s[:4]) for s in b["window_B"].split("..")]
    return {"windows": {"basis": "yearly means of the months present",
                        **comparison(in_window(yearly, wa), in_window(yearly, wb), wa, wb, "diff", "cm")},
            "trend": {"basis": "monthly values minus each calendar month's mean (seasonal cycle removed)",
                      **trend(t, anom, "cm per year")},
            "uncertainty_1sigma_cm": b.get("uncertainty_1sigma_cm"), "uncertainty_note": grace.get("uncertainty_note")}


def report(out_cities, water):
    for n, c in out_cities.items():
        h = c["heat"]
        print(f"{n:10s} heat {h['diff']:+.2f} C CI {h['diff_ci']} pW {h['p_welch']} pMW {h['p_mann_whitney']} clear={h['clear']}; "
              f"trend {h['trend']['sen_slope'] * 10:+.3f} C/dec CI {h['trend']['sen_slope_ci']} p {h['trend']['p']} {h['trend']['test']}")
        for k in ("gpcp", "gpcc", "gpcp_newer"):
            s = c["rain"][k]
            line = f"{'':10s} {k} {s['change_pct']:+.1f}% CI {s['change_pct_ci']} pW {s['p_welch']} pMW {s['p_mann_whitney']} clear={s['clear']}"
            if "jjas_total_mm" in s:
                j, a = s["jjas_total_mm"], s["annual_total_mm"]
                line += (f" | JJAS total {j['change_pct']:+.1f}% CI {j['change_pct_ci']} p {j['p_welch']}/{j['p_mann_whitney']}"
                         f" | annual {a['change_pct']:+.1f}% CI {a['change_pct_ci']} p {a['p_welch']}/{a['p_mann_whitney']}")
            print(line)
    for box, w in water.items():
        ww, tr = w["windows"], w["trend"]
        print(f"water {box}: {ww['diff']:+.2f} cm CI {ww['diff_ci']} pW {ww['p_welch']} pMW {ww['p_mann_whitney']} clear={ww['clear']}; "
              f"trend {tr['sen_slope']:+.3f} cm/yr CI {tr['sen_slope_ci']} p {tr['p']} {tr['test']} factor {tr['variance_factor']} "
              f"r1 {tr['lag1_autocorr']}; 1-sigma {w['uncertainty_1sigma_cm']}")


def main():
    cities = load("demo/cities_then_now.json")
    gis, gp, gc, grace = (load(f"context/{f}.json") for f in ("gistemp_bd", "gpcp_bd", "gpcc_bd", "grace"))
    out_cities = {c["name"]: city_stats(c, gis, gp, gc) for c in cities["cities"]}
    water = {box: water_stats(b, grace) for box, b in grace["boxes"].items()}
    write_json(OUT, {
        "title": "Then vs Now: uncertainty and significance",
        "disclosure": "Statistics computed by the Bloop pipeline from the yearly values the app plays (GISTEMP, GPCP, GPCC, GRACE); "
                      "method and every number in docs/THEN_VS_NOW_STATS.md.",
        "credit": inherited_credit(cities, gis, gp, gc, grace),
        "method": {"alpha": ALPHA, "ci": "95% bootstrap percentile interval: years resampled with replacement within each window",
                   "bootstrap_draws": DRAWS, "seed": SEED, "tests": "Welch's t-test and Mann-Whitney U, two-sided",
                   "trend": "Mann-Kendall (Hamed-Rao 1998 variance correction when ranks show significant autocorrelation); "
                            "Sen's slope with Gilbert (1987) 95% CI",
                   "clear_rule": "a change is stated only if both tests give p < 0.05 and the 95% CI excludes 0",
                   "script": "pipeline/stats/then_vs_now_stats.py", "doc": "docs/THEN_VS_NOW_STATS.md"},
        "cities": out_cities, "water": water, "generated_utc": now_utc()})
    report(out_cities, water)
    doc.write(load("thenvsnow/stats.json"))
    print("Wrote public/data/thenvsnow/stats.json and the numbers in docs/THEN_VS_NOW_STATS.md")


if __name__ == "__main__":
    main()
