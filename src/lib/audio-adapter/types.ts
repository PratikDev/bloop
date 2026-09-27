// Public audio API used by every L3 component.
// Names and argument shapes follow docs/L2/BUILD_PLAN.md §2, so L2's real engine
// can replace the interim one without UI changes. Additions that L2's plan does
// not have yet are marked PROPOSAL and listed in docs/L3/contract-proposals.md §B.

import type { RainPhase } from "@/types/data-contract";

export type { RainPhase };

export type TrackMode = "ocean" | "rain" | "both";
export type VoiceId = "ocean" | "rain" | "snow" | "heat" | "monsoon" | "water" | "fires" | "vegetation";
export type LiveVoiceId = Extract<VoiceId, "ocean" | "rain" | "snow">;
export const LIVE_VOICES: readonly LiveVoiceId[] = ["ocean", "rain", "snow"];
/** Which live voices each track mode plays. */
export const TRACK_VOICES: Record<TrackMode, readonly LiveVoiceId[]> = {
  ocean: ["ocean"],
  rain: ["rain", "snow"],
  both: ["ocean", "rain", "snow"],
};
export type EarconId = "nodata" | "whisper" | "ping";
export type LegendVoice = "ocean" | "rain" | "snow" | "heat" | "water";
export type Lang = "en" | "bn";

/** One step of a sweep, opening or time-lapse. */
export interface SweepPoint {
  lon: number; // −180..180, drives stereo
  lat: number; // for captions only
  valueC: number | null; // ocean °C; null = land / no data
  mmPerHour: number | null; // rain; 0 = dry; null = no data
  phase: RainPhase;
}

export interface PlayerHandle {
  stop(): void; // ~50 ms fade, then `done` resolves
  readonly done: Promise<void>;
}

export type CaptionParams = Record<string, string | number>;

export type AudioEvent =
  | { kind: "caption"; key: string; params: CaptionParams }
  | { kind: "step"; player: string; index: number; total: number; time: number }
  | { kind: "state"; ready: boolean; playing: boolean; ducked: boolean }
  // PROPOSAL B2: one event per scheduled drop, for rain ripples. `time` is the
  // AudioContext time the drop sounds; `gain` is its loudness 0..1.
  | { kind: "drop"; voice: "rain" | "snow"; time: number; gain: number; lon: number };

/** Then vs Now input (docs/L2/BUILD_PLAN.md §8.1). One value per year. */
export interface WindowSeries {
  label: string;
  years: number[];
  values: number[];
}

export interface ThenNowInput {
  heat: { A: WindowSeries; B: WindowSeries }; // GISTEMP Apr–May anomalies, °C
  monsoon: { A: WindowSeries; B: WindowSeries }; // GPCP Jun–Sep, mm/day
  water: { months: string[]; cm: (number | null)[]; windowA: [string, string]; windowB: [string, string] }; // GRACE Bangladesh
  captions: { heat: string; monsoon: string; water: string }; // exactly as the JSON gives them
}

export type ThenNowPart = "heat" | "monsoon" | "water" | "all";
export type ContextVoice = "heat" | "monsoon" | "water";

export interface CompareSide {
  label: string;
  values: (number | null)[];
  voice: ContextVoice;
}

/**
 * Exactly the part of L2's planned API (docs/L2/BUILD_PLAN.md §2.2, §8) that the
 * UI uses. L2's real engine must satisfy this as-is: same names, same shapes.
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
