// The value chord: the spread of values Bloop read in the current view, as at most two sustained
// tones at the pitches of real recovered values, through the record's own value → pitch rule. A standalone ChordLayer
// (src/lib/audio/layers/types.ts): it computes its groups from the view it is given (setView), and either owner — the
// listener's toggle ("user") or the Science ↔ Art dial ("dial") — keeps it on.
import type { ChordGate, ChordLayer, ChordOwner, ChordRequest, ChordTone } from "../types";
import { onStopAll } from "../../stop";
import { allowanceOf } from "./allowlist";
import { chordGate } from "./gate";
import { findModes, type ValueMode } from "./modes";
import { chordChanged, chordTones } from "./tones";
import { chordPeak, forgetTones, silenceTones, soundTones } from "./voice";
import type { ValueTrust } from "../types";

/** The view the chord describes: one record's values in the current box (ascending), and how to smooth them. */
interface ChordView {
  recordId: string;
  /** The layer, for a record with several (the allowlist is per layer). */
  layer?: string;
  trust: ValueTrust;
  /** The voice whose value → pitch rule plays the tones; null = the record plays no pitch. */
  pitchVoice: string | null;
  /** σ: the record's measured error in its own units; null = not known (no chord). */
  sigma: number | null;
  /** The box's valid values, ascending. */
  values: ArrayLike<number>;
}

/** What the CV layer adds to ChordLayer (src/lib/audio/layers/types.ts): the view it reads and a change signal. */
interface ValueChordLayer extends ChordLayer {
  setView(view: ChordView | null): void;
  /** The groups found in the current view (also when silent), for the UI's text. */
  modes(): readonly ValueMode[];
  /** Called when what sounds (or would sound) changes. */
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

  /** Recomputes the groups and, when the gate allows, the tones (with hysteresis). */
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

/** The one value chord the app plays (the dial's ChordLayerHook returns this at integration). */
export const valueChord: ValueChordLayer = createValueChord();
