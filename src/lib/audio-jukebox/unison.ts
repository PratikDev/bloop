// Proof in unison (idea C1; mapping.json "unison" = sameAs "ocean"): the frame's tone alone, then
// NASA's file tone joins it in the same (left) ear. Both pitches follow the Ocean rule, so equal
// values are one pure tone and any difference beats |f1 − f2| times a second.

import { loudnessGain, unisonTones, voiceSpec } from "@/lib/audio/mapping";
import { emitCaption } from "./events";
import type { Graph } from "./graph";
import { playSequence, type Step } from "./sequence";
import type { PlayerHandle } from "./types";

const SOLO_SEC = 1.2;
const TOGETHER_SEC = 3.6;
const ONE_EAR_PAN = -1;

export function playUnison(pair: { frameC: number; fileC: number }): PlayerHandle {
  const tones = unisonTones(pair.frameC, pair.fileC);
  const s = voiceSpec("unison").sound;
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

  if (!tones) return playSequence([], { name: "unison" });
  const steps: Step[] = [
    { durationSec: SOLO_SEC, run: (time, _v, graph) => start(graph, time, tones.frameHz) },
    { durationSec: TOGETHER_SEC, run: (time, _v, graph) => start(graph, time, tones.fileHz) },
  ];
  return playSequence(steps, {
    name: "unison",
    onStart(time, _graph, totalSec) {
      endAt.time = time + totalSec;
      emitCaption("caption.unison", { frame: pair.frameC, file: pair.fileC, beats: tones.beatsPerSec });
    },
    onStop(time) {
      for (const osc of playing) osc.stop(time + 0.05);
    },
  });
}
