// Public audio API used by every L3 component.
// The data types are L2's (src/lib/audio/types.ts), re-exported so there is one
// copy. The interfaces below are the contract: exactly the part of L2's API the
// UI calls, so the build fails if L2's engine ever drifts from it.

import type {
  AudioEvent,
  CaptionParams,
  CompareSide,
  EarconId,
  Lang,
  LegendVoice,
  PlayerHandle,
  RainPhase,
  SweepPoint,
  ThenNowInput,
  ThenNowPart,
  TrackMode,
  VoiceId,
} from "@/lib/audio";

export type {
  AudioEvent,
  CaptionParams,
  CompareSide,
  EarconId,
  Lang,
  LegendVoice,
  LiveVoiceId,
  PlayerHandle,
  RainPhase,
  SweepPoint,
  ThenNowInput,
  ThenNowPart,
  TrackMode,
  VoiceId,
  WindowSeries,
} from "@/lib/audio";
export { LIVE_VOICES, TRACK_VOICES } from "@/lib/audio";

/**
 * Exactly the part of L2's API (docs/L2/BUILD_PLAN.md §2.2, §8) that the UI
 * uses. L2's engine must satisfy this as-is: same names, same shapes.
 */
export interface L2AudioApi {
  // Lifecycle
  ensureAudio(): Promise<void>; // call inside a click/keydown handler
  isAudioReady(): boolean;
  stopAll(): void;
  setMasterVolume(v: number): void;

  // Mixer
  setVoiceMuted(id: VoiceId, muted: boolean): void;
  setSolo(id: VoiceId | null): void;
  setAllMuted(muted: boolean): void;

  // Live exploration
  setTrackMode(mode: TrackMode): void;
  setOcean(valueC: number | null, lon: number): void;
  setRain(mmPerHour: number | null, phase: RainPhase, lon: number): void;
  silenceLive(): void;

  // Speech, legend, earcons
  speak(text: string, lang: Lang): Promise<void>;
  playEarcon(id: EarconId, opts?: { lon?: number; params?: CaptionParams }): void;
  playLegend(voice: LegendVoice): PlayerHandle;
  playWarmup(): PlayerHandle;

  // Sequences
  playSweep(points: SweepPoint[], opts?: { stepMs?: number }): PlayerHandle;
  playMotif(bandMeansC: (number | null)[]): PlayerHandle;
  playOpening(points: SweepPoint[], opts?: { durationSec?: number }): PlayerHandle;

  // Then vs Now / Compare
  playThenNow(input: ThenNowInput, part: ThenNowPart): PlayerHandle;
  playCompare(a: CompareSide, b: CompareSide, mode: "sequential" | "split"): PlayerHandle;
  // Storm time-lapse (L2 BUILD_PLAN Phase 6): step events under "timelapse", index = frame.
  playTimelapse(frames: SweepPoint[], opts?: { fps?: number; loop?: boolean }): PlayerHandle;
  // B6, accepted by L2 on 28 Sep: one series, step events under `player`.
  playSeries(side: CompareSide, opts?: { stepMs?: number; player?: string }): PlayerHandle;

  // Events
  onAudioEvent(cb: (e: AudioEvent) => void): () => void;
}

/**
 * L3's additions (docs/L3/contract-proposals.md §B). Requested from L2, but the
 * UI never depends on them: withFallbacks() fills any that are missing.
 */
export interface L3AudioExtensions {
  setVoiceVolume(id: VoiceId, v: number): void; // B3: per-voice volume slider
  getAnalyser(): AnalyserNode | null; // B1: waveform, rings, audio clock
}

export type AudioEngine = L2AudioApi & L3AudioExtensions;
