"use client";

import { useEffect, useRef } from "react";
import { latLonToSphere } from "@/lib/sphere";
import { GRATICULE_LATS } from "./scene/overlays";
import { JUKEBOX_DISTANCE, type LabelCandidate, type LabelKind } from "./labels";
import type { FrameInfo, Turntable } from "./use-turntable";

const MAX_LABELS = 6;
const MIN_FACING = 0.45; // hide names close to the globe's edge
/** A name must sit fully inside this share of the globe's on-screen radius, or it isn't drawn. */
const DISC_INSET = 0.96;
const GAP_PX = 4;
const DOT_OFFSET_PX = 7;

/** Sentence case and small, on a paper pill (globe-label); countries heavier. */
const KIND_CLASS: Record<LabelKind, string> = {
  story: "",
  capital: "",
  city: "",
  country: "font-semibold tracking-wide",
  // Seas are upright like everything else; the muted colour and wider spacing tell them from countries.
  sea: "tracking-sea text-haze",
  district: "",
};
const DOT_KINDS: ReadonlySet<LabelKind> = new Set(["story", "capital", "city"]);
/** globe-label: 14 px font, 18 px line; tracking-wide (0.025em per letter) on country names, tracking-sea (0.04em) on seas. */
const FONT_PX = 14;
const LINE_PX = 18;
/** The pill around each name: 5 px padding and a 1.5 px border on each side. */
const PILL_WIDTH_PX = 13;
const PILL_HEIGHT_PX = 3;
const TRACKING_EM: Partial<Record<LabelKind, number>> = { country: 0.025, sea: 0.04 };
/** Labels are re-placed at most this often (ms), and less often on slow devices (3 × the frame time). */
const MIN_UPDATE_MS = 33;
const MAX_UPDATE_MS = 120;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The globe's outline on screen: centred on the point facing the camera, out to a point on the horizon. */
function globeDisc(f: FrameInfo, horizon: number): { x: number; y: number; r: number } {
  const centre = f.project(f.viewLat, f.viewLon);
  const lat = f.viewLat + (Math.acos(Math.min(1, horizon)) * 180) / Math.PI;
  const edge = lat > 90 ? f.project(180 - lat, f.viewLon + 180) : f.project(lat, f.viewLon);
  return { x: centre.x, y: centre.y, r: Math.hypot(edge.x - centre.x, edge.y - centre.y) };
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w + GAP_PX && b.x < a.x + a.w + GAP_PX && a.y < b.y + b.h + GAP_PX && b.y < a.y + a.h + GAP_PX;

export interface GraticuleLabel {
  lat: number;
  text: string;
}

/** Where each shown label's anchor (its dot, or its centre) is, for the debug accuracy check. */
export type PlacedLabels = Map<string, { x: number; y: number; lat: number; lon: number }>;

/**
 * Place names on the globe as HTML text (real text shaping for Bangla, any size,
 * crisp), positioned each frame, most important first. A name is drawn whole or
 * not at all: one that would collide or reach the globe's edge is hidden.
 * Visual only: "Where am I?" gives screen-reader users the same information.
 */
export function LabelLayer({
  subscribe,
  candidates,
  graticule,
  reserved,
  placedRef,
}: {
  subscribe: Turntable["subscribe"];
  candidates: LabelCandidate[];
  graticule: GraticuleLabel[] | null;
  /** Areas labels must keep clear of (the readout card), updated by their owners each frame. */
  reserved: { current: Rect[] };
  placedRef?: { current: PlacedLabels };
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    type Entry = { el: HTMLSpanElement; w: number; h: number; transform: string };
    const els = new Map<string, Entry>();
    // Unit vectors of every candidate, so ones beyond the horizon are skipped before projecting.
    const units = candidates.map((c) => latLonToSphere(c.lat, c.lon));
    let visible = new Set<string>();
    let lastPlaced = Number.NEGATIVE_INFINITY;
    let lastFrame = performance.now();
    let frameMs = 16;

    // Label widths come from canvas text metrics in the page's own font: no layout reads in the loop.
    const measure = document.createElement("canvas").getContext("2d");
    const family = getComputedStyle(host).fontFamily;
    const textWidth = (text: string, kind: LabelKind) => {
      if (!measure) return text.length * 9;
      measure.font = `${kind === "country" ? 600 : 400} ${FONT_PX}px ${family}`;
      return Math.ceil(measure.measureText(text).width + (TRACKING_EM[kind] ?? 0) * FONT_PX * text.length) + PILL_WIDTH_PX + 2;
    };

    const element = (key: string, text: string, lang: string, kind: LabelKind, dot: boolean): Entry => {
      const existing = els.get(key);
      if (existing) return existing;
      const el = document.createElement("span");
      el.className = `globe-label absolute top-0 left-0 whitespace-nowrap leading-[18px] ${KIND_CLASS[kind]}`;
      el.lang = lang;
      el.textContent = text;
      el.hidden = true;
      if (dot) {
        const d = document.createElement("span");
        d.className = "absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-moon ring-1 ring-ink";
        el.prepend(d);
      }
      host.append(el);
      const entry = { el, w: textWidth(text, kind), h: LINE_PX + PILL_HEIGHT_PX, transform: "" };
      els.set(key, entry);
      return entry;
    };

    const place = (f: FrameInfo) => {
      const distance = f.blend < 0.5 ? JUKEBOX_DISTANCE : f.distance;
      const view = latLonToSphere(f.viewLat, f.viewLon);
      const horizon = 1 / distance; // cosine of the visible cap's angular radius
      const disc = globeDisc(f, horizon);
      const insideDisc = (r: Rect) =>
        [r.x, r.x + r.w].every((x) => [r.y, r.y + r.h].every((y) => Math.hypot(x - disc.x, y - disc.y) <= disc.r * DISC_INSET));
      const placed: Rect[] = [];
      const shown = new Set<string>();
      const anchors: PlacedLabels = new Map();
      const tryPlace = (key: string, x: number, y: number, entry: Entry, dot: boolean, lat: number, lon: number) => {
        const sides = dot
          ? [
              // The 6 px dot's centre sits on the anchor, with the name to its right, or else its left.
              { x: x + DOT_OFFSET_PX, dotLeft: -DOT_OFFSET_PX - 3 },
              { x: x - DOT_OFFSET_PX - entry.w, dotLeft: entry.w + DOT_OFFSET_PX - 3 },
            ]
          : [{ x: x - entry.w / 2, dotLeft: 0 }];
        for (const side of sides) {
          const rect = { x: side.x, y: y - entry.h / 2, w: entry.w, h: entry.h };
          if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > f.width || rect.y + rect.h > f.height) continue;
          if (!insideDisc(rect)) continue;
          if (placed.some((p) => overlaps(p, rect))) continue;
          placed.push(rect);
          shown.add(key);
          anchors.set(key, { x, y, lat, lon });
          const transform = `translate(${Math.round(rect.x)}px, ${Math.round(rect.y)}px)`;
          if (transform !== entry.transform) {
            entry.el.style.transform = transform;
            entry.transform = transform;
            if (dot) (entry.el.firstElementChild as HTMLElement).style.left = `${side.dotLeft}px`;
          }
          if (entry.el.hidden) entry.el.hidden = false;
          return;
        }
      };

      // The needle's own spot stays clear for the crosshair, and the readout card's area too.
      placed.push({ x: f.needle.x - 24, y: f.needle.y - 24, w: 48, h: 48 }, ...reserved.current);

      for (let i = 0; i < candidates.length && shown.size < MAX_LABELS; i++) {
        const c = candidates[i];
        if (distance > c.maxDistance || distance < c.minDistance) continue;
        const u = units[i];
        if (u.x * view.x + u.y * view.y + u.z * view.z < horizon + 0.1) continue;
        const p = f.project(c.lat, c.lon);
        if (p.facing < MIN_FACING) continue;
        const dot = DOT_KINDS.has(c.kind);
        tryPlace(c.key, p.x, p.y, element(c.key, c.text, c.lang, c.kind, dot), dot, c.lat, c.lon);
      }
      if (graticule) {
        for (const g of graticule) {
          if (shown.size >= MAX_LABELS) break;
          const key = `grat:${g.lat}`;
          const p = f.project(g.lat, f.viewLon + 18);
          if (p.facing < MIN_FACING) continue;
          tryPlace(key, p.x, p.y, element(key, g.text, document.documentElement.lang, "district", false), false, g.lat, f.viewLon + 18);
        }
      }
      // Only labels that changed state are touched (hidden ones stay untouched).
      for (const key of visible) if (!shown.has(key)) els.get(key)?.el.setAttribute("hidden", "");
      visible = shown;
      if (placedRef) placedRef.current = anchors;
    };

    const unsubscribe = subscribe((f) => {
      const now = performance.now();
      frameMs = frameMs * 0.9 + (now - lastFrame) * 0.1;
      lastFrame = now;
      if (now - lastPlaced < Math.min(MAX_UPDATE_MS, Math.max(MIN_UPDATE_MS, 3 * frameMs))) return;
      lastPlaced = now;
      place(f);
    });
    return () => {
      unsubscribe();
      host.replaceChildren();
    };
  }, [subscribe, candidates, graticule, reserved, placedRef]);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-moon" />;
}

/** The graticule's named lines (equator and tropics) and the 30° / 60° lines. */
export function graticuleLabels(names: { equator: string; cancer: string; capricorn: string }, latText: (lat: number) => string): GraticuleLabel[] {
  return GRATICULE_LATS.map((lat) => ({
    lat,
    text: lat === 0 ? names.equator : lat > 23 && lat < 24 ? names.cancer : lat < -23 && lat > -24 ? names.capricorn : latText(lat),
  }));
}
