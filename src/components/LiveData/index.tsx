"use client";

import { useMemo, type ReactNode } from "react";
import { useIdle } from "@/hooks/use-idle";
import { useLoaded } from "@/hooks/use-loaded";
import { loadRain, loadSst } from "@/lib/data";
import { useAppState } from "../AppState/use-app-state";
import { LiveDataContext } from "./use-live-data";

// ── Session B (performance): the longest the rain prefetch waits for a quiet moment after the Start screen is up.
const RAIN_PREFETCH_DEADLINE_MS = 1000;
// ── end Session B

/**
 * Loads today's grids: the ocean grid at once (the Start screen waits for it),
 * the rain grid (4.7 MB) once the Start screen is usable and idle, or at Start.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const { value: sst, status: sstStatus } = useLoaded(loadSst);
  // ── Session B (performance): the rain grid is the first sound's data too, so it is fetched once the Start screen is
  // usable and idle (lib/idle.ts), or at Start if that comes first: the opening then plays within moments of the click.
  const idle = useIdle(RAIN_PREFETCH_DEADLINE_MS);
  const { value: rain, status: rainStatus } = useLoaded(loadRain, state.started || idle);
  // ── end Session B

  const value = useMemo(
    () => ({ sst, rain, sstStatus, rainStatus, fields: sst ? { sst, rain } : null }),
    [sst, rain, sstStatus, rainStatus],
  );
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}
