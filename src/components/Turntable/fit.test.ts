import { describe, expect, test } from "bun:test";
import { DECK_BOX, layoutPair, pairGrowth, PAIR_GAP_PX } from "./fit";




describe("layoutPair", () => {
  const apart = (a: { x: number; w: number }, b: { x: number }) => b.x - (a.x + a.w);

  test("1440 × 900 with the bar along the bottom and the readout top-left: the globe is at least 420 px, the deck beside it", () => {
    const panels = [{ x: 0, y: 762, w: 1440, h: 86 }, { x: 24, y: 24, w: 352, h: 240 }];
    const { globe, deck } = layoutPair(1440, 848, panels, "side");
    expect(2 * globe.radius).toBeGreaterThanOrEqual(420);
    const globeBox = { x: globe.cx - globe.radius, w: 2 * globe.radius };
    expect(apart(globeBox, deck)).toBeGreaterThanOrEqual(PAIR_GAP_PX - 0.5);
    for (const p of panels) {
      const hitsDeck = deck.x < p.x + p.w && p.x < deck.x + deck.w && deck.y < p.y + p.h && p.y < deck.y + deck.h;
      expect(hitsDeck).toBe(false);
    }
  });

  test("a phone: stacked, the turntable under the globe, both inside the stage", () => {
    const { globe, deck } = layoutPair(390, 1100, [{ x: 0, y: 900, w: 390, h: 200 }], "stacked");
    expect(deck.y).toBeGreaterThanOrEqual(globe.cy + globe.radius + PAIR_GAP_PX - 0.5);
    expect(deck.x).toBeGreaterThanOrEqual(0);
    expect(deck.x + deck.w).toBeLessThanOrEqual(390);
    expect(deck.w).toBe(390);
    expect(deck.h).toBeCloseTo((390 * DECK_BOX.height) / DECK_BOX.width, 5);
  });
});

describe("pairGrowth", () => {
  test("a phone whose panels leave too little: the stage grows until a 200 px globe fits above the turntable", () => {
    const panels = [{ x: 0, y: 300, w: 390, h: 400 }];
    const extra = pairGrowth(390, 700, panels);
    expect(extra).toBeGreaterThan(0);
    const moved = panels.map((p) => ({ ...p, y: p.y + extra }));
    expect(2 * layoutPair(390, 700 + extra, moved, "stacked").globe.radius).toBeGreaterThanOrEqual(199.5);
  });

  test("room to spare: no growth", () => {
    expect(pairGrowth(1440, 848, [{ x: 0, y: 762, w: 1440, h: 86 }], "side")).toBe(0);
  });
});
