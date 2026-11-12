# Accessibility in Bloop

Bloop turns NASA Earth data into sound. Accessibility is a core theme of the challenge, so the accessible layer is the app's state, not an add-on: the map, the values and the descriptions are real HTML driven by one store, and the 3D views only draw that state. Every task works with the 3D hidden.

This page says what exists, how to use it (English, then Bangla), the keys, the evidence the design rests on, how it was tested, and its limits. Build plan: [CORE_PLAN.md](CORE_PLAN.md). Test results: [RESULTS.md](RESULTS.md). Tests that need a person: [MANUAL_TESTS.md](MANUAL_TESTS.md). Braille: [BRAILLE.md](BRAILLE.md).

**Scope.** The desktop website, in Chromium and Firefox. Phone touch mode, Android vibration, TalkBack and iPhone checks were not built (decided on 8 Nov 2026); see "Known limits".

## What exists

### For screen-reader users

| Feature | Where | What it does |
|---|---|---|
| One status region | every page | One persistent, visually hidden `role="status"` element, present from page load, never re-mounted. Routine updates are debounced (250 ms); tone first, then text; never `role="alert"` for routine updates. Messages are short and front-loaded (the braille rules in `src/a11y/brailleText.ts`). |
| The map's name | Listen | The sound map's accessible name is the reading where the needle is when you reach the map, and it holds still while the map has focus, so each step is said once, by the status region (a name that followed each step was read aloud as well: found in the NVDA run, 10 Nov 2026). Enter says the value here again; Tab away and back reads the name afresh. On a braille display each step's message shows for a moment, then the name from when you arrived; for a line that stays, use the Braille explorer (B). |
| Speech mode | Settings → Accessibility | **My screen reader** (default: text goes to the status region), **Bloop's voice** (`speechSynthesis`, Bangla voice where the device has one; it ducks the music) or **Off**. Never both at once. |
| Detail | Settings → Accessibility | Brief, standard or detailed, for descriptions and answers. |
| Text, sound or both | Settings → Accessibility | Which channels fire on each step of the needle. |
| The map as one widget | Listen | One tab stop with roving focus; keys below. Shortcuts never fire while typing. Every drag has a non-drag way (keys, Go to, Places). |
| Hide 3D views | Settings | Hides every 3D drawing; the HTML around it carries every task. |
| Layered descriptions | D on the map; Description tab | Fill-in-the-blank templates in English and Bangla (no LLM). Brief: what, where, when, units, the range with places. Standard: + the pattern by rule and the change since the previous frame. Detailed: + a human-written "What this means", kept apart. A build test fails if any description holds a digit that no data slot produced. |
| View as table | Table tab | The values around the needle, from the grid the sound plays, with caption, headers and units. |
| Places | Places (dock) | Continent → country → Bangladesh's divisions (Bangla and English), plus an offline search; "." comes back. |
| Track 0 "Tuning" | after the intro, once; Help plays it again | The reference tone, each record's lowest and highest anchors with their values from `mapping.json`, each record's source, what silence means, and the sound grammar. Skippable and remembered. |
| Provenance line | Shift+P on the map | The NASA product, cell size, date, and whether it is a measurement or a model. |
| Compare two dates | Compare (dock) | The same place in two months: both values and the difference said exactly, and two tones beating in one ear. |
| Sonar | N on the map | Finds the warmest (or wettest) spot near the needle; the ping rises and quickens as you near it; arriving says the value and the place. |
| Expedition log | Log (dock) | This session's places, values, comparisons and sources, wrapped to the braille width; saved as `.txt`. |
| Braille Data Explorer | B | The data as a line of braille cells on the sound's own scale; its caret is the needle. See BRAILLE.md. |
| Braille on Then vs Now | B, or Braille explorer beside the play controls | The selected part's series for the selected city on the sound's shared scale, one cell per year (the years between the two decades blank; water: GRACE's months, Bangladesh-wide). The caret is the year and plays it; R reads the value with the change between the decades and its 95% interval from the statistics file (a single year has no interval of its own, so none is invented). |
| Short lines for a braille display | Settings → Braille display | Full lines (default) or Short lines: each description (D), Compare result, sonar find and provenance line reaches the status region as one front-loaded line of at most 40 cells in English (the Bengali table spells words out, so its line has the table's rules but no cell budget). The full text stays in the Description tab and the log, and in the caption bar while the sound is on. Then vs Now's statistics always send their short form. |

### Rich descriptive text with the audio

| Feature | Where | What it does |
|---|---|---|
| Timed text tracks | Transcript pages → Timed text files | WebVTT for the sweep and the storm time-lapse, written from the same steps the sound plays: **metadata** (one JSON cue per step: time, place, value, unit, note), **chapters** (by ring for the sweep, by region for the time-lapse) and **captions** describing the sound in DCMP style (lowercase in brackets, present tense, the source named, e.g. "[densest drops: the heaviest rain in the time-lapse, 14 millimetres an hour, Bay of Bengal, …]"). The app parses its own files back to drive the captions, so the screen and the files never disagree. |
| Sound captions | under the caption bar | While the sweep or time-lapse plays, the "Now playing" line from the metadata track; otherwise a short note on what the last sound did ("rain thickening ↑", "tone falling ↓ cooler", "ping quickening ↑ nearer", "beats = the two sources disagree"). Visual only, for Deaf and hard-of-hearing visitors too; never spoken over the data. |
| Transcript per record | `/transcript` (linked from the Description tab, each Official record's liner notes, and How we know) | A text version that tells the same story (WCAG G158): how the sound is made (from `mapping.json`), what it covers, the pattern, the moments to listen for with times (from the caption track), how far to trust it (the "How we got this" facts and validation), and NASA's own description, credited. |
| Alt text with exports | Turntable scenes → "Save its description (.txt)" | The tactile disc (STL) has no metadata fields, so its alt text and extended description go in a sidecar `.txt` of the same name, and the alt text, cut to ASCII, in the STL's 80-byte header. Every number comes from the disc's data. |

### For low-vision users (people who use their remaining sight, often with magnification)

The principle: keep the value, its scale and its place together and in view; minimise panning; keep edges sharp; let the user set how everything looks.

| Feature | Where | What it does |
|---|---|---|
| The preset | "Low vision" (top left), in Track 0, or **Alt+L** | High-contrast dark, text at 150%, large controls, calm view, the Context Lens, re-coloured bands (7) and thick coastlines, with city names. Every part can then be changed. |
| Low-vision settings | the sliders button next to "Low vision" | Opens inline under the header (never a full-screen pop-up), with a live preview and a reset. Remembered on this device. |
| Context Lens | Z on the map; [ and ] resize | A magnifier beside the needle that carries its own context: the area in sharp, labelled value bands; the value at the needle in very large text with unit, place and time; a scale with the needle's band marked; an inset of the whole map showing where the lens is. Follows the needle (on a narrow screen it sits under or over it, never wider than the screen), stays in a corner of the screen you choose, or docks in the page under the map. Optional band-edge sharpening (lens only). |
| Re-coloured map | Settings → The map | NASA's colours, light-to-dark (luminance only), colour-blind safe (cividis) or two-tone high contrast, always in discrete bands (5, 7 or 10), with each band's range written on the map where it fits. A legend sits next to the value; "Re-coloured by Bloop from decoded values" shows whenever the map is re-coloured, and NASA's original colours are one press away. During the storm time-lapse the frames show as NASA drew them. |
| Coastlines and names | Settings → The map | Thick (3 px) high-contrast coastlines; Dhaka, Chattogram, the other always-labelled cities and the needle's place in large text. |
| Themes | Settings → Colours and brightness | Bloop's colours, follow my device, high contrast dark, high contrast light, or my own two colours (with a warning below 7:1). Dim for glare lowers the whole page's brightness, the 3D scene's included. |
| OS preferences | automatic | `prefers-contrast: more` switches to high contrast; `prefers-color-scheme: light` picks the light one under "follow my device"; `forced-colors` (Windows contrast themes) falls back to the 2D views and keeps the map's own colours with a system outline; `prefers-reduced-motion` reduces motion. |
| Text, controls, fonts, spacing | Settings → Text and controls | Text size 100–300%, independent of browser zoom; normal, large or extra-large controls (44 px targets); Atkinson Hyperlegible for Latin text; Noto Sans Bengali or Hind Siliguri for Bangla (to be chosen with a Bangla speaker); WCAG 1.4.12 spacing; shorter lines. |
| Focus and needle | everywhere | A 3 px focus ring on every control; in low-vision mode the needle is larger with a thick dual outline. A large mouse pointer option. |
| Point of regard | automatic | After a size, zoom or layout change, the needle's map and the value beside it are scrolled back into view (when they and the focused control can't all fit, the needle wins; the next Tab brings focus back). |
| No pop-ups | automatic in low-vision mode | Help, About this sound, How we got this, the credits and the Turntable's drawers open in the page next to what opened them, not over it; the heading takes focus; Escape or Close shuts them and focus goes back. |
| Layout | automatic in low-vision mode | Listen keeps one column at every width and the page scrolls (nothing is squeezed into one screen). The sound dock never covers the page: anything scrolled to stops above it, and when large text makes it taller than a quarter of the screen it sits at the page's end. |
| Calm view, compact centre | Settings → Layout and motion | Calm: no 3D, no animation, decorative layers hidden. Compact centre: the key information in one narrow middle column, for tunnel vision. |
| Say the value where the pointer rests | Settings → The map | Resting the mouse on the map for 0.6 s says the value there (status region or Bloop's voice, as speech mode says). |

## How to use it

1. **Start.** On the home page, press **Start listening** (or **Explore without sound**). Track 0 "Tuning" plays once, after the intro: it teaches what each sound means. Press **Skip tuning** to skip it; Help (H) plays it again.
2. **Explore the map.** Press **Tab** until the map has focus (NVDA and JAWS switch to focus mode on their own). Arrow keys move the needle one step; **Enter** says the value and place; **D** says a description here; **N** starts the sonar.
3. **Choose how you hear it.** Settings → Accessibility: speech mode, detail, and text/sound/both.
4. **Read instead of listening.** The Description and Table tabs hold the same values as text. Every record has a transcript (Description tab → "Transcript: …").
5. **Low vision.** Press **Alt+L** anywhere, or "Low vision" at the top left. Press **Z** on the map for the lens; **[** and **]** resize it.

### বাংলায় ব্যবহার (খসড়া, একজন বাংলাভাষী দেখে দেবেন)

1. **শুরু।** হোম পাতায় **শুনতে শুরু করুন** চাপুন। ভূমিকার পরে একবার "ট্র্যাক ০: টিউনিং" বাজে: কোন শব্দের কী মানে, তা শেখায়। বাদ দিতে **টিউনিং বাদ দিন** চাপুন; সাহায্য (H) থেকে আবার শোনা যায়।
2. **মানচিত্র ঘুরে দেখা।** মানচিত্রে ফোকাস না আসা পর্যন্ত **Tab** চাপুন। তীর-চাবি কার্সর সরায়; **Enter** মান ও জায়গা বলে; **D** এখানকার বর্ণনা বলে; **N** সোনার চালু করে।
3. **কীভাবে শুনবেন।** সেটিংস → অ্যাক্সেসিবিলিটি: কথা বলার মোড, বিস্তারিত, আর লেখা/শব্দ/দুটোই।
4. **শোনার বদলে পড়া।** বর্ণনা ও টেবিল ট্যাবে একই মান লেখা হিসেবে আছে। প্রতিটি রেকর্ডের একটি লিখিত রূপ আছে।
5. **স্বল্প দৃষ্টি।** যেকোনো জায়গায় **Alt+L** চাপুন, বা ওপরে বাঁদিকে "স্বল্প দৃষ্টি"। মানচিত্রে **Z** লেন্স চালু করে; **[** আর **]** তার আকার বদলায়।

## Keys

On the map (it must have focus; nothing fires while typing in a field):

| Key | Action |
|---|---|
| Arrow keys (Shift: bigger steps) | Move the needle one step |
| + / − | Step size up or down |
| J, then 1–9 | Jump to a 3×3 region of the view (number-row in numpad layout; each further number narrows it) |
| . | Back to the previous place |
| Enter | Say the value and the place |
| D / Shift+D | Describe here / Describe mode on or off |
| PageUp / PageDown | Hold a newer / older rain frame at the needle |
| S | The sweep outward from Chattogram |
| N | Sonar to the warmest or wettest spot near here |
| Shift+P | The record's provenance line |
| Z, [ / ] | Context Lens on or off; smaller / larger (low-vision mode) |
| 1 / 2 / 3, M, C, T, L, P, U, B, R | Track, mute, captions, Then vs Now, legend, where it's from, proof in unison, braille explorer, braille review |
| H or ? | Help (only while the map has focus, WCAG 2.1.4) |
| Esc | Stop all sound and close panels |

Anywhere: **Alt+L** turns low-vision mode on or off.

**Key clashes resolved** (details in CORE_PLAN.md): 1–9 keep choosing tracks, so the 3×3 jump is J then 1–9; D now describes here once, and continuous Describe moved to Shift+D; T stays Then vs Now, so time steps are PageUp/PageDown; L stays the legend, so the lens is Z, resized with [ and ] on the map. Each key was checked against NVDA 2026.3's and JAWS's key lists before binding: in focus/forms mode on the map they reach the app; if a user forces browse mode, single letters go to the screen reader, as Help says.

## The evidence it rests on

Checked on 9 Nov 2026; quoted only as far as the sources say.

- **Sound alone is weak for exact values.** Sharif, Aitharaju, Krishnaswamy & Wobbrock, "Data Sonification for Screen-Reader Users: When and When Not to Use", W4A 2025: 106 screen-reader users surveyed, 12 interviewed; about half found sonification at least somewhat beneficial, and for small data they preferred alt text or tables. → Every tone is paired with speech or text carrying the exact value.
- **Teach the mapping first.** Arcand et al., "A Universe of Sound", Frontiers in Communication 9, 2024 (3,184 participants, sighted and blind or low-vision): self-reported learning gains and trust from NASA sonifications. Understanding was self-reported, not tested, so Track 0 teaches what each sound means before exploring, as a precaution.
- **One persistent status region.** Roselli, "Live Region Support", January 2026: hidden live regions never announce, and screen readers treat polite and assertive differently. → One `role="status"` region, present from load, never hidden.
- **Statistics and trends first.** Lundgard & Satyanarayan, "Accessible Visualization via Natural Language Descriptions: A Four-Level Model of Semantic Content", IEEE VIS 2021: blind readers ranked statistical and trend content most useful and editorial context least. → Layered descriptions with user-chosen detail; "What this means" kept apart.
- **Touch is a redundant channel.** Brock et al., "Interactivity Improves Usability of Geographic Maps for Visually Impaired People", Human-Computer Interaction 30(2), 2015: an interactive audio-tactile map was more efficient and more satisfying than a raised-line map. → Tactile outputs are offered as a user-chosen channel; we don't claim better understanding.
- **Low-vision needs.** W3C, "Accessibility Requirements for People with Low Vision", First Public Working Draft, March 2016 (not a Recommendation): user needs for brightness and colour, tracking, text size and font, spacing, and keeping the point of regard and related information close together.
- **Magnification loses context.** Prakash et al., "Towards Enhancing Low Vision Usability of Data Charts on Smartphones" (GraphLite), IEEE VIS 2024: magnifier users found enlarged charts force constant panning; personalisable charts that keep context improved task times over a standard magnifier with 26 low-vision participants. → The Context Lens carries its own value, scale and overview.
- **Blur and separation hurt.** Prakash et al., "Understanding Low Vision Graphical Perception of Bar Charts", ASSETS 2024 (25 magnifier users): time spent counteracting blur and contrast; separated items were harder to compare than adjacent ones; tall distractors raised errors. → Sharp, discrete bands; value and scale side by side in the lens.
- **Magnifiers follow focus.** TetraLogical, "Browsing with screen magnification", 2021: built-in magnifiers (lens or full screen) follow keyboard focus. → Point of regard: focus always lands on visible elements next to what they describe.

## Test results

Summary here; full tables, commands and dates in [RESULTS.md](RESULTS.md).

- Unit tests (`bun test`): templates in each detail level (English and Bangla), the digit-provenance test, pattern rules on synthetic grids, the status-region debounce, WebVTT writing and parsing, the sweep and time-lapse cues, sound captions, tactile alt text, low-vision bands, label placement, settings and theme contrast.
- Browser tests (Playwright, Chromium and Firefox desktop, 3D shown and hidden), one file per step in `e2e/a11y/`; axe-core with zero serious violations on each new panel.
- NVDA log method: see RESULTS.md.

## Known limits

- **Not built:** phone touch mode, Android vibration ticks and the tactile vocabulary card, gamepad rumble, TalkBack, iPhone checks, Android magnification (desktop only, decided 8 Nov 2026).
- Re-colouring and the lens use the live frames; during the storm time-lapse the frames show as NASA drew them.
- STL has no metadata fields, so alt text is a sidecar `.txt` plus the 80-byte header; there are no image or video exports to carry IPTC fields.
- The Bangla strings for the accessibility core are drafts until a Bangla speaker checks them (docs/i18n/TO_TRANSLATE.md). The Bangla low-vision font is to be chosen with a Bangla speaker.
- Not tested with JAWS or VoiceOver; the NVDA run is automated (log method), not a user session.
- Transcript pages for the live records have no NASA SVS description (those records come straight from the data files, not an SVS page); they say so.

## Do not claim

| Don't say | Say instead |
|---|---|
| "WCAG compliant" | "Designed against WCAG 2.2 AA; tested with NVDA" |
| "Haptics/touch improves understanding" | "A redundant, user-chosen touch channel" |
| "iPhone vibration" | (nothing: not built) |
| "Validated with blind users" / "with low-vision users" | Only after the YPSA session happens and is written up |
| "Accessible on phones" | "Designed for the desktop website; phone touch mode not built yet" |
