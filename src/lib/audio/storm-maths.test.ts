import { describe, expect, test } from "bun:test";
import { peakFrame } from "./storm-maths";
import type { RainPhase, SweepPoint } from "./types";

const f = (mmPerHour: number | null, phase: RainPhase = "liquid"): SweepPoint => ({ lat: 0, lon: 0, valueC: null, mmPerHour, phase });

describe("peakFrame", () => {
  test("the heaviest frame, rain or snow; first one on a tie", () => {
    expect(peakFrame([f(1), f(12), f(5), f(12)])).toBe(1);
    expect(peakFrame([f(1), f(3, "frozen"), f(2)])).toBe(1);
  });

  test("no peak when every frame is dry or has no data", () => {
    expect(peakFrame([f(0, "dry"), f(null, "nodata"), f(0, "dry")])).toBe(-1);
    expect(peakFrame([])).toBe(-1);
  });

  test("no-data frames never win", () => {
    expect(peakFrame([f(null, "nodata"), f(0.2)])).toBe(1);
  });
});
