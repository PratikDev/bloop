import type { EarthCategory } from "@/lib/audio/layers/types";

export type Timbre = EarthCategory | "plain";

interface SpectrumLayer {
  partials: readonly number[];
  decay: number | null;
  gain: number;
}

export interface Texture {
  hz: number;
  q: number;
  gain: number;
  sustain: boolean;
}

export interface FamilyRecipe {
  timbre: Timbre;
  layers: readonly SpectrumLayer[];
  attack: number;
  release: number;
  lowpass: number | null;
  texture: Texture | null;
  live: readonly number[];
  earcon: readonly number[];
}

const EARCON_BASE_HZ = 523.25;
export const EARCON_SEC = 0.4;
export const REFERENCE_HZ = 329.63;

export const FAMILIES: Readonly<Record<Timbre, FamilyRecipe>> = {
  plain: { timbre: "plain", layers: [{ partials: [1], decay: null, gain: 1 }], attack: 0.02, release: 0.08, lowpass: null, texture: null, live: [1], earcon: [0, 7] },
  ocean: {
    timbre: "ocean",
    layers: [{ partials: [1, 0.18, 0.06, 0.02], decay: null, gain: 1 }],
    attack: 0.08,
    release: 0.2,
    lowpass: 4000,
    texture: { hz: 2000, q: 0.7, gain: 0.12, sustain: true },
    live: [1, 0.18, 0.06, 0.02],
    earcon: [0, 7],
  },
  air: {
    timbre: "air",
    layers: [
      { partials: [1, 0.3, 0.12, 0.05], decay: null, gain: 0.7 },
      { partials: [1, 0, 0.2, 0, 0.08], decay: null, gain: 0.3 },
    ],
    attack: 0.25,
    release: 0.5,
    lowpass: 2500,
    texture: { hz: 3000, q: 0.5, gain: 0.05, sustain: true },
    live: [1, 0.3, 0.16, 0.05, 0.03],
    earcon: [7, 0],
  },
  land: {
    timbre: "land",
    layers: [
      { partials: [1, 0.6, 0.45, 0.35, 0.25, 0.18, 0.12, 0.08], decay: 0.25, gain: 0.6 },
      { partials: [1, 0.25, 0.08], decay: 1.2, gain: 0.5 },
    ],
    attack: 0.004,
    release: 0.15,
    lowpass: null,
    texture: { hz: 3500, q: 0.8, gain: 0.15, sustain: false },
    live: [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.12],
    earcon: [0, 4, 7],
  },
  fire: {
    timbre: "fire",
    layers: [
      { partials: [1, 0, 0.45, 0, 0.3, 0, 0.2, 0, 0.12], decay: 0.18, gain: 0.7 },
      { partials: [1, 0, 0.1], decay: 0.6, gain: 0.3 },
    ],
    attack: 0.003,
    release: 0.12,
    lowpass: 3000,
    texture: { hz: 5000, q: 0.6, gain: 0.07, sustain: true },
    live: [1, 0, 0.4, 0, 0.25, 0, 0.15],
    earcon: [0, 0, 0],
  },
  ice: {
    timbre: "ice",
    layers: [
      { partials: [1, 0, 0, 0.5, 0, 0, 0, 0.25], decay: 0.4, gain: 0.5 },
      { partials: [1, 0.1], decay: 2, gain: 0.6 },
    ],
    attack: 0.002,
    release: 0.3,
    lowpass: null,
    texture: null,
    live: [1, 0.3, 0, 0.35, 0, 0, 0, 0.15],
    earcon: [0, 12],
  },
  people: {
    timbre: "people",
    layers: [
      { partials: [1, 0.5, 0.3, 0.15, 0.08], decay: 0.5, gain: 0.6 },
      { partials: [1, 0.2, 0.05], decay: 1.8, gain: 0.5 },
    ],
    attack: 0.006,
    release: 0.25,
    lowpass: 2200,
    texture: { hz: 1200, q: 1, gain: 0.1, sustain: false },
    live: [1, 0.45, 0.25, 0.12, 0.06],
    earcon: [0, 4],
  },
};

export function familyFor(category: EarthCategory | null, orchestra: boolean): FamilyRecipe {
  return FAMILIES[orchestra && category !== null ? category : "plain"];
}

export const earconHz = (f: FamilyRecipe): number[] => f.earcon.map((s) => EARCON_BASE_HZ * 2 ** (s / 12));

export const noteAttack = (family: Pick<FamilyRecipe, "attack">, duration: number): number => Math.min(family.attack, duration / 2);
