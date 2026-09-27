// The public audio API (docs/L2/AUDIO_API.md). This is the ONLY module other
// lanes import: `import { ensureAudio, setOcean } from "@/lib/audio"`.
// Everything takes plain numbers; nothing here fetches.

import { startEngine } from "./context";
import { applyMixer } from "./mixer";

export type * from "./types";
export { LIVE_VOICES, TRACK_VOICES, VOICE_IDS } from "./types";

/** Must be called inside a click / keydown handler (e.g. the Start button). */
export async function ensureAudio(): Promise<void> {
  await startEngine();
  applyMixer(); // mixer changes made before Start take effect now
}

export { getAnalyser, isAudioReady } from "./context";
export { onAudioEvent } from "./events";
export { stopAll } from "./stop";
export { setAllMuted, setMasterVolume, setSolo, setTrackMode, setVoiceMuted, setVoiceVolume } from "./mixer";
export { setOcean, setRain, silenceLive } from "./live";
export { speak } from "./speech";
export { playEarcon } from "./earcons";
export { playLegend, playLegendForMode } from "./players/legend";
export { playWarmup } from "./players/warmup";
export { playSweep } from "./players/sweep";
export { playMotif } from "./players/motif";
export { playOpening } from "./players/opening";

// Later phases (typed placeholders until built)
export {
  playClip,
  playCompare,
  playThenNow,
  playTimelapse,
  preloadClips,
} from "./stubs";
