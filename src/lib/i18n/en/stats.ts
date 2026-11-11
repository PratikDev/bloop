// English strings for the Then vs Now statistics (mentor item 10; src/lib/then-now-stats.ts builds the lines).
// Every number is a parameter from public/data/thenvsnow/stats.json.

export const statsEn = {
  "stats.title": "Uncertainty and significance",
  "stats.item": (p: { label: string; value: string; lo: string; hi: string }) => `${p.label ? `${p.label} ` : ""}${p.value} (95% CI ${p.lo} to ${p.hi})`,
  "stats.line": (p: { head: string; items: string; result: string }) => `${p.head ? `${p.head} ` : ""}${p.items}. ${p.result}`,
  "stats.head.noWetter": "No wetter in these records:",
  "stats.head.noClear": "No clear change in these records:",
  "stats.head.mixed": "Mixed result:",
  "stats.result.clear": "A clear change: larger than year-to-year variation.",
  "stats.result.unclear": "Not a clear change: year-to-year variation is larger.",
  "stats.result.mixed": "Only some of these records show a clear change.",
  "stats.unit.cmPerYear": "cm per year",
  "stats.label.trend": "Trend",
  "stats.unit.short.cmPerYear": "cm/yr",
  "stats.unit.perDecade": "°C per decade",
  "stats.short.heat": "Heat",
  "stats.short.monsoon": "Rain",
  "stats.short.water": "Water",
  "stats.short.clear": "clear",
  "stats.short.unclear": "not clear",
  "announce.thenNow.stat": (p: { part: string; value: string; lo: string; hi: string; verdict: string }) =>
    `${p.part} ${p.value} CI ${p.lo} to ${p.hi} ${p.verdict}`,
  "stats.row.result": "Result",
  "stats.row.tests": "Tests",
  "stats.tests": (p: { welch: string; mw: string; a: string; b: string }) =>
    `Welch's t-test p = ${p.welch}; Mann–Whitney U p = ${p.mw} (${p.a} and ${p.b} years)`,
  "stats.row.method": "Method",
  "stats.method.decades": (p: { draws: string }) =>
    `Decade mean of the yearly values; change = recent − baseline. The 95% range comes from ${p.draws} bootstrap resamples of the years. A change is called clear only if both tests give p < 0.05 and the range excludes 0.`,
  "stats.method.trend":
    "Monthly values minus each calendar month's mean; Mann–Kendall test, corrected for autocorrelation; Sen's slope with its 95% range.",
  "stats.row.trend": "Full-record trend",
  "stats.trend": (p: { test: string; from: string; to: string; slope: string; lo: string; hi: string; unit: string; p: string }) =>
    `${p.test}, ${p.from}–${p.to}: Sen's slope ${p.slope} ${p.unit} (95% CI ${p.lo} to ${p.hi}), p = ${p.p}`,
  "stats.row.alsoChecked": "Also checked",
  "stats.totals": (p: { which: string; value: string; welch: string; mw: string }) => `${p.which}: ${p.value}; p = ${p.welch} and ${p.mw}`,
  "stats.totals.jjas": "June–September totals",
  "stats.totals.annual": "Annual totals",
  "stats.row.windows": "Window means",
  "stats.row.measurement": "Measurement error",
  "stats.grace": (p: { median: string; min: string; max: string }) =>
    `GRACE's own 1-sigma for this box: median ${p.median} cm a month (${p.min} to ${p.max})`,
};
