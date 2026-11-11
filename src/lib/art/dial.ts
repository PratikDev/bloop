import type { DialStop, PlayMode } from "@/lib/audio/layers/types";

export interface DialLayers {
  timbre: boolean;
  ticks: boolean;
  bed: boolean;
  chord: boolean;
  drone: boolean;
  reverb: boolean;
  meend: boolean;
}

const CHANGE_KEYS = ["timbre", "ticks", "bed", "chord", "drone", "reverb", "meend"] as const satisfies readonly (keyof DialLayers)[];
export type ChangeKey = (typeof CHANGE_KEYS)[number];

export function dialLayers(stop: DialStop, playMode: PlayMode, orchestra: boolean): DialLayers {
  const single = playMode === "single";
  if (stop === 0) return { timbre: false, ticks: true, bed: false, chord: false, drone: false, reverb: false, meend: false };
  const music = stop === 1;
  return { timbre: orchestra, ticks: false, bed: true, chord: single, drone: music && single, reverb: music, meend: music };
}

export function whatChanges(layers: DialLayers): ChangeKey[] {
  return CHANGE_KEYS.filter((k) => layers[k]);
}
