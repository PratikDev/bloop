// The fire-weather chord: a class's fixed chord from the "fireWeather" rule, sustained at the needle, crossfading
// when the class changes; a stated silence for "no calculation" and "very low". Fixed tones: it never reads or moves a
// data voice's pitch. Plays on the DATA bus (out.ts) through the orchestra hook.

import { panFor, voiceSpec } from "@/lib/audio/mapping";
import type { OrchestraNoteHandle } from "@/lib/audio/layers/types";
import { chordHz, classesRule, classState } from "../classes";
import { APP_RECORDS } from "../records";
import { dataVoice } from "./orchestra-hook";
import { dataOut, report } from "./out";

const HOLD_SEC = 1e6; // sustained until the class changes (stop releases it)

export interface ChordLayer {
  /** The class at the needle (null = no data: silence), and where it is (pan). */
  set(code: number | null, lon: number): void;
  /** A chord at a time on the audio clock, for `duration` seconds (the archive replay). */
  at(code: number | null, when: number, duration: number): void;
  stop(): void;
  /** The tones sounding now (Hz), for the checks. */
  sounding(): readonly number[];
}

export function createChordLayer(voiceId: string): ChordLayer {
  const rule = classesRule(voiceId);
  let notes: OrchestraNoteHandle[] = [];
  let current: number | null = null;
  let hz: number[] = [];
  let pan: StereoPannerNode | null = null;

  const release = () => {
    for (const n of notes) n.stop();
    notes = [];
  };

  const tones = (code: number | null) => chordHz(rule, code === null ? null : classState(rule, code));

  return {
    set(code, lon) {
      const out = dataOut();
      if (!out) return;
      const { graph, bus } = out;
      if (!pan) {
        pan = new StereoPannerNode(graph.ctx, { pan: 0 });
        pan.connect(bus);
      }
      pan.pan.setTargetAtTime(panFor(lon), graph.ctx.currentTime, 0.05);
      if (code === current && notes.length === hz.length) return;
      current = code;
      release();
      hz = tones(code);
      const gain = voiceGain(voiceId) / Math.max(1, hz.length);
      // Earth Orchestra: the record's family (Fire and smoke).
      const voice = dataVoice(APP_RECORDS.fires_fwi.id);
      notes = hz.map((f) => voice.note(graph.ctx, pan as AudioNode, { hz: f, when: graph.ctx.currentTime, duration: HOLD_SEC, gain }));
      report("chord", { voice: voiceId, code, hz });
    },
    at(code, when, duration) {
      const out = dataOut();
      if (!out) return;
      const f = tones(code);
      const gain = voiceGain(voiceId) / Math.max(1, f.length);
      // Earth Orchestra: the replay's daily chords, in the record's family.
      const voice = dataVoice(APP_RECORDS.fires_fwi.id);
      for (const x of f) voice.note(out.graph.ctx, out.bus, { hz: x, when, duration, gain });
      report("chord", { voice: voiceId, code, hz: f });
    },
    stop() {
      release();
      current = null;
      hz = [];
      report("chord", { voice: voiceId, code: null, hz: [] });
    },
    sounding: () => hz,
  };
}

/** The rule's own loudness cap (sound.maxGain), shared by the chord's tones. */
const voiceGain = (id: string) => voiceSpec(id).sound.maxGain;
