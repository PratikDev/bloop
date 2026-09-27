"use client";

import { createContext, useContext, type Dispatch } from "react";
import { bindT } from "@/lib/i18n";
import type { AppAction, AppState } from "./reducer";

export interface AppStateValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export const AppStateContext = createContext<AppStateValue | null>(null);

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside <AppStateProvider>");
  return value;
}

/** t() bound to the current language. */
export function useT() {
  const { state } = useAppState();
  return bindT(state.lang);
}
