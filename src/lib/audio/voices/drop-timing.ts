// PURE: when the next rain drop / snow bell falls. Each interval is jittered
// so the sound is less mechanical (AUDIO_RESEARCH A4, a design choice), with
// the jitter symmetric around 1 so the AVERAGE rate always equals the mapping
// rule (the honest average).
//
// The jitter is drawn ONCE per drop, as an amount of "progress" (in drops)
// to accumulate at whatever rate is in force. A rate change only moves the
// moment that progress completes; it never re-draws the jitter. (Re-drawing on
// every change and taking the sooner drop biased the rate upwards: +40–57 %
// in the Phase 6 storm, and more when the cursor moves over rain.)

export const JITTER_MIN = 0.7;
export const JITTER_MAX = 1.3;

/** One drop's worth of progress: uniform in [0.7, 1.3], mean 1. */
export function drawJitter(random: () => number = Math.random): number {
  return JITTER_MIN + (JITTER_MAX - JITTER_MIN) * random();
}

/** Seconds until the next drop at a steady rate: jitter / rate. */
export function jitteredInterval(ratePerSec: number, random: () => number = Math.random): number {
  return drawJitter(random) / ratePerSec;
}

/** A rate change at `time` (drops per second; null = silent, progress pauses). */
export interface RateChange {
  time: number;
  rate: number | null;
}

/**
 * When `progress` drops' worth of time has passed after `start`, given the
 * rate in force at `start` and the later changes (in time order). Progress
 * pauses while the rate is null or 0. Returns null if it never completes (the
 * rate stays silent).
 */
export function whenProgressDone(
  start: number,
  progress: number,
  rateAtStart: number | null,
  changes: readonly RateChange[],
): number | null {
  let t = start;
  let rate = rateAtStart;
  let left = progress;
  for (const c of changes) {
    if (c.time <= t) {
      rate = c.rate;
      continue;
    }
    if (rate !== null && rate > 0) {
      const done = t + left / rate;
      if (done <= c.time) return done;
      left -= (c.time - t) * rate;
    }
    t = c.time;
    rate = c.rate;
  }
  return rate !== null && rate > 0 ? t + left / rate : null;
}
