// Place History (plan H1): one place's monthly record from L1's context files.

import type { ClimateCellName, GistempContextFile, RainContextFile } from "@/types/data-contract";

export const PLACES: readonly ClimateCellName[] = ["Chattogram", "Dhaka", "Rajshahi", "Sylhet"];

export type HistoryMetric = "heat" | "rain";

export interface MonthlySeries {
  months: string[];
  values: number[];
  lat: number;
  lon: number;
}

export function monthlySeries(
  metric: HistoryMetric,
  place: ClimateCellName,
  files: { gistemp: GistempContextFile; gpcp: RainContextFile },
): MonthlySeries {
  if (metric === "heat") {
    const c = files.gistemp.cells[place];
    return { months: c.months, values: c.anom_C, lat: c.lat, lon: c.lon };
  }
  const c = files.gpcp.cells[place];
  return { months: c.months, values: c.mm_per_day, lat: c.lat, lon: c.lon };
}

/**
 * Other places that are the same grid cell in this dataset (contract §4 note):
 * their records are identical, so the UI must not present them as different.
 */
export function sharedCells(
  metric: HistoryMetric,
  place: ClimateCellName,
  files: { gistemp: GistempContextFile; gpcp: RainContextFile },
): ClimateCellName[] {
  const here = monthlySeries(metric, place, files);
  return PLACES.filter((p) => {
    if (p === place) return false;
    const other = monthlySeries(metric, p, files);
    return other.lat === here.lat && other.lon === here.lon;
  });
}

/** The decades a series covers completely, newest first ("2010"…"2019"). */
export function fullDecades(months: readonly string[]): number[] {
  const years = new Set(months.map((m) => Number(m.slice(0, 4))));
  const decades: number[] = [];
  for (let d = Math.floor(Math.min(...years) / 10) * 10; d <= Math.max(...years); d += 10) {
    if (Array.from({ length: 10 }, (_, k) => d + k).every((y) => years.has(y))) decades.push(d);
  }
  return decades.reverse();
}

/** Index range [start, end) of a decade's months within the series. */
export function decadeRange(months: readonly string[], decade: number): [number, number] {
  const start = months.findIndex((m) => Number(m.slice(0, 4)) === decade);
  const end = months.findIndex((m) => Number(m.slice(0, 4)) === decade + 10);
  return [start, end === -1 ? months.length : end];
}
