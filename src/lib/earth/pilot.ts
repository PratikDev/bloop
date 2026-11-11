import type { FirmsDailyBlock, FirmsDailyRegion, FirmsNrtSource } from "@/types/data-contract";
import { modalClass } from "./class-grid";
import { dayCount, seriesOf } from "./firms";
import { nextDay } from "./fwi";
import type { GridSize } from "@/lib/data/grid";

const PILOT_MIN_N = 10;
const PILOT_MIN_RHO = 0.5;

interface PilotRow {
  region: FirmsDailyRegion;
  issued: string;
  forDay: string;
  fwiClass: number | null;
  counts: Partial<Record<FirmsNrtSource, number | null>>;
}

interface PilotSummary {
  source: FirmsNrtSource;
  n: number;
  rho: number | null;
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
      if (Object.values(counts).every((c) => c === null)) continue;
      rows.push({ region, issued: d.date, forDay, fwiClass: modalClass(size, d.codes, daily.boxes[region]), counts });
    }
  }
  return rows;
}

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
