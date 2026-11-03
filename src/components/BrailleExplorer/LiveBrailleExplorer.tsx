"use client";

import { useCallback } from "react";
import { useAppState } from "../AppState/use-app-state";
import { MAP_REGION_ID } from "../ExploreControls";
import { BrailleExplorer } from ".";
import { useLiveBrailleSource } from "./use-live-braille-source";

/** Explore's explorer: today's frames at the app's cursor. Closing returns focus to the map. */
export function LiveBrailleExplorer({ className }: { className?: string }) {
  const { state, dispatch } = useAppState();
  const source = useLiveBrailleSource();
  const close = useCallback(() => {
    dispatch({ type: "setBrailleOpen", open: false });
    document.getElementById(MAP_REGION_ID)?.focus();
  }, [dispatch]);
  if (!state.brailleOpen || !source || state.mode !== "explore") return null;
  return <BrailleExplorer source={source} onClose={close} className={className} />;
}
