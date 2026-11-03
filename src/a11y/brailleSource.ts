// What the Braille Data Explorer reads: one contract for every record (today's live frames, official and
// related records), so a new record only adapts to it. Braille, text and sound share one cursor: the point
// the explorer shows is the point the needle plays.

import { continuousRule, normalise } from "@/lib/audio/mapping";
import type { LatLon } from "@/lib/data";
import { brailleNumber, brailleUnit, clean, type DegreeStyle } from "./brailleText";
import { encodeLine, encodeRows, type Cells } from "./brailleShape";

/** What the shape line runs along: time at the needle, the needle's latitude west to east, or the 3×3 around it. */
export type ShapeMode = "time" | "path" | "grid";
export const SHAPE_MODES: readonly ShapeMode[] = ["time", "path", "grid"];

/** Each mode's name (lib/i18n/en/braille.ts). */
export const SHAPE_MODE_LABELS = {
  time: "braille.mode.time",
  path: "braille.mode.path",
  grid: "braille.mode.grid",
} as const satisfies Record<ShapeMode, string>;

/** The shared scale: the same input range the sound uses (mapping.json), never fitted to one line. */
export interface ShapeScale {
  min: number;
  max: number;
  scale: "linear" | "log";
  unit: string;
}

/** One data point on the shape line. */
export interface ShapePoint {
  value: number | null; // null = no data (blank cell)
  at: LatLon;
  step: number; // time step (frame) of this point
}

export interface ShapeView {
  mode: ShapeMode;
  points: ShapePoint[];
  /** Grid mode: points per row (rows run north to south). */
  columns?: number;
  /** The point the needle is on now. */
  current: number;
}

/** A voice the record plays, as the explorer offers it (several when a record plays more than one). */
export interface ShapeChannel {
  id: string;
  label: string;
}

/** The text settings a source needs to write its lines. */
export interface LineSettings {
  degree: DegreeStyle;
}

export interface BrailleSource {
  key: string;
  channels: readonly ShapeChannel[];
  /** The modes this record offers; the first is the one chosen automatically. */
  modes(channel: string): readonly ShapeMode[];
  scale(channel: string): ShapeScale;
  /** null while the mode's data loads. */
  view(channel: string, mode: ShapeMode): ShapeView | null;
  /** Short, front-loaded: "Rain 12 mm/h 21.5N 89.8E 14:30 obs live" (a relative or pattern-only record says so first). */
  valueLine(channel: string, mode: ShapeMode, s: LineSettings): string;
  /** The same value in words (literary braille), for review. */
  reviewLine(channel: string, mode: ShapeMode, s: LineSettings): string;
  /** True when the values are relative or a pattern only: the shape line is then a "relative shape". */
  relative: boolean;
  /** Moves the needle (and, in time mode, the frame) to a point; the sound follows. */
  go(channel: string, mode: ShapeMode, point: ShapePoint): void;
  /** Starts loading what a mode needs (e.g. the rain sequence); called when the mode is shown. */
  prepare?(channel: string, mode: ShapeMode): void;
}

/** A voice's shared scale from mapping.json; `fallback` when the voice has no continuous rule. */
export function voiceScale(voice: string, fallback: ShapeScale): ShapeScale {
  try {
    const { input } = continuousRule(voice);
    return { min: input.min, max: input.max, scale: input.scale, unit: input.unit };
  } catch {
    return fallback;
  }
}

/** A value's position on the scale, 0..1; null for no data. On a log scale, zero (dry) is the bottom, not missing. */
export function positionOn(scale: ShapeScale, value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (scale.scale === "log" && value <= 0) return 0;
  return normalise(value, scale);
}

/** The view as braille cells (grid mode in rows with separators). */
export function cellsOf(view: ShapeView, scale: ShapeScale): Cells {
  const ts = view.points.map((p) => positionOn(scale, p.value));
  if (view.mode !== "grid" || !view.columns) return encodeLine(ts);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < ts.length; i += view.columns) rows.push(ts.slice(i, i + view.columns));
  return encodeRows(rows);
}

/** Significant digits for a scale end ("0.1", "50", "-5"). */
export function scaleNumber(v: number): string {
  const decimals = v === 0 ? 0 : Math.max(0, 2 - Math.floor(Math.log10(Math.abs(v))));
  const n = brailleNumber(Number(v.toPrecision(3)), Math.min(decimals, 3));
  return n.includes(".") ? n.replace(/0+$/u, "").replace(/\.$/u, "") : n;
}

/** The heading line: "Scale -5 to 35 deg C:" (log scales say so). */
export function scaleHeading(scale: ShapeScale, degree: DegreeStyle, prefix: string): string {
  const log = scale.scale === "log" ? " log" : "";
  return clean(`${prefix} ${scaleNumber(scale.min)} to ${scaleNumber(scale.max)} ${brailleUnit(scale.unit, degree)}${log}:`);
}

/** The index of the point nearest a needle position (time: the current step). */
export function nearestIndex(points: readonly ShapePoint[], at: LatLon, step: number, mode: ShapeMode): number {
  if (!points.length) return 0;
  const d = (p: ShapePoint) =>
    mode === "time" ? Math.abs(p.step - step) : Math.hypot(p.at.lat - at.lat, ((((p.at.lon - at.lon) % 360) + 540) % 360) - 180);
  return points.reduce((best, p, i) => (d(p) < d(points[best]) ? i : best), 0);
}
