// Shared TypeScript types for every file L1's pipeline produces under public/data/.
// This file is the one thing L1, L2 and L3 all agree on. L2 and L3 can build
// against hand-written mock JSON/objects that satisfy these types, without
// waiting for L1's real pipeline to run — just keep the shape identical.

// ---------------------------------------------------------------------------
// 1. Grid metadata (latest/sst.json, latest/rain.json, sequence/index.json)
// Needed by: L3 only — frame label, Truth panel, Provenance drawer.
// L2 never reads this directly; it only consumes decoded values (see #2).
// ---------------------------------------------------------------------------

export interface VerifiedSst {
  metric: "median_abs_error_C";
  value: number;
  n_points: number;
  frames_tested: number;
  test: string; // e.g. "Check C"
}

export interface VerifiedRain {
  metric: "median_abs_log10_error";
  value: number;
  approx_percent: number;
  bias_log10: number;
  n_points: number;
  agreement: number; // 0..1
  matched_run: string; // "IMERG Late"
  test: string; // e.g. "D2"
}

export interface GridMetadata {
  product: "sst" | "rain";
  svs_id: number;
  svs_page: string;
  frame_time_utc: string; // ISO 8601
  source_dataset: string;
  grid: {
    width: number;
    height: number;
    encoding: "uint16_offset" | "uint16_log_offset";
    scale: number;
    offset: number;
    nodata: number; // e.g. 65535
  };
  verified: VerifiedSst | VerifiedRain;
  credit: string;
  generated_utc: string;
}

// ---------------------------------------------------------------------------
// 2. Decoded value output — what lib/data.ts's valueAt() actually returns.
// Needed by: BOTH — this is the real shared interface. L3 uses it for the
// cursor readout and frame-view; L2 uses it to synthesise sound. Neither
// lane needs to know the raw .bin byte layout — only this shape.
// ---------------------------------------------------------------------------

export type RainPhase = "dry" | "liquid" | "frozen";

export interface OceanValue {
  track: "ocean";
  valueC: number | null; // null = land / no data
}

export interface RainValue {
  track: "rain";
  mmPerHour: number | null; // null = no data
  phase: RainPhase;
}

export type ValueAtResult = OceanValue | RainValue;

// ---------------------------------------------------------------------------
// 3. Climate context series (context/gistemp_bd.json, gpcp_bd.json, gpcc_bd.json)
// Needed by: BOTH — L3 renders these as History/Compare charts; L2 turns the
// same numbers into the "then vs now" heat and monsoon voices.
// ---------------------------------------------------------------------------

export interface ClimateCellSeries {
  lat: number;
  lon: number;
  months: string[]; // "YYYY-MM"
  values: number[]; // anom_C for GISTEMP; mm/day for GPCP/GPCC
}

export interface ClimateContextFile {
  [cell: string]: ClimateCellSeries; // "dhaka" | "chattogram" | "rajshahi" | "sylhet"
}

// ---------------------------------------------------------------------------
// 4. GRACE water storage (context/grace.json)
// Needed by: BOTH — L3 for the chart + gap caption; L2 for the bass voice
// (missing months become silence, per the mapping spec).
// ---------------------------------------------------------------------------

export interface GraceBoxSeries {
  months: string[];
  cm: (number | null)[]; // null = missing month (satellite gap)
  trend_cm_per_yr: number;
  mean_A: number; // window A mean
  mean_B: number; // window B mean
}

export interface GraceContextFile {
  [box: string]: GraceBoxSeries; // "bangladesh" | "nw_india"
}

// ---------------------------------------------------------------------------
// 5. FIRMS fire counts (context/firms.json)
// Needed by: BOTH — L3 for the area summary; L2 for the percussion voice.
// ---------------------------------------------------------------------------

export interface FirmsCaseSeries {
  sensor: "MODIS" | "VIIRS";
  year: number;
  dates: string[]; // "YYYY-MM-DD"
  counts: number[];
}

export interface FirmsContextFile {
  [caseName: string]: FirmsCaseSeries[]; // "cht" | "punjab"
}

// ---------------------------------------------------------------------------
// 6. NDVI vegetation (context/ndvi.json)
// Needed by: BOTH — L3 chart; L2 the slow "vegetation pad" voice.
// ---------------------------------------------------------------------------

export interface NdviPointSeries {
  lat: number;
  lon: number;
  window: string; // e.g. "2001-03" | "2021-23"
  dates: string[];
  ndvi: number[]; // 0..1
}

export interface NdviContextFile {
  [point: string]: NdviPointSeries[]; // "sundarbans" | "madhupur" | "dhaka_control"
}

// ---------------------------------------------------------------------------
// 7. GLOBE citizen observations (context/globe_bd.json)
// Needed by: L3 (core — the comparison display). L2 only if the GLOBE duet
// teaser (Section 11.6, lowest priority) gets built — optional for L2.
// ---------------------------------------------------------------------------

export interface GlobeObservation {
  time_utc: string;
  lat: number;
  lon: number;
  ground_cloud_cover: string;
  satellite_cloud_value: number;
  satellite_name: string;
}

export type GlobeContextFile = GlobeObservation[];

// ---------------------------------------------------------------------------
// 8. The killer demo (demo/dhaka_then_now.json)
// Needed by: BOTH — L3 for the on-screen captions/numbers; L2 for the actual
// sonified sequence (pitch rise, rain density change, bass sinking, gap silence).
// ---------------------------------------------------------------------------

export interface ThenNowWindow {
  label: string; // "1981-1990"
  years: number;
}

export interface HeatDemo {
  windowA: ThenNowWindow;
  windowB: ThenNowWindow;
  anomA_C: number;
  anomB_C: number;
  delta_C: number; // +1.37
  yearToYearSpread: number; // drives variability -> timbre
}

export interface MonsoonSeriesDemo {
  windowA: ThenNowWindow;
  windowB: ThenNowWindow;
  mmPerDayA: number;
  mmPerDayB: number;
  percentChange: number;
}

export interface MonsoonDemo {
  gpcp: MonsoonSeriesDemo;
  gpcc: MonsoonSeriesDemo;
}

export interface WaterDemo {
  box: "bangladesh" | "nw_india";
  windowA: ThenNowWindow;
  windowB: ThenNowWindow;
  meanA_cm: number;
  meanB_cm: number;
  gapMonths: string[]; // e.g. ["2017-07", ..., "2018-05"]
}

export interface DhakaThenNowDemo {
  heat: HeatDemo;
  monsoon: MonsoonDemo;
  water: WaterDemo[]; // bangladesh + nw_india
  captions: {
    heat: string;
    monsoon: string;
    water: string;
    honesty?: string; // the optional P1b honesty beat
  };
}

// ---------------------------------------------------------------------------
// 9. Sound mapping spec (public/mapping.json)
// Needed by: BOTH, and it's the one file that MUST be a single source of
// truth — L3's Mapping panel renders this text; L2's audio.ts logic should
// implement (or import constants from) the same file rather than duplicating
// the formulas, or the two will drift apart.
// ---------------------------------------------------------------------------

export interface VoiceRule {
  id: string; // "ocean" | "rain" | "snow" | "heat_then_now" | ...
  dataSource: string; // human-readable, shown in the panel
  rule: string; // the formula, as shown in Section 10
  sound: string; // description of the resulting sound
  designChoice?: boolean;
}

export interface MappingSpec {
  voices: VoiceRule[];
  globalRules: string[]; // "master volume capped", "limiter on master bus", ...
}

// ---------------------------------------------------------------------------
// Not typed here (binary/image assets — no JSON schema to mock):
// latest/sst.bin, latest/rain.bin, latest/rain_phase.bin, sequence/*.bin
//   -> raw grid bytes. Internal to lib/data.ts's decoder only. Neither L2
//      nor L3 touch these directly; both just call valueAt() (see #2).
// latest/sst.webp, latest/rain.png, sequence/*.png, truth/*.png
//   -> display-only images. L3 only, no type needed to mock (any placeholder
//      image file works for local dev).