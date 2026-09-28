import { inverseContinuous, normalise, scaleOutput, voiceSpec } from "@/lib/audio/mapping";
import type { ContinuousMapping } from "@/types/data-contract";

export const formatLon = (lon: number) => `${Math.abs(lon).toFixed(0)}° ${lon < 0 ? "W" : lon > 0 ? "E" : ""}`.trim();

const rainRule = () => voiceSpec("rain").mapping as ContinuousMapping;

/** The rain slider moves along the rule's log scale: position 0..1 ↔ mm/h (0.1..50). */
export function rainFromPosition(position: number): number {
  const { min, max } = rainRule().input;
  return scaleOutput(position, { min, max, scale: "exponential" });
}

export function positionFromRain(mmPerHour: number): number {
  return normalise(mmPerHour, rainRule().input) ?? 0;
}

/** mm/h that gives exactly this many drops per second (harness presets, T6). */
export function rainForDropsPerSecond(dropsPerSec: number): number {
  return inverseContinuous(dropsPerSec, rainRule());
}
