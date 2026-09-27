"use client";

import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { contentLang } from "@/lib/i18n";
import { initialState, reducer } from "./reducer";
import { AppStateContext } from "./use-app-state";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // The OS setting is the default; the in-app toggle can override it.
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => dispatch({ type: "setReduceMotion", on: media.matches });
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Language and reduced motion live on <html> so CSS and screen readers see them.
  useEffect(() => {
    document.documentElement.lang = contentLang(state.lang);
    document.documentElement.dataset.reduceMotion = String(state.reduceMotion);
  }, [state.lang, state.reduceMotion]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}
