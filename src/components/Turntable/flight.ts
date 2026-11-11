// Fly-to: the needle's place and the camera distance move together on an eased
// arc (the camera rises mid-flight and comes down at the target), taking the
// short way round in longitude.

import { wrapLon } from "@/lib/data";

export const FLIGHT_MS = 1200;
const MAX_ARC = 1.6; // extra camera distance at mid-flight, globe radii

export interface FlightPose {
  lat: number;
  lon: number;
  distance: number;
}

export interface Flight {
  sample(now: number): FlightPose & { done: boolean };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createFlight(from: FlightPose, to: FlightPose, now: number, durationMs = FLIGHT_MS): Flight {
  const dLon = wrapLon(to.lon - from.lon);
  const dLat = to.lat - from.lat;
  const arc = Math.min(MAX_ARC, Math.hypot(dLat, dLon) / 60);
  return {
    sample(t) {
      const x = durationMs <= 0 ? 1 : Math.min(1, (t - now) / durationMs);
      const e = easeInOut(x);
      return {
        lat: from.lat + dLat * e,
        lon: wrapLon(from.lon + dLon * e),
        distance: from.distance + (to.distance - from.distance) * e + arc * Math.sin(Math.PI * x),
        done: x >= 1,
      };
    },
  };
}
