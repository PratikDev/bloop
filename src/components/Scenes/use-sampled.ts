"use client";

import { useEffect, useState } from "react";

const SAMPLE_MS = 250;

/**
 * A value that changes every frame (the needle under a moving camera), as React
 * state sampled at 4 Hz: the chip, legend and caption re-render only when it
 * actually changes (by `key`).
 */
export function useSampled<T>(read: () => T, key: (v: T) => string, ms = SAMPLE_MS): T {
  const [value, setValue] = useState(read);
  useEffect(() => {
    let last = key(value);
    const id = setInterval(() => {
      const next = read();
      const k = key(next);
      if (k === last) return;
      last = k;
      setValue(next);
    }, ms);
    return () => clearInterval(id);
    // read and key are stable per scene (refs inside); the interval runs for the scene's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms]);
  return value;
}
