"use client";

import { useCallback, useState } from "react";

/**
 * One of Ask Bloop's own settings (the input language, the Alt+K shortcut): remembered on this device in a try/catch
 * (a blocked storage only means it isn't remembered); `fallback` until one is chosen.
 */
export function useStoredChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T | null>(() => {
    try {
      return allowed.find((v) => v === localStorage.getItem(key)) ?? null;
    } catch {
      return null;
    }
  });
  const choose = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // Not remembered, still used.
      }
    },
    [key],
  );
  return [value ?? fallback, choose];
}
