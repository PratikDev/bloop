"use client";

import { useLoaded } from "@/hooks/use-loaded";
import { DATA_PATHS } from "@/lib/data";
import { loadImage } from "@/lib/load-image";
import { useAppState } from "../AppState/use-app-state";

const loadSstImage = () => loadImage(DATA_PATHS.sstImage);
const loadRainImage = () => loadImage(DATA_PATHS.rainImage);

/** The EIC frame images: ocean now, rain only after Start (like the rain grid). `failed` says a picture didn't load (the sound and readings don't need it). */
export function useFrameImages(): { sst: HTMLImageElement | null; rain: HTMLImageElement | null; failed: boolean } {
  const { state } = useAppState();
  const ocean = useLoaded(loadSstImage);
  const rain = useLoaded(loadRainImage, state.started);
  return { sst: ocean.value, rain: rain.value, failed: ocean.error || rain.error };
}
