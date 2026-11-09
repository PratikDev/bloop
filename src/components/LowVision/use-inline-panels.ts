"use client";

import { FLAGS } from "@/lib/flags";
import { useAppState } from "../AppState/use-app-state";
import { lowVisionFlow } from "./use-apply-low-vision";

/**
 * Whether dialogs and sheets open in the page instead (spec 4.5: no full-screen pop-ups in low-vision mode): with the
 * preset on, or whenever the low-vision settings make pages flow (at large sizes a pop-up fills the screen).
 */
export function useInlinePanels(): boolean {
  const { state } = useAppState();
  return FLAGS.lowVision && (state.lowVision.on || lowVisionFlow(state.lowVision));
}
