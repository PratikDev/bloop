// Typed placeholders for API functions of later phases (docs/L2/BUILD_PLAN.md).
// They have their final signatures, so L3 can wire the whole UI now; calling
// one logs which phase implements it and does nothing. Move each function out
// of this file when its phase is built.

import type {
  CaptionParams,
  CompareSide,
  EarconId,
  Lang,
  LegendVoice,
  PlayerHandle,
  RainPhase,
  SweepPoint,
  ThenNowInput,
  TrackMode,
} from "./types";

function warn(name: string, phase: number) {
  console.warn(`audio: ${name}() is not implemented yet (Phase ${phase}).`);
}

const noop = (name: string, phase: number) => () => warn(name, phase);

const resolved = (name: string, phase: number) => () => {
  warn(name, phase);
  return Promise.resolve();
};

const idlePlayer = (name: string, phase: number) => (): PlayerHandle => {
  warn(name, phase);
  return { stop: () => {}, done: Promise.resolve() };
};

// Phase 2 — live voices
export const setTrackMode: (mode: TrackMode) => void = noop("setTrackMode", 2);
export const setOcean: (valueC: number | null, lon: number) => void = noop("setOcean", 2);
export const setRain: (mmPerHour: number | null, phase: RainPhase, lon: number) => void = noop("setRain", 2);
export const silenceLive: () => void = noop("silenceLive", 2);

// Phase 3 — speech, legend, earcons
export const speak: (text: string, lang: Lang) => Promise<void> = resolved("speak", 3);
export const playEarcon: (id: EarconId, opts?: { lon?: number; params?: CaptionParams }) => void = noop(
  "playEarcon",
  3,
);
export const playLegend: (voice: LegendVoice) => PlayerHandle = idlePlayer("playLegend", 3);
export const playLegendForMode: (mode: TrackMode) => PlayerHandle = idlePlayer("playLegendForMode", 3);
export const playWarmup: () => PlayerHandle = idlePlayer("playWarmup", 3);

// Phase 4 — sequences
export const playSweep: (points: SweepPoint[], opts?: { stepMs?: number }) => PlayerHandle = idlePlayer(
  "playSweep",
  4,
);
export const playMotif: (bandMeansC: (number | null)[]) => PlayerHandle = idlePlayer("playMotif", 4);
export const playOpening: (points: SweepPoint[], opts?: { durationSec?: number }) => PlayerHandle = idlePlayer(
  "playOpening",
  4,
);

// Phase 5 — Then vs Now, Comparison
export const playThenNow: (input: ThenNowInput, part: "heat" | "monsoon" | "water" | "all") => PlayerHandle =
  idlePlayer("playThenNow", 5);
export const playCompare: (a: CompareSide, b: CompareSide, mode: "sequential" | "split") => PlayerHandle =
  idlePlayer("playCompare", 5);

// Phase 6 — time-lapse
export const playTimelapse: (frames: SweepPoint[], opts?: { fps?: number; loop?: boolean }) => PlayerHandle =
  idlePlayer("playTimelapse", 6);

// Phase 8 — recorded narration
export const preloadClips: (urls: string[]) => Promise<void> = resolved("preloadClips", 8);
export const playClip: (url: string) => Promise<void> = resolved("playClip", 8);
