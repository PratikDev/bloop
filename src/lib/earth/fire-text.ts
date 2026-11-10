// The words of the fires and fire-weather record (P2), pure, built once and used everywhere they appear: the record's
// readout, Describe, the braille line, the transcript and Ask Bloop. Every number is a formatted value from the files.

import { clean } from "@/a11y/brailleText";
import { formatDay, formatInteger, type BoundT, type Lang } from "@/lib/i18n";
import type { FirmsDailyBlock, FirmsDailyRegion, FirmsNrtSource } from "@/types/data-contract";
import { classLabel, type ClassMeta } from "./class-grid";
import { classesRule, classState, FIRE_WEATHER_VOICE, isSilent } from "./classes";
import type { DayCount } from "./firms";
import { satelliteOf } from "./firms";

export interface FireReading {
  /** The forecast class at the needle and the day it is for. */
  fwiCode: number;
  forDay: string;
  region: FirmsDailyRegion;
  source: FirmsNrtSource;
  day: string;
  /** null = the sensor has no such day (no data, not a zero). */
  count: DayCount | null;
}

const NO_CALCULATION = 0;

/** "very low", as the forecast file names the class. */
export const fwiClassText = (t: BoundT, meta: ClassMeta, code: number) => t("data.text", { text: classLabel(meta, code) ?? String(code) });

export function fwiLine(t: BoundT, lang: Lang, meta: ClassMeta, r: Pick<FireReading, "fwiCode" | "forDay">): string {
  if (r.fwiCode === NO_CALCULATION) return t("earth.fire.fwiNone");
  const silent = isSilent(classState(classesRule(FIRE_WEATHER_VOICE), r.fwiCode));
  return t("earth.fire.fwiAt", { cls: fwiClassText(t, meta, r.fwiCode), date: formatDay(r.forDay, lang), sound: t(silent ? "earth.fire.fwiSilent" : "earth.fire.fwiChord") });
}

/** The satellite a source reads, from the file (e.g. "NOAA-21"), or the source id if the file doesn't say. */
export const satText = (daily: FirmsDailyBlock, source: FirmsNrtSource) => satelliteOf(daily, source) ?? source;

export function firmsLine(t: BoundT, lang: Lang, daily: FirmsDailyBlock, r: Pick<FireReading, "region" | "source" | "day" | "count">): string {
  if (!r.count) return t("earth.fire.firmsNoDay");
  const p = { box: t("data.text", { text: r.region }), day: formatDay(r.day, lang), sat: satText(daily, r.source) };
  return r.count.count === 0 ? t("earth.fire.firmsZero", p) : t("earth.fire.firmsAt", { ...p, count: formatInteger(r.count.count, lang) });
}

const SAT_SHORT: readonly [RegExp, (m: RegExpExecArray) => string][] = [[/NOAA-(\d+)/u, (m) => `N${m[1]}`]];
const shortSat = (sat: string) => {
  for (const [rx, f] of SAT_SHORT) {
    const m = rx.exec(sat);
    if (m) return f(m);
  }
  return sat;
};
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const shortDay = (iso: string) => `${Number(iso.slice(8, 10))} ${SHORT_MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/** One braille line (src/a11y/brailleText.ts rules: ASCII, Western digits, ≤ 40 cells): "FWI very low; FIRMS 3 N21 5 Nov". */
export function fireBrailleLine(meta: ClassMeta, daily: FirmsDailyBlock, r: FireReading): string {
  const fwi = `FWI ${classLabel(meta, r.fwiCode) ?? r.fwiCode}`;
  const firms = r.count ? `FIRMS ${r.count.count} ${shortSat(satText(daily, r.source))} ${shortDay(r.day)}` : "FIRMS no data";
  return clean(`${fwi}; ${firms}`);
}

/** Describe, in layers: brief (the two readings), standard (+ the hotspot note), detailed (+ the active regions). */
export function fireDescription(t: BoundT, lang: Lang, meta: ClassMeta, daily: FirmsDailyBlock, r: FireReading, level: "brief" | "standard" | "detailed", regions: string | null): string {
  const brief = t("earth.fire.describe.brief", { fwi: fwiLine(t, lang, meta, r), firms: firmsLine(t, lang, daily, r) });
  if (level === "brief") return brief;
  const standard = `${brief} ${t("earth.fire.pixelNote")} ${t("earth.fire.fwiLabel")}`;
  if (level === "standard" || !regions) return standard;
  return `${standard} ${t("earth.fire.regionsLine", { list: regions })}`;
}
