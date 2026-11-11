import { continuousRule, mapContinuous } from "@/lib/audio/mapping";

export const GEIGER_VOICE = "fireGeiger";
export const BRIGHTNESS_VOICE = "fireBrightness";

export function geigerRate(count: number): number {
  if (!(count > 0)) return 0;
  return mapContinuous(count, continuousRule(GEIGER_VOICE)) ?? 0;
}

export function geigerBrightness(count: number, frpSumMW: number): number | null {
  if (!(count > 0) || !(frpSumMW > 0)) return null;
  return mapContinuous(frpSumMW / count, continuousRule(BRIGHTNESS_VOICE));
}

export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const poissonGap = (rate: number, random: () => number): number => -Math.log(1 - random()) / rate;
