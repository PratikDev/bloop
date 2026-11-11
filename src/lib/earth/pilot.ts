// "Forecast meets outcome": a pilot check of the experimental FWI forecast against what FIRMS saw. For each
// archived forecast day and each FIRMS box, the box's forecast class (the most common class of its cells, on that day's
// archived grid) beside the box's FIRMS hotspot count on the day the forecast was for (the next day), per sensor.
// Spearman ρ with n per sensor. Labelled a pilot check of an experimental forecast: no skill is claimed when n is
// small or ρ weak. Pure.

import type { FirmsDailyBlock, FirmsDailyRegion, FirmsNrtSource } from "@/types/data-contract";
import { modalClass } from "./class-grid";
import { dayCount, seriesOf } from "./firms";
import { nextDay } from "./fwi";
import type { GridSize } from "@/lib/data/grid";

/** Below this n, or below this |ρ|, the table says "too few days to tell" / "no clear agreement". */
const PILOT_MIN_N = 10;
const PILOT_MIN_RHO = 0.5;

interface PilotRow {
  region: FirmsDailyRegion;
  /** The day the forecast was issued (the archive's date) and the day it was for. */
  issued: string;
  forDay: string;
  /** The box's most common forecast class (1 = very low … 6 = extreme); null = no forecast cells. */
  fwiClass: number | null;
  /** The next day's FIRMS count per sensor; null when that sensor has no such day. */
  counts: Partial<Record<FirmsNrtSource, number | null>>;
}

interface PilotSummary {
  source: FirmsNrtSource;
  n: number;
  rho: number | null;
  /** "skill not claimed": n too small, or ρ too weak or undefined. */
  claim: "none" | "agreement";
}

export interface PilotDay {
  date: string;
  codes: Uint8Array;
}

export function pilotRows(daily: FirmsDailyBlock, size: GridSize & { nodata: number }, days: readonly PilotDay[]): PilotRow[] {
  const rows: PilotRow[] = [];
  for (const d of days) {
    const forDay = nextDay(d.date);
    for (const region of daily.regions) {
      const counts: PilotRow["counts"] = {};
      for (const source of daily.sources) {
        const s = seriesOf(daily, region, source);
        counts[source] = s ? (dayCount(s, forDay)?.count ?? null) : null;
      }
      if (Object.values(counts).every((c) => c === null)) continue; // no outcome yet for that day
      rows.push({ region, issued: d.date, forDay, fwiClass: modalClass(size, d.codes, daily.boxes[region]), counts });
    }
  }
  return rows;
}

/** Average ranks (ties share their mean rank). */
function ranks(xs: readonly number[]): number[] {
  const order = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x);
  const out = new Array<number>(xs.length);
  for (let k = 0; k < order.length; ) {
    let j = k;
    while (j + 1 < order.length && order[j + 1].x === order[k].x) j++;
    for (let m = k; m <= j; m++) out[order[m].i] = (k + j) / 2 + 1;
    k = j + 1;
  }
  return out;
}

/** Spearman's ρ (Pearson on average ranks); null when n < 3 or either side is constant. */
export function spearman(a: readonly number[], b: readonly number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null;
  const ra = ranks(a);
  const rb = ranks(b);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = mean(ra);
  const mb = mean(rb);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  return da === 0 || db === 0 ? null : num / Math.sqrt(da * db);
}

export function pilotSummary(rows: readonly PilotRow[], sources: readonly FirmsNrtSource[]): PilotSummary[] {
  return sources.map((source) => {
    const pairs = rows.flatMap((r) => (r.fwiClass !== null && typeof r.counts[source] === "number" ? [[r.fwiClass, r.counts[source] as number] as const] : []));
    const rho = spearman(
      pairs.map((p) => p[0]),
      pairs.map((p) => p[1]),
    );
    const claim = pairs.length >= PILOT_MIN_N && rho !== null && Math.abs(rho) >= PILOT_MIN_RHO ? "agreement" : "none";
    return { source, n: pairs.length, rho, claim };
  });
}
