import type { FirmsDailyBlock } from "../contract-15";

// ---------------------------------------------------------------------------
// 4. Climate context series (context/gistemp_bd.json, gpcp_bd.json, gpcc_bd.json)
// Needed by: BOTH — L3 renders History/Compare charts; L2 plays the same
// numbers. Months are "YYYY-MM"; no missing values in the current files.
// Note: the cells are the dataset's nearest grid cells, so some places share
// one cell (GISTEMP: Dhaka = Chattogram; GPCP/GPCC: Dhaka = Sylhet). Check
// lat/lon before presenting two places as different records.
// ---------------------------------------------------------------------------

export type ClimateCellName = "Dhaka" | "Chattogram" | "Rajshahi" | "Sylhet";

export interface GistempCellSeries {
  lat: number;
  lon: number;
  months: string[];
  anom_C: number[]; // anomaly vs 1951–1980
}

export interface GistempContextFile {
  dataset: string;
  units: "degC";
  credit: string;
  cells: Record<ClimateCellName, GistempCellSeries>;
}

export interface RainCellSeries {
  lat: number;
  lon: number;
  months: string[];
  mm_per_day: number[];
}

// gpcp_bd.json (1979 →) and gpcc_bd.json (1891 → 2019)
export interface RainContextFile {
  dataset: string;
  units: "mm/day";
  caveat?: string; // GPCP only
  credit: string;
  cells: Record<ClimateCellName, RainCellSeries>;
}

// ---------------------------------------------------------------------------
// 5. GRACE water storage (context/grace.json)
// Needed by: BOTH — L3 chart + gap caption; L2 bass voice (null = silence).
// ---------------------------------------------------------------------------

export type GraceBoxName = "Bangladesh" | "NW_India";

interface GraceBoxSeries {
  box_lon_lat: [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max]
  months: string[]; // continuous monthly axis from 2002-04
  cm: (number | null)[]; // null = missing month (satellite gap)
  missing_months: number;
  trend_cm_per_yr: number;
  mean_A: number;
  mean_B: number;
  window_A: string; // "2003-01..2006-12"
  window_B: string; // "2021-01..2024-12"
  uncertainty_1sigma_cm: { median: number; min: number; max: number };
}

export interface GraceContextFile {
  dataset: string;
  units: "cm";
  native_resolution: string;
  mascon_deg: number | null;
  uncertainty_note: string;
  gap_note: string;
  credit: string;
  boxes: Record<GraceBoxName, GraceBoxSeries>;
}

// ---------------------------------------------------------------------------
// 6. FIRMS fire counts (context/firms.json)
// Needed by: BOTH — L3 area summary; L2 percussion voice.
// Case keys look like "CHT_Bangladesh_MarApr|MODIS_SP|2003".
// Rule: compare MODIS with MODIS only; single years are "example years".
// ---------------------------------------------------------------------------

export type FirmsRegion = "CHT_Bangladesh_MarApr" | "Punjab_India_OctNov";
type FirmsSource = "MODIS_SP" | "VIIRS_SNPP_SP";
type FirmsCaseKey = `${FirmsRegion}|${FirmsSource}|${number}`;

export interface FirmsCase {
  days: string[]; // "YYYY-MM-DD"
  counts: number[];
  total: number;
  frp_sum_MW: number;
}

export interface FirmsContextFile {
  dataset: string;
  rule: string;
  credit: string;
  cases: Partial<Record<FirmsCaseKey, FirmsCase>>;
  daily?: FirmsDailyBlock; // §15, additive: FIRMS NRT on NOAA-20/21 + MODIS
}

// ---------------------------------------------------------------------------
// 7. NDVI vegetation (context/ndvi.json)
// Needed by: BOTH — L3 chart; L2 slow vegetation voice.
// A = 2001–03, B = 2021–23 (16-day composites).
// ---------------------------------------------------------------------------

export type NdviPointName = "Sundarbans" | "Madhupur_forest" | "Dhaka_city_control";

interface NdviWindow {
  dates: string[]; // "YYYY-MM-DD"
  ndvi: number[]; // 0..1
  mean: number;
  seasonal_range: number;
}

export interface NdviContextFile {
  dataset: string;
  caveat: string;
  credit: string;
  points: Record<NdviPointName, { A: NdviWindow; B: NdviWindow }>;
}

// ---------------------------------------------------------------------------
// 8. GLOBE citizen observations (context/globe_bd.json)
// Needed by: L3 (the comparison display). L2 only for the GLOBE duet teaser.
// Rows keep the original GLOBE CSV column names; `columns` says which ones
// hold time, position, cloud cover and satellite matches. Missing cells
// are null. Columns that are empty for every Bangladesh row (all Terra/Aqua,
// NOAA20 Total, CALIPSO) are dropped: of the Terra/Aqua/NOAA20/CALIPSO
// columns, only NOAA20 Low/Mid/High remain. Observer, GEO and
// "Satellite Comparison Table" columns are kept.
// ---------------------------------------------------------------------------
