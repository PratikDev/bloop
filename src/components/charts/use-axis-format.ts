"use client";

import { formatAxis, formatYear } from "@/lib/i18n";
import { useAppState } from "../AppState/use-app-state";

/** Axis tick text in the page's language (Bengali digits in Bangla). */
export function useAxisFormat() {
  const { state } = useAppState();
  return {
    value: (v: number) => formatAxis(v, state.lang),
    year: (v: number) => formatYear(v, state.lang),
  };
}
