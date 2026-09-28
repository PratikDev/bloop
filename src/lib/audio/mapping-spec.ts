// PURE: the app's mapping (public/mapping.json), validated once at import, and
// voice lookup by id. Every other mapping module reads the numbers from here.

import raw from "../../../public/mapping.json";
import type { MappingSpec, VoiceSpec } from "@/types/data-contract";
import { MappingError, validateMapping } from "./mapping-validate";

// The app's mapping, validated once at import. A bad file fails loudly at start-up.
export const MAPPING: MappingSpec = validateMapping(raw);

/** Looks up a voice (or earcon) by id. Throws if it isn't in mapping.json. */
export function voiceSpec(id: string, spec: MappingSpec = MAPPING): VoiceSpec {
  const v = spec.voices.find((x) => x.id === id);
  if (!v) throw new MappingError(`no voice with id "${id}"`);
  return v;
}
