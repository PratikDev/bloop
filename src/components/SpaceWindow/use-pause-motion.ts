"use client";

import { useCallback, useState } from "react";

export interface PauseMotion {
  paused: boolean;
  toggle(): void;
}

/** A stage's "Pause motion" state. */
export function usePauseMotion(): PauseMotion {
  const [paused, setPaused] = useState(false);
  const toggle = useCallback(() => setPaused((p) => !p), []);
  return { paused, toggle };
}
