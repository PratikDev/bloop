import { voiceSpec } from "@/lib/audio/mapping";
import type { ClassesMapping, ClassState } from "@/types/data-contract";

export const FIRE_WEATHER_VOICE = "fireWeather";
export const LANDSLIDE_VOICE = "landslideRumble";

export function classesRule(voice: string): ClassesMapping {
  const m = voiceSpec(voice).mapping;
  if (m?.kind !== "classes") throw new Error(`voice "${voice}" has no classes rule`);
  return m;
}

export const classState = (rule: ClassesMapping, code: number): ClassState | null => rule.states.find((s) => s.code === code) ?? null;

export function chordHz(rule: ClassesMapping, state: ClassState | null): number[] {
  if (!state || state.sound !== "chord" || !state.tones || rule.rootHz === undefined) return [];
  const root = rule.rootHz;
  return state.tones.map((s) => root * 2 ** (s / 12));
}

export const isSilent = (state: ClassState | null): boolean => !state || state.sound === "silence";
