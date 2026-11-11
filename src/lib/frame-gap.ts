// Both mode plays the ocean frame and the rain frame together, but the two are not from the same moment
//. The gap comes from the two manifests' frame times (latest/sst.json, latest/rain.json), never
// typed: it changes with every refresh. Under a day it is said in hours, from a day up in whole days.

import { brailleNumber } from "@/a11y/brailleText";
import { bindT, formatInteger, formatUtc, type BoundT, type Lang } from "@/lib/i18n";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export interface FrameGap {
  oceanIso: string;
  rainIso: string;
  /** rain − ocean, in ms (positive: the rain frame is newer). */
  ms: number;
  newer: "ocean" | "rain" | null; // null: same hour
  amount: number; // whole days, or whole hours under a day
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

/** "Ocean frame: 4 Nov 2026, 00:00 UTC · Rain frame: 6 Nov 2026, 01:30 UTC (2 days apart)". */
export function gapLong(t: BoundT, lang: Lang, g: FrameGap): string {
  const n = formatInteger(g.amount, lang);
  const apart = g.newer === null ? t("frameGap.same") : t(g.unit === "days" ? "frameGap.days" : "frameGap.hours", { n, count: g.amount });
  return t("frameGap.long", { ocean: formatUtc(g.oceanIso, lang), rain: formatUtc(g.rainIso, lang), apart });
}

/** Braille-ready short form: "rain 2d newer" (Western digits, both languages). */
export function gapShort(t: BoundT, g: FrameGap): string {
  if (g.newer === null) return t("frameGap.short.same");
  return t("frameGap.short", {
    which: t(g.newer === "rain" ? "frameGap.short.rain" : "frameGap.short.ocean"),
    n: brailleNumber(g.amount, 0),
    unit: t(g.unit === "days" ? "frameGap.short.d" : "frameGap.short.h"),
  });
}

/** Both languages at once, for captions (the caption bar renders whichever language is on when it shows). */
export function gapTexts(g: FrameGap): { en: string; bn: string } {
  return { en: gapLong(bindT("en"), "en", g), bn: gapLong(bindT("bn"), "bn", g) };
}
