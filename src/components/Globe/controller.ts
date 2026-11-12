// The globe's loop, on the shared ticker: the slow turn or the ease to a focus,
// drag and inertia, the ring's pulse, the stars' drift and the facing-point reports.

import { readPalette } from "@/lib/css-tokens";
import { START_CURSOR, type LatLon } from "@/lib/data";
import { forcedColors, onForcedColorsChange } from "@/lib/forced-colors";
import { subscribeTicker } from "@/hooks/use-ticker";
import { setStarDrift } from "../Starfield/drift";
import { createGlobeRenderer, NO_PULSE, type GlobeView } from "./renderer";

const DEG = Math.PI / 180;
const TURN_SECONDS = 140; // one slow turn
const DRAG_RADIANS_PER_PX = 0.006;
const MAX_TILT = 50 * DEG;
const INERTIA_DECAY = 0.92; // per frame, after a drag
const FOCUS_RATE = 3; // per second
const SETTLED = 1e-3; // radians
const PULSE_MS = 400;
/** Beats can come faster than this: the ring pulses at most 3 times a second. */
const PULSE_GAP_MS = 1000 / 3;
/** While it turns, how often the facing point is reported (about 10 times a second). */
const REPORT_GAP_MS = 100;
/** The ring starts where the map's cursor starts: the Bay of Bengal. */
const DEFAULT_TARGET: LatLon = START_CURSOR;

export interface GlobeOptions {
  images: readonly HTMLImageElement[];
  /** The globe eases here and the ring sits here; without it, the ring stays on the Bay of Bengal. */
  focus?: LatLon | null;
  /** The slow turn (only without a focus). */
  autoTurn?: boolean;
  /** "Pause motion": no turn, no easing, no pulse. Sound is never touched. */
  paused?: boolean;
  reduceMotion: boolean;
  ringColor?: string;
  /** Changing this pulses the ring once. */
  pulseKey?: number;
  /** The layer of stars to shift against the turn. */
  driftRef?: { current: HTMLDivElement | null };
  /** Where the globe faces: once on the first draw, when a drag ends and when the data arrives; continuously only while it turns. */
  onViewChange?: (view: LatLon) => void;
}

export interface GlobeControl {
  setImages(images: readonly HTMLImageElement[]): void;
  setFocus(focus: LatLon | null): void;
  setRing(hex: string): void;
  pulse(): void;
  /** Reports the facing point once. */
  report(): void;
  /** Options that affect the loop changed. */
  wake(): void;
  dispose(): void;
}

const toRadians = (p: LatLon) => ({ lat: p.lat * DEG, lon: p.lon * DEG });
const wrapRadians = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const tilt = (lat: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, lat));

export function startGlobe(canvas: HTMLCanvasElement, read: () => GlobeOptions): GlobeControl | null {
  const first = read();
  const palette = readPalette();
  const renderer = createGlobeRenderer(canvas, first.images, palette, toRadians(first.focus ?? DEFAULT_TARGET));
  if (!renderer) return null;

  // Forced colours: the outline in CanvasText and the ring in Highlight, whatever colour the stage asked for.
  let ringHex = first.ringColor ?? palette.shapla;
  let system = forcedColors();
  const paint = () => {
    renderer.setEdge(system?.text ?? palette.line);
    renderer.setRing(system?.highlight ?? ringHex);
  };
  paint();
  const offForced = onForcedColorsChange((next) => {
    system = next;
    paint();
    renderer.draw(view);
  });

  const start = first.focus ? toRadians(first.focus) : { lat: 14 * DEG, lon: START_CURSOR.lon * DEG };
  const view: GlobeView = { lon: start.lon, lat: tilt(start.lat), pulse: NO_PULSE };
  let target: { lat: number; lon: number } | null = null;
  let velocity = 0;
  let drag: { x: number; y: number } | null = null;
  let pulseAt: number | null = null;
  let lastPulse = Number.NEGATIVE_INFINITY;
  let lastReport = Number.NEGATIVE_INFINITY;
  let reportWhenSettled = false;
  let drawnOnce = false;
  let off: (() => void) | null = null;

  const report = () => {
    read().onViewChange?.({ lat: view.lat / DEG, lon: wrapRadians(view.lon) / DEG });
  };

  const turning = (o: GlobeOptions) => (o.autoTurn ?? false) && !o.paused && !o.reduceMotion && !o.focus;

  const frame = (now: number, dtMs: number) => {
    const o = read();
    const dt = dtMs / 1000;
    if (!drag) {
      if (target && !o.paused) {
        const k = o.reduceMotion ? 1 : 1 - Math.exp(-dt * FOCUS_RATE);
        const dLon = wrapRadians(target.lon - view.lon);
        const dLat = tilt(target.lat) - view.lat;
        view.lon += dLon * k;
        view.lat += dLat * k;
        if (Math.abs(dLon) < SETTLED && Math.abs(dLat) < SETTLED) target = null;
      } else if (turning(o)) {
        view.lon -= (2 * Math.PI * dt) / TURN_SECONDS;
      }
      view.lon -= velocity;
      velocity *= INERTIA_DECAY;
      if (Math.abs(velocity) < 1e-5) {
        velocity = 0;
        if (reportWhenSettled) {
          reportWhenSettled = false;
          report();
        }
      }
    }
    if (pulseAt !== null) {
      view.pulse = (now - pulseAt) / PULSE_MS;
      if (view.pulse >= 1) {
        view.pulse = NO_PULSE;
        pulseAt = null;
      }
    }
    renderer.draw(view);
    if (!drawnOnce) {
      drawnOnce = true;
      report();
    } else if (turning(o) && now - lastReport >= REPORT_GAP_MS) {
      lastReport = now;
      report();
    }
    if (!o.reduceMotion && !o.paused && o.driftRef?.current) setStarDrift(o.driftRef.current, view.lon);

    const busy = drag !== null || velocity !== 0 || pulseAt !== null || (target !== null && !o.paused) || turning(o);
    if (!busy) stop();
  };

  const stop = () => {
    off?.();
    off = null;
  };
  const wake = () => {
    off ??= subscribeTicker(frame, canvas);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.resize(Math.round(canvas.clientWidth * dpr), Math.round(canvas.clientHeight * dpr), dpr);
    renderer.draw(view);
  };
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);

  const down = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY };
    velocity = 0;
    wake();
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    view.lon -= dx * DRAG_RADIANS_PER_PX;
    view.lat = tilt(view.lat + (e.clientY - drag.y) * DRAG_RADIANS_PER_PX);
    velocity = dx * DRAG_RADIANS_PER_PX;
    drag = { x: e.clientX, y: e.clientY };
  };
  const up = () => {
    if (!drag) return;
    drag = null;
    // The inertia keeps it moving a moment: the report waits until it's where it will stay.
    if (velocity !== 0) reportWhenSettled = true;
    else report();
    wake();
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  resize();
  wake();

  return {
    setImages(images) {
      renderer.setImages(images);
      wake();
    },
    setFocus(focus) {
      renderer.setTarget(toRadians(focus ?? DEFAULT_TARGET));
      target = focus ? toRadians(focus) : null;
      wake();
    },
    setRing(hex) {
      ringHex = hex;
      paint();
      wake();
    },
    pulse() {
      const o = read();
      const now = performance.now();
      if (o.paused || o.reduceMotion || now - lastPulse < PULSE_GAP_MS) return;
      lastPulse = now;
      pulseAt = now;
      wake();
    },
    report,
    wake,
    dispose() {
      stop();
      offForced();
      sizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      renderer.dispose();
    },
  };
}
