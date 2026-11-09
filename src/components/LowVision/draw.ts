// Canvas drawing for low-vision mode (accessibility core, step 8; spec 4.1, 4.2): the decoded grid as sharp bands
// (one pixel per cell, drawn without smoothing, so edges never blur), land and no-data, thick coastlines and large
// labels with a halo. Colours are the CSS variables, read when drawing.
import { hexToRgb } from "@/lib/css-tokens";
import type { ValueGrid } from "@/lib/describe/stats";
import { bandIndex } from "@/lib/low-vision/bands";
import { resolveVars } from "@/lib/low-vision/scales";
import type { LvMap } from "./use-lv-map";

type Read = (name: string) => string;

/** No-data rain cells: a sparse diagonal hatch, so "no data" never looks like "dry" (one in this many cells). */
const HATCH_EVERY = 4;
/** Thick coastlines: this many CSS pixels wide (spec 4.2: 2–4 px). */
export const THICK_COAST_PX = 3;

function canvasOf(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")];
}

/** The bands at grid resolution: each cell its band's colour; land (ocean) solid, no-data rain hatched, dry clear. */
export function bandImage(map: LvMap, read: Read): HTMLCanvasElement {
  const { grid, bands, record } = map;
  const [canvas, ctx] = canvasOf(grid.width, grid.height);
  if (!ctx) return canvas;
  const colours = resolveVars(map.vars, read).map(hexToRgb);
  const land = hexToRgb(read("--lv-land"));
  const hatch = hexToRgb(read("--lv-hatch"));
  const img = ctx.createImageData(grid.width, grid.height);
  for (let i = 0; i < grid.width * grid.height; i++) {
    const v = grid.value(i);
    const b = bandIndex(bands, record, v);
    let rgb: [number, number, number] | null = null;
    if (b !== -1) rgb = colours[b];
    else if (v === null) rgb = record === "ocean" ? land : (Math.floor(i / grid.width) + (i % grid.width)) % HATCH_EVERY === 0 ? hatch : null;
    if (rgb) img.data.set([...rgb, 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** The land mask (no ocean value) at grid resolution, filled with one colour. */
export function landMask(grid: ValueGrid, colour: string): HTMLCanvasElement {
  const [canvas, ctx] = canvasOf(grid.width, grid.height);
  if (!ctx) return canvas;
  const [r, g, b] = hexToRgb(colour);
  const img = ctx.createImageData(grid.width, grid.height);
  for (let i = 0; i < grid.width * grid.height; i++) if (grid.value(i) === null) img.data.set([r, g, b, 255], i * 4);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** A grid-resolution image drawn to fill the canvas with sharp edges. */
export function drawSharp(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number): void {
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  ctx.imageSmoothingEnabled = smooth;
}

/** Thick coastlines: the coast-coloured mask drawn around itself, then the land on top, leaving a ring of `px`. */
export function drawThickCoast(ctx: CanvasRenderingContext2D, coast: HTMLCanvasElement, land: HTMLCanvasElement | null, w: number, h: number, px = THICK_COAST_PX): void {
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    ctx.save();
    ctx.translate(Math.round(Math.cos(ang) * px), Math.round(Math.sin(ang) * px));
    drawSharp(ctx, coast, w, h);
    ctx.restore();
  }
  if (land) drawSharp(ctx, land, w, h);
}

/** Label text at 100% text size, in CSS pixels; it grows with the text-size setting up to MAX_LABEL_PX. */
const LABEL_PX = 18;
const MAX_LABEL_PX = 44;
const PCT = 100;

/** The size of the map's and the lens's labels at this text size (percent). */
export const labelPx = (textScale: number) => Math.min(MAX_LABEL_PX, Math.round((LABEL_PX * textScale) / PCT));

export interface MapLabel {
  x: number;
  y: number;
  text: string;
  /** Text colour; the halo is the other of black and white, or `halo`. */
  fill: string;
  halo: string;
}

/** Large labels with a halo wide enough to read on any band (spec 4.2: large numbers in the bands' centres). */
export function drawLabels(ctx: CanvasRenderingContext2D, labels: readonly MapLabel[], px: number, family: string): void {
  ctx.font = `700 ${px}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, px / 4);
  for (const l of labels) {
    ctx.strokeStyle = l.halo;
    ctx.strokeText(l.text, l.x, l.y);
    ctx.fillStyle = l.fill;
    ctx.fillText(l.text, l.x, l.y);
  }
}
