import { radialSweep, type SweepEvent } from "@/lib/audio-jukebox/radial-sweep";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { oceanAt, type SstField } from "@/lib/data/latest";
import { clampLat, wrapLon } from "@/lib/data/grid";
import type { LatLon } from "@/lib/data";
import type { OfficialManifest } from "@/types/data-contract";

export const RADAR_VOICE = "radarDistance";
export const RADAR_APPLIED_VOICE = "ocean";
export const RADAR_RECORD = "sonification_13786";
const OCEAN_VOICE = RADAR_APPLIED_VOICE;
const KM_PER_DEG = 111.2;
const RINGS = 10;
const SPOKES = 24;
const FULL_TURN = 360;
const NORTH_DEG = 270;

export type RadarMode = "nasa" | "bloop";

export interface MethodManifest extends OfficialManifest {
  kind?: "method";
  analysis?: { angular_speed_deg_s: number; centre_px: number[]; stars: Record<string, number> };
}
export type Instrument = "glockenspiel" | "marimba" | "choir";

interface RadarPoint {
  lat: number;
  lon: number;
  km: number;
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

export function radarPoints(sst: SstField, centre: LatLon): RadarPoint[] {
  const maxKm = continuousRule(RADAR_VOICE).input.max;
  const out: RadarPoint[] = [];
  for (let r = 1; r <= RINGS; r++) {
    const km = (maxKm * r) / RINGS;
    for (let s = 0; s < SPOKES; s++) {
      const b = (s / SPOKES) * 2 * Math.PI;
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

export function instrumentFor(valueC: number, range: readonly [number, number]): Instrument {
  const third = (range[1] - range[0]) / 3;
  if (valueC < range[0] + third) return "glockenspiel";
  if (valueC >= range[1] - third) return "marimba";
  return "choir";
}

export const turnSeconds = (degPerSec: number) => FULL_TURN / Math.abs(degPerSec);

function nasaNotes(points: readonly RadarPoint[], degPerSec: number, range: readonly [number, number]): RadarNote[] {
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

function bloopNotes(points: readonly RadarPoint[], degPerSec: number): RadarNote[] {
  const rule = continuousRule(RADAR_VOICE);
  const ocean = continuousRule(OCEAN_VOICE);
  const events = radialSweep(points, { centre: { x: 0, y: 0 }, degPerSec: 1, startDeg: 0, maxRadius: rule.input.max, radiusTo: "time", durationSec: turnSeconds(degPerSec), pitch: { minHz: 1, maxHz: 2, scale: "linear" } });
  return events.map((e) => ({ timeSec: e.timeSec, hz: mapContinuous(points[e.index].valueC, ocean) ?? ocean.output.min, instrument: "choir", point: points[e.index] }));
}

export const radarNotes = (mode: RadarMode, points: readonly RadarPoint[], degPerSec: number, range: readonly [number, number]) =>
  mode === "nasa" ? nasaNotes(points, degPerSec, range) : bloopNotes(points, degPerSec);
