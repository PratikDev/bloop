// Then vs Now in the Braille Data Explorer. The series is the file's (every year of both windows, the
// gap blank; GRACE's months with their missing months blank); R's note is stats.json's statistic and 95% interval
// exactly, within the braille text rules and safe for the Bengali table; the lines name the city, not coordinates.
import { describe, expect, test } from "bun:test";
import { bnCompose, bnTableSafe } from "@/a11y/brailleBangla";
import { readingLine, type BrailleReading } from "@/a11y/brailleLines";
import { brailleNumber, violations } from "@/a11y/brailleText";
import { bindT } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import type { ClimateCellName, DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import type { ThenNowStatsFile } from "@/types/then-now-stats";
import { changeNote, waterSeries, yearSeries } from "./then-now-braille";
import { partStats, type StatPart } from "./then-now-stats";

const demo = readData<DhakaThenNowDemo>("demo/dhaka_then_now.json");
const grace = readData<GraceContextFile>("context/grace.json");
const stats = readData<ThenNowStatsFile>("thenvsnow/stats.json");
const en = bindT("en");

describe("series", () => {
  test("heat: one cell per year from the first window's start to the second's end; the gap years are blank", () => {
    const s = yearSeries(demo.heat);
    const first = demo.heat.A.years[0];
    expect(s[0]).toMatchObject({ label: String(first), value: demo.heat.A.values[0], window: "A" });
    expect(s.at(-1)).toMatchObject({ label: String(demo.heat.B.years.at(-1)), value: demo.heat.B.values.at(-1), window: "B" });
    expect(s.length).toBe(demo.heat.B.years.at(-1)! - first + 1);
    const gap = s.filter((p) => p.window === null);
    expect(gap.length).toBe(s.length - demo.heat.A.years.length - demo.heat.B.years.length);
    for (const p of gap) expect(p.value).toBeNull();
    // Every value is the file's own, in order.
    expect(s.filter((p) => p.window).map((p) => p.value)).toEqual([...demo.heat.A.values, ...demo.heat.B.values]);
  });

  test("water: GRACE's months for Bangladesh, the missing ones blank, both windows marked", () => {
    const s = waterSeries(grace);
    const bd = grace.boxes.Bangladesh;
    expect(s.map((p) => p.value)).toEqual(bd.cm.map((v) => v ?? null));
    expect(s.filter((p) => p.value === null).length).toBe(bd.cm.filter((v) => v === null).length);
    expect(s.some((p) => p.window === "A")).toBe(true);
    expect(s.some((p) => p.window === "B")).toBe(true);
    expect(s[0].bn).not.toMatch(/[A-Za-z]/u);
  });
});

describe("R's note: the part's statistic with its 95% interval", () => {
  const cities = Object.keys(stats.cities) as ClimateCellName[];
  const parts: StatPart[] = ["heat", "monsoon", "water"];
  for (const city of cities)
    for (const part of parts)
      test(`${city} ${part}`, () => {
        const items = partStats(stats, city, part).items;
        const note = changeNote(items)!;
        for (const i of items) {
          expect(note.en).toContain(brailleNumber(Math.abs(i.value), i.decimals));
          expect(note.en).toContain(brailleNumber(Math.abs(i.ci[0]), i.ciDecimals));
          expect(note.en).toContain(brailleNumber(Math.abs(i.ci[1]), i.ciDecimals));
        }
        expect(note.en).toContain("95% CI");
        expect(violations(note.en)).toEqual([]);
        // As the Bengali lines use it (bnCompose writes ya-with-nukta as bn.tbl has it).
        expect(bnTableSafe(bnCompose(note.bn))).toBe(true);
      });
  test("no statistic: no note (nothing invented)", () => expect(changeNote([])).toBeNull());
});

describe("the lines", () => {
  const year = yearSeries(demo.heat).at(-1)!;
  const r: BrailleReading = {
    short: "Heat",
    long: "Heat, Dhaka",
    layer: "heat",
    kind: "value",
    value: year.value,
    decimals: 2,
    below: false,
    snow: false,
    unit: "°C",
    place: { lat: 0, lon: 0 },
    placeName: { en: "Dhaka", bn: "ঢাকা" },
    time: { iso: null, label: year.label, bn: year.bn },
    badge: "observation",
    status: "",
    relative: false,
    reviewNote: changeNote(partStats(stats, "Dhaka", "heat").items)!,
  };

  test("the value line names the city and the year, never coordinates; R adds the change and its interval", () => {
    const line = readingLine(en, r, "en", "word", false);
    expect(line).toMatch(/^Heat /u);
    expect(line).toContain("Dhaka");
    expect(line).not.toMatch(/\d+(\.\d+)?[NS] /u);
    const review = readingLine(en, r, "en", "word", true);
    expect(review).toContain("95% CI");
    expect(review).toContain("deg C");
    expect(review).not.toContain("°");
  });

  test("the Bengali table: Bangla words only, the year, no UTC after a year", () => {
    for (const review of [false, true]) {
      const line = readingLine(en, r, "bn", "word", review);
      expect(bnTableSafe(line)).toBe(true);
      expect(line).toContain(year.bn);
      expect(line).not.toContain("ইউটিসি");
    }
  });
});
