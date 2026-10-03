// Equirectangular map ↔ screen: x = (lon + 180) / 360 · width, y = (90 − lat) / 180 · height.

import type { LatLon } from "@/lib/data";
import { BENGALI_DIGITS } from "@/lib/i18n/format";

export function toXY(p: LatLon, width: number, height: number): { x: number; y: number } {
  return { x: ((p.lon + 180) / 360) * width, y: ((90 - p.lat) / 180) * height };
}

export function toLatLon(x: number, y: number, width: number, height: number): LatLon {
  return { lat: 90 - (y / height) * 180, lon: (x / width) * 360 - 180 };
}

/** Pixels per degree, horizontally and vertically. */
export function pxPerDeg(width: number, height: number): { x: number; y: number } {
  return { x: width / 360, y: height / 180 };
}

export type CoordAxis = "lat" | "lon";

const LIMIT: Record<CoordAxis, number> = { lat: 90, lon: 180 };
/** Hemisphere letters: positive, then negative. */
const HEMISPHERE: Record<CoordAxis, [string, string]> = { lat: ["N", "S"], lon: ["E", "W"] };
/** The hemisphere words the Bangla readout shows, so a copied place can be pasted back. */
const BANGLA_HEMISPHERE = /উত্তর|দক্ষিণ|পূর্ব|পশ্চিম/g;
const BANGLA_LETTER: Record<string, string> = { উত্তর: "N", দক্ষিণ: "S", পূর্ব: "E", পশ্চিম: "W" };

/** Bengali digits and hemisphere words as ASCII, any minus sign as "-", no degree signs or spaces, upper case. */
function normalise(text: string): string {
  return [...text.trim().replace(BANGLA_HEMISPHERE, (word) => BANGLA_LETTER[word])]
    .map((ch) => {
      const d = BENGALI_DIGITS.indexOf(ch);
      return d >= 0 ? String(d) : ch === "−" || ch === "–" ? "-" : ch;
    })
    .join("")
    .replace(/[°º\s]/g, "")
    .toUpperCase();
}

/**
 * One coordinate as people write it: "23.8", "-23.8", "23.8 S", "23.8°S" or
 * "S23.8" (a letter and a minus sign together are refused). null if it isn't
 * one, or is outside -90..90 (lat) or -180..180 (lon).
 */
export function parseCoordinate(text: string, axis: CoordAxis): number | null {
  const s = normalise(text);
  const [pos, neg] = HEMISPHERE[axis];
  const m = /^([A-Z]?)(-?\d+(?:\.\d+)?|-?\.\d+)([A-Z]?)$/.exec(s);
  if (!m || (m[1] && m[3])) return null;
  const letter = m[1] || m[3];
  if (letter && letter !== pos && letter !== neg) return null;
  const n = Number(m[2]);
  if (letter && n < 0) return null;
  const value = letter === neg ? -n : n;
  return Number.isFinite(value) && Math.abs(value) <= LIMIT[axis] ? value : null;
}

/** Both coordinates in one piece of text, latitude first: "23.8, 90.4" or "21.5° N, 89.8° E". */
export function parseLatLon(text: string): LatLon | null {
  const parts = text.split(/[,;]/);
  if (parts.length !== 2) return null;
  const lat = parseCoordinate(parts[0], "lat");
  const lon = parseCoordinate(parts[1], "lon");
  return lat === null || lon === null ? null : { lat, lon };
}
