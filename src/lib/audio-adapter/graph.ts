// One AudioContext and the fixed node graph (docs/L2/AUDIO_RESEARCH.md A3, A5, A8).
//
//   voice buses (ocean, rain, snow) ─┐
//   context bus (heat, monsoon, water) ─► fade ─► sonification (duckable) ─┐
//   earcons, legend bells ─────────────────────────────────────────────┤
//                                                                      ▼
//            master (masterGain × user volume) ─► compressor (safety net) ─► analyser ─► speakers
//
// Gain staging is the real cap: each voice ≤ voiceMaxGain, at most three live
// voices, so the sum stays below 1.0 before the master.

import { MAPPING } from "@/lib/audio/mapping";
import { LIVE_VOICES, type LiveVoiceId } from "./types";

export { LIVE_VOICES };

export interface Graph {
  ctx: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  sonification: GainNode; // ducked during speech
  fade: GainNode; // stopAll and the opening's fade in/out
  earcons: GainNode;
  voiceBus: Record<LiveVoiceId, GainNode>; // mixer: mute, solo, volume, track mode
  context: GainNode; // Then vs Now and history voices (one plays at a time)
  noise: AudioBuffer; // one shared buffer for every raindrop and tick
}

let graph: Graph | null = null;

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // 1 s
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function build(ctx: AudioContext): Graph {
  const g = MAPPING.global;
  const analyser = new AnalyserNode(ctx, { fftSize: 2048 });
  const compressor = new DynamicsCompressorNode(ctx, {
    threshold: g.compressor.thresholdDb,
    ratio: g.compressor.ratio,
    attack: g.compressor.attackSec,
    release: g.compressor.releaseSec,
  });
  const master = new GainNode(ctx, { gain: g.masterGain });
  const sonification = new GainNode(ctx, { gain: 1 });
  const fade = new GainNode(ctx, { gain: 1 });
  const earcons = new GainNode(ctx, { gain: 1 });

  master.connect(compressor).connect(analyser).connect(ctx.destination);
  sonification.connect(master);
  earcons.connect(master);
  fade.connect(sonification);

  const voiceBus = {} as Record<LiveVoiceId, GainNode>;
  for (const id of LIVE_VOICES) {
    voiceBus[id] = new GainNode(ctx, { gain: 1 });
    voiceBus[id].connect(fade);
  }

  const context = new GainNode(ctx, { gain: 1 });
  context.connect(fade);

  return { ctx, master, analyser, sonification, fade, earcons, voiceBus, context, noise: makeNoise(ctx) };
}

/** Creates the context on first call (must be inside a user gesture) and resumes it. */
export async function ensureGraph(): Promise<Graph> {
  graph ??= build(new AudioContext({ latencyHint: "interactive" }));
  if (graph.ctx.state === "suspended") await graph.ctx.resume();
  return graph;
}

export function getGraph(): Graph | null {
  return graph;
}

/** Glide from wherever the param is now; ~95% of the way after glideSec (A1). */
export function glideTo(ctx: BaseAudioContext, param: AudioParam, target: number, glideSec: number): void {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(target, now, Math.max(glideSec, 0.003) / 3);
}

/** Glide that starts at a future time (sequences scheduled ahead). */
export function glideAt(param: AudioParam, target: number, time: number, glideSec: number): void {
  param.cancelScheduledValues(time);
  param.setTargetAtTime(target, time, Math.max(glideSec, 0.003) / 3);
}
