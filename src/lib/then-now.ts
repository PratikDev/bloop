// L1's demo + GRACE files → the engine's ThenNowInput and the chart rows.
// Every number comes from the JSON; nothing here computes a new statistic.

import { voiceSpec } from "@/lib/audio/mapping";
import type { BoundT } from "@/lib/i18n";
import type { ThenNowInput, WindowSeries } from "@/lib/audio-adapter/types";
import type { CityThenNow, DemoWindow, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";

export type YearlyPart = "heat" | "monsoon";

/** mapping.json's own label for the heat voice's 0 °C point ("0 °C (the 1951–1980 normal)"), in the page's language. */
export function heatNormalLabel(t: BoundT): string | undefined {
  const label = voiceSpec("heat").legend.find((p) => p.value === 0)?.label;
  return label === undefined ? undefined : t("data.text", { text: label });
}

/** "1981–1990" from a window's first and last year. */
export const windowLabel = (w: DemoWindow) => `${w.window[0]}–${w.window[1]}`;

const series = (w: DemoWindow): WindowSeries => ({ label: windowLabel(w), years: w.years, values: w.values });

/** GRACE "2003-01..2006-12" → ["2003-01", "2006-12"]. */
const monthRange = (s: string): [string, string] => {
  const [a, b] = s.split("..");
  return [a, b];
};

/**
 * A city's comparison in the Dhaka demo's shape: its own heat and rain, the
 * national water record (contract §13: water is national only). Everything
 * that reads a demo, including buildThenNowInput, then works for any city.
 */
export function cityDemo(demo: DhakaThenNowDemo, city: CityThenNow): DhakaThenNowDemo {
  return { ...demo, heat: city.heat, rain: city.rain };
}

export function buildThenNowInput(demo: DhakaThenNowDemo, grace: GraceContextFile): ThenNowInput {
  const bd = grace.boxes.Bangladesh;
  return {
    heat: { A: series(demo.heat.A), B: series(demo.heat.B) },
    monsoon: { A: series(demo.rain.gpcp.A), B: series(demo.rain.gpcp.B) },
    water: { months: bd.months, cm: bd.cm, windowA: monthRange(bd.window_A), windowB: monthRange(bd.window_B) },
    captions: { heat: demo.heat.caption, monsoon: demo.rain.caption, water: demo.water.caption },
  };
}

/** The two windows of a yearly part (heat = GISTEMP, monsoon = GPCP). */
export function yearlyWindows(demo: DhakaThenNowDemo, part: YearlyPart): { A: DemoWindow; B: DemoWindow } {
  return part === "heat" ? demo.heat : demo.rain.gpcp;
}

/** The year(s) at the playhead: index runs through both windows; splitIndex plays the same index in both at once. */
export function playheadYears(pair: { A: DemoWindow; B: DemoWindow }, index: number | null, splitIndex: number | null): number[] {
  if (splitIndex !== null) return [pair.A.years[splitIndex], pair.B.years[splitIndex]].filter((y) => y !== undefined);
  const year = index === null ? undefined : [...pair.A.years, ...pair.B.years][index];
  return year === undefined ? [] : [year];
}

/** What a stripe or the ring compares against: heat is an anomaly from its normal (0), rain against the "then" window's own mean. */
export function yearlyBaseline(part: YearlyPart, pair: { A: DemoWindow; B: DemoWindow }): number {
  return part === "heat" ? 0 : pair.A.mean;
}

/** The value sounding now and what it's compared against. `value` is null where the record has none. */
export interface Beat {
  year: number;
  value: number | null;
  baseline: number;
}

export function yearlyBeat(part: YearlyPart, pair: { A: DemoWindow; B: DemoWindow }, index: number | null, splitIndex: number | null): Beat | null {
  const [year] = playheadYears(pair, index, splitIndex);
  if (year === undefined) return null;
  const i = splitIndex ?? (index as number);
  const value = splitIndex !== null ? pair.A.values[i] : [...pair.A.values, ...pair.B.values][i];
  return { year, value: value ?? null, baseline: yearlyBaseline(part, pair) };
}

export function waterBeat(grace: GraceContextFile, index: number | null): Beat | null {
  if (index === null) return null;
  const bd = grace.boxes.Bangladesh;
  const month = bd.months[index];
  return month === undefined ? null : { year: Number(month.slice(0, 4)), value: bd.cm[index] ?? null, baseline: 0 };
}

/** Where a playhead at `position` (a fractional index) falls within one window's panel, 0..1; null if it's in the other window. */
export function panelPosition(position: number, side: "then" | "now", nA: number, nB: number, split: boolean): number | null {
  const n = side === "then" ? nA : nB;
  const local = split || side === "then" ? position : position - nA;
  if (local < 0 || local > n - 1 || n < 2) return null;
  return local / (n - 1);
}

export interface YearRow {
  year: number;
  then: number | null;
  now: number | null;
}

/** One row per year in either window; the gap between windows is simply absent. */
export function yearRows(pair: { A: DemoWindow; B: DemoWindow }): YearRow[] {
  return [
    ...pair.A.years.map((year, i) => ({ year, then: pair.A.values[i], now: null })),
    ...pair.B.years.map((year, i) => ({ year, then: null, now: pair.B.values[i] })),
  ];
}

export interface ChartScale {
  domain: [number, number];
  ticks: number[];
}

const TICK_TARGET = 5;
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/** One y-axis for both panels of a comparison, so equal heights mean equal values. Always includes zero, as a single chart's axis does. */
export function sharedYScale(values: readonly number[]): ChartScale {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  const rough = (hi - lo || 1) / (TICK_TARGET - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = (NICE_STEPS.find((s) => s * magnitude >= rough) ?? 10) * magnitude;
  const first = Math.floor(lo / step);
  const last = Math.max(first + 1, Math.ceil(hi / step)); // never an empty range, even if every value is 0
  // Rounded back from the multiples: 0.1 × 3 must not print as 0.30000000000000004.
  const ticks = Array.from({ length: last - first + 1 }, (_, i) => Number(((first + i) * step).toFixed(6)));
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

export interface MonthRow {
  i: number;
  month: string;
  bangladesh: number | null;
  nwIndia: number | null;
}

export function waterRows(grace: GraceContextFile): MonthRow[] {
  const bd = grace.boxes.Bangladesh;
  const nw = grace.boxes.NW_India;
  return bd.months.map((month, i) => ({ i, month, bangladesh: bd.cm[i], nwIndia: nw.cm[i] ?? null }));
}

/** Runs of missing months, as [first index, last index] (for shading the chart). */
export function missingRuns(values: readonly (number | null)[]): [number, number][] {
  const runs: [number, number][] = [];
  values.forEach((v, i) => {
    if (v !== null) return;
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  });
  return runs;
}
