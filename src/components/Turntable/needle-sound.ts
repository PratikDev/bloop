// What the needle plays: at a fixed control rate, the reading under the needle
// goes to the existing voices (playReading → audio.setOcean / setRain), which
// re-synthesise from the value with mapping.json's rules. Nothing here knows
// the rotation speed, so pitch and drop rate depend on the value alone.
// Land and no data reach the voices as null: honest silence.
// TODO(turntable: proof in unison): play the frame's tone beside a tone from the
// NASA source file's value at the same point (needs that value from L1).

import type { LatLon, LiveFields } from "@/lib/data";
import { readAt, type Reading } from "@/lib/reading";
import { playReading } from "../Commands/use-sound-sync";

export const CONTROL_HZ = 30;
const CONTROL_MS = 1000 / CONTROL_HZ;

/** One update sent to the voices (for the debug log). */
export interface SentReading {
  time: number; // performance.now()
  at: LatLon;
  reading: Reading;
}

export interface NeedleSound {
  /** Sends the reading at `at` if a control tick is due and it changed (value, phase or whole-degree pan). */
  tick(fields: LiveFields, at: LatLon, now: number): void;
  /** Forget the last update, so the next tick sends even an unchanged reading. */
  reset(): void;
}

export function createNeedleSound(onSend?: (sent: SentReading) => void): NeedleSound {
  let lastKey: string | null = null;
  let lastTick = Number.NEGATIVE_INFINITY;
  return {
    tick(fields, at, now) {
      if (now - lastTick < CONTROL_MS) return;
      lastTick = now;
      const reading = readAt(fields, at);
      // An unchanged reading isn't re-sent: each set() restarts the drop timing.
      const key = `${reading.ocean.valueC}|${reading.rain.mmPerHour}|${reading.rain.phase}|${Math.round(at.lon)}`;
      if (key === lastKey) return;
      lastKey = key;
      playReading(reading, at.lon);
      onSend?.({ time: now, at: { ...at }, reading });
    },
    reset() {
      lastKey = null;
      lastTick = Number.NEGATIVE_INFINITY;
    },
  };
}
