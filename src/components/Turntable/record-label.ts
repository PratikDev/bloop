// The record's centre label: its name and frame time, drawn by the browser (so
// Bangla shapes correctly) once the app's fonts have loaded.

import { readPalette } from "@/lib/css-tokens";
import { drawLabel } from "./scene/deck-textures";

export interface RecordLabel {
  title: string;
  subtitle: string;
}

export async function recordLabelCanvas(text: RecordLabel): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const palette = readPalette();
  const font = getComputedStyle(document.documentElement).getPropertyValue("--font-anek").trim() || "sans-serif";
  const canvas = document.createElement("canvas");
  drawLabel(canvas, { ...text, paper: palette.label, ink: palette["label-ink"], accent: palette.amber, font });
  return canvas;
}
