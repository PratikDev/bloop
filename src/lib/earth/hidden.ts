import { fetchJson } from "@/lib/data/fetch";
import { DATA_PATHS } from "@/lib/data/paths";
import type { OfficialIndex } from "@/types/data-contract";

interface HiddenRecord {
  record: string;
  title: string;
  reason: string;
}

const hiddenRecords = (index: OfficialIndex): HiddenRecord[] =>
  index.records.flatMap((r) => (r.hidden ? [{ record: r.record, title: r.title, reason: r.hidden }] : []));

export const loadHiddenRelated = async (): Promise<HiddenRecord[]> => hiddenRecords(await fetchJson<OfficialIndex>(DATA_PATHS.related("index.json")));
