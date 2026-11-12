// Renders a proof plan offline (OfflineAudioContext), at one dial stop, in one instrument family. Channel 0 is the data
// voice alone (as notes, channels 0, 2, 3 and 4 take every fourth note, so one note's release never overlaps the next
// one's measurement); channel 1 is everything (data voice, bed, drone, reverb, ticks). The data voice moves exactly as the
// live voices do (src/lib/audio/voices/ocean.ts; the art helpers in src/lib/art/live): a glide to each value, or, at
// 1 Music, the nearest swara then an exponential glide landing on the value. The log is what the renderer scheduled.

import type { DialStop } from "@/lib/audio/layers/types";
import { familyNote, FAMILIES, noiseBand, setSpectrum, type Timbre } from "@/lib/audio/orchestra";
import { voiceSpec } from "@/lib/audio/mapping";
import { chordLayer } from "../chord-hook";
import { dialLayers, type DialLayers } from "../dial";
import { crossed, gridlines } from "../gridlines";
import { createBed, createDrone, createReverb, droneColour, playTick, reverbLevel } from "../layers";
import { MEEND_MIN_STEP, MEEND_SEC, nearestSwara } from "../meend";
import { saFor } from "../live/dress";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { planSeconds, type ProofPlan } from "./plan";

export const PROOF_RATE = 24000;
/** Where a note counts as settled: after the longest move (a glide's 0.1 s, or the meend), the same at every stop. */
export const SETTLE_SEC = Math.max(0.1, MEEND_SEC) + 0.01;
const LEVEL = 0.2;

export interface Setup {
  /** null = the art layer off entirely (today's app). */
  stop: DialStop | null;
  timbre: Timbre;
  /** "voice": the live gliding data voice; "notes": one OrchestraVoice note per value (what other records call). */
  path: "voice" | "notes";
  month?: number | null;
}

export interface LoggedNote {
  index: number;
  onset: number;
  hz: number;
  settleFrom: number;
  to: number;
  /** Which data channel holds it. */
  channel: number;
}

export interface Rendered {
  /** The data voice's channels: [0] for the gliding voice and drops; notes rotate over all four. */
  data: Float32Array[];
  mix: Float32Array;
  sampleRate: number;
  notes: LoggedNote[];
  drops: number[];
  layers: DialLayers | null;
}

/** Output channels: the mix, then the data voice's four. */
const MIX_CH = 1;
const DATA_CH = [0, 2, 3, 4];

function routes(ctx: OfflineAudioContext) {
  const merger = new ChannelMergerNode(ctx, { numberOfInputs: DATA_CH.length + 1 });
  merger.connect(ctx.destination);
  const mix = new GainNode(ctx, { gain: 1 });
  const all = new GainNode(ctx, { gain: 1 }); // the mix plus its reverb (kept apart so the reverb never feeds itself)
  const data = DATA_CH.map((ch) => {
    const g = new GainNode(ctx, { gain: 1 });
    g.connect(merger, 0, ch);
    g.connect(mix);
    return g;
  });
  mix.connect(all);
  all.connect(merger, 0, MIX_CH);
  return { data, mix, all };
}

export async function renderProof(plan: ProofPlan, setup: Setup): Promise<Rendered> {
  const ctx = new OfflineAudioContext({ numberOfChannels: DATA_CH.length + 1, length: Math.ceil(planSeconds(plan) * PROOF_RATE), sampleRate: PROOF_RATE });
  const { data, mix, all } = routes(ctx);
  const dial = setup.stop === null ? null : dialLayers(setup.stop, "single", setup.timbre !== "plain");
  // As live: no meend where notes are too short to settle after one.
  const layers = dial && { ...dial, meend: dial.meend && plan.stepSec >= MEEND_MIN_STEP };
  const family = FAMILIES[layers && !layers.timbre ? "plain" : setup.timbre];
  const sa = saFor(plan.voiceId);
  const reverb = createReverb(ctx, all);
  mix.connect(reverb.input);
  reverb.wet.gain.value = reverbLevel(Boolean(layers?.reverb));
  const bed = layers?.bed ? createBed(ctx, mix, sa) : null;
  const drone = layers?.drone ? createDrone(ctx, mix, sa, droneColour(setup.month ?? null)) : null;
  const notes: LoggedNote[] = [];

  if (plan.kind === "drops") {
    for (const t of plan.drops) dropAt(ctx, data[0], t);
    plan.steps.forEach((s, i) => [bed, drone].forEach((l) => l?.set(s.out !== null, i * plan.stepSec)));
  } else if (setup.path === "notes") {
    plan.steps.forEach((s, i) => {
      const t = i * plan.stepSec;
      if (s.out === null) return;
      const glide = layers?.meend ? { startHz: nearestSwara(s.out, sa), glideSec: MEEND_SEC } : {};
      const channel = notes.length % DATA_CH.length;
      familyNote(ctx, data[channel], family, { hz: s.out, when: t, duration: plan.stepSec * 0.95, gain: LEVEL }, glide);
      notes.push({ index: i, onset: t, hz: s.out, settleFrom: t + SETTLE_SEC, to: t + plan.stepSec * 0.9, channel });
    });
  } else {
    gliding(ctx, data[0], plan, family, layers, sa, notes, [bed, drone]);
  }
  if (layers?.ticks) ticksFor(ctx, mix, plan);
  const chord = chordLayer();
  if (chord && layers?.chord) chord.gate({ recordId: plan.recordId, playMode: "single" }); // the gate only: a live layer can't render offline
  const buffer = await ctx.startRendering();
  return { data: DATA_CH.map((ch) => buffer.getChannelData(ch)), mix: buffer.getChannelData(MIX_CH), sampleRate: PROOF_RATE, notes, drops: plan.kind === "drops" ? [...plan.drops] : [], layers };
}

/** The live data voice: one oscillator in the family's spectrum, gliding (or at Music, meend) to each value. */
function gliding(ctx: OfflineAudioContext, out: AudioNode, plan: ProofPlan, family: (typeof FAMILIES)[Timbre], layers: DialLayers | null, sa: number, notes: LoggedNote[], swells: ({ set(on: boolean, at: number): void } | null)[]) {
  const spec = voiceSpec(plan.voiceId).sound;
  const glide = (spec.glideMs ?? 30) / 1000;
  const osc = new OscillatorNode(ctx, { frequency: 440 });
  setSpectrum(osc, family.live);
  const env = new GainNode(ctx, { gain: 0 });
  osc.connect(env).connect(out);
  if (family.texture?.sustain) {
    const { source, out: band } = noiseBand(ctx, family.texture.hz, family.texture.q);
    band.connect(new GainNode(ctx, { gain: family.texture.gain })).connect(env);
    source.start();
  }
  let sounding = false;
  plan.steps.forEach((s, i) => {
    const t = i * plan.stepSec;
    const f = osc.frequency;
    swells.forEach((l) => l?.set(s.out !== null, t));
    if (s.out === null) {
      env.gain.cancelScheduledValues(t);
      env.gain.setTargetAtTime(0, t, spec.releaseMs / 3000);
      sounding = false;
      return;
    }
    f.cancelScheduledValues(t);
    if (layers?.meend) {
      f.setValueAtTime(nearestSwara(s.out, sa), t);
      f.exponentialRampToValueAtTime(s.out, t + MEEND_SEC);
    } else if (sounding) f.setTargetAtTime(s.out, t, glide / 3);
    else f.setValueAtTime(s.out, t);
    env.gain.cancelScheduledValues(t);
    env.gain.setTargetAtTime(LEVEL, t, (sounding ? glide : spec.attackMs / 1000) / 3);
    sounding = true;
    notes.push({ index: i, onset: t, hz: s.out, settleFrom: t + SETTLE_SEC, to: t + plan.stepSec - 0.01, channel: 0 });
  });
  osc.start();
}

/** A rain drop: a short band-passed noise burst (rain.ts's drop), the same at every stop. */
function dropAt(ctx: OfflineAudioContext, out: AudioNode, t: number) {
  const { source, out: band } = noiseBand(ctx, 2500, 1.2);
  const env = new GainNode(ctx, { gain: 0 });
  band.connect(env).connect(out);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(LEVEL, t + 0.002);
  env.gain.setTargetAtTime(0, t + 0.002, 0.015);
  source.start(t, (t * 0.37) % 1);
  source.stop(t + 0.1);
}

function ticksFor(ctx: OfflineAudioContext, out: AudioNode, plan: ProofPlan) {
  if (plan.kind !== "pitch") return;
  const rule = continuousRule(plan.voiceId);
  const lines = gridlines(rule.input);
  let prev: number | null = null;
  plan.steps.forEach((s, i) => {
    if (s.value !== null && prev !== null) {
      crossed(lines, prev, s.value).forEach((g, k) => {
        const hz = mapContinuous(g, rule);
        if (hz !== null) playTick(ctx, out, hz, i * plan.stepSec + k * 0.03);
      });
    }
    prev = s.value;
  });
}
