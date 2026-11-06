// §15 official Challenge #14 resources (pipeline/svs/export.py, docs/official/README.md).
// public/data/official/index.json lists the records; each record folder has manifest.json, validation.json,
// checksums.tsv.gz and its layers' chunks: <layer>_<k>.u16.gz = T×H×W little-endian uint16 (row 0 = north edge,
// col 0 = west edge), gzip; value = q·scale + offset ("linear") or 10^(q·scale + offset) ("log10"); 65535 = no data;
// 65534 = below the colorbar's range (censored: under below_range_bound, not unknown).

export type OfficialBadge = "model" | "reanalysis" | "observation";
export type OfficialStatus =
  | "verified"
  | "values with stated error"
  | "relative"
  | "pattern only"
  | "visual texture"
  | "insufficient data"
  | "observation"
  | "no check";
export type FrameTimeMethod = "date-list" | "ocr" | "linear";

export interface OfficialIndexRow {
  record: string;
  title: string;
  svs_ids: number[];
  badge: OfficialBadge;
  period: string;
  manifest: string;
  /** Related records only (public/data/related/): the EIC focus area, and the official SVS IDs it sits beside. */
  focus?: string;
  related_to?: number[];
  /** Related records only: why the record is kept off the Related shelf (pipeline/svs/onboard HIDDEN); listed in docs/HEALTH.md. */
  hidden?: string;
}

export interface OfficialIndex {
  records: OfficialIndexRow[];
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
  grid: {
    width: number;
    height: number;
    bounds: [number, number, number, number];
    row0: "north";
    col0: "west";
    byte_order: "little";
    /** "frame": no georeference; bounds are the picture's own frame (x −180…180 across, y up), not degrees. */
    space?: "frame";
  };
  times: string[]; // ISO 8601 UTC, one per time step
  time_labels?: string[]; // shown instead of the time when a step is a period (an annual composite, a change between years)
  chunks: OfficialChunk[];
  coverage: number;
  value_range: [number, number] | null;
  label: string;
  aggregation: string;
  quantisation_step: number;
  /** From the check that covers the layer, or the team's decision on it (pipeline/svs/records/decisions.py). */
  status: OfficialStatus;
  /** What the record says next to a value when it isn't simply verified (filled from the check's metrics). */
  statement: string | null;
  status_check: string | null;
  /** Censored cells (65534) read as this bound: under it ("below", opacity-decoded colorbars) or at or under it
   * ("at_or_below", pixels at the colorbar's own bottom). */
  below_range_bound?: number;
  below_kind?: "below" | "at_or_below";
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

/** A voice that plays a reference dataset instead of the frames (e.g. NASA OSCAR currents); citation copied from CMR. */
export interface OfficialVoiceSource {
  label: string;
  badge: OfficialBadge;
  period: string;
  days: number;
  citation: { concept_id: string; short_name: string; doi: string | null; text: string };
}

export interface OfficialCheckSummary {
  id: string;
  title: string;
  kind: "value" | "model-vs-obs" | "context" | "none";
  pass: boolean | null;
  threshold: string | null;
  decision?: { on: string; status: OfficialStatus; statement: string; table: string };
}

export interface OfficialManifest {
  record: string;
  app_title: string;
  svs_ids: number[];
  title: string;
  svs_pages: string[];
  description: string;
  /** null for a record with no SVS page of its own (the GIBS layers, NOAA OISST). */
  release_date: string | null;
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
  voice_sources?: Record<string, OfficialVoiceSource>;
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
