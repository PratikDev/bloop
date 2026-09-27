// The static layer: the EIC frame image(s) and, under the rain frame, a land
// fill and coastline derived from the ocean grid's no-data mask.

import type { TrackMode } from "@/lib/audio-adapter/types";
import { hexToRgb, type Palette } from "@/lib/css-tokens";
import type { SstField } from "@/lib/data";

/** Land fill and a 1-cell coastline, at grid resolution (scaled up when drawn). */
export function buildLandLayer(sst: SstField, palette: Palette): HTMLCanvasElement {
  const { width, height, nodata } = sst.meta.grid;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(width, height);
  const land = hexToRgb(palette.land);
  const coast = hexToRgb(palette.line);
  const isLand = (i: number) => sst.codes[i] === nodata;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = row * width + col;
      if (!isLand(i)) continue;
      const edge =
        (col > 0 && !isLand(i - 1)) ||
        (col < width - 1 && !isLand(i + 1)) ||
        (row > 0 && !isLand(i - width)) ||
        (row < height - 1 && !isLand(i + width));
      const [r, g, b] = edge ? coast : land;
      img.data.set([r, g, b, 255], i * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export interface BaseImages {
  sst: HTMLImageElement | null;
  rain: HTMLImageElement | null;
  land: HTMLCanvasElement | null;
}

/**
 * Ocean: the ocean temperature frame as NASA drew it (with its own grey land).
 * Rain: our night background, our land mask, then the rain frame (transparent where dry).
 * Both: the ocean frame with the rain frame on top.
 */
export function drawBase(
  ctx: CanvasRenderingContext2D,
  track: TrackMode,
  images: BaseImages,
  palette: Palette,
  width: number,
  height: number,
): void {
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = palette.night;
  ctx.fillRect(0, 0, width, height);
  if (track === "rain") {
    if (images.land) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(images.land, 0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
    }
  } else if (images.sst) {
    ctx.drawImage(images.sst, 0, 0, width, height);
  }
  if (track !== "ocean" && images.rain) ctx.drawImage(images.rain, 0, 0, width, height);
}
