// Mentor item 10: the wording follows stats.json (a change is stated only when the file says it is clear), the numbers
// shown are the file's, and the short form passes the braille text rules.
import { describe, expect, test } from "bun:test";
import { STATUS_BUDGET, violations } from "@/a11y/brailleText";
import { bindT, formatSigned } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import type { ClimateCellName } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";
import { longLine, partStats, shortLine, statTexts, type StatPart } from "./then-now-stats";

const stats = readData<ThenNowStatsFile>("thenvsnow/stats.json");
const en = bindT("en");
const CITIES = Object.keys(stats.cities) as ClimateCellName[];
const PARTS: StatPart[] = ["heat", "monsoon", "water"];
const cases = CITIES.flatMap((c) => PARTS.map((p): [ClimateCellName, StatPart] => [c, p]));

/** The same file with every result flipped: the wording must flip with it. */
function flipped(): ThenNowStatsFile {
  const s = structuredClone(stats);
  for (const c of Object.values(s.cities)) {
    c.heat.clear = !c.heat.clear;
    c.rain.gpcp.clear = !c.rain.gpcp.clear;
    c.rain.gpcc.clear = !c.rain.gpcc.clear;
  }
  s.water.Bangladesh.trend.clear = !s.water.Bangladesh.trend.clear;
  return s;
}

describe("Then vs Now statistics wording", () => {
  test.each(cases)("%s %s: the result line matches the file's outcome", (city, part) => {
    for (const file of [stats, flipped()]) {
      const ps = partStats(file, city, part);
      const line = longLine(en, "en", ps);
      if (ps.verdict === "clear") expect(line).toEndWith("A clear change: larger than year-to-year variation.");
      if (ps.verdict === "unclear") {
        expect(line).toStartWith(part === "monsoon" ? "No wetter in these records:" : "No clear change in these records:");
        expect(line).toEndWith("Not a clear change: year-to-year variation is larger.");
      }
      expect(line).toContain("95% CI");
    }
  });

  test.each(cases)("%s %s: every number shown is the file's", (city, part) => {
    const ps = partStats(stats, city, part);
    const line = longLine(en, "en", ps);
    for (const i of ps.items) {
      expect(line).toContain(formatSigned(i.value, "en", i.decimals));
      expect(line).toContain(formatSigned(i.ci[0], "en", i.ciDecimals));
      expect(line).toContain(formatSigned(i.ci[1], "en", i.ciDecimals));
    }
  });

  test("the shipped result keeps Pratik's wording for rain, and states the heat change with its range", () => {
    for (const city of CITIES) {
      const rain = partStats(stats, city, "monsoon");
      if (rain.verdict === "unclear") expect(longLine(en, "en", rain)).toStartWith("No wetter in these records:");
      const heat = stats.cities[city].heat;
      expect(heat.clear).toBe(heat.p_welch < 0.05 && heat.p_mann_whitney < 0.05 && (heat.diff_ci[0] > 0 || heat.diff_ci[1] < 0));
    }
  });

  test.each(cases)("%s %s: the short form is braille-ready (EN fits 40 cells; BN has no banned glyph)", (city, part) => {
    const s = statTexts(stats, city, part);
    expect(violations(s.shortEn, STATUS_BUDGET)).toEqual([]);
    expect(violations(s.shortBn)).toEqual([]);
    expect(s.shortBn).not.toMatch(/[০-৯]/u); // Western digits on a braille display (BRAILLE.md)
    expect(shortLine(en, "en", partStats(stats, city, part))).toBe(s.shortEn);
  });

  test("Bangla long line is Bangla, with the same verdict", () => {
    const s = statTexts(stats, "Dhaka", "monsoon");
    expect(s.bn).toContain("বেশি ভেজা নয়");
    expect(s.bn).not.toContain("No wetter");
  });
});
