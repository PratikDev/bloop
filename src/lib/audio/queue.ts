// PURE: the time-ordered event queue behind the look-ahead scheduler
// (AUDIO_RESEARCH A2). No Web Audio here, so it is unit-tested with bun.

export interface ScheduledEvent {
  time: number; // seconds on the audio clock
  owner: string; // the player that scheduled it, for cancelling
  run: (time: number) => void;
}

export interface ScheduleQueue {
  add(event: ScheduledEvent): void;
  /**
   * Removes and returns, in time order, every event due before
   * currentTime + lookaheadSec. Events already in the past are returned too
   * (never lost), so the caller can still play them as soon as possible.
   */
  advance(currentTime: number, lookaheadSec: number): ScheduledEvent[];
  /** Removes all events of one owner, or all events when owner is omitted. */
  clear(owner?: string): void;
  size(): number;
}

export function createScheduleQueue(): ScheduleQueue {
  const events: ScheduledEvent[] = [];

  // Index of the first event strictly later than `time`, so equal times keep insertion order.
  const insertAt = (time: number) => {
    let lo = 0;
    let hi = events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (events[mid].time <= time) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  return {
    add(event) {
      events.splice(insertAt(event.time), 0, event);
    },
    advance(currentTime, lookaheadSec) {
      const horizon = currentTime + lookaheadSec;
      let n = 0;
      while (n < events.length && events[n].time < horizon) n++;
      return events.splice(0, n);
    },
    clear(owner) {
      if (owner === undefined) {
        events.length = 0;
        return;
      }
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].owner === owner) events.splice(i, 1);
      }
    },
    size() {
      return events.length;
    },
  };
}
