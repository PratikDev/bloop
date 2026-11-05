# Braille test protocol

This protocol is for testing Bloop's braille output with real screen readers: first in software viewers (any teammate), then on a refreshable display (the YPSA session). Record every result in the table at the end. These tests are formative: they look for problems and don't score anyone.

## Part 1. Screen-reader braille viewers (teammate, no display needed)

Install portable or trial copies on `D:` only.

### NVDA + Braille Viewer (Windows): Chrome and Firefox

1. **Get NVDA.** On the build machine, a portable NVDA 2026.3 is already in `D:\Jukebox\tools\nvda`. It has not been started yet; start it with `D:\Jukebox\tools\nvda\nvda.exe`.
   - It was created on 3 Nov 2026 with `nvda_2026.3.exe --create-portable-silent --portable-path=D:\Jukebox\tools\nvda --minimal`.
   - The launcher's signature is valid (NV Access Limited), and its SHA-256 matches the one NV Access publishes (`a8a87cb8…799b2`).
   - On another machine: download the launcher from nvaccess.org, run it and choose **Create portable copy**.
2. **Open the viewer.** In the NVDA menu (NVDA+N), choose **Tools → Braille Viewer**. In the viewer, tick **Hover for cell routing**.
3. **Check the braille settings.** Press NVDA+Ctrl+A and note **Show messages** and **Message timeout (sec)**.
4. **Run the checks with English (UEB).** Set **Output table** to *English (unified) grade 1*, then *Unified English Braille Code grade 2*. Run checks a–g below in Chrome, then in Firefox.
5. **Run the checks with Bengali.** Set **Output table** to *Bengali grade 1* (`be-in-g1.utb` in nvda.ini; `bn.tbl` is not a valid NVDA table name). Switch the app to বাংলা (Tab to the language group, then Down and Enter in browse mode) and repeat a–g. Note how numerals, দশমিক and times read.

For each check, take a screenshot of the Braille Viewer (Win+Shift+S) and save it as `docs/accessibility/screens/nvda-<browser>-<table>-<check>.png`.

| # | Do | Check |
|---|---|---|
| a | Official tab: Tab to a record card. | The card's name shows. NVDA ignores the braille label, so the full name is expected. |
| b | Explore: focus the map, press **B**. Focus lands on the shape line. | The braille cells (⣀ ⠤ ⠒ ⠉, blank) show **as the same dots**: Unicode braille passes through unchanged. Note whether it does with UEB and with Bengali. |
| c | Shift+Tab to the value line. | `SST 28.4 deg C 21.5N 89.8E …` shows and **stays**: it doesn't time out. |
| d | In the shape line, press the right arrow. Then hover (routing) a cell 5 cells along. | The needle moves (sound changes) and the value line changes when you Shift+Tab to it. Hover routing puts the caret on that cell. Compare **Text area** with **Single line** (the Shape field setting) and note which routes correctly. |
| e | Press **R**, then R again. | The value line reads in words, then returns. |
| f | Change width to 20, then 40. | The shape wraps. The ⣿ cell ends each full line. |
| g | Press Space on the map (pause or resume). | A flash message shows ("Sound paused"). Time how long it stays (expect the Message timeout). |
| h | If a jukebox code field exists by then, type `b 7` with the keyboard in focus mode. | The code is accepted. The letter keys go into the field, not to the B/R shortcuts. |

### JAWS (time-limited demo mode) with its braille viewer

Repeat a–g in Chrome and Edge. JAWS supports `aria-braillelabel`, so for check a expect the short form (e.g. `5669 Aerosols type model`). Note flash-message timing; the JAWS default is 5 s.

### VoiceOver braille panel (Mac)

In VoiceOver Utility → Braille, show the braille panel. In Safari, repeat a–f. VoiceOver supports `aria-braillelabel` and `aria-brailleroledescription`, so expect "map" and "shape" as the role names.

### TalkBack (Android)

Connect a display, or use TalkBack's braille keyboard to test input only. In Chrome, repeat checks c, d and h. Routing keys should move the caret in the shape line.

## Part 2. Real display: the YPSA session

First ask: does the participant have a refreshable braille display, and which one (cells, single-line)? If not, run Part 1's tasks with speech only and record that no display was used.

Set the explorer width to the participant's display width.

| Task | What to measure |
|---|---|
| 1. **Feel the rain shape through time** at the start point. Find the heaviest hour. | Time to answer; correct hour (check the value line); comments. |
| 2. **Read the exact value with R**, then return to the shape. | Correct value read out; whether R felt natural; comments. |
| 3. **Type a jukebox code on the braille keyboard** (Perkins keys through the screen reader). Use the code field once it exists; otherwise use the turntable search ("dhaka"). | Accepted on the first try?; time; comments. |

## Results

**Rows marked "not a screen-reader viewer test" were run without NVDA.** They are either:

- **liblouis:** the lines translated with NVDA 2026.3's own liblouis 3.39.0, table list and mode, by `tests/braille/louis_check.py`; or
- **Playwright:** the page driven in a browser, by `e2e/braille-protocol.e2e.ts`.

They show what NVDA *should* put on a display. Only a run in the Braille Viewer (or on a display) shows what it does.

Lines checked: three live records (SST along the latitude, rain through time, SST 3×3) and three official records (5669 aerosols, pattern only; 5533 air, verified CO; 5011 lightning, pattern only), plus the map's label.

| Date | Tester | Screen reader / version | Browser | Table | Check or task | Result | Screenshot | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04 | Claude Code (Playwright; **not a screen-reader viewer test**) | none | Chromium 1194, Firefox 1495 | n/a | a: what the page exposes | PASS | — | Identical in both browsers. Map: `application`, name "Both. 30.2 °C; Dry at 21.5° N, 89.8° E.", roledescription "sound map", brailleroledescription "map". Shape line: `textbox` "Shape line", aria-readonly, roledescription "braille shape", brailleroledescription "shape". Value line: read-only `textbox` "Value line". Record card: pressed `button` "Aerosols by type (model, 19 Aug 2025)", braillelabel "5669 Aerosols type model". |
| 2026-11-04 | Claude Code (Playwright; **not a screen-reader viewer test**) | none | Chromium, Firefox | n/a | b–g, browser side | PASS | — | b: B puts focus on the shape line. c: Shift+Tab reaches the value line. d: → moves the needle 89.8E → 92.5E. e: R gives "Sea surface temperature … at 21.5N 92.5E, 1 Nov 00:00 UTC, observation, stale", then R returns. f: width 20 gives 4 lines (20, 20, 20, 15), width 40 gives 2 lines (40, 33), each full line ending in ⣿. g: Space on the map puts "Sound paused" in the live region. |
| 2026-11-04 | Claude Code (liblouis; **not a screen-reader viewer test**) | none (NVDA 2026.3's liblouis 3.39.0) | lines from Chromium and Firefox | UEB grade 1 | b: Unicode braille passes through | PASS | — | 483/483 cells unchanged in 6 shape lines; every run one-to-one (no cell inserted or dropped). |
| 2026-11-04 | Claude Code (liblouis; **not a screen-reader viewer test**) | as above | as above | UEB grade 2 | b | PASS | — | 483/483 cells, one-to-one. |
| 2026-11-04 | Claude Code (liblouis; **not a screen-reader viewer test**) | as above | as above | Bengali (`bn.tbl`) | b | PASS | — | 483/483 cells, one-to-one. |
| 2026-11-04 | Claude Code (liblouis; **not a screen-reader viewer test**) | as above | as above | UEB grade 1 | c: numbers, decimals, units, N/E, times | PASS (reads as written) | — | Numeric indicator ⠼ before each number. Decimal point ⠲ (256): 30.2 → ⠼⠉⠚⠲⠃. 21.5N → ⠼⠃⠁⠲⠑⠠⠝ (a capital sign ends the number, so N/E read as letters). 10:30 → ⠼⠁⠚⠒⠼⠉⠚ (the indicator repeats after the colon). -5 → ⠤⠼⠑. mm/h → ⠍⠍⠸⠌⠓. ° → ⠘⠚ (UEB degree sign). "deg C" → ⠙⠑⠛⠀⠠⠉. Every token back-translates to itself. |
| 2026-11-04 | Claude Code (liblouis; **not a screen-reader viewer test**) | as above | as above | UEB grade 2 | c | PASS (reads as written) | — | As grade 1, except SST → ⠠⠠⠎⠌ (the "st" contraction) and "deg C" → ⠙⠑⠛⠀⠰⠠⠉ (a grade 1 indicator before the lone C, which would otherwise be "can"). Every token back-translates to itself. |
| 2026-11-04 | Claude Code (liblouis; **not a screen-reader viewer test**) | as above | as above | Bengali (`bn.tbl`) | c | **PROBLEM** | — | Whole numbers read as Bangla digits (287 → ২৮৭). But: **(1) a decimal or time loses its number:** the decimal point is ⠨ (46), and the digits after it, or after a colon, get no numeric indicator, so they back-translate as letters (30.2 → ৩০.ব; 0.458 → ০.দএহ; 10:30 → ১০ঞচজ; (0-1) → (০-অ)). **(2) Latin text reads as Bangla letters:** SST → সসত, 21.5N → ২১.এন, 89.8E → ৮৯.হএ, deg C → দএগ চ, mm/h → মম/হ. ° → ⠰⠙⠛. The Bengali table is not usable for today's English value lines. |
| 2026-11-04 | Claude Code (**NVDA run**: real OS keystrokes, Braille Viewer read through UI Automation, dots from nvda.log) | NVDA 2026.3 portable, synth silence | Chrome (separate test profile) | UEB grade 1 | b: shape line | **PASS, same as Part A** | [shape line](screens/nvda-chrome-ueb1-b-shape-line.png) | B put focus on the shape line. NVDA showed the caret's line: `- - - - 14 - - - - 14 14 14 - - 14 …` (40 cells), identical to Part A's cells. The cursor blinks as dots 7-8 on the caret cell (⠉ ↔ ⣉: cell 15 of line 2 = point 53 = 87.5°E, the point nearest the 89.8°E needle). Only the caret's line is shown, not the heading. |
| 2026-11-04 | as above | as above | as above | UEB grade 1 | c: value line | **PASS for the dots; 2 usability problems** | [value line](screens/nvda-chrome-ueb1-c-value-line.png) | **Dots** for "Value line ro edt SST 30.2 deg C …": `6 1236 1 123 136 15 - … - 2347 2347 23457 - 3456 14 245 256 12 - 145 15 1245 - 6 6 6 14`. This equals Part A's liblouis translation plus NVDA's default "expand word at cursor": SST shown as computer braille 2347 2347 23457. In the full line, UEB starts a capitalised passage (⠠⠠⠠) before C. **Problem 1:** on Shift+Tab, Chrome selects all the text, so every cell carries dots 7-8 (⣚⣚⣒⣼…). **Problem 2:** the line is 42 characters, so NVDA shows the end ("00:00 obs stale"), and the caret can't move: a `readOnly` input's caret doesn't move with arrows or Home in Chromium (NVDA: "Caret didn't move", "blank"). A display's pan keys would still reach the start. |
| 2026-11-04 | as above | as above | as above | UEB grade 1 | e: R reads and returns | PASS | [Review on](screens/nvda-chrome-ueb1-e-review-on.png), [review line](screens/nvda-chrome-ueb1-e-review-line.png) | R flashed "Review on" (`6 1235 15 1236 24 15 2456 - 135 1345`). The value line then held "Sea surface temperature 30.2 degrees C at 21.5N 89.8E, 1 Nov 00:00 UTC, observation, stale" (end shown, selected, as in c). R again flashed "Review off" (`… 135 124 124`, then a blank cell from the repeat marker), and the value line was back to "… 00:00 obs stale". Log excerpt: [nvda-logs/2026-11-04-nvda-chrome-ueb1.log.txt](nvda-logs/2026-11-04-nvda-chrome-ueb1.log.txt). |
| 2026-11-05 | Claude Code (liblouis; **not a screen-reader viewer test**) | none (NVDA 2026.3's liblouis 3.39.0) | lines from Chromium and Firefox, app in বাংলা mode | Bengali (`be-in-g1.utb`, NVDA's name for it; `bn.tbl` gives the same cells) | c: the বাংলা-mode lines, 6 records | **PASS, with one ambiguity** | — | The lines are Bangla words, Western digits, দশমিক, no colon, e.g. "সমুদ্রপৃষ্ঠের তাপমাত্রা 30 দশমিক 2 ডিগ্রি সেলসিয়াস 21 দশমিক 5 উত্তর 89 দশমিক 8 পূর্ব 1 নভেম্বর 0টা …". **Back-translations:** every number comes back as the same Bangla numerals (30 → ৩০, 21 দশমিক 5 → ২১ দশমিক ৫, 10টা 30 মিনিট → ১০টআ ৩০ মইনইট, -5 → -৫, 2017 → ২০১৭, 0 দশমিক 458 → ০ দশমইক ৪৫৮) in 11 of 12 lines. The exception is 19, which reads ণই, because ⠼ is also ণ in Bharati braille. Words come back with vowel signs as full vowels (সমুদ্র → সমউদ্র); the cells for a vowel and its sign are the same in this code, so that is how the table back-translates, not a misreading. Using Bangla digits instead fails: ৩০ → ⠉⠚ reads চজ (no number sign). |
| 2026-11-05 | Claude Code (**NVDA run**: real OS keystrokes, dots from nvda.log, Braille Viewer read through UI Automation) | NVDA 2026.3 portable, synth silence | Chrome (separate test profile) | UEB grade 1 | c: value line, after the fix | **PASS** | [value line](screens/nvda-chrome-ueb1-c-value-line-fixed.png) | On Shift+Tab the line arrives **unselected**, caret at the start: "Value line ro edt SST 30.2C 21.5N 89.8E 1Nov 00UTC obs", window `15 145 2345 - 2347 2347 23457 - 3456 14 245 256 12 56 14 - 3456 12 1 256 15 1345 - …` (no dots 7-8 but the cursor word). End pans to "1Nov 00UTC obs"; Home pans back; no "Caret didn't move" events. Same cells as liblouis (UEB grade 1, word at cursor in computer braille). |
| 2026-11-05 | as above | as above | as above | Bengali (`be-in-g1.utb`) | c: value line, app in বাংলা mode | **PASS** | [value line](screens/nvda-chrome-bengali-c-value-line.png) | "সমুদ্রপৃষ্ঠের তাপমাত্রা 30 দশমিক 2 ডিগ্রি সেলসিয়াস …": window `234 134 136 145 4 1235 1234 5 1235 12346 4 2456 15 1235 - 2345 345 1234 134 345 4 2345 1235 345 - 3456 14 245 - 145 146 134 24 13 - 3456 12`. The number reads ⠼⠉⠚ দশমিক ⠼⠃, unselected, caret at the start; End/Home move it. Same cells as liblouis. Note: NVDA calls the table `be-in-g1.utb`; set as `bn.tbl`, it fell back to the default ("Invalid translation table"). Log: [nvda-logs/2026-11-05-nvda-chrome-check-c-ueb-bengali.log.txt](nvda-logs/2026-11-05-nvda-chrome-check-c-ueb-bengali.log.txt). |
| | | | | | | | | |
