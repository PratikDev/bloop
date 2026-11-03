// Data as 8-dot Unicode braille (the Braille Data Explorer's shape line). The encoding is MAIDR's
// (Seo et al., CHI 2024, arXiv 2403.00717): four height bands on 8 dots for a line of values, three
// bands on 6 dots plus a row separator for heat-map rows. Ideas only, no MAIDR code (it is GPL-3.0).
// Pure functions: values are already normalised to t in [0, 1] on the record's shared scale (the
// scale the sound uses), so a braille line never auto-scales away a real difference.

/** U+2800: the blank cell. It means "no data here". */
export const BLANK = "⠀";

/** Dot number (1–8) → its bit in the Unicode braille block. */
const DOT_BIT: Record<number, number> = { 1: 0x01, 2: 0x02, 3: 0x04, 4: 0x08, 5: 0x10, 6: 0x20, 7: 0x40, 8: 0x80 };

/** The cell with exactly these dots raised. */
export function cell(...dots: number[]): string {
  return String.fromCharCode(0x2800 + dots.reduce((bits, d) => bits | DOT_BIT[d], 0));
}

/** The dots a cell raises (inverse of cell), for tests and the visual preview. */
export function dotsOf(ch: string): number[] {
  const bits = ch.charCodeAt(0) - 0x2800;
  return [1, 2, 3, 4, 5, 6, 7, 8].filter((d) => bits & DOT_BIT[d]);
}

/** Line bands, low to high: dots 7-8 (0–25 %), 3-6 (26–50 %), 2-5 (51–75 %), 1-4 (76–100 %). */
export const LINE_BANDS = [cell(7, 8), cell(3, 6), cell(2, 5), cell(1, 4)] as const;
/** Heat-map bands on six dots: 3-6 (0–33 %), 2-5 (34–66 %), 1-4 (67–100 %). */
export const GRID_BANDS = [cell(3, 6), cell(2, 5), cell(1, 4)] as const;
/** Between heat-map rows: dots 1-2-5-6. */
export const ROW_SEPARATOR = cell(1, 2, 5, 6);
/** Ends a wrapped line that continues on the next: all eight dots, a cell no data value uses. */
export const CONTINUES = cell(1, 2, 3, 4, 5, 6, 7, 8);

/** Upper bounds (whole percent, inclusive) of each band but the last. */
const LINE_UPPER = [25, 50, 75] as const;
const GRID_UPPER = [33, 66] as const;

/** t in [0, 1] → band index. Whole percent, so 25 % is the first band and 26 % the second (MAIDR's limits). */
export function band(t: number, bands: "line" | "grid"): number {
  const p = Math.round(Math.min(1, Math.max(0, t)) * 100);
  const upper = bands === "line" ? LINE_UPPER : GRID_UPPER;
  const i = upper.findIndex((u) => p <= u);
  return i === -1 ? upper.length : i;
}

/** One value → its cell; null (no data) → the blank cell. */
export function encodeValue(t: number | null, bands: "line" | "grid" = "line"): string {
  if (t === null || !Number.isFinite(t)) return BLANK;
  return (bands === "line" ? LINE_BANDS : GRID_BANDS)[band(t, bands)];
}

/** A sequence of cells and, for each, the data point it shows (null for separators and markers). */
export interface Cells {
  cells: string[];
  index: (number | null)[];
}

/** A line of values: one cell per data point. */
export function encodeLine(ts: readonly (number | null)[]): Cells {
  return { cells: ts.map((t) => encodeValue(t, "line")), index: ts.map((_, i) => i) };
}

/** Heat-map rows (north to south, west to east), joined by the row separator; points are numbered row by row. */
export function encodeRows(rows: readonly (readonly (number | null)[])[]): Cells {
  const out: Cells = { cells: [], index: [] };
  let n = 0;
  rows.forEach((row, r) => {
    if (r > 0) {
      out.cells.push(ROW_SEPARATOR);
      out.index.push(null);
    }
    for (const t of row) {
      out.cells.push(encodeValue(t, "grid"));
      out.index.push(n++);
    }
  });
  return out;
}

/** The text a shape field holds, and the map between caret offsets and data points. */
export interface ShapeLayout {
  text: string;
  /** Caret offset → data point (null when the caret is on the heading, a separator, a marker or a line break). */
  pointAt(offset: number): number | null;
  /** Data point → the caret offset of its cell. */
  offsetOf(point: number): number;
}

/**
 * Lays the cells out for a display `width` cells wide: an optional heading line first (the stated scale),
 * then the cells wrapped at `width`, each full line but the last ending in CONTINUES. With `multiline` false
 * (an <input>), the lines are joined by a space instead of a line break.
 */
export function layout(shape: Cells, width: number, heading = "", multiline = true): ShapeLayout {
  const perLine = Math.max(1, width - 1);
  const breakChar = multiline ? "\n" : " ";
  const parts: { text: string; point: number | null }[] = [];
  if (heading) parts.push({ text: heading, point: null }, { text: breakChar, point: null });
  for (let i = 0; i < shape.cells.length; i++) {
    if (i > 0 && i % perLine === 0) parts.push({ text: CONTINUES, point: null }, { text: breakChar, point: null });
    parts.push({ text: shape.cells[i], point: shape.index[i] });
  }
  const offsets: number[] = [];
  const pointByOffset: (number | null)[] = [];
  let text = "";
  for (const p of parts) {
    for (const ch of p.text) {
      pointByOffset.push(p.point);
      if (p.point !== null) offsets[p.point] = text.length;
      text += ch;
    }
  }
  return {
    text,
    pointAt: (offset) => pointByOffset[offset] ?? null,
    offsetOf: (point) => offsets[point] ?? 0,
  };
}

/** The data point nearest a caret offset (ahead wins a tie): a caret on the heading, a marker or a break lands on a real point. */
export function nearestPoint(shape: ShapeLayout, offset: number, length: number): number | null {
  for (let d = 0; d <= length; d++) {
    const ahead = shape.pointAt(offset + d);
    if (ahead !== null) return ahead;
    const behind = shape.pointAt(offset - d);
    if (behind !== null) return behind;
  }
  return null;
}
