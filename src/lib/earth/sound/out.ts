// Where the DATA layers sound: their own gain on the Jukebox engine's extras bus (src/lib/audio-jukebox/graph.ts), so
// Mute all, solo and Stop's fade reach them like every other record voice. Every sound is synthesised here (no samples).
// A small read-out (window.__bloopData, always on: it holds no data the page doesn't show) lets the browser checks see
// what each layer is playing without listening.

import { audio } from "@/lib/audio-jukebox";
import { ensureGraph, getGraph, type Graph } from "@/lib/audio-jukebox/graph";
import { addTask } from "@/lib/audio-jukebox/scheduler";

export { addTask };

let bus: GainNode | null = null;

/** The graph and the DATA bus, once the engine is started (inside a gesture: see ensureDataAudio). */
export function dataOut(): { graph: Graph; bus: GainNode } | null {
  const graph = getGraph();
  if (!graph) return null;
  if (!bus) {
    bus = new GainNode(graph.ctx, { gain: 1 });
    bus.connect(graph.extras);
  }
  return { graph, bus };
}

/** Starts the Jukebox engine (and its scheduler) inside a click or key handler. */
export async function ensureDataAudio(): Promise<{ graph: Graph; bus: GainNode } | null> {
  await ensureGraph();
  await audio.ensureAudio();
  return dataOut();
}

/** What each DATA layer is playing now, for the browser checks (and nothing else). */
interface DataSoundState {
  chord: { voice: string; code: number | null; hz: number[] } | null;
  rumble: { code: number | null; cutoffHz: number | null; pulses: number } | null;
  geiger: { rate: number; cutoffHz: number | null; clicks: number } | null;
  lights: { radiance: number | null; hz: number | null; step: number } | null;
  radar: { mode: string; notes: number; firstHz: number | null; lastHz: number | null } | null;
}

const state: DataSoundState = { chord: null, rumble: null, geiger: null, lights: null, radar: null };

export function report<K extends keyof DataSoundState>(key: K, value: DataSoundState[K]): void {
  state[key] = value;
  if (typeof window !== "undefined") (window as unknown as { __bloopData?: DataSoundState }).__bloopData = state;
}
