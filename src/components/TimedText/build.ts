// Builds a run's timed text in both languages (accessibility core, step 7): the same builder feeds the run playing now
// (src/lib/timed-text/live.ts) and the transcript page's moments and .vtt downloads, so they never disagree.
import { bindT, LANGS, type Lang } from "@/lib/i18n";
import type { TimedRun } from "@/lib/timed-text/live";
import { vttFiles, type TimedPlayer, type TimedTracks, type TrackText } from "@/lib/timed-text/tracks";
import type { VttKind } from "@/lib/timed-text/vtt";
import { loadGeoSoon, placeNamers } from "../Describe/place-namer";

export type TrackBuilder = (x: TrackText) => TimedTracks;

/** The tracks and their .vtt files, per language. */
export interface BuiltTracks {
  tracks: Record<Lang, TimedTracks>;
  files: Record<Lang, Record<VttKind, string>>;
}

export async function buildTracks(player: TimedPlayer, build: TrackBuilder): Promise<BuiltTracks> {
  const geo = await loadGeoSoon();
  const per = LANGS.map((lang) => {
    const x: TrackText = { t: bindT(lang), lang, places: placeNamers(geo, lang) };
    const tracks = build(x);
    return [lang, { tracks, files: vttFiles(x, player, tracks) }] as const;
  });
  return {
    tracks: Object.fromEntries(per.map(([lang, b]) => [lang, b.tracks])) as BuiltTracks["tracks"],
    files: Object.fromEntries(per.map(([lang, b]) => [lang, b.files])) as BuiltTracks["files"],
  };
}

/** A run's timed text, ready for startTimedRun(). */
export async function timedRun(player: TimedPlayer, stepSec: number, build: TrackBuilder): Promise<TimedRun> {
  const { files } = await buildTracks(player, build);
  return { player, stepSec, files };
}
