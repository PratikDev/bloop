// Makes any engine that implements L2's API usable by the whole UI, even if it
// lacks L3's requested extras. Missing extras degrade, never break:
// no analyser → flat waveform and events shown on arrival; no per-voice volume →
// mute and solo still work. (playSeries used to have a fallback here; L2 accepted
// it as part of its API on 28 Sep, so it is now required.)

import type { AudioEngine, L2AudioApi, L3AudioExtensions } from "./types";

export function withFallbacks(core: L2AudioApi & Partial<L3AudioExtensions>): AudioEngine {
  return {
    ...core,
    setVoiceVolume: core.setVoiceVolume ?? (() => undefined),
    getAnalyser: core.getAnalyser ?? (() => null),
  };
}
