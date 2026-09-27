// Short cues on the earcon bus (not ducked, never part of the data voices).
// Levels come from mapping.json; timbres follow its descriptions.

import { panFor, voiceSpec } from "@/lib/audio/mapping";
import type { Graph } from "./graph";
import type { EarconId } from "./types";

const WHISPER_NOTES_HZ = [1600, 2100];
const WHISPER_NOTE_SEC = 0.15;
const PING_HZ = 1760;
const TICK_HIGHPASS_HZ = 3000;

function envelope(graph: Graph, time: number, peak: number, attackSec: number, releaseSec: number, lon: number) {
  const env = new GainNode(graph.ctx, { gain: 0 });
  const pan = new StereoPannerNode(graph.ctx, { pan: panFor(lon) });
  env.connect(pan).connect(graph.earcons);
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(peak, time + attackSec);
  env.gain.setTargetAtTime(0, time + attackSec, releaseSec / 3);
  return env;
}

/** A soft sine tone with a bell-like decay. Used by the whisper, ping and motif. */
export function playTone(
  graph: Graph,
  opts: { time: number; freq: number; peak: number; attackSec: number; releaseSec: number; lon?: number },
): void {
  const env = envelope(graph, opts.time, opts.peak, opts.attackSec, opts.releaseSec, opts.lon ?? 0);
  const osc = new OscillatorNode(graph.ctx, { type: "sine", frequency: opts.freq });
  osc.connect(env);
  osc.start(opts.time);
  osc.stop(opts.time + opts.attackSec + opts.releaseSec * 2);
}

function playTick(graph: Graph, time: number, lon: number) {
  const s = voiceSpec("nodata").sound;
  const env = envelope(graph, time, s.maxGain, s.attackMs / 1000, s.releaseMs / 1000, lon);
  const hp = new BiquadFilterNode(graph.ctx, { type: "highpass", frequency: TICK_HIGHPASS_HZ });
  const src = new AudioBufferSourceNode(graph.ctx, { buffer: graph.noise });
  src.connect(hp).connect(env);
  src.start(time, Math.random() * 0.8);
  src.stop(time + 0.05);
}

export function playEarconAt(graph: Graph, id: EarconId, time: number, lon = 0): void {
  if (id === "nodata") {
    playTick(graph, time, lon);
    return;
  }
  const s = voiceSpec(id).sound;
  const attackSec = s.attackMs / 1000;
  const releaseSec = s.releaseMs / 1000;
  if (id === "whisper") {
    WHISPER_NOTES_HZ.forEach((freq, i) =>
      playTone(graph, { time: time + i * WHISPER_NOTE_SEC, freq, peak: s.maxGain, attackSec, releaseSec }),
    );
    return;
  }
  playTone(graph, { time, freq: PING_HZ, peak: s.maxGain, attackSec, releaseSec, lon });
}
