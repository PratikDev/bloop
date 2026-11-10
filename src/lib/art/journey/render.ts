// Water's journey on any BaseAudioContext: live (L2's context) or offline for "Play as one piece" (a WAV). Pitched
// steps: one note a value in the step's Earth Orchestra family, swara + meend landing on the value (dial 1); drops and
// clicks: short seeded noise bursts; under each step a drone on its Sa (rate steps: A3), and a light reverb on all.

import { FAMILIES, familyFor, familyNote, noiseBand, type OnSource } from "@/lib/audio/orchestra";
import { createDrone, createReverb, DEFAULT_SA, droneColour, reverbLevel } from "../layers";
import { MEEND_MIN_STEP, MEEND_SEC, nearestSwara } from "../meend";
import type { Journey } from "./plan";

const GAIN = 0.2;
const MONSOON_MONTH = 7; // the suite is the monsoon's water: the drone wears its season colour (an artistic choice)

function tick(ctx: BaseAudioContext, out: AudioNode, at: number, noise: "drop" | "click", onSource?: OnSource) {
  const { source, out: band } = noise === "drop" ? noiseBand(ctx, 2500, 1.2, onSource) : noiseBand(ctx, 5000, 2, onSource);
  const env = new GainNode(ctx, { gain: 0 });
  band.connect(env).connect(out);
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(GAIN, at + 0.002);
  env.gain.setTargetAtTime(0, at + 0.002, noise === "drop" ? 0.015 : 0.006);
  source.start(at, (at * 0.37) % 1);
  source.stop(at + 0.1);
}

/** Schedules the whole suite from `t0` into `out`. */
export function renderJourney(ctx: BaseAudioContext, out: AudioNode, j: Journey, t0: number, onSource?: OnSource): void {
  const mix = new GainNode(ctx, { gain: 1 });
  mix.connect(out);
  const reverb = createReverb(ctx, out);
  mix.connect(reverb.input);
  reverb.wet.gain.value = reverbLevel(true);
  for (const s of j.steps) {
    const family = s.category ? familyFor(s.category, true) : FAMILIES.plain;
    const sa = s.sa ?? DEFAULT_SA;
    const drone = createDrone(ctx, mix, sa, droneColour(MONSOON_MONTH), onSource);
    drone.set(true, t0 + s.start);
    drone.set(false, t0 + s.end);
    drone.stop(t0 + s.end + 1);
    for (const e of s.events) {
      if (e.kind === "tick") tick(ctx, mix, t0 + e.at, e.noise, onSource);
      else {
        const meend = s.stepSec >= MEEND_MIN_STEP ? { startHz: nearestSwara(e.hz, sa), glideSec: MEEND_SEC } : {};
        familyNote(ctx, mix, family, { hz: e.hz, when: t0 + e.at, duration: e.dur, gain: GAIN }, { ...meend, onSource });
      }
    }
  }
}

/** The suite rendered offline (deterministic: seeded noise, fixed plan). */
export async function renderJourneyOffline(j: Journey, sampleRate = 22050): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext({ numberOfChannels: 2, length: Math.ceil(j.seconds * sampleRate), sampleRate });
  renderJourney(ctx, ctx.destination, j, 0);
  return ctx.startRendering();
}
