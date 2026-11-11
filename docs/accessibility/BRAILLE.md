# Braille in Bloop

Bloop works with a refreshable braille display connected to the reader's own screen reader (NVDA, JAWS, VoiceOver, TalkBack). It needs no braille hardware or driver of its own. Everything is software: standard web semantics, Unicode braille, and text written for a 40-cell line.

> **What we may say:** "Braille output tested with NVDA 2026.3's Braille Viewer in Chrome (English UEB and the Bengali table); designed for refreshable displays." JAWS, VoiceOver, TalkBack and real displays are not tested yet (see [Tested](#tested)).

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
   - **It fits one 40-cell line, front-loaded.** The core reading comes first: a "pattern" or "rel" status for such records, then the name, value and place. Time, SVS ID, badge and status follow only while they fit. Examples:
     - Live frames: `SST 30.2C 21.5N 89.8E 1Nov 00UTC obs`, `Rain 12mm/h 21.5N 89.8E 3Nov 0630UTC obs`.
     - Official records: `pattern sea salt no data 23.8N 90.4E …`.
   - If the core alone is longer than 40 cells, the unit drops (R still gives it). Every shipped record's core fits (`src/a11y/strings.test.ts`).
   - **On focus the text is not selected and the caret is at the start** (4 Nov NVDA finding: Chrome had selected it all, so NVDA put dots 7-8 on every cell and showed the line's end).
   - It's a real text field marked `aria-readonly`, with every edit blocked (typing, paste, cut, drop, Backspace/Delete/Enter). So the caret moves with arrows, Home and End.
   - A relative or pattern-only record says so first, and its shape line is labelled "Relative shape, scale".
   - **In বাংলা mode** the value line, review line and scale heading are written for the Bengali braille table instead ([below](#bangla-braille-lines)).
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
| pattern only / relative / visual texture (first word of the value line) | pattern / rel / texture (R gives the full words) |
| verified, no check | as written |
| sea surface temperature | SST |
| sea surface salinity, land surface temperature, aerosol optical depth, carbon monoxide, tropospheric NO2, vegetation index | SSS, LST, AOD, CO, NO2, NDVI |
| lightning flash rate (climatology), sea ice concentration, rain and snow rate, chlorophyll a | flash rate, sea ice, rain rate, chl a |
| live / past its freshness limit | live / stale |
| degrees Celsius | value line: 30.2C (or 30.2°C, setting); review: degrees C |
| units after a number | written straight after it when short or containing a slash (30.2C, 12%, 12mm/h, 287ppbv); others after a space (0.01 index); "colorbar units" and relative units left out; a bracketed note cut (cm (GMSL …) → cm) |
| latitude, longitude | 21.5N 89.8E (one decimal, one letter) |
| a picture-space position (no georeference) | x50 y40 (percent across, up) |
| UTC time | value line: 1Nov 00UTC, 3Nov 0630UTC (no colon); review: 1 Nov 00:00 UTC |

## Bangla braille lines

In বাংলা mode, the value line, the review line (R) and the shape line's scale heading are written for NVDA's Bengali table: `be-in-g1.utb`, "Bengali grade 1". liblouis's `bn.tbl` wraps the same file and gives the same cells. Code: `src/a11y/brailleBangla.ts` and `src/a11y/brailleLines.ts`. The shape cells are unchanged, and UEB (English) lines are unchanged.

Example: `সমুদ্রপৃষ্ঠের তাপমাত্রা 30 দশমিক 2 ডিগ্রি সেলসিয়াস 21 দশমিক 5 উত্তর 89 দশমিক 8 পূর্ব 1 নভেম্বর 0টা পর্যবেক্ষণ পুরোনো`.

What the table needs, from our liblouis checks (4–5 Nov) and confirmed by NVDA's own log (5 Nov):

| Rule | Why |
|---|---|
| No Latin letters: Bangla words instead (SST → সমুদ্রপৃষ্ঠের তাপমাত্রা, N → উত্তর, E → পূর্ব, deg C → ডিগ্রি সেলসিয়াস, mm/h → মিমি প্রতি ঘণ্টা) | The table reads Latin letters as Bangla letters (SST → সসত). |
| Decimals as the word দশমিক; times as 10টা 30 মিনিট (no colon) | The number sign ends at a decimal point or colon, so the digits after it read as letters (30.2 → ৩০.ব, 10:30 → ১০ঞচজ). |
| **Western digits** in the line (30, not ৩০) | The table gives Bangla digits **no number sign** (৩০ → ⠉⠚, which reads চজ). Western digits get it (30 → ⠼⠉⠚, which reads ৩০). On the display they *are* correctly marked Bangla numerals; only the field's screen text shows 30. |
| য়, ড়, ঢ় as precomposed letters (U+09DF, U+09DC, U+09DD) | The combining nukta (U+09BC) is undefined: য + ় comes out as the escape text `\x09bc` in cells. Unicode NFC decomposes these letters, so the line composes them back. |
| Numbers only from the record | As in every braille line. |
| A term with no Bangla entry is left out, never written in Latin | A record is then named by its number (রেকর্ড 4993), and R still has the full English line. |

Known ambiguity (Bharati braille itself, not a bug): ⠼ is both the number sign and the letter ণ, so ⠼⠁⠊ is both "19" and "ণই". The forward dots are correct; context tells a reader which.

A draft liblouis issue for the three table problems: liblouis-issue-draft-bn.md (not filed).

**The words: who chose them.**

- **Team** (4 Nov 2026): সমুদ্রপৃষ্ঠের তাপমাত্রা, উত্তর, পূর্ব, দশমিক, ডিগ্রি সেলসিয়াস, মিমি প্রতি ঘণ্টা, টা, মিনিট.
- **Draft**, chosen by the build team without a Bangla speaker, to be **reviewed by a Bangla speaker** before any claim of Bangla braille:
  - **Compass, places and values:** দক্ষিণ, পশ্চিম; তথ্য নেই (no data), শুকনো (dry), তুষার (snow), বা কম (at or below); ইউটিসি; month names.
  - **Badges and statuses:** পর্যবেক্ষণ (observation), মডেল, পুনর্বিশ্লেষণ (reanalysis); সরাসরি (live), পুরোনো (stale); যাচাই করা (verified), আপেক্ষিক (relative), শুধু ধরন (pattern only), শুধু ছবি (visual texture), ত্রুটিসহ মান (values with stated error), যাচাই হয়নি (no check).
  - **Scale and frame words:** স্কেল, আপেক্ষিক আকার, থেকে, লগ, রেকর্ড, বাম থেকে / নিচ থেকে … শতাংশ (frame position), আনুমানিক (approx.).
  - **Units:** পিপিবিভি, পিপিএম, পিএসইউ, মাইক্রোগ্রাম প্রতি ঘনমিটার, মিলিগ্রাম প্রতি ঘনমিটার, মিটার প্রতি সেকেন্ড, কিলোমিটার প্রতি দিন, গ্রাম প্রতি কিলোগ্রাম, মিটার, মিমি, কেলভিন, শতাংশ, সূচক, বজ্রপাত প্রতি ঘর, বজ্রপাত প্রতি বর্গকিলোমিটার প্রতি বছর.
  - **Layer names:** বৃষ্টি, সমুদ্র লবণ, ধুলা, ধোঁয়া, সালফেট, কার্বন মনোক্সাইড, কার্বন ডাই অক্সাইড, নাইট্রোজেন অক্সাইড, ওজোন, সূক্ষ্ম কণা, লবণাক্ততা, তাপমাত্রা, বজ্রপাত, উচ্চতা, উজ্জ্বলতা, জলীয় বাষ্প পরিবহন, পরিবর্তন; বাংলাদেশ, বিশ্ব.

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
| Playwright (`bun run test:e2e`, Chromium) | B opens the explorer with focus on the shape line. 5 caret steps move the needle 5 points (25° east), and the value line and the map's own label follow. The audio output level is above zero after the move. Width 20 wraps every line within 20 cells with the marker. R switches to words and back. An official record's explorer opens and its caret moves the needle. **4/4 pass.** |
| axe-core 4.13 (whole page, explorer open) | **0 violations** of any impact, including `aria-braille-equivalent`. |
| NVDA's liblouis, no screen reader running (`qa/braille/louis_check.py`) | **Not a viewer test.** 6 records' lines were translated with NVDA 2026.3's own liblouis 3.39.0, table list (`[table, braille-patterns.cti]`) and mode (`dotsIO`). Unicode braille passes through unchanged and one-to-one in UEB grade 1, UEB grade 2 and Bengali (483/483 cells). UEB reads numbers, decimals, units, N/E and times as written. **Bengali does not:** digits after a decimal point or colon lose their numeric indicator, and Latin text reads as Bangla letters. Details in the protocol's Results. |
| Browser side of the protocol (`qa/e2e/braille-protocol.e2e.ts`, Chromium and Firefox) | Checks a–g PASS in both browsers: exposed roles and names, B, Shift+Tab, arrows, R, width 20/40, and "Sound paused" in the live region. |
| NVDA 2026.3 + Braille Viewer, Chrome, UEB grade 1 (4 Nov 2026: checks b, c, e) | **The dots match Part A cell for cell**, read from nvda.log's "Braille window dots" lines. Differences are NVDA's own presentation, as expected: the cursor blinks as dots 7-8 on the caret cell; the word at the cursor is in computer braille (default setting); only the caret's line of the shape field is shown. **Two value-line problems:** on focus all its text is selected (dots 7-8 on every cell), and a read-only input's caret doesn't move in Chromium, so NVDA shows the line's end. Details and screenshots in the protocol's Results. Not yet run: Firefox, the Bengali table, JAWS, VoiceOver, TalkBack. |
| Value-line fix and Bangla lines (5 Nov 2026) | **Unit:** every shipped record's UEB core fits 40 cells, and its Bangla line is Bengali-table safe (no Latin letters, colon, dot between digits, Bangla digit or combining nukta); 72 tests. **Playwright** (Chromium): value line focus leaves no selection and the caret at 0, Home/End/arrows move it, typing changes nothing; বাংলা mode writes Bangla-only lines with দশমিক (10/10 e2e in Chromium and Firefox). **liblouis** (`be-in-g1.utb`, 6 records): every number reads back as the same Bangla numerals except 19, which reads as ণই (the ⠼/ণ ambiguity above). |
| NVDA 2026.3 + Braille Viewer, Chrome (5 Nov 2026: check c again, UEB and Bengali) | **UEB:** the value line now arrives unselected, caret at the start: `SST 30.2C 21.5N 89.8E 1Nov 00UTC obs`. End pans to its end, Home back, and there were no "caret didn't move" events. **Bengali** (`be-in-g1.utb`, app in বাংলা mode): `সমুদ্রপৃষ্ঠের তাপমাত্রা 30 দশমিক 2 …`, with the number as ⠼⠉⠚ ⠙⠩⠍⠊⠅ ⠼⠃. Both sessions' logged dots equal liblouis's prediction cell for cell. Log: nvda-logs/2026-11-05-nvda-chrome-check-c-ueb-bengali.log.txt. |

Screenshots of the in-app preview (not a screen-reader viewer): explorer, live rain through time, explorer, official record 5669.

## Known limits

- **NVDA ignores `aria-braillelabel`.** NVDA users get the full accessible names. The value and shape lines don't depend on braille labels.
- **Flash messages time out** (NVDA "Message timeout", JAWS 5 s by default). Anything that must stay is in a field: the value line, the shape line and review.
- **Single-line displays can't show inclines well** (MAIDR). Time mode is the first mode because a line through time is where braille and sound work best.
- **Bangla braille is not claimed yet.**
  - বাংলা mode writes its braille lines for the Bengali table ([above](#bangla-braille-lines)). NVDA showed them as intended in its log and viewer.
  - Most words are drafts and need a Bangla speaker's review. No Bengali braille reader has tried them.
  - In English mode a reader on the Bengali table still misreads the English lines (Latin letters, decimals). Such a reader should use বাংলা mode, or switch NVDA's table to English (UEB).
  - The shape line's other text (field labels, instructions) and the rest of the app are not yet adapted for the Bengali table.
  - Typed Bangla digits are accepted (codes, numbers).
- **Long help prose and scene captions** keep typographic glyphs (· – ×). They are not status messages and are read as text, but a braille table may show them oddly. They should be checked in the viewer.
- **The live region's repeat marker** is a trailing no-break space, so a repeated message is announced again. It may show as one blank cell on a display.
- **Granularity:** four levels per cell on a line, three on a heat map (MAIDR's choice, kept for consistency with its study).

## How to test

1. `bun test` (unit and text rules) and `bun run lint`.
2. `bun run dev`, then in another shell `PLAYWRIGHT_BROWSERS_PATH=D:\Jukebox\tools\ms-playwright bun run test:e2e`.
3. With a screen reader: follow [BRAILLE_TEST_PROTOCOL.md](BRAILLE_TEST_PROTOCOL.md).

## Do not claim (video and project page)

- "Supports all braille displays."
- "Bangla braille" as a finished feature, until a Bangla speaker has reviewed the draft words and a Bengali braille reader has tried it.
- "Validated with braille users", unless the YPSA session happened with a display.

Say instead: "Braille output tested with NVDA 2026.3's Braille Viewer in Chrome (English UEB and the Bengali table); designed for refreshable displays." Once JAWS or VoiceOver have been tested, name them too.
