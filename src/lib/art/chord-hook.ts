import { valueChord } from "@/lib/audio/layers/chord";
import type { ChordLayer, ChordLayerHook } from "@/lib/audio/layers/types";
import { getCvView, subscribeCvView } from "@/lib/cv/view-store";
import { FLAGS } from "@/lib/flags";

const hook: ChordLayerHook = () => (FLAGS.cvRead && FLAGS.cvChord ? valueChord : null);

export const chordLayer = (): ChordLayer | null => hook();

export const chordOptedIn = (): boolean => getCvView().chord;
export const subscribeChordOptIn = subscribeCvView;

export const dialOwnsChord = (): boolean => FLAGS.artDial && chordLayer() !== null;
