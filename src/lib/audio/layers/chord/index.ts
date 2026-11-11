import type { ChordGate, ChordLayer, ChordOwner, ChordRequest, ChordTone } from "../types";
import { onStopAll } from "../../stop";
import { allowanceOf } from "./allowlist";
import { chordGate } from "./gate";
import { findModes, type ValueMode } from "./modes";
import { chordChanged, chordTones } from "./tones";
import { chordPeak, forgetTones, silenceTones, soundTones } from "./voice";
import type { ValueTrust } from "../types";

interface ChordView {
  recordId: string;
  layer?: string;
  trust: ValueTrust;
  pitchVoice: string | null;
  sigma: number | null;
  values: ArrayLike<number>;
}

interface ValueChordLayer extends ChordLayer {
  setView(view: ChordView | null): void;
  modes(): readonly ValueMode[];
  subscribe(listener: () => void): () => void;
}

function createValueChord(): ValueChordLayer {
  const owners = new Set<ChordOwner>();
  const listeners = new Set<() => void>();
  let view: ChordView | null = null;
  let req: ChordRequest | null = null;
  let groups: ValueMode[] = [];
  let tones: ChordTone[] = [];

  const notify = () => listeners.forEach((l) => l());
  const gateFor = (r: ChordRequest): ChordGate => {
    const v = view && view.recordId === r.recordId ? view : null;
    return chordGate({
      req: r,
      trust: v?.trust ?? "stated",
      allowance: allowanceOf(r.recordId, v?.layer),
      pitched: Boolean(v?.pitchVoice) && v?.sigma != null,
      hasValues: Boolean(v && v.values.length),
      held: owners.size > 0,
    });
  };

  function update() {
    groups = view && view.sigma != null ? findModes(view.values, view.sigma) : [];
    const gate = req ? gateFor(req) : null;
    const next = gate?.allowed && view?.pitchVoice ? chordTones(groups, view.pitchVoice, chordPeak()) : [];
    if (chordChanged(tones, next, view?.sigma ?? 0)) {
      tones = next;
      if (tones.length) soundTones(tones);
      else silenceTones();
    }
    notify();
  }

  onStopAll(() => {
    owners.clear();
    forgetTones();
    tones = [];
    notify();
  });

  return {
    gate: (r) => gateFor(r),
    enable(r, by) {
      owners.add(by);
      req = r;
      update();
      return gateFor(r);
    },
    disable(by) {
      owners.delete(by);
      update();
    },
    stop() {
      owners.clear();
      update();
    },
    sounding: () => tones,
    setView(v) {
      view = v;
      update();
    },
    modes: () => groups,
    subscribe(l) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

export const valueChord: ValueChordLayer = createValueChord();
