import { fetchJson } from "@/lib/data/fetch";
import type { FwiArchiveDay, FwiArchiveIndex, FwiClassMetadata } from "@/types/data-contract";
import { loadClassGrid, loadCodes, type ClassGrid } from "./class-grid";
import { EARTH_PATHS } from "./paths";

export type FwiGrid = ClassGrid<FwiClassMetadata>;

let latest: Promise<FwiGrid> | null = null;

export function loadFwi(): Promise<FwiGrid> {
  latest ??= loadClassGrid<FwiClassMetadata>(EARTH_PATHS.fwiMeta, EARTH_PATHS.fwiGrid);
  latest.catch(() => {
    latest = null;
  });
  return latest;
}

export const loadFwiArchiveIndex = () => fetchJson<FwiArchiveIndex>(EARTH_PATHS.fwiArchiveIndex);

export async function loadFwiArchiveDay(meta: FwiClassMetadata, day: FwiArchiveDay): Promise<FwiGrid> {
  return { meta, codes: await loadCodes(EARTH_PATHS.dataFile(day.file), meta.grid) };
}

export const replayDays = (index: FwiArchiveIndex): FwiArchiveDay[] => [...index.days].sort((a, b) => a.date.localeCompare(b.date));

export function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
