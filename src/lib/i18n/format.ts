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

/** A year, never grouped: "2016", not "2,016". */
export function formatYear(year: number, lang: Lang): string {
  return fmt(year, lang, { maximumFractionDigits: 0, useGrouping: false });
}

/** A position in a list, two digits: "01". */
export function formatIndex(n: number, lang: Lang): string {
  return fmt(n, lang, { minimumIntegerDigits: 2, useGrouping: false });
}

/** A chart axis value: up to two decimals, no trailing zeros. */
export function formatAxis(value: number, lang: Lang): string {
  return fmt(value, lang, { maximumFractionDigits: 2 });
}

export const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * The digits inside ready-made text (a data file's label such as "1981–1990"):
 * Bengali digits in Bangla, unchanged in English.
 */
export function localDigits(text: string, lang: Lang): string {
  return lang === "bn" ? text.replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]) : text;
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

/** "2003-01..2006-12" (a GRACE window) → "Jan 2003–Dec 2006". */
export function formatMonthRange(range: string, lang: Lang): string {
  return range
    .split("..")
    .map((m) => formatMonth(m, lang))
    .join("–");
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
