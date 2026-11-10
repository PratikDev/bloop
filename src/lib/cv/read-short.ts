// Braille-safe short forms (src/a11y/brailleText.ts rules, Western digits) of what the panel and the chord say, front
// loaded and fitted to one STATUS_BUDGET line where the parts allow: "Read: SST med 29.8C P10-90 29.1-30.3 err 0.31C".
import { brailleNumber, clean, frontLoad, shortNameOf, STATUS_BUDGET } from "@/a11y/brailleText";
import type { BoxStats } from "./box-stats";
import type { LiveBudget } from "./error-budget";
import type { ReadSource } from "./read-source";

/** Decimals that show `digits` significant figures of `v` (the panel shows 3). */
export const SIG_DIGITS = 3;
/** An error is shown to 2 significant figures. */
const ERR_DIGITS = 2;
export function sigDecimals(v: number, digits: number = SIG_DIGITS): number {
  if (v === 0 || !Number.isFinite(v)) return 1;
  return Math.max(0, Math.min(4, digits - 1 - Math.floor(Math.log10(Math.abs(v)))));
}

/** A value with its unit as a braille line writes it: "29.8C", "0.5mm/h"; relative values carry no unit. */
export function brailleValue(v: number, unit: string, digits: number = SIG_DIGITS): string {
  return `${brailleNumber(v, sigDecimals(v, digits))}${clean(unit).replace(/°\s?/gu, "")}`;
}

/** The record's short name: "SST", "Rain", or the layer label shortened. */
export const shortRecord = (src: Pick<ReadSource, "recordId" | "name">) => (src.recordId === "ocean" ? "SST" : src.recordId === "rain" ? "Rain" : shortNameOf(src.name));

/** The first of `candidates` that fits one line, else the shortest. */
export function fitFirst(candidates: readonly string[], budget: number = STATUS_BUDGET): string {
  return candidates.find((c) => [...c].length <= budget) ?? candidates[candidates.length - 1];
}

/** The panel's short line. */
export function readShort(src: ReadSource, stats: BoxStats | null, budget: LiveBudget | null): string {
  const name = shortRecord(src);
  if (src.trust === "pattern") return frontLoad(["Read:", name, "pattern only"]);
  if (!stats || stats.p50 === null || stats.p10 === null || stats.p90 === null) return frontLoad(["Read:", name, "no data"]);
  const u = src.unit;
  const med = `med ${brailleValue(stats.p50, u)}`;
  const spread = `P10-90 ${brailleNumber(stats.p10, sigDecimals(stats.p10))}-${brailleNumber(stats.p90, sigDecimals(stats.p90))}`;
  const e = budget?.axis.error ?? null;
  // A log axis's error is relative (a share of the value): shown as a percentage.
  const err = !budget ? null : e === null ? "err unknown" : budget.axis.log ? `err ${brailleNumber(100 * e, 0)}%` : `err ${brailleValue(e, u, ERR_DIGITS)}`;
  const rel = src.trust === "relative" ? "rel" : null;
  return fitFirst([
    frontLoad(["Read:", name, rel, med, spread, err]),
    frontLoad([name, rel, med, spread, err]),
    frontLoad([name, rel, med, spread]),
  ]);
}
