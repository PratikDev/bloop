// The radar method's instruments, synthesised: a glockenspiel (a bright partial at 2.76× decaying fast), a marimba
// (a partial at 4×, short and woody), and a soft choir-like pad (two slightly detuned triangles, slow attack). NASA's
// method keeps its own instruments: NASA mode never goes through the Earth Orchestra. Bloop mode is Bloop's data voice
// (value → pitch, the ocean rule): with Earth Orchestra on it plays in the family of the voice it reads (dataVoice).

import { voiceSpec } from "@/lib/audio/mapping";
import type { Instrument, RadarMode, RadarNote } from "../radar";
import { RADAR_RECORD, RADAR_VOICE } from "../radar";
import { dataFamily } from "./orchestra-hook";
import { dataOut, report } from "./out";

const PARTIALS: Record<Instrument, { ratios: number[]; levels: number[]; attack: number; decay: number; type: OscillatorType }> = {
  glockenspiel: { ratios: [1, 2.76, 5.4], levels: [1, 0.5, 0.2], attack: 0.002, decay: 0.9, type: "sine" },
  marimba: { ratios: [1, 4], levels: [1, 0.35], attack: 0.003, decay: 0.35, type: "sine" },
  choir: { ratios: [1, 1.004], levels: [0.6, 0.6], attack: 0.12, decay: 0.6, type: "triangle" },
};

function note(ctx: BaseAudioContext, out: AudioNode, instrument: Instrument, hz: number, when: number, gain: number) {
  const p = PARTIALS[instrument];
  const env = new GainNode(ctx, { gain: 0 });
  env.connect(out);
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + p.attack);
  env.gain.setTargetAtTime(0, when + p.attack, p.decay / 3);
  p.ratios.forEach((r, i) => {
    const osc = new OscillatorNode(ctx, { type: p.type, frequency: hz * r });
    const g = new GainNode(ctx, { gain: p.levels[i] / p.ratios.length });
    osc.connect(g).connect(env);
    osc.start(when);
    osc.stop(when + p.attack + p.decay * 2);
  });
}

let stopAt: (() => void) | null = null;

/** Plays one sweep (every note on the audio clock from now); returns its length in seconds. Stops a sweep playing. */
export function playRadar(mode: RadarMode, notes: readonly RadarNote[]): number {
  stopRadar();
  const out = dataOut();
  if (!out) return 0;
  const { ctx } = out.graph;
  const bus = new GainNode(ctx, { gain: 1 });
  bus.connect(out.bus);
  const t0 = ctx.currentTime + 0.1;
  const gain = voiceSpec(RADAR_VOICE).sound.maxGain;
  const family = mode === "bloop" ? dataFamily(RADAR_RECORD) : null;
  for (const n of notes) {
    if (family) family.note(ctx, bus, { hz: n.hz, when: t0 + n.timeSec, duration: PARTIALS[n.instrument].decay, gain });
    else note(ctx, bus, n.instrument, n.hz, t0 + n.timeSec, gain);
  }
  stopAt = () => {
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    setTimeout(() => bus.disconnect(), 200);
  };
  report("radar", { mode, notes: notes.length, firstHz: notes[0]?.hz ?? null, lastHz: notes[notes.length - 1]?.hz ?? null });
  return notes.length ? notes[notes.length - 1].timeSec : 0;
}

export function stopRadar(): void {
  stopAt?.();
  stopAt = null;
}
