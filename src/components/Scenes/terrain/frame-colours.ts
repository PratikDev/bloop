// The SST legend's colours, taken from the frame itself: for each half-degree
// band of the zoomed axis, the mean colour of NASA's frame image over the
// region's cells in that band. No colormap is reconstructed or invented: these
// are the pixels the terrain shows, grouped by the grid's own values.

import type { LegendStop } from "../SceneShell/SceneLegend";
import type { TerrainField } from "./field";

const BAND_C = 0.5;

export function frameColourStops(field: TerrainField, image: HTMLImageElement): LegendStop[] {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0);
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const { min, max } = field.axis;
  const bands = Math.round((max - min) / BAND_C);
  const sums = Array.from({ length: bands }, () => [0, 0, 0, 0]);
  field.lats.forEach((lat, r) =>
    field.lons.forEach((lon, c) => {
      const v = field.values[r][c];
      if (v === null) return;
      const b = Math.min(bands - 1, Math.max(0, Math.floor((v - min) / BAND_C)));
      const x = Math.min(width - 1, Math.floor(((lon + 180) / 360) * width));
      const y = Math.min(height - 1, Math.floor(((90 - lat) / 180) * height));
      const i = (y * width + x) * 4;
      sums[b][0] += pixels[i];
      sums[b][1] += pixels[i + 1];
      sums[b][2] += pixels[i + 2];
      sums[b][3] += 1;
    }),
  );
  return sums
    .map((s, b) => (s[3] === 0 ? null : { at: (b + 0.5) / bands, colour: `rgb(${Math.round(s[0] / s[3])} ${Math.round(s[1] / s[3])} ${Math.round(s[2] / s[3])})` }))
    .filter((s): s is LegendStop => s !== null);
}
