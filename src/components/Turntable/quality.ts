// Rendering quality tiers: chosen automatically from the device, overridable
// in Settings. Every tier shows the same data; only decoration changes.

export const TIERS = ["ultra", "high", "low"] as const;
export type Tier = (typeof TIERS)[number];

export interface TierSpec {
  /** Width of the day, night and cloud maps (height is half). */
  surface: 8192 | 4096;
  normal: 4096 | 2048;
  clouds: boolean;
  ao: boolean;
  /** Depth of field, Jukebox view only. */
  dof: boolean;
  /** Bloom at half resolution with fewer mip levels. */
  cheapBloom: boolean;
}

export const TIER_SPEC: Record<Tier, TierSpec> = {
  ultra: { surface: 8192, normal: 4096, clouds: true, ao: true, dof: true, cheapBloom: false },
  high: { surface: 8192, normal: 4096, clouds: true, ao: false, dof: false, cheapBloom: false },
  low: { surface: 4096, normal: 2048, clouds: false, ao: false, dof: false, cheapBloom: true },
};

interface DeviceHints {
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

/** Low on small touch screens, ≤ 4 GB / ≤ 4 cores, or a GPU without 8K textures; Ultra on roomy desktops. */
export function detectTier(maxTextureSize: number): Tier {
  const nav: DeviceHints = navigator;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const touchSmall = window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900;
  if (touchSmall || memory <= 4 || cores <= 4 || maxTextureSize < 8192) return "low";
  return memory >= 8 && cores >= 8 && !window.matchMedia("(pointer: coarse)").matches ? "ultra" : "high";
}

/** The tier to render: the Settings choice, or the device's own (null = automatic). */
export function resolveTier(setting: Tier | null, maxTextureSize: number): Tier {
  return setting ?? detectTier(maxTextureSize);
}
