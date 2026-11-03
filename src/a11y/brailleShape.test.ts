import { describe, expect, test } from "bun:test";
import {
  BLANK,
  CONTINUES,
  GRID_BANDS,
  LINE_BANDS,
  ROW_SEPARATOR,
  band,
  cell,
  dotsOf,
  encodeLine,
  encodeRows,
  encodeValue,
  layout,
  nearestPoint,
} from "./brailleShape";

describe("cells", () => {
  test("dots map to the Unicode braille block", () => {
    expect(cell(1)).toBe("⠁");
    expect(cell(7, 8)).toBe("⣀");
    expect(cell(1, 4)).toBe("⠉");
    expect(dotsOf(cell(1, 2, 5, 6))).toEqual([1, 2, 5, 6]);
    expect(BLANK).toBe(String.fromCharCode(0x2800));
  });

  test("MAIDR's four line bands at the boundaries", () => {
    const at = (p: number) => band(p / 100, "line");
    expect([0, 25, 26, 50, 51, 75, 76, 100].map(at)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(LINE_BANDS.map(dotsOf)).toEqual([[7, 8], [3, 6], [2, 5], [1, 4]]);
  });

  test("three heat-map bands on six dots", () => {
    const at = (p: number) => band(p / 100, "grid");
    expect([0, 33, 34, 66, 67, 100].map(at)).toEqual([0, 0, 1, 1, 2, 2]);
    expect(GRID_BANDS.flatMap(dotsOf).some((d) => d > 6)).toBe(false);
  });

  test("missing values are the blank cell; out-of-range values clamp", () => {
    expect(encodeValue(null)).toBe(BLANK);
    expect(encodeValue(Number.NaN)).toBe(BLANK);
    expect(encodeValue(-1)).toBe(LINE_BANDS[0]);
    expect(encodeValue(2)).toBe(LINE_BANDS[3]);
  });

  test("the continuation marker and row separator are no data cell", () => {
    const data = new Set([...LINE_BANDS, ...GRID_BANDS, BLANK]);
    expect(data.has(CONTINUES)).toBe(false);
    expect(data.has(ROW_SEPARATOR)).toBe(false);
  });
});

describe("rows", () => {
  test("heat-map rows are joined by the separator and numbered row by row", () => {
    const s = encodeRows([[0, 0.5, 1], [null, 0.2, 0.9]]);
    expect(s.cells).toEqual([GRID_BANDS[0], GRID_BANDS[1], GRID_BANDS[2], ROW_SEPARATOR, BLANK, GRID_BANDS[0], GRID_BANDS[2]]);
    expect(s.index).toEqual([0, 1, 2, null, 3, 4, 5]);
  });
});

describe("layout", () => {
  const values = Array.from({ length: 45 }, (_, i) => i / 44);

  test("wraps at the display width with a continuation marker", () => {
    const l = layout(encodeLine(values), 20, "Scale 0-1:");
    const lines = l.text.split("\n");
    expect(lines[0]).toBe("Scale 0-1:");
    expect(lines.slice(1).map((x) => [...x].length)).toEqual([20, 20, 7]);
    expect(lines[1].endsWith(CONTINUES)).toBe(true);
    expect(lines[3].endsWith(CONTINUES)).toBe(false);
  });

  test("caret offset and data point map both ways", () => {
    const l = layout(encodeLine(values), 20, "Scale 0-1:");
    for (const p of [0, 1, 18, 19, 20, 37, 38, 44]) expect(l.pointAt(l.offsetOf(p))).toBe(p);
    expect(l.pointAt(0)).toBeNull(); // the heading
    expect(l.pointAt(l.offsetOf(18) + 1)).toBeNull(); // the marker after point 18
    expect(nearestPoint(l, l.offsetOf(18) + 1, l.text.length)).toBe(18);
    expect(nearestPoint(l, 0, l.text.length)).toBe(0);
  });

  test("single-line fields join the lines with a space", () => {
    const l = layout(encodeLine(values), 40, "", false);
    expect(l.text.includes("\n")).toBe(false);
    expect(l.pointAt(l.offsetOf(44))).toBe(44);
  });

  test("width 40 holds 39 points per line (one cell for the marker)", () => {
    const l = layout(encodeLine(values), 40);
    expect([...l.text.split("\n")[0]].length).toBe(40);
  });
});
