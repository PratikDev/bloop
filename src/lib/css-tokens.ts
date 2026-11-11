// Canvas code can't use Tailwind classes, so it reads the same colour tokens
// from globals.css at runtime. Colours are declared once, in CSS.

const TOKENS = [
  "night",
  "dusk",
  "tide",
  "land",
  "line",
  "moon",
  "haze",
  "shapla",
  "ink",
  "studio-top",
  "studio-bottom",
  "studio-glow",
  "anodised",
  "deck-glass",
  "vinyl",
  "metal",
  "label",
  "label-ink",
  "amber",
  "atmosphere",
  "sun-glint",
  "terminator-warm",
  "geo-border",
  "geo-district",
  "geo-river",
  "geo-graticule",
] as const;

type ColorToken = (typeof TOKENS)[number];

export type Palette = Record<ColorToken, string>;

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

/** Stops in each low-vision re-colour scale (globals.css --lv-lum-0 … --lv-lum-9, --lv-cividis-0 … 9). */
export const LV_STOPS = 10;

/** Reads CSS variables from <html> now (canvas code: the low-vision bands, labels and coastlines). */
export function cssVarReader(): (name: string) => string {
  const style = getComputedStyle(document.documentElement);
  return (name) => style.getPropertyValue(name).trim();
}
