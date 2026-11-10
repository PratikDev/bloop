// Earth Orchestra's synthesis on any BaseAudioContext (the live one, or an OfflineAudioContext for the pitch-identity
// check and the WAV export). One ConstantSource drives every oscillator's frequency, so all layers of a note sit on
// exactly one pitch: the data's. Noise is seeded, so an offline render is the same every time.

import type { OrchestraNote, OrchestraNoteHandle } from "@/lib/audio/layers/types";
import { noteAttack, type FamilyRecipe } from "./families";
import { mixInto } from "./mix";

const NOISE_SEC = 2;
const noises = new WeakMap<BaseAudioContext, AudioBuffer>();
const waves = new WeakMap<BaseAudioContext, Map<string, PeriodicWave>>();

/** A deterministic PRNG (mulberry32): the same noise in every render. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noises.get(ctx);
  if (!buffer) {
    buffer = new AudioBuffer({ length: Math.round(ctx.sampleRate * NOISE_SEC), sampleRate: ctx.sampleRate });
    const data = buffer.getChannelData(0);
    const random = seeded(20261110);
    for (let i = 0; i < data.length; i++) data[i] = random() * 2 - 1;
    noises.set(ctx, buffer);
  }
  return buffer;
}

function waveFor(ctx: BaseAudioContext, partials: readonly number[]): PeriodicWave {
  const key = partials.join(",");
  let cache = waves.get(ctx);
  if (!cache) waves.set(ctx, (cache = new Map()));
  let wave = cache.get(key);
  if (!wave) {
    const real = new Float32Array(partials.length + 1);
    const imag = Float32Array.from([0, ...partials]);
    wave = new PeriodicWave(ctx, { real, imag });
    cache.set(key, wave);
  }
  return wave;
}

/** Gives an oscillator a harmonic spectrum (timbre only: its frequency param is untouched). */
export function setSpectrum(osc: OscillatorNode, partials: readonly number[], plainType: OscillatorType = "sine"): void {
  if (partials.length === 1) osc.type = plainType;
  else osc.setPeriodicWave(waveFor(osc.context, partials));
}

/** Registers sources (the live engine's stop list); offline renders pass nothing. */
export type OnSource = (node: AudioScheduledSourceNode) => void;

/** A looping, seeded noise source through a fixed band-pass. */
export function noiseBand(ctx: BaseAudioContext, hz: number, q: number, onSource?: OnSource): { source: AudioBufferSourceNode; out: BiquadFilterNode } {
  const source = new AudioBufferSourceNode(ctx, { buffer: noiseBuffer(ctx), loop: true });
  const out = new BiquadFilterNode(ctx, { type: "bandpass", frequency: hz, Q: q });
  source.connect(out);
  onSource?.(source);
  return { source, out };
}

export interface NoteOptions {
  /** Swara + meend: the note first sounds here, then glides (exponentially) to note.hz, landing exactly at when + glideSec. */
  startHz?: number;
  glideSec?: number;
  onSource?: OnSource;
}

const lowpasses = new WeakMap<AudioNode, Map<number, BiquadFilterNode>>();

/**
 * One low-pass per output and cutoff, shared by every note into it. The same sound as a filter per note (the filter is
 * linear: filtering the sum = summing the filtered notes), and an offline render is bit-identical every time (Chromium
 * renders a fresh filter per note a float ULP differently run to run, enough to flip a 16-bit sample in a WAV).
 */
function sharedLowpass(ctx: BaseAudioContext, out: AudioNode, hz: number): BiquadFilterNode {
  let byHz = lowpasses.get(out);
  if (!byHz) lowpasses.set(out, (byHz = new Map()));
  let lp = byHz.get(hz);
  if (!lp) {
    lp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: hz });
    mixInto(lp, out);
    byHz.set(hz, lp);
  }
  return lp;
}

/** Plays one note of a family into `out`. Its settled pitch is exactly note.hz. */
export function familyNote(ctx: BaseAudioContext, out: AudioNode, family: FamilyRecipe, note: OrchestraNote, opts: NoteOptions = {}): OrchestraNoteHandle {
  const { when, duration, gain } = note;
  const pitch = new ConstantSourceNode(ctx, { offset: opts.startHz ?? note.hz });
  if (opts.startHz !== undefined) {
    pitch.offset.setValueAtTime(opts.startHz, when);
    pitch.offset.exponentialRampToValueAtTime(note.hz, when + (opts.glideSec ?? 0.12));
  }
  const env = new GainNode(ctx, { gain: 0 });
  mixInto(env, family.lowpass === null ? out : sharedLowpass(ctx, out, family.lowpass));
  env.gain.setValueAtTime(0, when);
  const attack = noteAttack(family, duration);
  env.gain.linearRampToValueAtTime(gain, when + attack);

  const sources: AudioScheduledSourceNode[] = [pitch];
  for (const layer of family.layers) {
    const osc = new OscillatorNode(ctx, { frequency: 0 });
    setSpectrum(osc, layer.partials);
    pitch.connect(osc.frequency);
    const g = new GainNode(ctx, { gain: 0 });
    mixInto(osc.connect(g), env);
    g.gain.setValueAtTime(layer.gain, when);
    if (layer.decay !== null) g.gain.setTargetAtTime(0, when + attack, layer.decay / 3);
    sources.push(osc);
  }
  if (family.texture) {
    const tx = family.texture;
    const { source, out: band } = noiseBand(ctx, tx.hz, tx.q);
    const g = new GainNode(ctx, { gain: 0 });
    mixInto(band.connect(g), env);
    g.gain.setValueAtTime(tx.gain, when);
    if (!tx.sustain) g.gain.setTargetAtTime(0, when, 0.015);
    sources.push(source);
  }
  let end = when + duration;
  const release = (at: number) => {
    env.gain.cancelScheduledValues(at);
    env.gain.setTargetAtTime(0, at, family.release / 3);
    for (const s of sources) s.stop(at + family.release * 2.5);
  };
  for (const s of sources) {
    opts.onSource?.(s);
    s.start(when);
  }
  release(end);
  return {
    setHz(hz, at) {
      pitch.offset.cancelScheduledValues(at);
      pitch.offset.setTargetAtTime(hz, at, 0.01);
    },
    stop(at = ctx.currentTime) {
      if (at >= end) return;
      end = at;
      release(at);
    },
  };
}
