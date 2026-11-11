import { getCtx, getGraph, peekEngine } from "@/lib/audio/context";
import { familyNote, playCategoryEarcon, REFERENCE_HZ, type FamilyRecipe } from "@/lib/audio/orchestra";
import { track } from "@/lib/audio/sources";

const START_SEC = 0.03;
const DEMO_SEC = 1.6;
const DEMO_GAIN = 0.18;

export function playEarconLive(family: FamilyRecipe): boolean {
  if (peekEngine()?.ctx.state !== "running") return false;
  const ctx = getCtx();
  playCategoryEarcon(ctx, getGraph().earcon, family, ctx.currentTime + START_SEC, track);
  return true;
}

export function playReferenceNote(family: FamilyRecipe): void {
  const ctx = getCtx();
  familyNote(ctx, getGraph().earcon, family, { hz: REFERENCE_HZ, when: ctx.currentTime + START_SEC, duration: DEMO_SEC, gain: DEMO_GAIN }, { onSource: track });
}
