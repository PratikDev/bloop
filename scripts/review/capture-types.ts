import type { Measured } from "./measure.ts";

export interface Result extends Measured {
  axe: string[];
  consoleErrors: string[];
}

export interface Report {
  generated: string;
  commit: string;
  /** path → "WxH" → result */
  pages: Record<string, Record<string, Result>>;
  /** state name → result (1440×900) */
  states: Record<string, Result>;
}
