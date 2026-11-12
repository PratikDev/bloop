import { describe, expect, test } from "bun:test";
import { cornerFree, cornerGap } from "./corner";

describe("cornerFree", () => {
  test("a tall stage (Then vs Now on a desktop): the corner under the disc is free", () => {
    expect(cornerFree(208, 273)).toBe(true);
  });

  test("the 224 px square phone stage (218 px inside its border): the corner holds the key clear of the disc", () => {
    expect(cornerGap(218, 218)).toBeGreaterThanOrEqual(6);
    expect(cornerFree(218, 218)).toBe(true);
  });

  test("a smaller square: too tight, so the key takes a row under the globe", () => {
    expect(cornerFree(180, 180)).toBe(false);
  });

  test("a wide stage (the time-lapse): the corner beside the disc is free", () => {
    expect(cornerFree(800, 400)).toBe(true);
  });
});
