import { describe, expect, test } from "bun:test";
import { fitDisc, growthForReadable, largestFreeRect } from "./fit";

describe("largestFreeRect", () => {
  test("no panels: the whole stage", () => {
    expect(largestFreeRect(800, 600, [])).toEqual({ x: 0, y: 0, w: 800, h: 600 });
  });

  test("a bottom bar: the space above it", () => {
    expect(largestFreeRect(800, 600, [{ x: 0, y: 500, w: 800, h: 100 }])).toEqual({ x: 0, y: 0, w: 800, h: 500 });
  });

  test("a right-hand drawer and a top-left chip: nearly the largest disc, near the middle", () => {
    const free = largestFreeRect(1440, 840, [
      { x: 1000, y: 0, w: 440, h: 840 },
      { x: 24, y: 24, w: 340, h: 100 },
    ]);
    expect(Math.min(free.w, free.h)).toBeGreaterThanOrEqual(716 * 0.85);
    expect(free.x + free.w).toBeLessThanOrEqual(1000);
  });

  test("a key in a corner doesn't push the disc off centre", () => {
    const free = largestFreeRect(390, 300, [{ x: 270, y: 0, w: 120, h: 48 }]);
    expect(free.x + free.w / 2).toBe(195);
  });

  test("the result never overlaps a panel", () => {
    const panels = [
      { x: 100, y: 100, w: 200, h: 200 },
      { x: 500, y: 50, w: 100, h: 400 },
    ];
    const r = largestFreeRect(800, 600, panels);
    for (const p of panels) expect(r.x < p.x + p.w && p.x < r.x + r.w && r.y < p.y + p.h && p.y < r.y + r.h).toBe(false);
  });

  test("panels off the stage are clamped to its edges", () => {
    expect(largestFreeRect(400, 400, [{ x: 300, y: -50, w: 300, h: 600 }])).toEqual({ x: 0, y: 0, w: 300, h: 400 });
  });
});

describe("fitDisc", () => {
  test("centred, with a 24 px margin", () => {
    expect(fitDisc({ x: 100, y: 0, w: 500, h: 400 })).toEqual({ cx: 350, cy: 200, radius: 176 });
  });

  test("never smaller than the minimum", () => {
    expect(fitDisc({ x: 0, y: 0, w: 60, h: 60 }).radius).toBe(40);
  });
});

describe("growthForReadable", () => {
  const dock = (width: number, height: number, tall: number) => ({ x: 0, y: height - tall, w: width, h: tall });

  test("room to spare: no growth", () => {
    expect(growthForReadable(1440, 840, [dock(1440, 840, 100)])).toBe(0);
  });

  test("a 320 px phone with a tall dock: grows until a 200 px globe and its margin fit above the dock", () => {
    const extra = growthForReadable(320, 640, [dock(320, 640, 480)]);
    expect(extra).toBeGreaterThan(0);
    const free = largestFreeRect(320, 640 + extra, [{ ...dock(320, 640, 480), y: 160 + extra }]);
    expect(fitDisc(free).radius).toBeGreaterThanOrEqual(100);
  });

  test("200% zoom: the readout and search stay at the top, the wrapped dock moves down, and a 200 px globe fits", () => {
    const readout = { x: 24, y: 24, w: 352, h: 200 };
    const search = { x: 400, y: 12, w: 228, h: 48 };
    const before = fitDisc(largestFreeRect(640, 512, [readout, search, dock(640, 512, 240)]));
    expect(before.radius).toBeLessThan(100);
    const extra = growthForReadable(640, 512, [readout, search, dock(640, 512, 240)]);
    const free = largestFreeRect(640, 512 + extra, [readout, search, { ...dock(640, 512, 240), y: 272 + extra }]);
    expect(fitDisc(free).radius).toBeGreaterThanOrEqual(100);
  });

  test("a stage too narrow for 200 px asks only for what its width allows", () => {
    const extra = growthForReadable(180, 100, []);
    expect(fitDisc(largestFreeRect(180, 100 + extra, [])).radius).toBeGreaterThanOrEqual(180 / 2 - 24 - 0.5);
  });
});
