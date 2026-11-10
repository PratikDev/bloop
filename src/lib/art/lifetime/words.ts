// PURE: "Your lifetime"'s honest wording, built from the file's numbers. A trend is stated only when the file calls it
// clear (p < 0.05 and the 95% range excludes 0); otherwise "no clear trend", still with its range; with too few years,
// "too few years for a clear test" and the values' range only. Never a claim the statistics don't support.

import { formatFixed, formatSigned, formatYear, type BoundT, type Lang } from "@/lib/i18n";
import type { ClimateCellName } from "@/types/data-contract";
import type { SongPart } from "./song";

const DECIMALS = { heat: 2, rain: 2, water: 1 } as const;

export type Verdict = "clear" | "unclear" | "tooFew";
export const verdictOf = (p: SongPart): Verdict => (p.trend === null ? "tooFew" : p.trend.clear ? "clear" : "unclear");

/** One part's sentence. */
export function partLine(t: BoundT, lang: Lang, p: SongPart): string {
  const d = DECIMALS[p.part];
  const name = t(`lifetime.part.${p.part}`);
  const unit = t(`lifetime.unit.${p.part}`);
  const starts = t("lifetime.starts", { year: formatYear(p.from, lang) });
  const v = verdictOf(p);
  if (v === "tooFew" || p.trend === null) {
    return t("lifetime.tooFew", { part: name, lo: formatFixed(p.range[0], lang, d), hi: formatFixed(p.range[1], lang, d), unit, starts });
  }
  const per = (x: number) => formatSigned(x * 10, lang, d + 1);
  const params = { part: name, slope: per(p.trend.sen_slope), lo: per(p.trend.sen_slope_ci[0]), hi: per(p.trend.sen_slope_ci[1]), unit, starts };
  return v === "clear" ? t(p.trend.sen_slope > 0 ? "lifetime.rose" : "lifetime.fell", params) : t("lifetime.unclear", params);
}

/** "Since 1998 in Dhaka: …", every part's line after it. */
export function lifetimeLines(t: BoundT, lang: Lang, city: ClimateCellName, born: number, parts: readonly SongPart[]): string[] {
  return [t("lifetime.since", { year: formatYear(born, lang), city: t(`place.${city}`) }), ...parts.map((p) => partLine(t, lang, p))];
}
