// The categorical rules (public/mapping-data.json, kind "classes"): a class product's code → its fixed sound state.
// Pure. A chord's tones are fixed (rootHz × 2^(semitones/12)): they never follow a value, so they can't imply a
// precision the classes don't have, and they never touch a data voice's pitch.

import { voiceSpec } from "@/lib/audio/mapping";
import type { ClassCode, ClassesMapping, ClassState } from "@/types/data-contract";

export const FIRE_WEATHER_VOICE = "fireWeather";
export const LANDSLIDE_VOICE = "landslideRumble";

export function classesRule(voice: string): ClassesMapping {
  const m = voiceSpec(voice).mapping;
  if (m?.kind !== "classes") throw new Error(`voice "${voice}" has no classes rule`);
  return m;
}

/** A code's state in a rule; null for a code the rule doesn't list (treated as silence by the players). */
export const classState = (rule: ClassesMapping, code: number): ClassState | null => rule.states.find((s) => s.code === code) ?? null;

/** A chord state's fixed tones in Hz; empty for a silence or a rumble. */
export function chordHz(rule: ClassesMapping, state: ClassState | null): number[] {
  if (!state || state.sound !== "chord" || !state.tones || rule.rootHz === undefined) return [];
  const root = rule.rootHz;
  return state.tones.map((s) => root * 2 ** (s / 12));
}

/** True when a state is a stated silence (or the code isn't in the rule). */
export const isSilent = (state: ClassState | null): boolean => !state || state.sound === "silence";

/** The rule lists exactly the product's classes, with the product's own labels (the mapping can't drift from the data). */
export const ruleMatchesClasses = (rule: ClassesMapping, classes: readonly ClassCode[]): boolean =>
  rule.states.length === classes.length && classes.every((c) => classState(rule, c.code)?.label === c.label);
