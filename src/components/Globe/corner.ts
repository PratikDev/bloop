// Whether a stage's corner can hold its Pause motion key without touching the globe's disc.
// Pure geometry (the disc is centred: renderer.ts keeps 16 px clear and a 3 px outline inside the canvas).

/** The disc's clear space and outline on each side, in CSS pixels (Globe/renderer.ts). */
const DISC_INSET_PX = 16 + 3;
/** The compact Pause motion key (36 px drawn; a finger's hit area reaches out 4 px more), its inset from the stage's edge, and the least gap it keeps from the disc. */
export const KEY_PX = 36;
const KEY_INSET_PX = 4;
/** On the 224 px square phone stage the corner has room for about 8 px; less than this and the key takes a row under the globe instead. */
const KEY_GAP_PX = 6;

/** The key in the bottom-right corner of a `width` × `height` stage stays this far from the disc's edge. */
export function cornerGap(width: number, height: number, key = KEY_PX): number {
  const radius = Math.min(width, height) / 2 - DISC_INSET_PX;
  const dx = Math.max(0, width - KEY_INSET_PX - key - width / 2);
  const dy = Math.max(0, height - KEY_INSET_PX - key - height / 2);
  return Math.hypot(dx, dy) - radius;
}

export const cornerFree = (width: number, height: number) => cornerGap(width, height) >= KEY_GAP_PX;
