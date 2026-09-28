// Shared TypeScript types for every file L1's pipeline produces under public/data/.
// This file is the one thing L1, L2 and L3 all agree on.
//
// These types mirror L1's real, published output (pipeline/ as of the L1 merge,
// commit 9ce77b7). L1 has frozen these shapes: any change to a pipeline output
// file must update this file in the same PR.
//
// Binary grids: little-endian, row 0 = north (90° N), column 0 = 180° W.

// ---------------------------------------------------------------------------
// 1. Latest-frame metadata (latest/sst.json, latest/rain.json)
// Needed by: L3 — frame label, Truth panel, Provenance drawer, and the grid
// decoder in lib/data.ts (dimensions + encoding).
// ---------------------------------------------------------------------------

export interface VerifiedSst {
  metric: "median_abs_error_C";
  value: number;
  p90_abs_error_C?: number;
  bias_C?: number;
  n_points: number;
  frames_tested: number;
  test: string; // e.g. "Check C re-evaluated with corrected colorbar positions ..."
}

export interface VerifiedRain {
  metric: "median_abs_log10_error";
  value: number;
  approx_percent: number;
  bias_log10: number;
  n_points: number;
  agreement: number; // 0..1, rain/no-rain agreement
  phase_agreement?: number; // 0..1, rain/snow agreement
  matched_run: string; // "IMERG Late"
  frames_tested?: number;
  test: string; // e.g. "D2"
}

// How the SST colorbar was calibrated against NASA MUR (convert_sst.py).
export interface SstCalibration {
  method: string;
  legend_labels: string; // what the colorbar image says, e.g. "-5..35 C"
  ticks_px: [number, number];
  value_at_ticks_C: [number, number]; // what the calibration found, e.g. [-4, 34]
  evidence: string;
  note: string;
}

// Added by verify_latest.py when today's frame was re-checked against the
// source dataset. Absent if the check has not run for this frame.
export interface SstLatestCheck {
  date: string; // "YYYY-MM-DD", the MUR day that matched best
  n: number;
  median_abs: number; // °C
  p90_abs: number; // °C
  bias: number; // °C
  pass: boolean;
  checked_utc: string;
}

export interface RainLatestCheck {
  frame: string; // "latest frame" or "time-lapse frame <file>"
  frame_time_utc: string;
  imerg_run: "Late" | "Early";
  file: string; // IMERG granule name
  agreement: number; // 0..1
  median_abs_log10: number;
  median_log10_bias: number;
  n_both_rain: number;
  pass: boolean;
  checked_utc: string;
}

// latest/sst.bin — Uint16, width × height.
// °C = code / scale + offset (i.e. code / 1000 − 5); code === nodata (65535) = land / no data.
export interface SstGrid {
  width: number; // 1024
  height: number; // 512
  encoding: "uint16_offset";
  scale: number; // 1000
  offset: number; // -5
  nodata: number; // 65535
  byte_order: "little";
  row0: string; // "north (90N)"
  col0: string; // "180W"
  aggregation: string; // "mean of 4x4 source pixels"
}

export interface SstMetadata {
  product: "sst";
  svs_id: number; // 5101
  svs_page: string;
  frame_time_utc: string; // ISO 8601
  source_file: string;
  source_dataset: string;
  grid: SstGrid;
  units: "degC";
  value_range: [number, number]; // calibrated range, e.g. [-4, 34]
  verified: VerifiedSst;
  calibration?: SstCalibration | null;
  credit: string;
  generated_utc: string;
  latest_check?: SstLatestCheck;
}

// latest/rain.bin — Uint16, width × height.
// 0 = dry; 65535 = no data; else mm/h = 10^((code − 1) / 20000 − 1).
// latest/rain_phase.bin — Uint8, same size: 0 dry, 1 liquid, 2 frozen.
export interface RainGrid {
  width: number; // 1800
  height: number; // 900
  encoding: "uint16_log";
  formula: string;
  phase_file: string; // "rain_phase.bin"
  phase_codes: { "0": "dry"; "1": "liquid"; "2": "frozen" };
  byte_order: "little";
  row0: string;
  col0: string;
  aggregation: string; // "max of 2x2 source pixels"
}

export interface RainMetadata {
  product: "rain";
  svs_id: number; // 4285
  svs_page: string;
  frame_time_utc: string; // ISO 8601
  frame_time_meaning: string; // "start of the 30-minute period"
  source_file: string;
  source_dataset: string;
  units: "mm/h";
  value_range: [number, number]; // [0.1, 50]
  scale: "log";
  verified: VerifiedRain;
  credit: string;
  generated_utc: string;
  colorbar_variant: string; // "black" | "white"
  grid: RainGrid;
  latest_check?: RainLatestCheck;
}

export type GridMetadata = SstMetadata | RainMetadata;

// ---------------------------------------------------------------------------
// 2. Storm time-lapse (sequence/index.json, sequence/rain_NNN.json,
//    sequence/rain_NNN.u8.gz, sequence/rain_NNN.png), oldest → newest.
// Needed by: L3 (decoder + display), L2 (time-lapse audio, via decoded values).
//
// rain_NNN.u8.gz — gzip of Uint8, width × height, rain and phase in one byte:
//   0 = dry; 255 = no data;
//   1..127   = liquid: mm/h = 10^(−1 + (code − 1)   / 126 × log10(500))
//   128..254 = frozen: mm/h = 10^(−1 + (code − 128) / 126 × log10(500))
// ---------------------------------------------------------------------------

export interface SequenceFrameRef {
  index: number;
  time_utc: string;
  grid: string; // "rain_000.u8.gz"
  png: string; // "rain_000.png"
  unmatched_pct: number;
}

export interface SequenceIndex {
  frames: SequenceFrameRef[];
  grid: {
    width: number; // 1200
    height: number; // 600
    encoding: string; // "uint8_log_phase (gzip); see any rain_XXX.json for the formula"
  };
  step_minutes: number; // 30 (the app still shows each frame's own time)
  credit: string;
  generated_utc: string;
  colorbar_variant: string;
}

export interface SequenceFrameMetadata {
  product: "rain_sequence_frame";
  index: number;
  frame_time_utc: string;
  source_file: string;
  units: "mm/h";
  credit: string;
  grid: {
    width: number;
    height: number;
    file: string; // "rain_000.u8.gz"
    compression: "gzip";
    encoding: "uint8_log_phase";
    formula: string;
    row0: string;
    col0: string;
    aggregation: string; // "max of 3x3 source pixels"
    resolution_note: string;
  };
}

// ---------------------------------------------------------------------------
// 3. Decoded value output — what lib/data.ts's valueAt() returns.
// Produced by lib/data.ts (L3), not by L1. Neither consumer needs the raw
// byte layout — only this shape.
// ---------------------------------------------------------------------------

export type RainPhase = "dry" | "liquid" | "frozen" | "nodata";

export interface OceanValue {
  track: "ocean";
  valueC: number | null; // null = land / no data
}

export interface RainValue {
  track: "rain";
  // dry → 0 with phase "dry"; no data → null with phase "nodata"
  mmPerHour: number | null;
  phase: RainPhase;
}

export type ValueAtResult = OceanValue | RainValue;

// ---------------------------------------------------------------------------
// 4. Climate context series (context/gistemp_bd.json, gpcp_bd.json, gpcc_bd.json)
// Needed by: BOTH — L3 renders History/Compare charts; L2 plays the same
// numbers. Months are "YYYY-MM"; no missing values in the current files.
//
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

export interface GraceBoxSeries {
  box_lon_lat: [number, number, number, number]; // [lon_min, lat_min, lon_max, lat_max]
  months: string[]; // continuous monthly axis from 2002-04
  cm: (number | null)[]; // null = missing month (satellite gap)
  missing_months: number;
  trend_cm_per_yr: number;
  mean_A: number;
  mean_B: number;
  window_A: string; // "2003-01..2006-12"
  window_B: string; // "2021-01..2024-12"
}

export interface GraceContextFile {
  dataset: string;
  units: "cm";
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
export type FirmsSource = "MODIS_SP" | "VIIRS_SNPP_SP";
export type FirmsCaseKey = `${FirmsRegion}|${FirmsSource}|${number}`;

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
}

// ---------------------------------------------------------------------------
// 7. NDVI vegetation (context/ndvi.json)
// Needed by: BOTH — L3 chart; L2 slow vegetation voice.
// A = 2001–03, B = 2021–23 (16-day composites).
// ---------------------------------------------------------------------------

export type NdviPointName = "Sundarbans" | "Madhupur_forest" | "Dhaka_city_control";

export interface NdviWindow {
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
//
// Rows keep the original GLOBE CSV column names; `columns` says which ones
// hold time, position, cloud cover and satellite matches. Missing cells
// are null. Columns that are empty for every Bangladesh row (all Terra/Aqua,
// NOAA20 Total, CALIPSO) are dropped: of the Terra/Aqua/NOAA20/CALIPSO
// columns, only NOAA20 Low/Mid/High remain. Observer, GEO and
// "Satellite Comparison Table" columns are kept.
// ---------------------------------------------------------------------------

export type GlobeObservationRow = Record<string, string | number | null>;

export interface GlobeContextFile {
  dataset: string;
  rows: number;
  columns: {
    time: string; // "Measurement Date (UTC)"
    lat: string; // "Observation Latitude"
    lon: string; // "Observation Longitude"
    cloud_cover: string[];
    satellite: string[];
  };
  note: string;
  credit: string;
  observations: GlobeObservationRow[];
}

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

export interface HeatDemo {
  dataset: string;
  A: DemoWindow;
  B: DemoWindow;
  change_C: number; // +1.37
  caption: string;
}

export interface RainSeriesDemo {
  dataset: string;
  A: DemoWindow;
  B: DemoWindow;
  change_pct: number;
}

export interface RainDemo {
  gpcp: RainSeriesDemo;
  gpcc: RainSeriesDemo;
  caption: string;
}

export interface WaterBoxDemo {
  mean_A: number;
  mean_B: number;
  trend_cm_per_yr: number;
  window_A: string;
  window_B: string;
}

// Monthly GRACE values (with the gap) live in context/grace.json.
export interface WaterDemo {
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
// 10. Sound mapping spec (public/mapping.json)
// Owned by L2, not L1. Needed by BOTH: L3's Mapping panel renders it; L2's
// lib/audio reads the same numbers, so the two never drift apart.
// Rules are stored as numbers, never as formula text: the human-readable
// sentence is generated from these numbers (lib/audio/mapping.ts ruleText()).
// ---------------------------------------------------------------------------

export type InputScale = "linear" | "log";
export type OutputScale = "linear" | "exponential";

// value → t in [0,1] over [input.min, input.max] (clamped; log uses log10),
// then t → output: linear = min + (max − min)·t; exponential = min·(max/min)^t.
export interface ContinuousMapping {
  kind: "continuous";
  input: { unit: string; min: number; max: number; scale: InputScale };
  output: {
    param: "frequency" | "dropsPerSecond" | "dropsPerStep" | "gain";
    unit: string;
    min: number;
    max: number;
    scale: OutputScale;
    round?: boolean;
  };
}

// Discrete bands over the (optionally absolute) value; upTo = exclusive upper
// bound, null = no upper bound (last band only).
export interface BandsMapping {
  kind: "bands";
  input: { unit: string; transform: "abs" | "none" };
  bands: { upTo: number | null; label: string; detuneCents: number; roughness: number }[];
}

// Like continuous, but the input range is computed from the series being
// played (e.g. 5th–95th percentile), after an optional transform.
export interface RuntimeRangeMapping {
  kind: "runtimeRange";
  input: { unit: string; range: "p5-p95" | "zero-to-max"; transform: "none" | "log1p" };
  output: {
    param: "frequency" | "gain";
    unit: string;
    min: number;
    max: number;
    scale: OutputScale;
  };
}

export type VoiceMapping = ContinuousMapping | BandsMapping | RuntimeRangeMapping;

export interface VoiceSpec {
  id: string; // a voice id (lib/audio VoiceId) or an earcon id
  label: { en: string; bn: string };
  group: "live" | "thenNow" | "context" | "earcon";
  source: { dataset: string; svsId?: number };
  status: "verified" | "context" | "designOnly"; // badge in the Mapping panel
  mapping: VoiceMapping | null; // null = no value rule (most earcons)
  silence: string; // when this voice is silent, and why
  sound: {
    timbre: string;
    attackMs: number;
    releaseMs: number;
    glideMs?: number;
    maxGain: number;
  };
  pan: "longitude" | "center" | "compareSide";
  legend: { value: number; label: string }[]; // reference points for the audio legend
  designChoice: boolean; // true = our untested choice, shown as such
  note?: string; // one line shown under the rule in the panel
}

export interface MappingSpec {
  version: string;
  global: {
    masterGain: number;
    voiceMaxGain: number;
    earconMaxGain: number;
    narrationMaxGain: number;
    maxConcurrentVoices: number;
    compressor: { thresholdDb: number; ratio: number; attackSec: number; releaseSec: number };
    duck: { level: number; attackSec: number; releaseSec: number };
    stopFadeMs: number;
    pan: { rule: "lon/180"; min: -1; max: 1 };
    // gain × (refHz / f)^exponent; exponent 0 = off (tuned by ear test T3)
    loudnessCompensation: { refHz: number; exponent: number };
    rules: string[]; // human sentences for the Mapping panel
  };
  voices: VoiceSpec[];
}

// ---------------------------------------------------------------------------
// 11. Bangladesh ensemble (context/ensemble_bd.json) — OPTIONAL, additive
// Needed by: BOTH — L3 draws three lines on the History chart (toggle per
// voice, playhead, show `disclosure`); L2 plays the three voices together.
// Built only from files 4 and 5 above (build_ensemble.py); no new data.
// voices.X.values[i] belongs to months[i]; null = no measurement → silence
// (water is null before 2002-04 and during the Jul 2017–May 2018 GRACE gap).
// ---------------------------------------------------------------------------

export interface EnsembleVoice {
  values: (number | null)[];
  units: string;
  dataset: string;
  place: string;
  resolution: string;
  mapping_key: string; // "Heat then vs now" | "Monsoon then vs now" | "Water" (TEAM_BUILD_PLAN Section 10)
  credit: string;
  caveat?: string | null; // rain only
  gap_note?: string; // water only
  starts?: string; // water only
}

export interface EnsembleFile {
  title: string;
  months: string[]; // "YYYY-MM", consecutive from 1981-01
  voices: { heat: EnsembleVoice; rain: EnsembleVoice; water: EnsembleVoice };
  disclosure: string;
  generated_utc: string;
}

// ---------------------------------------------------------------------------
// 12. GLOBE duet teaser (context/globe_duet.json) — OPTIONAL, additive
// Needed by: L3 (teaser card: time, place, both values, `disclosure`,
// label "Teaser: coming in October"); L2 (two tones, ground left / satellite right).
// Built from file 8 (build_globe_duet.py): only observations inside
// Bangladesh's national outline; reports on the same date within 1 km are
// merged. `featured` = the place-day with the median difference (typical case).
// status "insufficient" = fewer than 20 place-days → don't show the teaser.
// ---------------------------------------------------------------------------

export interface GlobeDuetPair {
  date: string; // "YYYY-MM-DD"
  lat: number;
  lon: number;
  ground_pct: number; // observer's cloud cover, % (category midpoint, approximate)
  satellite_pct: number; // geostationary satellite cloud cover, %
  n_reports: number; // reports merged into this place-day
  satellite: string | null;
  difference_pct: number; // satellite_pct − ground_pct
}

export interface GlobeDuetFile {
  title: string;
  status: "ok" | "insufficient";
  region: "Bangladesh" | "Bangladesh and surrounding area";
  region_note: string;
  ground_value: {
    primary: string;
    fallback: string;
    counts: { category: number; range_fallback: number };
    category_midpoints: Record<string, number>;
    note: string;
  };
  satellite_value: string;
  dropped: {
    outside_bangladesh: number;
    obscured: number;
    unknown_category: number;
    missing_ground: number;
    missing_satellite: number;
  };
  summary: {
    raw_pairs: number;
    unique_place_days: number;
    merge_radius_km: number; // 1
    busiest_day?: Record<string, number>; // absent when there are no pairs
    median_abs_difference_pct?: number;
    share_within_25_points?: number;
  };
  featured: GlobeDuetPair | null;
  pairs: GlobeDuetPair[];
  disclosure: string;
  credit: string;
  generated_utc: string;
}
// ---------------------------------------------------------------------------
/// ---------------------------------------------------------------------------
// 13. Bangladesh cities then vs now (demo/cities_then_now.json) — OPTIONAL, additive
// Needed by: BOTH — L3 city picker in Then vs Now (captions as-is); L2 plays
// the same heat/rain windows as the Dhaka demo. Built by the optional
// build_cities.py, reusing build_demo.py's functions and Section 16 templates
// (city name substituted; rain phrase "not wetter." / "wetter." / "no clear
// change." from the signs of the GPCP and GPCC changes). Signed numbers use
// "−" (U+2212); a value that rounds to zero prints unsigned ("0%", "0.00").
// Only Dhaka is cross_checked (P1b). Cities sharing a dataset grid cell:
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

export interface CityHeatDemo extends HeatDemo {
  cell: GridCellRef;
  shares_cell_with: ClimateCellName[];
  same_record_as: ClimateCellName | null; // non-null = identical to that city's heat record
}

export interface CityRainSeriesDemo extends RainSeriesDemo {
  cell: GridCellRef;
  shares_cell_with: ClimateCellName[];
  same_record_as: ClimateCellName | null;
}

export interface CityRainDemo extends RainDemo {
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


// ---------------------------------------------------------------------------
// 14. Global history cube (global/*) — OPTIONAL, additive
// Needed by: L3 (click anywhere / place picker → reuse the History chart);
// L2 (same three voices as the ensemble, file 11). Built by build_global.py
// from files already used for 4–5 (global versions); no new downloads.
// Load lazily (only when the user opens the global view): about 10–15 MB total.
//
// <layer>.i16.gz — gzip of Int16 little-endian, [cell][month] row-major:
//   value = int16 / scale; -32768 = no data → silence.
//   cell_id = row × grid.lon.length + col (row 0 = northernmost, col 0 = westernmost);
//   cells[k] is the cell_id of row k in the data; month m = month_start + m.
// heat = land only (oceans silent). Water months with two GRACE solutions are
// averaged and listed in duplicate_months_averaged. Values never exceed int16:
// build_global.py fails (and publishes nothing) if any value would be clipped.
// Cross-checking: only Dhaka's April–May heat and June–September rain (demo,
// file 9) were cross-checked against independent records (P1b). The ANNUAL values
// in places.json were not separately cross-checked; label them "annual".
// Water per place: Bangladesh places use the national box (the same record as the
// demo); other places use their 3° GRACE cell (water_region.label says which).
// ---------------------------------------------------------------------------

export type GlobalLayerName = "heat" | "rain" | "water";

export interface GlobalLayerFile {
  layer: GlobalLayerName;
  file: string; // "heat.i16.gz"
  compression: "gzip";
  dtype: string; // "int16 little-endian"
  layout: string;
  scale: number; // heat 100, rain 100, water 10
  month_start: string; // "YYYY-MM"
  n_months: number;
  grid: { lat: number[]; lon: number[]; cell_id: string };
  cells: number[];
  units: string;
  dataset: string;
  credit: string;
  caveat?: string; // rain
  gap_note?: string; // water
  duplicate_months_averaged?: string[]; // water
}

export type RainConfidence = "high" | "medium" | "low" | "satellite-only";

export interface GlobalConfidenceFile {
  layer: "rain";
  method: string;
  flags: Record<string, RainConfidence>; // key = rain cell_id as a string
}

export interface GlobalCellRef {
  index: number; // row in the layer's data (not the cell_id)
  lat: number;
  lon: number;
}

export interface GlobalWaterRegion {
  kind: "box" | "cell"; // "box" = Bangladesh national box (same record as the demo); "cell" = the place's 3° GRACE cell
  label: string; // e.g. "3° GRACE cell 27°N–30°N, 72°E–75°E"
}

export interface GlobalPlace {
  name: string;
  lat: number;
  lon: number;
  in_bangladesh: boolean;
  heat_cell: GlobalCellRef | null;
  heat_cell_is_neighbour: boolean; // true = nearest land cell, not the place's own cell (coasts/islands)
  rain_cell: GlobalCellRef | null;
  water_cell: GlobalCellRef | null; // null for Bangladesh places (they use the national box, see water_region)
  water_region: GlobalWaterRegion | null;
  // ANNUAL values (see GlobalPlacesFile.basis). For Bangladesh cities these differ on purpose from the demo /
  // cities files (April–May heat, June–September rain): always label them "annual" in the UI.
  heat_annual_then_now: [number | null, number | null] | null; // °C anomaly, 1981–1990 vs 2016–2025
  rain_annual_then_now: [number | null, number | null] | null; // mm/day, same windows
  rain_confidence: RainConfidence | null;
  water_then_now: [number | null, number | null] | null; // cm, 2003–06 vs 2021–24 (Bangladesh: = demo water)
  // Places in the same grid cell (or the same box) are the same record — don't present them as separate findings.
  // *_same_record_as = the first listed place with that cell/box (null for the reference place or when not shared).
  heat_shares_cell_with: string[];
  heat_same_record_as: string | null;
  rain_shares_cell_with: string[];
  rain_same_record_as: string | null;
  water_shares_cell_with: string[];
  water_same_record_as: string | null;
}

export interface GlobalPlacesFile {
  note: string;
  basis: { heat: string; rain: string; water: string };
  demo_note: string; // why Bangladesh values differ from the Section 16 demo
  places: GlobalPlace[];
}

export interface GlobalManifest {
  layers: GlobalLayerName[];
  files: string[];
  generated_utc: string;
  disclosure: string;
}
// ---------------------------------------------------------------------------
// Not typed here (binary/image assets):
// latest/sst.bin, latest/rain.bin, latest/rain_phase.bin, sequence/*.u8.gz
//   -> raw grid bytes, decoded only inside lib/data.ts (formulas above).
// latest/sst.webp, latest/rain.png, sequence/*.png, truth/*.png
//   -> display-only images (L3).
// ---------------------------------------------------------------------------
