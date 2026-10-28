"use client";

import { useEffect, useState } from "react";

/**
 * A file loaded once when the component mounts. `loader` must be stable (a module-level
 * function). error = true if it failed: the caller shows its own message, never a guess.
 */
export function useLoaded<T>(loader: () => Promise<T>): { value: T | null; error: boolean } {
  const [state, setState] = useState<{ value: T | null; error: boolean }>({ value: null, error: false });
  useEffect(() => {
    let cancelled = false;
    loader()
      .then((value) => !cancelled && setState({ value, error: false }))
      .catch(() => !cancelled && setState({ value: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [loader]);
  return state;
}
