import { audio } from "@/lib/audio-jukebox";
import { ensureGraph, getGraph, type Graph } from "@/lib/audio-jukebox/graph";
import { addTask } from "@/lib/audio-jukebox/scheduler";

export { addTask };

let bus: GainNode | null = null;

export function dataOut(): { graph: Graph; bus: GainNode } | null {
  const graph = getGraph();
  if (!graph) return null;
  if (!bus) {
    bus = new GainNode(graph.ctx, { gain: 1 });
    bus.connect(graph.extras);
  }
  return { graph, bus };
}

export async function ensureDataAudio(): Promise<{ graph: Graph; bus: GainNode } | null> {
  await ensureGraph();
  await audio.ensureAudio();
  return dataOut();
}

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
