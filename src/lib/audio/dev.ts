// Dev-harness helpers (/dev/audio). Not part of the public API: they exist to
// test the engine by ear. Everything still goes through the real graph,
// scheduler and stop logic.

import { getAnalyser, getCtx, getGraph } from "./context";
import { blip, fadeTo, glideTo } from "./params";
import { schedule } from "./scheduler";
import { track } from "./sources";
import { onStopAll } from "./stop";

export { getAudioInfo } from "./context";
export { getLookahead, setLookahead } from "./scheduler";

const TONE_ATTACK_SEC = 0.02;
const TONE_RELEASE_SEC = 0.08;

let tone: { osc: OscillatorNode; env: GainNode } | null = null;

// stopAll() stops the oscillator; forget it right away so the UI reads "stopped".
onStopAll(() => {
  tone = null;
});

/** A sine on the ocean channel (so mute / solo apply), fading in with no click. */
export function startTestTone(freqHz: number) {
  if (tone) return setTestToneFreq(freqHz);
  const ctx = getCtx();
  const osc = track(new OscillatorNode(ctx, { type: "sine", frequency: freqHz }));
  const env = new GainNode(ctx, { gain: 0 });
  osc.connect(env).connect(getGraph().channels.ocean.input);
  osc.addEventListener("ended", () => {
    if (tone?.osc === osc) tone = null;
  });
  osc.start();
  fadeTo(ctx, env.gain, 1, TONE_ATTACK_SEC);
  tone = { osc, env };
}

export function setTestToneFreq(freqHz: number) {
  if (tone) glideTo(getCtx(), tone.osc.frequency, freqHz, 0.03);
}

export function stopTestTone() {
  if (!tone) return;
  const ctx = getCtx();
  const { osc, env } = tone;
  tone = null;
  fadeTo(ctx, env.gain, 0, TONE_RELEASE_SEC);
  osc.stop(ctx.currentTime + TONE_RELEASE_SEC + 0.02);
}

export function isTestTonePlaying(): boolean {
  return tone !== null;
}

const TICK_OWNER = "dev.ticks";

/**
 * Schedules `count` short clicks exactly `intervalMs` apart through the shared
 * scheduler. `onTick` reports each tick's headroom: how early it was handed to
 * Web Audio (negative = it arrived late and played late).
 */
export function playTicks(count: number, intervalMs: number, onTick?: (index: number, headroomMs: number) => void) {
  const ctx = getCtx();
  const start = ctx.currentTime + 0.1;
  for (let i = 0; i < count; i++) {
    schedule(start + (i * intervalMs) / 1000, TICK_OWNER, (time) => {
      onTick?.(i, (time - ctx.currentTime) * 1000);
      const osc = track(new OscillatorNode(ctx, { type: "sine", frequency: 1000 }));
      const env = new GainNode(ctx, { gain: 0 });
      osc.connect(env).connect(getGraph().earcon);
      blip(env.gain, time, 0.12, 0.002, 0.03);
      osc.start(time);
      osc.stop(time + 0.05);
    });
  }
}

const meterBuffer = new Float32Array(2048);

/** Peak level of the final output in dBFS (−Infinity when silent). */
export function readPeakDb(): number {
  const meter = getAnalyser();
  if (!meter) return -Infinity;
  meter.getFloatTimeDomainData(meterBuffer);
  let peak = 0;
  for (const v of meterBuffer) peak = Math.max(peak, Math.abs(v));
  return 20 * Math.log10(peak);
}

export { getLoudnessCompensation, playLoudnessSet, playPitchPair, setLoudnessExponent } from "./dev-tones";

export { isDucked, setDuckingEnabled } from "./duck";
export { loadVoices } from "./speech";
export { clipStatus, type ClipStatus } from "./clips";

/** Current gain of the sonification bus (1 = normal, lower = ducked). Reading only. */
export function readSonificationLevel(): number {
  return getGraph().sonification.gain.value;
}
export { setBassHarmonics } from "./voices/bass";
