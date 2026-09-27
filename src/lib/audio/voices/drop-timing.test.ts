import { describe, expect, test } from "bun:test";
import { JITTER_MAX, JITTER_MIN, drawJitter, jitteredInterval, whenProgressDone } from "./drop-timing";

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
    expect(drawJitter(() => 0)).toBeCloseTo(0.7, 12);
    expect(drawJitter(() => 0.5)).toBeCloseTo(1, 12);
    expect(jitteredInterval(10, () => 1)).toBeCloseTo(0.13, 12);
  });
});

describe("whenProgressDone (rate changes move the next drop, never re-draw it)", () => {
  test("steady rate: start + progress / rate", () => {
    expect(whenProgressDone(1, 1, 10, [])).toBeCloseTo(1.1, 12);
  });

  test("a change mid-interval uses the new rate for the rest", () => {
    // 10/s for 0.05 s = 0.5 progress, the remaining 0.5 at 40/s = 0.0125 s
    expect(whenProgressDone(0, 1, 10, [{ time: 0.05, rate: 40 }])).toBeCloseTo(0.0625, 12);
  });

  test("silence pauses progress; it resumes when the rate returns", () => {
    const changes = [
      { time: 0.05, rate: null },
      { time: 2, rate: 10 },
    ];
    expect(whenProgressDone(0, 1, 10, changes)).toBeCloseTo(2.05, 12);
    expect(whenProgressDone(0, 1, 10, [{ time: 0.05, rate: null }])).toBeNull();
  });

  test("setting the same rate again changes nothing (no re-draw, no bias)", () => {
    const once = whenProgressDone(0, 0.9, 10, []);
    const repeated = whenProgressDone(0, 0.9, 10, Array.from({ length: 50 }, (_, i) => ({ time: i * 0.001, rate: 10 })));
    expect(repeated).toBeCloseTo(once!, 12);
  });

  test("changes before start only set the rate in force", () => {
    expect(whenProgressDone(1, 1, null, [{ time: 0.5, rate: 20 }])).toBeCloseTo(1.05, 12);
  });

  test("over a changing rate, drop count matches the integral of the rate (honest average)", () => {
    // rate ramps 2 → 40 over 10 s in 0.25 s frames; expected drops = ∫ rate dt
    const frames = Array.from({ length: 40 }, (_, i) => ({ time: i * 0.25, rate: 2 + (38 * i) / 39 }));
    const expected = frames.reduce((s, f) => s + f.rate * 0.25, 0);
    const rand = seeded(7);
    let drops = 0;
    let t = 0;
    for (;;) {
      const next = whenProgressDone(t, drawJitter(rand), frames.filter((f) => f.time <= t).at(-1)?.rate ?? null, frames.filter((f) => f.time > t));
      if (next === null || next >= 10) break;
      drops++;
      t = next;
    }
    expect(Math.abs(drops - expected) / expected).toBeLessThan(0.05);
  });
});
