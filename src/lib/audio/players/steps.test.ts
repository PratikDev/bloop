import { describe, expect, test } from "bun:test";
import { evenSteps } from "./steps";

describe("evenSteps", () => {
  test("n steps stepSec apart from an offset", () => {
    expect(evenSteps(4, 0.08)).toEqual([0, 0.08, 0.16, 0.24]);
    expect(evenSteps(3, 0.4, 1)).toEqual([1, 1.4, 1.8]);
    expect(evenSteps(0, 1)).toEqual([]);
  });
});
