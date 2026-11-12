// Forced colours (Windows High Contrast) recolour the page but never a canvas's pixels.
// Canvas and WebGL code reads the system colours here, as hex, and draws its outlines
// and state marks in them, so they stay visible against the system's background.

import { MEDIA } from "./breakpoints";

export interface SystemColors {
  /** CanvasText: outlines and lines. */
  text: string;
  /** Highlight: a state or the place being played. */
  highlight: string;
}

const toHex = (rgb: string): string => {
  const [r = 0, g = 0, b = 0] = (rgb.match(/\d+(\.\d+)?/gu) ?? []).map(Number);
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
};

/** A system colour keyword resolved to "#rrggbb" by the browser. */
function resolve(keyword: "CanvasText" | "Highlight"): string {
  const probe = document.createElement("span");
  probe.style.color = keyword;
  probe.style.display = "none";
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return toHex(rgb);
}

/** The system colours while forced colours are on; null otherwise (draw the design's colours). */
export function forcedColors(): SystemColors | null {
  if (!window.matchMedia(MEDIA.forcedColors).matches) return null;
  return { text: resolve("CanvasText"), highlight: resolve("Highlight") };
}

/** Calls back with the new system colours (or null) when forced colours turn on or off. */
export function onForcedColorsChange(callback: (colors: SystemColors | null) => void): () => void {
  const query = window.matchMedia(MEDIA.forcedColors);
  const changed = () => callback(forcedColors());
  query.addEventListener("change", changed);
  return () => query.removeEventListener("change", changed);
}
