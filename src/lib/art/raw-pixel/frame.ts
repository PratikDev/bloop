// PURE: the raw-pixel demo's frame: SVS 3912's sea surface temperature, first time step, decoded exactly as the app
// decodes it (decodeCode), with the colorbar it was drawn with (layer.display).

import { decodeCode } from "@/lib/data/official";
import type { OfficialLayer } from "@/types/data-contract";
import type { Frame } from "./render";

export const RAW_RECORD = "currents_3912";
export const RAW_LAYER = "sst";

export function frameFrom(layer: OfficialLayer, codes: Uint16Array): Frame {
  if (!layer.display) throw new Error(`${layer.id}: no colorbar to draw the pixels with`);
  const { width, height } = layer.grid;
  const values = Array.from(codes.subarray(0, width * height), (c) => decodeCode(layer, c)?.value ?? null);
  return { width, height, values, colours: layer.display.colours, stops: layer.display.values };
}
