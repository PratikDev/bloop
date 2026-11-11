import file from "../../../public/data/meta/colormap_invariance.json";

interface Spread {
  median_spread_C: number;
  p10_spread_C: number;
  mode_counts: number[];
  mode_spread_C: number[] | null;
}

export interface InvarianceCase {
  box: string;
  region: string;
  date: string;
  pixels: number;
  sigma_C: number;
  truth: { median: number; modes: number[] };
  maps: Record<string, { median: number; modes: number[]; abs_err_median: number }>;
  clean: Spread;
  jpeg75_reported: Spread;
  hue_L1: Record<string, number>;
  figure: string;
}

export const INVARIANCE: { generated_by: string; sigma_source: string; cases: InvarianceCase[] } = file;

export function largestSpread(cases: readonly InvarianceCase[] = INVARIANCE.cases) {
  return {
    median: Math.max(...cases.map((c) => c.clean.median_spread_C)),
    mode: Math.max(...cases.flatMap((c) => c.clean.mode_spread_C ?? [])),
    jpegP10: Math.max(...cases.map((c) => c.jpeg75_reported.p10_spread_C)),
    sigma: cases[0]?.sigma_C ?? Number.NaN,
  };
}
