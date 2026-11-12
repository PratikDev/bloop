// Storm time-lapse frames (contract §2): the last ~48 half-hourly IMERG frames.
// Each grid is gzip of one byte per cell, rain and phase together:
//   0 = dry; 255 = no data;
//   1..127 liquid, 128..254 frozen: mm/h = 10^(−1 + (code − base) / 126 × log10(500))

import type { RainPhase, SequenceFrameRef, SequenceIndex } from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { cellIndex, readUint8, type GridSize } from "./grid";
import { gunzip } from "./gunzip";
import { DATA_PATHS } from "./paths";
import { requirePaths } from "./validate";

export interface SequenceFrame {
  ref: SequenceFrameRef;
  codes: Uint8Array;
}

export interface Sequence {
  index: SequenceIndex;
  size: GridSize;
  frames: SequenceFrame[];
}

const DRY = 0;
const NODATA = 255;
const FROZEN_BASE = 128;
const LOG_SPAN = Math.log10(500);

/** One cell's rain from a sequence code. */
export function decodeSequenceCode(code: number): { mmPerHour: number | null; phase: RainPhase } {
  if (code === DRY) return { mmPerHour: 0, phase: "dry" };
  if (code === NODATA) return { mmPerHour: null, phase: "nodata" };
  const frozen = code >= FROZEN_BASE;
  const step = code - (frozen ? FROZEN_BASE : 1);
  return { mmPerHour: Math.pow(10, -1 + (step / 126) * LOG_SPAN), phase: frozen ? "frozen" : "liquid" };
}

/** The frame list (index.json) on its own: a few KB, so it can be read before the frames load. */
export async function loadSequenceIndex(): Promise<SequenceIndex> {
  const index = await fetchJson<SequenceIndex>(DATA_PATHS.sequenceIndex);
  requirePaths("sequence/index.json", index, { frames: "array", "grid.width": "number", "grid.height": "number", step_minutes: "number", credit: "string" });
  return index;
}

/** Hours covered by the newest `count` frames (each frame is one step long). */
export function spanHours(index: SequenceIndex, count: number): number {
  return (Math.min(count, index.frames.length) * index.step_minutes) / 60;
}
/** Loads the index and every frame's grid, reporting progress (frames loaded, total). */
export async function loadSequence(onProgress?: (loaded: number, total: number) => void): Promise<Sequence> {
  const index = await loadSequenceIndex();
  const size = { width: index.grid.width, height: index.grid.height };
  let loaded = 0;
  const frames = await Promise.all(
    index.frames.map(async (ref) => {
      const codes = readUint8(await gunzip(await fetchBuffer(DATA_PATHS.sequenceFile(ref.grid))), size);
      onProgress?.(++loaded, index.frames.length);
      return { ref, codes };
    }),
  );
  return { index, size, frames };
}

export function valueInFrame(seq: Pick<Sequence, "size">, frame: SequenceFrame, lat: number, lon: number) {
  return decodeSequenceCode(frame.codes[cellIndex(seq.size, lat, lon)]);
}

// One frame at a time, cached (layered descriptions, accessibility core step 3): the change since the previous frame,
// and a frame held with PageUp/PageDown, without loading all of them.
let indexOnce: Promise<SequenceIndex> | null = null;
const frameOnce = new Map<string, Promise<SequenceFrame>>();

function cachedIndex(): Promise<SequenceIndex> {
  indexOnce ??= loadSequenceIndex().catch((error: unknown) => {
    indexOnce = null;
    throw error;
  });
  return indexOnce;
}

/** One frame of the sequence (its grid decoded), by its position in index.json. */
export async function loadSequenceFrame(position: number): Promise<{ index: SequenceIndex; frame: SequenceFrame } | null> {
  const index = await cachedIndex();
  const ref = index.frames[position];
  if (!ref) return null;
  let frame = frameOnce.get(ref.grid);
  if (!frame) {
    const size = { width: index.grid.width, height: index.grid.height };
    frame = fetchBuffer(DATA_PATHS.sequenceFile(ref.grid)).then(async (b) => ({ ref, codes: readUint8(await gunzip(b), size) }));
    frame.catch(() => frameOnce.delete(ref.grid));
    frameOnce.set(ref.grid, frame);
  }
  return { index, frame: await frame };
}

/**
 * Rain at `at` in the sequence frame at `timeUtc` and in the one before it: both from the same grid, so they compare.
 * Null when the sequence has no frame at that time, or none before it.
 */
export async function rainChangeAt(timeUtc: string, lat: number, lon: number): Promise<{ before: number; after: number; minutes: number } | null> {
  const index = await cachedIndex();
  const at = index.frames.findIndex((f) => Date.parse(f.time_utc) === Date.parse(timeUtc));
  if (at < 1) return null;
  const [now, prev] = await Promise.all([loadSequenceFrame(at), loadSequenceFrame(at - 1)]);
  if (!now || !prev) return null;
  const seq = { size: { width: index.grid.width, height: index.grid.height } };
  const after = valueInFrame(seq, now.frame, lat, lon).mmPerHour;
  const before = valueInFrame(seq, prev.frame, lat, lon).mmPerHour;
  const minutes = (Date.parse(now.frame.ref.time_utc) - Date.parse(prev.frame.ref.time_utc)) / 60_000;
  return before === null || after === null ? null : { before, after, minutes };
}
