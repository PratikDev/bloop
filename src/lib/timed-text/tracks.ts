// PURE: what the sweep's and the time-lapse's timed text tracks share (accessibility core, step 7). Every number in a
// cue is a slot from the step it describes; the words are the i18n templates in en/bn timed-text.ts.
import type { SweepPoint } from "@/lib/audio/types";
import type { PlaceNamers } from "@/lib/describe/facts";
import { formatRainRate, formatTemperature, type BoundT, type Lang } from "@/lib/i18n";
import { toVtt, type Cue, type CueData, type VttKind } from "./vtt";

export interface TimedTracks {
  metadata: Cue[];
  chapters: Cue[];
  captions: Cue[];
}

/** The players a timed track follows (their step events carry these names). */
export type TimedPlayer = "sweep" | "timelapse";

export interface TrackText {
  t: BoundT;
  lang: Lang;
  places: PlaceNamers;
}

/** A spot's name, or its coordinates when the gazetteer has none (the descriptions' rule). */
export const placeOf = (x: TrackText, at: { lat: number; lon: number }) => x.places.name(at) ?? x.t("place.spoken", at);
export const regionOf = (x: TrackText, at: { lat: number; lon: number }) => x.places.region(at) ?? x.t("place.spoken", at);

export const UNIT = { ocean: "°C", rain: "mm/h" } as const;

export const tempSlot = (x: TrackText, c: number) => formatTemperature(c, x.lang);
export const rainSlot = (x: TrackText, mm: number) => formatRainRate(mm, x.lang);

/** What a point's rain sounds like, as a metadata note. */
export function rainNote(x: TrackText, p: Pick<SweepPoint, "mmPerHour" | "phase">): string {
  if (p.phase === "nodata" || p.mmPerHour === null) return x.t("tt.note.nodata");
  if (p.phase === "dry" || p.mmPerHour === 0) return x.t("tt.note.dry");
  return x.t(p.phase === "frozen" ? "tt.note.snow" : "tt.note.rain", { value: rainSlot(x, p.mmPerHour) });
}

export const metadataCue = (start: number, end: number, data: CueData): Cue => ({ start, end, text: JSON.stringify(data) });

export const KIND_LABEL = { metadata: "tt.kind.metadata", chapters: "tt.kind.chapters", captions: "tt.kind.captions" } as const satisfies Record<VttKind, string>;
export const WHAT_LABEL = { sweep: "tt.what.sweep", timelapse: "tt.what.timelapse" } as const satisfies Record<TimedPlayer, string>;

/** The three .vtt files of a run, each with a NOTE saying what it follows. */
export function vttFiles(x: TrackText, player: TimedPlayer, tracks: TimedTracks): Record<VttKind, string> {
  const what = x.t(WHAT_LABEL[player]);
  const file = (kind: VttKind) => toVtt(tracks[kind], x.t("tt.file.note", { what, kind: x.t(KIND_LABEL[kind]) }));
  return { metadata: file("metadata"), chapters: file("chapters"), captions: file("captions") };
}
