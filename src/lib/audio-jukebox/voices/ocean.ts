// Ocean voice: the tone voice with the mapping.json "ocean" rule on the ocean bus (30 ms glide).

import type { Graph } from "../graph";
import { createToneVoice, type ToneVoice } from "./tone";

export type OceanVoice = ToneVoice;

export const createOceanVoice = (graph: Graph): OceanVoice => createToneVoice(graph, "ocean", graph.voiceBus.ocean);
