// L1's demo + GRACE files → the engine's ThenNowInput and the chart rows.
// Every number comes from the JSON; nothing here computes a new statistic.

import { voiceSpec } from "@/lib/audio/mapping";
import type { ThenNowInput, WindowSeries } from "@/lib/audio-adapter/types";
import type { CityThenNow, DemoWindow, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";

export type YearlyPart = "heat" | "monsoon";

/** mapping.json's own label for the heat voice's 0 °C point ("0 °C (the 1951–1980 normal)"). */
export const heatNormalLabel = (): string | undefined => voiceSpec("heat").legend.find((p) => p.value === 0)?.label;

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
