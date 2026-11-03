import { describe, expect, test } from "bun:test";
import { GRID_BANDS, LINE_BANDS, ROW_SEPARATOR } from "./brailleShape";
import { cellsOf, nearestIndex, positionOn, scaleHeading, scaleNumber, type ShapeScale } from "./brailleSource";

const RAIN: ShapeScale = { min: 0.1, max: 50, scale: "log", unit: "mm/h" };
const SST: ShapeScale = { min: -5, max: 35, scale: "linear", unit: "°C" };

describe("shared scale", () => {
  test("scale ends are written plainly", () => {
    expect([0.1, 50, -5, 35, 0, 1.25, 0.005].map(scaleNumber)).toEqual(["0.1", "50", "-5", "35", "0", "1.25", "0.005"]);
    expect(scaleHeading(RAIN, "word", "Scale")).toBe("Scale 0.1 to 50 mm/h log:");
    expect(scaleHeading(SST, "word", "Scale")).toBe("Scale -5 to 35 deg C:");
  });

  test("positions use the sound's scale: dry is the bottom, no data is blank", () => {
    expect(positionOn(RAIN, 0)).toBe(0);
    expect(positionOn(RAIN, null)).toBeNull();
    expect(positionOn(RAIN, 50)).toBe(1);
    expect(positionOn(SST, 15)).toBeCloseTo(0.5);
  });

  test("a line never auto-scales: 28 and 30 C fall in the same top band", () => {
    const cells = cellsOf({ mode: "path", points: [28, 30].map((v) => ({ value: v, at: { lat: 0, lon: 0 }, step: 0 })), current: 0 }, SST).cells;
    expect(cells).toEqual([LINE_BANDS[3], LINE_BANDS[3]]);
  });

  test("grid views come out in rows with separators", () => {
    const points = Array.from({ length: 9 }, (_, i) => ({ value: -5 + i * 5, at: { lat: 0, lon: i }, step: 0 }));
    const cells = cellsOf({ mode: "grid", points, columns: 3, current: 4 }, SST).cells;
    expect(cells.filter((c) => c === ROW_SEPARATOR).length).toBe(2);
    expect(cells[0]).toBe(GRID_BANDS[0]);
  });

  test("the needle's point: nearest place, or the current step in time", () => {
    const pts = [0, 5, 10].map((lon, i) => ({ value: 1, at: { lat: 0, lon }, step: i }));
    expect(nearestIndex(pts, { lat: 0, lon: 6 }, 0, "path")).toBe(1);
    expect(nearestIndex(pts, { lat: 0, lon: 0 }, 2, "time")).toBe(2);
    expect(nearestIndex([{ value: 1, at: { lat: 0, lon: 179 }, step: 0 }, { value: 1, at: { lat: 0, lon: 0 }, step: 0 }], { lat: 0, lon: -179 }, 0, "path")).toBe(0);
  });
});
