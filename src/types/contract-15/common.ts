// §15 shared pieces: the header every new product file carries (pipeline/core/header.py) and
// meta/freshness.json (pipeline/build_freshness.py). Badge vocabularies = pipeline/products/datasets.py.

export type Agency = "NASA" | "JAXA" | "NOAA" | "Copernicus" | "ground" | "other";
export type SourceKind = "measurement" | "model" | "inventory";
export type Pairing = "frame-paired" | "context";

export interface DatasetRef {
  id: string;
  name: string;
  agency: Agency;
  kind: SourceKind; // "model" and "inventory" always show the "Model estimate" badge (guardrail 15)
  shares_inputs_with: string[]; // dataset ids (book §4.6): said out loud as "partly independent"
}

export interface ProductHeader {
  product: string; // a freshness.json product id
  title: string;
  pairing: Pairing;
  datasets: DatasetRef[];
  credit: string; // book §13.3 wording
  disclosure: string;
  source_time_utc: string | null; // newest source time (ISO 8601 UTC)
  generated_utc: string;
}

// Shared by every new binary grid's metadata (shape of the §1 grid blocks).
export interface GridBlock<E extends string> {
  width: number;
  height: number;
  encoding: E;
  byte_order: "little";
  row0: string;
  col0: string;
  aggregation: string;
}

// ---------------------------------------------------------------------------
// meta/freshness.json — one entry per product in pipeline/products/registry.py.
// The app recomputes age from source_time_utc; past limit_days = "recorded" (guardrail 16).
// ---------------------------------------------------------------------------

export type FreshnessStatus = "ok" | "stale" | "baseline" | "missing" | "no-time";
export type Cadence = "daily" | "weekly" | "static" | "live";

export interface FreshnessEntry {
  product: string;
  title: string;
  outputs: string[];
  cadence: Cadence;
  pairing: Pairing;
  datasets: DatasetRef[];
  limit_days: number | null; // null = a baseline / climatology, never presented as current
  status: FreshnessStatus; // at build time
  source_time_utc: string | null;
  age_days: number | null; // at build time
  period: [string | null, string | null] | null; // first/last date, shown for baselines
  credit: string;
  bytes: number;
}

export interface FreshnessFile {
  generated_utc: string;
  products: Record<string, FreshnessEntry>;
}
