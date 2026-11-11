// PURE: value groups → chord tones. Each tone sits at the record's own value → pitch (mapVoice, the melody's rule:
// the chord never computes pitch another way), with gain ∝ the group's share; at most 2 tones. Hysteresis: the chord
// changes only when a group appears or disappears, or one moves by more than σ.
import { mapVoice } from "../../mapping-maths";
import type { ChordTone } from "../types";
import type { ValueMode } from "./modes";

export function chordTones(modes: readonly ValueMode[], voice: string, peak: number): ChordTone[] {
  return modes.slice(0, 2).flatMap((m) => {
    const hz = mapVoice(voice, m.value);
    return hz === null ? [] : [{ value: m.value, hz, fraction: m.fraction, gain: peak * m.fraction }];
  });
}

/** Whether `next` differs enough from `prev` to change what sounds. */
export function chordChanged(prev: readonly ChordTone[], next: readonly ChordTone[], sigma: number): boolean {
  if (prev.length !== next.length) return true;
  return next.some((t, i) => Math.abs(t.value - prev[i].value) > sigma);
}
