// The dial's pure parts: swara + meend settles on the data (200 values, 1 cent), the gridlines, the stops' layers,
// the plans, and the measurement used by the data-voice check (on synthetic tones of known pitch).

import { describe, expect, test } from "bun:test";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { dialLayers, whatChanges } from "./dial";
import { crossed, gridlines, niceStep } from "./gridlines";
import { centsBetween, MEGH, meendAt, nearestSwara } from "./meend";
import { maxCents, measurePitch, onsetTimes } from "./proof/measure";
import { dropPlan, pitchPlan } from "./proof/plan";
import { droneColour } from "./layers";

const ocean = continuousRule("ocean");

describe("swara + meend", () => {
  test("the settled pitch equals the continuous mapping within 1 cent for 200 values", () => {
    let worst = 0;
    for (let i = 0; i < 200; i++) {
      const value = -4 + (38 * i) / 199;
      const hz = mapContinuous(value, ocean) as number;
      const start = nearestSwara(hz, ocean.output.min);
      worst = Math.max(worst, Math.abs(centsBetween(meendAt(start, hz, 50, 50), hz)));
    }
    expect(worst).toBeLessThan(1);
  });

  test("the swara is a Megh note on Sa, at most a minor third (300 cents) from the data pitch", () => {
    const sa = 220;
    for (const hz of [221, 247.5, 300, 391, 440, 659, 870]) {
      const s = nearestSwara(hz, sa);
      const step = Math.round(12 * Math.log2(s / sa));
      expect([0, ...MEGH.slice(1), 12].map((m) => ((m % 12) + 12) % 12)).toContain(((step % 12) + 12) % 12);
      expect(Math.abs(centsBetween(s, hz))).toBeLessThanOrEqual(150 + 1e-9);
    }
  });
});

describe("gridlines", () => {
  test("round values on the ocean axis (-5 to 35 °C): every 5 °C", () => {
    expect(niceStep(40)).toBe(5);
    expect(gridlines(ocean.input)).toEqual([-5, 0, 5, 10, 15, 20, 25, 30, 35]);
  });
  test("a log axis gets 1, 2, 5 per decade", () => {
    expect(gridlines({ min: 0.1, max: 50, scale: "log" })).toEqual([0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50]);
  });
  test("crossings in the order travelled; none without a crossing", () => {
    expect(crossed([0, 5, 10], 3, 11)).toEqual([5, 10]);
    expect(crossed([0, 5, 10], 11, 3)).toEqual([10, 5]);
    expect(crossed([0, 5, 10], 6, 9)).toEqual([]);
  });
});

describe("the dial's stops", () => {
  test("0 Measure: ticks only; 0.5 Blend: timbre, bed, chord; 1 Music: + drone, reverb, meend", () => {
    expect(whatChanges(dialLayers(0, "single", true))).toEqual(["ticks"]);
    expect(whatChanges(dialLayers(0.5, "single", true))).toEqual(["timbre", "bed", "chord"]);
    expect(whatChanges(dialLayers(1, "single", true))).toEqual(["timbre", "bed", "chord", "drone", "reverb", "meend"]);
  });
  test("Both and duet: no chord and no drone (never past two data voices)", () => {
    for (const mode of ["both", "duet"] as const) {
      const l = dialLayers(1, mode, true);
      expect([l.chord, l.drone]).toEqual([false, false]);
    }
  });
  test("Plain tones: no timbre change at any stop", () => {
    for (const s of [0, 0.5, 1] as const) expect(dialLayers(s, "single", false).timbre).toBe(false);
  });
  test("season colour: monsoon months June to September; Sa is not part of it", () => {
    expect([5, 6, 9, 10, null].map((m) => droneColour(m))).toEqual(["dry", "monsoon", "monsoon", "dry", "dry"]);
  });
});

describe("the check's plans and measurement", () => {
  test("a pitch plan uses the record's own rule; null is silence", () => {
    const p = pitchPlan("ocean", "ocean", [28, null, 15], 0.4);
    expect(p.steps.map((s) => s.out)).toEqual([mapContinuous(28, ocean), null, mapContinuous(15, ocean)]);
  });
  test("a drop plan is deterministic, and dry means no drops", () => {
    const a = dropPlan("rain", "rain", [0, 2, 10, null], 0.5);
    expect(a.drops).toEqual(dropPlan("rain", "rain", [0, 2, 10, null], 0.5).drops);
    expect(a.drops.every((t) => t >= 0.5 && t < 1.5)).toBe(true);
  });
  test("measurePitch finds a known tone within 0.05 cent, with harmonics and noise", () => {
    const sr = 24000;
    for (const hz of [220.7, 331.13, 612.4]) {
      const x = new Float32Array(sr);
      let seed = 1;
      for (let i = 0; i < x.length; i++) {
        seed = (seed * 16807) % 2147483647;
        const w = (2 * Math.PI * hz * i) / sr;
        x[i] = Math.sin(w) + 0.4 * Math.sin(2 * w) + 0.2 * Math.sin(3 * w) + 0.05 * ((seed / 2147483647) * 2 - 1);
      }
      expect(Math.abs(centsBetween(measurePitch(x, sr, 0.2, 0.45, hz * 1.002), hz))).toBeLessThan(0.05);
    }
  });
  test("onsetTimes finds separate bursts; maxCents is symmetric", () => {
    const sr = 24000;
    const x = new Float32Array(sr);
    for (const t of [0.1, 0.4, 0.7]) for (let i = 0; i < 200; i++) x[Math.round(t * sr) + i] = Math.sin(i) * Math.exp(-i / 60);
    expect(onsetTimes(x, sr).length).toBe(3);
    expect(maxCents([440], [441])).toBeCloseTo(maxCents([441], [440]), 9);
  });
});
