"use client";

import { useSyncExternalStore } from "react";

/** Whether a CSS media query matches; false during server rendering. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Windows contrast themes (and other forced-colour modes) are on. */
export const useForcedColors = () => useMediaQuery("(forced-colors: active)");
/** The OS asks for more contrast. */
export const usePrefersContrast = () => useMediaQuery("(prefers-contrast: more)");
/** The OS uses a light colour scheme. */
export const usePrefersLight = () => useMediaQuery("(prefers-color-scheme: light)");
