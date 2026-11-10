// The dial's value-chord slot, wired to the CV build's value chord (src/lib/audio/layers/chord): at Blend and Music the
// dial asks for it with owner "dial" and lets go at Measure or in Both / duet; the chord's own honesty gate and colour-bar
// allowlist still decide whether it sounds. With the chord's flags off this returns null: the dial runs without a chord
// and says so (UI and Describe text). The panel (cvRead) feeds the chord its view, so both flags are needed.

import { valueChord } from "@/lib/audio/layers/chord";
import type { ChordLayer, ChordLayerHook } from "@/lib/audio/layers/types";
import { FLAGS } from "@/lib/flags";

let hook: ChordLayerHook = () => (FLAGS.cvRead && FLAGS.cvChord ? valueChord : null);

export function setChordLayerHook(next: ChordLayerHook): void {
  hook = next;
}

/** The chord layer, or null when this build has none. */
export const chordLayer = (): ChordLayer | null => hook();
