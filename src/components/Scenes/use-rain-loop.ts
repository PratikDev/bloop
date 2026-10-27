"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DATA_PATHS, loadSequence, type Sequence } from "@/lib/data";
import type { Bounds } from "./plane";

/** The 48 half-hourly frames as a 24 h loop: two frames a second (design choice). */
const FRAME_MS = 500;

export interface RainLoop {
  seq: Sequence | null;
  frame: number;
  setFrame(i: number): void;
  step(delta: number): void;
  /** NASA's own frame image, cropped to the region (row 0 = south, for a texture). Null while loading. */
  decal: ImageBitmap | null;
  error: boolean;
}

/** Loads the IMERG sequence when a scene opens, and steps through it (paused, or with reduced motion: by hand only). */
export function useRainLoop(bounds: Bounds, running: boolean, speed = 1): RainLoop {
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [frame, setFrameState] = useState(0);
  const [decal, setDecal] = useState<ImageBitmap | null>(null);
  const [error, setError] = useState(false);
  const bitmaps = useRef(new Map<number, Promise<ImageBitmap>>());
  const [w, s, e, n] = bounds;

  useEffect(() => {
    let cancelled = false;
    loadSequence()
      .then((loaded) => {
        if (cancelled) return;
        setSeq(loaded);
        setFrameState(loaded.frames.length - 1); // open on the newest frame
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const count = seq?.frames.length ?? 0;
  const setFrame = useCallback((i: number) => count > 0 && setFrameState(((i % count) + count) % count), [count]);
  const step = useCallback((delta: number) => setFrameState((f) => (count > 0 ? (((f + delta) % count) + count) % count : f)), [count]);

  useEffect(() => {
    if (!running || count === 0) return;
    const id = setInterval(() => step(1), FRAME_MS / speed);
    return () => clearInterval(id);
  }, [running, count, step, speed]);

  // The decal: the frame's PNG, cropped to the region (small, so all 48 can stay cached).
  useEffect(() => {
    const ref = seq?.frames[frame]?.ref;
    if (!seq || !ref) return;
    let cancelled = false;
    let pending = bitmaps.current.get(frame);
    if (!pending) {
      pending = fetch(DATA_PATHS.sequenceFile(ref.png))
        .then((r) => r.blob())
        .then((blob) =>
          createImageBitmap(blob).then((full) => {
            const sx = ((w + 180) / 360) * full.width;
            const sy = ((90 - n) / 180) * full.height;
            const crop = createImageBitmap(full, sx, sy, ((e - w) / 360) * full.width, ((n - s) / 180) * full.height, { imageOrientation: "flipY" });
            void crop.finally(() => full.close());
            return crop;
          }),
        );
      bitmaps.current.set(frame, pending);
    }
    pending.then((b) => !cancelled && setDecal(b)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [seq, frame, w, s, e, n]);

  return { seq, frame, setFrame, step, decal, error };
}
