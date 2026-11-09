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
| T time step | T opens Then vs Now | keep T; time step is **PageUp / PageDown** (Listen: steps through the storm time-lapse's half-hourly rain frames at the needle; PageUp newer) |
| 1–9 layout | iSonic used the numpad | the number row, in numpad layout (7 8 9 = north row, 1 2 3 = south row); each further number narrows the view inside the last region, J again starts from the whole map |
| D on the Turntable | Shift+D focuses the dock there | the Turntable keeps D = Describe on/off and Shift+D = dock; describe-here is on the map |
| L Context Lens | L plays the legend | keep L; the lens is **Z**, resized with **[ / ]** on the map (they only mean speed on the Turntable) |
| Alt+L low-vision preset | free | Alt+L (checked against NVDA/JAWS/browser defaults before use) |

## Screen-reader key check (before binding, step 2)

Sources: NVDA 2026.3's own key list (`D:\Jukebox\tools\nvda\documentation\en\keyCommands.html`, user guide "Single
Letter Navigation") and Freedom Scientific's JAWS keystrokes PDF
(`freedomscientific.com/Content/Documents/Manuals/JAWS/Keystrokes.pdf`, pages 3–5 and 13).

**Why the map's keys reach it at all.** The map is one `role="application"` widget. NVDA switches to focus mode when it
gets focus ("almost all keys are passed to the control"); JAWS's auto forms mode does the same. Browse-mode quick keys
only act in browse mode / the virtual cursor, so they never fire while the map has focus. If a user forces browse mode
on the map (NVDA+Space, or JAWS with forms mode off), every single-letter key below goes to the screen reader instead,
as the existing S, M, D, C, T, L, P, X, U, H, B already do. Help says so.

| Key | NVDA browse mode | JAWS virtual cursor | Always taken (any mode) | Decision |
|---|---|---|---|---|
| `+` / `=` (main keys) | none | none | no | **bind**: cell size up |
| `-` (main keys) | none | dash = next separator | no | **bind**: cell size down (passes in forms mode) |
| numpad `+` / `−` | numpad + = say all with review (NumLock off) | NumPad Plus = PC cursor / exit forms mode; NumPad Minus = JAWS cursor | **yes, JAWS** | accepted only if they arrive; never the documented key |
| numpad 1–9 | review cursor (NumLock off) | — | yes, NVDA desktop layout | **not used**; the 3×3 jump is J then the number row |
| `J` | none | J = jump to line | no | **bind**: regions prefix |
| `1`–`9` (number row) | headings 1–9 | headings 1–6 | no | keep 1–3 tracks; 1–9 only after J |
| `.` | none (comma is "past end of container") | Shift+period = next element; plain period free | no | **bind**: back to the previous place |
| PageUp / PageDown | none | change voice rate during Say All only | no | **bind**: time step |
| `D` / Shift+`D` | landmark next / previous | D = next different element | no | **bind** (passes in focus/forms mode) |
| `H` | heading | heading | no | already bound (help, map focus only) |
| Shift+`P` | previous paragraph | previous paragraph | no | **bind** (step 5): the record's provenance line |
| `N` | non-linked text | skip past links | no | **bind** (step 6): the sonar |

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

Added by the user on 9 Nov 2026, in this order after step 9:

10. Low vision, Part 4 in full, nothing skipped: the Context Lens (Z; [ and ] resize) with its value, mini scale and
    overview inset; banding and re-colour with legends and the "re-coloured" label; thick coastlines and city labels;
    themes, text size, spacing, fonts; calm view, compact centre, point of regard; the Alt+L preset. (Step 8 builds
    it; this item is the check that every part of Part 4 exists and is tested.)
11. Braille Data Explorer on Then vs Now: the shape line shows the yearly series for the selected part and city
    (shared scale, MAIDR bands), the caret is the year, R reviews the value with its confidence interval. Same tests as
    the existing braille suite.
12. Every new description and stat line gets a braille-safe short form (the src/a11y/brailleText.ts rules).

Tests per the spec, desktop Chromium + Firefox, 3D shown and hidden; axe zero serious.
