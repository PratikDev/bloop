// How Bloop speaks and which channels fire. The value
// lists here are the one source for the state's types, the saved prefs and the settings' choices.
import { FLAGS } from "@/lib/flags";

/** Where Bloop's spoken lines go: the screen reader (the status region, default), Bloop's own voice, or nowhere. */
export const SPEECH_MODES = ["screenReader", "voice", "off"] as const;
export type SpeechMode = (typeof SPEECH_MODES)[number];

/** How much a description or answer says (layered descriptions). */
export const VERBOSITIES = ["brief", "standard", "detailed"] as const;
export type Verbosity = (typeof VERBOSITIES)[number];

/** Which channels fire on each step of the needle (MAIDR's idea): the text (status region), the sound, or both. */
export const CHANNELS = ["both", "text", "sound"] as const;
export type Channels = (typeof CHANNELS)[number];

/** What a braille display gets from the status region: the full lines, or each new description and
 *  stat line's short form (one 40-cell line; src/a11y/shortForms.ts). The full line stays in the app either way (caption bar with sound on, Description tab, log). */
export const BRAILLE_LINES = ["full", "short"] as const;
export type BrailleLines = (typeof BRAILLE_LINES)[number];

export interface AccessChoices {
  speechMode: SpeechMode;
  verbosity: Verbosity;
  channels: Channels;
  brailleLines: BrailleLines;
}
export type AccessKey = keyof AccessChoices;

/** Each choice's allowed values (prefs reject anything else). */
export const ACCESS_VALUES: { [K in AccessKey]: readonly AccessChoices[K][] } = {
  speechMode: SPEECH_MODES,
  verbosity: VERBOSITIES,
  channels: CHANNELS,
  brailleLines: BRAILLE_LINES,
};

export const ACCESS_DEFAULTS: AccessChoices = { speechMode: "screenReader", verbosity: "standard", channels: "both", brailleLines: "full" };

interface Routing extends AccessChoices {
  builtInVoice: boolean;
}

/**
 * Where a spoken line goes. With the accessibility core on, the speech mode decides; with it off, the app's original
 * two-way setting does (built-in voice, else the live region), so nothing changes until the flag is on.
 */
export function speechOut(s: Routing, core: boolean = FLAGS.speechChoices): SpeechMode {
  if (core) return s.speechMode;
  return s.builtInVoice ? "voice" : "screenReader";
}

/** Whether a step of the needle sends its reading as text (the status region). */
export const stepText = (s: Pick<AccessChoices, "channels">, core: boolean = FLAGS.speechChoices) => !core || s.channels !== "sound";

/** Whether a step of the needle plays the live sound. */
export const stepSound = (s: Pick<AccessChoices, "channels">, core: boolean = FLAGS.speechChoices) => !core || s.channels !== "text";
