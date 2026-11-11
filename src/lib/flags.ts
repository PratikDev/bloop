const PREVIEW = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export function flag(value: string | undefined, ready: boolean, preview: boolean = PREVIEW): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return preview || ready;
}

export const FLAGS = {
  speechChoices: flag(process.env.NEXT_PUBLIC_A11Y_SPEECH, true),
  timedText: flag(process.env.NEXT_PUBLIC_A11Y_TIMED_TEXT, true),
  lowVision: flag(process.env.NEXT_PUBLIC_A11Y_LOW_VISION, true),
  askBloop: flag(process.env.NEXT_PUBLIC_ASK_BLOOP, true),
  askBloopVoice: process.env.NEXT_PUBLIC_ASK_BLOOP_VOICE === "1",
  askBloopLlm: process.env.NEXT_PUBLIC_ASK_BLOOP_LLM === "1",
  expedition: flag(process.env.NEXT_PUBLIC_A11Y_EXPEDITION, true),
  tuning: flag(process.env.NEXT_PUBLIC_A11Y_TUNING, true),
  tablePlaces: flag(process.env.NEXT_PUBLIC_A11Y_TABLE_PLACES, true),
  describe: flag(process.env.NEXT_PUBLIC_A11Y_DESCRIBE, true),
  mapKeys: flag(process.env.NEXT_PUBLIC_A11Y_MAP_KEYS, true),
  cvRead: flag(process.env.NEXT_PUBLIC_CV_READ, true),
  cvChord: flag(process.env.NEXT_PUBLIC_CV_CHORD, true),
  cvCard: flag(process.env.NEXT_PUBLIC_CV_CARD, true),
  cvListenTest: flag(process.env.NEXT_PUBLIC_CV_LISTEN_TEST, true),
  dataLeftovers: flag(process.env.NEXT_PUBLIC_DATA_LEFTOVERS, true),
  dataFireWeather: flag(process.env.NEXT_PUBLIC_DATA_FIRE_WEATHER, true),
  dataWildfires: flag(process.env.NEXT_PUBLIC_DATA_WILDFIRES, true),
  dataLandslides: flag(process.env.NEXT_PUBLIC_DATA_LANDSLIDES, true),
  dataNightLights: flag(process.env.NEXT_PUBLIC_DATA_NIGHT_LIGHTS, true),
  dataRadar: flag(process.env.NEXT_PUBLIC_DATA_RADAR, true),
  dataAsk: flag(process.env.NEXT_PUBLIC_DATA_ASK, true),
  artOrchestra: flag(process.env.NEXT_PUBLIC_ART_ORCHESTRA, true),
  artDial: flag(process.env.NEXT_PUBLIC_ART_DIAL, true),
  artRawPixel: flag(process.env.NEXT_PUBLIC_ART_RAW_PIXEL, true),
  artLetter: flag(process.env.NEXT_PUBLIC_ART_LETTER, true),
  artLifetime: flag(process.env.NEXT_PUBLIC_ART_LIFETIME, true),
  artChoices: flag(process.env.NEXT_PUBLIC_ART_CHOICES, true),
  artJourney: flag(process.env.NEXT_PUBLIC_ART_JOURNEY, true),
  artListenTest: flag(process.env.NEXT_PUBLIC_ART_LISTEN_TEST, true),
} as const;
