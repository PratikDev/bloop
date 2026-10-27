"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TrackMode } from "@/lib/audio-adapter/types";
import { readPalette } from "@/lib/css-tokens";
import type { SstField } from "@/lib/data";
import { buildLandLayer, drawBase } from "../FrameView/base-layer";
import { useFrameImages } from "../FrameView/use-frame-images";

/** At most 2048 × 1024 for display; equirectangular 2:1 like every L1 grid. */
const TEXTURE = { width: 2048, height: 1024 } as const;

/**
 * The globe's texture: the flat map's own drawing (drawBase), at texture size.
 * Ocean = the SST frame; Rain = night, the land mask from the SST no-data cells,
 * then the rain frame; both = SST with rain on top. `onRedraw` runs after each redraw.
 */
export function useGlobeTexture(track: TrackMode, sst: SstField | null, onRedraw: () => void): HTMLCanvasElement {
  const { sst: sstImage, rain: rainImage } = useFrameImages();
  const [canvas] = useState(() => {
    const c = document.createElement("canvas");
    c.width = TEXTURE.width;
    c.height = TEXTURE.height;
    return c;
  });
  const land = useMemo(() => (sst ? buildLandLayer(sst, readPalette()) : null), [sst]);
  const redrawn = useRef(onRedraw);
  useEffect(() => {
    redrawn.current = onRedraw;
  });

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawBase(ctx, track, { sst: sstImage, rain: rainImage, land }, readPalette(), TEXTURE.width, TEXTURE.height);
    redrawn.current();
  }, [canvas, track, sstImage, rainImage, land]);

  return canvas;
}
