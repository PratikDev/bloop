// PURE: what the Science ↔ Art dial adds at each stop. The data voice is the same at every
// stop: the same value → pitch rule, onsets and tempo. Only what sounds around it changes.

import type { DialStop, PlayMode } from "@/lib/audio/layers/types";

export interface DialLayers {
  /** Earth Orchestra's instrument on the data voice (when the Instrument style is Earth Orchestra). */
  timbre: boolean;
  /** Faint ticks at round values (0 Measure only). */
  ticks: boolean;
  /** A soft bed under the data voice, only while it sounds. */
  bed: boolean;
  /** The value chord (CV's layer, through the hook), replacing the second voice; never with two data voices. */
  chord: boolean;
  /** A fixed drone on the record's Sa (never moved by data); its colour follows the season. */
  drone: boolean;
  reverb: boolean;
  /** Swara + meend: the data voice starts on the nearest scale note, then glides to (and settles on) the data pitch. */
  meend: boolean;
}

/** The changes a stop makes, in the order the on-screen line lists them. */
const CHANGE_KEYS = ["timbre", "ticks", "bed", "chord", "drone", "reverb", "meend"] as const satisfies readonly (keyof DialLayers)[];
export type ChangeKey = (typeof CHANGE_KEYS)[number];

/**
 * The layers at a stop. In Both / duet modes two data voices already play, so the chord and the drone stay off (the
 * dial never stacks voices past the two-data-voice cap). `orchestra` = the Instrument style is Earth Orchestra.
 */
export function dialLayers(stop: DialStop, playMode: PlayMode, orchestra: boolean): DialLayers {
  const single = playMode === "single";
  if (stop === 0) return { timbre: false, ticks: true, bed: false, chord: false, drone: false, reverb: false, meend: false };
  const music = stop === 1;
  return { timbre: orchestra, ticks: false, bed: true, chord: single, drone: music && single, reverb: music, meend: music };
}

/** What changes at a stop (for "What changes: …"); empty never happens (0 has its ticks). */
export function whatChanges(layers: DialLayers): ChangeKey[] {
  return CHANGE_KEYS.filter((k) => layers[k]);
}
