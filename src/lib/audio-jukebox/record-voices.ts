// Official records' plain voices (PROPOSAL §15): any mapping.json voice with a
// continuous rule, played on the extras bus. The synth follows the rule's output param, so a new record needs only
// its mapping entry: frequency → tone, cutoff → haze, clicksPerSecond → clicks. Voices are made on first use.

import { continuousRule } from "@/lib/audio/mapping";
import type { Graph } from "./graph";
import { createClickVoice } from "./voices/clicks";
import { createHazeVoice } from "./voices/haze";
import { createToneVoice } from "./voices/tone";

interface RecordVoice {
  set(value: number | null, lon: number): void;
}

const SYNTHS: Record<string, (g: Graph, id: string, bus: AudioNode) => RecordVoice> = {
  frequency: createToneVoice,
  cutoff: createHazeVoice,
  clicksPerSecond: createClickVoice,
};

const voices = new Map<string, RecordVoice>();

function voice(graph: Graph, id: string): RecordVoice {
  let v = voices.get(id);
  if (!v) {
    const param = continuousRule(id).output.param;
    const make = SYNTHS[param];
    if (!make) throw new Error(`record voice "${id}": no synth for output param "${param}"`);
    v = make(graph, id, graph.extras);
    voices.set(id, v);
  }
  return v;
}

export function setRecordVoice(graph: Graph, id: string, value: number | null, lon: number): void {
  voice(graph, id).set(value, lon);
}

export function silenceRecord(): void {
  for (const v of voices.values()) v.set(null, 0);
}
