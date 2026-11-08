# Accessibility core: build plan

From `remaining features/CLAUDE_CODE_PROMPT_accessibility_core.md`. Decisions agreed on 8 Nov 2026: built after the
mentor fixes, before Ask Bloop, on `bloop-dev`, one commit per feature, **desktop website only**. Part 2 (phone touch
mode, Android vibration), TalkBack and the mobile Playwright runs are **not built** (listed in the final report).

## What already exists (extend, don't duplicate)

| Spec item | Exists as | Gap |
|---|---|---|
| One status region | `Announcer` (one polite `aria-live` region, 300 ms debounce, braille-safe text) | `role="status"`, 250 ms, tone-then-text order |
| Typing guard | `src/a11y/keys.ts` `isTypingTarget` | none |
| Map keys | `ExploreControls/use-map-keys.ts` (arrows, Shift+arrow, 1–3 tracks, Enter, Space, S, M, D, C, T, L, P, X, U, H, B) | +/−, J+1–9, ., PageUp/Down, D describe-here |
| Describe | `describe` setting (D), caption bar | layered templates, verbosity |
| Search places | Turntable `SearchBox` + gazetteer | region tree on Listen |
| Provenance line | How we got this (item 11) | spoken one-liner per record |
| Hide 3D | e2e `HIDE_3D` init script only | a user setting |

## Key clashes resolved

| Spec key | Existing | Resolution |
|---|---|---|
| 1–9 jump to a 3×3 region | 1/2/3 choose Ocean/Rain/Both | keep 1–3; region jump is **J then 1–9** (J is free) |
| D describe here | D toggles continuous Describe | **D** describes here once; continuous Describe moves to **Shift+D** |
| T time step | T opens Then vs Now | keep T; time step is **PageUp / PageDown** |
| L Context Lens | L plays the legend | keep L; the lens is **Z**, resized with **[ / ]** on the map (they only mean speed on the Turntable) |
| Alt+L low-vision preset | free | Alt+L (checked against NVDA/JAWS/browser defaults before use) |

## Order (one commit each, each with its tests)

1. Status region conformance + speech mode (screen reader / Bloop's voice / off) + verbosity + text/sound/both.
2. Map widget keys (+/−, J+1–9, ., PageUp/Down, D, Shift+D), hide-3D setting, help while focused.
3. Layered descriptions (templates EN + BN, pattern rules, digit-provenance test), D describe-here.
4. View as table for every record; region tree + jump to place.
5. Track 0 Tuning + spoken provenance line.
6. Compare two dates + sonar; expedition log (.txt).
7. Timed text tracks (WebVTT), sound captions, transcript page per record, export alt text sidecars.
8. Low vision: themes + OS preferences + focus; text size, spacing, fonts; banding + re-colour + legends; Context Lens;
   calm view, compact centre, point of regard; the preset.
9. Docs: `ACCESSIBILITY.md`, `MANUAL_TESTS.md`, `RESULTS.md` (NVDA log method, run with the user off the PC).

Tests per the spec, desktop Chromium + Firefox, 3D shown and hidden; axe zero serious.
