import { brailleNumber, clean, frontLoad, shortNameOf, STATUS_BUDGET } from "@/a11y/brailleText";
import type { BoxStats } from "./box-stats";
import type { LiveBudget } from "./error-budget";
import type { ReadSource } from "./read-source";

const SIG_DIGITS = 3;
const ERR_DIGITS = 2;
export function sigDecimals(v: number, digits: number = SIG_DIGITS): number {
  if (v === 0 || !Number.isFinite(v)) return 1;
  return Math.max(0, Math.min(4, digits - 1 - Math.floor(Math.log10(Math.abs(v)))));
}

export function brailleValue(v: number, unit: string, digits: number = SIG_DIGITS): string {
  return `${brailleNumber(v, sigDecimals(v, digits))}${clean(unit).replace(/°\s?/gu, "")}`;
}

const shortRecord = (src: Pick<ReadSource, "recordId" | "name">) => (src.recordId === "ocean" ? "SST" : src.recordId === "rain" ? "Rain" : shortNameOf(src.name));

function fitFirst(candidates: readonly string[], budget: number = STATUS_BUDGET): string {
  return candidates.find((c) => [...c].length <= budget) ?? candidates[candidates.length - 1];
}

export function readShort(src: ReadSource, stats: BoxStats | null, budget: LiveBudget | null): string {
  const name = shortRecord(src);
  if (src.trust === "pattern") return frontLoad(["Read:", name, "pattern only"]);
  if (!stats || stats.p50 === null || stats.p10 === null || stats.p90 === null) return frontLoad(["Read:", name, "no data"]);
  const u = src.unit;
  const med = `med ${brailleValue(stats.p50, u)}`;
  const spread = `P10-90 ${brailleNumber(stats.p10, sigDecimals(stats.p10))}-${brailleNumber(stats.p90, sigDecimals(stats.p90))}`;
  const e = budget?.axis.error ?? null;
  const err = !budget ? null : e === null ? "err unknown" : budget.axis.log ? `err ${brailleNumber(100 * e, 0)}%` : `err ${brailleValue(e, u, ERR_DIGITS)}`;
  const rel = src.trust === "relative" ? "rel" : null;
  return fitFirst([
    frontLoad(["Read:", name, rel, med, spread, err]),
    frontLoad([name, rel, med, spread, err]),
    frontLoad([name, rel, med, spread]),
  ]);
}
