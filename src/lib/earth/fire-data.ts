import { loadFirms } from "@/lib/data/context";
import { fetchJson } from "@/lib/data/fetch";
import type { FirmsContextFile, FirmsDailyBlock, FiresFrameMetadata, FwiArchiveIndex } from "@/types/data-contract";
import { loadFwi, loadFwiArchiveDay, loadFwiArchiveIndex, replayDays, type FwiGrid } from "./fwi";
import { EARTH_PATHS } from "./paths";
import type { PilotDay } from "./pilot";

export interface FireData {
  fwi: FwiGrid;
  archive: FwiArchiveIndex;
  firms: FirmsContextFile;
  daily: FirmsDailyBlock;
  fires: FiresFrameMetadata;
}

export async function loadFireData(): Promise<FireData> {
  const [fwi, archive, firms, fires] = await Promise.all([loadFwi(), loadFwiArchiveIndex(), loadFirms(), fetchJson<FiresFrameMetadata>(EARTH_PATHS.firesMeta)]);
  if (!firms.daily) throw new Error("context/firms.json has no daily block");
  return { fwi, archive, firms, daily: firms.daily, fires };
}

export async function loadArchiveGrids(data: Pick<FireData, "fwi" | "archive">): Promise<PilotDay[]> {
  return Promise.all(replayDays(data.archive).map(async (d) => ({ date: d.date, codes: (await loadFwiArchiveDay(data.fwi.meta, d)).codes })));
}
