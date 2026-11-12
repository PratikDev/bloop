// The Then vs Now statistics (stats.json, mentor item 10) as the app says them: one long line per part (the part
// view, its Details sheet, captions, Describe) and one braille-ready short form (the live region). The wording
// follows the result in the file: a change is stated with its range only when both tests and the CI agree
// (StatComparison.clear); otherwise "no clear change" ("no wetter" for rain), still with the range.
// Every number comes from stats.json; nothing here computes a statistic.

import { brailleNumber, clean } from "@/a11y/brailleText";
import { bnNumber } from "@/a11y/brailleBangla";
import { bindT, formatFixed, formatSigned, type BoundT, type Lang } from "@/lib/i18n";
import type { ClimateCellName } from "@/types/data-contract";
import type { StatComparison, StatTrend, ThenNowStatsFile } from "@/types/then-now-stats";

export type StatPart = "heat" | "monsoon" | "water";
export type Verdict = "clear" | "unclear" | "mixed";

export interface StatItem {
  label: "GPCP" | "GPCC" | "trend" | null; // rain's two sources, water's trend, null for heat's one difference
  value: number;
  ci: [number, number];
  decimals: number;
  ciDecimals: number;
  unit: "°C" | "%" | "cm/yr";
  clear: boolean;
}

export interface PartStats {
  part: StatPart;
  items: StatItem[];
  verdict: Verdict;
}

const verdictOf = (items: readonly StatItem[]): Verdict =>
  items.every((i) => i.clear) ? "clear" : items.some((i) => i.clear) ? "mixed" : "unclear";

const pct = (label: "GPCP" | "GPCC", c: StatComparison): StatItem => ({
  label,
  value: c.change_pct,
  ci: c.change_pct_ci,
  decimals: 0,
  ciDecimals: 1,
  unit: "%",
  clear: c.clear,
});

const trendItem = (tr: StatTrend): StatItem => ({ label: "trend", value: tr.sen_slope, ci: tr.sen_slope_ci, decimals: 2, ciDecimals: 2, unit: "cm/yr", clear: tr.clear });

/** The numbers behind one part's claim: heat = the decade difference, rain = GPCP and GPCC % change, water = the trend. */
export function partStats(stats: ThenNowStatsFile, city: ClimateCellName, part: StatPart): PartStats {
  const c = stats.cities[city];
  const items: StatItem[] =
    part === "heat"
      ? [{ label: null, value: c.heat.diff, ci: c.heat.diff_ci, decimals: 2, ciDecimals: 2, unit: "°C", clear: c.heat.clear }]
      : part === "monsoon"
        ? [pct("GPCP", c.rain.gpcp), pct("GPCC", c.rain.gpcc)]
        : [trendItem(stats.water.Bangladesh.trend)];
  return { part, items, verdict: verdictOf(items) };
}

const unitText = (t: BoundT, unit: StatItem["unit"]) => (unit === "%" ? "%" : unit === "°C" ? ` ${t("unit.celsius")}` : ` ${t("stats.unit.cmPerYear")}`);

/** "+1.37 °C (95% CI +0.88 to +1.86)" in the page's language and digits; a % stays on every bound. */
export function itemText(t: BoundT, lang: Lang, i: StatItem): string {
  const u = unitText(t, i.unit);
  const bound = i.unit === "%" ? "%" : "";
  return t("stats.item", {
    label: i.label === "trend" ? t("stats.label.trend") : (i.label ?? ""),
    value: `${formatSigned(i.value, lang, i.decimals)}${u}`,
    lo: `${formatSigned(i.ci[0], lang, i.ciDecimals)}${bound}`,
    hi: `${formatSigned(i.ci[1], lang, i.ciDecimals)}${bound}`,
  });
}

/** The one-line result ("Not a clear change: year-to-year variation is larger."). */
export const resultText = (t: BoundT, v: Verdict) => t(v === "clear" ? "stats.result.clear" : v === "mixed" ? "stats.result.mixed" : "stats.result.unclear");

/** The long line: head (when not clear), every item with its range, then the one-line result. */
export function longLine(t: BoundT, lang: Lang, ps: PartStats): string {
  const head = ps.verdict === "clear" ? "" : ps.verdict === "mixed" ? t("stats.head.mixed") : t(ps.part === "monsoon" ? "stats.head.noWetter" : "stats.head.noClear");
  return t("stats.line", { head, items: ps.items.map((i) => itemText(t, lang, i)).join("; "), result: resultText(t, ps.verdict) });
}

/** The short form for a braille display (one 40-cell line where possible): the first item, Western digits, ASCII signs. */
export function shortLine(t: BoundT, lang: Lang, ps: PartStats): string {
  const i = ps.items[0];
  const num = (v: number, d: number) => (lang === "bn" ? bnNumber(v, d) : brailleNumber(v, d));
  const sign = i.value > 0 ? "+" : "";
  const unit = i.unit === "°C" ? "C" : i.unit === "%" ? "%" : t("stats.unit.short.cmPerYear");
  return clean(
    t("announce.thenNow.stat", {
      part: t(`stats.short.${ps.part}`),
      value: `${sign}${num(i.value, i.decimals)}${unit}`,
      lo: num(i.ci[0], i.ciDecimals),
      hi: num(i.ci[1], i.ciDecimals),
      verdict: t(i.clear ? "stats.short.clear" : "stats.short.unclear"),
    }),
  );
}

/** A p-value as people read it: "< 0.001", else three decimals. */
export function pText(lang: Lang, p: number): string {
  return p < 0.001 ? `< ${formatFixed(0.001, lang, 3)}` : formatFixed(p, lang, 3);
}

export interface StatTexts {
  en: string;
  bn: string;
  shortEn: string;
  shortBn: string;
}

/** Both languages at once, for captions (the caption bar renders whichever language is on when it shows). */
export function statTexts(stats: ThenNowStatsFile, city: ClimateCellName, part: StatPart): StatTexts {
  const ps = partStats(stats, city, part);
  const [en, bn] = [bindT("en"), bindT("bn")];
  return { en: longLine(en, "en", ps), bn: longLine(bn, "bn", ps), shortEn: shortLine(en, "en", ps), shortBn: shortLine(bn, "bn", ps) };
}
