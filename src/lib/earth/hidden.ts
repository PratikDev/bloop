// The related records the pipeline keeps off the shelves (related/index.json rows with `hidden`: pipeline/svs/onboard
// HIDDEN), with the pipeline's own reason. They stay unplayable; Official records lists them under "Not playable".

import { fetchJson } from "@/lib/data/fetch";
import { DATA_PATHS } from "@/lib/data/paths";
import type { OfficialIndex } from "@/types/data-contract";

interface HiddenRecord {
  record: string;
  title: string;
  reason: string;
}

/** Every hidden row of an index, in its order, with its reason. */
export const hiddenRecords = (index: OfficialIndex): HiddenRecord[] =>
  index.records.flatMap((r) => (r.hidden ? [{ record: r.record, title: r.title, reason: r.hidden }] : []));

/** The full related index (hidden rows included: loadRelatedIndex leaves them out). */
export const loadHiddenRelated = async (): Promise<HiddenRecord[]> => hiddenRecords(await fetchJson<OfficialIndex>(DATA_PATHS.related("index.json")));
