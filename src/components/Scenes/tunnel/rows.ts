// The Dhaka time tunnel's rows: one per year of the GISTEMP series, with that
// year's April–May anomaly — mean(April, May), exactly how the demo's heat
// windows are built (checked: all 20 demo years match) — and its twelve GPCP
// months (null where GPCP has no month: before 1979 and after the file ends).

import type { TunnelYear } from "@/lib/audio-adapter/types";
import type { DemoWindow, GistempCellSeries, RainCellSeries } from "@/types/data-contract";

const pad = (m: number) => String(m).padStart(2, "0");

export function tunnelYears(heat: GistempCellSeries, rain: RainCellSeries): TunnelYear[] {
  const heatAt = new Map(heat.months.map((m, i) => [m, heat.anom_C[i]]));
  const rainAt = new Map(rain.months.map((m, i) => [m, rain.mm_per_day[i]]));
  const first = Number(heat.months[0].slice(0, 4));
  const last = Number(heat.months[heat.months.length - 1].slice(0, 4));
  const years: TunnelYear[] = [];
  for (let year = first; year <= last; year++) {
    const apr = heatAt.get(`${year}-04`);
    const may = heatAt.get(`${year}-05`);
    years.push({
      year,
      heat: apr === undefined || may === undefined ? null : (apr + may) / 2,
      months: Array.from({ length: 12 }, (_, m) => rainAt.get(`${year}-${pad(m + 1)}`) ?? null),
    });
  }
  return years;
}

/** Quick check: the demo window's values against the rows (returns the years that differ). */
export function windowMismatches(rows: readonly TunnelYear[], w: DemoWindow): number[] {
  return w.years.filter((year, i) => {
    const row = rows.find((r) => r.year === year);
    return !row || row.heat === null || Math.abs(row.heat - w.values[i]) > 1e-9;
  });
}
