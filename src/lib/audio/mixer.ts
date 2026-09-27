// Applies the pure mixer rules (mixer-state.ts) to the graph, always with
// short glides so muting never clicks. Safe to call before Start: the state is
// kept and applied when the graph exists.

import { peekEngine } from "./context";
import { MAPPING } from "./mapping";
import { INITIAL_MIXER, channelOpen, masterLevel, type MixerState } from "./mixer-state";
import { glideTo } from "./params";
import { VOICE_IDS, type VoiceId } from "./types";

const MIX_GLIDE_SEC = 0.02;

let state: MixerState = INITIAL_MIXER;

export function applyMixer() {
  const engine = peekEngine();
  if (!engine) return;
  const { ctx, graph } = engine;
  for (const id of VOICE_IDS) {
    glideTo(ctx, graph.channels[id].mute.gain, channelOpen(id, state) ? 1 : 0, MIX_GLIDE_SEC);
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

export function setVoiceMuted(id: VoiceId, muted: boolean) {
  const set = new Set(state.muted);
  if (muted) set.add(id);
  else set.delete(id);
  update({ muted: set });
}

export function setSolo(id: VoiceId | null) {
  update({ solo: id });
}

/** The "M" key: silences everything (master) and restores it. */
export function setAllMuted(allMuted: boolean) {
  update({ allMuted });
}

/** User volume 0..1, always capped by mapping.json's masterGain. */
export function setMasterVolume(volume: number) {
  update({ volume });
}
