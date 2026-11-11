import type { EarthCategory, OrchestraApi, OrchestraVoice } from "@/lib/audio/layers/types";
import { EARCON_SEC, earconHz, FAMILIES, familyFor, type FamilyRecipe } from "./families";
import { familyNote, type OnSource } from "./synth";
import { getCategory } from "./table";

export { categoryOfVoice, getCategory, recordsIn, UNCLASSIFIED } from "./table";
export { EARCON_SEC, FAMILIES, familyFor, REFERENCE_HZ, type FamilyRecipe, type Timbre } from "./families";
export { mixInto } from "./mix";
export { familyNote, noiseBand, noiseBuffer, seeded, setSpectrum, type NoteOptions, type OnSource } from "./synth";

const voices = new Map<EarthCategory, OrchestraVoice>();

export function orchestraVoice(category: EarthCategory): OrchestraVoice {
  let v = voices.get(category);
  if (!v) {
    const family = FAMILIES[category];
    v = { category, note: (ctx, out, note) => familyNote(ctx, out, family, note) };
    voices.set(category, v);
  }
  return v;
}

export const orchestra: OrchestraApi = { getCategory, orchestraVoice };

const EARCON_GAIN = 0.12;

export function playCategoryEarcon(ctx: BaseAudioContext, out: AudioNode, family: FamilyRecipe, when: number, onSource?: OnSource): void {
  const notes = earconHz(family);
  const step = EARCON_SEC / notes.length;
  notes.forEach((hz, i) => familyNote(ctx, out, family, { hz, when: when + i * step, duration: step * 0.9, gain: EARCON_GAIN }, { onSource }));
}

export function earconFamily(recordId: string): FamilyRecipe | null {
  const c = getCategory(recordId);
  return c === null ? null : familyFor(c, true);
}
