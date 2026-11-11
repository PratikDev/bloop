"use client";

import { useState } from "react";
import type { LatLon } from "@/lib/data";
import { parseCoordinate, parseLatLon, type CoordAxis } from "@/lib/geo";
import { formatAxis, type Lang } from "@/lib/i18n";

export const AXES: readonly CoordAxis[] = ["lat", "lon"];

const ERRORS = { lat: "goto.badLat", lon: "goto.badLon" } as const satisfies Record<CoordAxis, string>;

/**
 * The Go to form: two fields, latitude and longitude, written in the page's
 * language (Bengali digits in Bangla; either kind is read back). A pair pasted
 * into either one fills both. submit() hands a valid place to `onGo`, or keeps
 * the first field that isn't one (with its message) and returns it.
 */
export function useGoToForm(lang: Lang, onGo: (place: LatLon) => void) {
  const [values, setValues] = useState<Record<CoordAxis, string>>({ lat: "", lon: "" });
  const [invalid, setInvalid] = useState<CoordAxis | null>(null);
  // A field's text for a value: up to two decimals, in the page's digits.
  const shown = (place: LatLon) => ({ lat: formatAxis(place.lat, lang), lon: formatAxis(place.lon, lang) });

  return {
    values,
    invalid,
    error: invalid && ERRORS[invalid],
    /** Starts again from where the cursor is. */
    reset(at: LatLon) {
      setValues(shown(at));
      setInvalid(null);
    },
    change(axis: CoordAxis, text: string) {
      const pair = parseLatLon(text);
      setValues((v) => (pair ? shown(pair) : { ...v, [axis]: text }));
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
