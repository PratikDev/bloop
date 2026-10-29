import { describe, expect, test } from "bun:test";
import { radialSweep, sweepPitch, type SweepRule } from "./radial-sweep";

const rule: SweepRule = {
  centre: { x: 0, y: 0 },
  degPerSec: 90,
  startDeg: 0,
  maxRadius: 10,
  radiusTo: "pitch",
  pitch: { minHz: 220, maxHz: 880, scale: "exponential" },
};

describe("radial sweep", () => {
  test("a point is heard when the line reaches its angle", () => {
    const ev = radialSweep([{ x: 0, y: 5 }, { x: 5, y: 0 }, { x: -5, y: 0 }], rule);
    expect(ev.map((e) => e.index)).toEqual([1, 0, 2]);
    expect(ev.map((e) => e.timeSec)).toEqual([0, 1, 2]);
  });

  test("turning the other way reverses the order and wraps past the start", () => {
    const ev = radialSweep([{ x: 0, y: 5 }, { x: 0, y: -5 }], { ...rule, degPerSec: -90 });
    expect(ev.map((e) => [e.index, e.timeSec])).toEqual([[1, 1], [0, 3]]);
  });

  test("radius sets pitch: centre = lowest, the edge = highest, exponential in between", () => {
    const [mid] = radialSweep([{ x: 5, y: 0 }], rule);
    expect(mid.radiusFrac).toBeCloseTo(0.5);
    expect(mid.frequencyHz).toBeCloseTo(440);
    expect(sweepPitch(0, rule.pitch)).toBe(220);
    expect(sweepPitch(2, rule.pitch)).toBe(880);
    expect(sweepPitch(0.5, { ...rule.pitch, scale: "linear" })).toBe(550);
  });

  test("the ring rule turns radius into time and has no pitch", () => {
    const ev = radialSweep([{ x: 8, y: 0 }, { x: 0, y: 2 }], { ...rule, radiusTo: "time", durationSec: 10 });
    expect(ev.map((e) => [e.index, e.timeSec, e.frequencyHz])).toEqual([[1, 2, null], [0, 8, null]]);
  });

  test("a rule that cannot play is refused", () => {
    expect(() => radialSweep([], { ...rule, degPerSec: 0 })).toThrow();
    expect(() => radialSweep([], { ...rule, radiusTo: "time" })).toThrow();
  });
});
