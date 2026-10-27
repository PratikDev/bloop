// Colour scales for scene data (not interface chrome). ColorBrewer 2.0 by
// Cynthia Brewer (Apache License 2.0): 11-class diverging schemes, ordered
// low → high. RdBu is flipped so that lower is blue and higher is red.

import type { LegendStop } from "./SceneShell/SceneLegend";

export type Rgb = [number, number, number];

const hex = (h: string): Rgb => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const DIVERGING = {
  /** Lower = blue, higher = red (heat). */
  blueRed: ["#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0", "#f7f7f7", "#fddbc7", "#f4a582", "#d6604d", "#b2182b", "#67001f"].map(hex),
  /** Lower = brown, higher = teal (rain, water). */
  brownTeal: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"].map(hex),
} as const satisfies Record<string, Rgb[]>;

export type DivergingName = keyof typeof DIVERGING;

/** t in [0, 1] → colour, linear between the scheme's classes. */
export function sampleScale(scale: readonly Rgb[], t: number): Rgb {
  const x = Math.min(1, Math.max(0, t)) * (scale.length - 1);
  const i = Math.min(scale.length - 2, Math.floor(x));
  const f = x - i;
  return [0, 1, 2].map((c) => Math.round(scale[i][c] + (scale[i + 1][c] - scale[i][c]) * f)) as Rgb;
}

export const rgbCss = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;

/** The scheme as legend stops. */
export const legendStops = (scale: readonly Rgb[]): LegendStop[] => scale.map((c, i) => ({ at: i / (scale.length - 1), colour: rgbCss(c) }));

/** The scheme as a flat [r, g, b, …] array in 0..1, for a shader uniform. */
export const scaleUniform = (scale: readonly Rgb[]): number[] => scale.flatMap((c) => c.map((v) => v / 255));
