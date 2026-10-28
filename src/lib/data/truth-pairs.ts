// The truth points (contract-15/truth.ts): the 60 SST pairs behind latest_check, and the
// three-way reading at the same points.

import { distanceKm } from "@/lib/geo/spherical";
import type { SstPairsFile, SstTruthPair, ThreeWayFile } from "@/types/data-contract";
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
