import type { FirmsCase, FirmsContextFile, FirmsDailyBlock, FirmsDailyRegion, FirmsDailySeries, FirmsNrtSource } from "@/types/data-contract";
import type { Box } from "./class-grid";

export interface DayCount {
  day: string;
  count: number;
  frpSumMW: number;
}

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

export function dayCount(series: FirmsDailySeries, day: string): DayCount | null {
  const i = series.days.indexOf(day);
  return i < 0 ? null : { day, count: series.counts[i], frpSumMW: series.frp_sum_MW[i] };
}

export const dailyDays = (daily: FirmsDailyBlock): string[] => [...new Set(Object.values(daily.series).flatMap((s) => s?.days ?? []))].sort();

const SATELLITE = /NOAA-\d+|S-NPP|SNPP|Suomi NPP|Terra|Aqua|MODIS/u;

export const sourceDataset = (daily: FirmsDailyBlock, source: FirmsNrtSource) => daily.datasets.find((d) => d.id === `firms_${source.toLowerCase()}`) ?? null;

export const satelliteIn = (text: string): string | null => SATELLITE.exec(text)?.[0] ?? null;

export const satelliteOf = (daily: FirmsDailyBlock, source: FirmsNrtSource): string | null => satelliteIn(sourceDataset(daily, source)?.name ?? "");

export interface SeasonCase {
  key: string;
  place: string;
  sensor: string;
  year: string;
  series: FirmsCase;
}

export function chtSeasonCases(file: FirmsContextFile): SeasonCase[] {
  return Object.entries(file.cases).flatMap(([key, series]) => {
    if (!series || !key.startsWith("CHT_")) return [];
    const [place, sensor, year] = key.split("|");
    return [{ key, place, sensor, year, series }];
  });
}
