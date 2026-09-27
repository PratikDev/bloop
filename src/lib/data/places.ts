// Fixed places and paths the app sonifies. These are positions, not data values.

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Sweep centre: Chattogram, the team's home city. It is on the Bay of Bengal
 * coast, so the sweep has ocean and monsoon sound from the first ring (Dhaka,
 * the plan's original centre, is inland). Team decision, 27 Sep.
 */
export const SWEEP_CENTER: LatLon = { lat: 22.36, lon: 91.78 };

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

/** Sweep rings around the centre (design choice; rings are spaced in degrees). */
export const SWEEP_RINGS = { stepDeg: 5, maxDeg: 45, pointsPerRing: 16 } as const;
