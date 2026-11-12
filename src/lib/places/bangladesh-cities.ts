import type { LatLon } from "@/lib/data";
import type { ClimateCellName } from "@/types/data-contract";

/** Where each Then vs Now city is on the globe. */
export const CITY_POSITIONS: Record<ClimateCellName, LatLon> = {
  Dhaka: { lat: 23.81, lon: 90.41 },
  Chattogram: { lat: 22.36, lon: 91.78 },
  Rajshahi: { lat: 24.37, lon: 88.6 },
  Sylhet: { lat: 24.9, lon: 91.87 },
};
