import { describe, expect, test } from "bun:test";
import { sharedYScale } from "./then-now";

describe("the shared y-axis of the two panels", () => {
  test("covers every value and includes zero", () => {
    const { domain } = sharedYScale([8.4, 11.2, 9.9]);
    expect(domain[0]).toBe(0);
    expect(domain[1]).toBeGreaterThanOrEqual(11.2);
  });
  test("covers negative anomalies", () => {
    const { domain } = sharedYScale([-0.6, 1.4]);
    expect(domain[0]).toBeLessThanOrEqual(-0.6);
    expect(domain[1]).toBeGreaterThanOrEqual(1.4);
  });
  test("ticks run evenly from one end of the domain to the other, with no floating-point dust", () => {
    const { domain, ticks } = sharedYScale([0.13, 0.31]);
    expect(ticks[0]).toBe(domain[0]);
    expect(ticks[ticks.length - 1]).toBe(domain[1]);
    for (const tick of ticks) expect(String(tick).length).toBeLessThan(8);
  });
  test("an all-zero series still has a usable axis", () => {
    expect(sharedYScale([0, 0]).domain[1]).toBeGreaterThan(0);
  });
});
