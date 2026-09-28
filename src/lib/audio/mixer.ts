// Applies the pure mixer rules (mixer-state.ts) to the graph, always with
// short glides so mixer changes never click. Safe to call before Start: the
// state is kept and applied when the graph exists.

import { peekEngine } from "./context";
import { MAPPING } from "./mapping";
import { INITIAL_MIXER, channelLevel, isAudible, masterLevel, type MixerState } from "./mixer-state";
import { glideTo } from "./params";
import { VOICE_IDS, type TrackMode, type VoiceId } from "./types";

const MIX_GLIDE_SEC = 0.02;

let state: MixerState = INITIAL_MIXER;

export function applyMixer() {
  const engine = peekEngine();
  if (!engine) return;
  const { ctx, graph } = engine;
  for (const id of VOICE_IDS) {
    glideTo(ctx, graph.channels[id].mix.gain, channelLevel(id, state), MIX_GLIDE_SEC);
  }
  glideTo(ctx, graph.master.gain, masterLevel(state, MAPPING.global.masterGain), MIX_GLIDE_SEC);
}

function update(next: Partial<MixerState>) {
  state = { ...state, ...next };
  applyMixer();
}

export function getMixerState(): MixerState {
  return state;
}

/** Whether a listener can hear this voice now (captions, ticks and drop events are skipped otherwise). */
export function isVoiceAudible(id: VoiceId): boolean {
  return isAudible(id, state);
}

/** Track selector / keys 1, 2, 3: which live voices play. Switching fades, never clicks. */
export function setTrackMode(trackMode: TrackMode) {
  update({ trackMode });
}

/** Legend, warm-up and opening play their voices whatever the track mode (mute and solo still apply). */
export function setTrackGateLifted(trackGateLifted: boolean) {
  update({ trackGateLifted });
}

export function setVoiceMuted(id: VoiceId, muted: boolean) {
  const set = new Set(state.muted);
  if (muted) set.add(id);
  else set.delete(id);
  update({ muted: set });
}

export function setSolo(id: VoiceId | null) {
  update({ solo: id });
}

/** Per-voice volume slider, 0..1, applied under the voice's volume cap. */
export function setVoiceVolume(id: VoiceId, volume: number) {
  update({ voiceVolume: { ...state.voiceVolume, [id]: volume } });
}

/** The "M" key: silences everything (master) and restores it. */
export function setAllMuted(allMuted: boolean) {
  update({ allMuted });
}

/** User volume 0..1, always capped by mapping.json's masterGain. */
export function setMasterVolume(volume: number) {
  update({ volume });
}
