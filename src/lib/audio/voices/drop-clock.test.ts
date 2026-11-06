import { describe, expect, test } from "bun:test";
import { createDropClock } from "./drop-clock";

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

const TICK = 0.025;
const LOOKAHEAD = 0.1;

/**
 * Replays the browser: a 25 ms scheduler tick; frame changes set 100 ms before
 * their time (sequences); due drops handed over up to 100 ms early. Returns the
 * number of drops that sound before `end`.
 */
function replay(frames: { time: number; rate: number | null }[], end: number, seed = 1) {
  const clock = createDropClock<number | null>(null, (r) => r, seeded(seed));
  let drops = 0;
  let next = 0;
  for (let now = 0; now < end; now += TICK) {
    while (next < frames.length && frames[next].time < now + LOOKAHEAD) {
      clock.set(frames[next].time, frames[next].rate, now);
      next++;
    }
    while (clock.pending !== null && clock.pending < now + LOOKAHEAD && clock.pending < end) {
      if (clock.fall(clock.pending).value !== null) drops++;
    }
  }
  return drops;
}

const integral = (frames: { time: number; rate: number | null }[], end: number) =>
  frames.reduce((s, f, i) => s + (f.rate ?? 0) * ((frames[i + 1]?.time ?? end) - f.time), 0);

describe("drop clock (browser-like scheduling)", () => {
  test("steady rate: the count matches the rule", () => {
    const frames = [{ time: 0, rate: 10 }];
    const drops = replay(frames, 30);
    expect(Math.abs(drops - 300) / 300).toBeLessThan(0.05);
  });

  test("a storm ramp at 2 and 4 fps: the count matches the integral of the rate (no bunching)", () => {
    for (const fps of [2, 4]) {
      const step = 1 / fps;
      const frames = Array.from({ length: 48 }, (_, i) => {
        const t = 1 - Math.abs(i - 23.5) / 23.5;
        const dry = t < 0.08 || i === 10 || i === 37;
        const mm = 0.1 * Math.pow(400, t);
        return { time: i * step, rate: dry ? null : 2 + (38 * Math.log(mm / 0.1)) / Math.log(500) };
      });
      const end = 48 * step;
      let drops = 0;
      const runs = 20;
      for (let s = 0; s < runs; s++) drops += replay(frames, end, s + 1);
      const mean = drops / runs;
      const expected = integral(frames, end);
      expect(Math.abs(mean - expected) / expected).toBeLessThan(0.05);
    }
  });

  test("setting the same rate at 60 Hz (a moving cursor) doesn't raise the rate", () => {
    const frames = Array.from({ length: 60 * 20 }, (_, i) => ({ time: i / 60, rate: 10 }));
    const drops = replay(frames, 20);
    expect(Math.abs(drops - 200) / 200).toBeLessThan(0.05);
  });

  test("silence stops the drops; rain resumes them", () => {
    const frames = [
      { time: 0, rate: 10 },
      { time: 5, rate: null },
      { time: 10, rate: 10 },
    ];
    const drops = replay(frames, 15);
    expect(Math.abs(drops - 100) / 100).toBeLessThan(0.06);
  });
});
