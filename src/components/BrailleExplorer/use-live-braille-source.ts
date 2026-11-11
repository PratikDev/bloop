"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { voiceScale, nearestIndex, type BrailleSource, type ShapeMode, type ShapePoint, type ShapeScale } from "@/a11y/brailleSource";
import type { BrailleReading } from "@/a11y/brailleLines";
import { useFreshness } from "@/hooks/use-freshness";
import { frameGap, gapShort } from "@/lib/frame-gap";
import { bindT } from "@/lib/i18n";
import { audio } from "@/lib/audio-adapter";
import { clampLat, livenessAt, loadSequence, valueAt, valueInFrame, wrapLon, type LatLon, type LiveFields, type Sequence } from "@/lib/data";
import type { RainValue } from "@/types/data-contract";
import { liveSoundOn } from "../AppState/reducer";
import { useAppState, useT } from "../AppState/use-app-state";
import { useLiveData } from "../LiveData/use-live-data";

type LiveChannel = "ocean" | "rain";

/** Points along the needle's latitude, west to east (72 × 5°). */
const PATH_STEP_DEG = 5;
const PATH_POINTS = 360 / PATH_STEP_DEG;
/**
 * The 3×3 around the needle: rows north to south, columns west to east, 5° apart, centred on the 15° block
 * the needle is in, so the grid stays put while the needle moves inside it (the caret doesn't jump back).
 */
const GRID_STEP_DEG = 5;
const GRID_OFFSETS = [1, 0, -1] as const;
const blockCentre = (v: number) => Math.floor(v / (3 * GRID_STEP_DEG)) * 3 * GRID_STEP_DEG + 1.5 * GRID_STEP_DEG;

const FALLBACK: Record<LiveChannel, ShapeScale> = {
  ocean: { min: -5, max: 35, scale: "linear", unit: "°C" },
  rain: { min: 0.1, max: 50, scale: "log", unit: "mm/h" },
};
const PRODUCT: Record<LiveChannel, string> = { ocean: "sst", rain: "rain" };

/** A rain reading as a number for the shape: dry = 0 (the bottom band), no data = null (blank). */
function rainNumber(r: RainValue): number | null {
  if (r.phase === "nodata" || r.mmPerHour === null) return null;
  return r.phase === "dry" ? 0 : r.mmPerHour;
}

function valueOf(fields: LiveFields, channel: LiveChannel, at: LatLon): number | null {
  return channel === "ocean" ? valueAt(fields, "ocean", at.lat, at.lon).valueC : rainNumber(valueAt(fields, "rain", at.lat, at.lon));
}

/**
 * Today's live frames (Explore) as a braille source: SST and rain at the app's cursor; the rain also
 * through time over the storm sequence's ~48 half-hourly frames. The cursor is the shared needle, so
 * moving along the shape moves the map, the readout and the live voices together.
 */
export function useLiveBrailleSource(): BrailleSource | null {
  const { state, dispatch } = useAppState();
  const { fields } = useLiveData();
  const freshness = useFreshness();
  const t = useT();
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [frame, setFrame] = useState<number | null>(null);
  const loading = useRef(false);
  const { cursor, track } = state;
  const soundOn = liveSoundOn(state);

  const anchorLat = blockCentre(cursor.lat);
  const anchorLon = blockCentre(cursor.lon);

  const prepare = useCallback((channel: string, mode: ShapeMode) => {
    if (channel !== "rain" || mode !== "time" || loading.current) return;
    loading.current = true;
    loadSequence()
      .then(setSeq)
      .catch(() => {
        loading.current = false;
      });
  }, []);

  return useMemo<BrailleSource | null>(() => {
    if (!fields) return null;
    const channels = track === "ocean" ? (["ocean"] as const) : track === "rain" ? (["rain"] as const) : (["ocean", "rain"] as const);
    const label = (c: LiveChannel) => (c === "ocean" ? "SST" : "Rain");
    const gap = track === "both" && fields.rain ? frameGap(fields.sst.meta.frame_time_utc, fields.rain.meta.frame_time_utc) : null;
    const note = gap ? { en: gapShort(bindT("en"), gap), bn: gapShort(bindT("bn"), gap) } : undefined;
    const lastFrame = seq ? seq.frames.length - 1 : 0;
    const shownFrame = frame ?? lastFrame;

    const timePoints = (): ShapePoint[] | null =>
      seq
        ? seq.frames.map((f, i) => {
            const r = valueInFrame(seq, f, cursor.lat, cursor.lon);
            return { value: r.phase === "nodata" ? null : r.phase === "dry" ? 0 : r.mmPerHour, at: cursor, step: i };
          })
        : null;
    const pathPoints = (c: LiveChannel): ShapePoint[] =>
      Array.from({ length: PATH_POINTS }, (_, i) => {
        const at = { lat: cursor.lat, lon: -180 + PATH_STEP_DEG / 2 + i * PATH_STEP_DEG };
        return { value: valueOf(fields, c, at), at, step: 0 };
      });
    const gridPoints = (c: LiveChannel): ShapePoint[] =>
      GRID_OFFSETS.flatMap((r) =>
        [-1, 0, 1].map((col) => {
          const at = { lat: clampLat(anchorLat + r * GRID_STEP_DEG), lon: wrapLon(anchorLon + col * GRID_STEP_DEG) };
          return { value: valueOf(fields, c, at), at, step: 0 };
        }),
      );

    const timeMode = (c: string, m: ShapeMode) => c === "rain" && m === "time";
    const shown = (c: LiveChannel, m: ShapeMode) => {
      if (timeMode(c, m) && seq) {
        const f = seq.frames[shownFrame];
        const r = valueInFrame(seq, f, cursor.lat, cursor.lon);
        return { value: r.phase === "nodata" ? null : r.phase === "dry" ? 0 : r.mmPerHour, frozen: r.phase === "frozen", time: f.ref.time_utc };
      }
      const r = valueAt(fields, "rain", cursor.lat, cursor.lon);
      const time = c === "ocean" ? fields.sst.meta.frame_time_utc : (fields.rain?.meta.frame_time_utc ?? "");
      return { value: valueOf(fields, c, cursor), frozen: c === "rain" && r.phase === "frozen", time };
    };
    const status = (c: LiveChannel) => {
      const live = livenessAt(freshness?.products[PRODUCT[c]], Date.now());
      return live === "live" ? "live" : live === "recorded" ? "stale" : "";
    };

    return {
      key: `live-${track}`,
      channels: channels.map((c) => ({ id: c, label: label(c) })),
      relative: false,
      modes: (c) => (c === "rain" ? ["time", "path", "grid"] : ["path", "grid"]),
      scale: (c) => voiceScale(c, FALLBACK[c as LiveChannel]),
      view(c, m) {
        const ch = c as LiveChannel;
        const points = m === "time" ? timePoints() : m === "grid" ? gridPoints(ch) : pathPoints(ch);
        if (!points) return null;
        return { mode: m, points, columns: m === "grid" ? 3 : undefined, current: nearestIndex(points, cursor, shownFrame, m) };
      },
      reading(c, m): BrailleReading {
        const ch = c as LiveChannel;
        const v = shown(ch, m);
        return {
          short: label(ch), long: t(ch === "ocean" ? "braille.name.ocean" : "braille.name.rain"), layer: ch,
          kind: v.value === null ? "nodata" : ch === "rain" && v.value === 0 ? "dry" : "value", value: v.value,
          decimals: ch === "ocean" ? 1 : v.value !== null && v.value >= 10 ? 0 : 1, below: false, snow: v.frozen,
          unit: ch === "ocean" ? "°C" : "mm/h", place: cursor, time: { iso: v.time || null, label: null },
          badge: "observation", status: status(ch), relative: false, note: m === "time" ? undefined : note,
        };
      },
      go(c, m, p) {
        if (timeMode(c, m) && seq) {
          setFrame(p.step);
          const r = valueInFrame(seq, seq.frames[p.step], cursor.lat, cursor.lon);
          if (soundOn) audio.setRain(r.mmPerHour, r.phase, cursor.lon);
          return;
        }
        dispatch({ type: "setCursor", cursor: p.at });
      },
      prepare,
    };
  }, [fields, track, seq, frame, cursor, anchorLat, anchorLon, freshness, soundOn, dispatch, prepare, t]);
}
