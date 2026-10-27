// The Turntable's own view settings (Layers and Settings drawers). Design only:
// none of them changes a value, a sound or what the needle reads.

import type { Tier } from "./quality";

export interface TurntableSettings {
  /** Data frame opacity, 0..1. */
  dataOpacity: number;
  sunAtFrameTime: boolean;
  /** Rendering tier (null = automatic). */
  quality: Tier | null;
  clouds: boolean;
  labels: boolean;
  borders: boolean;
  districts: boolean;
  rivers: boolean;
  graticule: boolean;
}

/** The layers the scene draws or hides. */
export type LayerToggles = Pick<TurntableSettings, "clouds" | "borders" | "districts" | "rivers" | "graticule">;

export const DEFAULT_SETTINGS: TurntableSettings = {
  dataOpacity: 0.85,
  sunAtFrameTime: true,
  quality: null,
  clouds: true,
  labels: true,
  borders: true,
  districts: true,
  rivers: true,
  graticule: false,
};

/** Opacity steps for the O key (default 85%, as the data layer starts). */
export const OPACITY_STEPS = [0, 0.25, 0.5, 0.85, 1] as const;

export const layerToggles = (s: TurntableSettings): LayerToggles => ({
  clouds: s.clouds,
  borders: s.borders,
  districts: s.districts,
  rivers: s.rivers,
  graticule: s.graticule,
});
