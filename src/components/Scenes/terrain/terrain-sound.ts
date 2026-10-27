// Sound terrain's voices: the ocean voice under the walker's feet (the ocean
// rule on the zoomed axis: setOceanAxis), silent on land, and the nearest wet
// IMERG cells as HTRF-placed rain around the listener (position only; each
// source keeps the rain rule's own density and level).

import { audio } from "@/lib/audio-adapter";
import { decodeSequenceCode, type Sequence, type SequenceFrame, type SstField } from "@/lib/data";
import { cellIndex } from "@/lib/data/grid";
import { decodeSst } from "@/lib/data/latest";
import type { GeoPlane } from "../plane";

/** Rain sources: the nearest wet cells within this radius (degrees), at most four (the engine's limit). */
const RAIN_RADIUS_DEG = 1.5;
const MAX_RAIN_SOURCES = 4;
const RAIN_EVERY_SEC = 0.1;

export interface TerrainSound {
  /** The walker moved (or the frame changed): update the voices. Returns the SST under the walker (null = land). */
  at(lat: number, lon: number, yaw: number, dt: number): number | null;
  setFrame(seq: Sequence | null, frame: SequenceFrame | null): void;
  dispose(): void;
}

export function createTerrainSound(sst: SstField, plane: GeoPlane, axis: { min: number; max: number }): TerrainSound {
  audio.setOceanAxis(axis);
  let cell = -1;
  let value: number | null = null;
  let seq: Sequence | null = null;
  let frame: SequenceFrame | null = null;
  let sinceRain = RAIN_EVERY_SEC;

  const rainAround = (lat: number, lon: number, yaw: number) => {
    if (!seq || !frame) {
      audio.setSpatialRain(null, { x: 0, y: 0, z: 0, yaw });
      return;
    }
    const { width, height } = seq.size;
    const step = 180 / height;
    const found: { lat: number; lon: number; mm: number; d: number }[] = [];
    for (let dLat = -RAIN_RADIUS_DEG; dLat <= RAIN_RADIUS_DEG; dLat += step) {
      for (let dLon = -RAIN_RADIUS_DEG; dLon <= RAIN_RADIUS_DEG; dLon += step) {
        const d = Math.hypot(dLat, dLon);
        if (d > RAIN_RADIUS_DEG) continue;
        const v = decodeSequenceCode(frame.codes[cellIndex({ width, height }, lat + dLat, lon + dLon)]);
        if (v.phase === "liquid" && v.mmPerHour !== null && v.mmPerHour > 0) found.push({ lat: lat + dLat, lon: lon + dLon, mm: v.mmPerHour, d });
      }
    }
    found.sort((a, b) => a.d - b.d);
    const me = plane.toXZ(lat, lon);
    const sources = found.slice(0, MAX_RAIN_SOURCES).map((r) => {
      const p = plane.toXZ(r.lat, r.lon);
      return { x: p.x, y: 0, z: p.z, mmPerHour: r.mm };
    });
    audio.setSpatialRain(sources, { x: me.x, y: 0, z: me.z, yaw });
  };

  return {
    at(lat, lon, yaw, dt) {
      const i = cellIndex(sst.meta.grid, lat, lon);
      if (i !== cell) {
        cell = i;
        value = decodeSst(sst.meta, sst.codes[i]);
        audio.setOcean(value, lon);
      }
      sinceRain += dt;
      if (sinceRain >= RAIN_EVERY_SEC) {
        sinceRain = 0;
        rainAround(lat, lon, yaw);
      }
      return value;
    },
    setFrame(s, f) {
      seq = s;
      frame = f;
      sinceRain = RAIN_EVERY_SEC;
    },
    dispose() {
      audio.setSpatialRain(null, { x: 0, y: 0, z: 0, yaw: 0 });
      audio.setOceanAxis(null);
      audio.silenceLive();
    },
  };
}
