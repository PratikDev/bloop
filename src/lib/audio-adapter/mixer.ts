// Mute, solo, per-voice volume and track mode, combined into one gain per live
// voice bus. Sequences that name their own voices (legend, opening) lift the
// track-mode gate while they play; mute and solo still apply.

import { getGraph, glideTo, LIVE_VOICES } from "./graph";
import { TRACK_VOICES, type LiveVoiceId, type TrackMode, type VoiceId } from "./types";

const MIX_GLIDE_SEC = 0.05;

const state = {
  trackMode: "both" as TrackMode,
  allMuted: false,
  solo: null as VoiceId | null,
  muted: new Set<VoiceId>(),
  volume: { ocean: 1, rain: 1, snow: 1 } as Record<LiveVoiceId, number>,
  trackGateLifted: false,
};

function voiceGain(id: LiveVoiceId): number {
  if (state.allMuted || state.muted.has(id)) return 0;
  if (state.solo !== null && state.solo !== id) return 0;
  if (!state.trackGateLifted && !TRACK_VOICES[state.trackMode].includes(id)) return 0;
  return state.volume[id];
}

/** Pushes the current mixer state to the voice buses. */
export function applyMix(): void {
  const graph = getGraph();
  if (!graph) return;
  for (const id of LIVE_VOICES) glideTo(graph.ctx, graph.voiceBus[id].gain, voiceGain(id), MIX_GLIDE_SEC);
}

function isLive(id: VoiceId): id is LiveVoiceId {
  return (LIVE_VOICES as readonly VoiceId[]).includes(id);
}

export const mixer = {
  setTrackMode(mode: TrackMode) {
    state.trackMode = mode;
    applyMix();
  },
  setVoiceMuted(id: VoiceId, muted: boolean) {
    if (muted) state.muted.add(id);
    else state.muted.delete(id);
    applyMix();
  },
  setSolo(id: VoiceId | null) {
    state.solo = id;
    applyMix();
  },
  setAllMuted(muted: boolean) {
    state.allMuted = muted;
    applyMix();
  },
  setVoiceVolume(id: VoiceId, v: number) {
    if (!isLive(id)) return; // other voices arrive with Then vs Now
    state.volume[id] = Math.min(1, Math.max(0, v));
    applyMix();
  },
  isAudible(id: LiveVoiceId): boolean {
    return voiceGain(id) > 0;
  },
  liftTrackGate(lifted: boolean) {
    state.trackGateLifted = lifted;
    applyMix();
  },
};
