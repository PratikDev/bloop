import { describe, expect, test } from "bun:test";
import { bindT } from "@/lib/i18n";
import { bnLayer, bnNumber, bnPlace, bnTableSafe, bnTime, bnUnit } from "./brailleBangla";
import { banglaLine, banglaReview, compactTime, uebLine, uebReview, type BrailleReading } from "./brailleLines";

const t = bindT("en");
const SST: BrailleReading = {
  short: "SST", long: "Sea surface temperature", layer: "ocean", kind: "value", value: 30.2, decimals: 1, below: false, snow: false,
  unit: "°C", place: { lat: 21.5, lon: 89.8 }, time: { iso: "2026-11-01T00:00:00Z", label: null }, badge: "observation", status: "stale",
  relative: false,
};

describe("UEB value line", () => {
  test("the core reading fits 40 cells, front-loaded", () => {
    expect(uebLine(t, SST, "word")).toBe("SST 30.2C 21.5N 89.8E 1Nov 00UTC obs");
    expect([...uebLine(t, SST, "word")].length).toBeLessThanOrEqual(40);
    expect(uebLine(t, SST, "symbol")).toBe("SST 30.2°C 21.5N 89.8E 1Nov 00UTC obs");
  });

  test("optional parts drop from the end; a relative record says so first", () => {
    const rain = { ...SST, short: "Rain", layer: "rain", value: 12, decimals: 0, unit: "mm/h", time: { iso: "2026-11-03T06:30:00Z", label: null }, status: "live" };
    expect(uebLine(t, rain, "word")).toBe("Rain 12mm/h 21.5N 89.8E 3Nov 0630UTC obs");
    const pattern = { ...SST, short: "sea salt", layer: "sea_salt", value: 0.0001, decimals: 4, unit: "relative density (0–1)", status: "pattern only", relative: true, svs: 5669, tag: "5669" };
    expect(uebLine(t, pattern, "word").startsWith("pattern sea salt 0.0001 21.5N 89.8E")).toBe(true);
  });

  test("R gives the full sentence", () => {
    expect(uebReview(t, SST, "word")).toBe("Sea surface temperature 30.2 degrees C at 21.5N 89.8E, 1 Nov 00:00 UTC, observation, stale");
  });

  test("compact times", () => {
    expect(compactTime("2026-11-01T00:00:00Z")).toBe("1Nov 00UTC");
    expect(compactTime("2026-11-03T10:30:00Z")).toBe("3Nov 1030UTC");
  });
});

describe("Bengali-table value line (বাংলা mode)", () => {
  test("decimals as a word, times without a colon, Bangla words for Latin abbreviations", () => {
    // Western digits: bn.tbl gives them the number sign and they read back as Bangla numerals (Bangla digits get none).
    expect(bnNumber(30.2, 1)).toBe("30 দশমিক 2");
    expect(bnNumber(-5, 0)).toBe("-5");
    expect(bnTime("2026-11-03T10:30:00Z", new Date("2026-11-04T00:00:00Z"))).toBe("3 নভেম্বর 10টা 30 মিনিট");
    expect(bnTime("2026-11-01T00:00:00Z", new Date("2026-11-04T00:00:00Z"))).toBe("1 নভেম্বর 0টা");
    expect(bnTime("2017-03-01T00:00:00Z", new Date("2026-11-04T00:00:00Z"))).toBe("1 মার্চ 2017 0টা");
    expect(bnPlace(21.5, 89.8)).toBe("21 দশমিক 5 উত্তর 89 দশমিক 8 পূর্ব");
    expect(bnUnit("°C")).toBe("ডিগ্রি সেলসিয়াস");
    expect(bnUnit("mm/h")).toBe("মিমি প্রতি ঘণ্টা");
    expect(bnLayer("ocean")).toBe("সমুদ্রপৃষ্ঠের তাপমাত্রা");
    expect(bnLayer("co_global")).toBe("কার্বন মনোক্সাইড বিশ্ব");
    expect(bnLayer("GHRSST_L4_MUR_Sea_Ice_Concentration")).toBe("");
  });

  test("the whole line is Bengali-table safe and keeps the record's number", () => {
    const line = banglaLine(SST);
    expect(line.startsWith("সমুদ্রপৃষ্ঠের তাপমাত্রা 30 দশমিক 2 ডিগ্রি সেল")).toBe(true);
    expect(line).toContain("21 দশমিক 5 উত্তর 89 দশমিক 8 পূর্ব");
    expect(line.includes("়")).toBe(false); // the nukta is composed (য়), never the pair
    expect(bnTableSafe(line)).toBe(true);
    expect(bnTableSafe(banglaReview(SST))).toBe(true);
    expect(bnTableSafe("SST 30.2")).toBe(false);
    expect(bnTableSafe("১০:৩০")).toBe(false);
    expect(bnTableSafe("৩০ দশমিক ২")).toBe(false); // Bangla digits: no number sign in bn.tbl
    expect(bnTableSafe("সেলসিয়াস")).toBe(false); // the combining nukta: undefined in bn.tbl
  });

  test("a record with no Bangla layer name is named by its number, never in Latin", () => {
    const gibs = { ...SST, short: "sea ice", layer: "GHRSST_L4_MUR_Sea_Ice_Concentration", svs: 4993, unit: "%", value: 30.5 };
    expect(banglaLine(gibs).startsWith("রেকর্ড 4993 30 দশমিক 5 শতাংশ")).toBe(true);
  });
});
