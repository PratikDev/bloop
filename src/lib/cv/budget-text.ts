// The error budget in words (EN/BN through t): the measured error and its cents, the warning on a flagged axis, "error
// not known" (never 0) without a source, and why a record without a pitch axis has none.
import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import type { LiveBudget } from "./error-budget";
import { sigDecimals } from "./read-short";

const SEMITONE_DECIMALS = 1;

/** The measured error as it is shown: a value in the axis's unit, or a percentage on a log (relative-error) axis. */
export function errorText(lang: Lang, b: LiveBudget, unit: string): string | null {
  const e = b.axis.error;
  if (e === null) return null;
  if (b.axis.log) return `${formatInteger(100 * e, lang)} %`;
  const v = formatFixed(e, lang, sigDecimals(e));
  return unit ? `${v} ${unit}` : v;
}

/** One or two sentences: the budget, then the warning when flagged; "error not known" for a pitch axis with no budget. */
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
