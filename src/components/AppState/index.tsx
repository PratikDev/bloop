"use client";

import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { readPrefs, writePrefs } from "./prefs";
import { initialState, reducer, type Mode } from "./reducer";
import { AppStateContext } from "./use-app-state";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `initialMode` comes from the URL, so a deep link renders the right page state
 * from the first frame. The app renders in the browser only, so remembered
 * settings are read here too, before the first paint.
 */
export function AppStateProvider({ initialMode, children }: { initialMode: Mode; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialMode, (mode) => ({ ...initialState, ...readPrefs(), mode }));

  // The OS setting is the default; the in-app toggle can override it.
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => dispatch({ type: "setReduceMotion", on: media.matches });
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Settings remembered on this device.
  const { lang, describe, captions, builtInVoice } = state;
  useEffect(() => writePrefs({ lang, describe, captions, builtInVoice }), [lang, describe, captions, builtInVoice]);

  // Language and reduced motion live on <html> so CSS and screen readers see them.
  useEffect(() => {
    document.documentElement.lang = state.lang;
    document.documentElement.dataset.reduceMotion = String(state.reduceMotion);
  }, [state.lang, state.reduceMotion]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
