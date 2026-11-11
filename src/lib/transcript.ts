// PURE: the transcript page per record (WCAG G158). Which records have one,
// their address, the time a moment is heard at, and an Official record's highest and lowest values (from the same
// decoded grid the sound plays).
import { decodeCode, type OfficialGrid } from "@/lib/data/official";
import { formatFixed, formatInteger, type Lang } from "@/lib/i18n";
import type { Cue } from "@/lib/timed-text/vtt";

/** The Listen page's records (their sound is the sweep and the time-lapse); every Official record also has one. */
export const LIVE_TRANSCRIPTS = ["ocean", "rain"] as const;
export type LiveTranscript = (typeof LIVE_TRANSCRIPTS)[number];

/** Their names (the Listen frame labels). */
export const LIVE_TITLE = { ocean: "frame.product.ocean", rain: "frame.product.rain" } as const satisfies Record<LiveTranscript, string>;

export const TRANSCRIPT_PATH = "/transcript";

/** A record id as the URL may carry it (Official ids are lowercase words, digits and underscores). */
export const RECORD_ID = /^[a-z0-9_]{1,40}$/;

export const isLiveTranscript = (record: string): record is LiveTranscript => (LIVE_TRANSCRIPTS as readonly string[]).includes(record);

const SEC_PER_MIN = 60;

/** A moment's time from the start: "0:03.2" (minutes, then seconds to a tenth). */
export function momentClock(sec: number, lang: Lang): string {
  const m = Math.floor(sec / SEC_PER_MIN);
  const s = sec - m * SEC_PER_MIN;
  return `${formatInteger(m, lang)}:${s < 10 ? formatInteger(0, lang) : ""}${formatFixed(s, lang, 1)}`;
}

/** The captions worth listing as moments: each one, with its start time. */
export const moments = (captions: readonly Cue[]) => captions.map((c) => ({ sec: c.start, text: c.text }));

export interface GridExtreme {
  value: number;
  lat: number;
  lon: number;
  /** The time step it is in. */
  step: number;
}

/** The highest and lowest decoded values over every time step of a georeferenced Official layer (censored values left out). */
export function gridExtremes(grid: OfficialGrid): { max: GridExtreme; min: GridExtreme } | null {
  const { width, height, bounds } = grid.layer.grid;
  const [west, south, east, north] = bounds;
  let max: GridExtreme | null = null;
  let min: GridExtreme | null = null;
  grid.steps.forEach((codes, step) => {
    for (let i = 0; i < codes.length; i++) {
      const r = decodeCode(grid.layer, codes[i]);
      if (!r || r.below) continue;
      if (max && min && r.value <= max.value && r.value >= min.value) continue;
      const row = Math.floor(i / width);
      const col = i % width;
      const at = { value: r.value, step, lat: north - ((row + 0.5) / height) * (north - south), lon: west + ((col + 0.5) / width) * (east - west) };
      if (!max || r.value > max.value) max = at;
      if (!min || r.value < min.value) min = at;
    }
  });
  return max && min ? { max, min } : null;
}
