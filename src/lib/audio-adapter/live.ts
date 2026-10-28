// Live exploration: the cursor's values drive the ocean, rain and snow voices.
// While a sequence (sweep, legend, opening) owns the voices, cursor values are
// remembered and re-applied when it ends.

import type { Clarity } from "@/lib/data";
import { playEarconAt } from "./earcons";
import { emitCaption } from "./events";
import type { Graph } from "./graph";
import { mixer } from "./mixer";
import { createRecordedTexture, type RecordedTexture, type RecordedTrack } from "./recorded";
import type { LiveVoiceId, RainPhase } from "./types";
import { createClarityEcho, type ClarityEcho } from "./voices/clarity";
import { createDropVoice, type DropVoice } from "./voices/drops";
import { createNormalToneVoice, type NormalToneVoice } from "./voices/normal-tone";
import { createOceanVoice, type OceanVoice } from "./voices/ocean";

export interface Voices {
  ocean: OceanVoice;
  rain: DropVoice;
  snow: DropVoice;
  normalTone: NormalToneVoice; // §15: SVS 5176 anomaly around a fixed reference (B3)
  clarity: ClarityEcho; // §15: echo on the ocean voice from MUR's hours since a look (C5)
}

type OceanInput = { valueC: number | null; lon: number };
type RainInput = { mmPerHour: number | null; phase: RainPhase; lon: number };

const CAPTION_THROTTLE_MS = 250;

let graph: Graph | null = null;
let voices: Voices | null = null;
let recorded: RecordedTexture | null = null;
let sequenceActive = false;
const last: { ocean: OceanInput | null; rain: RainInput | null } = { ocean: null, rain: null };
const applied: { ocean: OceanInput | null; rain: RainInput | null } = { ocean: null, rain: null };
const lastCaptionAt: Record<"ocean" | "rain", number> = { ocean: 0, rain: 0 };
const stale: Record<RecordedTrack, boolean> = { ocean: false, rain: false };

export function initLive(g: Graph): void {
  graph = g;
  voices = {
    ocean: createOceanVoice(g),
    rain: createDropVoice(g, "rain"),
    snow: createDropVoice(g, "snow"),
    normalTone: createNormalToneVoice(g),
    clarity: createClarityEcho(g, g.voiceBus.ocean),
  };
  recorded = createRecordedTexture(g);
}

/** The recorded texture follows each live track: stale data and that track sounding now. */
function updateRecorded() {
  recorded?.update({
    ocean: { stale: stale.ocean, sounding: (applied.ocean?.valueC ?? null) !== null && mixer.isAudible("ocean") },
    rain: {
      stale: stale.rain,
      sounding: (applied.rain?.mmPerHour ?? 0) > 0 && (mixer.isAudible("rain") || mixer.isAudible("snow")),
    },
  });
}

export function getVoices(): Voices | null {
  return voices;
}

/** Sends a rain value to the right voice: liquid → rain, frozen → snow, else silence. */
export function routeRain(v: Voices, input: RainInput, time?: number): void {
  const rainMm = input.phase === "liquid" ? input.mmPerHour : null;
  const snowMm = input.phase === "frozen" ? input.mmPerHour : null;
  if (time === undefined) {
    v.rain.set(rainMm, input.lon);
    v.snow.set(snowMm, input.lon);
  } else {
    v.rain.at(time, rainMm, input.lon);
    v.snow.at(time, snowMm, input.lon);
  }
}

function throttledValueCaption(track: "ocean" | "rain", params: Record<string, string | number>) {
  const now = performance.now();
  if (now - lastCaptionAt[track] < CAPTION_THROTTLE_MS) return;
  lastCaptionAt[track] = now;
  emitCaption("caption.value", { track, ...params });
}

function enteredNoData(track: "ocean" | "rain", lon: number, audibleVoices: LiveVoiceId[]) {
  if (!graph || !audibleVoices.some((id) => mixer.isAudible(id))) return;
  playEarconAt(graph, "nodata", graph.ctx.currentTime, lon);
  emitCaption("caption.nodata", { track });
}

function applyOcean(input: OceanInput) {
  if (!voices) return;
  const prev = applied.ocean;
  voices.ocean.set(input.valueC, input.lon);
  applied.ocean = input;
  updateRecorded();
  if (input.valueC === null) {
    if (prev && prev.valueC !== null) enteredNoData("ocean", input.lon, ["ocean"]);
    return;
  }
  throttledValueCaption("ocean", { value: input.valueC });
}

function applyRain(input: RainInput) {
  if (!voices) return;
  const prev = applied.rain;
  routeRain(voices, input);
  applied.rain = input;
  updateRecorded();
  if (input.phase === "nodata") {
    if (prev && prev.phase !== "nodata") enteredNoData("rain", input.lon, ["rain", "snow"]);
    return;
  }
  throttledValueCaption("rain", { value: input.mmPerHour ?? 0, phase: input.phase });
}

function silenceVoices() {
  applied.ocean = null;
  applied.rain = null;
  updateRecorded();
  if (!voices) return;
  voices.ocean.set(null, 0);
  voices.rain.set(null, 0);
  voices.snow.set(null, 0);
  voices.normalTone.set(null, 0);
  voices.clarity.set(null);
}

export const live = {
  setOcean(valueC: number | null, lon: number) {
    last.ocean = { valueC, lon };
    if (!sequenceActive) applyOcean(last.ocean);
  },
  setRain(mmPerHour: number | null, phase: RainPhase, lon: number) {
    last.rain = { mmPerHour, phase, lon };
    if (!sequenceActive) applyRain(last.rain);
  },
  /** §15: the normal tone on the anomaly under the cursor (null silences it). */
  setNormalTone(anomalyC: number | null, lon: number) {
    if (!sequenceActive) voices?.normalTone.set(anomalyC, lon);
  },
  /** §15: the ocean voice's echo length from MUR's hours since a 1 km look. */
  setClarity(c: Clarity) {
    voices?.clarity.set(c);
  },
  /** §15 (guardrail 16): a track's data is past its freshness limit. */
  setRecorded(track: RecordedTrack, isStale: boolean) {
    stale[track] = isStale;
    updateRecorded();
  },
  /** Silences every live voice and forgets the cursor values. */
  silence() {
    last.ocean = null;
    last.rain = null;
    silenceVoices();
  },
  /** A sequence takes the voices (true) or hands them back (false). */
  setSequenceActive(active: boolean, restore: boolean) {
    sequenceActive = active;
    if (active) return;
    silenceVoices();
    if (!restore) return;
    if (last.ocean) applyOcean(last.ocean);
    if (last.rain) applyRain(last.rain);
  },
};
