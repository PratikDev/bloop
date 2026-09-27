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
// should be null. (As of 9ce77b7 the file contains bare NaN, which the
// browser's JSON.parse rejects — L1 to fix by writing null.)
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
// Not typed here (binary/image assets):
// latest/sst.bin, latest/rain.bin, latest/rain_phase.bin, sequence/*.u8.gz
//   -> raw grid bytes, decoded only inside lib/data.ts (formulas above).
// latest/sst.webp, latest/rain.png, sequence/*.png, truth/*.png
//   -> display-only images (L3).
// ---------------------------------------------------------------------------
