// The heat voice (Then vs Now, TEAM_BUILD_PLAN §10): GISTEMP anomaly → pitch
// through the heat rule, on a triangle wave through a low-pass (deliberately
// not the ocean sine, AUDIO_RESEARCH B2). The Anomaly Choir (a design choice):
// a second, detuned voice for "unusual" years, plus a ~30 Hz wobble for the
// most unusual — warm and cold alike.

import { centsToRatio, heatTone } from "../context-maths";
import { getCtx } from "../context";
import { loudnessGain, voiceSpec } from "../mapping";
import { glideAt, jumpAt } from "../params";
import { track } from "../sources";
import { onStopAll } from "../stop";
import { voicePeak, type VoiceTiming } from "./common";

const LOWPASS_HZ = 1800;
const ROUGHNESS_HZ = 30;

export interface HeatVoice {
  /** Anomaly °C (null = silence), now or at `at.time`. */
  set(anomalyC: number | null, at?: VoiceTiming): void;
}

interface Nodes {
  main: OscillatorNode;
  second: OscillatorNode;
  secondGain: GainNode;
  wobble: GainNode; // amplitude = 1 − depth/2 ± depth/2 (the LFO adds the ±)
  lfoDepth: GainNode;
  env: GainNode;
}

export function createHeatVoice(output: AudioNode): HeatVoice {
  const spec = voiceSpec("heat").sound;
  const attackSec = spec.attackMs / 1000;
  const releaseSec = spec.releaseMs / 1000;
  const glideSec = (spec.glideMs ?? 60) / 1000;
  const mainLevel = voicePeak("heat"); // heat + heatDeviation share one voice budget
  const secondLevel = voicePeak("heatDeviation");

  let nodes: Nodes | null = null;
  let sounding = false;

  onStopAll(() => {
    nodes = null;
    sounding = false;
  });

  function build(freq: number): Nodes {
    const ctx = getCtx();
    const env = new GainNode(ctx, { gain: 0 });
    const wobble = new GainNode(ctx, { gain: 1 });
    const filter = new BiquadFilterNode(ctx, { type: "lowpass", frequency: LOWPASS_HZ });
    filter.connect(wobble).connect(env).connect(output);

    const main = track(new OscillatorNode(ctx, { type: "triangle", frequency: freq }));
    const mainGain = new GainNode(ctx, { gain: mainLevel });
    main.connect(mainGain).connect(filter);

    const second = track(new OscillatorNode(ctx, { type: "triangle", frequency: freq }));
    const secondGain = new GainNode(ctx, { gain: 0 });
    second.connect(secondGain).connect(filter);

    const lfo = track(new OscillatorNode(ctx, { type: "sine", frequency: ROUGHNESS_HZ }));
    const lfoDepth = new GainNode(ctx, { gain: 0 });
    lfo.connect(lfoDepth).connect(wobble.gain);

    for (const osc of [main, second, lfo]) osc.start();
    return { main, second, secondGain, wobble, lfoDepth, env };
  }

  return {
    set(anomalyC, at = {}) {
      const ctx = getCtx();
      const tone = anomalyC === null ? null : heatTone(anomalyC);
      if (!tone) {
        if (sounding && nodes) glideAt(ctx, nodes.env.gain, 0, releaseSec, at.time);
        sounding = false;
        return;
      }
      nodes ??= build(tone.freq);
      const n = nodes;
      const secondFreq = tone.freq * centsToRatio(tone.detuneCents);
      const glide = sounding ? (at.glideSec ?? glideSec) : 0;
      const move = (param: AudioParam, value: number) =>
        sounding ? glideAt(ctx, param, value, glide, at.time) : jumpAt(ctx, param, value, at.time);

      move(n.main.frequency, tone.freq);
      move(n.second.frequency, secondFreq);
      glideAt(ctx, n.secondGain.gain, tone.detuneCents > 0 ? secondLevel : 0, glideSec, at.time);
      glideAt(ctx, n.wobble.gain, 1 - tone.roughness / 2, glideSec, at.time);
      glideAt(ctx, n.lfoDepth.gain, tone.roughness / 2, glideSec, at.time);
      glideAt(ctx, n.env.gain, loudnessGain(tone.freq), sounding ? glide : attackSec, at.time);
      sounding = true;
    },
  };
}
