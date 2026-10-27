// Ocean voice: one sine oscillator whose pitch follows temperature (mapping.json
// "ocean" rule), with a 30 ms glide (setTargetAtTime, time constant 0.01 s).
// setAxis() plays the same rule over a zoomed input range (Sound terrain);
// null goes back to the rule's own range.

import { loudnessGain, mapContinuous, panFor, voiceSpec, withInputRange } from "@/lib/audio/mapping";
import { glideAt, glideTo, type Graph } from "../graph";

export interface OceanVoice {
  /** Live: glide from the current sound. null = silence (land / no data). */
  set(valueC: number | null, lon: number): void;
  /** Sequenced: the same change, starting at `time`, with its own glide. */
  at(time: number, valueC: number | null, lon: number, glideSec?: number): void;
  /** A zoomed input range for the same rule (null = the rule's own range). */
  setAxis(range: { min: number; max: number } | null): void;
}

export function createOceanVoice(graph: Graph): OceanVoice {
  const { ctx } = graph;
  const spec = voiceSpec("ocean");
  const rule = spec.mapping?.kind === "continuous" ? spec.mapping : null;
  let mapping = rule;
  const glideSec = (spec.sound.glideMs ?? 30) / 1000;
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;

  const osc = new OscillatorNode(ctx, { type: "sine", frequency: 440 });
  const gain = new GainNode(ctx, { gain: 0 });
  const pan = new StereoPannerNode(ctx, { pan: 0 });
  osc.connect(gain).connect(pan).connect(graph.voiceBus.ocean);
  osc.start();

  function targets(valueC: number | null) {
    const freq = mapping ? mapContinuous(valueC, mapping) : null;
    if (freq === null) return null;
    return { freq, level: spec.sound.maxGain * loudnessGain(freq) };
  }

  return {
    setAxis(range) {
      mapping = rule && range ? withInputRange(rule, range) : rule;
    },
    set(valueC, lon) {
      const t = targets(valueC);
      glideTo(ctx, pan.pan, panFor(lon), glideSec);
      if (!t) {
        glideTo(ctx, gain.gain, 0, releaseSec);
        return;
      }
      glideTo(ctx, osc.frequency, t.freq, glideSec);
      glideTo(ctx, gain.gain, t.level, attackSec);
    },
    at(time, valueC, lon, glide = glideSec) {
      const t = targets(valueC);
      glideAt(pan.pan, panFor(lon), time, glide);
      if (!t) {
        glideAt(gain.gain, 0, time, releaseSec);
        return;
      }
      glideAt(osc.frequency, t.freq, time, glide);
      glideAt(gain.gain, t.level, time, attackSec);
    },
  };
}
