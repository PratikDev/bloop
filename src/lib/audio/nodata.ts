// PURE: when to announce "no data". Live exploration and the sweep both tick
// only on the transition INTO a no-data area (not on every value), and never
// more than once per `minGapSec`.

export type NoDataTrack = "ocean" | "rain";

export interface NoDataTracker {
  /**
   * Reports the latest value's no-data state at `now` (seconds). `entering`:
   * this value moves into no data; `tick`: also far enough from the last tick
   * to play one.
   */
  update(track: NoDataTrack, noData: boolean, now: number): { entering: boolean; tick: boolean };
  /** Forget the position (after silence or a stop): the next no-data value counts as entering. */
  reset(): void;
}

export function createNoDataTracker(minGapSec: number): NoDataTracker {
  // null = unknown (nothing played yet, or reset)
  const inNoData: Record<NoDataTrack, boolean | null> = { ocean: null, rain: null };
  let lastTick = -Infinity;

  return {
    update(track, noData, now) {
      const entering = noData && inNoData[track] !== true;
      inNoData[track] = noData;
      const tick = entering && now - lastTick >= minGapSec;
      if (tick) lastTick = now;
      return { entering, tick };
    },
    reset() {
      inNoData.ocean = null;
      inNoData.rain = null;
    },
  };
}
