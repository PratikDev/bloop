// Where the app plays sound, page by page, as the mapping.json voices it plays (each voice names its
// meta/freshness.json product) plus the records it plays directly. Read from the code that plays them, so the credits
// follow the app: a new track, part or scene changes the credits with no list to edit.

import { SCENE_VOICES } from "@/components/Scenes/registry";
import { isFieldPart, VIEW_PARTS } from "@/components/ThenNow/parts";
import { TRACK_VOICES } from "@/lib/audio-jukebox/types";
import { voiceSpec } from "@/lib/audio/mapping";
import type { CreditPage } from "./types";

const LIVE_VOICES = [...new Set(Object.values(TRACK_VOICES).flat())];
/** Proof in unison (the U key, How we know's ocean check): the frame and the MUR file at the same point. */
const UNISON = "unison";
/** Listen's time-lapse plays the rain sequence (48 frames) with the rain voice. */
const TIME_LAPSE_PRODUCT = "sequence";

export interface Surface {
  page: Exclude<CreditPage, "official">;
  voices: readonly string[];
  products?: readonly string[];
}

/** Every page but Official records, whose records are its index rows (build.ts reads them from the indexes). */
export const SURFACES: readonly Surface[] = [
  { page: "listen", voices: [...LIVE_VOICES, UNISON], products: [TIME_LAPSE_PRODUCT] },
  { page: "thenNow", voices: VIEW_PARTS.filter((p) => !isFieldPart(p)) },
  { page: "how", voices: [UNISON] },
  { page: "turntable", voices: [...LIVE_VOICES, ...Object.values(SCENE_VOICES).flat(), UNISON] },
  // The braille explorer on Listen reads the live tracks; on Official records, the record playing (added in build.ts).
  { page: "braille", voices: LIVE_VOICES },
];

/** The freshness.json product a voice plays; undefined for a voice with no product (cues, the motif). */
export const voiceProduct = (voice: string): string | undefined => voiceSpec(voice).source.product;
