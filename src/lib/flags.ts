// Feature flags. NEXT_PUBLIC_<NAME>=1 turns a flag on and =0 off. Unset, a flag is on only once its feature works in
// this design and its tests pass (`ready`); NEXT_PUBLIC_BLOOP_PREVIEW=1 shows every feature, ready or not.
// Next inlines NEXT_PUBLIC_ variables only where they are read by their full name, so each flag reads its own.

const PREVIEW = process.env.NEXT_PUBLIC_BLOOP_PREVIEW === "1";

/** A flag's value: the variable when set, else on in a preview, and otherwise once `ready`. */
export function flag(value: string | undefined, ready: boolean, preview: boolean = PREVIEW): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return preview || ready;
}

export const FLAGS = {
  /** Accessibility core, step 1: speech mode, verbosity, text/sound/both (docs/accessibility/CORE_PLAN.md). */
  // Ready on 8 Nov 2026: e2e/a11y/speech-choices.e2e.ts 10/10 and the whole suite 250/250 with it on.
  speechChoices: flag(process.env.NEXT_PUBLIC_A11Y_SPEECH, false),
  /** Step 2: the map widget's keys (+/−, J then 1–9, ., PageUp/PageDown, D, Shift+D), hide 3D, help while focused. */
  /** Step 3: layered descriptions (EN + BN templates, pattern rules, digit provenance); D says one; a Description tab. */
  // Ready on 8 Nov 2026: descriptions.e2e.ts 20/20, the a11y + features + health checks 292/292 with it on (Chromium +
  // Firefox); the digit-provenance test runs in every build.
  /** Step 4: "View as table" (values around the needle) and Places (search, continent → country → division). */
  // Ready on 9 Nov 2026: table-places.e2e.ts 20/20, the a11y + features + health checks 312/312 with it on (Chromium +
  // Firefox).
  /** Step 5: Track 0 "Tuning" (anchors, reference tone, sound grammar) and the spoken provenance line (Shift+P). */
  // Ready on 9 Nov 2026: tuning.e2e.ts 16/16, the a11y + features + health checks 328/328 with it on (Chromium + Firefox;
  // one Official record timed out once and passed on rerun).
  /** Step 6: Compare two dates (beating tones, exact difference), the sonar (N), the expedition log (.txt). */
  // Ready on 9 Nov 2026: expedition.e2e.ts 12/12, the a11y + features + health checks 340/340 with it on (Chromium +
  // Firefox).
  /** Step 7: timed text tracks (WebVTT) for the sweep and the time-lapse, sound captions, a transcript page per record,
   *  alt text with exports. */
  // Ready on 9 Nov 2026: timed-text.e2e.ts 22/22, the a11y + features + health checks 414/414 with steps 7 and 8 on
  // (Chromium + Firefox).
  timedText: flag(process.env.NEXT_PUBLIC_A11Y_TIMED_TEXT, false),
  /** Step 8: low-vision mode (themes and OS preferences, text and spacing, re-coloured bands and legends, the Context
   *  Lens, calm view, compact centre, point of regard, the Alt+L preset). */
  // Ready on 9 Nov 2026: low-vision.e2e.ts 26/26 (Part 4 in full, plan item 10), the a11y + features + health checks
  // 414/414 with steps 7 and 8 on (Chromium + Firefox).
  lowVision: flag(process.env.NEXT_PUBLIC_A11Y_LOW_VISION, false),
  /** Ask Bloop (docs/voice/README.md): the panel, typed commands and questions (parser only). */
  // Ready on 11 Nov 2026: e2e/ask-bloop.e2e.ts 16/16 and e2e/data/ask in the integrated final pass (Chromium + Firefox).
  askBloop: flag(process.env.NEXT_PUBLIC_ASK_BLOOP, false),
  /** Ask Bloop's push-to-talk: only when asked for, until the gate test (docs/voice/GATE_TEST.md) passes. */
  askBloopVoice: process.env.NEXT_PUBLIC_ASK_BLOOP_VOICE === "1",
  /** Ask Bloop's AI fallback: only when asked for, and only with a deployed route (deploy/ask-intent). */
  askBloopLlm: process.env.NEXT_PUBLIC_ASK_BLOOP_LLM === "1",
  expedition: flag(process.env.NEXT_PUBLIC_A11Y_EXPEDITION, false),
  tuning: flag(process.env.NEXT_PUBLIC_A11Y_TUNING, false),
  tablePlaces: flag(process.env.NEXT_PUBLIC_A11Y_TABLE_PLACES, false),
  describe: flag(process.env.NEXT_PUBLIC_A11Y_DESCRIBE, false),
  // Ready on 8 Nov 2026: e2e/a11y/map-keys.e2e.ts 26/26 and the whole suite 406/406 with it on (Chromium + Firefox).
  mapKeys: flag(process.env.NEXT_PUBLIC_A11Y_MAP_KEYS, false),
  // CV/ML build (docs/cvml/BUILD.md). Ready on 11 Nov 2026 after the integrated final pass (docs/BUILD_2026-11-10.md).
  // The chord stays opt-in: cvChord makes it available, the listener turns it on. Tests that pass with each on are listed beside it.
  /** A: "What the jukebox read from this frame" panel + cents error budget (Listen, Official records). */
  // Passing: src/lib/cv/*.test.ts, pipeline/tests/test_box_stats.py + test_error_budget.py, e2e/cv/read-panel.e2e.ts.
  cvRead: flag(process.env.NEXT_PUBLIC_CV_READ, false),
  /** B: the value chord (its toggle in the panel and Settings; the layer is src/lib/audio/layers/chord). Needs cvRead. */
  // Passing: src/lib/audio/layers/chord/*.test.ts (T1), pipeline/tests/test_colormap_invariance.py (T2),
  // e2e/cv/chord.e2e.ts.
  cvChord: flag(process.env.NEXT_PUBLIC_CV_CHORD, false),
  /** C: the "Same chord, whatever the colours" card on How we know (T2's outputs). */
  // Passing: src/lib/cv/same-chord.test.ts, e2e/cv/same-chord-card.e2e.ts.
  cvCard: flag(process.env.NEXT_PUBLIC_CV_CARD, false),
  /** E: the two chord tasks in /listen-test (variety, one group or two). */
  // Passing: src/lib/listen-test/chord/chord-tasks.test.ts, e2e/cv/listen-test-chord.e2e.ts, e2e/mentor/item08.
  cvListenTest: flag(process.env.NEXT_PUBLIC_CV_LISTEN_TEST, false),
  /** P1: the leftovers: the 5176 picture under the normal tone, live validation in the provenance, "Not playable". */
  // e2e/data/leftovers.e2e.ts + src/lib/earth/leftovers.test.ts.
  dataLeftovers: flag(process.env.NEXT_PUBLIC_DATA_LEFTOVERS, false),
  /** P2a: tomorrow's fire weather (SVS 5315): the chord layer on Listen, the archive replay. */
  // e2e/data/fire.e2e.ts + src/lib/earth/fwi.test.ts.
  dataFireWeather: flag(process.env.NEXT_PUBLIC_DATA_FIRE_WEATHER, false),
  /** P2b + P2c: Fire Geiger (FIRMS daily) and the "Fires and fire weather" record in Official records. */
  // e2e/data/fire.e2e.ts + src/lib/earth/geiger.test.ts.
  dataWildfires: flag(process.env.NEXT_PUBLIC_DATA_WILDFIRES, false),
  /** P3: landslide exposure rumble (SVS 5584, LHASA). */
  // e2e/data/landslides.e2e.ts + src/lib/earth/landslide.test.ts.
  dataLandslides: flag(process.env.NEXT_PUBLIC_DATA_LANDSLIDES, false),
  /** P4: night lights (Black Marble VJ146A2): a voice per city, gaps as rests. */
  // e2e/data/night-lights.e2e.ts + src/lib/earth/nightlights.test.ts.
  dataNightLights: flag(process.env.NEXT_PUBLIC_DATA_NIGHT_LIGHTS, false),
  /** P5: NASA's own method (Caldwell 73, SVS 13786): NASA mode vs Bloop mode on one frame. */
  // e2e/data/radar.e2e.ts + src/lib/earth/radar.test.ts.
  dataRadar: flag(process.env.NEXT_PUBLIC_DATA_RADAR, false),
  /** Ask Bloop's four DATA questions (fire weather, fires, landslides, night lights here); needs askBloop too. */
  // e2e/data/ask.e2e.ts + src/lib/ask-bloop/data-intents.test.ts.
  dataAsk: flag(process.env.NEXT_PUBLIC_DATA_ASK, false),
  // Art, emotion and musicality. Ready on 11 Nov 2026 after the integrated final pass
  // (docs/BUILD_2026-11-10.md).
  // Passing on 10 Nov 2026 (production build, every NEXT_PUBLIC_ART_* on): unit 508/508; e2e/art 21/21 Chromium and
  // 21/21 Firefox (orchestra 6, dial 7, raw-pixel 2, pieces 6: letter, lifetime, choices, tour, journey, listen test);
  // the existing suites with them on: e2e/a11y 95/95 Chromium and 95/95 Firefox (dock-fit included), e2e/features.e2e.ts
  // 53/53 Chromium and 53/53 Firefox.
  /** Earth Orchestra: an instrument family per Earth system, the Instrument style setting, the category earcon, the
   *  Official grid grouped by category, the legend card. */
  artOrchestra: flag(process.env.NEXT_PUBLIC_ART_ORCHESTRA, false),
  /** The Science ↔ Art dial (Measure / Blend / Music), its data-voice check and the season colour of the drone. */
  artDial: flag(process.env.NEXT_PUBLIC_ART_DIAL, false),
  /** Raw-pixel vs Bloop: the naive scan and Bloop's, with measured flatness, entropy and roughness. */
  artRawPixel: flag(process.env.NEXT_PUBLIC_ART_RAW_PIXEL, false),
  /** A letter to the future: a dated card built only from data (Listen, the tour's end). */
  artLetter: flag(process.env.NEXT_PUBLIC_ART_LETTER, false),
  /** "Your lifetime" on Then vs Now, and the MIDI export (Then vs Now, Your lifetime). */
  artLifetime: flag(process.env.NEXT_PUBLIC_ART_LIFETIME, false),
  /** Data vs artistic choice per record (About this sound, Official records) and the tour naming every dataset. */
  artChoices: flag(process.env.NEXT_PUBLIC_ART_CHOICES, false),
  /** Water's journey: the Bangladesh suite (and its WAV). */
  artJourney: flag(process.env.NEXT_PUBLIC_ART_JOURNEY, false),
  /** /listen-test: the emotion ratings and the ear-vs-eye task after the five core tasks. */
  artListenTest: flag(process.env.NEXT_PUBLIC_ART_LISTEN_TEST, false),
} as const;
