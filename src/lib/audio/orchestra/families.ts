// PURE: Earth Orchestra's instrument families, one per Earth system, all synthesised (no samples). Every layer is a
// harmonic spectrum on an oscillator at exactly the note's frequency, so a family shapes timbre only: the settled
// pitch is the data's (the pitch-identity check measures it). Fixed filters and noise textures never follow data.
// Numbers are design choices, tuned by ear; docs/statement/ART.md lists them.

import type { EarthCategory } from "@/lib/audio/layers/types";

/** The instrument a sound plays on: a category's family, or today's plain tones. */
export type Timbre = EarthCategory | "plain";

/** One oscillator of a note: harmonic amplitudes (index 0 = the fundamental) and how it fades. */
export interface SpectrumLayer {
  partials: readonly number[];
  /** Decay time constant (s); null = sustains until released. Brighter layers decay first (the plucked-string law). */
  decay: number | null;
  gain: number;
}

/** Unpitched colour under a note: breath (flute), crackle (fire), a pick or a felt hammer. Fixed band, never data. */
export interface Texture {
  hz: number;
  q: number;
  gain: number;
  /** true: sounds as long as the note; false: a short burst at the onset. */
  sustain: boolean;
}

export interface FamilyRecipe {
  timbre: Timbre;
  layers: readonly SpectrumLayer[];
  attack: number;
  release: number;
  /** A fixed low-pass (Hz), or none. */
  lowpass: number | null;
  texture: Texture | null;
  /** The single spectrum a continuous (gliding) data voice wears in this family. */
  live: readonly number[];
  /** The category earcon: semitones above EARCON_BASE_HZ, played evenly in EARCON_SEC (fixed notes, never data). */
  earcon: readonly number[];
}

export const EARCON_BASE_HZ = 523.25; // C5
export const EARCON_SEC = 0.4;
/** The legend's demo note: one fixed reference pitch for every family (E4). */
export const REFERENCE_HZ = 329.63;

export const FAMILIES: Readonly<Record<Timbre, FamilyRecipe>> = {
  plain: { timbre: "plain", layers: [{ partials: [1], decay: null, gain: 1 }], attack: 0.02, release: 0.08, lowpass: null, texture: null, live: [1], earcon: [0, 7] },
  // Bowed / breathy: a near-sine flute ("bansuri") with breath noise.
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
  // Soft pad, airy: two soft spectra, slow attack, a little air.
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
  // Plucked string ("dotara / ektara"): a bright spectrum that dies fast over a mellow one, and a pick.
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
  // Muted metallic pluck with crackle: odd harmonics, damped, over a low hiss.
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
  // Glassy bell / soft mallet: octave partials (1, 4, 8) ring briefly over a long fundamental.
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
  // Felt piano: warm harmonics, a soft hammer, a gentle decay.
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

/** The family a sound plays on: Earth Orchestra's for a classified record, plain tones otherwise. */
export function familyFor(category: EarthCategory | null, orchestra: boolean): FamilyRecipe {
  return FAMILIES[orchestra && category !== null ? category : "plain"];
}

/** The earcon's notes as frequencies (fixed: never a data value). */
export const earconHz = (f: FamilyRecipe): number[] => f.earcon.map((s) => EARCON_BASE_HZ * 2 ** (s / 12));
