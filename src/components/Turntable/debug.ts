// ?debug=1 only. Checks that the 3D needle reads what the flat map reads, and
// exposes window.__turntable for the verification script (docs/turntable.md).

import { audio } from "@/lib/audio-adapter";
import { mapVoice } from "@/lib/audio/mapping";
import type { LatLon, LiveFields } from "@/lib/data";
import { cellIndex } from "@/lib/data/grid";
import { toLatLon, toXY } from "@/lib/geo";
import { readAt, type Reading } from "@/lib/reading";
import type { SentReading } from "./needle-sound";
import { SPEEDS, type Turntable } from "./use-turntable";

/** A flat-map size for the 2D pick (FrameView maps pixels the same way at any size). */
const FLAT_MAP = { width: 1280, height: 640 };

/** The flat map's pick of a place: lat/lon → its pixel (toXY) → back (toLatLon), as FrameView does on click. */
export function flatMapPoint(at: LatLon): LatLon {
  const p = toXY(at, FLAT_MAP.width, FLAT_MAP.height);
  return toLatLon(p.x, p.y, FLAT_MAP.width, FLAT_MAP.height);
}

export function sameReading(a: Reading, b: Reading): boolean {
  return a.ocean.valueC === b.ocean.valueC && a.rain.mmPerHour === b.rain.mmPerHour && a.rain.phase === b.rain.phase;
}

/** What the voices are asked to play for a reading, by mapping.json's rules (null = silent). */
export function voiceTargets(r: Reading): { oceanHz: number | null; dropsPerSec: number | null } {
  const mm = r.rain.mmPerHour;
  const dropVoice = r.rain.phase === "liquid" ? "rain" : r.rain.phase === "frozen" ? "snow" : null;
  return { oceanHz: mapVoice("ocean", r.ocean.valueC), dropsPerSec: dropVoice && mm !== null ? mapVoice(dropVoice, mm) : null };
}

export interface PickCheck {
  target: LatLon;
  needle: LatLon; // what the needle reads (sound, readout, speech)
  cameraPick: LatLon | null; // a click on the needle tip's screen position
  flat: LatLon; // the flat map's pick of the needle's place
  needleReading: Reading;
  cameraReading: Reading | null;
  flatReading: Reading;
  sstCell: { needle: number; camera: number | null; flat: number };
  /** The needle (what is heard, shown and spoken) reads exactly what the flat map reads. */
  match: boolean;
  /**
   * A click on the needle tip's pixel reads the same. Can be false only on an exact
   * cell edge (e.g. 0°, 0°), where ~1e-14° of rounding picks the neighbouring cell.
   */
  cameraMatch: boolean;
  oceanSilent: boolean;
}

/** Moves the needle to `target` (or checks where it is, if null) and reads the place three ways. */
export function checkPick(tt: Turntable, fields: LiveFields, target: LatLon | null): PickCheck | null {
  const scene = tt.sceneRef.current;
  if (!scene) return null;
  if (target) tt.moveTo(target);
  const needle = tt.needle();
  const cameraPick = scene.pick(scene.needleNdc());
  const flat = flatMapPoint(needle);
  const needleReading = readAt(fields, needle);
  const cameraReading = cameraPick && readAt(fields, cameraPick);
  const flatReading = readAt(fields, flat);
  const cell = (p: LatLon) => cellIndex(fields.sst.meta.grid, p.lat, p.lon);
  return {
    target: target ?? needle,
    needle,
    cameraPick,
    flat,
    needleReading,
    cameraReading,
    flatReading,
    sstCell: { needle: cell(needle), camera: cameraPick && cell(cameraPick), flat: cell(flat) },
    match: sameReading(needleReading, flatReading),
    cameraMatch: cameraReading !== null && sameReading(needleReading, cameraReading),
    oceanSilent: voiceTargets(needleReading).oceanHz === null,
  };
}

/** The loudest frequency on the master analyser, refined by parabolic interpolation. */
export function analyserPeakHz(): number | null {
  const analyser = audio.getAnalyser();
  if (!analyser) return null;
  const bins = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(bins);
  let peak = 1;
  for (let i = 2; i < bins.length - 1; i++) if (bins[i] > bins[peak]) peak = i;
  const [a, b, c] = [bins[peak - 1], bins[peak], bins[peak + 1]];
  const offset = (0.5 * (a - c)) / (a - 2 * b + c);
  return ((peak + (Number.isFinite(offset) ? offset : 0)) * analyser.context.sampleRate) / analyser.fftSize;
}

/**
 * The largest sample-to-sample step and the peak level on the master analyser
 * (after the limiter) over `ms`, read every animation frame. A click shows up
 * as a step far above what the steady sound produces.
 */
export function sampleSteps(ms: number): Promise<{ maxStep: number; peak: number; frames: number } | null> {
  const analyser = audio.getAnalyser();
  if (!analyser) return Promise.resolve(null);
  const samples = new Float32Array(analyser.fftSize);
  const result = { maxStep: 0, peak: 0, frames: 0 };
  const end = performance.now() + ms;
  return new Promise((resolve) => {
    const read = () => {
      analyser.getFloatTimeDomainData(samples);
      for (let i = 0; i < samples.length; i++) {
        result.peak = Math.max(result.peak, Math.abs(samples[i]));
        if (i > 0) result.maxStep = Math.max(result.maxStep, Math.abs(samples[i] - samples[i - 1]));
      }
      result.frames++;
      if (performance.now() < end) requestAnimationFrame(read);
      else resolve(result);
    };
    requestAnimationFrame(read);
  });
}

/** Counts scheduled raindrops and snow bells for `ms`. */
export function countDrops(ms: number): Promise<{ rain: number; snow: number; seconds: number }> {
  return new Promise((resolve) => {
    const counts = { rain: 0, snow: 0 };
    const off = audio.onAudioEvent((e) => {
      if (e.kind === "drop") counts[e.voice]++;
    });
    setTimeout(() => {
      off();
      resolve({ ...counts, seconds: ms / 1000 });
    }, ms);
  });
}

export interface DebugApi {
  needle(): LatLon;
  /** The reading at a place, without moving the needle. */
  readingAt(lat: number, lon: number): Reading | null;
  moveTo(lat: number, lon: number): void;
  checkPick(lat: number, lon: number): PickCheck | null;
  setRotating(on: boolean): void;
  setSpeed(multiplier: number): number;
  sendLog(): (SentReading & ReturnType<typeof voiceTargets> & { sstCell: number })[];
  clearLog(): void;
  analyserPeakHz(): number | null;
  countDrops(ms: number): Promise<{ rain: number; snow: number; seconds: number }>;
  sampleSteps(ms: number): ReturnType<typeof sampleSteps>;
  fps(): number;
}

declare global {
  interface Window {
    __turntable?: DebugApi;
  }
}

export function createDebugApi(tt: () => Turntable, fields: () => LiveFields | null, log: SentReading[]): DebugApi {
  return {
    needle: () => tt().needle(),
    readingAt(lat, lon) {
      const f = fields();
      return f && readAt(f, { lat, lon });
    },
    moveTo: (lat, lon) => tt().moveTo({ lat, lon }),
    checkPick(lat, lon) {
      const f = fields();
      return f && checkPick(tt(), f, { lat, lon });
    },
    setRotating: (on) => tt().setRotating(on),
    setSpeed(multiplier) {
      for (let i = 0; i < SPEEDS.length; i++) tt().changeSpeed(-1);
      let speed: number = SPEEDS[0];
      while (speed < multiplier) speed = tt().changeSpeed(1);
      return speed;
    },
    sendLog() {
      const f = fields();
      return log.map((s) => ({ ...s, ...voiceTargets(s.reading), sstCell: f ? cellIndex(f.sst.meta.grid, s.at.lat, s.at.lon) : -1 }));
    },
    clearLog: () => log.splice(0),
    analyserPeakHz,
    countDrops,
    sampleSteps,
    fps: () => tt().fpsRef.current,
  };
}
