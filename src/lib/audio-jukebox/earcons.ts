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

// Two low notes stepping down, well below the ping and whisper, so it can't be
// mistaken for them. Level and envelope are the ping's (mapping.json earcon caps).
const NEEDLE_DROP_HZ = [196, 147];
const NEEDLE_DROP_STEP_SEC = 0.06;

// A few soft grains of band-passed noise: vinyl crackle as the stylus lands.
// Band-passed with a 3 ms attack, so it crackles without hard steps (clicks) in the output.
const CRACKLE_GRAINS = 7;
const CRACKLE_SEC = 0.35;
const CRACKLE_LEVEL = 0.25; // of the earcon's own peak
const CRACKLE_BAND_HZ = 2200;
const CRACKLE_ATTACK_SEC = 0.003;

function playCrackle(graph: Graph, time: number, peak: number) {
  const band = new BiquadFilterNode(graph.ctx, { type: "bandpass", frequency: CRACKLE_BAND_HZ, Q: 1.2 });
  band.connect(graph.earcons);
  for (let i = 0; i < CRACKLE_GRAINS; i++) {
    const at = time + Math.random() * CRACKLE_SEC;
    const env = new GainNode(graph.ctx, { gain: 0 });
    env.connect(band);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(peak * CRACKLE_LEVEL * (0.4 + Math.random() * 0.6), at + CRACKLE_ATTACK_SEC);
    env.gain.setTargetAtTime(0, at + CRACKLE_ATTACK_SEC, 0.006);
    const src = new AudioBufferSourceNode(graph.ctx, { buffer: graph.noise });
    src.connect(env);
    src.start(at, Math.random() * 0.8);
    src.stop(at + 0.03);
  }
}

/** Turntable Earth: the needle settling on a new record, with a little crackle (UI sound, not data). */
export function playNeedleDropAt(graph: Graph, time: number): void {
  const s = voiceSpec("ping").sound;
  playCrackle(graph, time, s.maxGain);
  NEEDLE_DROP_HZ.forEach((freq, i) =>
    playTone(graph, {
      time: time + i * NEEDLE_DROP_STEP_SEC,
      freq,
      peak: s.maxGain,
      attackSec: s.attackMs / 1000,
      releaseSec: s.releaseMs / 1000,
    }),
  );
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
