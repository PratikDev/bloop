import { seededRandom } from "@/lib/seeded-random";

export type StarDensity = "sparse" | "normal";

export interface Star {
  /** Percentages, so a star stays the same size in any window. */
  x: string;
  y: string;
  radius: number;
  warm: boolean;
  /** CSS durations, for the few stars that twinkle. */
  twinkle: { duration: string; delay: string } | null;
}

export interface Sparkle {
  x: string;
  y: string;
  /** Tip to centre, px. */
  reach: number;
}

export interface Sky {
  stars: Star[];
  sparkles: Sparkle[];
}

const COUNTS: Record<StarDensity, { paper: number; warm: number; sparkles: number }> = {
  normal: { paper: 120, warm: 10, sparkles: 5 },
  sparse: { paper: 60, warm: 5, sparkles: 3 },
};
const SEED = 20261113;
/** One star in this many twinkles: 14%, under the 15% limit. */
const TWINKLE_EVERY = 7;
const TWINKLE_SECONDS = { min: 4, max: 7 };
/** Sparkles keep clear of the sides, where two tiles of the sky meet. */
const SPARKLE_MARGIN = 4;

const percent = (share: number) => `${(share * 100).toFixed(2)}%`;

/** The same sky every time for a given density, so server and client markup match. */
export function buildSky(density: StarDensity): Sky {
  const random = seededRandom(SEED);
  const { paper, warm, sparkles } = COUNTS[density];
  const stars = Array.from({ length: paper + warm }, (_, i): Star => {
    const span = TWINKLE_SECONDS.max - TWINKLE_SECONDS.min;
    return {
      x: percent(random()),
      y: percent(random()),
      radius: 1 + Math.round(random() * 2) / 2,
      warm: i >= paper,
      twinkle: i % TWINKLE_EVERY === 0 ? { duration: `${(TWINKLE_SECONDS.min + random() * span).toFixed(2)}s`, delay: `${(-random() * TWINKLE_SECONDS.max).toFixed(2)}s` } : null,
    };
  });
  const usable = 1 - (2 * SPARKLE_MARGIN) / 100;
  const inset = SPARKLE_MARGIN / 100;
  return {
    stars,
    sparkles: Array.from({ length: sparkles }, () => ({
      x: percent(inset + random() * usable),
      y: percent(inset + random() * usable),
      reach: 5 + Math.round(random() * 2),
    })),
  };
}

/** A four-point star around the origin: flat, no glow. */
export function sparklePath(reach: number): string {
  const waist = 1;
  return `M0,${-reach}L${waist},${-waist}L${reach},0L${waist},${waist}L0,${reach}L${-waist},${waist}L${-reach},0L${-waist},${-waist}Z`;
}
