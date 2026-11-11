// The Then vs Now URL: a value the page can't show (an unknown or hidden part) comes back as an explicit
// undefined, so the router's raw search can't put it back.
import { describe, expect, test } from "bun:test";
import { thenNowSearch } from "./search";

describe("thenNowSearch", () => {
  test("a hidden or unknown part is dropped explicitly", () => {
    for (const part of ["fires", "vegetation", "nonsense"]) {
      const s = thenNowSearch({ part });
      expect("part" in s).toBe(true);
      expect(s.part).toBeUndefined();
    }
  });

  test("allowed values pass", () => {
    expect(thenNowSearch({ part: "monsoon", city: "Sylhet", view: "compare" })).toMatchObject({ part: "monsoon", city: "Sylhet", view: "compare" });
  });
});
