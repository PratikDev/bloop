// PURE: mixer rules (track mode, mute, solo, per-voice volume, mute-all,
// master volume). mixer.ts applies them to Web Audio nodes; the rules
// themselves are unit-tested.

import { LIVE_VOICES, TRACK_VOICES, type LiveVoiceId, type TrackMode, type VoiceId } from "./types";

export interface MixerState {
  trackMode: TrackMode;
  /** Sequences that name their own voices (legend, warm-up, opening) play whatever the track mode. */
  trackGateLifted: boolean;
  muted: ReadonlySet<VoiceId>;
  solo: VoiceId | null;
  voiceVolume: Readonly<Partial<Record<VoiceId, number>>>; // 0..1 per voice; missing = 1
  allMuted: boolean;
  volume: number; // user master volume 0..1
}

export const INITIAL_MIXER: MixerState = {
  trackMode: "both",
  trackGateLifted: false,
  muted: new Set<VoiceId>(),
  solo: null,
  voiceVolume: {},
  allMuted: false,
  volume: 1,
};

const unit = (v: number) => Math.min(1, Math.max(0, v));

export function isLiveVoice(id: VoiceId): id is LiveVoiceId {
  return (LIVE_VOICES as readonly VoiceId[]).includes(id);
}

/** Whether the track mode lets a voice play (only live voices are gated). */
export function trackAllows(id: VoiceId, state: MixerState): boolean {
  if (!isLiveVoice(id) || state.trackGateLifted) return true;
  return TRACK_VOICES[state.trackMode].includes(id);
}

/**
 * A voice's mixer level, 0..1, applied under its volume cap. Track mode, mute
 * and solo silence it; otherwise it is the per-voice volume. Earcons and
 * narration are not voices, so none of this silences them.
 */
export function channelLevel(id: VoiceId, state: MixerState): number {
  if (!trackAllows(id, state)) return 0;
  if (state.muted.has(id)) return 0;
  if (state.solo !== null && state.solo !== id) return 0;
  return unit(state.voiceVolume[id] ?? 1);
}

/** Whether a listener can hear this voice right now (used to skip captions, ticks and drop events). */
export function isAudible(id: VoiceId, state: MixerState): boolean {
  return !state.allMuted && state.volume > 0 && channelLevel(id, state) > 0;
}

/** Master gain: capped by mapping.json's masterGain, scaled by user volume, 0 when everything is muted. */
export function masterLevel(state: MixerState, masterGain: number): number {
  if (state.allMuted) return 0;
  return masterGain * unit(state.volume);
}
