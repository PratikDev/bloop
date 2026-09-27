import { describe, expect, test } from "bun:test";
import demoRaw from "../../../public/data/demo/dhaka_then_now.json";
import graceRaw from "../../../public/data/context/grace.json";
import type { DhakaThenNowDemo, GraceContextFile } from "@/types/data-contract";
import { centsToRatio, heatTone, missingRuns, monsoonDrops, stepDropTimes, waterFreq, waterRange } from "./context-maths";

const demo = demoRaw as DhakaThenNowDemo;
const grace = graceRaw as GraceContextFile;
const bd = grace.boxes.Bangladesh;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("heat (real GISTEMP demo windows)", () => {
  test("window means −0.14 and +1.228 are ≈ 6.6 semitones apart", () => {
    const a = heatTone(demo.heat.A.mean)!;
    const b = heatTone(demo.heat.B.mean)!;
    expect(12 * Math.log2(b.freq / a.freq)).toBeCloseTo(6.57, 2);
  });

  test("|anomaly| > 1.5 °C gets the roughest band; warm and cold alike", () => {
    expect(heatTone(1.6)!.band).toBe(3);
    expect(heatTone(-1.6)!.band).toBe(3);
    expect(heatTone(1.6)!.roughness).toBeGreaterThan(0);
    expect(heatTone(0.2)!.detuneCents).toBe(0);
  });

  test("detune cents → frequency ratio", () => {
    expect(centsToRatio(1200)).toBeCloseTo(2, 12);
    expect(centsToRatio(0)).toBe(1);
  });
});

describe("monsoon (real GPCP demo windows)", () => {
  test("A and B means give 9 and 8 drops per step (B not wetter)", () => {
    expect(monsoonDrops(demo.rain.gpcp.A.mean)).toBe(9);
    expect(monsoonDrops(demo.rain.gpcp.B.mean)).toBe(8);
    expect(monsoonDrops(null)).toBe(0);
  });

  test("B window has fewer drops in total than A over its 10 years", () => {
    const total = (xs: number[]) => xs.reduce((s, v) => s + monsoonDrops(v), 0);
    expect(total(demo.rain.gpcp.B.values)).toBeLessThan(total(demo.rain.gpcp.A.values));
  });

  test("step drop times: n drops, in order, inside the step", () => {
    const times = stepDropTimes(9, 0.4, 10);
    expect(times.length).toBe(9);
    for (let i = 0; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(10);
      expect(times[i]).toBeLessThan(10.4);
      if (i > 0) expect(times[i]).toBeGreaterThan(times[i - 1]);
    }
    expect(stepDropTimes(0, 0.4, 10)).toEqual([]);
  });
});

describe("water (real GRACE Bangladesh series)", () => {
  test("the range ignores the 35 missing months", () => {
    expect(bd.cm.filter((v) => v === null).length).toBe(35);
    const r = waterRange(bd.cm)!;
    expect(Number.isFinite(r.min) && Number.isFinite(r.max)).toBe(true);
    expect(r.min).toBeLessThan(r.max);
  });

  test("the bass sinks: window B's mean plays lower than window A's", () => {
    const r = waterRange(bd.cm)!;
    const window = (from: string, to: string) =>
      bd.months.map((m, i) => (m >= from && m <= to ? bd.cm[i] : null)).filter((v): v is number => v !== null);
    const a = waterFreq(mean(window("2003-01", "2006-12")), r)!;
    const b = waterFreq(mean(window("2021-01", "2024-12")), r)!;
    expect(b).toBeLessThan(a);
    expect(waterFreq(null, r)).toBeNull();
  });

  test("missing runs: 35 months, and one run is Jul 2017 – May 2018", () => {
    const runs = missingRuns(bd.cm);
    expect(runs.reduce((n, [a, b]) => n + b - a + 1, 0)).toBe(35);
    expect(runs.some(([a, b]) => bd.months[a] === "2017-07" && bd.months[b] === "2018-05")).toBe(true);
  });
});
