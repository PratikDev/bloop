// Number, coordinate and time formatting for both languages. Every number on
// screen passes through here, so the minus sign and digits are always right.

import type { Lang } from "./types";

const LOCALE: Record<Lang, string> = { en: "en-GB", bn: "bn-BD" };
const MINUS = "−";

function fmt(value: number, lang: Lang, opts: Intl.NumberFormatOptions): string {
  // Intl uses a hyphen-minus; typography needs the true minus sign.
  return new Intl.NumberFormat(LOCALE[lang], opts).format(value).replace("-", MINUS);
}

export function formatFixed(value: number, lang: Lang, decimals: number): string {
  return fmt(value, lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** With an explicit sign: "+1.37", "−9". */
export function formatSigned(value: number, lang: Lang, decimals: number): string {
  return fmt(value, lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals, signDisplay: "exceptZero" });
}

export function formatInteger(value: number, lang: Lang): string {
  return fmt(value, lang, { maximumFractionDigits: 0 });
}

/** Ocean temperature, one decimal ("28.4"). */
export function formatTemperature(valueC: number, lang: Lang): string {
  return formatFixed(valueC, lang, 1);
}

/** Rain rate: two significant figures below 10 mm/h, whole numbers above. */
export function formatRainRate(mmPerHour: number, lang: Lang): string {
  if (mmPerHour >= 10) return formatInteger(mmPerHour, lang);
  return fmt(mmPerHour, lang, { maximumSignificantDigits: 2 });
}

/** A coordinate magnitude with one decimal ("21.5"); the hemisphere is a word. */
export function formatDegrees(value: number, lang: Lang): string {
  return formatFixed(Math.abs(value), lang, 1);
}

/** "2017-07" → "Jul 2017". */
export function formatMonth(yyyyMm: string, lang: Lang): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

/** "2003-03-01" → "1 Mar" (a day within a season; the year is shown elsewhere). */
export function formatDayMonth(yyyyMmDd: string, lang: Lang): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "2026-09-25" → "25 Sept 2026". */
export function formatDay(yyyyMmDd: string, lang: Lang): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "25 Sep 2026, 00:00" in UTC. */
export function formatUtc(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(LOCALE[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  const time = new Intl.DateTimeFormat(LOCALE[lang], {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(d);
  return `${date}, ${time}`;
}
