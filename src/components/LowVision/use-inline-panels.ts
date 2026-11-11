"use client";

import { FLAGS } from "@/lib/flags";
import { useAppState } from "../AppState/use-app-state";
import { lowVisionFlow } from "./use-apply-low-vision";

export function useInlinePanels(): boolean {
  const { state } = useAppState();
  return FLAGS.lowVision && (state.lowVision.on || lowVisionFlow(state.lowVision));
}
