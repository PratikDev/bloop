// Where the globe may go: the largest free space between the panels over the
// scene. Pure geometry, so it can be tested without a browser.

import type { Rect } from "./LabelLayer";

/** Where the globe's disc goes, in CSS pixels inside the stage. */
export interface GlobeFit {
  cx: number;
  cy: number;
  radius: number;
}

const MARGIN_PX = 24;
/** A smaller globe than this can't be read: it stops shrinking. */
const MIN_RADIUS_PX = 40;
/** A globe narrower than this is too small to read: where the page can scroll, the stage grows to make room. */
const READABLE_DISC_PX = 200;
/** A free space this share of the largest disc's size is as good: the one nearest the stage's middle wins. */
const CENTRED_TOLERANCE = 0.85;

const edges = (size: number, values: number[]) => [...new Set([0, size, ...values.map((v) => Math.min(size, Math.max(0, v)))])].sort((a, b) => a - b);

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Where the disc should go: of the free rectangles that hold a disc nearly as large as the largest possible, the one
 * centred nearest the middle of the stage (the larger area on a tie). Every free rectangle's sides lie on an obstacle's edge or the stage's.
 */
export function largestFreeRect(width: number, height: number, obstacles: Rect[]): Rect {
  const xs = edges(width, obstacles.flatMap((o) => [o.x, o.x + o.w]));
  const ys = edges(height, obstacles.flatMap((o) => [o.y, o.y + o.h]));
  const free: Rect[] = [];
  let bestSide = 0;
  for (let l = 0; l < xs.length - 1; l++) {
    for (let r = l + 1; r < xs.length; r++) {
      for (let t = 0; t < ys.length - 1; t++) {
        for (let b = t + 1; b < ys.length; b++) {
          const rect = { x: xs[l], y: ys[t], w: xs[r] - xs[l], h: ys[b] - ys[t] };
          const side = Math.min(rect.w, rect.h);
          if (side < bestSide * CENTRED_TOLERANCE || obstacles.some((o) => overlaps(rect, o))) continue;
          free.push(rect);
          bestSide = Math.max(bestSide, side);
        }
      }
    }
  }
  const offCentre = (r: Rect) => Math.abs(r.x + r.w / 2 - width / 2);
  let best: Rect = { x: 0, y: 0, w: 0, h: 0 };
  for (const r of free) {
    if (Math.min(r.w, r.h) < bestSide * CENTRED_TOLERANCE) continue;
    const better = best.w === 0 || offCentre(r) < offCentre(best) - 0.5 || (Math.abs(offCentre(r) - offCentre(best)) <= 0.5 && r.w * r.h > best.w * best.h);
    if (better) best = r;
  }
  return best;
}

/**
 * How much taller the free space must be to hold a readable globe and its margin (negative: room to spare).
 * Width can't be helped by growing, so a narrow space asks only for as much height as it is wide.
 */
export function heightShortfall(free: Rect): number {
  return Math.min(READABLE_DISC_PX + 2 * MARGIN_PX, free.w) - free.h;
}

/** The disc centred in a free rectangle, with its margin. */
export function fitDisc(free: Rect): GlobeFit {
  return { cx: free.x + free.w / 2, cy: free.y + free.h / 2, radius: Math.max(MIN_RADIUS_PX, Math.min(free.w, free.h) / 2 - MARGIN_PX) };
}
