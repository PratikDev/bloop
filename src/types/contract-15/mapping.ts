// §15 mapping.json additions (additive to §10).

/** A voice that plays another voice's rule unchanged (e.g. proof in unison uses the Ocean rule twice). */
export interface SameAsMapping {
  kind: "sameAs";
  voice: string; // the voice id whose rule is used
  input: { unit: string };
}

/** Output params added after §10 (continuous rules). */
export type ExtraOutputParam = "reverbSec";
