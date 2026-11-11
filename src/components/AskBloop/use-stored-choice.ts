"use client";

import { useCallback, useState } from "react";

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
      }
    },
    [key],
  );
  return [value ?? fallback, choose];
}
