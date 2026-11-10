// Earth Orchestra's fixed-note sounds in the live app (the category earcon, the legend's demo note): on L2's earcon
// bus (not a data voice), so Mute all silences them with the master and Stop / Esc ends them.

import { getCtx, getGraph, peekEngine } from "@/lib/audio/context";
import { familyNote, playCategoryEarcon, REFERENCE_HZ, type FamilyRecipe } from "@/lib/audio/orchestra";
import { track } from "@/lib/audio/sources";

const START_SEC = 0.03;
const DEMO_SEC = 1.6;
const DEMO_GAIN = 0.18;

/** The record's category motif (0.4 s), if the engine is running. The caller checks mute and "Each step". */
export function playEarconLive(family: FamilyRecipe): boolean {
  if (peekEngine()?.ctx.state !== "running") return false;
  const ctx = getCtx();
  playCategoryEarcon(ctx, getGraph().earcon, family, ctx.currentTime + START_SEC, track);
  return true;
}

/** One note of a family on the fixed reference pitch (the legend's "Hear it"). */
export function playReferenceNote(family: FamilyRecipe): void {
  const ctx = getCtx();
  familyNote(ctx, getGraph().earcon, family, { hz: REFERENCE_HZ, when: ctx.currentTime + START_SEC, duration: DEMO_SEC, gain: DEMO_GAIN }, { onSource: track });
}
