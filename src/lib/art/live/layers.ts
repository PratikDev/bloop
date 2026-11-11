// The dial's layers in the live app: one set on the shared AudioContext, after L2's sonification bus (so speech ducks
// them, Mute all silences them with the master, and Stop / Esc ends them with every other source). Data voices report
// here (value, sounding, time): the bed and the drone sound only while a data voice does (silence still means no data),
// the ticks follow round-value crossings at 0 Measure, and the chord is asked for through the hook (owner "dial").

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

/** The layers the dial asks for now (none when the dial isn't built in). */
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

/** Brings the bed, drone, reverb and chord in line with the dial, the record and whether data sounds. */
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
  // Opt-in (CV's toggle), and only while a data voice sounds.
  if (layers?.chord && context && chordOptedIn() && anySounding()) chord.enable({ recordId: context.recordId, playMode: context.playMode }, "dial");
  else chord.disable("dial");
}

/** A data voice's news: its value (input units; null = silent) and whether it sounds, now or at `time`. */
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

// Stop / Esc: every layer's sources are stopped with the rest; forget them, and let the chord go. The reverb's tail is
// cut too (it would ring on for a second after its sources stop); the next sync brings the wet level back.
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
