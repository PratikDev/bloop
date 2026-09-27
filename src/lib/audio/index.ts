// The public audio API (docs/L2/AUDIO_API.md). This is the ONLY module other
// lanes import: `import { ensureAudio, setOcean } from "@/lib/audio"`.
// Everything takes plain numbers; nothing here fetches.

import { startEngine } from "./context";
import { applyMixer } from "./mixer";

export type * from "./types";
export { VOICE_IDS } from "./types";

/** Must be called inside a click / keydown handler (e.g. the Start button). */
export async function ensureAudio(): Promise<void> {
  await startEngine();
  applyMixer(); // mixer changes made before Start take effect now
}

export { isAudioReady } from "./context";
export { onAudioEvent } from "./events";
export { stopAll } from "./stop";
export { setAllMuted, setMasterVolume, setSolo, setVoiceMuted } from "./mixer";

// Later phases (typed placeholders until built)
export {
  playClip,
  playCompare,
  playEarcon,
  playLegend,
  playLegendForMode,
  playMotif,
  playOpening,
  playSweep,
  playThenNow,
  playTimelapse,
  playWarmup,
  preloadClips,
  setOcean,
  setRain,
  setTrackMode,
  silenceLive,
  speak,
} from "./stubs";
