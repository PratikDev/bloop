// meta/freshness.json (contract-15/common.ts): each product's newest source time and limit.
// The age is recomputed at view time; past its limit a product is "recorded" (guardrail 16).

import type { FreshnessEntry, FreshnessFile } from "@/types/data-contract";
import { fetchJson } from "./fetch";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

const DAY_MS = 86_400_000;

let cached: Promise<FreshnessFile> | null = null;

/** Loaded once per page; every badge reads the same copy. */
export function loadFreshness(): Promise<FreshnessFile> {
  cached ??= fetchJson<FreshnessFile>(DATA_PATHS.freshness).then((file) => {
    requirePaths("freshness.json", file, { products: "object", generated_utc: "string" });
    return file;
  });
  cached.catch(() => {
    cached = null; // a failed load can be retried
  });
  return cached;
}

/** Days since the product's newest source time, now; null for baselines or a missing time. */
export function ageDaysAt(entry: FreshnessEntry, now: number): number | null {
  if (!entry.source_time_utc) return null;
  const t = Date.parse(entry.source_time_utc);
  return Number.isNaN(t) ? null : (now - t) / DAY_MS;
}

export type Liveness = "live" | "recorded" | "baseline" | "missing";

/** live = within its limit; recorded = past it (plays the recorded texture); baseline = never presented as current. */
export function livenessAt(entry: FreshnessEntry | undefined, now: number): Liveness {
  if (!entry || entry.status === "missing") return "missing";
  if (entry.limit_days === null) return "baseline";
  const age = ageDaysAt(entry, now);
  return age !== null && age <= entry.limit_days ? "live" : "recorded";
}

/** True when any of its datasets is a model or inventory (the "Model estimate" badge). */
export function isModel(entry: FreshnessEntry): boolean {
  return entry.datasets.some((d) => d.kind !== "measurement");
}

/** Unique credit lines, in registry order (the credits drawer). */
export function creditLines(file: FreshnessFile): string[] {
  return [...new Set(Object.values(file.products).filter((e) => e.status !== "missing").map((e) => e.credit).filter(Boolean))];
}
