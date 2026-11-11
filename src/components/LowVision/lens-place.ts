import type { LensPlace } from "@/lib/low-vision/settings";
import { dockHeight } from "../Dock/use-dock-height";

const GAP = 28;
const EDGE = 8;

export interface Box {
  left: number;
  top: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const fitSize = (size: number) => Math.min(size, window.innerWidth - 2 * EDGE);

export const LENS_DOCK_ID = "lv-lens-dock";

type Floating = Exclude<LensPlace, "docked">;

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
