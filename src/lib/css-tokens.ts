// Canvas code can't use Tailwind classes, so it reads the same colour tokens
// from globals.css at runtime. Colours are declared once, in CSS.

export type ColorToken = "night" | "dusk" | "tide" | "land" | "line" | "moon" | "haze" | "shapla" | "ink";

export type Palette = Record<ColorToken, string>;

const TOKENS: readonly ColorToken[] = ["night", "dusk", "tide", "land", "line", "moon", "haze", "shapla", "ink"];

export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const palette = {} as Palette;
  for (const token of TOKENS) palette[token] = style.getPropertyValue(`--${token}`).trim();
  return palette;
}

/** "#rrggbb" → [r, g, b], for writing pixels. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
