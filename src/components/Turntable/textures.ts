// Which basemap size to load, and loading it. 4096 by default, 2048 on low-end
// or small touch devices (or a GPU that can't hold 4096), 8192 only on request.

import { TextureLoader } from "three";
import type { EarthTextures } from "./scene/earth";

export const QUALITIES = [2048, 4096, 8192] as const;
export type TextureQuality = (typeof QUALITIES)[number];

interface DeviceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

export function defaultQuality(maxTextureSize: number): TextureQuality {
  const nav: DeviceHints = navigator;
  const lowEnd =
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    maxTextureSize < 4096 ||
    (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900);
  return lowEnd ? 2048 : 4096;
}

/** The sizes this GPU can show. */
export function availableQualities(maxTextureSize: number): TextureQuality[] {
  return QUALITIES.filter((q) => q <= maxTextureSize);
}

/** Relief shading is subtle; it's skipped at 2048 (low-end) and never loaded above 4096. */
export async function loadEarthTextures(quality: TextureQuality): Promise<EarthTextures & { reliefOn: boolean }> {
  const loader = new TextureLoader();
  const reliefSize = quality === 2048 ? 2048 : 4096;
  const [day, night, relief] = await Promise.all([
    loader.loadAsync(`/textures/earth-day-${quality}.webp`),
    loader.loadAsync(`/textures/earth-night-${quality}.webp`),
    loader.loadAsync(`/textures/earth-relief-${reliefSize}.webp`),
  ]);
  return { day, night, relief, reliefOn: quality !== 2048 };
}
