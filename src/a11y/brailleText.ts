// Braille-ready text: the rules every braille-facing string follows (docs/accessibility/BRAILLE.md).
// A 40-cell display shows only the start of a line, and status messages arrive as flash messages that
// time out, so text is short, front-loaded and plain: no emoji, decorative Unicode or repeated
// punctuation; ASCII signs for glyphs a braille table may not have (≈ ± – − …); Western digits and
// Latin units (the Bengali table's handling of Bangla numerals is not yet tested on a viewer).

import { formatFixed } from "@/lib/i18n";

/** Status and announcement strings should fit one 40-cell line. */
export const STATUS_BUDGET = 40;

/** How a degree sign is written: the symbol, or the word (which every table shows). Pending viewer test. */
export type DegreeStyle = "symbol" | "word";

/** The one abbreviation set (also listed in BRAILLE.md). */
const ABBREV = {
  observation: "obs",
  model: "model",
  reanalysis: "rean",
  verified: "verified",
  "values with stated error": "stated err",
  relative: "relative",
  "pattern only": "pattern only",
  "no check": "no check",
  "not usable": "not usable",
  ocean: "SST",
  rain: "Rain",
  snow: "Snow",
  live: "live",
  stale: "stale",
} as const;

type AbbrevKey = keyof typeof ABBREV;

/** Characters no braille string may contain, with the reason (for the text-rules test). */
const BANNED: readonly { name: string; rx: RegExp }[] = [
  { name: "emoji or pictograph", rx: /\p{Extended_Pictographic}/u },
  { name: "decorative symbol", rx: /[•·★☆✓✔✗✘→←↑↓↔⇒⇐▲▼◆◇■□●○♪♫]/u },
  { name: "glyph a table may lack", rx: /[≈±≤≥×÷–—−…‘’“”]/u },
  { name: "special space", rx: /[   ​ ]/u },
  { name: "box drawing or block", rx: /[─-▟]/u },
  { name: "repeated punctuation", rx: /([!?.,;:*_=~#-])\1/u },
];

const REPLACE: readonly [RegExp, string][] = [
  [/≈/gu, "about "],
  [/±/gu, "+/-"],
  [/≤/gu, "<="],
  [/≥/gu, ">="],
  [/×/gu, "x"],
  [/÷/gu, "/"],
  [/[–—−]/gu, "-"],
  [/…/gu, ""],
  [/[‘’]/gu, "'"],
  [/[“”]/gu, '"'],
  [/[    ]/gu, " "],
  [/​/gu, ""],
];

/** A string made braille-ready: replacements, then anything still banned removed, repeats collapsed, spaces tidied. */
export function clean(s: string): string {
  let out = REPLACE.reduce((acc, [rx, to]) => acc.replace(rx, to), s);
  out = out.replace(/\p{Extended_Pictographic}|️/gu, "").replace(/[•·★☆✓✔✗✘→←↑↓↔⇒⇐▲▼◆◇■□●○♪♫]/gu, "");
  out = out.replace(/[─-▟]/gu, "").replace(/([!?.,;:*_=~#-])\1+/gu, "$1");
  return out.replace(/\s+/gu, " ").trim();
}

/** What breaks the rules in `s` (empty = passes). `budget` checks the length too. */
export function violations(s: string, budget?: number): string[] {
  const out = BANNED.filter((b) => b.rx.test(s)).map((b) => b.name);
  if (budget !== undefined && [...s].length > budget) out.push(`longer than ${budget}`);
  if (s !== s.trim() || /\s{2}/u.test(s)) out.push("stray spaces");
  return out;
}

/** Bangla (and other) digits → 0–9, so typed codes and numbers read the same everywhere. */
export function latinDigits(s: string): string {
  return s.replace(/[০-৯]/gu, (d) => String(d.charCodeAt(0) - 0x09e6));
}

/** Decimals a quantisation step allows (0.1 → 1, 0.005 → 3, 2 → 0). */
export function decimalsFor(step: number): number {
  if (!(step > 0) || !Number.isFinite(step)) return 1;
  return Math.max(0, Math.min(4, Math.ceil(-Math.log10(step) - 1e-9)));
}

/** A number at the record's stated precision, Western digits, ASCII minus, no "-0". */
export function brailleNumber(value: number, decimals: number): string {
  const s = clean(formatFixed(value, "en", decimals)).replace(/,/gu, "");
  return /^-0(\.0+)?$/u.test(s) ? s.slice(1) : s;
}

/** A unit as braille shows it ("°C" → "deg C" in word style); other units pass through clean. */
export function brailleUnit(unit: string, degree: DegreeStyle): string {
  const u = clean(unit);
  return degree === "word" ? u.replace(/°\s?/gu, "deg ") : u;
}

/** A place as "21.5N 89.8E" (one decimal, the hemisphere as one letter). */
export function braillePlace(lat: number, lon: number): string {
  const ns = `${brailleNumber(Math.abs(lat), 1)}${lat >= 0 ? "N" : "S"}`;
  const ew = `${brailleNumber(Math.abs(lon), 1)}${lon >= 0 ? "E" : "W"}`;
  return `${ns} ${ew}`;
}

/** A UTC time as "14:30" (and the date when `withDate`: "4 Aug 14:30"). */
export function brailleTime(iso: string, withDate: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  if (!withDate) return hm;
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(d);
  return `${d.getUTCDate()} ${month} ${hm}`;
}

/** Parts joined most-important-first; empty parts dropped, the result cleaned. */
export function frontLoad(parts: readonly (string | null | undefined | false)[]): string {
  return clean(parts.filter(Boolean).join(" "));
}

/** The short form of a badge or status, or the cleaned text itself when it has none. */
export function abbrev(word: string): string {
  return word in ABBREV ? ABBREV[word as AbbrevKey] : clean(word);
}

/** Plain lines wrapped at `width` cells for a braille note-taker: cleaned, word-wrapped, over-long words split. */
export function wrapText(lines: readonly string[], width: number): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const words = clean(raw).split(" ").filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (let word of words) {
      while ([...word].length > width) {
        if (line) out.push(line);
        line = "";
        out.push([...word].slice(0, width).join(""));
        word = [...word].slice(width).join("");
      }
      if (!line) line = word;
      else if ([...line].length + 1 + [...word].length <= width) line += ` ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** Long names a short line abbreviates (part of the one abbreviation set; BRAILLE.md lists it). */
const NAME_ABBREV: Record<string, string> = {
  "sea surface temperature": "SST",
  "sea surface salinity": "SSS",
  "land surface temperature": "LST",
  "aerosol optical depth": "AOD",
  "carbon monoxide": "CO",
  "tropospheric no2": "NO2",
  "vegetation index": "NDVI",
  "lightning flash rate": "flash rate",
  "lightning flash rate climatology": "flash rate",
  "sea ice concentration": "sea ice",
  "night lights": "night lights",
  "rain and snow rate": "rain rate",
  "chlorophyll a": "chl a",
};

/** A name as a short line writes it: its abbreviation, or the name itself. */
export function shortNameOf(name: string): string {
  const key = clean(name).toLowerCase();
  return NAME_ABBREV[key] ?? clean(name);
}
