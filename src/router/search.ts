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

// "Your lifetime": its view, and the birth year of a shared link (?born=1998&city=dhaka)
export const LIFETIME_VIEW = "lifetime";
const bornOf = (v: unknown): number | undefined => {
  const y = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(y) && y >= 1850 && y <= 2100 ? y : undefined;
};
const cityOf = (v: unknown) => oneOf(PLACES, v) ?? PLACES.find((p) => typeof v === "string" && p.toLowerCase() === v.toLowerCase());

export interface ThenNowSearch {
  view?: ThenNowView | typeof LIFETIME_VIEW;
  /** ART: Your lifetime's birth year (only ever in the URL; never stored). */
  born?: number;
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
    view: oneOf([...THEN_NOW_VIEWS, LIFETIME_VIEW], raw.view) ?? (bornOf(raw.born) ? LIFETIME_VIEW : undefined), // ART
    city: cityOf(raw.city), // ART: any case (the lifetime link is lower case)
    born: bornOf(raw.born), // ART
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
