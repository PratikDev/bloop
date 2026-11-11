// Where the Context Lens sits: following the needle, in a corner of the screen
// the user picked, or docked in the page under the map.
import type { LensPlace } from "@/lib/low-vision/settings";
import { dockHeight } from "../Dock/use-dock-height";

/** Space between the needle and a following lens (px). */
const GAP = 28;
const EDGE = 8;

export interface Box {
  left: number;
  top: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The lens width: the chosen size, but never wider than the screen (reflow at 320 px). */
export const fitSize = (size: number) => Math.min(size, window.innerWidth - 2 * EDGE);

/** The page slot under the map (Listen) that the docked lens sits in. */
export const LENS_DOCK_ID = "lv-lens-dock";

type Floating = Exclude<LensPlace, "docked">;

/**
 * Where a floating lens goes: in the corner of the screen the user picked (the bottom ones above the sound dock), or
 * following the needle: beside it, on whichever side has room; on a narrow screen (no room either side), under or
 * over it instead, so the needle stays in sight. Always kept on screen.
 */
export function place(where: Floating, map: DOMRect, needle: { x: number; y: number }, size: number, height: number): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const right = vw - size - EDGE;
  const bottom = Math.max(EDGE, vh - dockHeight() - EDGE - height);
  if (where === "topLeft") return { left: EDGE, top: EDGE };
  if (where === "topRight") return { left: right, top: EDGE };
  if (where === "bottomLeft") return { left: EDGE, top: bottom };
  if (where === "bottomRight") return { left: right, top: bottom };
  const x = map.left + needle.x;
  const y = map.top + needle.y;
  if (x + GAP + size <= vw - EDGE) return { left: x + GAP, top: clamp(y - height / 2, EDGE, vh - height - EDGE) };
  if (x - GAP - size >= EDGE) return { left: x - GAP - size, top: clamp(y - height / 2, EDGE, vh - height - EDGE) };
  const left = clamp(x - size / 2, EDGE, vw - size - EDGE);
  const below = y + GAP;
  return { left, top: below + height <= vh - EDGE ? below : Math.max(EDGE, y - GAP - height) };
}
