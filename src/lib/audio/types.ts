// Public types of the audio engine. Other lanes import these (via @/lib/audio),
// never the internal modules. Inputs are plain numbers and arrays, so the
// engine has no dependency on lib/data.ts or on the data-file shapes.

import type { RainPhase } from "@/types/data-contract";

export type { RainPhase };

export type TrackMode = "ocean" | "rain" | "both";
export type Lang = "en" | "bn";

// Every voice that owns a mixer channel (mute / solo / level).
export const VOICE_IDS = [
  "ocean",
  "rain",
  "snow",
  "heat",
  "monsoon",
  "water",
  "fires",
  "vegetation",
] as const;
export type VoiceId = (typeof VOICE_IDS)[number];

/** The live-exploration voices, and which of them each track mode plays. */
export const LIVE_VOICES = ["ocean", "rain", "snow"] as const satisfies readonly VoiceId[];
export type LiveVoiceId = (typeof LIVE_VOICES)[number];
export const TRACK_VOICES: Readonly<Record<TrackMode, readonly LiveVoiceId[]>> = {
  ocean: ["ocean"],
  rain: ["rain", "snow"],
  both: ["ocean", "rain", "snow"],
};

export type EarconId = "nodata" | "whisper" | "ping";
export type LegendVoice = "ocean" | "rain" | "snow" | "heat" | "water";

/** One step of a sweep, the opening or the time-lapse. */
export interface SweepPoint {
  lon: number; // −180..180, drives stereo
  lat: number; // for captions only
  valueC: number | null; // ocean °C; null = land / no data
  mmPerHour: number | null; // rain; 0 = dry; null = no data
  phase: RainPhase;
}

export interface PlayerHandle {
  /** Fades out (~50 ms) and stops; `done` then resolves. */
  stop(): void;
  /** Resolves when the player finishes or is stopped. */
  readonly done: Promise<void>;
}

/** One value per year of a comparison window (Then vs Now). */
export interface WindowSeries {
  label: string; // e.g. "1981–1990"
  years: number[];
  values: number[];
}

export interface ThenNowInput {
  heat: { A: WindowSeries; B: WindowSeries }; // GISTEMP Apr–May anomalies, °C
  monsoon: { A: WindowSeries; B: WindowSeries }; // GPCP Jun–Sep, mm/day
  water: {
    months: string[]; // "YYYY-MM"
    cm: (number | null)[]; // GRACE; null = no satellite measurement
    windowA: [string, string];
    windowB: [string, string];
  };
  captions: { heat: string; monsoon: string; water: string }; // exact wording from the JSON
}

export interface CompareSide {
  label: string;
  values: (number | null)[];
  voice: "heat" | "monsoon" | "water";
}

export type CaptionParams = Record<string, string | number>;

export type AudioEvent =
  /** L3 turns key + params into English / Bangla caption text. */
  | { kind: "caption"; key: string; params: CaptionParams }
  /** Playhead sync for charts and the map cursor; `time` is on the audio clock. */
  | { kind: "step"; player: string; index: number; total: number; time: number }
  | { kind: "state"; ready: boolean; playing: boolean; ducked: boolean }
  /** One per scheduled rain drop / snow bell (for ripples). `time` is when it sounds on the audio clock; `gain` is 0..1. */
  | { kind: "drop"; voice: "rain" | "snow"; time: number; gain: number; lon: number };

export type AudioEventListener = (event: AudioEvent) => void;
