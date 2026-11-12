"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useIdle } from "@/hooks/use-idle";
import { useLoaded } from "@/hooks/use-loaded";
import { loadRain, loadSst } from "@/lib/data";
import { connectionAllowsPrefetch } from "@/lib/prefetch";
import { locationForMode, PAGE_PATHS, type PagePath } from "@/router/modes";
import { useAppState } from "../AppState/use-app-state";
import { LiveDataContext } from "./use-live-data";

// ── Session B (performance): the longest the rain prefetch waits for a quiet moment after the Start screen is up.
const RAIN_PREFETCH_DEADLINE_MS = 1000;
/** The first pages that prefetch it: the two where Start is usually pressed. */
const RAIN_PREFETCH_PAGES: readonly PagePath[] = [PAGE_PATHS.home, PAGE_PATHS.listen];
// ── end Session B

/**
 * Loads today's grids: the ocean grid at once (the Start screen waits for it),
 * the rain grid (4.7 MB) once Home or Listen is usable and idle (not on a slow or
 * data-saving connection), or at Start.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const { value: sst, status: sstStatus } = useLoaded(loadSst);
  // ── Session B (performance): the rain grid is the first sound's data too, so it is fetched once the Start screen is
  // usable and idle (lib/idle.ts), or at Start if that comes first: the opening then plays within moments of the click.
  // Only when the visit starts on Home or Listen, and never on Data Saver or a 3G-or-slower connection (lib/prefetch.ts).
  const [prefetch] = useState(() => RAIN_PREFETCH_PAGES.includes(locationForMode(state.mode).to) && connectionAllowsPrefetch());
  const idle = useIdle(RAIN_PREFETCH_DEADLINE_MS);
  const { value: rain, status: rainStatus } = useLoaded(loadRain, state.started || (prefetch && idle));
  // ── end Session B

  const value = useMemo(
    () => ({ sst, rain, sstStatus, rainStatus, fields: sst ? { sst, rain } : null }),
    [sst, rain, sstStatus, rainStatus],
  );
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}
