import { describe, expect, test } from "bun:test";
import { createStepList, evenSteps } from "./steps";

describe("evenSteps", () => {
  test("n steps stepSec apart from an offset", () => {
    expect(evenSteps(4, 0.08)).toEqual([0, 0.08, 0.16, 0.24]);
    expect(evenSteps(3, 0.4, 1)).toEqual([1, 1.4, 1.8]);
    expect(evenSteps(0, 1)).toEqual([]);
  });
});

describe("createStepList", () => {
  test("steps and gaps back to back", () => {
    const list = createStepList<{ name: string }>();
    list.add(0.4, { name: "a" });
    list.add(0.4, { name: "b" });
    list.gap(0.8);
    list.add(0.4, { name: "c" });
    expect(list.steps.map((s) => [s.name, Number(s.at.toFixed(2))])).toEqual([
      ["a", 0],
      ["b", 0.4],
      ["c", 1.6],
    ]);
    expect(list.end).toBeCloseTo(2, 12);
  });
});
