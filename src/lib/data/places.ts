// Fixed places and paths the app sonifies. These are positions, not data values.

export interface LatLon {
  lat: number;
  lon: number;
}

/** Sweep centre (docs/L2/BUILD_PLAN.md Phase 4). */
export const DHAKA: LatLon = { lat: 23.81, lon: 90.41 };

/** Where the cursor starts: the northern Bay of Bengal (design choice). */
export const START_CURSOR: LatLon = { lat: 21.5, lon: 89.8 };

/**
 * Opening (C1) path over the Bay of Bengal, south to north (design choice):
 * from south of Sri Lanka up to the Sundarbans coast.
 */
export const OPENING_PATH: { from: LatLon; to: LatLon; points: number } = {
  from: { lat: 4, lon: 82 },
  to: { lat: 21.5, lon: 89.8 },
  points: 20,
};

/**
 * Motif latitude bands, south to north, from mapping.json's "motif" note
 * (60°S–30°S, 30°S–0°, 0°–30°N, 30°N–60°N; L2's design choice).
 */
export const MOTIF_BANDS: readonly [number, number][] = [
  [-60, -30],
  [-30, 0],
  [0, 30],
  [30, 60],
];

/** Sweep rings around Dhaka (design choice; rings are spaced in degrees). */
export const SWEEP_RINGS = { stepDeg: 5, maxDeg: 45, pointsPerRing: 16 } as const;
