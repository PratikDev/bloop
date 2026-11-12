import { describe, expect, test } from "bun:test";
import { collapseRange, plainStatement } from "./official-text";

describe("official record wording", () => {
  test("a range from one date to itself is that date", () => {
    expect(collapseRange("19 Aug 2025 – 19 Aug 2025")).toBe("19 Aug 2025");
    expect(collapseRange("Aug 2025 to Aug 2025")).toBe("Aug 2025");
  });
  test("a real range stays as it is", () => {
    expect(collapseRange("1 Jul 2024 – 14 Sep 2024")).toBe("1 Jul 2024 – 14 Sep 2024");
    expect(collapseRange("2019")).toBe("2019");
  });
  test("the reanalysis comparison is said in words, with its number untouched", () => {
    expect(plainStatement("relative: sea salt; rank vs MERRA-2 ρ 0.41")).toBe("relative: sea salt; agreement with NASA MERRA-2: ρ 0.41");
  });
});
