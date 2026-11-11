// A pitched voice: one sine oscillator whose pitch follows a mapping.json "frequency" rule, with the rule's glide
// (setTargetAtTime). The Ocean voice is this with the "ocean" rule on the ocean bus; official records reuse it on the

import { continuousRule, loudnessGain, mapContinuous, panFor, voiceSpec, withInputRange } from "@/lib/audio/mapping";
import { glideAt, glideTo, type Graph } from "../graph";
import { dressLive, meend } from "@/lib/art/live/dress";
import { reportVoice } from "@/lib/art/live/layers";
import { recordCategory } from "@/lib/art/live/record";

export interface ToneVoice {
  /** Live: glide from the current sound. null = silence (land / no data). */
  set(value: number | null, lon: number): void;
  /** Sequenced: the same change, starting at `time`, with its own glide. */
  at(time: number, value: number | null, lon: number, glideSec?: number): void;
  /** A zoomed input range for the same rule (null = the rule's own range). */
  setAxis(range: { min: number; max: number } | null): void;
}

export function createToneVoice(graph: Graph, id: string, bus: AudioNode): ToneVoice {
  const { ctx } = graph;
  const spec = voiceSpec(id);
  const rule = continuousRule(id);
  let mapping = rule;
  const glideSec = (spec.sound.glideMs ?? 30) / 1000;
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;

  const osc = new OscillatorNode(ctx, { type: "sine", frequency: 440 });
  const gain = new GainNode(ctx, { gain: 0 });
  const pan = new StereoPannerNode(ctx, { pan: 0 });
  osc.connect(gain).connect(pan).connect(bus);
  dressLive(osc, { category: () => recordCategory(id), env: gain });
  osc.start();

  function targets(value: number | null) {
    const freq = mapContinuous(value, mapping);
    if (freq === null) return null;
    return { freq, level: spec.sound.maxGain * loudnessGain(freq) };
  }

  return {
    setAxis(range) {
      mapping = range ? withInputRange(rule, range) : rule;
    },
    set(value, lon) {
      const t = targets(value);
      glideTo(ctx, pan.pan, panFor(lon), glideSec);
      reportVoice(id, t ? value : null, t !== null);
      if (!t) {
        glideTo(ctx, gain.gain, 0, releaseSec);
        return;
      }
      if (!meend(osc.frequency, t.freq, id, ctx)) glideTo(ctx, osc.frequency, t.freq, glideSec);
      glideTo(ctx, gain.gain, t.level, attackSec);
    },
    at(time, value, lon, glide = glideSec) {
      const t = targets(value);
      glideAt(pan.pan, panFor(lon), time, glide);
      reportVoice(id, t ? value : null, t !== null, time);
      if (!t) {
        glideAt(gain.gain, 0, time, releaseSec);
        return;
      }
      if (!meend(osc.frequency, t.freq, id, ctx, time)) glideAt(osc.frequency, t.freq, time, glide);
      glideAt(gain.gain, t.level, time, attackSec);
    },
  };
}
