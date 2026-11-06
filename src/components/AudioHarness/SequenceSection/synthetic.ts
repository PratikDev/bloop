import type { SweepPoint } from "@/lib/audio";

/** Test paths for the harness only (L3 builds the real ones from valueAt()). */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 60 points: ocean 30 → 5 °C, west → east, light → heavier rain; every 15th point has no data. */
export function syntheticSweep(n = 60): SweepPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const noData = i % 15 === 14;
    return {
      lat: 0,
      lon: lerp(-180, 180, t),
      valueC: noData ? null : lerp(30, 5, t),
      mmPerHour: noData ? null : lerp(0.3, 20, t),
      phase: noData ? "nodata" : "liquid",
    };
  });
}

/** 20 points drifting north-east over warm water with a little rain, like the Bay of Bengal path. */
export function syntheticOpening(n = 20): SweepPoint[] {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { lat: lerp(4, 21.5, t), lon: lerp(82, 89.8, t), valueC: lerp(29.5, 27, t), mmPerHour: lerp(1, 8, t), phase: "liquid" };
  });
}
