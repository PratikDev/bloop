# Test results: accessibility core

What was run, on what, and what it gave. What each feature does: [ACCESSIBILITY.md](ACCESSIBILITY.md). Tests that need a
person: [MANUAL_TESTS.md](MANUAL_TESTS.md). Plan: [CORE_PLAN.md](CORE_PLAN.md).

**Machine:** Windows 11, desktop. **Browsers:** Playwright's Chromium (on the GPU, flags in `playwright.config.ts`) and
Firefox, desktop viewports (1280 × 720 unless a test sets another). **Build:** `bun run build` with every step's flag
on, served from `out/` by `python pipeline/health/static_server.py out 3210`, checked with `BLOOP_URL=http://localhost:3210`.

## How to run them

```sh
bun test                                   # unit tests
NEXT_PUBLIC_A11Y_TIMED_TEXT=1 NEXT_PUBLIC_A11Y_LOW_VISION=1 bun run build
python pipeline/health/static_server.py out 3210
BLOOP_URL=http://localhost:3210 bunx playwright test e2e/a11y/low-vision.e2e.ts                      # one step's file
BLOOP_URL=http://localhost:3210 bunx playwright test e2e/a11y e2e/features e2e/features.e2e.ts e2e/health-records.e2e.ts   # the regression
```

## Per step

Each step's own browser file, in both browsers, 3D shown and hidden where the step touches the map.

| Step | What | File | Result | Date |
|---|---|---|---|---|
| 1 | Status region, speech mode, verbosity, channels | `e2e/a11y/speech-choices.e2e.ts` | 10/10 | 8 Nov 2026 |
| 2 | Map widget keys, hide 3D, help while focused | `e2e/a11y/map-keys.e2e.ts` | 26/26 | 8 Nov 2026 |
| 3 | Layered descriptions, D | `e2e/a11y/descriptions.e2e.ts` | 20/20 | 8 Nov 2026 |
| 4 | View as table, Places | `e2e/a11y/table-places.e2e.ts` | 20/20 | 9 Nov 2026 |
| 5 | Track 0 Tuning, provenance line | `e2e/a11y/tuning.e2e.ts` | 16/16 | 9 Nov 2026 |
| 6 | Compare two dates, sonar, expedition log | `e2e/a11y/expedition.e2e.ts` | 12/12 | 9 Nov 2026 |
| 7 | Timed text, sound captions, transcripts, tactile alt text | `e2e/a11y/timed-text.e2e.ts` | 22/22 | 9 Nov 2026 |
| 8 + item 10 | Low vision, Part 4 in full | `e2e/a11y/low-vision.e2e.ts` | 26/26 Chromium, 26/26 Firefox | 9 Nov 2026 |

Step 8's file checks: the Alt+L preset (said once, remembered); the Context Lens (value, scale with the needle's band,
overview, band labels that match the decoded values, follows keyboard moves, Z and [ ], a chosen corner, docked in the
page); every re-colour scheme with its legend and the "re-coloured" label, NASA's colours one press away; band labels on
the map against the decoded grid; thick coastlines and city labels (Dhaka, Chattogram, the needle's place); reflow at
320 px with no sideways scroll; WCAG 1.4.12 spacing with no clipped text; text at least 7:1, focus ring 3 px and 3:1,
the needle's outlines 3:1, in both high-contrast themes; 44 px targets in extra-large; point of regard after 300% text
and after zoom; calm view and reduced motion; forced colours; no title-attribute tooltips; Help, About this sound and
How we got this in the page (no dialogs), Escape back to the opener, axe clean; the preset in Track 0; the settings
panel (inline, axe clean, custom-theme warning, Atkinson); speaking on dwell; and, with no low-vision settings, the
layout unchanged (one screen, one-row dock, nothing under the header).

## Unit tests

`bun test`: **414/414** on 9 Nov 2026 (templates in each detail level in English and Bangla, the digit-provenance test,
pattern rules, the status-region debounce, WebVTT writing and parsing, sound captions, tactile alt text, low-vision
bands and labels (including the lens's region), settings and theme contrast, the Bangla translation list, and Ask
Bloop's registry, parser and places).

## The regression (steps 7 and 8 together)

`e2e/a11y`, `e2e/features`, `e2e/features.e2e.ts`, `e2e/health-records.e2e.ts`, Chromium + Firefox, one run against
one build with every flag on, 9 Nov 2026: **414/414**. The first pass had 392 passing and 22 failing, all one cause in
the tests: `getByRole("button", { name: "Settings" })` is a substring match and also found step 8's "Low-vision
settings" button (Playwright's strict mode). The selector became exact (`e2e/lib/app.ts`), and the 22 passed on the
same build (`--last-failed`).

Earlier full runs: 250/250 (step 1), 406/406 (step 2, the whole suite), 292/292 (step 3), 312/312 (step 4), 328/328 (step 5), 340/340 (step 6).

## Problems found and fixed in step 8's checks

- The sticky sound dock covered buttons when a low-vision layout scrolled: Listen's one-screen layout stayed on and
  spilled past the page. Low-vision layouts now keep Listen in one column; scrolled-to content stops above the dock's
  measured height; a dock taller than a quarter of the screen stops sticking.
- Sideways scroll at 320 px: the dock's action row and the legend's "Show NASA's original colours" button did not wrap;
  the lens could be wider than the screen.
- The focus ring read 0 px: a real app bug, not the test. Buttons' `transition-all` grew the outline over 150 ms; the
  ring now appears at once.
- The header's language button carried a hover-only `title`.
- Found by the new layout checks, older than step 8: in Both mode on wide screens the Listen title rode up over the
  site header (its head was one line high but held the frame-gap note and its "How we got this" button); and a
  visually hidden label in the side panel stretched the page by 101 px. Both fixed.

## NVDA (log method)

Not run yet: it needs the PC to be left alone for about ten minutes (`tests/nvda/run.ts`, `tests/nvda/keys.ps1`).

## Not tested

JAWS, VoiceOver, TalkBack, phones (not built: desktop website only). Manual Magnifier and low-vision user checks:
MANUAL_TESTS.md, to be recorded here when they happen.
