import { describe, expect, test } from "bun:test";
import { latLonToSphere, sphereHitToLatLon } from "./sphere";

// "Exact" here means equal to within 1e-9° (floating-point trig, not rounding).
const EXACT_DEG = 1e-9;
const ROUND_TRIP_DEG = 0.01;

/** Shortest angular distance between two longitudes, in degrees. */
function lonDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function roundTrip(lat: number, lon: number) {
  return sphereHitToLatLon(latLonToSphere(lat, lon));
}

describe("latLonToSphere → sphereHitToLatLon", () => {
  test("1,000 random points round-trip within 0.01°", () => {
    // A fixed-seed generator, so a failure can be reproduced.
    let seed = 20261027;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    let worst = 0;
    for (let i = 0; i < 1000; i++) {
      const lat = -89.9 + random() * 179.8;
      const lon = -180 + random() * 360;
      const back = roundTrip(lat, lon);
      worst = Math.max(worst, Math.abs(back.lat - lat), lonDiff(back.lon, lon));
    }
    expect(worst).toBeLessThan(ROUND_TRIP_DEG);
  });

  test("(0, 0) is exact", () => {
    const back = roundTrip(0, 0);
    expect(Math.abs(back.lat)).toBeLessThan(EXACT_DEG);
    expect(Math.abs(back.lon)).toBeLessThan(EXACT_DEG);
  });

  test("(0, 180) and (0, −180) are the same meridian", () => {
    const east = latLonToSphere(0, 180);
    const west = latLonToSphere(0, -180);
    expect(Math.hypot(east.x - west.x, east.y - west.y, east.z - west.z)).toBeLessThan(1e-12);
    for (const back of [roundTrip(0, 180), roundTrip(0, -180)]) {
      expect(Math.abs(back.lat)).toBeLessThan(EXACT_DEG);
      expect(back.lon).toBe(-180); // the grid's column 0
    }
  });

  test.each([
    ["near the north pole", 89.9, 0],
    ["near the south pole", -89.9, 0],
    ["Dhaka", 23.81, 90.41],
    ["Bay of Bengal", 18.0, 88.0],
  ])("%s (%d, %d) is exact", (_name, lat, lon) => {
    const back = roundTrip(lat, lon);
    expect(Math.abs(back.lat - lat)).toBeLessThan(EXACT_DEG);
    expect(lonDiff(back.lon, lon)).toBeLessThan(EXACT_DEG);
  });

  test("radius doesn't change the reading", () => {
    const back = sphereHitToLatLon(latLonToSphere(18, 88, 3.7));
    expect(Math.abs(back.lat - 18)).toBeLessThan(EXACT_DEG);
    expect(lonDiff(back.lon, 88)).toBeLessThan(EXACT_DEG);
  });
});
