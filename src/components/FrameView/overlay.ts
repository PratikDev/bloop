// The animated layer: cursor, sound rings and the sweep ring. Pure drawing;
// timing comes from the audio clock (AudioContext.currentTime), never a timer.

import type { Palette } from "@/lib/css-tokens";

export interface Ring {
  t0: number; // audio time the ring starts
  life: number; // seconds
  r0: number; // px
  speed: number; // px per second
  alpha: number; // peak opacity
}

const CURSOR_RADIUS = 11;
const ACCENT_WIDTH = 2;
const OUTLINE_WIDTH = 1.5;

/** A shapla stroke with an ink outline on both sides, so it shows on any colormap (design-plan §2.2). */
function strokeOutlined(ctx: CanvasRenderingContext2D, palette: Palette, alpha: number, accentWidth = ACCENT_WIDTH) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = accentWidth + OUTLINE_WIDTH * 2;
  ctx.stroke();
  ctx.strokeStyle = palette.shapla;
  ctx.lineWidth = accentWidth;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawCursor(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, CURSOR_RADIUS, 0, Math.PI * 2);
  strokeOutlined(ctx, palette, 1);
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fillStyle = palette.ink;
  ctx.fill();
}

/** Draws live rings and returns the ones still alive. */
export function drawRings(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  rings: Ring[],
  now: number,
  x: number,
  y: number,
): Ring[] {
  const alive: Ring[] = [];
  for (const ring of rings) {
    const age = now - ring.t0;
    if (age > ring.life) continue;
    alive.push(ring);
    if (age < 0) continue; // scheduled a little ahead; not sounding yet
    const fade = 1 - age / ring.life;
    ctx.beginPath();
    ctx.arc(x, y, CURSOR_RADIUS + ring.r0 + ring.speed * age, 0, Math.PI * 2);
    strokeOutlined(ctx, palette, ring.alpha * fade, 1.5);
  }
  return alive;
}

/** Reduced motion: one still ring whose size shows the value (0..1). */
export function drawStaticRing(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number, t: number) {
  ctx.beginPath();
  ctx.arc(x, y, CURSOR_RADIUS + 6 + 22 * t, 0, Math.PI * 2);
  strokeOutlined(ctx, palette, 0.9, 1.5);
}

/** The sweep ring: an ellipse on the map that is a circle on the globe. */
export function drawSweepRing(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  x: number,
  y: number,
  rx: number,
  ry: number,
  alpha: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  strokeOutlined(ctx, palette, alpha);
}

export function drawSweepDot(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  strokeOutlined(ctx, palette, 1);
}
