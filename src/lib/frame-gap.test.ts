// Mentor item 1: the Both-mode gap is computed from the two manifests' frame times, in hours under a day, and its
// short form is braille-ready.
import { describe, expect, test } from "bun:test";
import { STATUS_BUDGET, violations } from "@/a11y/brailleText";
import { uebLine, banglaLine, type BrailleReading } from "@/a11y/brailleLines";
import { bindT } from "@/lib/i18n";
import { readData } from "@/lib/i18n/data-sentences";
import { frameGap, gapLong, gapShort, gapTexts } from "./frame-gap";

const en = bindT("en");
const bn = bindT("bn");

describe("frameGap", () => {
  test("whole days from a day up, hours under a day, which frame is newer", () => {
    expect(frameGap("2026-11-04T00:00:00Z", "2026-11-06T01:30:00Z")).toMatchObject({ newer: "rain", amount: 2, unit: "days" });
    expect(frameGap("2026-11-06T00:00:00Z", "2026-11-05T19:00:00Z")).toMatchObject({ newer: "ocean", amount: 5, unit: "hours" });
    expect(frameGap("2026-11-06T00:00:00Z", "2026-11-06T00:20:00Z")).toMatchObject({ newer: null, amount: 0 });
    expect(frameGap("not a time", "2026-11-06T00:20:00Z")).toBeNull();
  });

  test("the long form names both times and the gap", () => {
    const g = frameGap("2026-11-04T00:00:00Z", "2026-11-06T01:30:00Z")!;
    expect(gapLong(en, "en", g)).toBe("Ocean frame: 4 Nov 2026, 00:00 UTC · Rain frame: 6 Nov 2026, 01:30 UTC (2 days apart)");
    expect(gapLong(en, "en", frameGap("2026-11-06T00:00:00Z", "2026-11-05T23:00:00Z")!)).toEndWith("(1 hour apart)");
    expect(gapTexts(g).bn).toContain("দিনের ব্যবধান");
  });

  test("the short form is braille-ready in both languages", () => {
    const g = frameGap("2026-11-04T00:00:00Z", "2026-11-06T01:30:00Z")!;
    expect(gapShort(en, g)).toBe("rain 2d newer");
    for (const s of [gapShort(en, g), gapShort(bn, g), en("announce.trackBoth", { gap: gapShort(en, g) })]) {
      expect(violations(s, STATUS_BUDGET)).toEqual([]);
      expect(s).not.toMatch(/[০-৯]/u);
    }
  });

  test("the shipped manifests give the gap the app shows", () => {
    const sst = readData<{ frame_time_utc: string }>("latest/sst.json").frame_time_utc;
    const rain = readData<{ frame_time_utc: string }>("latest/rain.json").frame_time_utc;
    const g = frameGap(sst, rain)!;
    expect(g.ms).toBe(Date.parse(rain) - Date.parse(sst));
  });

  test("the braille value line carries the note in each table's language", () => {
    const r: BrailleReading = {
      short: "SST", long: "Sea surface temperature", layer: "ocean", kind: "value", value: 29.8, decimals: 1, below: false, snow: false,
      unit: "°C", place: { lat: 21.5, lon: 89.8 }, time: { iso: "2026-11-04T00:00:00Z", label: null }, badge: "observation", status: "",
      relative: false, note: { en: "rain 2d newer", bn: "বৃষ্টি 2দি নতুন" },
    };
    const line = uebLine(en, r, "symbol");
    expect(line).toContain("rain 2d newer");
    expect(violations(line, STATUS_BUDGET)).toEqual([]);
    expect(banglaLine(r)).toContain("বৃষ্টি 2দি নতুন");
  });
});
