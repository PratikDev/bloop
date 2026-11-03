# Braille test protocol

This protocol is for testing Bloop's braille output with real screen readers: first in software viewers (any teammate), then on a refreshable display (the YPSA session). Record every result in the table at the end. These tests are formative: they look for problems and don't score anyone.

## Part 1. Screen-reader braille viewers (teammate, no display needed)

Install portable or trial copies on `D:` only.

### NVDA + Braille Viewer (Windows): Chrome and Firefox

1. **Get NVDA.** Download the NVDA launcher from nvaccess.org. Run it and choose **Create portable copy** with the folder `D:\Jukebox\tools\nvda`, then start the portable copy.
2. **Open the viewer.** In the NVDA menu (NVDA+N), choose **Tools → Braille Viewer**. In the viewer, tick **Hover for cell routing**.
3. **Check the braille settings.** Press NVDA+Ctrl+A and note **Show messages** and **Message timeout (sec)**.
4. **Run the checks with English (UEB).** Set **Output table** to *English (unified) grade 1*, then *Unified English Braille Code grade 2*. Run checks a–g below in Chrome, then in Firefox.
5. **Run the checks with Bengali.** Set **Output table** to *Bengali* and repeat a–g. Also switch the app to বাংলা and note how numerals and units read.

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

| Date | Tester | Screen reader / version | Browser | Table | Check or task | Result | Screenshot | Notes |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |
