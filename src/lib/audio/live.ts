// Live exploration (Phase 2): the cursor's values drive the ocean, rain and
// snow voices. Handles honest silence, the no-data tick on entering a
// no-data area, and throttled value captions. Calls before Start do nothing.
//
// Sequences (legend, warm-up, …) borrow the same voices with holdLive():
// cursor updates are remembered but not played until releaseLive(), which
// then resumes from the latest cursor values.

import { createThrottledCaption, emitCaption } from "./captions";
import { getCtx, peekEngine } from "./context";
import { playEarconAt } from "./earcons";
import { isVoiceAudible } from "./mixer";
import { createNoDataTracker, type NoDataTrack } from "./nodata";
import { onStopAll } from "./stop";
import type { RainPhase } from "./types";
import type { VoiceTiming } from "./voices/common";
import type { DropVoice } from "./voices/drops";
import { createOceanVoice, type OceanVoice } from "./voices/ocean";
import { createRainVoice } from "./voices/rain";
import { createSnowVoice } from "./voices/snow";

const CAPTION_INTERVAL_MS = 250; // ≤ 4 value captions per second per track
export const NODATA_TICK_GAP_SEC = 0.3; // at most one no-data tick per 300 ms

type Track = NoDataTrack;

export interface LiveVoices {
  ocean: OceanVoice;
  rain: DropVoice;
  snow: DropVoice;
}

let voices: LiveVoices | null = null;

/** The live voices, built on first use after Start (they need the AudioContext). null before Start. */
export function liveVoices(): LiveVoices | null {
  if (!peekEngine()) return null;
  voices ??= { ocean: createOceanVoice(), rain: createRainVoice(), snow: createSnowVoice() };
  return voices;
}

const captions: Record<Track, ReturnType<typeof createThrottledCaption>> = {
  ocean: createThrottledCaption(CAPTION_INTERVAL_MS),
  rain: createThrottledCaption(CAPTION_INTERVAL_MS),
};

const noData = createNoDataTracker(NODATA_TICK_GAP_SEC);

// Latest cursor values, kept while a sequence holds the voices.
let lastOcean: { valueC: number | null; lon: number } | null = null;
let lastRain: { mmPerHour: number | null; phase: RainPhase; lon: number } | null = null;
let held = false;

function forgetPosition() {
  noData.reset();
  captions.ocean.cancel();
  captions.rain.cancel();
}

/** Rain phase decides the voice: liquid → drops, frozen → bells, dry / no data → both silent. */
export function routeRain(v: LiveVoices, mmPerHour: number | null, phase: RainPhase, lon: number, at?: VoiceTiming) {
  v.rain.set(phase === "liquid" ? mmPerHour : null, lon, at);
  v.snow.set(phase === "frozen" ? mmPerHour : null, lon, at);
}

function silenceVoices(v: LiveVoices) {
  v.ocean.set(null, 0);
  v.rain.set(null, 0);
  v.snow.set(null, 0);
}

// Esc: nothing resumes afterwards; the next cursor move starts fresh.
onStopAll(() => {
  forgetPosition();
  lastOcean = null;
  lastRain = null;
  held = false;
});

/** Tick + caption on the transition into no data, only if that track can be heard. */
function updateNoData(trackName: Track, isNoData: boolean, lon: number, audible: boolean) {
  const now = getCtx().currentTime;
  const { entering, tick } = noData.update(trackName, isNoData, now);
  if (!entering || !audible) return;
  captions[trackName].cancel();
  emitCaption("caption.nodata", { track: trackName });
  if (tick) playEarconAt("nodata", now, lon);
}

/** Cursor moved: ocean temperature in °C (null = land / no data) at a longitude. */
export function setOcean(valueC: number | null, lon: number) {
  lastOcean = { valueC, lon };
  const v = liveVoices();
  if (!v || held) return;
  v.ocean.set(valueC, lon);
  const audible = isVoiceAudible("ocean");
  updateNoData("ocean", valueC === null, lon, audible);
  if (valueC !== null && audible) captions.ocean.emit("caption.value", { track: "ocean", value: valueC });
}

/** Cursor moved: rain rate (0 = dry, null = no data) and phase at a longitude. */
export function setRain(mmPerHour: number | null, phase: RainPhase, lon: number) {
  lastRain = { mmPerHour, phase, lon };
  const v = liveVoices();
  if (!v || held) return;
  routeRain(v, mmPerHour, phase, lon);
  const audible = isVoiceAudible(phase === "frozen" ? "snow" : "rain");
  updateNoData("rain", phase === "nodata", lon, audible);
  if (phase !== "nodata" && audible) {
    captions.rain.emit("caption.value", { track: "rain", value: mmPerHour ?? 0, phase });
  }
}

/** The cursor left the map, or exploration paused: fade the live voices out (no tick). */
export function silenceLive() {
  lastOcean = null;
  lastRain = null;
  const v = liveVoices();
  if (!v) return;
  silenceVoices(v);
  forgetPosition();
}

/** A sequence takes the voices: exploration goes quiet but keeps listening to the cursor. */
export function holdLive(): LiveVoices | null {
  const v = liveVoices();
  if (!v) return null;
  held = true;
  silenceVoices(v);
  forgetPosition();
  return v;
}

/** The sequence is done: give the voices back and, if asked, resume from the latest cursor values. */
export function releaseLive(resume: boolean) {
  const v = liveVoices();
  held = false;
  if (!v) return;
  silenceVoices(v);
  if (!resume) return;
  if (lastOcean) setOcean(lastOcean.valueC, lastOcean.lon);
  if (lastRain) setRain(lastRain.mmPerHour, lastRain.phase, lastRain.lon);
}
