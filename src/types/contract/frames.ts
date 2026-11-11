// ---------------------------------------------------------------------------
// 1. Latest-frame metadata (latest/sst.json, latest/rain.json)
// Needed by: L3 — frame label, Truth panel, Provenance drawer, and the grid
// decoder in lib/data.ts (dimensions + encoding).
// ---------------------------------------------------------------------------

interface VerifiedSst {
  metric: "median_abs_error_C";
  value: number;
  p90_abs_error_C?: number;
  bias_C?: number;
  n_points: number;
  frames_tested: number;
  test: string; // e.g. "Check C re-evaluated with corrected colorbar positions ..."
}

interface VerifiedRain {
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
interface SstCalibration {
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
interface SstGrid {
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
interface RainGrid {
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

// ---------------------------------------------------------------------------
// 2. Storm time-lapse (sequence/index.json, sequence/rain_NNN.json,
//    sequence/rain_NNN.u8.gz, sequence/rain_NNN.png), oldest → newest.
// Needed by: L3 (decoder + display), L2 (time-lapse audio, via decoded values).
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

// ---------------------------------------------------------------------------
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
