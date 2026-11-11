import { panFor, voiceSpec } from "@/lib/audio/mapping";
import type { OrchestraNoteHandle } from "@/lib/audio/layers/types";
import { chordHz, classesRule, classState } from "../classes";
import { APP_RECORDS } from "../records";
import { dataVoice } from "./orchestra-hook";
import { dataOut, report } from "./out";

const HOLD_SEC = 1e6;

export interface ChordLayer {
  set(code: number | null, lon: number): void;
  at(code: number | null, when: number, duration: number): void;
  stop(): void;
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
      const voice = dataVoice(APP_RECORDS.fires_fwi.id);
      notes = hz.map((f) => voice.note(graph.ctx, pan as AudioNode, { hz: f, when: graph.ctx.currentTime, duration: HOLD_SEC, gain }));
      report("chord", { voice: voiceId, code, hz });
    },
    at(code, when, duration) {
      const out = dataOut();
      if (!out) return;
      const f = tones(code);
      const gain = voiceGain(voiceId) / Math.max(1, f.length);
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

const voiceGain = (id: string) => voiceSpec(id).sound.maxGain;
