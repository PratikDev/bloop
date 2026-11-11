import { mixInto, noiseBand, noiseBuffer, setSpectrum, type OnSource } from "@/lib/audio/orchestra";

export const DEFAULT_SA = 220;
const BED_GAIN = 0.035;
const DRONE_GAIN = 0.05;
const REVERB_WET = 0.16;
const REVERB_SEC = 1.8;
const TICK_GAIN = 0.05;
const TICK_SEC = 0.06;

export interface Swell {
  set(on: boolean, at: number): void;
  stop(at: number): void;
}

function swell(ctx: BaseAudioContext, out: AudioNode, level: number, sources: AudioScheduledSourceNode[], input: GainNode): Swell {
  const gate = new GainNode(ctx, { gain: 0 });
  mixInto(input.connect(gate), out);
  for (const s of sources) s.start();
  return {
    set(on, at) {
      gate.gain.cancelScheduledValues(at);
      gate.gain.setTargetAtTime(on ? level : 0, at, on ? 0.15 : 0.08);
    },
    stop(at) {
      gate.gain.cancelScheduledValues(at);
      gate.gain.setTargetAtTime(0, at, 0.02);
      for (const s of sources) s.stop(at + 0.2);
    },
  };
}

export function createBed(ctx: BaseAudioContext, out: AudioNode, sa: number, onSource?: OnSource): Swell {
  const input = new GainNode(ctx, { gain: 1 });
  const air = noiseBand(ctx, 300, 0.4, onSource);
  mixInto(air.out.connect(new GainNode(ctx, { gain: 0.6 })), input);
  const pad = new OscillatorNode(ctx, { frequency: sa / 4 });
  setSpectrum(pad, [1, 0.25]);
  mixInto(pad.connect(new GainNode(ctx, { gain: 0.5 })), input);
  onSource?.(pad);
  return swell(ctx, out, BED_GAIN, [air.source, pad], input);
}

type DroneColour = "monsoon" | "dry";

const DRONE_COLOUR: Record<DroneColour, { partials: number[]; lowpass: number }> = {
  monsoon: { partials: [1, 0.6, 0.45, 0.35, 0.25, 0.2], lowpass: 520 },
  dry: { partials: [1, 0.35, 0.15], lowpass: 1200 },
};

export const droneColour = (month: number | null): DroneColour => (month !== null && month >= 6 && month <= 9 ? "monsoon" : "dry");

export function createDrone(ctx: BaseAudioContext, out: AudioNode, sa: number, colour: DroneColour, onSource?: OnSource): Swell {
  const c = DRONE_COLOUR[colour];
  const input = new GainNode(ctx, { gain: 1 });
  const lp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: c.lowpass });
  lp.connect(input);
  const oscs = [sa / 2, (sa / 2) * 1.5, sa].map((hz, i) => {
    const osc = new OscillatorNode(ctx, { frequency: hz });
    setSpectrum(osc, c.partials);
    mixInto(osc.connect(new GainNode(ctx, { gain: i === 0 ? 0.6 : 0.3 })), lp);
    onSource?.(osc);
    return osc;
  });
  return swell(ctx, out, DRONE_GAIN, oscs, input);
}

export function createReverb(ctx: BaseAudioContext, out: AudioNode): { input: GainNode; wet: GainNode } {
  const length = Math.round(ctx.sampleRate * REVERB_SEC);
  const ir = new AudioBuffer({ length, sampleRate: ctx.sampleRate, numberOfChannels: 2 });
  const noise = noiseBuffer(ctx).getChannelData(0);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < length; i++) d[i] = noise[(i * (ch + 1) * 7) % noise.length] * Math.exp((-6.9 * i) / length);
  }
  const input = new GainNode(ctx, { gain: 1 });
  const wet = new GainNode(ctx, { gain: 0 });
  mixInto(input.connect(new ConvolverNode(ctx, { buffer: ir })).connect(wet), out);
  return { input, wet };
}

export const reverbLevel = (on: boolean) => (on ? REVERB_WET : 0);

export function playTick(ctx: BaseAudioContext, out: AudioNode, hz: number, when: number, onSource?: OnSource): void {
  const osc = new OscillatorNode(ctx, { frequency: hz });
  const env = new GainNode(ctx, { gain: 0 });
  mixInto(osc.connect(env), out);
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(TICK_GAIN, when + 0.004);
  env.gain.setTargetAtTime(0, when + 0.004, TICK_SEC / 3);
  onSource?.(osc);
  osc.start(when);
  osc.stop(when + TICK_SEC * 3);
}
