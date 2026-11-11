// Which Earth system a live record voice plays in: its own (a rule used by one system), or, for a rule shared across
// systems, the record being played now (the art settings' play context). null = plain tones.

import type { EarthCategory } from "@/lib/audio/layers/types";
import { categoryOfVoice, getCategory } from "@/lib/audio/orchestra";
import { getArt } from "../settings";

export function recordCategory(voiceId: string): EarthCategory | null {
  const own = categoryOfVoice(voiceId);
  if (own !== null) return own;
  const record = getArt().context?.recordId;
  return record === undefined ? null : getCategory(record);
}
