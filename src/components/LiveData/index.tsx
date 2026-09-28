"use client";

import { useMemo, type ReactNode } from "react";
import { useLoaded } from "@/hooks/use-loaded";
import { loadRain, loadSst } from "@/lib/data";
import { useAppState } from "../AppState/use-app-state";
import { LiveDataContext } from "./use-live-data";

/**
 * Loads today's grids: the ocean grid at once (the Start screen waits for it),
 * the rain grid (4.7 MB) only after Start, so the Start screen settles sooner.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const { value: sst, status: sstStatus } = useLoaded(loadSst);
  const { value: rain, status: rainStatus } = useLoaded(loadRain, state.started);

  const value = useMemo(
    () => ({ sst, rain, sstStatus, rainStatus, fields: sst ? { sst, rain } : null }),
    [sst, rain, sstStatus, rainStatus],
  );
  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}
