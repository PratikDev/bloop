"use client";

import { loadFreshness } from "@/lib/data";
import type { FreshnessFile } from "@/types/data-contract";
import { useLoaded } from "./use-loaded";

/** meta/freshness.json (loaded once per page); null while loading or if it is missing (badges don't show). */
export function useFreshness(): FreshnessFile | null {
  return useLoaded(loadFreshness).value;
}
