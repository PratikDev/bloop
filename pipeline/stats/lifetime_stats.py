"""ART "Your lifetime" (docs/statement/ART.md): a city's yearly series from any birth year to the latest year, and the
same honest trend test as Then vs Now for every possible start year, so the app never computes a statistic.

Series (the yearly values Then vs Now plays, from the same files and the same seasons):
  heat  = GISTEMP April-May anomaly (degC), the city's cell;
  rain  = GPCP June-September mean daily rate (mm/day), the city's cell;
  water = GRACE Bangladesh box, yearly mean of the months present (cm): national, the same for every city.
Test (stats.methods.mann_kendall): Mann-Kendall with the Hamed-Rao correction and Sen's slope with its Gilbert 95% CI;
"clear" only if p < 0.05 and the CI excludes 0 (the Then vs Now rule). Fewer than MIN_YEARS years: no test.
Writes public/data/thenvsnow/lifetime.json. Run: cd pipeline && python -m stats.lifetime_stats"""
from common import PUBLIC, inherited_credit, now_utc, write_json
from stats.methods import ALPHA, mann_kendall
from stats.then_vs_now_stats import AM, JJAS, R, by_year, load, pair

OUT = PUBLIC / "thenvsnow" / "lifetime.json"
MIN_YEARS = 10


def grace_yearly(box):
    acc = {}
    for m, v in zip(box["months"], box["cm"]):
        if v is not None:
            acc.setdefault(int(m[:4]), []).append(v)
    return {y: sum(v) / len(v) for y, v in acc.items()}


def series(by, source, unit, voice, season):
    years = sorted(by)
    return {"source": source, "unit": unit, "voice": voice, "season": season, "years": years, "values": [R(by[y]) for y in years]}


def trends(s):
    """The trend from each start year to the last one (null where too few years for a test)."""
    out = {}
    years, values = s["years"], s["values"]
    for i, start in enumerate(years[:-1]):
        t, x = years[i:], values[i:]
        if len(t) < MIN_YEARS:
            out[str(start)] = None
            continue
        r = mann_kendall(t, x)
        out[str(start)] = {"n": r.n, "p": R(r.p, 6), "sen_slope": R(r.slope), "sen_slope_ci": pair(r.slope_ci), "test": r.test,
                           "clear": bool(r.p < ALPHA and (r.slope_ci[0] > 0 or r.slope_ci[1] < 0))}
    return out


def main():
    cities = load("demo/cities_then_now.json")
    gis, gp, grace = (load(f"context/{f}.json") for f in ("gistemp_bd", "gpcp_bd", "grace"))
    water = series(grace_yearly(grace["boxes"]["Bangladesh"]), "GRACE/GRACE-FO, Bangladesh box", "cm", "water", "yearly mean of the months present")
    water["trends"] = trends(water)
    out = {}
    for c in cities["cities"]:
        n = c["name"]
        heat = series(by_year(gis["cells"][n]["months"], gis["cells"][n]["anom_C"], AM), "NASA GISTEMP v4", "degC", "heat", "April-May")
        rain = series(by_year(gp["cells"][n]["months"], gp["cells"][n]["mm_per_day"], JJAS), "GPCP v2.3", "mm/day", "monsoon", "June-September")
        heat["trends"], rain["trends"] = trends(heat), trends(rain)
        out[n] = {"heat": heat, "rain": rain}
    write_json(OUT, {
        "title": "Your lifetime: yearly series and trends from every start year",
        "method": {"alpha": ALPHA, "min_years": MIN_YEARS,
                   "trend": "Mann-Kendall (Hamed-Rao 1998 variance correction when ranks show significant autocorrelation); "
                            "Sen's slope with Gilbert (1987) 95% CI; the same test as Then vs Now's full-record trend",
                   "clear_rule": "a trend is stated only if p < 0.05 and the 95% CI excludes 0",
                   "water": "GRACE is national (Bangladesh box): the same series for every city; yearly means of the months present",
                   "script": "pipeline/stats/lifetime_stats.py"},
        "credit": inherited_credit(cities, gis, gp, grace),
        "cities": out, "water": water, "generated_utc": now_utc()})
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
