import type { ViewPart } from "@/components/ThenNow/parts";
import { VIEW_PARTS } from "@/components/ThenNow/parts";
import { HISTORY_METRICS, PLACES, type HistoryMetric } from "@/lib/history";
import { RECORD_ID } from "@/lib/transcript";
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
  // Every key is returned, undefined when the URL's value isn't allowed: the router merges the root's raw search
  // under this one, so a key left out would let the raw value (e.g. a hidden part, ?part=fires) through.
  const place = typeof raw.place === "string" && raw.place.length > 0 && raw.place.length < 80 ? raw.place : undefined;
  return {
    view: oneOf(THEN_NOW_VIEWS, raw.view),
    city: oneOf(PLACES, raw.city),
    part: oneOf(VIEW_PARTS, raw.part),
    place,
    record: oneOf(HISTORY_METRICS, raw.record),
  };
}

export interface TranscriptSearch {
  /** The record whose transcript is shown (Listen's ocean or rain, or an Official record's id); none lists them all. */
  record?: string;
}

export function transcriptSearch(raw: Raw): TranscriptSearch {
  return { record: typeof raw.record === "string" && RECORD_ID.test(raw.record) ? raw.record : undefined };
}
