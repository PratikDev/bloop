// PURE: a letter to the future, inspired by the Okjökull plaque: a dated card built only from
// data. The place, the frame's date, the value under the needle (through the engine's own reading), the dataset and
// the record's validation line; nothing else. A pattern-only record says so and records no value. A class record (fire
// weather, landslide exposure) records its class and its own "not a measurement" label, never a value; a night with
// no radiance (cloud) is a gap, never darkness.

import { brailleNumber, clean } from "@/a11y/brailleText";
import { wrapLines } from "@/lib/expedition-log";
import { formatDay, formatFixed, formatRainRate, formatTemperature, type BoundT, type Lang } from "@/lib/i18n";

/** The braille-friendly width of the saved letter (characters per line). */
export const LETTER_WIDTH = 40;

export type LetterReading =
  | { kind: "ocean"; valueC: number; medianC: number | null }
  | { kind: "rain"; mmPerHour: number; percent: number | null }
  | { kind: "dry" }
  | { kind: "pattern"; record: string }
  /** A category (a forecast or modelled class): its label and the record's own label of what it is not. */
  | { kind: "class"; record: string; label: string; note: string }
  /** Measured radiance (night lights), with its unit. */
  | { kind: "radiance"; value: number; unit: string }
  /** A cloud-masked night: a gap, not darkness. */
  | { kind: "gap" }
  | { kind: "none" };

export interface LetterInput {
  place: string;
  /** The frame's date, YYYY-MM-DD. */
  date: string;
  reading: LetterReading;
  /** The dataset that measured it (from the data file). */
  source: string;
  link: string | null;
}

/** The letter's sentences, on screen and spoken. */
export function letterLines(t: BoundT, lang: Lang, l: LetterInput): string[] {
  const head = t("letter.head", { place: l.place, date: formatDay(l.date, lang) });
  const r = l.reading;
  const by = t("letter.by", { source: l.source });
  switch (r.kind) {
    case "ocean":
      return [head, t("letter.ocean", { value: formatTemperature(r.valueC, lang) }), by, ...(r.medianC === null ? [] : [t("letter.median", { error: formatFixed(r.medianC, lang, 2) })])];
    case "rain":
      return [head, t("letter.rain", { value: formatRainRate(r.mmPerHour, lang) }), by, ...(r.percent === null ? [] : [t("letter.percent", { percent: formatFixed(r.percent, lang, 0) })])];
    case "dry":
      return [head, t("letter.dry"), by];
    case "pattern":
      return [head, t("letter.pattern", { record: r.record })];
    case "class":
      return [head, t("letter.class", { record: r.record, label: r.label }), r.note, t("letter.from", { source: l.source })];
    case "radiance":
      return [head, t("letter.radiance", { value: `${formatFixed(r.value, lang, 1)} ${r.unit}` }), by];
    case "gap":
      return [head, t("letter.gap"), t("letter.from", { source: l.source })];
    case "none":
      return [head, t("letter.none")];
  }
}

/** The saved letter (.txt, UTF-8): the letter wrapped to the braille width, then its facts, one per line. Western
 *  digits for braille: the facts repeat the value with brailleNumber. */
export function letterText(t: BoundT, lang: Lang, l: LetterInput): string {
  const r = l.reading;
  const value =
    r.kind === "ocean"
      ? `${brailleNumber(r.valueC, 1)} C`
      : r.kind === "rain"
        ? `${brailleNumber(r.mmPerHour, 1)} mm/h`
        : r.kind === "dry"
          ? "0 mm/h"
          : r.kind === "radiance"
            ? `${brailleNumber(r.value, 1)} ${r.unit}`
            : r.kind === "class"
              ? t("letter.classValue", { label: r.label })
              : t("letter.noValue");
  const facts = [
    `${t("letter.field.date")}: ${l.date}`,
    `${t("letter.field.place")}: ${l.place}`,
    `${t("letter.field.value")}: ${value}`,
    `${t("letter.field.source")}: ${l.source}`,
    ...(l.link ? [`${t("letter.field.link")}: ${l.link}`] : []),
  ];
  const body = letterLines(t, lang, l).join(" ");
  return [t("letter.title"), "", ...wrapLines(clean(body), LETTER_WIDTH), "", ...facts.flatMap((f) => wrapLines(clean(f), LETTER_WIDTH))].join("\n") + "\n";
}

export const letterFileName = (date: string) => `bloop-letter-${date}.txt`;
