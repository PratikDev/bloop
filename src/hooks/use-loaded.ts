"use client";

import { useEffect, useState } from "react";

export type LoadStatus = "loading" | "ready" | "error";

export interface Loaded<T> {
  value: T | null;
  status: LoadStatus;
  /** status === "error": the caller shows its own message, never a guess. */
  error: boolean;
}

/**
 * Runs `load` once `enabled` is true and keeps its result. `load` must be a
 * stable function (defined outside the component). A result that arrives after
 * unmount is dropped.
 */
export function useLoaded<T>(load: () => Promise<T>, enabled = true): Loaded<T> {
  const [result, setResult] = useState<{ value: T | null; status: LoadStatus }>({ value: null, status: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load()
      .then((value) => !cancelled && setResult({ value, status: "ready" }))
      .catch(() => !cancelled && setResult({ value: null, status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [load, enabled]);

  return { ...result, error: result.status === "error" };
}
