import { describe, expect, test } from "bun:test";
import { titleFocus, type FocusSnapshot } from "./focus-title";

const at = (s: Partial<FocusSnapshot>): FocusSnapshot => ({ lost: false, unmoved: true, inHeader: false, heading: true, ...s });

describe("titleFocus (focus after a page change, mentor item 4)", () => {
  test("the header link that moved the page hands focus to the new heading", () => {
    expect(titleFocus(at({ inHeader: true }))).toBe("focus");
    expect(titleFocus(at({ inHeader: true, heading: false }))).toBe("wait");
  });

  test("focus lost with the old page goes to the heading once it exists", () => {
    expect(titleFocus(at({ lost: true, unmoved: false }))).toBe("focus");
    expect(titleFocus(at({ lost: true, unmoved: false, heading: false }))).toBe("wait");
  });

  test("an overlay or the page still holding focus is waited on, never taken from", () => {
    expect(titleFocus(at({}))).toBe("wait");
  });

  test("a header link focused after the move keeps focus (the flaky Turntable link)", () => {
    expect(titleFocus(at({ unmoved: false, inHeader: true }))).toBe("stop");
    expect(titleFocus(at({ unmoved: false, inHeader: true, heading: false }))).toBe("stop");
  });

  test("focus a page or overlay placed elsewhere stays there", () => {
    expect(titleFocus(at({ unmoved: false }))).toBe("stop");
  });
});
