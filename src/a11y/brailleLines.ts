// The value line and the review line, drawn from one reading (what the needle is on) for either braille table:
//  - UEB (English): short and front-loaded, so the core reading fits one 40-cell line: "SST 30.2C 21.5N 89.8E 1Nov
//    00UTC obs" (time, badge and status are added only while they fit; R gives the full sentence);
//  - Bengali table (বাংলা mode): Bangla words, digits, দশমিক and no colon (brailleBangla.ts).
// A source fills a BrailleReading; it never writes a line itself, so every record reads the same way.

import type { BoundT } from "@/lib/i18n";
import { BN, BN_STATUS, bnCompose, bnLayer, bnNumber, bnPlace, bnTime, bnUnit } from "./brailleBangla";
import { STATUS_BUDGET, abbrev, braillePlace, brailleNumber, brailleTime, brailleUnit, clean, frontLoad, type DegreeStyle } from "./brailleText";

export interface BrailleReading {
  /** Short name first in the line: "SST", "5669 sea salt". */
  short: string;
  /** Full name for review: "Sea surface temperature", "SVS 5669 Sea salt (relative density)". */
  long: string;
  /** The layer (or live track) id: its Bangla name comes from brailleBangla's table. */
  layer: string;
  /** The SVS ID (official and related records). */
  svs?: number;
  /** Added to the short line after the time, when it fits (the SVS ID when the short name isn't it). */
  tag?: string;
  kind: "value" | "dry" | "nodata";
  value: number | null;
  /** The record's stated precision. */
  decimals: number;
  /** Censored: the real value is at or below `value`. */
  below: boolean;
  snow: boolean;
  unit: string;
  place: { lat: number; lon: number } | { x: number; y: number };
  /** The time step: its ISO time and, when the record states one, its own label ("01 Mar 2017 (approx.)"). */
  time: { iso: string | null; label: string | null };
  badge: string;
  status: string;
  /** Relative or pattern-only: the line says so first. */
  relative: boolean;
}

export type BrailleLang = "en" | "bn";

/** "1Nov 00UTC", "3Nov 0630UTC". */
export function compactTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(d);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = d.getUTCMinutes() ? String(d.getUTCMinutes()).padStart(2, "0") : "";
  return `${d.getUTCDate()}${month} ${hh}${mm}UTC`;
}

/** The short line's status words (the review line keeps the full ones). */
const SHORT_STATUS: Record<string, string> = { "pattern only": "pattern", relative: "rel", "visual texture": "texture" };
/** Units written straight after the number ("30.2C", "12%", any unit with a slash: "12mm/h"); others follow a space. */
const ATTACHED = /^(°?C|K|%|mm|cm|m|PSU|ppm|ppbv|µg\/m³|mg\/m³)$/u;

/**
 * A unit as the short line writes it: "°C" → "C" (word style); relative and "colorbar units" dropped (the line
 * already says relative or pattern); a note in brackets cut ("cm (GMSL …)" → "cm"); "flashes per cell" after a
 * layer named flashes → "/cell".
 */
function shortUnit(unit: string, degree: DegreeStyle, layer: string): string {
  if (/^relative|^colorbar units$/iu.test(unit)) return "";
  let u = clean(unit.replace(/\s*\(.*\)\s*,?.*$/u, ""));
  const per = new RegExp(`^${layer.split("_")[0]} per `, "iu");
  if (per.test(u)) u = `/${u.replace(per, "")}`;
  return degree === "word" ? u.replace(/°\s?/u, "") : u;
}

function valueShort(t: BoundT, r: BrailleReading, degree: DegreeStyle, withUnit = true): string {
  if (r.kind === "nodata" || r.value === null) return t("braille.noData");
  if (r.kind === "dry") return t("braille.dry");
  const unit = withUnit ? shortUnit(r.unit, degree, r.layer) : "";
  const v = `${brailleNumber(r.value, r.decimals)}${!unit || ATTACHED.test(unit) || unit.includes("/") ? unit : ` ${unit}`}`;
  return `${r.below ? "<=" : ""}${v}${r.snow ? ` ${t("braille.snow")}` : ""}`;
}

function placeShort(r: BrailleReading): string {
  return "lat" in r.place ? braillePlace(r.place.lat, r.place.lon) : `x${brailleNumber(r.place.x, 0)} y${brailleNumber(r.place.y, 0)}`;
}

/** Parts joined in order; the optional ones are added only while the line fits `budget` cells. */
export function fitLine(required: readonly (string | false | null | undefined)[], optional: readonly (string | false | null | undefined)[], budget = STATUS_BUDGET): string {
  let line = frontLoad(required);
  for (const part of optional) {
    if (!part) continue;
    const next = frontLoad([line, part]);
    if ([...next].length <= budget) line = next;
  }
  return line;
}

/**
 * The value line for UEB: the core reading (status for a relative record, name, value, place) in one 40-cell line,
 * then time, SVS ID, badge and status while they fit. If the core alone is too long, the unit goes (R still has it).
 */
export function uebLine(t: BoundT, r: BrailleReading, degree: DegreeStyle): string {
  const time = r.time.label ? clean(r.time.label) : r.time.iso ? compactTime(r.time.iso) : "";
  const core = (withUnit: boolean) => [r.relative && (SHORT_STATUS[r.status] ?? abbrev(r.status)), r.short, valueShort(t, r, degree, withUnit), placeShort(r)];
  const required = [...frontLoad(core(true))].length <= STATUS_BUDGET ? core(true) : core(false);
  return fitLine(required, [time, r.tag, abbrev(r.badge), !r.relative && abbrev(r.status)]);
}

/** The review line (R) for UEB: the whole reading in words. */
export function uebReview(t: BoundT, r: BrailleReading, degree: DegreeStyle): string {
  const value = r.kind === "nodata" || r.value === null ? t("braille.noData") : r.kind === "dry" ? t("braille.dry")
    : `${brailleNumber(r.value, r.decimals)} ${brailleUnit(r.unit, degree)}`.trim()
        .replace("mm/h", t("braille.words.mmh")).replace(/deg C|°C/u, t("braille.words.degC"));
  const shown = r.below ? t("braille.atOrBelow", { value }) : `${value}${r.snow ? ` ${t("braille.snow")}` : ""}`;
  const time = r.time.label ? clean(r.time.label) : r.time.iso ? brailleTime(r.time.iso, true) : "";
  return clean(t("braille.reviewLine", { name: r.long, value: shown, place: `${placeShort(r)}${r.time.label && time ? `, ${time}` : ""}`,
    time: r.time.label ? "" : time, badge: r.badge, status: r.status }));
}

function bnName(r: BrailleReading): string {
  const layer = bnLayer(r.layer);
  return r.svs === undefined ? layer : frontLoad([`${BN.record} ${bnNumber(r.svs, 0)}`, layer]);
}

function bnValue(r: BrailleReading): string {
  if (r.kind === "nodata" || r.value === null) return BN.noData;
  if (r.kind === "dry") return BN.dry;
  return frontLoad([bnNumber(r.value, r.decimals), bnUnit(r.unit), r.below && BN.orLess, r.snow && BN.snow]);
}

function bnPlaceOf(r: BrailleReading): string {
  return "lat" in r.place ? bnPlace(r.place.lat, r.place.lon)
    : `${BN.across} ${bnNumber(r.place.x, 0)} ${BN.percent} ${BN.up} ${bnNumber(r.place.y, 0)} ${BN.percent}`;
}

function bnTimeOf(r: BrailleReading): string {
  if (!r.time.iso) return "";
  return frontLoad([bnTime(r.time.iso), r.time.label && /approx/iu.test(r.time.label) && BN.approx]);
}

/** The value line for the Bengali table (বাংলা mode): Bangla words only, front-loaded. */
export function banglaLine(r: BrailleReading): string {
  return bnCompose(frontLoad([r.relative && BN_STATUS[r.status], bnName(r), bnValue(r), bnPlaceOf(r), bnTimeOf(r), BN_STATUS[r.badge],
    !r.relative && BN_STATUS[r.status]]));
}

/** The review line (R) for the Bengali table: the same reading with the time zone named. */
export function banglaReview(r: BrailleReading): string {
  return bnCompose(frontLoad([r.relative && BN_STATUS[r.status], bnName(r), bnValue(r), bnPlaceOf(r), bnTimeOf(r) && `${bnTimeOf(r)} ${BN.utc}`,
    BN_STATUS[r.badge], !r.relative && BN_STATUS[r.status]]));
}

/** The value or review line for the reader's table. */
export function readingLine(t: BoundT, r: BrailleReading, lang: BrailleLang, degree: DegreeStyle, review: boolean): string {
  if (lang === "bn") return review ? banglaReview(r) : banglaLine(r);
  return review ? uebReview(t, r, degree) : uebLine(t, r, degree);
}
