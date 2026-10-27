// Procedural textures for the deck, drawn once (no downloads): vinyl grooves
// (a normal map), the vinyl's circular brushing (an anisotropy direction map),
// a brushed-metal direction map, and the record's centre label.

import { CanvasTexture, NoColorSpace, SRGBColorSpace } from "three";

const VINYL_SIZE = 2048;
/** Groove spacing on the playing surface (cycles across the radius); a design choice. */
const GROOVES = 420;
/** The label and run-out area, as fractions of the record radius. */
const PLAYING = { inner: 0.36, outer: 0.975 } as const;

function canvasTexture(size: number, draw: (img: ImageData, half: number) => void, srgb = false): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(size, size);
    draw(img, size / 2);
    ctx.putImageData(img, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  return texture;
}

/** Concentric grooves as a tangent-space normal map (the cylinder cap's UVs are planar), with a few wider gaps between tracks. */
export function grooveNormalMap(): CanvasTexture {
  return canvasTexture(VINYL_SIZE, (img, half) => {
    for (let y = 0; y < VINYL_SIZE; y++) {
      for (let x = 0; x < VINYL_SIZE; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const r = Math.hypot(dx, dy);
        const onRecord = r > PLAYING.inner && r < PLAYING.outer;
        const trackGap = Math.abs(((r - PLAYING.inner) * 9) % 1 - 0.5) < 0.012;
        const tilt = onRecord && !trackGap ? 0.22 * Math.sin(r * GROOVES * Math.PI * 2) : 0;
        const nx = r > 0 ? (dx / r) * tilt : 0;
        const ny = r > 0 ? (dy / r) * tilt : 0;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        img.data.set([(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, nz * 255, 255], (y * VINYL_SIZE + x) * 4);
      }
    }
  });
}

/**
 * Anisotropy along the grooves: the direction is tangent to each circle (RG,
 * in [0, 1]), strength in B. Gives vinyl its two sweeping highlights.
 */
export function circularAnisotropyMap(size = 512): CanvasTexture {
  return canvasTexture(size, (img, half) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const r = Math.hypot(dx, dy) || 1;
        const strength = r > PLAYING.inner && r < PLAYING.outer ? 255 : 60;
        img.data.set([(-dy / r) * 127.5 + 127.5, (dx / r) * 127.5 + 127.5, strength, 255], (y * size + x) * 4);
      }
    }
  });
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
}
