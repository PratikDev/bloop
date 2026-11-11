import { brailleNumber } from "@/a11y/brailleText";
import { bindT, formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export interface FrameGap {
  oceanIso: string;
  rainIso: string;
  ms: number;
  newer: "ocean" | "rain" | null;
  amount: number;
  unit: "days" | "hours";
}

export function frameGap(oceanIso: string, rainIso: string): FrameGap | null {
  const o = Date.parse(oceanIso);
  const r = Date.parse(rainIso);
  if (Number.isNaN(o) || Number.isNaN(r)) return null;
  const ms = r - o;
  const abs = Math.abs(ms);
  const unit = abs < DAY_MS ? "hours" : "days";
  const amount = Math.round(abs / (unit === "days" ? DAY_MS : HOUR_MS));
  return { oceanIso, rainIso, ms, newer: amount === 0 ? null : ms > 0 ? "rain" : "ocean", amount, unit };
}

export function gapLong(t: BoundT, lang: Lang, g: FrameGap): string {
  const n = formatInteger(g.amount, lang);
  const apart = g.newer === null ? t("frameGap.same") : t(g.unit === "days" ? "frameGap.days" : "frameGap.hours", { n, count: g.amount });
  return t("frameGap.long", { ocean: formatUtc(g.oceanIso, lang), rain: formatUtc(g.rainIso, lang), apart });
}

export function gapShort(t: BoundT, g: FrameGap): string {
  if (g.newer === null) return t("frameGap.short.same");
  return t("frameGap.short", {
    which: t(g.newer === "rain" ? "frameGap.short.rain" : "frameGap.short.ocean"),
    n: brailleNumber(g.amount, 0),
    unit: t(g.unit === "days" ? "frameGap.short.d" : "frameGap.short.h"),
  });
}

export function gapTexts(g: FrameGap): { en: string; bn: string } {
  return { en: gapLong(bindT("en"), "en", g), bn: gapLong(bindT("bn"), "bn", g) };
}
