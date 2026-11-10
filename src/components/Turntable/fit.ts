// Where the globe and the turntable go: the largest pair that fits between the
// panels over the scene. Pure geometry, so it can be tested without a browser.

import type { Rect } from "./LabelLayer";

/** Where the globe's disc goes, in CSS pixels inside the stage. */
export interface GlobeFit {
  cx: number;
  cy: number;
  radius: number;
}

/** The space kept clear between the globe (or the turntable) and any panel. */
export const MARGIN_PX = 24;
/** A smaller globe than this can't be read: it stops shrinking. */
const MIN_RADIUS_PX = 40;
/** A globe narrower than this is too small to read: where the page can scroll, the stage grows to make room. */
const READABLE_DISC_PX = 200;

const edges = (size: number, values: number[]) => [...new Set([0, size, ...values.map((v) => Math.min(size, Math.max(0, v)))])].sort((a, b) => a - b);

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** The stage grows in these steps, and never by more than this. */
const GROWTH_STEP_PX = 16;
const MAX_GROWTH_PX = 960;



/** The turntable's box on screen relative to the globe's diameter (its canvas frames the whole deck). */
export const DECK_BOX = { width: 1.15, height: 0.95 } as const;
/** The least gap between the globe and the turntable. */
export const PAIR_GAP_PX = 32;

export type PairMode = "side" | "stacked";

/** The globe and the turntable laid out in the free space: where each goes, in CSS pixels inside the stage. */
export interface PairLayout {
  globe: GlobeFit;
  deck: Rect;
}

/** Every free rectangle whose sides lie on an obstacle's edge or the stage's (the candidates for the pair). */
function freeRects(width: number, height: number, obstacles: Rect[]): Rect[] {
  const xs = edges(width, obstacles.flatMap((o) => [o.x, o.x + o.w]));
  const ys = edges(height, obstacles.flatMap((o) => [o.y, o.y + o.h]));
  const out: Rect[] = [];
  for (let l = 0; l < xs.length - 1; l++)
    for (let r = l + 1; r < xs.length; r++)
      for (let t = 0; t < ys.length - 1; t++)
        for (let b = t + 1; b < ys.length; b++) {
          const rect = { x: xs[l], y: ys[t], w: xs[r] - xs[l], h: ys[b] - ys[t] };
          if (!obstacles.some((o) => overlaps(rect, o))) out.push(rect);
        }
  return out;
}

const stackedDeckHeight = (stageWidth: number) => (stageWidth * DECK_BOX.height) / DECK_BOX.width;

/** The globe's diameter that fits the pair in `r` (side by side: the turntable to the right; stacked: below). */
function pairDiameter(r: Rect, mode: PairMode, stageWidth: number): number {
  const w = r.w - 2 * MARGIN_PX;
  const h = r.h - 2 * MARGIN_PX;
  // Stacked, the turntable takes the stage's full width (a phone's record needs it; its canvas has clear margins) and
  // the globe the height above it.
  return mode === "side"
    ? Math.min(h, h / DECK_BOX.height, (w - PAIR_GAP_PX) / (1 + DECK_BOX.width))
    : Math.min(w, h - PAIR_GAP_PX - stackedDeckHeight(stageWidth));
}

/**
 * The stacked pair's growth: how much taller a narrow stage must be for a readable globe (200 px, or the width) above
 * the turntable. Panels nearer the bottom move down as it grows; the others stay.
 */
export function pairGrowth(width: number, height: number, panels: Rect[], mode: PairMode = "stacked"): number {
  const wanted = Math.min(READABLE_DISC_PX, width - 2 * MARGIN_PX);
  const anchoredLow = panels.map((p) => height - (p.y + p.h) < p.y);
  for (let extra = 0; extra <= MAX_GROWTH_PX; extra += GROWTH_STEP_PX) {
    const moved = panels.map((p, i) => (anchoredLow[i] ? { ...p, y: p.y + extra } : p));
    if (2 * layoutPair(width, height + extra, moved, mode).globe.radius >= wanted - 0.5) return extra;
  }
  return MAX_GROWTH_PX;
}

/**
 * Lays out the globe and the turntable in the free space: the largest pair that fits any free rectangle (the one nearest
 * the stage's middle on a near tie), centred in it. Side by side from 1024 px, the Earth left; stacked below that,
 * with the turntable across the free space's full width.
 */
export function layoutPair(width: number, height: number, obstacles: Rect[], mode: PairMode): PairLayout {
  let best: { r: Rect; d: number } | null = null;
  const offCentre = (r: Rect) => Math.abs(r.x + r.w / 2 - width / 2) + Math.abs(r.y + r.h / 2 - height / 2);
  for (const r of freeRects(width, height, obstacles)) {
    const d = pairDiameter(r, mode, width);
    if (!best || d > best.d + 0.5 || (Math.abs(d - best.d) <= 0.5 && offCentre(r) < offCentre(best.r))) best = { r, d };
  }
  const r = best?.r ?? { x: 0, y: 0, w: width, h: height };
  const d = Math.max(2 * MIN_RADIUS_PX, best?.d ?? 0);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (mode === "side") {
    const deckW = DECK_BOX.width * d;
    const deckH = DECK_BOX.height * d;
    const left = cx - (d + PAIR_GAP_PX + deckW) / 2;
    return {
      globe: { cx: left + d / 2, cy, radius: d / 2 },
      deck: { x: left + d + PAIR_GAP_PX, y: cy - deckH / 2, w: deckW, h: deckH },
    };
  }
  const stackedH = stackedDeckHeight(width);
  const top = cy - (d + PAIR_GAP_PX + stackedH) / 2;
  return {
    globe: { cx, cy: top + d / 2, radius: d / 2 },
    deck: { x: 0, y: top + d + PAIR_GAP_PX, w: width, h: stackedH },
  };
}
