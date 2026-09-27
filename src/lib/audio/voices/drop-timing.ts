// PURE: when the next rain drop / snow bell falls. Intervals are jittered so
// the sound is less mechanical (AUDIO_RESEARCH A4, a design choice), but the
// jitter is symmetric around 1, so the AVERAGE rate always equals the mapping
// rule's drops per second (the honest average).

export const JITTER_MIN = 0.7;
export const JITTER_MAX = 1.3;

/** Seconds until the next drop: (1 / rate) × jitter, jitter uniform in [0.7, 1.3] (mean 1). */
export function jitteredInterval(ratePerSec: number, random: () => number = Math.random): number {
  const jitter = JITTER_MIN + (JITTER_MAX - JITTER_MIN) * random();
  return jitter / ratePerSec;
}

/**
 * When the next drop should fall after a rate change: one interval at the new
 * rate after the last drop, but never in the past (no catch-up burst).
 */
export function nextDropTime(
  lastDropTime: number,
  ratePerSec: number,
  now: number,
  random: () => number = Math.random,
): number {
  return Math.max(now, lastDropTime + jitteredInterval(ratePerSec, random));
}
