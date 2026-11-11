import { MAPPING } from "./mapping";
import trims from "./mix-trims.json";

const VOICE_TRIMS: Readonly<Record<string, { trim_db: number }>> = trims.voices;

const trimDb = (voice: string): number => VOICE_TRIMS[voice]?.trim_db ?? 0;

export const channelGain = (voice: string): number => MAPPING.global.voiceMaxGain * 10 ** (trimDb(voice) / 20);
