// Fire Geiger, pure: clicks at random times, a Poisson process whose rate comes from the day's FIRMS hotspot
// count through the "fireGeiger" rule (public/mapping-data.json: a log scale into a listenable clicks/s band), and a
// brightness (low-pass cutoff) from the fire radiative power per hotspot through "fireBrightness". FRP never changes
// loudness. Zero detections: no clicks at all (a stated silence).

import { continuousRule, mapContinuous } from "@/lib/audio/mapping";

export const GEIGER_VOICE = "fireGeiger";
export const BRIGHTNESS_VOICE = "fireBrightness";

/** Clicks per second for a day's hotspot count; 0 for zero detections (stated silence). */
export function geigerRate(count: number): number {
  if (!(count > 0)) return 0;
  return mapContinuous(count, continuousRule(GEIGER_VOICE)) ?? 0;
}

/** The clicks' low-pass cutoff (Hz) for a day's FRP per hotspot; null when there is no FRP to read. */
export function geigerBrightness(count: number, frpSumMW: number): number | null {
  if (!(count > 0) || !(frpSumMW > 0)) return null;
  return mapContinuous(frpSumMW / count, continuousRule(BRIGHTNESS_VOICE));
}

/** A small seeded generator (mulberry32), so a test can replay the same clicks. */
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

/** The next gap of a Poisson process at `rate` per second (exponential inter-arrival). */
export const poissonGap = (rate: number, random: () => number): number => -Math.log(1 - random()) / rate;

/** Every click time in [0, durationSec) at `rate` clicks/s; none at rate 0. */
export function poissonTimes(rate: number, durationSec: number, random: () => number = Math.random): number[] {
  if (!(rate > 0)) return [];
  const out: number[] = [];
  for (let t = poissonGap(rate, random); t < durationSec; t += poissonGap(rate, random)) out.push(t);
  return out;
}
