import { describe, expect, test } from "bun:test";
import { createTimeline } from "./rate-timeline";

describe("rate timeline (rate in force at each drop's time)", () => {
  test("returns the value in force at a time", () => {
    const tl = createTimeline<number | null>(null);
    tl.set(1, 10);
    tl.set(2, 40);
    tl.set(3, null);
    expect(tl.at(0.5)).toBeNull(); // before any change: initial
    expect(tl.at(1)).toBe(10);
    expect(tl.at(1.99)).toBe(10);
    expect(tl.at(2.5)).toBe(40);
    expect(tl.at(10)).toBeNull();
  });

  test("a change replaces everything scheduled at or after it", () => {
    const tl = createTimeline<number | null>(null);
    tl.set(1, 10);
    tl.set(3, 20);
    tl.set(2, 5);
    expect(tl.at(3.5)).toBe(5);
  });

  test("nextAfter finds the next accepted change", () => {
    const tl = createTimeline<number | null>(null);
    tl.set(1, null);
    tl.set(2, null);
    tl.set(3, 12);
    expect(tl.nextAfter(1, (v) => v !== null)).toEqual({ time: 3, value: 12 });
    expect(tl.nextAfter(3, (v) => v !== null)).toBeNull();
  });

  test("prune keeps the value in force", () => {
    const tl = createTimeline<number | null>(null);
    tl.set(1, 10);
    tl.set(2, 20);
    tl.set(5, 30);
    tl.prune(3);
    expect(tl.at(3)).toBe(20);
    expect(tl.at(6)).toBe(30);
  });

  test("changesAfter lists later changes in order", () => {
    const tl = createTimeline<number | null>(null);
    tl.set(1, 10);
    tl.set(2, null);
    tl.set(3, 20);
    expect(tl.changesAfter(1).map((c) => c.time)).toEqual([2, 3]);
    expect(tl.changesAfter(3)).toEqual([]);
  });
});
