import type { EarthCategory } from "@/lib/audio/layers/types";
import { categoryOfVoice, getCategory } from "@/lib/audio/orchestra";
import { getArt } from "../settings";

export function recordCategory(voiceId: string): EarthCategory | null {
  const own = categoryOfVoice(voiceId);
  if (own !== null) return own;
  const record = getArt().context?.recordId;
  return record === undefined ? null : getCategory(record);
}
