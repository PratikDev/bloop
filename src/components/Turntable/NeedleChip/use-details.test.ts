import { describe, expect, test } from "bun:test";
import { chipClick } from "./use-details";

describe("chipClick (the needle chip's first click, mentor item 4)", () => {
  test("a closed card opens", () => {
    expect(chipClick(false, false)).toBe("open");
  });

  test("a card hover, focus or a tap's pointer opened a moment before stays open on that click", () => {
    expect(chipClick(true, true)).toBe("open");
  });

  test("a card the listener opened with a click closes on the next one", () => {
    expect(chipClick(true, false)).toBe("close");
  });
});
