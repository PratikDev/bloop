// The cents error budget (A3): error_budget.json equals the recomputation from the mapping files (semitonesPerUnit's
// maths) and its own errors; a dynamic axis (Sound terrain) is computed live; an unknown error is never 0.
import { describe, expect, test } from "bun:test";
import { continuousRule } from "@/lib/audio/mapping-maths";
import { budgetFor, centsOf, ERROR_BUDGET, FLAG_CENTS, liveBudget, semitonesPerStep } from "./error-budget";

describe("error budget", () => {
  test("every axis's semitones per unit is the engine's own rule", () => {
    for (const a of ERROR_BUDGET.axes.filter((x) => !x.dynamic)) {
      expect(a.st_per_unit).toBeCloseTo(semitonesPerStep(continuousRule(a.voice)) ?? NaN, 5);
    }
  });

  test("cents = 100 × st/unit × error, flagged over the limit", () => {
    for (const a of ERROR_BUDGET.axes.filter((x) => !x.dynamic && x.error_in_axis_units !== null)) {
      const cents = centsOf(a.st_per_unit ?? NaN, a.error_in_axis_units ?? NaN);
      expect(a.cents).toBeCloseTo(cents, 1);
      expect(a.flag).toBe(cents > FLAG_CENTS);
      expect(liveBudget(a).flag).toBe(cents > FLAG_CENTS);
    }
  });

  test("log axes turn the relative error into decades", () => {
    for (const a of ERROR_BUDGET.axes.filter((x) => x.log && x.error !== null)) {
      expect(a.error_in_axis_units).toBeCloseTo(Math.log10(1 + (a.error ?? NaN)), 5);
    }
  });

  test("no source: error unknown, never 0", () => {
    const unknown = ERROR_BUDGET.axes.filter((a) => a.error_source === null);
    expect(unknown.map((a) => a.id).sort()).toEqual(["gistemp_heat", "ndvi_vegetation"]);
    for (const a of unknown) {
      expect(a.error).toBeNull();
      expect(liveBudget(a).cents).toBeNull();
    }
  });

  test("the zoomed axis is computed from its live span (narrower span, more cents)", () => {
    const zoom = ERROR_BUDGET.axes.find((a) => a.dynamic);
    expect(zoom).toBeDefined();
    if (!zoom) return;
    expect(liveBudget(zoom).cents).toBeNull();
    const five = liveBudget(zoom, { min: 27, max: 32 });
    const four = liveBudget(zoom, { min: 27, max: 31 });
    const rule = continuousRule(zoom.voice);
    expect(five.cents).toBeCloseTo((100 * 12 * Math.log2(rule.output.max / rule.output.min) * (zoom.error_in_axis_units ?? NaN)) / 5, 6);
    expect(four.cents ?? 0).toBeGreaterThan(five.cents ?? 0);
  });

  test("records find their axis", () => {
    expect(budgetFor("ocean")?.id).toBe("sst_global");
    expect(budgetFor("currents_3912")?.id).toBe("sst_3912");
    expect(budgetFor("rain")).toBeNull();
  });
});
