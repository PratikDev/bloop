// A live frame's own scale: its value_range, with ticks at mapping.json's legend values. The Turntable's legend and
// Listen's bubble tubes both read it, so they can't disagree.

import type { RecordFrame } from "@/components/Turntable/records";
import { normalise, voiceSpec } from "@/lib/audio/mapping";

export interface FrameScale {
  title: "turntable.legend.ocean" | "turntable.legend.rain";
  min: number;
  max: number;
  log: boolean;
  unit: "unit.celsius" | "unit.mmPerHour";
  ticks: number[];
  /** The value under the needle; null when there is none (rain: dry counts as none). */
  value: number | null;
  fill: "bg-bubble" | "bg-dial";
}

export function frameScale(frame: RecordFrame, value: number | null): FrameScale {
  const [min, max] = frame.meta.value_range;
  const voice = frame.product === "ocean" ? "ocean" : "rain";
  const ticks = voiceSpec(voice).legend.map((p) => p.value).filter((v) => v >= min && v <= max);
  return frame.product === "ocean"
    ? { title: "turntable.legend.ocean", min, max, log: false, unit: "unit.celsius", ticks, value, fill: "bg-bubble" }
    : { title: "turntable.legend.rain", min, max, log: true, unit: "unit.mmPerHour", ticks, value: value && value > 0 ? value : null, fill: "bg-dial" };
}

/** Where a value sits on the scale, 0 to 1. */
export const scaleShare = (s: FrameScale, v: number): number => normalise(v, { min: s.min, max: s.max, scale: s.log ? "log" : "linear" }) ?? 0;
