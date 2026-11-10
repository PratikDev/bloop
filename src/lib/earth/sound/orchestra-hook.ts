// HOOK: orchestra. The one place the DATA records' notes go through an instrument family (Earth Orchestra, built by
// ART in parallel; the orchestrator wires it at integration). Until then every note is a plain tone (a sine with a soft
// envelope), and every call site names its category in a "// HOOK: orchestra (<category>)" comment:
//   fire weather chord, Fire Geiger clicks → "fire" (Fire and smoke)
//   landslide rumble                       → "land" (Land and life)
//   night-light notes                      → "people" (People and carbon)
// To wire it: set `orchestra` below to ART's OrchestraApi (src/lib/audio/layers/types.ts) and keep plainVoice as the
// "Plain tones" style. A voice settles at exactly note.hz (value → pitch never changes); only timbre changes.

import type { EarthCategory, OrchestraApi, OrchestraNote, OrchestraNoteHandle, OrchestraVoice } from "@/lib/audio/layers/types";

/** HOOK: orchestra. null until integration (ART's OrchestraApi goes here). */
export const orchestra: OrchestraApi | null = null;

/** A plain tone: one sine, a soft attack, a release on stop. Settles at exactly note.hz. */
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
        // already stopped by its own duration
      }
    },
  };
}

const plain = (category: EarthCategory): OrchestraVoice => ({ category, note: plainNote });

/** The voice a DATA note plays through: the category's orchestra family once wired, plain tones until then. */
export function dataVoice(category: EarthCategory): OrchestraVoice {
  return orchestra?.orchestraVoice(category) ?? plain(category);
}
