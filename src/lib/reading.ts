// What the cursor is over, as text: used by the readout, the map's text
// alternative, the live region and speech, so they always say the same thing.

import type { TrackMode } from "@/lib/audio-adapter/types";
import { valueAt, type LatLon, type LiveFields } from "@/lib/data";
import type { BoundT } from "@/lib/i18n";
import type { OceanValue, RainValue } from "@/types/data-contract";

export interface Reading {
  ocean: OceanValue;
  rain: RainValue;
  rainLoaded: boolean;
}

export function readAt(fields: LiveFields, at: LatLon): Reading {
  return {
    ocean: valueAt(fields, "ocean", at.lat, at.lon),
    rain: valueAt(fields, "rain", at.lat, at.lon),
    rainLoaded: fields.rain !== null,
  };
}

export function oceanText(t: BoundT, v: OceanValue): string {
  return v.valueC === null ? t("reading.oceanNone") : t("reading.oceanValue", { valueC: v.valueC });
}

export function rainText(t: BoundT, v: RainValue, loaded: boolean): string {
  if (!loaded) return t("reading.rainLoading");
  if (v.phase === "nodata" || v.mmPerHour === null) return t("reading.rainNone");
  if (v.phase === "dry") return t("reading.dry");
  return t("reading.rainValue", { mmPerHour: v.mmPerHour, frozen: v.phase === "frozen" });
}

function oceanSpoken(t: BoundT, v: OceanValue): string {
  return v.valueC === null ? t("speak.oceanNone") : t("speak.ocean", { valueC: v.valueC });
}

function rainSpoken(t: BoundT, v: RainValue, loaded: boolean): string {
  if (!loaded) return t("reading.rainLoading");
  if (v.phase === "nodata" || v.mmPerHour === null) return t("speak.rainNone");
  if (v.phase === "dry") return t("speak.dry");
  return t("speak.rain", { mmPerHour: v.mmPerHour, frozen: v.phase === "frozen" });
}

/** The reading for the current track, as short screen text ("28.4 °C; Dry"). */
export function readingText(t: BoundT, r: Reading, track: TrackMode): string {
  const parts: string[] = [];
  if (track !== "rain") parts.push(oceanText(t, r.ocean));
  if (track !== "ocean") parts.push(rainText(t, r.rain, r.rainLoaded));
  return parts.join("; ");
}

/** The full sentence spoken on Enter: value(s) and place. */
export function spokenReading(t: BoundT, r: Reading, track: TrackMode, at: LatLon): string {
  const parts: string[] = [];
  if (track !== "rain") parts.push(oceanSpoken(t, r.ocean));
  if (track !== "ocean") parts.push(rainSpoken(t, r.rain, r.rainLoaded));
  return t("speak.value", { reading: parts.join(". "), place: t("place.spoken", at) });
}
