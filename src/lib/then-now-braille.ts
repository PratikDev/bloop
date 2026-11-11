// Then vs Now as the Braille Data Explorer reads it: the selected part's series for
// the selected city (heat and monsoon rain: one cell per year, the years between the two windows left blank so the gap
// shows; water: GRACE's months, Bangladesh-wide), and the note R says with the value: the part's own statistic from
// stats.json with its 95% interval. A single year has no interval of its own, so none is invented.
import { BN_MONTHS, bnNumber, bnUnit } from "@/a11y/brailleBangla";
import { brailleNumber } from "@/a11y/brailleText";
import type { DemoWindow, GraceContextFile } from "@/types/data-contract";
import type { StatItem } from "./then-now-stats";

export type SeriesWindow = "A" | "B" | null;

export interface SeriesPoint {
  /** The UEB table's label ("2019", "Jan 2003") and the Bengali table's ("2019", "জানুয়ারি 2003"). */
  label: string;
  bn: string;
  value: number | null;
  /** Which comparison window the point is in (null: between them, or outside both). */
  window: SeriesWindow;
}

/** One cell per year from the first window's first year to the second's last; the years between are blank. */
export function yearSeries(pair: { A: DemoWindow; B: DemoWindow }): SeriesPoint[] {
  const first = pair.A.years[0];
  const last = pair.B.years[pair.B.years.length - 1];
  const out: SeriesPoint[] = [];
  for (let year = first; year <= last; year++) {
    const a = pair.A.years.indexOf(year);
    const b = pair.B.years.indexOf(year);
    const value = a >= 0 ? pair.A.values[a] : b >= 0 ? pair.B.values[b] : null;
    out.push({ label: String(year), bn: String(year), value, window: a >= 0 ? "A" : b >= 0 ? "B" : null });
  }
  return out;
}

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** GRACE's months for Bangladesh, as the chart plays them (missing months are blank cells). */
export function waterSeries(grace: GraceContextFile): SeriesPoint[] {
  const bd = grace.boxes.Bangladesh;
  const [a0, a1] = bd.window_A.split("..");
  const [b0, b1] = bd.window_B.split("..");
  return bd.months.map((month, i) => {
    const [y, m] = month.split("-").map(Number);
    const window: SeriesWindow = month >= a0 && month <= a1 ? "A" : month >= b0 && month <= b1 ? "B" : null;
    return { label: `${EN_MONTHS[m - 1]} ${y}`, bn: `${BN_MONTHS[m - 1]} ${y}`, value: bd.cm[i] ?? null, window };
  });
}

const signed = (v: number, d: number) => `${v > 0 ? "+" : ""}${brailleNumber(v, d)}`;
/** "°C" stays a symbol here: the review line writes it in the reader's degree style. */
const EN_UNIT: Record<StatItem["unit"], string> = { "°C": " °C", "%": "%", "cm/yr": " cm/yr" };
const EN_NAME = (i: StatItem) => (i.label === null ? "change between decades" : i.label === "trend" ? "trend" : `${i.label} change`);

/** Bangla words for the statistic's name and unit (drafts, like every Bangla braille word until checked). */
const BN_NAME = (i: StatItem) => (i.label === null ? "দুই দশকের পরিবর্তন" : i.label === "trend" ? "প্রবণতা" : i.label === "GPCP" ? "জিপিসিপি পরিবর্তন" : "জিপিসিসি পরিবর্তন");
/** A signed number for the Bengali table: no minus sign there, so "ঋণাত্মক" (negative) before it. */
const bnSigned = (v: number, d: number) => `${v < 0 ? "ঋণাত্মক " : ""}${bnNumber(Math.abs(v), d)}`;

/** R's note: each statistic of the part (stats.json) with its 95% interval; null when there are none. */
export function changeNote(items: readonly StatItem[]): { en: string; bn: string } | null {
  if (!items.length) return null;
  const en = items.map((i) => `${EN_NAME(i)} ${signed(i.value, i.decimals)}${EN_UNIT[i.unit]}, 95% CI ${signed(i.ci[0], i.ciDecimals)} to ${signed(i.ci[1], i.ciDecimals)}`);
  const bn = items.map(
    (i) => `${BN_NAME(i)} ${bnSigned(i.value, i.decimals)} ${bnUnit(i.unit)} 95 শতাংশ সম্ভাব্য সীমা ${bnSigned(i.ci[0], i.ciDecimals)} থেকে ${bnSigned(i.ci[1], i.ciDecimals)}`,
  );
  return { en: en.join("; "), bn: bn.join(" এবং ") };
}
