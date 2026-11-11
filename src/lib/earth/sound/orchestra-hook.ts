import type { OrchestraApi, OrchestraNote, OrchestraNoteHandle, OrchestraVoice } from "@/lib/audio/layers/types";
import { orchestra as earthOrchestra } from "@/lib/audio/orchestra";
import { getArt } from "@/lib/art/settings";
import { FLAGS } from "@/lib/flags";

export const orchestra: OrchestraApi | null = FLAGS.artOrchestra ? earthOrchestra : null;

type DataVoice = Pick<OrchestraVoice, "note">;

function plainNote(ctx: BaseAudioContext, out: AudioNode, note: OrchestraNote): OrchestraNoteHandle {
  const attack = Math.min(0.12, note.duration / 4);
  const release = 0.25;
  const osc = new OscillatorNode(ctx, { type: "sine", frequency: note.hz });
  const env = new GainNode(ctx, { gain: 0 });
  osc.connect(env).connect(out);
  env.gain.setValueAtTime(0, note.when);
  env.gain.linearRampToValueAtTime(note.gain, note.when + attack);
  const end = note.when + note.duration;
  if (Number.isFinite(end)) env.gain.setTargetAtTime(0, Math.max(note.when + attack, end - release), release / 3);
  osc.start(note.when);
  if (Number.isFinite(end)) osc.stop(end + release);
  let stopped = false;
  return {
    setHz(hz, at) {
      osc.frequency.setTargetAtTime(hz, at, 0.01);
    },
    stop(at = ctx.currentTime) {
      if (stopped) return;
      stopped = true;
      env.gain.cancelScheduledValues(at);
      env.gain.setValueAtTime(env.gain.value, at);
      env.gain.setTargetAtTime(0, at, release / 3);
      try {
        osc.stop(at + release * 2);
      } catch {
      }
    },
  };
}

const PLAIN: DataVoice = { note: plainNote };

export function dataFamily(recordId: string): OrchestraVoice | null {
  const category = orchestra?.getCategory(recordId) ?? null;
  if (orchestra === null || category === null || getArt().style === "plain") return null;
  return orchestra.orchestraVoice(category);
}

export const dataVoice = (recordId: string): DataVoice => dataFamily(recordId) ?? PLAIN;
