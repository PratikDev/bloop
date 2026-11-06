"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { DATA_PATHS } from "@/lib/data";
import { loadImage } from "@/lib/load-image";
import { useAppState } from "../AppState/use-app-state";

const loadSstImage = () => loadImage(DATA_PATHS.sstImage);
const loadRainImage = () => loadImage(DATA_PATHS.rainImage);

/** The EIC frame images: ocean now, rain only after Start (like the rain grid). A failed image shows nothing; the grid-driven error message covers it. */
export function useFrameImages(): { sst: HTMLImageElement | null; rain: HTMLImageElement | null } {
  const { state } = useAppState();
  const sst = useLoaded(loadSstImage).value;
  const rain = useLoaded(loadRainImage, state.started).value;
  return { sst, rain };
}
