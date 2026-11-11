"""Writes the numbers section of docs/THEN_VS_NOW_STATS.md from public/data/thenvsnow/stats.json (between the
<!-- stats:begin --> and <!-- stats:end --> markers), so the doc never holds a typed number."""
from common import ROOT

DOC = ROOT / "docs" / "THEN_VS_NOW_STATS.md"
BEGIN, END = "<!-- stats:begin -->", "<!-- stats:end -->"


def s(v, k):
    return f"{v:+.{k}f}".replace("-", "−")


def p(v):
    return "< 0.001" if v < 0.001 else f"{v:.3f}"


def ci(c, k, unit=""):
    return f"{s(c[0], k)}{unit} to {s(c[1], k)}{unit}"


def comp_row(city, label, c, shown_pct):
    val = f"{s(c['change_pct'], 1)}%" if shown_pct else f"{s(c['diff'], 2)} {c['unit']}"
    rng = ci(c["change_pct_ci"], 1, "%") if shown_pct else ci(c["diff_ci"], 2)
    win = f"{c['A']['window'][0]}–{c['A']['window'][1]} vs {c['B']['window'][0]}–{c['B']['window'][1]}"
    return (f"| {city} | {label} | {win} | {c['A']['n']} / {c['B']['n']} | {c['A']['mean']:.3f} → {c['B']['mean']:.3f} | {val} | {rng} | "
            f"{p(c['p_welch'])} | {p(c['p_mann_whitney'])} | {'clear' if c['clear'] else 'not clear'} |")


def trend_row(name, t, per):
    k = 10 if per == "decade" else 1
    unit = "°C per decade" if per == "decade" else "cm per year"
    return (f"| {name} | {int(t['years'][0])}–{int(t['years'][1])} | {t['n']} | {t['test']} | {t['lag1_autocorr']:.2f} | "
            f"{t['variance_factor']:.2f} | {s(t['sen_slope'] * k, 3)} {unit} | {ci([v * k for v in t['sen_slope_ci']], 3)} | {p(t['p'])} | "
            f"{'clear' if t['clear'] else 'not clear'} |")


def tables(st):
    head = ("| City | Record | Windows | n | Means | Change | 95% CI | Welch p | Mann–Whitney p | Result |\n"
            "|---|---|---|---|---|---|---|---|---|---|")
    L = [f"Generated {st['generated_utc']} by `{st['method']['script']}` ({st['method']['bootstrap_draws']} bootstrap draws, seed "
         f"{st['method']['seed']}). Means are in the record's unit: °C anomaly (heat), mm/day (rain, as the app shows), mm (totals), cm (water).",
         "", "### Decade vs decade, what the app shows", "", head]
    for city, c in st["cities"].items():
        L.append(comp_row(city, "Heat, April–May (GISTEMP)", c["heat"], False))
        L.append(comp_row(city, "Rain, June–Sept mean rate (GPCP)", c["rain"]["gpcp"], True))
        L.append(comp_row(city, "Rain, June–Sept mean rate (GPCC)", c["rain"]["gpcc"], True))
    L.append(comp_row("Bangladesh box", "Water, yearly means (GRACE)", st["water"]["Bangladesh"]["windows"], False))
    L += ["", "### Rain: also checked (not shown as the headline)", "", head]
    for city, c in st["cities"].items():
        for src in ("gpcp", "gpcc"):
            L.append(comp_row(city, f"June–Sept totals ({src.upper()})", c["rain"][src]["jjas_total_mm"], True))
            L.append(comp_row(city, f"Annual totals ({src.upper()})", c["rain"][src]["annual_total_mm"], True))
        L.append(comp_row(city, "GPCP only, newer decade (extra)", c["rain"]["gpcp_newer"], True))
    L += ["", "### Full-record trends", "",
          "| Series | Years | n | Test used | Lag-1 autocorrelation | Variance factor n/n* | Sen's slope | 95% CI | p | Result |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for city, c in st["cities"].items():
        L.append(trend_row(f"{city} heat, April–May (yearly)", c["heat"]["trend"], "decade"))
    for box, w in st["water"].items():
        L.append(trend_row(f"Water, {box} box (monthly, seasonal cycle removed)", w["trend"], "year"))
    L += ["", "### GRACE's own measurement uncertainty", "", "| Box | 1-sigma, median over months | min | max |", "|---|---|---|---|"]
    for box, w in st["water"].items():
        u = w["uncertainty_1sigma_cm"]
        L.append(f"| {box} | {u['median']:.2f} cm | {u['min']:.2f} cm | {u['max']:.2f} cm |")
    L += ["", f"File note: \"{st['water']['Bangladesh']['uncertainty_note']}\". We average it over the box like the values; that treats "
          "the mascons' errors as fully correlated, so it is an upper bound on the box mean's error."]
    return "\n".join(L)


def write(st):
    text = DOC.read_text(encoding="utf-8")
    a, b = text.index(BEGIN) + len(BEGIN), text.index(END)
    DOC.write_text(text[:a] + "\n" + tables(st) + "\n" + text[b:], encoding="utf-8")
