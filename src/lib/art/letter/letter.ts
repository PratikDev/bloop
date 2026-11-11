import { brailleNumber, clean } from "@/a11y/brailleText";
import { wrapLines } from "@/lib/expedition-log";
import { formatDay, formatFixed, formatRainRate, formatTemperature, type BoundT, type Lang } from "@/lib/i18n";

const LETTER_WIDTH = 40;

export type LetterReading =
  | { kind: "ocean"; valueC: number; medianC: number | null }
  | { kind: "rain"; mmPerHour: number; percent: number | null }
  | { kind: "dry" }
  | { kind: "pattern"; record: string }
  | { kind: "class"; record: string; label: string; note: string }
  | { kind: "radiance"; value: number; unit: string }
  | { kind: "gap" }
  | { kind: "none" };

export interface LetterInput {
  place: string;
  date: string;
  reading: LetterReading;
  source: string;
  link: string | null;
}

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
