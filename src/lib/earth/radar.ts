// NASA's own method (P5): the radar sweep of SVS 13786 "Data Sonification: Caldwell 73" (SYSTEM Sounds, M. Russo and
// A. Santaguida), applied to one Earth frame (the latest EIC ocean temperature) around a centre. Pure.
//   NASA mode: a line turns about the centre at the movie's own angular speed (the manifest's analysis); a point sounds
//     when the line reaches it, its DISTANCE from the centre sets its pitch (the "radarDistance" rule), and its colour
//     class sets the instrument (cool: glockenspiel, warm: marimba, the rest: a choir-like pad), as NASA describes.
//   Bloop mode: the same points, a ring growing outward over the same time: DISTANCE sets the time, the VALUE sets the
//     pitch (the Ocean rule, unchanged).
// "NASA's version: where things are. Bloop's version: what the values are." Not NASA's code: radial-sweep.ts is Bloop's.

import { radialSweep, type SweepEvent } from "@/lib/audio-jukebox/radial-sweep";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { oceanAt, type SstField } from "@/lib/data/latest";
import { clampLat, wrapLon } from "@/lib/data/grid";
import type { LatLon } from "@/lib/data";
import type { OfficialManifest } from "@/types/data-contract";

export const RADAR_VOICE = "radarDistance";
/** The voice Bloop mode plays (the frame NASA's method is applied to): Earth Orchestra files the record under it. */
export const RADAR_APPLIED_VOICE = "ocean";
/** The method record (official/index.json, kind "method"). */
export const RADAR_RECORD = "sonification_13786";
const OCEAN_VOICE = RADAR_APPLIED_VOICE;
const KM_PER_DEG = 111.2;
/** Sampling: rings out to the rule's own range, and spokes around (design choices). */
const RINGS = 10;
const SPOKES = 24;
const FULL_TURN = 360;
/** North is up: on screen (+y down) north is −90°, i.e. 270°. */
const NORTH_DEG = 270;

export type RadarMode = "nasa" | "bloop";

/** SVS 13786's manifest: a method record (kind "method", no layers) with the movie's measured sweep. */
export interface MethodManifest extends OfficialManifest {
  kind?: "method";
  analysis?: { angular_speed_deg_s: number; centre_px: number[]; stars: Record<string, number> };
}
export type Instrument = "glockenspiel" | "marimba" | "choir";

export interface RadarPoint {
  lat: number;
  lon: number;
  km: number;
  /** east and south in km from the centre (screen coordinates). */
  x: number;
  y: number;
  valueC: number;
}

export interface RadarNote {
  timeSec: number;
  hz: number;
  instrument: Instrument;
  point: RadarPoint;
}

/** The frame's ocean points around the centre (land and no-data points are left out: silence). */
export function radarPoints(sst: SstField, centre: LatLon): RadarPoint[] {
  const maxKm = continuousRule(RADAR_VOICE).input.max;
  const out: RadarPoint[] = [];
  for (let r = 1; r <= RINGS; r++) {
    const km = (maxKm * r) / RINGS;
    for (let s = 0; s < SPOKES; s++) {
      const b = (s / SPOKES) * 2 * Math.PI; // bearing from north, clockwise
      const north = km * Math.cos(b);
      const east = km * Math.sin(b);
      const lat = clampLat(centre.lat + north / KM_PER_DEG);
      const lon = wrapLon(centre.lon + east / (KM_PER_DEG * Math.cos((centre.lat * Math.PI) / 180)));
      const v = oceanAt(sst, lat, lon).valueC;
      if (v !== null) out.push({ lat, lon, km, x: east, y: -north, valueC: v });
    }
  }
  return out;
}

/** The colour class of a value on the frame's own colour bar (its value_range in thirds): cool, middle, warm. */
export function instrumentFor(valueC: number, range: readonly [number, number]): Instrument {
  const third = (range[1] - range[0]) / 3;
  if (valueC < range[0] + third) return "glockenspiel";
  if (valueC >= range[1] - third) return "marimba";
  return "choir";
}

/** One turn's seconds at NASA's movie speed (degrees per second, from the manifest's analysis). */
export const turnSeconds = (degPerSec: number) => FULL_TURN / Math.abs(degPerSec);

/** NASA mode: angle → time, distance → pitch, colour class → instrument. */
export function nasaNotes(points: readonly RadarPoint[], degPerSec: number, range: readonly [number, number]): RadarNote[] {
  const rule = continuousRule(RADAR_VOICE);
  const events: SweepEvent[] = radialSweep(points, {
    centre: { x: 0, y: 0 },
    degPerSec: Math.abs(degPerSec),
    startDeg: NORTH_DEG,
    maxRadius: rule.input.max,
    radiusTo: "pitch",
    pitch: { minHz: rule.output.min, maxHz: rule.output.max, scale: rule.output.scale },
  });
  return events.map((e) => ({ timeSec: e.timeSec, hz: mapContinuous(points[e.index].km, rule) ?? rule.output.min, instrument: instrumentFor(points[e.index].valueC, range), point: points[e.index] }));
}

/** Bloop mode: distance → time (a ring over the same seconds), value → pitch by the Ocean rule. */
export function bloopNotes(points: readonly RadarPoint[], degPerSec: number): RadarNote[] {
  const rule = continuousRule(RADAR_VOICE);
  const ocean = continuousRule(OCEAN_VOICE);
  const events = radialSweep(points, { centre: { x: 0, y: 0 }, degPerSec: 1, startDeg: 0, maxRadius: rule.input.max, radiusTo: "time", durationSec: turnSeconds(degPerSec), pitch: { minHz: 1, maxHz: 2, scale: "linear" } });
  return events.map((e) => ({ timeSec: e.timeSec, hz: mapContinuous(points[e.index].valueC, ocean) ?? ocean.output.min, instrument: "choir", point: points[e.index] }));
}

export const radarNotes = (mode: RadarMode, points: readonly RadarPoint[], degPerSec: number, range: readonly [number, number]) =>
  mode === "nasa" ? nasaNotes(points, degPerSec, range) : bloopNotes(points, degPerSec);
