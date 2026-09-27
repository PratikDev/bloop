// Typed placeholders for API functions of later phases (docs/L2/BUILD_PLAN.md).
// They have their final signatures, so L3 can wire the whole UI now; calling
// one logs which phase implements it and does nothing. Move each function out
// of this file when its phase is built.

import { idleHandle } from "./players/sequence";
import type { CompareSide, PlayerHandle, SweepPoint, ThenNowInput } from "./types";

function warn(name: string, phase: number) {
  console.warn(`audio: ${name}() is not implemented yet (Phase ${phase}).`);
}

const resolved = (name: string, phase: number) => () => {
  warn(name, phase);
  return Promise.resolve();
};

const idlePlayer = (name: string, phase: number) => (): PlayerHandle => {
  warn(name, phase);
  return idleHandle();
};

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
