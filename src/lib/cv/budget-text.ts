import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import type { LiveBudget } from "./error-budget";
import { sigDecimals } from "./read-short";

const SEMITONE_DECIMALS = 1;

export function errorText(lang: Lang, b: LiveBudget, unit: string): string | null {
  const e = b.axis.error;
  if (e === null) return null;
  if (b.axis.log) return `${formatInteger(100 * e, lang)} %`;
  const v = formatFixed(e, lang, sigDecimals(e));
  return unit ? `${v} ${unit}` : v;
}

export function budgetLines(t: BoundT, lang: Lang, budget: LiveBudget | null, unit: string, pitch = true): string[] {
  if (!pitch) return [t("cv.budget.noPitch")];
  const error = budget ? errorText(lang, budget, unit) : null;
  if (!budget) return [t("cv.budget.unknown")];
  if (error === null) return [t("cv.budget.unknown")];
  if (budget.cents === null) return [t("cv.budget.zoomWaiting")];
  const lines = [t("cv.budget.known", { error, cents: formatInteger(budget.cents, lang) })];
  if (budget.flag && budget.withinSemitones !== null) lines.push(t("cv.budget.flag", { semitones: formatFixed(budget.withinSemitones, lang, SEMITONE_DECIMALS) }));
  return lines;
}
