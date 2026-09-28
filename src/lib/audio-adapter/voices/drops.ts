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
const MAX_LATE_SEC = 0.25; // later than this, a drop restarts the chain (no catch-up burst)
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

  // The next drop is due once `left` drops' worth of progress has built up
  // after `from`, at the rate in force. The jitter is drawn once per drop; a
  // density change only re-times the rest of the interval, never re-draws it.
  // (Re-drawing on every change favoured short intervals: +17% drops while
  // dragging over light rain, the same bug L2 fixed in its engine.)
  let from = 0;
  let left = 0; // no progress needed: the first drop falls as soon as it rains
  const drawJitter = () => 1 - JITTER + Math.random() * 2 * JITTER;

  addTask((until) => {
    for (;;) {
      const change = queue[0];
      const due = current.rate > 0 ? from + left / current.rate : Number.POSITIVE_INFINITY;
      // A density change takes effect at its own time, not at the next drop
      // planned under the old rate (no lag on sweeps, no wait for heavier rain).
      if (change && change.time <= due) {
        if (change.time > from) {
          left = Math.max(0, left - (change.time - from) * current.rate); // silence pauses progress
          from = change.time;
        }
        queue.shift();
        current = change;
        continue;
      }
      if (due >= until) return;
      // A slightly late tick plays the drop now but keeps its place in the
      // chain (so the average holds); after a long stall (a hidden tab) the
      // chain restarts now instead of catching up in a burst.
      const time = Math.max(due, ctx.currentTime + 0.01);
      out.pan.setValueAtTime(panFor(current.lon), time);
      play(time, current.peak);
      emit({ kind: "drop", voice: kind, time, gain: current.peak / spec.sound.maxGain, lon: current.lon });
      from = time - due > MAX_LATE_SEC ? time : due;
      left = drawJitter();
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
