import { describe, expect, test } from "bun:test";
import { JITTER_MAX, JITTER_MIN, jitteredInterval, nextDropTime } from "./drop-timing";

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32). */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("drop timing", () => {
  test("each interval stays within ±30 % of 1 / rate", () => {
    const rand = seeded(1);
    for (const rate of [2, 5, 10, 20, 40]) {
      for (let i = 0; i < 1000; i++) {
        const dt = jitteredInterval(rate, rand);
        expect(dt).toBeGreaterThanOrEqual(JITTER_MIN / rate);
        expect(dt).toBeLessThanOrEqual(JITTER_MAX / rate);
      }
    }
  });

  test("the average rate equals the mapping rule (honest average)", () => {
    const rand = seeded(42);
    for (const rate of [2, 10, 40]) {
      let t = 0;
      const n = 20000;
      for (let i = 0; i < n; i++) t += jitteredInterval(rate, rand);
      expect(Math.abs(n / t - rate) / rate).toBeLessThan(0.01); // within 1 % (sampling noise only)
    }
  });

  test("jitter endpoints", () => {
    expect(jitteredInterval(10, () => 0)).toBeCloseTo(0.07, 12);
    expect(jitteredInterval(10, () => 0.5)).toBeCloseTo(0.1, 12);
    expect(jitteredInterval(10, () => 1)).toBeCloseTo(0.13, 12);
  });

  test("after a rate change the next drop is one new interval after the last drop, never in the past", () => {
    // last drop at 1.0 s, new rate 40/s → next at 1.025 s (mean jitter)
    expect(nextDropTime(1.0, 40, 1.01, () => 0.5)).toBeCloseTo(1.025, 12);
    // long ago → play now, no burst of missed drops
    expect(nextDropTime(0.2, 40, 5.0, () => 0.5)).toBe(5.0);
  });
});
