// Where the sun is overhead at a given time (the subsolar point), for the day /
// night terminator on the globe. Low-precision solar coordinates (Astronomical
// Almanac, good to ~0.01°) and Greenwich mean sidereal time. Decoration only.

import { wrapLon } from "@/lib/data/grid";
import type { LatLon } from "@/lib/data/places";

const RAD = Math.PI / 180;
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const DAY_MS = 86_400_000;

const wrap360 = (deg: number) => ((deg % 360) + 360) % 360;

export function subsolarPoint(date: Date): LatLon {
  const n = (date.getTime() - J2000_MS) / DAY_MS; // days since J2000.0
  const meanLon = wrap360(280.46 + 0.9856474 * n);
  const meanAnomaly = wrap360(357.528 + 0.9856003 * n) * RAD;
  const eclipticLon = (meanLon + 1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLon));
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLon), Math.cos(eclipticLon)) / RAD;
  const gmst = wrap360(280.46061837 + 360.98564736629 * n);
  return { lat: declination / RAD, lon: wrapLon(rightAscension - gmst) };
}
