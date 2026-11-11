// Feature flags. NEXT_PUBLIC_<NAME>=1 turns a flag
// on and =0 off. Unset, a flag is on in development and in Vercel preview builds, and in production only once its
// feature's tests pass (`ready`), so the app stays recordable while a feature is being built.
// Next inlines NEXT_PUBLIC_ variables only where they are read by their full name, so each flag reads its own.

/** Vercel sets NEXT_PUBLIC_VERCEL_ENV ("production" | "preview" | "development") when system variables are exposed. */
const PREVIEW = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

/** A flag's value: the variable when set, else on in dev/preview, and in production once `ready`. */
export function flag(value: string | undefined, ready: boolean, preview: boolean = PREVIEW): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return preview || ready;
}

export const FLAGS = {
  /** Speech mode, verbosity, text/sound/both. */
  speechChoices: flag(process.env.NEXT_PUBLIC_A11Y_SPEECH, true),
  /** The map widget's keys (+/−, J then 1–9, ., PageUp/PageDown, D, Shift+D), hide 3D, help while focused. */
  /** Layered descriptions (EN + BN templates, pattern rules, digit provenance); D says one; a Description tab. */
  /** Step 4: "View as table" (values around the needle) and Places (search, continent → country → division). */
  /** Track 0 "Tuning" (anchors, reference tone, sound grammar) and the spoken provenance line (Shift+P). */
  /** Compare two dates (beating tones, exact difference), the sonar (N), the expedition log (.txt). */
  /** Timed text tracks (WebVTT) for the sweep and the time-lapse, sound captions, a transcript page per record,
   *  alt text with exports. */
  timedText: flag(process.env.NEXT_PUBLIC_A11Y_TIMED_TEXT, true),
  /** Low-vision mode (themes and OS preferences, text and spacing, re-coloured bands and legends, the Context
   *  Lens, calm view, compact centre, point of regard, the Alt+L preset). */
  lowVision: flag(process.env.NEXT_PUBLIC_A11Y_LOW_VISION, true),
  /** Ask Bloop: the panel, typed commands and questions (parser only). */
  askBloop: flag(process.env.NEXT_PUBLIC_ASK_BLOOP, true),
  /** Ask Bloop's push-to-talk: only when asked for, until the gate test (docs/voice/GATE_TEST.md) passes. */
  askBloopVoice: process.env.NEXT_PUBLIC_ASK_BLOOP_VOICE === "1",
  /** Ask Bloop's AI fallback: only when asked for, and only with a deployed route (deploy/ask-intent). */
  askBloopLlm: process.env.NEXT_PUBLIC_ASK_BLOOP_LLM === "1",
  expedition: flag(process.env.NEXT_PUBLIC_A11Y_EXPEDITION, true),
  tuning: flag(process.env.NEXT_PUBLIC_A11Y_TUNING, true),
  tablePlaces: flag(process.env.NEXT_PUBLIC_A11Y_TABLE_PLACES, true),
  describe: flag(process.env.NEXT_PUBLIC_A11Y_DESCRIBE, true),
  mapKeys: flag(process.env.NEXT_PUBLIC_A11Y_MAP_KEYS, true),
  // CV/ML (docs/cvml/BUILD.md). The chord stays opt-in: cvChord makes it available, the listener turns it on.
  /** A: "What the jukebox read from this frame" panel + cents error budget (Listen, Official records). */
  // Tests: src/lib/cv/*.test.ts, pipeline/tests/test_box_stats.py + test_error_budget.py, qa/e2e/cv/read-panel.e2e.ts.
  cvRead: flag(process.env.NEXT_PUBLIC_CV_READ, true),
  /** The value chord (its toggle in the panel and Settings; the layer is src/lib/audio/layers/chord). Needs cvRead. */
  // Tests: src/lib/audio/layers/chord/*.test.ts (T1), pipeline/tests/test_colormap_invariance.py (T2),
  // qa/e2e/cv/chord.e2e.ts.
  cvChord: flag(process.env.NEXT_PUBLIC_CV_CHORD, true),
  /** The "Same chord, whatever the colours" card on How we know (T2's outputs). */
  // Tests: src/lib/cv/same-chord.test.ts, qa/e2e/cv/same-chord-card.e2e.ts.
  cvCard: flag(process.env.NEXT_PUBLIC_CV_CARD, true),
  /** The two chord tasks in /listen-test (variety, one group or two). */
  // Tests: src/lib/listen-test/chord/chord-tasks.test.ts, qa/e2e/cv/listen-test-chord.e2e.ts, qa/e2e/mentor/item08.
  cvListenTest: flag(process.env.NEXT_PUBLIC_CV_LISTEN_TEST, true),
  // Every shipped dataset in the app. The tests for each flag are listed beside it.
  /** The leftovers: the 5176 picture under the normal tone, live validation in the provenance, "Not playable". */
  // qa/e2e/data/leftovers.e2e.ts + src/lib/earth/leftovers.test.ts.
  dataLeftovers: flag(process.env.NEXT_PUBLIC_DATA_LEFTOVERS, true),
  /** Tomorrow's fire weather (SVS 5315): the chord layer on Listen, the archive replay. */
  // qa/e2e/data/fire.e2e.ts + src/lib/earth/fwi.test.ts.
  dataFireWeather: flag(process.env.NEXT_PUBLIC_DATA_FIRE_WEATHER, true),
  /** Fire Geiger (FIRMS daily) and the "Fires and fire weather" record in Official records. */
  // qa/e2e/data/fire.e2e.ts + src/lib/earth/geiger.test.ts.
  dataWildfires: flag(process.env.NEXT_PUBLIC_DATA_WILDFIRES, true),
  /** Landslide exposure rumble (SVS 5584, LHASA). */
  // qa/e2e/data/landslides.e2e.ts + src/lib/earth/landslide.test.ts.
  dataLandslides: flag(process.env.NEXT_PUBLIC_DATA_LANDSLIDES, true),
  /** Night lights (Black Marble VJ146A2): a voice per city, gaps as rests. */
  // qa/e2e/data/night-lights.e2e.ts + src/lib/earth/nightlights.test.ts.
  dataNightLights: flag(process.env.NEXT_PUBLIC_DATA_NIGHT_LIGHTS, true),
  /** NASA's own method (Caldwell 73, SVS 13786): NASA mode vs Bloop mode on one frame. */
  // qa/e2e/data/radar.e2e.ts + src/lib/earth/radar.test.ts.
  dataRadar: flag(process.env.NEXT_PUBLIC_DATA_RADAR, true),
  /** Ask Bloop's four DATA questions (fire weather, fires, landslides, night lights here); needs askBloop too. */
  // qa/e2e/data/ask.e2e.ts + src/lib/ask-bloop/data-intents.test.ts.
  dataAsk: flag(process.env.NEXT_PUBLIC_DATA_ASK, true),
  // Art, emotion and musicality.
  /** Earth Orchestra: an instrument family per Earth system, the Instrument style setting, the category earcon, the
   *  Official grid grouped by category, the legend card. */
  artOrchestra: flag(process.env.NEXT_PUBLIC_ART_ORCHESTRA, true),
  /** The Science ↔ Art dial (Measure / Blend / Music), its data-voice check and the season colour of the drone. */
  artDial: flag(process.env.NEXT_PUBLIC_ART_DIAL, true),
  /** Raw-pixel vs Bloop: the naive scan and Bloop's, with measured flatness, entropy and roughness. */
  artRawPixel: flag(process.env.NEXT_PUBLIC_ART_RAW_PIXEL, true),
  /** A letter to the future: a dated card built only from data (Listen, the tour's end). */
  artLetter: flag(process.env.NEXT_PUBLIC_ART_LETTER, true),
  /** "Your lifetime" on Then vs Now, and the MIDI export (Then vs Now, Your lifetime). */
  artLifetime: flag(process.env.NEXT_PUBLIC_ART_LIFETIME, true),
  /** Data vs artistic choice per record (About this sound, Official records) and the tour naming every dataset. */
  artChoices: flag(process.env.NEXT_PUBLIC_ART_CHOICES, true),
  /** Water's journey: the Bangladesh suite (and its WAV). */
  artJourney: flag(process.env.NEXT_PUBLIC_ART_JOURNEY, true),
  /** /listen-test: the emotion ratings and the ear-vs-eye task after the five core tasks. */
  artListenTest: flag(process.env.NEXT_PUBLIC_ART_LISTEN_TEST, true),
} as const;
