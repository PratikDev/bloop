// Interim sound engine: a minimal, working implementation of L2's planned API
// (docs/L2/BUILD_PLAN.md §2) built from docs/L2/AUDIO_RESEARCH.md Part A.
// It exists so L3 can build and test the UI before L2's engine lands; the UI
// shows an "Interim sound engine" badge while it is in use.

import { MAPPING } from "@/lib/audio/mapping";
import { playEarconAt } from "./earcons";
import { emit, emitCaption, onAudioEvent } from "./events";
import { ensureGraph, getGraph, glideTo } from "./graph";
import { initLive, live } from "./live";
import { applyMix, mixer } from "./mixer";
import { playLegend, playMotif, playOpening, playSweep, playWarmup } from "./players";
import { fastFade, stopCurrentSequence } from "./sequence";
import { startScheduler } from "./scheduler";
import { playCompare, playSeries, playThenNow } from "./then-now";
import { playTimelapse } from "./timelapse";
import { cancelSpeech, initSpeech, speak } from "./speech";
import type { AudioEngine } from "./types";

const VOLUME_GLIDE_SEC = 0.05;
let initialised = false;

export const interimEngine: AudioEngine = {
  async ensureAudio() {
    const graph = await ensureGraph();
    if (!initialised) {
      initialised = true;
      initLive(graph);
      initSpeech();
      startScheduler(graph.ctx);
      applyMix();
    }
    emit({ kind: "state", ready: graph.ctx.state === "running", playing: true, ducked: false });
  },
  isAudioReady() {
    return getGraph()?.ctx.state === "running";
  },
  stopAll() {
    const graph = getGraph();
    if (!graph) return;
    stopCurrentSequence(false);
    fastFade(graph);
    live.silence();
    cancelSpeech();
    emitCaption("caption.stopped");
  },
  setMasterVolume(v) {
    const graph = getGraph();
    if (!graph) return;
    const level = MAPPING.global.masterGain * Math.min(1, Math.max(0, v));
    glideTo(graph.ctx, graph.master.gain, level, VOLUME_GLIDE_SEC);
  },

  setVoiceMuted: mixer.setVoiceMuted,
  setSolo: mixer.setSolo,
  setAllMuted: mixer.setAllMuted,
  setVoiceVolume: mixer.setVoiceVolume,
  setTrackMode: mixer.setTrackMode,

  setOcean: live.setOcean,
  setRain: live.setRain,
  silenceLive: live.silence,

  speak,
  playEarcon(id, opts) {
    const graph = getGraph();
    if (!graph) return;
    playEarconAt(graph, id, graph.ctx.currentTime, opts?.lon ?? 0);
    emitCaption(`caption.earcon.${id}`, opts?.params ?? {});
  },
  playLegend,
  playWarmup,
  playSweep,
  playMotif,
  playOpening,
  playThenNow,
  playTimelapse,
  playCompare,
  playSeries,

  onAudioEvent,
  getAnalyser() {
    return getGraph()?.analyser ?? null;
  },
};
