// Rain and snow voices: individual drops (rain) or soft bells (snow) scheduled
// by the shared look-ahead scheduler. Density follows mapping.json (drops per
// second); timing varies ±30% around the rule's rate so it sounds like weather,
// while the average rate still equals the rule (AUDIO_RESEARCH A4).

import { loudnessGain, mapVoice, normalise, panFor, voiceSpec } from "@/lib/audio/mapping";
import { emit } from "../events";
import type { Graph } from "../graph";
import { addTask } from "../scheduler";

type DropKind = "rain" | "snow";

interface Density {
  time: number; // when this density starts (AudioContext time)
  rate: number; // drops per second; 0 = silent
  peak: number; // per-drop peak gain
  lon: number;
}

export interface DropVoice {
  /** Live: change density now (clears anything sequenced). null = silence. */
  set(mmPerHour: number | null, lon: number): void;
  /** Sequenced: change density at `time`. */
  at(time: number, mmPerHour: number | null, lon: number): void;
}

const JITTER = 0.3;
const RAIN_FILTER_HZ = 2400;
const SNOW_PARTIAL_RATIO = 2.76; // bell-like inharmonic partial
const SNOW_BASE_HZ = [1046.5, 1174.7, 1318.5, 1568, 1760]; // a soft pentatonic set

/** One raindrop sound: shared noise buffer → envelope → shared band-pass (AUDIO_RESEARCH A4). Returns its source node. */
export function createRainDropSound(graph: Graph, destination: AudioNode, attackSec: number, releaseSec: number) {
  const { ctx } = graph;
  const filter = new BiquadFilterNode(ctx, { type: "bandpass", frequency: RAIN_FILTER_HZ, Q: 1.2 });
  filter.connect(destination);
  return (time: number, peak: number) => {
    const src = new AudioBufferSourceNode(ctx, { buffer: graph.noise, playbackRate: 0.8 + Math.random() * 0.4 });
    const env = new GainNode(ctx, { gain: 0 });
    src.connect(env).connect(filter);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(peak, time + attackSec);
    env.gain.setTargetAtTime(0, time + attackSec, releaseSec / 3);
    src.start(time, Math.random() * 0.8);
    src.stop(time + attackSec + releaseSec * 2);
    return src;
  };
}

export function createDropVoice(graph: Graph, kind: DropKind): DropVoice {
  const { ctx } = graph;
  const spec = voiceSpec(kind);
  const attackSec = spec.sound.attackMs / 1000;
  const releaseSec = spec.sound.releaseMs / 1000;
  const input = spec.mapping?.kind === "continuous" ? spec.mapping.input : null;

  const out = new StereoPannerNode(ctx, { pan: 0 });
  out.connect(graph.voiceBus[kind]);

  let queue: Density[] = [];
  let current: Density = { time: 0, rate: 0, peak: 0, lon: 0 };
  let nextTime = 0;

  function density(time: number, mmPerHour: number | null, lon: number): Density {
    const rate = mapVoice(kind, mmPerHour) ?? 0; // null / dry / no data → 0
    const t = input && mmPerHour !== null ? (normalise(mmPerHour, input) ?? 0) : 0;
    return { time, rate, peak: spec.sound.maxGain * (0.6 + 0.4 * t), lon };
  }


  function playBell(time: number, peak: number) {
    const f = SNOW_BASE_HZ[Math.floor(Math.random() * SNOW_BASE_HZ.length)];
    const env = new GainNode(ctx, { gain: 0 });
    env.connect(out);
    const level = peak * loudnessGain(f);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(level, time + attackSec);
    env.gain.setTargetAtTime(0, time + attackSec, releaseSec / 3);
    for (const [ratio, amp] of [[1, 1], [SNOW_PARTIAL_RATIO, 0.3]] as const) {
      const osc = new OscillatorNode(ctx, { frequency: f * ratio });
      const partial = new GainNode(ctx, { gain: amp });
      osc.connect(partial).connect(env);
      osc.start(time);
      osc.stop(time + attackSec + releaseSec * 2);
    }
  }

  const play = kind === "rain" ? createRainDropSound(graph, out, attackSec, releaseSec) : playBell;

  let lastDrop = Number.NEGATIVE_INFINITY;
  const interval = (rate: number) => (1 / rate) * (1 - JITTER + Math.random() * 2 * JITTER);

  addTask((until) => {
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.01;
    for (;;) {
      // A density change takes effect at its own time, not at the next drop
      // planned under the old rate (no lag on sweeps, no wait for heavier rain).
      const change = queue[0];
      if (change && change.time <= nextTime) {
        queue.shift();
        current = change;
        nextTime =
          current.rate > 0
            ? Math.max(change.time, ctx.currentTime, lastDrop + interval(current.rate))
            : change.time;
        continue;
      }
      if (nextTime >= until) return;
      if (current.rate === 0) {
        // Silent: wait for the next density change.
        if (!change || change.time >= until) return;
        nextTime = change.time;
        continue;
      }
      out.pan.setValueAtTime(panFor(current.lon), nextTime);
      play(nextTime, current.peak);
      emit({ kind: "drop", voice: kind, time: nextTime, gain: current.peak / spec.sound.maxGain, lon: current.lon });
      lastDrop = nextTime;
      nextTime += interval(current.rate);
    }
  });

  return {
    set(mmPerHour, lon) {
      queue = [density(ctx.currentTime, mmPerHour, lon)];
    },
    at(time, mmPerHour, lon) {
      queue = queue.filter((d) => d.time < time);
      queue.push(density(time, mmPerHour, lon));
    },
  };
}
