// Earth Orchestra on the live engines' own data voices. A voice hands its oscillator here once
// it makes it; the oscillator then wears its family's spectrum (setPeriodicWave: timbre only, its frequency param is
// never touched) while Earth Orchestra is on, and its plain wave otherwise. A sustained texture (breath, crackle) goes
// into the voice's own envelope, so it is heard only while the voice sounds. At 1 Music, meend shapes a pitch move:
// the nearest swara first, then an exponential glide that lands exactly on the data pitch.

import type { EarthCategory } from "@/lib/audio/layers/types";
import { continuousRule } from "@/lib/audio/mapping";
import { familyFor, noiseBand, setSpectrum, type OnSource } from "@/lib/audio/orchestra";
import { DEFAULT_SA } from "../layers";
import { MEEND_MIN_STEP, MEEND_SEC, nearestSwara } from "../meend";
import { dialLayers } from "../dial";
import { dialStop, getArt, orchestraOn, subscribeArt } from "../settings";

export interface DressOptions {
  /** The voice's Earth system now (a record voice shared across systems asks the record being played). */
  category: () => EarthCategory | null;
  /** The wave the voice plays as plain tones (the ocean's sine, the heat voice's triangle). */
  plainType?: OscillatorType;
  /** The voice's envelope: a sustained texture joins here. */
  env?: GainNode;
  onSource?: OnSource;
}

interface Dressed {
  osc: WeakRef<OscillatorNode>;
  opts: DressOptions;
  texture: { gain: GainNode; band: BiquadFilterNode } | null;
}

const dressed = new Set<Dressed>();

function apply(d: Dressed) {
  const osc = d.osc.deref();
  if (!osc) {
    dressed.delete(d);
    return;
  }
  const family = familyFor(d.opts.category(), orchestraOn());
  setSpectrum(osc, family.live, d.opts.plainType);
  const tx = family.texture?.sustain ? family.texture : null;
  if (!d.opts.env) return;
  if (tx && !d.texture) {
    const { source, out: band } = noiseBand(osc.context, tx.hz, tx.q, d.opts.onSource);
    const gain = new GainNode(osc.context, { gain: 0 });
    band.connect(gain).connect(d.opts.env);
    source.start();
    d.texture = { gain, band };
  }
  if (!d.texture) return;
  const now = osc.context.currentTime;
  d.texture.gain.gain.setTargetAtTime(tx?.gain ?? 0, now, 0.05);
  if (tx) d.texture.band.frequency.setValueAtTime(tx.hz, now);
}

let subscribed = false;

/** Dresses a live data voice's oscillator (call once per oscillator, right after it is made). */
export function dressLive(osc: OscillatorNode, opts: DressOptions): void {
  if (!subscribed) {
    subscribed = true;
    subscribeArt(() => dressed.forEach(apply));
  }
  const d: Dressed = { osc: new WeakRef(osc), opts, texture: null };
  dressed.add(d);
  apply(d);
}

/** A voice's Sa: the bottom of its pitch rule (a fixed note per record), or A3 for a rule that isn't a pitch. */
export function saFor(voiceId: string): number {
  try {
    const rule = continuousRule(voiceId);
    return rule.output.param === "frequency" ? rule.output.min : DEFAULT_SA;
  } catch {
    return DEFAULT_SA;
  }
}

/** Whether the dial is at Music now (meend on). */
export function meendOn(): boolean {
  const stop = dialStop();
  const ctx = getArt().context;
  return stop !== null && dialLayers(stop, ctx?.playMode ?? "single", orchestraOn()).meend;
}

const lastMove = new WeakMap<AudioParam, number>();

/**
 * At 1 Music: the data voice's move to `hz` starts on the nearest swara and glides exponentially, landing exactly on
 * `hz` after MEEND_SEC. Returns false (the caller does its own move) at any other stop, and for moves closer together
 * than MEEND_MIN_STEP (a fast sweep), so every note still settles on its value.
 */
export function meend(param: AudioParam, hz: number, voiceId: string, ctx: BaseAudioContext, time?: number): boolean {
  const t = Math.max(time ?? ctx.currentTime, ctx.currentTime);
  const prev = lastMove.get(param);
  lastMove.set(param, t);
  if (!meendOn() || (prev !== undefined && t - prev < MEEND_MIN_STEP)) return false;
  param.cancelScheduledValues(t);
  param.setValueAtTime(nearestSwara(hz, saFor(voiceId)), t);
  param.exponentialRampToValueAtTime(hz, t + MEEND_SEC);
  return true;
}
