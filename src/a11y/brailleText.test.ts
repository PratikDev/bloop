import { describe, expect, test } from "bun:test";
import { abbrev, braillePlace, brailleNumber, brailleTime, brailleUnit, clean, decimalsFor, frontLoad, latinDigits, violations } from "./brailleText";
import { parseRecordCode } from "./recordCode";

describe("clean", () => {
  test("replaces glyphs a table may lack and removes decoration", () => {
    expect(clean("≈ 12 ± 3 – done…")).toBe("about 12 +/- 3 - done");
    expect(clean("Rain 🌧️ 12 mm/h → Dhaka!!")).toBe("Rain 12 mm/h Dhaka!");
    expect(clean("a b c")).toBe("a b c");
    expect(violations(clean("−4.2 °C ★ ≥ 3"))).toEqual([]);
  });

  test("violations name each broken rule", () => {
    expect(violations("Rain 🌧")).toContain("emoji or pictograph");
    expect(violations("12 ± 3")).toContain("glyph a table may lack");
    expect(violations("done...")).toContain("repeated punctuation");
    expect(violations("x".repeat(41), 40)).toContain("longer than 40");
    expect(violations("Rain 12.4 mm/h 21.5N 89.8E", 40)).toEqual([]);
  });
});

describe("numbers and units", () => {
  test("precision from the quantisation step", () => {
    expect([0.1, 0.005, 2, 0.0055].map(decimalsFor)).toEqual([1, 3, 0, 3]);
    expect(brailleNumber(-4.25, 1)).toBe("-4.3");
    expect(brailleNumber(-0.01, 1)).toBe("0.0");
    expect(brailleNumber(12345.6, 0)).toBe("12346");
  });

  test("degree style, place and time", () => {
    expect(brailleUnit("°C", "word")).toBe("deg C");
    expect(brailleUnit("°C", "symbol")).toBe("°C");
    expect(braillePlace(21.5, 89.8)).toBe("21.5N 89.8E");
    expect(braillePlace(-3.25, -40)).toBe("3.3S 40.0W");
    expect(brailleTime("2026-11-02T14:30:00Z", false)).toBe("14:30");
    expect(brailleTime("2014-08-04T00:00:00Z", true)).toBe("4 Aug 00:00");
  });

  test("front-loaded and abbreviated", () => {
    expect(frontLoad(["relative", "Rain", "12.4 mm/h", null, "", "obs"])).toBe("relative Rain 12.4 mm/h obs");
    expect(abbrev("observation")).toBe("obs");
    expect(abbrev("values with stated error")).toBe("stated err");
    expect(abbrev("something else")).toBe("something else");
  });
});

describe("record codes and digits", () => {
  test("B7 in every form a braille keyboard may send", () => {
    for (const s of ["B7", "b7", "b 7", " B-7 ", "B৭", "b ০৭"]) expect(parseRecordCode(s)?.code).toBe("B7");
    expect(parseRecordCode("7")).toBeNull();
    expect(parseRecordCode("BB7")).toBeNull();
    expect(latinDigits("১২.৪")).toBe("12.4");
  });
});
