// HOOK (integration): the dial's value-chord slot. The CV build's layer goes here at integration:
//   import { valueChord } from "@/lib/audio/layers/chord";  setChordLayerHook(() => valueChord);
// Until then it returns null: the dial runs without a chord and says so (UI and Describe text). ART never imports
// CV's code; the dial asks for the chord with owner "dial" and lets go when it moves to 0 or into Both / duet.

import type { ChordLayer, ChordLayerHook } from "@/lib/audio/layers/types";

let hook: ChordLayerHook = () => null;

export function setChordLayerHook(next: ChordLayerHook): void {
  hook = next;
}

/** The chord layer, or null when this build has none. */
export const chordLayer = (): ChordLayer | null => hook();
