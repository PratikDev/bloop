// PURE: mixer rules (mute, solo, per-voice volume, mute-all, master volume).
// mixer.ts applies them to Web Audio nodes; the rules themselves are unit-tested.

import type { VoiceId } from "./types";

export interface MixerState {
  muted: ReadonlySet<VoiceId>;
  solo: VoiceId | null;
  voiceVolume: Readonly<Partial<Record<VoiceId, number>>>; // 0..1 per voice; missing = 1
  allMuted: boolean;
  volume: number; // user master volume 0..1
}

export const INITIAL_MIXER: MixerState = {
  muted: new Set<VoiceId>(),
  solo: null,
  voiceVolume: {},
  allMuted: false,
  volume: 1,
};

const unit = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A voice's mixer level, 0..1, applied under its volume cap. Mute and solo
 * silence it; otherwise it is the per-voice volume. Earcons and narration are
 * not voices, so solo never silences them.
 */
export function channelLevel(id: VoiceId, state: MixerState): number {
  if (state.muted.has(id)) return 0;
  if (state.solo !== null && state.solo !== id) return 0;
  return unit(state.voiceVolume[id] ?? 1);
}

/** Master gain: capped by mapping.json's masterGain, scaled by user volume, 0 when everything is muted. */
export function masterLevel(state: MixerState, masterGain: number): number {
  if (state.allMuted) return 0;
  return masterGain * unit(state.volume);
}
