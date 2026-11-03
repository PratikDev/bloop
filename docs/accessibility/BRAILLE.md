# Braille in Bloop

Bloop works with a refreshable braille display connected to the reader's own screen reader (NVDA, JAWS, VoiceOver, TalkBack). It needs no braille hardware or driver of its own. Everything is software: standard web semantics, Unicode braille, and text written for a 40-cell line.

> **What we may say:** "Braille output tested in Chromium (automated); designed for refreshable displays." No screen-reader braille viewer has been run yet (see [Tested](#tested)). Do not claim more until it has.

## What was built

| Step | What | Where |
|---|---|---|
| B1 | Braille text rules for every braille-facing string. Strings are front-loaded and plain. Glyphs a braille table may lack (≈ ± – − … ≤) become ASCII signs. Numbers keep the record's stated precision in Western digits. There is one abbreviation set. Every live-region message passes through these rules, and the status/loading strings were fixed (no "…" or "—"). | `src/a11y/brailleText.ts`, `src/components/Announcer/index.tsx` |
| B2 | `aria-braillelabel` short forms on the transport controls (play/pause, sweep, storm, braille, keys), record cards (turntable sleeves, official and related records), the sleeve flip, scenes, and record play/speak. `aria-brailleroledescription` on the map ("map") and the shape line ("shape"). The full accessible name always stays. | `src/a11y/aria.ts` and the components |
| B3 | **Braille Data Explorer**: a value line and a shape line whose caret is the needle (below). | `src/components/BrailleExplorer/`, `src/a11y/brailleShape.ts`, `src/a11y/brailleSource.ts` |
| B4 | Braille keyboard input: plain `<input>` and `<textarea>` elements and no custom key capture. Single-letter shortcuts fire only in their region and never while a field takes text. Record codes are parsed for the jukebox keypad: "B7", "b7", "b 7", "B৭". | `src/a11y/keys.ts`, `src/a11y/recordCode.ts` |
| B5 | "Braille-friendly text" view of each record's liner notes: plain lines, wrapped at the reader's display width, downloadable as UTF-8 `.txt`. | `src/components/BrailleTextView.tsx`, `src/components/OfficialRecords/liner-notes.ts` |
| B6 | In-app braille preview: the shape line's cells drawn as dots, for sighted helpers and video. It loads only when switched on and is labelled "Preview: your screen reader's braille table may differ." | `src/components/BrailleExplorer/BraillePreview.tsx` |

Not built yet (they depend on work that doesn't exist):

- **The jukebox keypad and record codes ("B7").** There is no code scheme yet. When the keypad lands it uses `parseRecordCode`, and the value line gains the code as its first word.
- **The session (expedition) log.** No such log exists. When it does, it reuses `BrailleTextView` as it is.
- **liblouis value-line translation in the preview.** This was optional. See `LICENCES.md`.

### The Braille Data Explorer

Open it with **B** (while the map, a turntable or an official record has focus), with the **Braille explorer** button, or from the turntable (B switches to Explore with the explorer open). **Esc** closes it and returns focus to where you were.

1. **Value line.** A focusable field, not an announcement. Its text stays on the display instead of timing out like a flash message.
   - Live frames: `SST 28.4 deg C 21.5N 89.8E 06:30 obs live`, or `Rain dry 21.5N 89.8E 3 Nov 06:30 obs live` in time mode.
   - Official and related records: `pattern only 5669 sea salt no data 23.8N 90.4E 19 Aug 20:00 model`.
   - A relative or pattern-only record says so first, and its shape line is labelled "Relative shape, scale".
2. **Shape line.** One braille cell per data point. A heading line states the shared scale first ("Scale 0.1 to 50 mm/h log:").
   - **The caret is the needle.** Arrow keys, Home/End, a click or a display's cursor-routing key move the needle to that cell's point. The sound plays and the value line updates.
   - A needle moved elsewhere (map keys, a map click) moves the caret.
   - One cursor serves braille, text and sound.
3. **Modes**, chosen automatically and announced when changed:
   - *Through time* at the needle: the ~48 half-hourly rain frames for live rain, a record's time steps for official records.
   - *Along the latitude*, west to east: 72 points at 5°.
   - *3 by 3 around the needle*: heat-map rows with the row separator. The grid stays put while the needle moves inside it.
4. **Scale.** The shape uses the record's shared scale, the same input range the sound uses (`mapping.json`, generated for official records by `pipeline/svs/records/voices.py`). It never auto-scales one line, so 28 and 30 °C fall in the same top band.
5. **Width.** Settings for 14, 20, 32, 40 or 80 cells (default 40, as in MAIDR). Lines wrap, and every full line but the last ends in the continuation cell ⣿. The setting persists in this browser (localStorage, wrapped in try/catch; the page works without it).
6. **Review (R).** The value line switches to words ("Sea surface temperature 28.4 degrees C at 21.5N 89.8E, 3 Nov 06:30 UTC, observation, live"). This is MAIDR's fix for values that disappear. Press R again to return.
7. **Shape field type.** You can choose a text area (default) or a single-line input, so a tester can compare cursor routing in each screen reader. The field is a real text field marked `aria-readonly`, with every edit blocked. A read-only field's caret doesn't move with the arrow keys in Chromium, and the caret is the needle.
8. **Degrees.** "deg C" (default) or "°C". The default is the plain word until a viewer shows which renders more clearly.

## Encoding (from MAIDR)

The encoding is MAIDR's (Seo, Kamath, Zeidieh, Venkatesh and McCurry, "MAIDR: Making Statistical Visualizations Accessible with Multimodal Data Representation", CHI 2024, [arXiv 2403.00717](https://arxiv.org/abs/2403.00717)). We reused the ideas only; MAIDR's code is GPL-3.0.

| Use | Cell | Dots | Range of the shared scale |
|---|---|---|---|
| Line, band 1 | ⣀ | 7-8 | 0–25 % |
| Line, band 2 | ⠤ | 3-6 | 26–50 % |
| Line, band 3 | ⠒ | 2-5 | 51–75 % |
| Line, band 4 | ⠉ | 1-4 | 76–100 % |
| Heat map, band 1 | ⠤ | 3-6 | 0–33 % |
| Heat map, band 2 | ⠒ | 2-5 | 34–66 % |
| Heat map, band 3 | ⠉ | 1-4 | 67–100 % |
| Heat-map row separator | ⠳ | 1-2-5-6 | — |
| No data | ⠀ (U+2800) | none | — |
| Line continues (ours) | ⣿ | 1–8 | — |

Percent is rounded to a whole number first, so 25 % is band 1 and 26 % is band 2. Dry rain is band 1 (the bottom), not blank. Blank means no data. On log scales (rain), zero sits at the bottom.

## Abbreviations

| Word | Short |
|---|---|
| observation | obs |
| model | model |
| reanalysis | rean |
| values with stated error | stated err |
| relative, pattern only, verified, no check | as written |
| sea surface temperature | SST |
| live / past its freshness limit | live / stale |
| degrees Celsius | deg C (or °C, setting) |
| millimetres per hour | mm/h |
| latitude, longitude | 21.5N 89.8E (one decimal, one letter) |
| a picture-space position (no georeference) | x50 y40 (percent across, up) |
| UTC time | 14:30 (date added in time mode: 3 Nov 06:30) |

## What we learned from existing braille software

- **MAIDR.**
  - Braille, text and sound share one cursor, each toggled by a key (B, T, S); R is review.
  - The user sets the display's cell count, and long patterns wrap.
  - In its study (11 blind participants: 7 JAWS, 3 NVDA, 1 Orca), braille was the clear winner for box plots and favoured for heat maps. It was weakest for scatter plots: it can't show "inclines" or "declines" on a single line.
  - A value shown as a screen-reader message appeared "transiently, similar to a flash message", which led to review mode.
  - Its limits: single-line displays make heat maps larger than 5×5 "highly challenging", and three levels per cell limit granularity.
  - We follow all of this: a 3×3 grid, review as a field, a width setting, and time as the first mode (a line, where braille works best).
- **NVDA** ([User Guide 2026.3](https://download.nvaccess.org/documentation/userGuide.html)).
  - The Braille Viewer is under **Tools → Braille Viewer** in the NVDA menu. It is a floating window showing the braille cells and the text for each.
  - Its "Hover for cell routing" checkbox (off by default) lets hovering a cell trigger "route to braille cell", after a delay (the cell turns yellow, orange, green).
  - Braille messages follow "Show messages" and "Message timeout (sec)", and pressing a routing key dismisses a message.
  - Live regions are reported in braille by default.
  - liblouis's `bn.tbl` includes `braille-patterns.cti`, the table that maps U+2800–U+28FF to their dots. The include is confirmed in the tables NVDA 2026.3 ships (`D:\Jukebox\tools\nvda\louis\tables\bn.tbl`, line 18). Unicode braille should therefore pass through unchanged with the Bengali table. Whether it does on screen is **to verify** in the viewer.
- **JAWS** ([Freedom Scientific lesson](https://support.freedomscientific.com/teachers/lessons/8.6.2_Transcript-FlashMessagesOnTheFocusBrailleDisplay.htm)). Flash messages last 5 seconds by default (Settings Center → Braille → Flash messages), and a routing key clears them. That is another reason the value line is a field.
- **VoiceOver (macOS).** The braille panel shows the VoiceOver cursor's contents as simulated dots with the text beneath ([Apple VoiceOver guide](https://support.apple.com/guide/voiceover/welcome/mac)).
- **TalkBack.** Android connects braille displays without BrailleBack. In an edit field, routing or arrow keys move the cursor ([Google: input text with your braille display](https://support.google.com/accessibility/android/answer/6007083)).
- **`aria-braillelabel` / `aria-brailleroledescription`** (ARIA 1.3 draft, shipped in Chromium).
  - The brief cites a 2025 support test: `aria-braillelabel` works in VoiceOver (Safari/Brave) and JAWS (Edge/Firefox), not in NVDA or Firefox + VoiceOver. `aria-brailleroledescription` works in VoiceOver and NVDA, partly in JAWS.
  - We could not reach that page (openaccess-website.pages.dev did not resolve on 3 Nov 2026), so those results are the brief's, not ours.
  - axe rule `aria-braille-equivalent`: a braille attribute needs a non-braille equivalent. Our braille labels sit on elements with a full name, and the braille role descriptions sit beside an `aria-roledescription`.
  - These attributes are a bonus, never the only route.
- **Desmos.** Braille is a first-class input and output mode (Nemeth and UEB) in its calculators. Its docs recommend computer-braille tables to avoid translation errors ([Desmos accessibility](https://help.desmos.com/hc/en-us/articles/4404860698253)). That supports writing plain ASCII signs instead of typographic glyphs.

## Tested

| Test | Result |
|---|---|
| Unit (`bun test`) | Encoder bands at 0, 25, 26, 50, 51, 75, 76 and 100 %, missing data, wrapping, row separators, caret ↔ data mapping (with direction), the text rules, record codes, and the shared scale. **The text-rules test** (`src/a11y/strings.test.ts`) builds the value line and scale heading from every shipped official and related manifest. Each line must pass the rules, and its numbers must be the manifest's own at the stated precision. |
| Playwright (`bun run e2e`, Chromium) | B opens the explorer with focus on the shape line. 5 caret steps move the needle 5 points (25° east), and the value line and the map's own label follow. The audio output level is above zero after the move. Width 20 wraps every line within 20 cells with the marker. R switches to words and back. An official record's explorer opens and its caret moves the needle. **4/4 pass.** |
| axe-core 4.13 (whole page, explorer open) | **0 violations** of any impact, including `aria-braille-equivalent`. |
| Screen-reader braille viewers | **Not run yet.** A portable NVDA 2026.3 is set up in `D:\Jukebox\tools\nvda`. It has not been started: the team runs it. Steps: [BRAILLE_TEST_PROTOCOL.md](BRAILLE_TEST_PROTOCOL.md). |

Screenshots of the in-app preview (not a screen-reader viewer): [explorer, live rain through time](screens/explorer-live-preview.png), [explorer, official record 5669](screens/explorer-official-5669.png).

## Known limits

- **NVDA ignores `aria-braillelabel`.** NVDA users get the full accessible names. The value and shape lines don't depend on braille labels.
- **Flash messages time out** (NVDA "Message timeout", JAWS 5 s by default). Anything that must stay is in a field: the value line, the shape line and review.
- **Single-line displays can't show inclines well** (MAIDR). Time mode is the first mode because a line through time is where braille and sound work best.
- **Bangla braille is not claimed.**
  - Braille lines use English words, Western digits and Latin units.
  - Bangla UI strings keep `lang="bn"` where they are Bangla (the app's i18n). The braille-facing strings are English until a viewer test with NVDA's Bengali table shows how Bangla numerals and units read.
  - Typed Bangla digits are accepted (codes, numbers).
- **Long help prose and scene captions** keep typographic glyphs (· – ×). They are not status messages and are read as text, but a braille table may show them oddly. They should be checked in the viewer.
- **The live region's repeat marker** is a trailing no-break space, so a repeated message is announced again. It may show as one blank cell on a display.
- **Granularity:** four levels per cell on a line, three on a heat map (MAIDR's choice, kept for consistency with its study).

## How to test

1. `bun test` (unit and text rules) and `bun run lint`.
2. `bun run dev`, then in another shell `PLAYWRIGHT_BROWSERS_PATH=D:\Jukebox\tools\ms-playwright bun run e2e`.
3. With a screen reader: follow [BRAILLE_TEST_PROTOCOL.md](BRAILLE_TEST_PROTOCOL.md).

## Do not claim (video and project page)

- "Supports all braille displays."
- "Bangla braille", unless it has been tested.
- "Validated with braille users", unless the YPSA session happened with a display.

Say instead: "Braille output tested in Chromium; designed for refreshable displays." Once the viewers have been run, this becomes "tested in NVDA's Braille Viewer (and others where tested)".
