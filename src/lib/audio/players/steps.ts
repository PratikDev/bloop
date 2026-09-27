// PURE: step timing for sequences.

/** Start offsets (seconds) of `n` evenly spaced steps, `stepSec` apart, beginning at `from`. */
export function evenSteps(n: number, stepSec: number, from = 0): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => from + i * stepSec);
}

/**
 * Builds a list of steps of varying length back to back (data steps, silent
 * gaps). `T` is whatever a step carries; `at` is its start in seconds.
 */
export function createStepList<T>() {
  const steps: (T & { at: number })[] = [];
  let end = 0;
  return {
    /** Appends a step lasting `durationSec`. */
    add(durationSec: number, step: T) {
      steps.push({ ...step, at: end });
      end += durationSec;
    },
    /** Appends silence. */
    gap(durationSec: number) {
      end += durationSec;
    },
    get steps() {
      return steps;
    },
    /** Total length so far (seconds). */
    get end() {
      return end;
    },
  };
}
