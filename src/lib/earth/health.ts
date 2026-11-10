// meta/health.json (pipeline/health, `npm run health`): one row per record and product with its checks, its newest
// shipped data time, the source's newest time and the lag between them. The app reads it for "Is this data fresh?"
// (every How we got this) and the Data health page. Never a local path: any text that looks like one is dropped.

import { fetchJson } from "@/lib/data/fetch";
import { EARTH_PATHS } from "./paths";

export interface HealthCheck {
  check: string;
  /** true passed, false failed, null not applicable / not run. */
  ok: boolean | null;
  note: string;
}

export interface HealthRecord {
  id: string;
  category: string;
  title: string;
  kind: string;
  svs_ids: number[];
  status: string;
  product: string | null;
  checks: HealthCheck[];
  last_data_utc: string | null;
  source_latest_utc: string | null;
  lag_days: number | null;
  app_plays: string | null;
}

export interface HealthHidden {
  record: string;
  title: string;
  reason: string;
}

export interface HealthFile {
  /** When the health run finished (UTC, minutes). */
  generated_utc: string;
  records: HealthRecord[];
  hidden: HealthHidden[];
}

/** What "Is this data fresh?" and the Data health page show for one record. */
export interface HealthSummary {
  id: string;
  title: string;
  category: string;
  lastData: string | null;
  sourceLatest: string | null;
  lagDays: number | null;
  passed: number;
  failed: number;
  /** The names of the failed checks (never their notes, which can carry file names). */
  failedChecks: string[];
  /** The health run's own time. */
  runUtc: string;
}

/** A Windows drive, a UNC share, a home or temp folder, or the repo's raw-data and pipeline folders. */
const LOCAL_PATH = /[A-Za-z]:[\\/]|\\\\|\/(?:home|Users|tmp|mnt|var)\/|data_raw|pipeline[\\/]|\.venv/u;

/** True when a string from the file looks like a path on someone's machine (never shown). */
export const looksLocal = (s: string): boolean => LOCAL_PATH.test(s);

const safe = (s: string | null): string | null => (s !== null && !looksLocal(s) ? s : null);

export function summarise(file: HealthFile, record: HealthRecord): HealthSummary {
  const failed = record.checks.filter((c) => c.ok === false);
  return {
    id: record.id,
    title: safe(record.title) ?? record.id,
    category: record.category,
    lastData: safe(record.last_data_utc),
    sourceLatest: safe(record.source_latest_utc),
    lagDays: record.lag_days,
    passed: record.checks.filter((c) => c.ok === true).length,
    failed: failed.length,
    failedChecks: failed.map((c) => c.check).filter((c) => !looksLocal(c)),
    runUtc: file.generated_utc,
  };
}

/** Every record's summary, in the file's order (one row each on the Data health page). */
export const healthRows = (file: HealthFile): HealthSummary[] => file.records.map((r) => summarise(file, r));

/** One record's summary by its id (a product id such as "sst", or an Official record id); null if the run has none. */
export function healthOf(file: HealthFile, id: string): HealthSummary | null {
  const record = file.records.find((r) => r.id === id);
  return record ? summarise(file, record) : null;
}

let cached: Promise<HealthFile> | null = null;

/** Loaded once per page; every panel reads the same copy. */
export function loadHealth(): Promise<HealthFile> {
  cached ??= fetchJson<HealthFile>(EARTH_PATHS.health);
  cached.catch(() => {
    cached = null;
  });
  return cached;
}
