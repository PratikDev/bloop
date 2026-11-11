// Fires (FIRMS) and vegetation (NDVI) as then-vs-now pairs for the charts.
// Every number is from L1's files; nothing here computes a new statistic
// beyond picking which cases to show (so fires get no mean line: the file has none).

import type { FirmsCase, FirmsContextFile, FirmsRegion, NdviContextFile, NdviPointName } from "@/types/data-contract";

export const FIRE_REGIONS = ["CHT_Bangladesh_MarApr", "Punjab_India_OctNov"] as const satisfies readonly FirmsRegion[];

/** One side of a comparison: a label for the legend and one value per position. */
export interface PairSide {
  label: string;
  values: number[];
  mean: number | null; // from the file only (NDVI has one; FIRMS doesn't)
}

export interface SeriesPair {
  then: PairSide;
  now: PairSide;
  /** Position → the date it stands for on each side (the two sides line up by position). */
  dates: { then: string[]; now: string[] };
}

export interface PairRow {
  i: number;
  then: number | null;
  now: number | null;
}

export function pairRows(pair: SeriesPair): PairRow[] {
  const n = Math.max(pair.then.values.length, pair.now.values.length);
  return Array.from({ length: n }, (_, i) => ({ i, then: pair.then.values[i] ?? null, now: pair.now.values[i] ?? null }));
}

export interface FirePair extends SeriesPair {
  thenYear: number;
  nowYear: number;
  thenTotal: number;
  nowTotal: number;
}

/**
 * A region's earliest and latest MODIS seasons (the rule: MODIS with MODIS
 * only; VIIRS sees more fires, so it's never set against MODIS).
 */
export function firesPair(file: FirmsContextFile, region: FirmsRegion): FirePair | null {
  const modis = Object.entries(file.cases)
    .filter((entry): entry is [string, FirmsCase] => entry[1] !== undefined && entry[0].startsWith(`${region}|MODIS_SP|`))
    .map(([key, c]) => ({ year: Number(key.split("|")[2]), c }))
    .sort((a, b) => a.year - b.year);
  if (modis.length < 2) return null;
  const first = modis[0];
  const last = modis[modis.length - 1];
  return {
    then: { label: String(first.year), values: first.c.counts, mean: null },
    now: { label: String(last.year), values: last.c.counts, mean: null },
    dates: { then: first.c.days, now: last.c.days },
    thenYear: first.year,
    nowYear: last.year,
    thenTotal: first.c.total,
    nowTotal: last.c.total,
  };
}

/** "2001-01-01".."2003-12-19" → "2001–03". */
const yearSpan = (dates: string[]) => `${dates[0].slice(0, 4)}–${dates[dates.length - 1].slice(2, 4)}`;

/** One point's vegetation, 2001–03 against 2021–23 (16-day composites). */
export function vegetationPair(file: NdviContextFile, point: NdviPointName): SeriesPair {
  const { A, B } = file.points[point];
  return {
    then: { label: yearSpan(A.dates), values: A.ndvi, mean: A.mean },
    now: { label: yearSpan(B.dates), values: B.ndvi, mean: B.mean },
    dates: { then: A.dates, now: B.dates },
  };
}
