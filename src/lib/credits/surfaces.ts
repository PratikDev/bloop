import { SCENE_VOICES } from "@/components/Scenes/registry";
import { isFieldPart, VIEW_PARTS } from "@/components/ThenNow/parts";
import { TRACK_VOICES } from "@/lib/audio-jukebox/types";
import { voiceSpec } from "@/lib/audio/mapping";
import type { CreditPage } from "./types";
import { FLAGS } from "@/lib/flags";

const LIVE_VOICES = [...new Set(Object.values(TRACK_VOICES).flat())];
const UNISON = "unison";
const TIME_LAPSE_PRODUCT = "sequence";

export interface Surface {
  page: Exclude<CreditPage, "official">;
  voices: readonly string[];
  products?: readonly string[];
  shows?: readonly string[];
}

const THEN_NOW_SHOWN = ["gistemp_bd", "gpcp_bd", "gpcc_bd", "grace"] as const;
const HOW_SHOWN = ["globe_bd"] as const;

export const SURFACES: readonly Surface[] = [
  { page: "listen", voices: [...LIVE_VOICES, UNISON], products: [TIME_LAPSE_PRODUCT] },
  ...(FLAGS.dataFireWeather ? [{ page: "listen" as const, voices: ["fireWeather"] }] : []),
  { page: "thenNow", voices: VIEW_PARTS.filter((p) => !isFieldPart(p)), shows: THEN_NOW_SHOWN },
  { page: "how", voices: [UNISON], shows: HOW_SHOWN },
  { page: "turntable", voices: [...LIVE_VOICES, ...Object.values(SCENE_VOICES).flat(), UNISON] },
  { page: "braille", voices: LIVE_VOICES },
];

export const voiceProduct = (voice: string): string | undefined => voiceSpec(voice).source.product;
