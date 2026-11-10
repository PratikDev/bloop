// The data frame as the globe shows it, drawn from the app's own images: ocean
// pixels of the SST frame (land cut away with the SST grid's no-data mask, so
// realistic continents show through), and the rain frame (already transparent
// where dry). Same equirectangular layout as every grid, so it stays aligned.

import type { TrackMode } from "@/lib/audio-jukebox/types";
import type { Palette } from "@/lib/css-tokens";
import type { Reading } from "@/lib/reading";
import { drawBase, type BaseImages } from "../FrameView/base-layer";

export const DATA_TEXTURE = { width: 2048, height: 1024 } as const;
/** Sleeve covers: a square from 60° N to 60° S, 30° E to 150° E (the Indian Ocean side). */
const COVER = { size: 256, lonFrom: 30, lonTo: 150, latFrom: 60, latTo: -60 } as const;

export function drawDataLayer(ctx: CanvasRenderingContext2D, track: TrackMode, images: BaseImages, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  if (track !== "rain" && images.sst) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(images.sst, 0, 0, width, height);
    if (images.land) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(images.land, 0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = "source-over";
    }
  }
  if (track !== "ocean" && images.rain) ctx.drawImage(images.rain, 0, 0, width, height);
}

/** A sleeve cover: the flat map's own drawing of this record, cropped to a square. */
export function drawCover(canvas: HTMLCanvasElement, track: TrackMode, images: BaseImages, palette: Palette): void {
  const full = document.createElement("canvas");
  full.width = 1024;
  full.height = 512;
  const fctx = full.getContext("2d");
  const ctx = canvas.getContext("2d");
  if (!fctx || !ctx) return;
  drawBase(fctx, track, images, palette, full.width, full.height);
  const x = ((COVER.lonFrom + 180) / 360) * full.width;
  const w = ((COVER.lonTo - COVER.lonFrom) / 360) * full.width;
  const y = ((90 - COVER.latFrom) / 180) * full.height;
  const h = ((COVER.latFrom - COVER.latTo) / 180) * full.height;
  canvas.width = canvas.height = COVER.size;
  ctx.drawImage(full, x, y, w, h, 0, 0, COVER.size, COVER.size);
}

export type Pixel = [number, number, number];

export type PixelReader = (lat: number, lon: number) => Pixel | null;

/** The pixel of an equirectangular image (row 0 = 90° N, column 0 = 180° W) that holds a point. */
const pixelIndex = (width: number, height: number, lat: number, lon: number) =>
  Math.min(height - 1, Math.floor(((90 - lat) / 180) * height)) * width + Math.min(width - 1, Math.floor(((lon + 180) / 360) * width));

/** A frame image at its own size, unsmoothed, read once into memory: any number of single pixels, cheaply. */
export function nativeReader(image: HTMLImageElement): PixelReader {
  const c = document.createElement("canvas");
  c.width = image.naturalWidth;
  c.height = image.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx?.drawImage(image, 0, 0);
  const data = ctx?.getImageData(0, 0, c.width, c.height).data;
  return (lat, lon) => {
    if (!data) return null;
    const i = pixelIndex(c.width, c.height, lat, lon) * 4;
    return data[i + 3] === 0 ? null : [data[i], data[i + 1], data[i + 2]];
  };
}

/**
 * Which frame's pixel a reading shows on a record: rain where the grid has rain or snow, else ocean where the grid has
 * a temperature, else none (land, dry, no data). The swatch, the record and the groove all use this one rule.
 */
export function pickPixel(track: TrackMode, r: Reading, at: { lat: number; lon: number }, readers: { sst: PixelReader | null; rain: PixelReader | null }): Pixel | null {
  const wet = r.rain.phase === "liquid" || r.rain.phase === "frozen";
  if (track !== "ocean" && wet && readers.rain) return readers.rain(at.lat, at.lon);
  if (track !== "rain" && r.ocean.valueC !== null && readers.sst) return readers.sst(at.lat, at.lon);
  return null;
}

/**
 * The frame pixel under the needle, read from NASA's own image at its own size.
 * The grid decides which layer that is: rain where the grid has rain or snow,
 * else ocean where the grid has a temperature, else none (land, dry, no data).
 */
export function createPixelSampler(images: { sst: HTMLImageElement | null; rain: HTMLImageElement | null }) {
  const readers = { sst: images.sst && nativeReader(images.sst), rain: images.rain && nativeReader(images.rain) };
  return (track: TrackMode, r: Reading, at: { lat: number; lon: number }): Pixel | null => pickPixel(track, r, at, readers);
}
