// PURE: step timing for sequences.

/** Start offsets (seconds) of `n` evenly spaced steps, `stepSec` apart, beginning at `from`. */
export function evenSteps(n: number, stepSec: number, from = 0): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => from + i * stepSec);
}
