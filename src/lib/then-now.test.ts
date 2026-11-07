// Mentor item 9: both rain sources compare the same baseline and the same recent decade, and that decade ends in
// the last year of the GPCC product we ship (read from the files, not typed here).
import { describe, expect, test } from "bun:test";
import { readData } from "@/lib/i18n/data-sentences";
import type { CitiesThenNowFile, DhakaThenNowDemo, GpccContextFile, RainDemo } from "@/types/data-contract";

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
