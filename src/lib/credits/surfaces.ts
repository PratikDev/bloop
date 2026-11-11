// Where the app uses data, page by page: the mapping.json voices it plays (each voice names its meta/freshness.json
// product), the records it plays directly, and the records whose numbers it shows without playing them. Voices are read
// from the code that plays them, so a new track, part or scene changes the credits with no list to edit.

import { SCENE_VOICES } from "@/components/Scenes/registry";
import { isFieldPart, VIEW_PARTS } from "@/components/ThenNow/parts";
import { TRACK_VOICES } from "@/lib/audio-jukebox/types";
import { voiceSpec } from "@/lib/audio/mapping";
import type { CreditPage } from "./types";
import { FLAGS } from "@/lib/flags";

const LIVE_VOICES = [...new Set(Object.values(TRACK_VOICES).flat())];
/** Proof in unison (the U key, How we know's ocean check): the frame and the MUR file at the same point. */
const UNISON = "unison";
/** Listen's time-lapse plays the rain sequence (48 frames) with the rain voice. */
const TIME_LAPSE_PRODUCT = "sequence";

export interface Surface {
  page: Exclude<CreditPage, "official">;
  voices: readonly string[];
  products?: readonly string[];
  /** Registry products whose numbers the page shows (a source counts if the app plays it or shows a number from it). */
  shows?: readonly string[];
}

/** Then vs Now shows each part's decade numbers and statistics (GPCC's rain change among them), from files that
 *  pipeline/build_demo.py builds out of these records. */
const THEN_NOW_SHOWN = ["gistemp_bd", "gpcp_bd", "gpcc_bd", "grace"] as const;
/** How we know's ground-vs-satellite card shows GLOBE's numbers (rho, n), from pipeline/build_globe_duet.py's file. */
const HOW_SHOWN = ["globe_bd"] as const;

/** Every page but Official records, whose records are its index rows (build.ts reads them from the indexes). */
export const SURFACES: readonly Surface[] = [
  { page: "listen", voices: [...LIVE_VOICES, UNISON], products: [TIME_LAPSE_PRODUCT] },
  // Listen's fire-weather layer plays the SVS 5315 forecast (behind its flag; credited when it plays).
  ...(FLAGS.dataFireWeather ? [{ page: "listen" as const, voices: ["fireWeather"] }] : []),
  { page: "thenNow", voices: VIEW_PARTS.filter((p) => !isFieldPart(p)), shows: THEN_NOW_SHOWN },
  { page: "how", voices: [UNISON], shows: HOW_SHOWN },
  { page: "turntable", voices: [...LIVE_VOICES, ...Object.values(SCENE_VOICES).flat(), UNISON] },
  // The braille explorer on Listen reads the live tracks; on Official records, the record playing (added in build.ts).
  { page: "braille", voices: LIVE_VOICES },
];

/** The freshness.json product a voice plays; undefined for a voice with no product (cues, the motif). */
export const voiceProduct = (voice: string): string | undefined => voiceSpec(voice).source.product;
