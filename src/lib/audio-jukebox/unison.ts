// Two values beating in one ear: the first tone alone, then the second joins it in the same (left) ear. Both follow
// one pitch rule, so equal values are one pure tone and any difference beats |f1 − f2| times a second.
// Proof in unison (idea C1; mapping.json "unison" = sameAs "ocean") plays the frame's value against NASA's file; Compare
// two dates plays one place at two times by its layer's rule.

import { loudnessGain, mapVoice, unisonTones, voiceSpec } from "@/lib/audio/mapping";
import type { CaptionParams } from "@/lib/audio/types";
import { emitCaption } from "./events";
import type { Graph } from "./graph";
import { playSequence, type Step } from "./sequence";
import type { PlayerHandle } from "./types";

const SOLO_SEC = 1.2;
const TOGETHER_SEC = 3.6;
const ONE_EAR_PAN = -1;

export interface Beating {
  /** The tones' Hz, and how many times a second they beat. */
  tones: { aHz: number; bHz: number; beatsPerSec: number } | null;
  /** The mapping.json voice whose envelope and level the tones use. */
  envelope: string;
  name: string;
  caption(beatsPerSec: number): { key: string; params: CaptionParams };
}

export function playUnison(pair: { frameC: number; fileC: number }): PlayerHandle {
  const t = unisonTones(pair.frameC, pair.fileC);
  return playBeating({
    tones: t && { aHz: t.frameHz, bHz: t.fileHz, beatsPerSec: t.beatsPerSec },
    envelope: "unison",
    name: "unison",
    caption: (beats) => ({ key: "caption.unison", params: { frame: pair.frameC, file: pair.fileC, beats } }),
  });
}

/** The same place at two times by one pitch rule (heat, water): null tones when either value is off the rule. */
export function playPair(p: { rule: string; a: number; b: number; caption: Beating["caption"] }): PlayerHandle {
  const aHz = mapVoice(p.rule, p.a);
  const bHz = mapVoice(p.rule, p.b);
  return playBeating({
    tones: aHz === null || bHz === null ? null : { aHz, bHz, beatsPerSec: Math.abs(aHz - bHz) },
    envelope: p.rule,
    name: "pair",
    caption: p.caption,
  });
}

function playBeating({ tones, envelope, name, caption }: Beating): PlayerHandle {
  const s = voiceSpec(envelope).sound;
  const playing: OscillatorNode[] = [];
  let pan: StereoPannerNode | null = null;
  const attackSec = s.attackMs / 1000;
  const releaseSec = s.releaseMs / 1000;
  const endAt = { time: 0 };

  const start = (graph: Graph, time: number, freq: number) => {
    if (!pan) {
      pan = new StereoPannerNode(graph.ctx, { pan: ONE_EAR_PAN });
      pan.connect(graph.extras);
    }
    const gain = new GainNode(graph.ctx, { gain: 0 });
    const osc = new OscillatorNode(graph.ctx, { type: "sine", frequency: freq });
    osc.connect(gain).connect(pan);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(s.maxGain * loudnessGain(freq), time + attackSec);
    gain.gain.setTargetAtTime(0, endAt.time, releaseSec / 3);
    osc.start(time);
    osc.stop(endAt.time + releaseSec * 3);
    playing.push(osc);
  };

  if (!tones) return playSequence([], { name });
  const steps: Step[] = [
    { durationSec: SOLO_SEC, run: (time, _v, graph) => start(graph, time, tones.aHz) },
    { durationSec: TOGETHER_SEC, run: (time, _v, graph) => start(graph, time, tones.bHz) },
  ];
  return playSequence(steps, {
    name,
    onStart(time, _graph, totalSec) {
      endAt.time = time + totalSec;
      const c = caption(tones.beatsPerSec);
      emitCaption(c.key, c.params);
    },
    onStop(time) {
      for (const osc of playing) osc.stop(time + 0.05);
    },
  });
}
