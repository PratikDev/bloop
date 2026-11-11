// The dial's value-chord slot, wired to the CV build's value chord (src/lib/audio/layers/chord). The chord is opt-in, as
// CV designed it: off for first-time visitors until the listener turns on "Chord: spread of values" (CV's toggle).
// Once it is on, the dial holds it with owner "dial" at Blend and Music while data sounds, and lets go at Measure or in
// Both / duet; the chord's own honesty gate and colour-bar allowlist still decide whether it sounds. With the chord's
// flags off this returns null: the dial runs without a chord and says so. The panel (cvRead) feeds the chord its view,
// so both flags are needed.

import { valueChord } from "@/lib/audio/layers/chord";
import type { ChordLayer, ChordLayerHook } from "@/lib/audio/layers/types";
import { getCvView, subscribeCvView } from "@/lib/cv/view-store";
import { FLAGS } from "@/lib/flags";

const hook: ChordLayerHook = () => (FLAGS.cvRead && FLAGS.cvChord ? valueChord : null);

/** The chord layer, or null when this build has none. */
export const chordLayer = (): ChordLayer | null => hook();

/** The listener has turned the chord on (CV's toggle; off for first-time visitors). */
export const chordOptedIn = (): boolean => getCvView().chord;
export const subscribeChordOptIn = subscribeCvView;

/** With the dial built in, the dial holds the chord (CV's toggle only opts in); without it, CV's toggle does. */
export const dialOwnsChord = (): boolean => FLAGS.artDial && chordLayer() !== null;
