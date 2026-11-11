// B1: the value groups. Unimodal → 1 group; bimodal → 2 with their shares; two peaks closer than σ merge; an empty
// box or an unknown error → none; a tiny bump (under 5 % of the cells) is not a group.
import { describe, expect, test } from "bun:test";
import { findModes } from "./modes";

/** n values spread evenly (a deterministic stand-in for a normal sample) around `at`, ±`width`. */
const cluster = (at: number, width: number, n: number) => Array.from({ length: n }, (_, i) => at - width + (2 * width * (i + 0.5)) / n);
const asc = (...xs: number[][]) => xs.flat().sort((a, b) => a - b);

describe("findModes", () => {
  test("one cluster: one group holding every cell", () => {
    const m = findModes(asc(cluster(28.4, 0.3, 500)), 0.31);
    expect(m.length).toBe(1);
    expect(m[0].fraction).toBe(1);
    expect(m[0].value).toBeCloseTo(28.4, 1);
  });

  test("two clusters: two groups, low to high, with their shares", () => {
    const v = asc(cluster(18.9, 0.3, 400), cluster(20.4, 0.3, 600));
    const m = findModes(v, 0.31);
    expect(m.map((g) => Math.round(g.value * 10) / 10)).toEqual([18.9, 20.4]);
    expect(m[0].fraction).toBeCloseTo(0.4, 2);
    expect(m[1].fraction).toBeCloseTo(0.6, 2);
    expect(m[0].to).toBe(m[1].from);
    expect(v.slice(m[0].from, m[0].to).every((x) => x < 19.7)).toBe(true);
  });

  test("two peaks closer than σ merge", () => {
    expect(findModes(asc(cluster(20, 0.05, 300), cluster(20.25, 0.05, 300)), 0.31).length).toBe(1);
  });

  test("at most two groups", () => {
    expect(findModes(asc(cluster(10, 0.2, 300), cluster(15, 0.2, 300), cluster(20, 0.2, 300)), 0.31).length).toBe(2);
  });

  test("a bump with under 5 % of the cells is not a group", () => {
    const m = findModes(asc(cluster(20, 0.3, 980), cluster(25, 0.05, 20)), 0.31);
    expect(m.length).toBe(1);
    expect(m[0].fraction).toBe(1);
  });

  test("empty box or unknown error: none", () => {
    expect(findModes([], 0.31)).toEqual([]);
    expect(findModes([1, 2, 3], Number.NaN)).toEqual([]);
    expect(findModes([1, 2, 3], 0)).toEqual([]);
  });
});
