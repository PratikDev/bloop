// The truth points (contract-15/truth.ts): the 60 SST pairs behind latest_check, and the
// three-way reading at the same points.

import { distanceKm } from "@/lib/geo/spherical";
import type { RainPairsFile, SstPairsFile, SstTruthPair, ThreeWayFile } from "@/types/data-contract";
import type { TruthStatsFile } from "@/types/truth-stats";
import { fetchJson } from "./fetch";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

let pairsCache: Promise<SstPairsFile> | null = null;

/** Loaded once per page (the U key, the Truth panel and the helix share it). */
export function loadSstPairs(): Promise<SstPairsFile> {
  pairsCache ??= fetchJson<SstPairsFile>(DATA_PATHS.truthPairs("sst")).then((file) => {
    requirePaths("sst_pairs.json", file, { pairs: "array", check: "object", "check.median_abs": "number" });
    return file;
  });
  pairsCache.catch(() => {
    pairsCache = null;
  });
  return pairsCache;
}

/** The rain points behind the newest frame's check (How we know's rain card). */
export async function loadRainPairs(): Promise<RainPairsFile> {
  const file = await fetchJson<RainPairsFile>(DATA_PATHS.truthPairs("rain"));
  requirePaths("rain_pairs.json", file, { pairs: "array", check: "object", datasets: "array" });
  return file;
}

/** Spearman's rho and n for each How we know check (pipeline/stats/truth_stats.py). */
export async function loadTruthStats(): Promise<TruthStatsFile> {
  const file = await fetchJson<TruthStatsFile>(DATA_PATHS.truthStats);
  requirePaths("truth/stats.json", file, { "sst.spearman_rho": "number", "rain.spearman_rho": "number", "globe.spearman_rho": "number" });
  return file;
}

export async function loadThreeWay(): Promise<ThreeWayFile> {
  const file = await fetchJson<ThreeWayFile>(DATA_PATHS.threeway);
  requirePaths("threeway.json", file, { points: "array", summary: "object", gibs_decode_share: "number" });
  return file;
}

/** The checked point nearest to (lat, lon), with its distance. */
export function nearestPair(pairs: readonly SstTruthPair[], lat: number, lon: number): { pair: SstTruthPair; km: number } | null {
  let best: { pair: SstTruthPair; km: number } | null = null;
  for (const pair of pairs) {
    const km = distanceKm({ lat, lon }, pair);
    if (!best || km < best.km) best = { pair, km };
  }
  return best;
}
