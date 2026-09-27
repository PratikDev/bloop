// Storm time-lapse frames (contract §2): the last ~48 half-hourly IMERG frames.
// Each grid is gzip of one byte per cell, rain and phase together:
//   0 = dry; 255 = no data;
//   1..127 liquid, 128..254 frozen: mm/h = 10^(−1 + (code − base) / 126 × log10(500))

import type { RainPhase, SequenceFrameRef, SequenceIndex } from "@/types/data-contract";
import { fetchBuffer, fetchJson } from "./fetch";
import { cellIndex, readUint8, type GridSize } from "./grid";
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

/** Gunzip in the browser. A server that already decompressed the file is handled too. */
async function gunzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(buffer);
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) return buffer;
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

/** Loads the index and every frame's grid, reporting progress (frames loaded, total). */
export async function loadSequence(onProgress?: (loaded: number, total: number) => void): Promise<Sequence> {
  const index = await fetchJson<SequenceIndex>(DATA_PATHS.sequenceIndex);
  requirePaths("sequence/index.json", index, { frames: "array", "grid.width": "number", "grid.height": "number", credit: "string" });
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

export function valueInFrame(seq: Sequence, frame: SequenceFrame, lat: number, lon: number) {
  return decodeSequenceCode(frame.codes[cellIndex(seq.size, lat, lon)]);
}
