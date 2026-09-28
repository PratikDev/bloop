// PURE: the timing brain of a drop voice (no Web Audio). It keeps the
// timeline of states (rate, loudness, position) and the running interval, and
// says when the next drop is due. drops.ts turns its answers into sounds;
// tests replay the browser's scheduling against it.

import { drawJitter, whenProgressDone } from "./drop-timing";
import { createTimeline } from "./rate-timeline";

export interface DropClock<T> {
  /** State from `time` on (later changes are replaced). Returns the new pending drop time. */
  set(time: number, value: T, now: number): number | null;
  /** A drop was due at `time`: the state in force (null = silent, no sound) and the new pending time. */
  fall(time: number): { value: T | null; pending: number | null };
  /** When the next drop is due (null = none). */
  readonly pending: number | null;
  reset(): void;
}

const START_DELAY_SEC = 0.02;

/** `rateOf` reads drops per second from a state (null or 0 = silent). */
export function createDropClock<T>(silent: T, rateOf: (v: T) => number | null, random: () => number = Math.random): DropClock<T> {
  const timeline = createTimeline<T>(silent);
  let pending: number | null = null;
  // The running interval: when the last drop fell and how much progress the next one needs.
  let chain: { from: number; progress: number } | null = null;

  const nextFromChain = () => {
    if (!chain) return null;
    const changes = timeline.changesAfter(chain.from).map((c) => ({ time: c.time, rate: rateOf(c.value) }));
    return whenProgressDone(chain.from, chain.progress, rateOf(timeline.at(chain.from)), changes);
  };

  return {
    get pending() {
      return pending;
    },
    set(time, value, now) {
      const rate = rateOf(value);
      // Silence repeated with nothing scheduled after it changes nothing (keeps the timeline small).
      const redundant = rate === null && rateOf(timeline.at(time)) === null && timeline.changesAfter(time).length === 0;
      if (!redundant) timeline.set(time, value);
      const earliest = now + START_DELAY_SEC;
      if (!chain) {
        // Nothing falling yet: the first drop comes as soon as it rains.
        if (rate !== null && pending === null) pending = Math.max(time, earliest);
        return pending;
      }
      // Falling: the same interval, re-timed for the new rate (no re-draw, no bunching).
      const next = nextFromChain();
      pending = next === null ? null : Math.max(next, earliest);
      return pending;
    },
    fall(time) {
      pending = null;
      const value = timeline.at(time);
      timeline.prune(time);
      if (rateOf(value) === null) {
        chain = null;
        pending = timeline.nextAfter(time, (v) => rateOf(v) !== null)?.time ?? null;
        return { value: null, pending };
      }
      chain = { from: time, progress: drawJitter(random) };
      pending = nextFromChain();
      return { value, pending };
    },
    reset() {
      timeline.clear();
      pending = null;
      chain = null;
    },
  };
}
