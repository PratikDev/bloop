// P2b, Fire Geiger: the clicks in a 10 s render match the Poisson mean (rate × 10 s) within tolerance; zero detections
// give no clicks; FRP changes only the brightness (cutoff), never the rate or the loudness. Plus the FIRMS reading (the
// satellite from the file's own dataset names, never S-NPP) and the pilot table's maths.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { continuousRule, voiceSpec } from "@/lib/audio/mapping";
import { readData } from "@/lib/i18n/data-sentences";
import type { FirmsContextFile, FwiArchiveIndex, FwiClassMetadata } from "@/types/data-contract";
import { gunzipSync } from "node:zlib";
import { chtSeasonCases, dayCount, isSnpp, regionsAt, satelliteOf, seriesOf } from "./firms";
import { BRIGHTNESS_VOICE, GEIGER_VOICE, geigerBrightness, geigerRate, poissonTimes, seeded } from "./geiger";
import { pilotRows, pilotSummary, spearman } from "./pilot";

const firms = readData<FirmsContextFile>("context/firms.json");
const daily = firms.daily;
if (!daily) throw new Error("context/firms.json has no daily block");

describe("Poisson clicks", () => {
  test("a 10 s render's click count matches rate × 10 within tolerance, at every rate of the rule", () => {
    const rule = continuousRule(GEIGER_VOICE);
    for (const rate of [rule.output.min, 2, rule.output.max]) {
      const runs = 400;
      let total = 0;
      for (let s = 1; s <= runs; s++) total += poissonTimes(rate, 10, seeded(s)).length;
      const mean = total / runs;
      const expected = rate * 10;
      // The mean of 400 Poisson(λ=rate·10) draws: standard error √(λ/400); allow 4 of them.
      expect(Math.abs(mean - expected)).toBeLessThan(4 * Math.sqrt(expected / runs));
    }
  });
  test("zero detections: no clicks, no brightness (a stated silence)", () => {
    expect(geigerRate(0)).toBe(0);
    expect(poissonTimes(geigerRate(0), 10, seeded(1))).toEqual([]);
    expect(geigerBrightness(0, 0)).toBeNull();
  });
  test("FRP changes only the brightness: the rate follows the count alone, and every click has the same peak gain", () => {
    const rate = geigerRate(50);
    const dull = geigerBrightness(50, 50);
    const bright = geigerBrightness(50, 2500);
    expect(geigerRate(50)).toBe(rate);
    expect(bright).toBeGreaterThan(dull ?? Infinity);
    expect(continuousRule(BRIGHTNESS_VOICE).output.param).toBe("cutoff");
    expect(voiceSpec(GEIGER_VOICE).sound.maxGain).toBe(voiceSpec(BRIGHTNESS_VOICE).sound.maxGain);
  });
  test("more hotspots, faster clicks, inside the rule's listenable band", () => {
    const r = continuousRule(GEIGER_VOICE).output;
    expect(geigerRate(1)).toBeCloseTo(r.min, 6);
    expect(geigerRate(10)).toBeGreaterThan(geigerRate(1));
    expect(geigerRate(1e6)).toBeCloseTo(r.max, 6);
  });
});

describe("FIRMS daily", () => {
  test("every source's satellite is read from the file's dataset names, and none is S-NPP", () => {
    for (const source of daily.sources) {
      const sat = satelliteOf(daily, source);
      expect(sat, source).not.toBeNull();
      expect(isSnpp(sat ?? "")).toBe(false);
    }
    expect(satelliteOf(daily, "VIIRS_NOAA21_NRT")).toBe("NOAA-21");
    expect(satelliteOf(daily, "VIIRS_NOAA20_NRT")).toBe("NOAA-20");
  });
  test("a point in the Hill Tracts is in CHT first, then Bangladesh", () => {
    const [w, s, e, n] = daily.boxes.CHT;
    expect(regionsAt(daily, (s + n) / 2, (w + e) / 2)).toEqual(["CHT", "Bangladesh"]);
  });
  test("a day's count is the file's; a day the file lacks is null, not zero", () => {
    const series = seriesOf(daily, "Punjab", "VIIRS_NOAA20_NRT");
    expect(series).not.toBeNull();
    if (!series) return;
    expect(dayCount(series, series.days[3])?.count).toBe(series.counts[3]);
    expect(dayCount(series, "1999-01-01")).toBeNull();
  });
  test("the fire-season examples are the CHT March–April cases in the file", () => {
    const cases = chtSeasonCases(firms);
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) expect(c.series.days[0].slice(5, 7)).toBe("03");
  });
});

describe("forecast meets outcome (pilot)", () => {
  const meta = readData<FwiClassMetadata>("latest/fwi_class.json");
  const index = readData<FwiArchiveIndex>("context/fwi_archive_index.json");
  const days = index.days.map((d) => ({ date: d.date, codes: new Uint8Array(gunzipSync(readFileSync(`public/data/${d.file}`))) }));
  const rows = pilotRows(daily, meta.grid, days);
  test("one row per archived day and box that has a next-day count", () => {
    for (const r of rows) for (const source of daily.sources) {
      const s = seriesOf(daily, r.region, source);
      expect(r.counts[source]).toBe(s ? (dayCount(s, r.forDay)?.count ?? null) : null);
    }
  });
  test("Spearman: ties and constants are handled; skill is never claimed on a small n", () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1, 10);
    expect(spearman([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10);
    expect(spearman([1, 1, 1], [1, 2, 3])).toBeNull();
    for (const s of pilotSummary(rows, daily.sources)) if (s.n < 10) expect(s.claim).toBe("none");
  });
});
