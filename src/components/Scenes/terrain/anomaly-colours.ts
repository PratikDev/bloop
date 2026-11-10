// The anomaly legend's colours, taken from NASA's SVS 5176 picture itself (latest/sst_anom.webp), as frame-colours.ts
// does for the SST: for each band of the anomaly's own range (sst_anom.json value_range), the mean colour of the
// picture over the cells whose decoded anomaly falls in it. No colormap is invented. (P1, DATA)

import type { SstAnomalyField } from "@/lib/data";
import type { LegendStop } from "../SceneShell/SceneLegend";

const BANDS = 16;

export function anomalyColourStops(anomaly: SstAnomalyField, image: HTMLImageElement): LegendStop[] {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const { grid, value_range: [min, max] } = anomaly.meta;
  const sums = Array.from({ length: BANDS }, () => [0, 0, 0, 0]);
  for (let r = 0; r < grid.height; r++) {
    for (let c = 0; c < grid.width; c++) {
      const code = anomaly.codes[r * grid.width + c];
      if (code === grid.nodata) continue;
      const v = code / grid.scale;
      const b = Math.min(BANDS - 1, Math.max(0, Math.floor(((v - min) / (max - min)) * BANDS)));
      const x = Math.min(canvas.width - 1, Math.floor(((c + 0.5) / grid.width) * canvas.width));
      const y = Math.min(canvas.height - 1, Math.floor(((r + 0.5) / grid.height) * canvas.height));
      const i = (y * canvas.width + x) * 4;
      sums[b][0] += pixels[i];
      sums[b][1] += pixels[i + 1];
      sums[b][2] += pixels[i + 2];
      sums[b][3] += 1;
    }
  }
  return sums
    .map((s, b) => (s[3] === 0 ? null : { at: (b + 0.5) / BANDS, colour: `rgb(${Math.round(s[0] / s[3])} ${Math.round(s[1] / s[3])} ${Math.round(s[2] / s[3])})` }))
    .filter((s): s is LegendStop => s !== null);
}
