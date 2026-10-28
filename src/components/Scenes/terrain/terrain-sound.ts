// Sound terrain's voices: the ocean voice under the walker's feet (the ocean
// rule on the zoomed axis: setOceanAxis), silent on land, and the nearest wet
// IMERG cells as HTRF-placed rain around the listener (position only; each
// source keeps the rain rule's own density and level).
// §15: with "vs normal" on (N), the normal tone plays the SVS 5176 anomaly instead of the
// temperature; with it off, the ocean voice's echo follows MUR's hours since a look (clarity).

import { audio } from "@/lib/audio-adapter";
import { anomalyAt, clarityAt, decodeSequenceCode, type Clarity, type Sequence, type SequenceFrame, type SstAnomalyField, type SstDtField, type SstField } from "@/lib/data";
import { cellIndex } from "@/lib/data/grid";
import { decodeSst } from "@/lib/data/latest";
import type { GeoPlane } from "../plane";

/** Rain sources: the nearest wet cells within this radius (degrees), at most four (the engine's limit). */
const RAIN_RADIUS_DEG = 1.5;
const MAX_RAIN_SOURCES = 4;
const RAIN_EVERY_SEC = 0.1;

/** What the walker stands on: the temperature, its anomaly and how recently it was seen (each null where absent). */
export interface TerrainReading {
  valueC: number | null;
  anomalyC: number | null;
  clarity: Clarity;
}

export interface TerrainSound {
  /** The walker moved (or the frame or mode changed): update the voices. */
  at(lat: number, lon: number, yaw: number, dt: number, vsNormal: boolean): TerrainReading;
  setFrame(seq: Sequence | null, frame: SequenceFrame | null): void;
  dispose(): void;
}

export function createTerrainSound(
  sst: SstField,
  plane: GeoPlane,
  axis: { min: number; max: number },
  extra: { anomaly: SstAnomalyField | null; dt: SstDtField | null },
): TerrainSound {
  audio.setOceanAxis(axis);
  let cell = -1;
  let mode: boolean | null = null;
  let reading: TerrainReading = { valueC: null, anomalyC: null, clarity: null };
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

  /** One voice at a time: the temperature (with its clarity echo) or the anomaly around the normal tone. */
  const play = (lon: number, vsNormal: boolean, switched: boolean) => {
    if (vsNormal) {
      if (switched) audio.silenceLive(); // the ocean voice stops without a no-data tick
      audio.setNormalTone(reading.anomalyC, lon);
      return;
    }
    if (switched) audio.setNormalTone(null, lon);
    audio.setOcean(reading.valueC, lon);
    audio.setClarity(reading.clarity);
  };

  return {
    at(lat, lon, yaw, dt, vsNormal) {
      const i = cellIndex(sst.meta.grid, lat, lon);
      const switched = mode !== null && mode !== vsNormal;
      if (i !== cell || mode !== vsNormal) {
        cell = i;
        reading = {
          valueC: decodeSst(sst.meta, sst.codes[i]),
          anomalyC: extra.anomaly ? anomalyAt(extra.anomaly, lat, lon) : null,
          clarity: extra.dt ? clarityAt(extra.dt, lat, lon) : null,
        };
        play(lon, vsNormal, switched);
        mode = vsNormal;
      }
      sinceRain += dt;
      if (sinceRain >= RAIN_EVERY_SEC) {
        sinceRain = 0;
        rainAround(lat, lon, yaw);
      }
      return reading;
    },
    setFrame(s, f) {
      seq = s;
      frame = f;
      sinceRain = RAIN_EVERY_SEC;
    },
    dispose() {
      audio.setSpatialRain(null, { x: 0, y: 0, z: 0, yaw: 0 });
      audio.setOceanAxis(null);
      audio.setNormalTone(null, 0);
      audio.setClarity(null);
      audio.silenceLive();
    },
  };
}
