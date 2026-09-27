// PURE: mixer rules (mute, solo, mute-all, master volume). graph/mixer.ts
// applies them to Web Audio nodes; the rules themselves are unit-tested.

import type { VoiceId } from "./types";

export interface MixerState {
  muted: ReadonlySet<VoiceId>;
  solo: VoiceId | null;
  allMuted: boolean;
  volume: number; // user volume 0..1
}

export const INITIAL_MIXER: MixerState = {
  muted: new Set<VoiceId>(),
  solo: null,
  allMuted: false,
  volume: 1,
};

/** Whether a voice's channel is audible. Solo silences every other voice; earcons and narration are not voices. */
export function channelOpen(id: VoiceId, state: MixerState): boolean {
  if (state.muted.has(id)) return false;
  return state.solo === null || state.solo === id;
}

/** Master gain: capped by mapping.json's masterGain, scaled by user volume, 0 when everything is muted. */
export function masterLevel(state: MixerState, masterGain: number): number {
  if (state.allMuted) return 0;
  return masterGain * Math.min(1, Math.max(0, state.volume));
}
