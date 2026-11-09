// Procedural textures for the deck, drawn once (no downloads): the record's
// grooves as flat rings, and its centre label.

import { CanvasTexture, SRGBColorSpace } from "three";

const GROOVE_SIZE = 1024;
/** The playing surface, as fractions of the record's radius. */
const GROOVES = { inner: 0.38, outer: 0.96, step: 0.08 } as const;
const GROOVE_LINE_PX = 3;

/** The record's top face: flat `base` with thin `groove` rings (the cylinder cap's UVs are planar). */
export function grooveTexture(base: string, groove: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = GROOVE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const c = GROOVE_SIZE / 2;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, GROOVE_SIZE, GROOVE_SIZE);
    ctx.strokeStyle = groove;
    ctx.lineWidth = GROOVE_LINE_PX;
    for (let r = GROOVES.inner; r < GROOVES.outer; r += GROOVES.step) {
      ctx.beginPath();
      ctx.arc(c, c, c * r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export interface LabelText {
  title: string;
  subtitle: string;
  /** CSS colours (from the palette). */
  paper: string;
  ink: string;
  accent: string;
  /** The app's text font family (Anek Bangla, so Bangla shapes correctly). */
  font: string;
}

const LABEL_SIZE = 1024;

/** The record's centre label: the record's name and its frame time, in clean type around a spindle hole. */
export function drawLabel(canvas: HTMLCanvasElement, t: LabelText): void {
  canvas.width = canvas.height = LABEL_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const c = LABEL_SIZE / 2;
  ctx.clearRect(0, 0, LABEL_SIZE, LABEL_SIZE);
  ctx.fillStyle = t.paper;
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = t.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${Math.round(LABEL_SIZE * 0.085)}px ${t.font}`;
  ctx.fillText(t.title, c, c * 0.55, LABEL_SIZE * 0.78);
  ctx.font = `300 ${Math.round(LABEL_SIZE * 0.05)}px ${t.font}`;
  ctx.fillText(t.subtitle, c, c * 1.45, LABEL_SIZE * 0.78);
  ctx.fillStyle = t.accent;
  ctx.beginPath();
  ctx.arc(c, c, LABEL_SIZE * 0.03, 0, Math.PI * 2);
  ctx.fill();
  // Off centre, so the record's spin can be seen.
  ctx.beginPath();
  ctx.arc(c + c * 0.72, c, LABEL_SIZE * 0.03, 0, Math.PI * 2);
  ctx.fill();
}
