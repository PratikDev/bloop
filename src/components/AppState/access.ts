import { FLAGS } from "@/lib/flags";

export const SPEECH_MODES = ["screenReader", "voice", "off"] as const;
export type SpeechMode = (typeof SPEECH_MODES)[number];

export const VERBOSITIES = ["brief", "standard", "detailed"] as const;
export type Verbosity = (typeof VERBOSITIES)[number];

export const CHANNELS = ["both", "text", "sound"] as const;
export type Channels = (typeof CHANNELS)[number];

export const BRAILLE_LINES = ["full", "short"] as const;
export type BrailleLines = (typeof BRAILLE_LINES)[number];

export interface AccessChoices {
  speechMode: SpeechMode;
  verbosity: Verbosity;
  channels: Channels;
  brailleLines: BrailleLines;
}
export type AccessKey = keyof AccessChoices;

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

export function speechOut(s: Routing, core: boolean = FLAGS.speechChoices): SpeechMode {
  if (core) return s.speechMode;
  return s.builtInVoice ? "voice" : "screenReader";
}

export const stepText = (s: Pick<AccessChoices, "channels">, core: boolean = FLAGS.speechChoices) => !core || s.channels !== "sound";

export const stepSound = (s: Pick<AccessChoices, "channels">, core: boolean = FLAGS.speechChoices) => !core || s.channels !== "text";
