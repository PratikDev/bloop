// Shared plumbing for voices: output routing, stereo and per-voice level.

import { getCtx, getGraph } from "../context";
import { MAPPING, panFor, voiceSpec } from "../mapping";
import { glideAt } from "../params";
import type { VoiceId } from "../types";

const PAN_GLIDE_SEC = 0.03;

/**
 * Peak level of a voice inside its channel, 0..1. The channel input sits at
 * the global voice cap, so a voice whose mapping.json maxGain is lower plays
 * proportionally quieter.
 */
export function voicePeak(id: string): number {
  return voiceSpec(id).sound.maxGain / MAPPING.global.voiceMaxGain;
}

/** A stereo panner (at `pan`, −1..1) feeding the voice's mixer channel. Voices connect their sound into it. */
export function createVoiceOutput(id: VoiceId, pan = 0): StereoPannerNode {
  const panner = new StereoPannerNode(getCtx(), { pan });
  panner.connect(getGraph().channels[id].input);
  return panner;
}

/** When a voice change happens: now (omitted) or at an audio-clock time, with an optional glide override. */
export interface VoiceTiming {
  time?: number;
  glideSec?: number;
}

/** Stereo by longitude (west left, east right), gliding so it never clicks; at `time` if given. */
export function panTo(panner: StereoPannerNode, lon: number, time?: number) {
  glideAt(getCtx(), panner.pan, panFor(lon), PAN_GLIDE_SEC, time);
}
