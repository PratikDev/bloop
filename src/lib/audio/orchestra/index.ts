// Earth Orchestra (docs/statement/ART.md): one instrument family per Earth system. This module is the OrchestraApi
// the other builds wire to (src/lib/audio/layers/types.ts): getCategory(recordId) from the generated table, and
// orchestraVoice(category), a voice that plays a note in that family. Timbre only: every note settles at exactly the
// pitch it is given.

import type { EarthCategory, OrchestraApi, OrchestraVoice } from "@/lib/audio/layers/types";
import { EARCON_SEC, earconHz, FAMILIES, familyFor, type FamilyRecipe } from "./families";
import { familyNote, type OnSource } from "./synth";
import { getCategory } from "./table";

export { categoryOfVoice, getCategory, recordsIn, UNCLASSIFIED } from "./table";
export { EARCON_SEC, FAMILIES, familyFor, REFERENCE_HZ, type FamilyRecipe, type Timbre } from "./families";
export { familyNote, noiseBand, noiseBuffer, seeded, setSpectrum, type NoteOptions, type OnSource } from "./synth";

const voices = new Map<EarthCategory, OrchestraVoice>();

/** The instrument family for a category (cached: voices hold no state). */
export function orchestraVoice(category: EarthCategory): OrchestraVoice {
  let v = voices.get(category);
  if (!v) {
    const family = FAMILIES[category];
    v = { category, note: (ctx, out, note) => familyNote(ctx, out, family, note) };
    voices.set(category, v);
  }
  return v;
}

/** What ART exports for DATA's records (and CV's chord, if it wants the family): see types.ts. */
export const orchestra: OrchestraApi = { getCategory, orchestraVoice };

const EARCON_GAIN = 0.12;

/**
 * The category earcon: a 0.4 s motif in the family's own instrument, on fixed notes (never data). The caller decides
 * whether sound is allowed (mute, the "Each step" setting).
 */
export function playCategoryEarcon(ctx: BaseAudioContext, out: AudioNode, family: FamilyRecipe, when: number, onSource?: OnSource): void {
  const notes = earconHz(family);
  const step = EARCON_SEC / notes.length;
  notes.forEach((hz, i) => familyNote(ctx, out, family, { hz, when: when + i * step, duration: step * 0.9, gain: EARCON_GAIN }, { onSource }));
}

/** The earcon for a record, or nothing for an unclassified one (plain tones have no category motif). */
export function earconFamily(recordId: string): FamilyRecipe | null {
  const c = getCategory(recordId);
  return c === null ? null : familyFor(c, true);
}
