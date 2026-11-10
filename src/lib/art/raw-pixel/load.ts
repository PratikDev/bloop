// The raw-pixel demo in the browser: the same frame (loadOfficialLayer, as the record page) and the stored
// measurement the screen shows (public/data/art/raw_pixel.json).

import { fetchJson } from "@/lib/data/fetch";
import { loadOfficialLayer, loadOfficialManifest } from "@/lib/data";
import type { Measures } from "./metrics";
import { frameFrom, RAW_LAYER, RAW_RECORD } from "./frame";
import type { Frame } from "./render";

export interface RawPixelFile {
  record: string;
  layer: string;
  time: string;
  sample_rate: number;
  seconds: number;
  naive: Measures;
  bloop: Measures;
}

export const loadRawPixel = () => fetchJson<RawPixelFile>("/data/art/raw_pixel.json");

export async function loadRawFrame(): Promise<Frame> {
  const m = await loadOfficialManifest(RAW_RECORD);
  const layer = m.layers.find((l) => l.id === RAW_LAYER);
  if (!layer) throw new Error("no sst layer");
  const grid = await loadOfficialLayer(m.record, layer);
  return frameFrom(layer, grid.steps[0]);
}
