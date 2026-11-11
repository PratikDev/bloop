// §15 mapping additions (10 Nov 2026): categorical rules for class products (SVS 5315 fire-weather classes,
// SVS 5584 LHASA landslide exposure). A class gets a fixed sound state (a fixed chord, a fixed rumble, or a stated
// silence), never a pitch that implies a precision the classes don't have. Checked by validateMapping.

/** A fixed rumble: low-passed noise at one cutoff, one gain, optionally pulsed (thresholded, never continuous). */
export interface ClassRumble {
  cutoffHz: number;
  gain: number;
  /** Slow amplitude pulses per second; 0 = a steady rumble. */
  pulsesPerSecond: number;
}

/** One class's sound state. `code` and `label` are the product's own (its JSON's `classes`); a test checks they match. */
export interface ClassState {
  code: number;
  label: string;
  sound: "silence" | "chord" | "rumble";
  /** chord only: semitones above the rule's rootHz (a fixed chord, not data pitch). */
  tones?: number[];
  /** rumble only. */
  rumble?: ClassRumble;
  /** silence only: why it is silent, said with it ("stated silence"). */
  silence?: string;
}

export interface ClassesMapping {
  kind: "classes";
  input: { unit: string };
  /** The chords' root (Hz); every chord tone is rootHz × 2^(semitones / 12). Needed when any state is a chord. */
  rootHz?: number;
  /** Ascending by code; every code the product can hold is listed. */
  states: ClassState[];
}
