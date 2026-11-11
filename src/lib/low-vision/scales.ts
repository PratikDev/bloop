import { LV_STOPS } from "@/lib/css-tokens";
import { contrast } from "./contrast";
import type { Scheme } from "./settings";

const SCALE_VAR = { luminance: "--lv-lum", cividis: "--lv-cividis" } as const;

export function bandVars(scheme: Scheme, n: number): string[] {
  if (scheme === "twoTone") return Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "--lv-two-b" : "--lv-two-a"));
  const base = scheme === "cividis" ? SCALE_VAR.cividis : SCALE_VAR.luminance;
  return Array.from({ length: n }, (_, i) => `${base}-${n === 1 ? LV_STOPS - 1 : Math.round((i * (LV_STOPS - 1)) / (n - 1))}`);
}

export const resolveVars = (vars: readonly string[], read: (name: string) => string) => vars.map((v) => read(v).trim());

export const labelOn = (fill: string, light = "#ffffff", dark = "#000000") => (contrast(fill, light) >= contrast(fill, dark) ? light : dark);
