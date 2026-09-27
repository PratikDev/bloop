// The single AudioContext (AUDIO_RESEARCH A3). Created lazily inside a user
// gesture and reused everywhere; the graph, noise buffer and scheduler start
// with it.

import { emit } from "./events";
import { buildGraph, type Graph } from "./graph";
import { startScheduler } from "./scheduler";

interface Engine {
  ctx: AudioContext;
  graph: Graph;
  noise: AudioBuffer;
}

let engine: Engine | null = null;

const NOISE_SECONDS = 2;

function createNoise(ctx: AudioContext): AudioBuffer {
  const buffer = new AudioBuffer({ length: ctx.sampleRate * NOISE_SECONDS, sampleRate: ctx.sampleRate });
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function emitState(playing = false, ducked = false) {
  emit({ kind: "state", ready: isAudioReady(), playing, ducked });
}

/** Creates / resumes the engine. Public entry point is ensureAudio() in index.ts. */
export async function startEngine(): Promise<void> {
  if (!engine) {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    engine = { ctx, graph: buildGraph(ctx), noise: createNoise(ctx) };
    ctx.addEventListener("statechange", () => emitState());
    startScheduler(() => ctx.currentTime);
  }
  if (engine.ctx.state === "suspended") await engine.ctx.resume();
  emitState();
}

export function isAudioReady(): boolean {
  return engine?.ctx.state === "running";
}

function requireEngine(): Engine {
  if (!engine) throw new Error("Audio not started: call ensureAudio() inside a click or key handler first.");
  return engine;
}

export const getCtx = (): AudioContext => requireEngine().ctx;
export const getGraph = (): Graph => requireEngine().graph;
export const getNoise = (): AudioBuffer => requireEngine().noise;

/** The output analyser (after the compressor, fftSize 2048), or null before Start. */
export function getAnalyser(): AnalyserNode | null {
  return engine?.graph.meter ?? null;
}

/** The engine if it has started, else null (for code that must be a no-op before Start). */
export function peekEngine(): Engine | null {
  return engine;
}

export interface AudioInfo {
  state: AudioContextState;
  sampleRate: number;
  baseLatencyMs: number;
}

export function getAudioInfo(): AudioInfo | null {
  if (!engine) return null;
  const { ctx } = engine;
  return { state: ctx.state, sampleRate: ctx.sampleRate, baseLatencyMs: ctx.baseLatency * 1000 };
}
