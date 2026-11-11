// The app's two sound engines and the rules that make them one instrument.
//   L2 (@/lib/audio-adapter): Home, Listen, Then vs Now, How we know: every page from main's redesign.
//   Jukebox (@/lib/audio-jukebox): the Official and Related records, the Turntable and its scenes, and Unison.
// Both play on one AudioContext (the Jukebox graph is built on L2's: one unlock on the first gesture, one iPhone
// playback session). This module is the one place that reaches both: Mute all, solo, the mix and Stop apply to
// both; the live voices follow the cursor on one engine only (the page's); and a sequence that starts on one engine
// silences the other's live voices, so the two never play at once unless a page asks for it.

import type { Mode } from "@/components/AppState/reducer";
import { audio as l2 } from "@/lib/audio-adapter";
import type { AudioEvent, LiveVoiceId, TrackMode } from "@/lib/audio-adapter/types";
import { audio as jukebox } from "@/lib/audio-jukebox";

type EngineId = "l2" | "jukebox";

/** The pages that play on the Jukebox engine. */
const JUKEBOX_MODES: readonly Mode[] = ["turntable", "official"];

export const engineFor = (mode: Mode): EngineId => (JUKEBOX_MODES.includes(mode) ? "jukebox" : "l2");

/** The engine whose live voices follow the cursor (or the Turntable's needle) on a page. */
export const liveEngine = (mode: Mode) => (engineFor(mode) === "jukebox" ? jukebox : l2);

/** The engine a page does not use: its live voices stay silent there. */
export const otherEngine = (mode: Mode) => (engineFor(mode) === "jukebox" ? l2 : jukebox);

/** Inside a click or key handler: starts the shared context and both graphs (one gesture unlocks both). */
export async function ensureAudioAll(): Promise<void> {
  await l2.ensureAudio();
  await jukebox.ensureAudio();
}

/** Stop: every sequence, speech and live voice on both engines. */
export function stopAllEngines(): void {
  l2.stopAll();
  jukebox.stopAll();
}

/** The mixer's settings (Mute all, solo, per-voice mute and volume, the track) reach both engines. */
export const mixBoth = {
  setAllMuted(muted: boolean) {
    l2.setAllMuted(muted);
    jukebox.setAllMuted(muted);
  },
  setSolo(id: LiveVoiceId | null) {
    l2.setSolo(id);
    jukebox.setSolo(id);
  },
  setVoiceMuted(id: LiveVoiceId, muted: boolean) {
    l2.setVoiceMuted(id, muted);
    jukebox.setVoiceMuted(id, muted);
  },
  setVoiceVolume(id: LiveVoiceId, v: number) {
    l2.setVoiceVolume(id, v);
    jukebox.setVoiceVolume(id, v);
  },
  setTrackMode(mode: TrackMode) {
    l2.setTrackMode(mode);
    jukebox.setTrackMode(mode);
  },
};

/** The output analyser of the engine a page plays on (the waveform), or null before Start. */
export const analyserFor = (mode: Mode): AnalyserNode | null => liveEngine(mode).getAnalyser();

/** Every event from both engines (captions, steps, state), in the shape the UI reads. */
export function onAnyAudioEvent(cb: (e: AudioEvent) => void): () => void {
  const offL2 = l2.onAudioEvent(cb);
  // The Jukebox engine's events are the same kinds; its extra "drop" events (rain ripples) are its own.
  const offJukebox = jukebox.onAudioEvent((e) => {
    if (e.kind !== "drop") cb(e);
  });
  return () => {
    offL2();
    offJukebox();
  };
}

let handOff: (() => void) | null = null;

/**
 * Starts the hand-off once (AppShell): a sequence's first step on one engine (a sweep, a legend, a record, a scene,
 * Unison) silences the other engine's live voices. The page's own live voices come back with the next cursor move.
 */
export function startEngineHandOff(): () => void {
  if (handOff) return handOff;
  const firstStep = (e: AudioEvent) => e.kind === "step" && e.index === 0;
  const offL2 = l2.onAudioEvent((e) => firstStep(e) && jukebox.silenceLive());
  const offJukebox = jukebox.onAudioEvent((e) => {
    if (firstStep(e)) l2.silenceLive();
  });
  handOff = () => {
    offL2();
    offJukebox();
    handOff = null;
  };
  return handOff;
}
