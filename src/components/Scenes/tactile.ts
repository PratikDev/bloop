// Tactile record (book 3D-4): a printable disc whose ridge height follows a
// series around the circle, with raised ticks every ten years and an embossed
// label (dataset, years). Built client-side and saved as binary STL. Missing
// values stay flat (no ridge): silence on the record, too.

import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial } from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";

/** Physical layout in millimetres (stated in the file name). */
export const DISC = { radius: 60, hole: 4, base: 2, ridgeMax: 4, ridgeMin: 0.4, tick: 1.2, emboss: 0.6 } as const;
const SEGMENTS = { around: 720, radial: 112 } as const;
const LABEL = { inner: 10, outer: 26, px: 4 } as const; // label band (mm) and canvas pixels per mm

export interface TactileTrack {
  /** One value per step, oldest first (null = missing). */
  values: readonly (number | null)[];
  /** Ring band in mm. */
  inner: number;
  outer: number;
}

export interface TactileRecord {
  tracks: TactileTrack[];
  /** The series' shared fixed range: min → ridgeMin, max → ridgeMax. */
  range: { min: number; max: number };
  /** Fraction of the circle (0..1) where each tick sits (every ten years). */
  ticks: number[];
  label: string;
}

/** The label as a bitmap mask (true = raised), drawn with the page's own font. */
function labelMask(text: string): (x: number, y: number) => boolean {
  const w = LABEL.outer * 2 * LABEL.px;
  const h = (LABEL.outer - LABEL.inner) * LABEL.px;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return () => false;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = text.split("\n");
  const size = Math.floor(h / (lines.length + 0.6));
  ctx.font = `bold ${size}px ${getComputedStyle(document.body).fontFamily}`;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, (h / lines.length) * (i + 0.5), w - 8));
  const data = ctx.getImageData(0, 0, w, h).data;
  // (x, y) in mm from the centre; the label sits above the hole, left to right.
  return (x, y) => {
    const px = Math.floor((x + LABEL.outer) * LABEL.px);
    const py = Math.floor((LABEL.outer - y) * LABEL.px);
    if (px < 0 || py < 0 || px >= w || py >= h) return false;
    return data[(py * w + px) * 4] > 127;
  };
}

function heightAt(rec: TactileRecord, mask: (x: number, y: number) => boolean, angle: number, r: number): number {
  let z = DISC.base;
  const around = angle / (Math.PI * 2);
  for (const t of rec.tracks) {
    if (r < t.inner || r > t.outer) continue;
    const v = t.values[Math.min(t.values.length - 1, Math.floor(around * t.values.length))];
    if (v === null || v === undefined) continue;
    const k = Math.min(1, Math.max(0, (v - rec.range.min) / (rec.range.max - rec.range.min)));
    z += DISC.ridgeMin + k * (DISC.ridgeMax - DISC.ridgeMin);
  }
  const outerTrack = Math.max(...rec.tracks.map((t) => t.outer));
  if (r > outerTrack + 1 && r < outerTrack + 5 && rec.ticks.some((f) => Math.abs(f - around) * Math.PI * 2 * r < 0.6)) z += DISC.tick;
  // Clockwise from 12 o'clock (like the tunnel's bead clock): x = r sin, y = r cos.
  if (mask(r * Math.sin(angle), r * Math.cos(angle))) z += DISC.emboss;
  return z;
}

/** A closed (watertight) disc mesh: top surface on a polar grid, flat bottom, inner and outer walls. */
export function tactileMesh(rec: TactileRecord): Mesh {
  const mask = labelMask(rec.label);
  const { around: A, radial: R } = SEGMENTS;
  const radius = (j: number) => DISC.hole + (j / R) * (DISC.radius - DISC.hole);
  const top: number[] = [];
  for (let i = 0; i < A; i++) {
    const a = (i / A) * Math.PI * 2;
    for (let j = 0; j <= R; j++) {
      const r = radius(j);
      top.push(r * Math.sin(a), r * Math.cos(a), heightAt(rec, mask, a, r));
    }
  }
  const nTop = top.length / 3;
  const bottom: number[] = [];
  for (let i = 0; i < A; i++) {
    const a = (i / A) * Math.PI * 2;
    for (const r of [DISC.hole, DISC.radius]) bottom.push(r * Math.sin(a), r * Math.cos(a), 0);
  }
  const positions = new Float32Array([...top, ...bottom]);
  const T = (i: number, j: number) => (i % A) * (R + 1) + j;
  const B = (i: number, outer: 0 | 1) => nTop + (i % A) * 2 + outer;
  const index: number[] = [];
  for (let i = 0; i < A; i++) {
    for (let j = 0; j < R; j++) index.push(T(i, j), T(i, j + 1), T(i + 1, j), T(i + 1, j), T(i, j + 1), T(i + 1, j + 1));
    index.push(B(i, 0), B(i + 1, 0), B(i, 1), B(i + 1, 0), B(i + 1, 1), B(i, 1)); // bottom
    index.push(T(i, R), B(i, 1), T(i + 1, R), T(i + 1, R), B(i, 1), B(i + 1, 1)); // outer wall
    index.push(T(i, 0), T(i + 1, 0), B(i, 0), T(i + 1, 0), B(i + 1, 0), B(i, 0)); // inner wall
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(index);
  return new Mesh(geometry, new MeshBasicMaterial());
}

/** Builds the disc and hands the browser a binary STL to save. */
export function downloadTactileRecord(rec: TactileRecord, fileName: string): void {
  const mesh = tactileMesh(rec);
  const data = new STLExporter().parse(mesh, { binary: true });
  mesh.geometry.dispose();
  (mesh.material as MeshBasicMaterial).dispose();
  const url = URL.createObjectURL(new Blob([data], { type: "model/stl" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The scale, for the file name: "disc-120mm_ridge-0.4-4mm-for--70-35cm". */
export const scaleTag = (range: { min: number; max: number }, unit: string) =>
  `disc-${DISC.radius * 2}mm_ridge-${DISC.ridgeMin}-${DISC.ridgeMax}mm-for-${range.min}-${range.max}${unit}`;
