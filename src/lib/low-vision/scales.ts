// PURE: a band's colour in each low-vision scheme, as the CSS variable that
// holds it (globals.css), and the label colour that reads best on a fill. HTML swatches use the variables directly;
// canvas code resolves them when it draws, so a theme change is always picked up.
import { LV_STOPS } from "@/lib/css-tokens";
import { contrast } from "./contrast";
import type { Scheme } from "./settings";

const SCALE_VAR = { luminance: "--lv-lum", cividis: "--lv-cividis" } as const;

/** The CSS variable of each of `n` bands, low to high. NASA's colours (no re-colouring) use the luminance scale for the lens. */
export function bandVars(scheme: Scheme, n: number): string[] {
  if (scheme === "twoTone") return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "--lv-two-b" : "--lv-two-a"));
  const base = scheme === "cividis" ? SCALE_VAR.cividis : SCALE_VAR.luminance;
  // n stops spread evenly over the ten, ends included.
  return Array.from({ length: n }, (_, i) => `${base}-${n === 1 ? LV_STOPS - 1 : Math.round((i * (LV_STOPS - 1)) / (n - 1))}`);
}

/** The variables' values (canvas drawing). */
export const resolveVars = (vars: readonly string[], read: (name: string) => string) => vars.map((v) => read(v).trim());

/** Black or white, whichever has more contrast on `fill` (band labels on the map and in the lens). */
export const labelOn = (fill: string, light = "#ffffff", dark = "#000000") => (contrast(fill, light) >= contrast(fill, dark) ? light : dark);
