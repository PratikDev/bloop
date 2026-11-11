// "Tomorrow's fire weather": SVS 5315's GISS GlobalFWI 1-day forecast, decoded by the pipeline into six classes
// (latest/fwi_class.*), and Bloop's own daily copies (context/fwi_archive_index.json + archive/fwi/*.u8.gz, since SVS
// keeps no archive). An experimental model forecast, categorical: never a measured fire.

import { fetchJson } from "@/lib/data/fetch";
import type { FwiArchiveDay, FwiArchiveIndex, FwiClassMetadata } from "@/types/data-contract";
import { loadClassGrid, loadCodes, type ClassGrid } from "./class-grid";
import { EARTH_PATHS } from "./paths";

export type FwiGrid = ClassGrid<FwiClassMetadata>;

let latest: Promise<FwiGrid> | null = null;

/** The latest forecast grid (loaded once per page). */
export function loadFwi(): Promise<FwiGrid> {
  latest ??= loadClassGrid<FwiClassMetadata>(EARTH_PATHS.fwiMeta, EARTH_PATHS.fwiGrid);
  latest.catch(() => {
    latest = null;
  });
  return latest;
}

export const loadFwiArchiveIndex = () => fetchJson<FwiArchiveIndex>(EARTH_PATHS.fwiArchiveIndex);

/** One archived day's grid, on the latest grid's metadata (the index says its encoding is the same). */
export async function loadFwiArchiveDay(meta: FwiClassMetadata, day: FwiArchiveDay): Promise<FwiGrid> {
  return { meta, codes: await loadCodes(EARTH_PATHS.dataFile(day.file), meta.grid) };
}

/** The archive's days in the order the replay plays them: the index's own order, oldest first. */
export const replayDays = (index: FwiArchiveIndex): FwiArchiveDay[] => [...index.days].sort((a, b) => a.date.localeCompare(b.date));

/** The day after an ISO date ("2026-10-28" → "2026-10-29"): the day a 1-day forecast issued on `date` is for. */
export function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
