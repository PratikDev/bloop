// FIRMS near-real-time daily counts (context/firms.json → `daily`, P2b): hotspots per day in fixed boxes (Bangladesh,
// the Chittagong Hill Tracts, Punjab) from VIIRS on NOAA-21 and NOAA-20 and from MODIS. A hotspot is a pixel containing
// one or more fires, not one fire. The satellite is read from each source's own dataset name, never assumed.

import type { FirmsCase, FirmsContextFile, FirmsDailyBlock, FirmsDailyRegion, FirmsDailySeries, FirmsNrtSource } from "@/types/data-contract";
import type { Box } from "./class-grid";

export interface DayCount {
  day: string;
  count: number;
  /** Fire radiative power summed over the day's hotspots (MW). */
  frpSumMW: number;
}

/** The boxes that contain a point, smallest first (CHT before Bangladesh). */
export function regionsAt(daily: FirmsDailyBlock, lat: number, lon: number): FirmsDailyRegion[] {
  const area = (b: Box) => (b[2] - b[0]) * (b[3] - b[1]);
  return daily.regions
    .filter((r) => {
      const [w, s, e, n] = daily.boxes[r];
      return lat >= s && lat <= n && lon >= w && lon <= e;
    })
    .sort((a, b) => area(daily.boxes[a]) - area(daily.boxes[b]));
}

export const boxCentre = (b: Box): { lat: number; lon: number } => ({ lat: (b[1] + b[3]) / 2, lon: (b[0] + b[2]) / 2 });

export const seriesOf = (daily: FirmsDailyBlock, region: FirmsDailyRegion, source: FirmsNrtSource): FirmsDailySeries | null =>
  daily.series[`${region}|${source}`] ?? null;

/** One day's count in a series; null when the series has no such day (not a zero: no data). */
export function dayCount(series: FirmsDailySeries, day: string): DayCount | null {
  const i = series.days.indexOf(day);
  return i < 0 ? null : { day, count: series.counts[i], frpSumMW: series.frp_sum_MW[i] };
}

/** The days the sources share, oldest first. */
export const dailyDays = (daily: FirmsDailyBlock): string[] => [...new Set(Object.values(daily.series).flatMap((s) => s?.days ?? []))].sort();

const SATELLITE = /NOAA-\d+|S-NPP|SNPP|Suomi NPP|Terra|Aqua|MODIS/u;

/** The dataset a source reads, from the block's own header ("firms_viirs_noaa21_nrt" for VIIRS_NOAA21_NRT). */
export const sourceDataset = (daily: FirmsDailyBlock, source: FirmsNrtSource) => daily.datasets.find((d) => d.id === `firms_${source.toLowerCase()}`) ?? null;

/** The satellite (or sensor family) a text names ("NASA FIRMS VIIRS NOAA-21 NRT" → "NOAA-21"); null if it names none. */
export const satelliteIn = (text: string): string | null => SATELLITE.exec(text)?.[0] ?? null;

/** The satellite a source's dataset name says; null if the name doesn't say. */
export const satelliteOf = (daily: FirmsDailyBlock, source: FirmsNrtSource): string | null => satelliteIn(sourceDataset(daily, source)?.name ?? "");

/** True for any S-NPP source (stopped on 2 Nov 2026: never a live product). */
export const isSnpp = (text: string): boolean => /S-NPP|SNPP|Suomi/iu.test(text);

/** A fire-season example from the file's cases ("CHT_Bangladesh_MarApr|MODIS_SP|2023"): its parts, as the key says. */
export interface SeasonCase {
  key: string;
  place: string;
  sensor: string;
  year: string;
  series: FirmsCase;
}

/** The Chittagong Hill Tracts Mar–Apr cases in the file, if any (the off-season's "fire season example"). */
export function chtSeasonCases(file: FirmsContextFile): SeasonCase[] {
  return Object.entries(file.cases).flatMap(([key, series]) => {
    if (!series || !key.startsWith("CHT_")) return [];
    const [place, sensor, year] = key.split("|");
    return [{ key, place, sensor, year, series }];
  });
}
