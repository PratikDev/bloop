// §15 wildfires: SVS 5315 fire-weather classes (+ our daily archive), the SVS 5113 picture,
// and the additive `daily` block of context/firms.json (FIRMS NRT, NOAA-20/21 + MODIS).

import type { GridBlock, ProductHeader } from "./common";

export interface ClassCode {
  code: number;
  label: string;
}

// latest/fwi_class.bin — Uint8: 0 = no calculation; 1..6 = very low … extreme (classes[]).
export interface FwiClassMetadata extends ProductHeader {
  svs_id: 5315;
  svs_page: string;
  frame_time_utc: string;
  frame_time_source: string;
  forecast: string; // "1-day"
  source_file: string;
  projection_of_source: "Robinson";
  classes: ClassCode[];
  grid: GridBlock<"uint8_class"> & { nodata: number };
  verified: { test: "C5315"; status: string; decoded_share: number | null; swatches: number[][] | null };
  bangladesh: FwiBangladesh;
}

export interface FwiBangladesh {
  places: Record<string, number>; // class code at each city cell
  bd_box_counts: Record<string, number>; // cells per class code in the Bangladesh box
}

// context/fwi_archive_index.json — one gzip of the class grid per day (archive/fwi/FWI_YYYYMMDD.u8.gz).
export interface FwiArchiveDay extends FwiBangladesh {
  date: string;
  file: string;
  issued_utc: string;
}

export interface FwiArchiveIndex extends ProductHeader {
  keep_days: number;
  grid: { width: number; height: number; encoding: string };
  days: FwiArchiveDay[];
}

// latest/fires.json — display only (values_read is always false).
export interface FiresFrameMetadata extends ProductHeader {
  svs_id: 5113;
  svs_page: string;
  frame_time_utc: string | null;
  frame_time_source: string;
  source_file: string;
  display: { file: string; width: number; height: number };
  values_read: false;
}

export type FirmsNrtSource = "VIIRS_NOAA21_NRT" | "VIIRS_NOAA20_NRT" | "MODIS_NRT";
export type FirmsDailyRegion = "Bangladesh" | "CHT" | "Punjab";
export type FirmsDailyKey = `${FirmsDailyRegion}|${FirmsNrtSource}`;

export interface FirmsDailySeries {
  days: string[]; // "YYYY-MM-DD", ascending
  counts: number[];
  frp_sum_MW: number[];
}

export interface FirmsDailyBlock extends ProductHeader {
  sources: FirmsNrtSource[];
  regions: FirmsDailyRegion[];
  boxes: Record<FirmsDailyRegion, [number, number, number, number]>; // W, S, E, N
  bangladesh_filter: string;
  query_days: number;
  keep_days: number;
  series: Partial<Record<FirmsDailyKey, FirmsDailySeries>>;
}
