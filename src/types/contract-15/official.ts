// §15 official Challenge #14 resources (pipeline/svs/export.py, docs/official/README.md).
// public/data/official/index.json lists the records; each record folder has manifest.json, validation.json,
// checksums.tsv.gz and its layers' chunks: <layer>_<k>.u16.gz = T×H×W little-endian uint16 (row 0 = north edge,
// col 0 = west edge), gzip; value = q·scale + offset ("linear") or 10^(q·scale + offset) ("log10"); 65535 = no data;
// 65534 = below the colorbar's range (censored: under below_range_bound, not unknown).

export type OfficialBadge = "model" | "reanalysis" | "observation";
export type FrameTimeMethod = "date-list" | "ocr" | "linear";

export interface OfficialIndex {
  records: { record: string; title: string; svs_ids: number[]; badge: OfficialBadge; period: string; manifest: string }[];
}

export interface OfficialChunk {
  file: string;
  t0: number;
  t1: number; // exclusive
  bytes: number;
}

export interface OfficialLayer {
  id: string;
  unit: string;
  encoding: "linear" | "log10";
  scale: number;
  offset: number;
  nodata: 65535;
  below: 65534;
  grid: { width: number; height: number; bounds: [number, number, number, number]; row0: "north"; col0: "west"; byte_order: "little" };
  times: string[]; // ISO 8601 UTC, one per time step
  chunks: OfficialChunk[];
  coverage: number;
  value_range: [number, number] | null;
  label: string;
  aggregation: string;
  quantisation_step: number;
  /** From the check that covers the layer: "verified" (passed), "pattern only (values not verified)" (missed), "no check". */
  status: "verified" | "pattern only (values not verified)" | "no check";
  status_check: string | null;
  /** Layers with an opacity-decoded colorbar: values under this were censored ("below range"). */
  below_range_bound?: number;
  /** How to draw it: colours sampled along the SVS colorbar at `values`, interpolated on `scale`. Absent = not drawn. */
  display?: { colours: string[]; values: number[]; scale: "linear" | "log" };
}

/** One voice of a playable selection: the value of one layer, or the magnitude of two (u, v). */
export interface OfficialChannel {
  voice: string; // a mapping.json voice id
  layers: string[];
  combine: "value" | "magnitude";
}

/** A playable selection: what the map shows, what the voices play, where the needle starts, how fast time runs. */
export interface OfficialPlayOption {
  id: string;
  label: string;
  view: "global" | "box";
  map: string; // layer id
  start: { lat: number; lon: number };
  steps_per_second: number;
  channels: OfficialChannel[];
}

export interface OfficialCheckSummary {
  id: string;
  title: string;
  kind: "value" | "model-vs-obs" | "context" | "none";
  pass: boolean | null;
  threshold: string | null;
}

export interface OfficialManifest {
  record: string;
  app_title: string;
  svs_ids: number[];
  title: string;
  svs_pages: string[];
  description: string;
  release_date: string;
  period: { start: string; end: string; label: string };
  badge: OfficialBadge;
  credits_by_role: Record<string, string[]>;
  credit_line: string;
  licence: string;
  frame_times: { method: FrameTimeMethod; approximate: boolean; source: string; count: number; subsample?: string };
  georef: {
    projection: string;
    bounds: [number, number, number, number];
    pass_at: number;
    iou: Record<string, number>;
    pass: boolean;
    best_is_assumed: boolean;
  };
  layers: OfficialLayer[];
  /** Layer id (or a derived quantity) → mapping.json voice id. */
  voices: Record<string, string>;
  play: OfficialPlayOption[];
  disclosure: string;
  validation: OfficialCheckSummary[];
  size: { bytes: number; budget: number; choice: Record<string, number | string> };
  code_commit: string | null;
  generated_utc: string;
}

export interface OfficialCheck extends OfficialCheckSummary {
  record: string;
  source: string | null;
  metrics: Record<string, unknown>;
  note: string;
  run_utc: string;
}

export interface OfficialValidationFile {
  record: string;
  checks: OfficialCheck[];
  updated_utc: string;
}
