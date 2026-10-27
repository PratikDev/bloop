// Procedural textures for the deck: vinyl grooves (a normal map), a soft
// contact shadow and the studio backdrop. Drawn once, no downloads.

import { CanvasTexture, NoColorSpace, SRGBColorSpace } from "three";
import { hexToRgb } from "@/lib/css-tokens";

const GROOVE_SIZE = 1024;
const GROOVES = 140;

/** Concentric grooves as a tangent-space normal map (the cylinder cap's UVs are planar). */
export function grooveNormalMap(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = GROOVE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(GROOVE_SIZE, GROOVE_SIZE);
    const half = GROOVE_SIZE / 2;
    for (let y = 0; y < GROOVE_SIZE; y++) {
      for (let x = 0; x < GROOVE_SIZE; x++) {
        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const r = Math.hypot(dx, dy);
        // Grooves only on the playing surface, between the label and the rim.
        const tilt = r > 0.36 && r < 0.97 ? 0.35 * Math.cos(r * GROOVES * Math.PI) : 0;
        const nx = r > 0 ? (dx / r) * tilt : 0;
        const ny = r > 0 ? (dy / r) * tilt : 0;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        img.data.set([(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, nz * 255, 255], (y * GROOVE_SIZE + x) * 4);
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  return texture;
}

/** A radial dark-to-clear gradient for soft contact shadows. */
export function shadowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(0,0,0,0.75)");
    g.addColorStop(0.55, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new CanvasTexture(canvas);
}

/** The warm dark studio behind the turntable: a vertical gradient, used as the scene background. */
export function studioBackdrop(top: string, bottom: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    const [r1, g1, b1] = hexToRgb(top);
    const [r2, g2, b2] = hexToRgb(bottom);
    g.addColorStop(0, `rgb(${r1},${g1},${b1})`);
    g.addColorStop(1, `rgb(${r2},${g2},${b2})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
