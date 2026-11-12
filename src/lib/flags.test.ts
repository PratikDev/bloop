import { describe, expect, test } from "bun:test";
import { flag } from "./flags";

describe("feature flags", () => {
  test("the variable decides when set: 1 on, 0 off, whatever the build", () => {
    for (const ready of [true, false]) for (const preview of [true, false]) {
      expect(flag("1", ready, preview)).toBe(true);
      expect(flag("0", ready, preview)).toBe(false);
    }
  });

  test("unset: on in development and preview, in production only once ready", () => {
    expect(flag(undefined, false, true)).toBe(true);
    expect(flag(undefined, false, false)).toBe(false);
    expect(flag(undefined, true, false)).toBe(true);
  });
});
