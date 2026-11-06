import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { OceanInput } from "./use-live-controls";

const WALK_MS = 10_000;
const STEP_MS = 16; // ~60 Hz, like a mouse drag
const STEP_C = 0.6;
const STEP_LON = 4;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** Moves the ocean value and longitude randomly at 60 Hz for 10 s (simulates dragging the cursor). */
export function useRandomWalk(oceanRef: RefObject<OceanInput>, updateOcean: (patch: Partial<OceanInput>) => void) {
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    const endAt = performance.now() + WALK_MS;
    setRunning(true);
    timer.current = setInterval(() => {
      if (performance.now() >= endAt) return stop();
      const { valueC, lon } = oceanRef.current;
      updateOcean({
        noData: false,
        valueC: clamp(valueC + (Math.random() - 0.5) * STEP_C, -5, 35),
        lon: wrapLon(lon + (Math.random() - 0.5) * STEP_LON),
      });
    }, STEP_MS);
  }, [oceanRef, updateOcean, stop]);

  useEffect(() => stop, [stop]);

  return { running, start };
}
