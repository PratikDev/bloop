import { getCtx, getGraph, peekEngine } from "@/lib/audio/context";
import { isVoiceAudible } from "@/lib/audio/mixer";
import { continuousRule, mapContinuous } from "@/lib/audio/mapping";
import { track } from "@/lib/audio/sources";
import { onStopAll } from "@/lib/audio/stop";
import { VOICE_IDS, type VoiceId } from "@/lib/audio/types";
import { getGraph as getJukeboxGraph } from "@/lib/audio-jukebox/graph";
import { chordLayer, chordOptedIn, subscribeChordOptIn } from "../chord-hook";
import { dialLayers, type DialLayers } from "../dial";
import { crossed, gridlines } from "../gridlines";
import { createBed, createDrone, createReverb, droneColour, playTick, reverbLevel, type Swell } from "../layers";
import { dialStop, getArt, orchestraOn, subscribeArt } from "../settings";
import { saFor } from "./dress";

interface Live {
  out: GainNode;
  reverb: { input: GainNode; wet: GainNode };
  bed: Swell | null;
  drone: Swell | null;
  sa: number;
  colour: ReturnType<typeof droneColour>;
  jukeboxTapped: boolean;
}

let live: Live | null = null;
const sounding = new Map<string, boolean>();
const lastValue = new Map<string, number>();
let lastVoice: string | null = null;

const isL2Voice = (id: string): id is VoiceId => (VOICE_IDS as readonly string[]).includes(id);
const audible = (id: string) => !isL2Voice(id) || isVoiceAudible(id);

function currentLayers(): DialLayers | null {
  const stop = dialStop();
  return stop === null ? null : dialLayers(stop, getArt().context?.playMode ?? "single", orchestraOn());
}

function ensure(): Live | null {
  if (!peekEngine() || currentLayers() === null) return null;
  if (live) return live;
  const ctx = getCtx();
  const graph = getGraph();
  const out = new GainNode(ctx, { gain: 1 });
  out.connect(graph.sonification);
  const reverb = createReverb(ctx, graph.master);
  graph.sonification.connect(reverb.input);
  live = { out, reverb, bed: null, drone: null, sa: 0, colour: "dry", jukeboxTapped: false };
  return live;
}

const anySounding = () => [...sounding].some(([id, on]) => on && audible(id));

function sync(at?: number) {
  const l = ensure();
  if (!l) return;
  const ctx = getCtx();
  const t = Math.max(at ?? ctx.currentTime, ctx.currentTime);
  const layers = currentLayers();
  const on = anySounding();
  const jb = getJukeboxGraph();
  if (jb && !l.jukeboxTapped) {
    jb.fade.connect(l.reverb.input);
    l.jukeboxTapped = true;
  }
  l.reverb.wet.gain.setTargetAtTime(reverbLevel(Boolean(layers?.reverb)), ctx.currentTime, 0.1);
  const sa = saFor(lastVoice ?? "ocean");
  const colour = droneColour(getArt().context?.month ?? null);
  if (sa !== l.sa || colour !== l.colour) {
    l.bed?.stop(ctx.currentTime);
    l.drone?.stop(ctx.currentTime);
    l.bed = l.drone = null;
    l.sa = sa;
    l.colour = colour;
  }
  if (layers?.bed) l.bed ??= createBed(ctx, l.out, sa, track);
  if (layers?.drone) l.drone ??= createDrone(ctx, l.out, sa, colour, track);
  l.bed?.set(Boolean(layers?.bed) && on, t);
  l.drone?.set(Boolean(layers?.drone) && on, t);
  syncChord(layers);
}

function syncChord(layers: DialLayers | null) {
  const chord = chordLayer();
  const context = getArt().context;
  if (!chord) return;
  if (layers?.chord && context && chordOptedIn() && anySounding()) chord.enable({ recordId: context.recordId, playMode: context.playMode }, "dial");
  else chord.disable("dial");
}

export function reportVoice(voiceId: string, value: number | null, isSounding: boolean, time?: number): void {
  if (currentLayers() === null) return;
  lastVoice = voiceId;
  const was = sounding.get(voiceId) ?? false;
  sounding.set(voiceId, isSounding);
  const prev = lastValue.get(voiceId);
  if (value === null) lastValue.delete(voiceId);
  else lastValue.set(voiceId, value);
  if (currentLayers()?.ticks && value !== null && prev !== undefined && audible(voiceId)) ticks(voiceId, prev, value, time);
  if (was !== isSounding || !live) sync(time);
}

function ticks(voiceId: string, prev: number, value: number, time?: number) {
  const l = ensure();
  if (!l) return;
  let rule;
  try {
    rule = continuousRule(voiceId);
  } catch {
    return;
  }
  if (rule.output.param !== "frequency") return;
  const ctx = getCtx();
  const t = Math.max(time ?? ctx.currentTime, ctx.currentTime);
  crossed(gridlines(rule.input), prev, value).forEach((g, i) => {
    const hz = mapContinuous(g, rule);
    if (hz !== null) playTick(ctx, l.out, hz, t + i * 0.03, track);
  });
}

onStopAll(() => {
  if (live) {
    const now = getCtx().currentTime;
    live.reverb.wet.gain.cancelScheduledValues(now);
    live.reverb.wet.gain.setTargetAtTime(0, now, 0.01);
    live.bed = live.drone = null;
    live.sa = 0;
  }
  sounding.clear();
  lastValue.clear();
  chordLayer()?.stop();
});
subscribeArt(() => sync());
subscribeChordOptIn(() => sync());
