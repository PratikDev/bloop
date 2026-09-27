// Typed placeholders for API functions of later phases (docs/L2/BUILD_PLAN.md).
// They have their final signatures, so L3 can wire the whole UI now; calling
// one logs which phase implements it and does nothing. Move each function out
// of this file when its phase is built.

function warn(name: string, phase: number) {
  console.warn(`audio: ${name}() is not implemented yet (Phase ${phase}).`);
}

const resolved = (name: string, phase: number) => () => {
  warn(name, phase);
  return Promise.resolve();
};

// Phase 8 — recorded narration
export const preloadClips: (urls: string[]) => Promise<void> = resolved("preloadClips", 8);
export const playClip: (url: string) => Promise<void> = resolved("playClip", 8);
