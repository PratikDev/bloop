// The per-voice output trims of the mix stage (docs/audio/MIX.md): a constant gain at each voice channel's input,
// computed by scripts/mix-trims.ts from the measured loudness (mix-trims.json; never typed). Timbre and level only:
// pitch, onset timing, drop density and every value-driven level change inside a voice stay exactly as they were.

import { MAPPING } from "./mapping";
import trims from "./mix-trims.json";

const VOICE_TRIMS: Readonly<Record<string, { trim_db: number }>> = trims.voices;

/** A voice's trim in dB (0 for a voice the mix pass didn't trim). */
const trimDb = (voice: string): number => VOICE_TRIMS[voice]?.trim_db ?? 0;

/** A voice channel's input gain: the per-voice cap (public/mapping.json) times its trim. */
export const channelGain = (voice: string): number => MAPPING.global.voiceMaxGain * 10 ** (trimDb(voice) / 20);
