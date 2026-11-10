// Shared contracts for the sound layers built in parallel (10 Nov 2026), so each side builds against one interface:
//   - CV  (the CV/ML spec): the value chord, a standalone layer implementing ChordLayer;
//   - ART (the art, emotion and musicality spec): the Science ↔ Art dial, which drives a ChordLayer
//     through a hook, and Earth Orchestra, which implements OrchestraApi;
//   - DATA (the data-maximize spec): new records that play plain tones now and call
//     OrchestraApi at integration.
// Types only. The rule every layer keeps: value → pitch never changes. A layer may shape timbre, add sound around the
// data voice or replace the second voice; it never moves a data voice's settled pitch, onset count or tempo.

/** How a record's values may be used, from its validation status (OfficialStatus, provenance). */
export type ValueTrust = "verified" | "stated" | "relative" | "pattern";

/** What the foreground is playing. The chord replaces the second data voice only in "single"; it is off otherwise. */
export type PlayMode = "single" | "both" | "duet";

/** The Science ↔ Art dial's three stops: 0 Measure, 0.5 Blend, 1 Music. */
export const DIAL_STOPS = [0, 0.5, 1] as const;
export type DialStop = (typeof DIAL_STOPS)[number];

// ---------------------------------------------------------------------------------------------------------------
// Value chord (CV implements, ART's dial drives)
// ---------------------------------------------------------------------------------------------------------------

/** Who asked for the chord: the listener's own toggle, or the dial at 0.5 / 1. Either one keeps it on. */
export type ChordOwner = "user" | "dial";

/** What the chord should describe: a record (Listen voice id such as "ocean", or an official record id). */
export interface ChordRequest {
  recordId: string;
  playMode: PlayMode;
}

/** Why the chord is silent. Each one has an EN + BN line in the UI. */
export type ChordBlock =
  | "pattern-only" // no values were read
  | "not-allowlisted" // the record's colour bar isn't on the generated allowlist
  | "both" // Both mode: two data voices already
  | "duet" // proof-in-unison duet: two data voices already
  | "no-data" // the box has no valid cells
  | "off"; // no owner has it on

export interface ChordGate {
  allowed: boolean;
  /** Set when `allowed` is false. */
  block: ChordBlock | null;
  /** Jet-like bars with a dark low end: modes only, no P10 claims. */
  modesOnly: boolean;
  trust: ValueTrust;
}

/** One sounding chord tone: a value group found in the box, at the record's own value → pitch rule. */
export interface ChordTone {
  /** The group's value, in the record's units (relative records: unitless). */
  value: number;
  /** valueToPitch(value) through the record's existing rule; the chord never computes pitch any other way. */
  hz: number;
  /** Share of the box's valid cells in this group, 0..1. */
  fraction: number;
  /** Linear gain, proportional to `fraction`. */
  gain: number;
}

export interface ChordLayer {
  /** The honesty gate for a request, without sounding anything (for UI text). */
  gate(req: ChordRequest): ChordGate;
  /** An owner turns the chord on for a request. Returns the gate; a blocked request plays nothing. */
  enable(req: ChordRequest, by: ChordOwner): ChordGate;
  /** An owner lets go; the chord stops when no owner holds it. */
  disable(by: ChordOwner): void;
  /** Fade out and release every owner (Mute all, Esc, stopAll). */
  stop(): void;
  /** The tones sounding now (empty when silent), for the pitch-identity and T1 tests. At most 2. */
  sounding(): readonly ChordTone[];
}

/** ART's dial holds this slot; CV's layer is put in it at integration. null = no chord available. */
export type ChordLayerHook = () => ChordLayer | null;

// ---------------------------------------------------------------------------------------------------------------
// Earth Orchestra (ART implements, DATA calls)
// ---------------------------------------------------------------------------------------------------------------

/** One instrument family per Earth system. */
export const EARTH_CATEGORIES = ["ocean", "air", "land", "fire", "ice", "people"] as const;
export type EarthCategory = (typeof EARTH_CATEGORIES)[number];

/** Settings → "Instrument style". Plain tones is today's sound. */
export type InstrumentStyle = "orchestra" | "plain";

/** One note of a data voice. Pitch and timing come from the engine; the instrument only shapes the sound. */
export interface OrchestraNote {
  /** The settled frequency: exactly the record's value → pitch output. */
  hz: number;
  /** Start, on the context's clock (s). */
  when: number;
  /** Length (s); the onset count and tempo are the caller's. */
  duration: number;
  /** Linear peak gain, 0..1. */
  gain: number;
}

export interface OrchestraNoteHandle {
  /** Move a sustained note to a new settled pitch (continuous voices). */
  setHz(hz: number, at: number): void;
  /** Release (fade) and stop at `at` (default: now). */
  stop(at?: number): void;
}

export interface OrchestraVoice {
  category: EarthCategory;
  /** Plays one note into `out`. Must settle at exactly `note.hz` (the pitch-identity test checks ≤ 1 cent). */
  note(ctx: BaseAudioContext, out: AudioNode, note: OrchestraNote): OrchestraNoteHandle;
}

/** What ART exports and DATA wires to at integration. */
export interface OrchestraApi {
  /** A record's Earth system, from the generated category table; null = not classified (never guessed). */
  getCategory(recordId: string): EarthCategory | null;
  /** The instrument family for a category. */
  orchestraVoice(category: EarthCategory): OrchestraVoice;
}
