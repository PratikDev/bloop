// The demo files: Dhaka and the cities then vs now (sections 9, 13). Re-exported from src/types/data-contract.ts.

import type { ClimateCellName } from "./context";

// ---------------------------------------------------------------------------
// 9. The killer demo (demo/dhaka_then_now.json)
// Needed by: BOTH — L3 on-screen captions/numbers; L2 the sonified sequence.
// Captions are the exact Section 16 wording; show them as-is.
// ---------------------------------------------------------------------------

export interface DemoWindow {
  window: [number, number]; // [first year, last year]
  years: number[];
  values: number[]; // one value per year (°C anomaly or mm/day)
  mean: number;
  spread: number; // year-to-year spread, drives variability -> timbre
  n_years: number;
}

interface HeatDemo {
  dataset: string;
  A: DemoWindow;
  B: DemoWindow;
  change_C: number; // +1.37
  caption: string;
}

interface RainSeriesDemo {
  dataset: string;
  A: DemoWindow;
  B: DemoWindow;
  change_pct: number;
}

/** GPCP's own newer decade (WIN_B): an extra, labelled "GPCP only", never shown beside GPCC as comparable. */
interface RainNewerDemo extends RainSeriesDemo {
  label: string; // "GPCP only, newer decade; GPCC data ends in 2019"
}

interface RainDemo {
  gpcp: RainSeriesDemo; // same A and B windows as gpcc
  gpcc: RainSeriesDemo;
  caption: string;
  gpcc_end_note: string; // why GPCC stops where it does (version and last month from gpcc_bd.json)
  gpcp_newer: RainNewerDemo;
}

interface WaterBoxDemo {
  mean_A: number;
  mean_B: number;
  trend_cm_per_yr: number;
  window_A: string;
  window_B: string;
}

// Monthly GRACE values (with the gap) live in context/grace.json.
interface WaterDemo {
  dataset: string;
  Bangladesh: WaterBoxDemo;
  NW_India: WaterBoxDemo;
  caption: string;
}

export interface DhakaThenNowDemo {
  title: string;
  story: string;
  heat: HeatDemo;
  rain: RainDemo;
  water: WaterDemo;
  honesty_beat: string; // the optional P1b honesty beat
  not_claimed: string[];
  generated_utc: string;
}

// ---------------------------------------------------------------------------
// 13. Bangladesh cities then vs now (demo/cities_then_now.json) — OPTIONAL, additive
// Needed by: BOTH — L3 city picker in Then vs Now (captions as-is); L2 plays
// the same heat/rain windows as the Dhaka demo. Built by the optional
// build_cities.py, reusing build_demo.py's functions and Section 16 templates
// (city name substituted; rain phrase "no wetter in these records." / "wetter in these records." / "no clear
// change." from the signs of the GPCP and GPCC changes). Signed numbers use
// "−" (U+2212); a value that rounds to zero prints unsigned ("0%", "0.00").
// Only Dhaka is cross_checked. Cities sharing a dataset grid cell:
// the first city (Dhaka) is the reference; the others get same_record_as and
// a caption sentence "Same … grid cell(s) as <city>: this is the same record."
// The Dhaka entry is identical to dhaka_then_now.json (spotcheck enforces it).
// A city that fails a data check is left out; if Dhaka fails, the file is
// removed. Water is national only: see file 9 `water`.
// ---------------------------------------------------------------------------

export interface GridCellRef {
  lat: number;
  lon: number;
}

interface CityHeatDemo extends HeatDemo {
  cell: GridCellRef;
  shares_cell_with: ClimateCellName[];
  same_record_as: ClimateCellName | null; // non-null = identical to that city's heat record
}

interface CityRainSeriesDemo extends RainSeriesDemo {
  cell: GridCellRef;
  shares_cell_with: ClimateCellName[];
  same_record_as: ClimateCellName | null;
}

interface CityRainDemo extends RainDemo {
  gpcp: CityRainSeriesDemo;
  gpcc: CityRainSeriesDemo;
}

export interface CityThenNow {
  name: ClimateCellName;
  cross_checked: boolean; // true only for Dhaka
  heat: CityHeatDemo;
  rain: CityRainDemo;
}

export interface CitiesThenNowFile {
  title: string;
  note: string;
  water_note: string;
  cities: CityThenNow[];
  generated_utc: string;
}
