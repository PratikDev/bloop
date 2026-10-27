"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { readPalette } from "@/lib/css-tokens";
import type { LatLon, SstField } from "@/lib/data";
import type { Reading } from "@/lib/reading";
import { buildLandLayer } from "../FrameView/base-layer";
import { useFrameImages } from "../FrameView/use-frame-images";
import { createPixelSampler, DATA_TEXTURE, drawCover, drawDataLayer, type Pixel } from "./data-layer";
import { LIVE_RECORDS } from "./records";

export interface GlobeTexture {
  canvas: HTMLCanvasElement;
  /** The frame's own pixel colour under a reading (null: land, dry or no data). */
  sample(track: TrackMode, reading: Reading, at: LatLon): Pixel | null;
  /** One cover per live record (data URLs for <img>), and the canvas for the record label. */
  covers: Partial<Record<TrackMode, string>>;
  coverCanvas: Partial<Record<TrackMode, HTMLCanvasElement>>;
}

/** The data layer and the sleeve covers, redrawn when the record or the images change; `onRedraw` runs after each redraw. */
export function useGlobeTexture(track: TrackMode, sst: SstField | null, onRedraw: () => void): GlobeTexture {
  const { sst: sstImage, rain: rainImage } = useFrameImages();
  const [canvas] = useState(() => {
    const c = document.createElement("canvas");
    c.width = DATA_TEXTURE.width;
    c.height = DATA_TEXTURE.height;
    return c;
  });
  const land = useMemo(() => (sst ? buildLandLayer(sst, readPalette()) : null), [sst]);
  const sample = useMemo(() => createPixelSampler({ sst: sstImage, rain: rainImage }), [sstImage, rainImage]);
  const [covers, setCovers] = useState<GlobeTexture["covers"]>({});
  const [coverCanvas, setCoverCanvas] = useState<GlobeTexture["coverCanvas"]>({});
  const redrawn = useRef(onRedraw);
  useEffect(() => {
    redrawn.current = onRedraw;
  });

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawDataLayer(ctx, track, { sst: sstImage, rain: rainImage, land }, DATA_TEXTURE.width, DATA_TEXTURE.height);
    redrawn.current();
  }, [canvas, track, sstImage, rainImage, land]);

  // Covers are drawn once the frame images are in (a callback from image loading, not a render).
  useEffect(() => {
    if (!sstImage) return;
    const palette = readPalette();
    const canvases: GlobeTexture["coverCanvas"] = {};
    const urls: GlobeTexture["covers"] = {};
    for (const record of LIVE_RECORDS) {
      if (record !== "ocean" && !rainImage) continue;
      const c = document.createElement("canvas");
      drawCover(c, record, { sst: sstImage, rain: rainImage, land }, palette);
      canvases[record] = c;
      urls[record] = c.toDataURL("image/webp", 0.85);
    }
    const id = requestAnimationFrame(() => {
      setCoverCanvas(canvases);
      setCovers(urls);
    });
    return () => cancelAnimationFrame(id);
  }, [sstImage, rainImage, land]);

  return { canvas, sample, covers, coverCanvas };
}
