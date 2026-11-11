import { brailleNumber, clean, frontLoad, shortNameOf, STATUS_BUDGET } from "@/a11y/brailleText";
import type { ChordGate, ChordTone } from "@/lib/audio/layers/types";
import { formatFixed, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import type { BoxStats } from "./boxes";
import type { LiveBudget } from "./error-budget";
import type { ReadSource } from "./read-source";

const SIG_DIGITS = 3;
const ERR_DIGITS = 2;
const SEMITONE_DECIMALS = 1;

export function sigDecimals(v: number, digits: number = SIG_DIGITS): number {
  if (v === 0 || !Number.isFinite(v)) return 1;
  return Math.max(0, Math.min(4, digits - 1 - Math.floor(Math.log10(Math.abs(v)))));
}

function brailleValue(v: number, unit: string, digits: number = SIG_DIGITS): string {
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

const pct = (f: number) => 100 * f;

export function chordText(t: BoundT, lang: Lang, gate: ChordGate, tones: readonly ChordTone[], unit: string, brief: boolean): string {
  if (!gate.allowed || !tones.length) return t(`cv.chord.block.${gate.block ?? "off"}`);
  const u = gate.trust === "relative" ? "" : unit;
  const v = (x: number) => (u ? `${formatFixed(x, lang, sigDecimals(x))} ${u}` : formatFixed(x, lang, sigDecimals(x)));
  const rel = gate.trust === "relative" ? ` (${t("cv.chord.relative")})` : "";
  if (brief) return tones.length === 1 ? t("cv.chord.briefOne") : t("cv.chord.brief", { count: formatInteger(tones.length, lang) });
  if (tones.length === 1) return t("cv.chord.one", { a: v(tones[0].value) }) + rel;
  const [a, b] = tones;
  return t("cv.chord.two", { a: v(a.value), pa: formatInteger(pct(a.fraction), lang), b: v(b.value), pb: formatInteger(pct(b.fraction), lang) }) + rel;
}

export function chordShort(gate: ChordGate, tones: readonly ChordTone[], unit: string): string {
  if (!gate.allowed || !tones.length) return "";
  const u = gate.trust === "relative" ? "" : unit;
  return frontLoad(["Chord", `${tones.length} grp`, ...tones.map((x) => `${brailleValue(x.value, u)} ${brailleNumber(pct(x.fraction), 0)}%`)]);
}
