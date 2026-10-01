"use client";

import { useState } from "react";
import type { LatLon } from "@/lib/data";
import { parseCoordinate, parseLatLon, type CoordAxis } from "@/lib/geo";

export const AXES: readonly CoordAxis[] = ["lat", "lon"];

const ERRORS = { lat: "goto.badLat", lon: "goto.badLon" } as const satisfies Record<CoordAxis, string>;

/** A field's starting text: the cursor's value, up to two decimals. */
const shown = (v: number) => String(Math.round(v * 100) / 100);

/**
 * The Go to form: two fields, latitude and longitude. A pair pasted into
 * either one fills both. submit() hands a valid place to `onGo`, or keeps the
 * first field that isn't one (with its message) and returns it.
 */
export function useGoToForm(onGo: (place: LatLon) => void) {
  const [values, setValues] = useState<Record<CoordAxis, string>>({ lat: "", lon: "" });
  const [invalid, setInvalid] = useState<CoordAxis | null>(null);

  return {
    values,
    invalid,
    error: invalid && ERRORS[invalid],
    /** Starts again from where the cursor is. */
    reset(at: LatLon) {
      setValues({ lat: shown(at.lat), lon: shown(at.lon) });
      setInvalid(null);
    },
    change(axis: CoordAxis, text: string) {
      const pair = parseLatLon(text);
      setValues((v) => (pair ? { lat: String(pair.lat), lon: String(pair.lon) } : { ...v, [axis]: text }));
      if (pair || invalid === axis) setInvalid(null);
    },
    submit(): CoordAxis | null {
      const lat = parseCoordinate(values.lat, "lat");
      const lon = parseCoordinate(values.lon, "lon");
      const bad = lat === null ? "lat" : lon === null ? "lon" : null;
      setInvalid(bad);
      if (lat !== null && lon !== null) onGo({ lat, lon });
      return bad;
    },
  };
}
