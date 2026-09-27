import { TRACK_VOICES, type LiveVoiceId, type TrackMode } from "@/lib/audio-adapter/types";
import { clampLat, START_CURSOR, wrapLon, type LatLon } from "@/lib/data";
import type { Lang } from "@/lib/i18n";

export type Mode = "explore" | "story" | "thenNow";
export type PanelTab = "truth" | "mapping" | "provenance" | "history";

export interface VoiceMix {
  volume: number; // 0..1
  muted: boolean;
}

export interface AppState {
  started: boolean; // past the Start overlay (with or without sound)
  soundOn: boolean; // false after "Explore without sound", until the user turns it on
  introDone: boolean; // the opening has finished or been skipped
  playing: boolean; // live sound on (Space toggles)
  cursor: LatLon;
  track: TrackMode;
  mode: Mode;
  lang: Lang;
  describe: boolean;
  captions: boolean;
  reduceMotion: boolean;
  builtInVoice: boolean;
  allMuted: boolean;
  solo: LiveVoiceId | null;
  mix: Record<LiveVoiceId, VoiceMix>;
  panel: PanelTab;
  panelOpen: boolean; // the sheet on narrow screens
  helpOpen: boolean;
}

export type AppAction =
  | { type: "start" }
  | { type: "startSilent" }
  | { type: "enableSound" }
  | { type: "introDone" }
  | { type: "setPlaying"; playing: boolean }
  | { type: "moveCursor"; dLat: number; dLon: number }
  | { type: "setCursor"; cursor: LatLon }
  | { type: "setTrack"; track: TrackMode }
  | { type: "setMode"; mode: Mode }
  | { type: "setLang"; lang: Lang }
  | { type: "toggle"; key: "describe" | "captions" | "reduceMotion" | "builtInVoice" | "allMuted" }
  | { type: "setReduceMotion"; on: boolean }
  | { type: "setSolo"; solo: LiveVoiceId | null }
  | { type: "setVoiceMix"; voice: LiveVoiceId; mix: Partial<VoiceMix> }
  | { type: "setPanel"; panel: PanelTab; open?: boolean }
  | { type: "setPanelOpen"; open: boolean }
  | { type: "setHelpOpen"; open: boolean };

const FULL_MIX: VoiceMix = { volume: 1, muted: false };

export const initialState: AppState = {
  started: false,
  soundOn: false,
  introDone: false,
  playing: false,
  cursor: START_CURSOR,
  track: "both",
  mode: "explore",
  lang: "en",
  describe: false,
  captions: true,
  reduceMotion: false,
  builtInVoice: true,
  allMuted: false,
  solo: null,
  mix: { ocean: FULL_MIX, rain: FULL_MIX, snow: FULL_MIX },
  panel: "truth",
  panelOpen: false,
  helpOpen: false,
};

/** Whether a live voice is sounding right now (for rings and captions). */
export function isVoiceAudible(state: AppState, voice: LiveVoiceId): boolean {
  if (!state.started || !state.soundOn || !state.playing || !state.introDone || state.allMuted) return false;
  if (state.mix[voice].muted || state.mix[voice].volume === 0) return false;
  if (state.solo !== null && state.solo !== voice) return false;
  return TRACK_VOICES[state.track].includes(voice);
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "start":
      return { ...state, started: true, soundOn: true, playing: true };
    case "startSilent":
      // Straight to the map: no opening (it is a sound piece), captions carry the values.
      return { ...state, started: true, soundOn: false, playing: false, introDone: true, captions: true };
    case "enableSound":
      return { ...state, soundOn: true, playing: true };
    case "introDone":
      return { ...state, introDone: true };
    case "setPlaying":
      return { ...state, playing: action.playing };
    case "moveCursor":
      return {
        ...state,
        cursor: {
          lat: clampLat(state.cursor.lat + action.dLat),
          lon: wrapLon(state.cursor.lon + action.dLon),
        },
      };
    case "setCursor":
      return { ...state, cursor: { lat: clampLat(action.cursor.lat), lon: wrapLon(action.cursor.lon) } };
    case "setTrack":
      return { ...state, track: action.track };
    case "setMode":
      return { ...state, mode: action.mode };
    case "setLang":
      return { ...state, lang: action.lang };
    case "toggle":
      return { ...state, [action.key]: !state[action.key] };
    case "setReduceMotion":
      return { ...state, reduceMotion: action.on };
    case "setSolo":
      return { ...state, solo: action.solo };
    case "setVoiceMix":
      return { ...state, mix: { ...state.mix, [action.voice]: { ...state.mix[action.voice], ...action.mix } } };
    case "setPanel":
      return { ...state, panel: action.panel, panelOpen: action.open ?? state.panelOpen };
    case "setPanelOpen":
      return { ...state, panelOpen: action.open };
    case "setHelpOpen":
      return { ...state, helpOpen: action.open };
  }
}
