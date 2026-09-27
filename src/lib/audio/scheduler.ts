// The one shared look-ahead scheduler (AUDIO_RESEARCH A2, "A tale of two
// clocks"). A 25 ms timer hands every event due in the next `lookahead`
// seconds to Web Audio, timed on the audio clock. All timed sound in the app
// goes through here — never setTimeout chains, React state or animation frames.

import { createScheduleQueue } from "./queue";

const TICK_MS = 25;
const DEFAULT_LOOKAHEAD_SEC = 0.1; // raise to 0.2 if phones stutter (test T6)

const queue = createScheduleQueue();
let lookaheadSec = DEFAULT_LOOKAHEAD_SEC;
let getTime: (() => number) | null = null;

function tick() {
  if (!getTime) return;
  for (const event of queue.advance(getTime(), lookaheadSec)) {
    try {
      event.run(event.time);
    } catch (err) {
      console.error(`scheduled audio event failed (${event.owner})`, err);
    }
  }
}

/** Started once by ensureAudio(); runs for the life of the page. */
export function startScheduler(clock: () => number) {
  if (getTime) return;
  getTime = clock;
  setInterval(tick, TICK_MS);
}

/** Run `run(time)` just before `time` (audio clock), so it can schedule sound exactly at `time`. */
export function schedule(time: number, owner: string, run: (time: number) => void) {
  queue.add({ time, owner, run });
}

export function cancel(owner: string) {
  queue.clear(owner);
}

export function cancelAll() {
  queue.clear();
}

export function setLookahead(sec: number) {
  lookaheadSec = Math.min(2, Math.max(0.05, sec));
}

export function getLookahead(): number {
  return lookaheadSec;
}
