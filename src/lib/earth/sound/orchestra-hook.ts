// The one place the DATA records' pitched notes go through an instrument family (Earth Orchestra). The family comes from
// the record's category in the generated table (getCategory: fires_fwi → fire, nightlights_bm → people, the radar
// method → the ocean voice it is applied to). Plain tones (a sine with a soft envelope) when Earth Orchestra is off, the
// listener chose "Plain tones", or the record has no category. Pitched notes only: the Geiger clicks and the landslide
// rumble are fixed categorical sounds (filtered noise) and keep their own design. A family note settles at exactly
// note.hz (value → pitch never changes); only timbre changes.

import type { OrchestraApi, OrchestraNote, OrchestraNoteHandle, OrchestraVoice } from "@/lib/audio/layers/types";
import { orchestra as earthOrchestra } from "@/lib/audio/orchestra";
import { getArt } from "@/lib/art/settings";
import { FLAGS } from "@/lib/flags";

/** ART's OrchestraApi, when Earth Orchestra is on. */
export const orchestra: OrchestraApi | null = FLAGS.artOrchestra ? earthOrchestra : null;

/** What a DATA call site plays a note through. */
export type DataVoice = Pick<OrchestraVoice, "note">;

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

const PLAIN: DataVoice = { note: plainNote };

/** The record's Earth Orchestra family, or null (Earth Orchestra off, "Plain tones" chosen, or no category). */
export function dataFamily(recordId: string): OrchestraVoice | null {
  const category = orchestra?.getCategory(recordId) ?? null;
  if (orchestra === null || category === null || getArt().style === "plain") return null;
  return orchestra.orchestraVoice(category);
}

/** The voice a DATA record's note plays through: its family, or plain tones (see the top of this file). */
export const dataVoice = (recordId: string): DataVoice => dataFamily(recordId) ?? PLAIN;
