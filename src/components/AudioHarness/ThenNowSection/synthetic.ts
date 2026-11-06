import type { ThenNowInput } from "@/lib/audio";

/**
 * SYNTHETIC test input for the harness only: made-up numbers shaped like the
 * demo (not NASA data, never shown in the app). "Load real demo" switches
 * to the real files through L3's buildThenNowInput().
 */

const months = (fromYear: number, n: number) =>
  Array.from({ length: n }, (_, i) => `${fromYear + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);

const waterMonths = months(2010, 72);
const GAPS = new Set([30, 31, 32, 33, 34, 35, 50]); // a long gap and a single missing month

export const SYNTHETIC: ThenNowInput = {
  heat: {
    A: { label: "Window A (synthetic)", years: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], values: [-1.2, 0.1, -0.4, 0.3, -0.2, 0, 0.5, -0.6, 0.2, -0.1] },
    B: { label: "Window B (synthetic)", years: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], values: [1.3, 0.8, 1.6, 1.1, 0.9, 1.7, 1.2, 1, 1.4, 1.5] },
  },
  monsoon: {
    A: { label: "Window A (synthetic)", years: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], values: [14, 16, 15, 17, 13, 15, 16, 14, 15, 16] },
    B: { label: "Window B (synthetic)", years: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], values: [13, 14, 12, 15, 13, 14, 12, 13, 14, 13] },
  },
  water: {
    months: waterMonths,
    cm: waterMonths.map((_, i) => (GAPS.has(i) ? null : 5 - (13 * i) / 71 + 3 * Math.sin((i / 12) * 2 * Math.PI))),
    windowA: ["2010-01", "2012-12"],
    windowB: ["2014-01", "2015-12"],
  },
  captions: {
    heat: "Synthetic heat test (the real caption comes from the demo JSON)",
    monsoon: "Synthetic monsoon test (the real caption comes from the demo JSON)",
    water: "Synthetic water test (the real caption comes from the demo JSON)",
  },
};
