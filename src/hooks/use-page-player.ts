"use client";

import { useEffect, useId, useSyncExternalStore } from "react";

// Which of a page's own players (Then vs Now, Month by month, Official records) are sounding now, so the player bar's
// caption shows only while sound plays.
const sounding = new Set<string>();
const listeners = new Set<() => void>();

function set(id: string, on: boolean): void {
  if (on === sounding.has(id)) return;
  if (on) sounding.add(id);
  else sounding.delete(id);
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const snapshot = () => sounding.size > 0;
const serverSnapshot = () => false;

/** Reports whether this page player is sounding (and stops reporting when it unmounts). */
export function useReportPagePlayer(on: boolean): void {
  const id = useId();
  useEffect(() => {
    set(id, on);
    return () => set(id, false);
  }, [id, on]);
}

/** Whether any page player is sounding. */
export function usePagePlayerSounding(): boolean {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
