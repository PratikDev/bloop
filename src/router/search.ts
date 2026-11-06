import type { ViewPart } from "@/components/ThenNow/parts";
import { VIEW_PARTS } from "@/components/ThenNow/parts";
import { HISTORY_METRICS, PLACES, type HistoryMetric } from "@/lib/history";
import type { ClimateCellName } from "@/types/data-contract";

// Each page's URL state, checked on the way in: an unknown value is dropped
// (the page falls back to its default) instead of reaching the components.

type Raw = Record<string, unknown>;

const oneOf = <T extends string>(options: readonly T[], value: unknown): T | undefined => options.find((o) => o === value);

export interface ListenSearch {
  /** The guided tour (Story) on the map. */
  tour?: true;
}

export function listenSearch(raw: Raw): ListenSearch {
  return raw.tour === true || raw.tour === 1 || raw.tour === "1" ? { tour: true } : {};
}

export const THEN_NOW_VIEWS = ["compare", "monthly"] as const;
export type ThenNowView = (typeof THEN_NOW_VIEWS)[number];

export interface ThenNowSearch {
  view?: ThenNowView;
  /** Compare decades */
  city?: ClimateCellName;
  part?: ViewPart;
  /** Month by month (any of the 38 places, so any name; unknown names show the "loading/error" state of the picker) */
  place?: string;
  record?: HistoryMetric;
}

export function thenNowSearch(raw: Raw): ThenNowSearch {
  const search: ThenNowSearch = {};
  const view = oneOf(THEN_NOW_VIEWS, raw.view);
  const city = oneOf(PLACES, raw.city);
  const part = oneOf(VIEW_PARTS, raw.part);
  const record = oneOf(HISTORY_METRICS, raw.record);
  if (view) search.view = view;
  if (city) search.city = city;
  if (part) search.part = part;
  if (typeof raw.place === "string" && raw.place.length > 0 && raw.place.length < 80) search.place = raw.place;
  if (record) search.record = record;
  return search;
}
