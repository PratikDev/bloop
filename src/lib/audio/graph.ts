// The audio graph (AUDIO_RESEARCH A8, BUILD_PLAN §1.3):
//   voice channels → sonification bus (duckable) ┐
//   earcon bus ──────────────────────────────────┼→ master → compressor → meter → destination
//   narration bus ───────────────────────────────┘
// Each voice channel is  input(level) → mix → sonification bus.  Voices
// connect their own panners/envelopes into `input`; the mixer only touches `mix`.

import { MAPPING } from "./mapping";
import { VOICE_IDS, type VoiceId } from "./types";

export interface Channel {
  /** Voices connect here. Fixed at the per-voice volume cap. */
  input: GainNode;
  /** 0..1; driven only by the mixer (mute, solo, per-voice volume). */
  mix: GainNode;
}

export interface Graph {
  sonification: GainNode;
  earcon: GainNode;
  narration: GainNode;
  master: GainNode;
  compressor: DynamicsCompressorNode;
  /** After the compressor: what the listener hears (waveform, rings, peak meter). */
  meter: AnalyserNode;
  channels: Record<VoiceId, Channel>;
}

/** Normal (un-ducked, un-stopped) level of each bus. */
export const BUS_LEVELS = {
  sonification: 1,
  earcon: 1,
  narration: MAPPING.global.narrationMaxGain,
} as const;

export type BusName = keyof typeof BUS_LEVELS;

export function buildGraph(ctx: AudioContext): Graph {
  const g = MAPPING.global;
  const c = g.compressor;

  const compressor = new DynamicsCompressorNode(ctx, {
    threshold: c.thresholdDb,
    ratio: c.ratio,
    attack: c.attackSec,
    release: c.releaseSec,
    knee: 0,
  });
  const meter = new AnalyserNode(ctx, { fftSize: 2048 });
  const master = new GainNode(ctx, { gain: g.masterGain });
  master.connect(compressor).connect(meter).connect(ctx.destination);

  const bus = (name: BusName) => {
    const node = new GainNode(ctx, { gain: BUS_LEVELS[name] });
    node.connect(master);
    return node;
  };
  const sonification = bus("sonification");

  const channels = Object.fromEntries(
    VOICE_IDS.map((id) => {
      const input = new GainNode(ctx, { gain: g.voiceMaxGain });
      const mix = new GainNode(ctx, { gain: 1 });
      input.connect(mix).connect(sonification);
      return [id, { input, mix }];
    }),
  ) as Record<VoiceId, Channel>;

  return { sonification, earcon: bus("earcon"), narration: bus("narration"), master, compressor, meter, channels };
}
