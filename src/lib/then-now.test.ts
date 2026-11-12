import { describe, expect, test } from "bun:test";
import { readData } from "@/lib/i18n/data-sentences";
import type { CitiesThenNowFile, DhakaThenNowDemo, GpccContextFile, RainDemo } from "@/types/data-contract";
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

// Both rain sources compare the same baseline and the same recent decade, and that decade ends in the last year of
// the GPCC product we ship (read from the files, not typed here).
const demo = readData<DhakaThenNowDemo>("demo/dhaka_then_now.json");
const cities = readData<CitiesThenNowFile>("demo/cities_then_now.json");
const gpcc = readData<GpccContextFile>("context/gpcc_bd.json");
const rains: [string, RainDemo][] = [["Dhaka demo", demo.rain], ...cities.cities.map((c): [string, RainDemo] => [c.name, c.rain])];

describe("rain windows (GPCP vs GPCC)", () => {
  test.each(rains)("%s: GPCP and GPCC use identical main windows", (_, rain) => {
    expect(rain.gpcp.A.window).toEqual(rain.gpcc.A.window);
    expect(rain.gpcp.B.window).toEqual(rain.gpcc.B.window);
    expect(rain.gpcp.A.years).toEqual(rain.gpcc.A.years);
    expect(rain.gpcp.B.years).toEqual(rain.gpcc.B.years);
  });

  test.each(rains)("%s: the recent decade ends in GPCC's last year, and the note says so", (_, rain) => {
    const end = Number(gpcc.last_month.slice(0, 4));
    expect(rain.gpcc.B.window[1]).toBe(end);
    expect(rain.gpcc_end_note).toContain(gpcc.product);
    expect(rain.gpcc_end_note).toContain(gpcc.last_month_text);
  });

  test.each(rains)("%s: GPCP's newer decade is labelled GPCP only, with GPCC's real end year", (_, rain) => {
    expect(rain.gpcp_newer.label).toBe(`GPCP only, newer decade; GPCC data ends in ${gpcc.last_month.slice(0, 4)}`);
    expect(rain.gpcp_newer.B.window[1]).toBeGreaterThan(rain.gpcc.B.window[1]);
  });
});
