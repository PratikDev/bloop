// Feature flags for the remaining-features build (docs/accessibility/CORE_PLAN.md). NEXT_PUBLIC_<NAME>=1 turns a flag
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
  /** Accessibility core, step 1: speech mode, verbosity, text/sound/both (docs/accessibility/CORE_PLAN.md). */
  // Ready on 8 Nov 2026: e2e/a11y/speech-choices.e2e.ts 10/10 and the whole suite 250/250 with it on.
  speechChoices: flag(process.env.NEXT_PUBLIC_A11Y_SPEECH, true),
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
  timedText: flag(process.env.NEXT_PUBLIC_A11Y_TIMED_TEXT, true),
  /** Step 8: low-vision mode (themes and OS preferences, text and spacing, re-coloured bands and legends, the Context
   *  Lens, calm view, compact centre, point of regard, the Alt+L preset). */
  // Ready on 9 Nov 2026: low-vision.e2e.ts 26/26 (Part 4 in full, plan item 10), the a11y + features + health checks
  // 414/414 with steps 7 and 8 on (Chromium + Firefox).
  lowVision: flag(process.env.NEXT_PUBLIC_A11Y_LOW_VISION, true),
  /** Ask Bloop (docs/voice/README.md): the panel, typed commands and questions (on in dev and preview). */
  askBloop: flag(process.env.NEXT_PUBLIC_ASK_BLOOP, false),
  /** Ask Bloop's push-to-talk: only when asked for, until the gate test (docs/voice/GATE_TEST.md) passes. */
  askBloopVoice: process.env.NEXT_PUBLIC_ASK_BLOOP_VOICE === "1",
  /** Ask Bloop's AI fallback: only when asked for, and only with a deployed route (deploy/ask-intent). */
  askBloopLlm: process.env.NEXT_PUBLIC_ASK_BLOOP_LLM === "1",
  expedition: flag(process.env.NEXT_PUBLIC_A11Y_EXPEDITION, true),
  tuning: flag(process.env.NEXT_PUBLIC_A11Y_TUNING, true),
  tablePlaces: flag(process.env.NEXT_PUBLIC_A11Y_TABLE_PLACES, true),
  describe: flag(process.env.NEXT_PUBLIC_A11Y_DESCRIBE, true),
  // Ready on 8 Nov 2026: e2e/a11y/map-keys.e2e.ts 26/26 and the whole suite 406/406 with it on (Chromium + Firefox).
  mapKeys: flag(process.env.NEXT_PUBLIC_A11Y_MAP_KEYS, true),
  // >>> CV
  // CV/ML build (docs/cvml/BUILD.md). `ready` stays false: the orchestrator turns these on in production after the
  // integrated full pass. Tests that pass with each on are listed beside it.
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
  // <<< CV
} as const;
