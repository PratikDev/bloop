// The normal tone (idea B3; mapping.json "normalTone"): a quiet fixed reference sine at anomaly 0
// and the data sine bending above or below it by the SVS 5176 anomaly. The reference is the
// rule's own output at 0 (B3 on the stated range), so no pitch is typed here. Both stay at a
// fixed level (guardrail 4): the gap is heard as an interval and as beating, never as loudness.

import { continuousRule, loudnessGain, mapContinuous, panFor, voiceSpec } from "@/lib/audio/mapping";
import { glideTo, type Graph } from "../graph";

const REFERENCE_SHARE = 0.5; // the reference sits under the data voice

export interface NormalToneVoice {
  /** °C vs normal; null silences both tones (land, sea ice, no data). */
  set(anomalyC: number | null, lon: number): void;
}

export function createNormalToneVoice(graph: Graph): NormalToneVoice {
  const { ctx } = graph;
  const spec = voiceSpec("normalTone");
  const rule = continuousRule("normalTone");
  const refHz = mapContinuous(0, rule) ?? rule.output.min;
  const glideSec = (spec.sound.glideMs ?? 30) / 1000;
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;

  const pan = new StereoPannerNode(ctx, { pan: 0 });
  pan.connect(graph.extras);
  const tone = (freq: number) => {
    const osc = new OscillatorNode(ctx, { type: "sine", frequency: freq });
    const gain = new GainNode(ctx, { gain: 0 });
    osc.connect(gain).connect(pan);
    osc.start();
    return { osc, gain };
  };
  const reference = tone(refHz);
  const data = tone(refHz);

  return {
    set(anomalyC, lon) {
      const freq = mapContinuous(anomalyC, rule);
      glideTo(ctx, pan.pan, panFor(lon), glideSec);
      if (freq === null) {
        glideTo(ctx, data.gain.gain, 0, releaseSec);
        glideTo(ctx, reference.gain.gain, 0, releaseSec);
        return;
      }
      glideTo(ctx, data.osc.frequency, freq, glideSec);
      glideTo(ctx, data.gain.gain, spec.sound.maxGain * loudnessGain(freq), attackSec);
      glideTo(ctx, reference.gain.gain, spec.sound.maxGain * REFERENCE_SHARE * loudnessGain(refHz), attackSec);
    },
  };
}
