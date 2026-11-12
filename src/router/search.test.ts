// The Then vs Now URL: a value the page can't show (an unknown or hidden part, mentor item 5) comes back as an explicit
// undefined, so the router's raw search can't put it back.
import { describe, expect, test } from "bun:test";
import { thenNowSearch } from "./search";

describe("thenNowSearch", () => {
  test("an unknown part is dropped explicitly", () => {
    const s = thenNowSearch({ part: "nonsense" });
    expect("part" in s).toBe(true);
    expect(s.part).toBeUndefined();
  });

  test("the records without sound are parts too", () => {
    for (const part of ["fires", "vegetation"] as const) expect(thenNowSearch({ part }).part).toBe(part);
  });

  test("allowed values pass", () => {
    expect(thenNowSearch({ part: "monsoon", city: "Sylhet", view: "compare" })).toMatchObject({ part: "monsoon", city: "Sylhet", view: "compare" });
  });
});
