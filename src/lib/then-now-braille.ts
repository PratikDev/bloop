import { BN_MONTHS, bnNumber, bnUnit } from "@/a11y/brailleBangla";
import { brailleNumber } from "@/a11y/brailleText";
import type { DemoWindow, GraceContextFile } from "@/types/data-contract";
import type { StatItem } from "./then-now-stats";

type SeriesWindow = "A" | "B" | null;

export interface SeriesPoint {
  label: string;
  bn: string;
  value: number | null;
  window: SeriesWindow;
}

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
const EN_UNIT: Record<StatItem["unit"], string> = { "°C": " °C", "%": "%", "cm/yr": " cm/yr" };
const EN_NAME = (i: StatItem) => (i.label === null ? "change between decades" : i.label === "trend" ? "trend" : `${i.label} change`);

const BN_NAME = (i: StatItem) => (i.label === null ? "দুই দশকের পরিবর্তন" : i.label === "trend" ? "প্রবণতা" : i.label === "GPCP" ? "জিপিসিপি পরিবর্তন" : "জিপিসিসি পরিবর্তন");
const bnSigned = (v: number, d: number) => `${v < 0 ? "ঋণাত্মক " : ""}${bnNumber(Math.abs(v), d)}`;

export function changeNote(items: readonly StatItem[]): { en: string; bn: string } | null {
  if (!items.length) return null;
  const en = items.map((i) => `${EN_NAME(i)} ${signed(i.value, i.decimals)}${EN_UNIT[i.unit]}, 95% CI ${signed(i.ci[0], i.ciDecimals)} to ${signed(i.ci[1], i.ciDecimals)}`);
  const bn = items.map(
    (i) => `${BN_NAME(i)} ${bnSigned(i.value, i.decimals)} ${bnUnit(i.unit)} 95 শতাংশ সম্ভাব্য সীমা ${bnSigned(i.ci[0], i.ciDecimals)} থেকে ${bnSigned(i.ci[1], i.ciDecimals)}`,
  );
  return { en: en.join("; "), bn: bn.join(" এবং ") };
}
