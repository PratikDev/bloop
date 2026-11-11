# Bloop UI review: `final-pass` @ de67b7e

Production build served on :3301, headless Chromium (software WebGL), 7 pages × 4 sizes + 8 states. Method: `scripts/review/capture.ts` (run `node scripts/review/capture.ts` with `out/` served on 3301; `summary.ts` prints failures). Numbers: `metrics.json`; images: `sheet-*.jpg` and `shots/`. I judged from the contact sheets only, so text-level claims are marked where I'm inferring.

## 1. Ratings

| Area | /10 | Why |
|---|---|---|
| Visual design | 8 | One coherent jukebox world: navy outlines, one coral action, Archivo only, no glow, no serif. Held back by Home, How we know and the 404 at 1920 (small content in a big field). |
| UX | 7 | Each page has one obvious main thing. Held back by jargon in the main sentence of Then vs Now, a Turntable that opens on "No ocean data here", and a few doubled labels. |
| Consistency | 6 | The cabinet frame, content width and headings differ page to page (cabinet vanishes on Official at ≤1536; widths 1216 / 1768 / 1856). |
| Accessibility (blind) | 8.5 | axe serious/critical: 0 on all 36 captures but one; 0 console errors; one live region, braille explorer, no text under 14 px. Real screen readers untested. |
| Accessibility (low vision) | 7.5 | 0 text/background pairs under 4.5:1, 0 text under 14 px, no overflow. Forced colours loses the coral cue and has one axe contrast failure; the page doesn't scale up at 1920. |
| Performance feel | 6 | The team's own numbers: start usable 3.4–3.8 s, first sound ~3 s (budgets 3 s / 2 s, accepted for judging). I couldn't time it on real hardware. |
| **Overall** | **7.5** | Distinctive and mostly well built; the gaps are consistency and plain-language polish, not structure. |

## 2. Issues (by severity)

| Page | Size / state | Issue | Sev. | Fix |
|---|---|---|---|---|
| Turntable | all | First view reads "No ocean data here / Dry / 90 km E of Raipur": the opening state is a null | major | Start the needle on an ocean place (the Bay of Bengal, as Listen does). |
| Turntable | 390 | A second readout card, cut off at the bottom, repeats "No ocean data here" (the same value twice) | major | Show one card; keep the pin/close icons out of the first screen. |
| Then vs Now | all | Main sentence and chart use jargon: "GISTEMP", "grid cell", "°C anomaly", "the 1951–1980 normal" | major | Say "warmer than the 1951–1980 average by 1.37 °C"; move GISTEMP and "grid cell" into Sources and checks. |
| Listen | forced colours | The coral Pause sound key becomes a plain outlined key, so the primary action loses its cue; axe `color-contrast` fails on the active nav pill | major | Give the primary key a forced-colours border of `Highlight`; fix the active-pill text colour. |
| Official | 1536×730, 1280×720 | The cabinet frame (present at 1920) is gone, and at 1280 the map is ~240 px tall with a dead band below it | major | Keep the frame at every size; let the map take the free height (Pratik's size floor still holds). |
| All with player | desktop | Same record named twice: the crown ("Now playing B1 Heat") and the player bar | minor | Keep the crown; show only the sleeve and the controls in the bar (or vice versa). |
| Listen | 1920 | "Dry" under the temperature and "Quiet: dry here" in the bar say the same thing | minor | Drop "Dry" from the readout. |
| 404 | all | "No signal here" is the crown and the heading | minor | Leave the crown blank, or put "404" on it. |
| Home | all | "Bloop" is the logo and the crown; no player (fine) but 11 controls (5 nav, 3 tools, 3 page) | minor | Hide the header logo on Home, or accept it. |
| How, Home, 404 | 1920 | Content is a ~1216 px island: How is 35% empty, 404 26%; text stays at 14–16 px | minor | Scale the type and the globe with the viewport above 1536 (`clamp`). |
| Turntable | 1280, 390 | A stale "Press any key to skip" hint (the intro's) where 1920 and 1536 show "Press / to search a place" | minor | Show the search hint once the intro is gone, at every size. |
| Listen | 1920, 1536, 1280 | "Frame 7.4 days old" pill beside Home's "4 Nov 2026" caption: reads as stale | minor | Confirm the freshness limit; if inside it, hide the pill (rule 0.5.4). |
| Official | all | Jargon line "very low (pattern only: no number, the values are not verified)"; no visible page heading, unlike other pages (inferred; axe is clean) | minor | One plain sentence ("No exact number here"); add a visible title. |
| Braille explorer | 1440 | Value line "SST 29.8C 21.5N 89.8E 4Nov 00U" is shorthand on screen | minor | Show the readout's sentence on screen; the braille line keeps its code. |
| Bangla | Home | "EIC" left in English on Home; the language key itself reads "EN" (intended) | minor | Spell out or translate the acronym. |
| Listen, Turntable | all | Hard shadow on static boxes: `p.comic-box` caption, `p.on-space` hint | minor | Flat paper box with no shadow (rule 0.5.2). |
| Header | 390 | Nav pills clip ("Turnta", "How") with no cue that they scroll | minor | Fade the right edge, or use a 2-row nav. |
| Player sheet | 1440 | "Up next" list touches the player bar | minor | 24 px gap above the bar. |

## 3. Top 10 improvements

| # | Improvement | Impact | Effort |
|---|---|---|---|
| 1 | Turntable opens on an ocean place | High (first impression of the deck) | S |
| 2 | Plain-language Then vs Now sentence and axis | High (clarity for new users) | S |
| 3 | Forced-colours pass: primary key, active pill | High (low vision) | S |
| 4 | One cabinet frame and one content width rule across all pages | High (consistency) | M |
| 5 | Fix the duplicated Turntable readout card on phones | Med | S |
| 6 | Remove doubled labels (crown vs bar, Dry vs Quiet, 404) | Med | S |
| 7 | Fluid scaling above 1536 px for Home, How, 404 | Med | M |
| 8 | Official: fill the height at 1280/1536, add a title, plain sentence | Med | M |
| 9 | Flatten static hard shadows (comic box, hints) | Low–Med | S |
| 10 | Phone nav that doesn't clip | Low–Med | S |

## 4. Animation ideas

Each starts from a user action, the sound or the data. Best three: ★. Every one is off under Reduce motion (system or app setting).

1. ★ **Listen readout**: when the needle moves, the number's digits flip like the split-flap title (about 120 ms each). Shows the value changed. Reduced: the number swaps.
2. ★ **Then vs Now, Play this part**: the line draws as the playhead passes each year, in step with the sound. It ties what you hear to the chart. Reduced: full line shown, the current year's point marked.
3. ★ **Braille explorer, arrow key**: the cell under the caret grows 1→1.15→1 in 100 ms on each step, with the tick. Shows the caret for low-vision users. Reduced: a solid outline on the cell, no scaling.
4. **Mixer, Mute**: the voice's tube drains over 200 ms and the key presses in a spring. Confirms what was silenced. Reduced: instant.
5. **Records sheet opens**: sleeves slide in from the rack, 30 ms apart per row. Explains where records live. Reduced: sheet appears at once.
6. **Details key**: the panel grows to its height with the chart table sliding in (200 ms). Shows where the extra content came from. Reduced: instant.
7. **No-data click** (land on an ocean record): the readout card nudges 4 px left and right once (80 ms). Says "nothing here" without colour. Reduced: the text changes only.
8. **Data refresh**: when a newer frame loads, the age pill's text flips once. Shows the data changed. Reduced: text swaps.

## 5. Metric failures (`metrics.json`)

- Page scroll on desktop: none. Sideways scroll: none. Text under 14 px: none. Contrast pairs under 4.5:1: none. Console errors: none.
- axe serious/critical: only Forced colours Listen, `color-contrast` on the active nav pill.
- Coral controls: never more than one.
- Controls outside the map: Home 11, Listen 12, Then vs Now 15, How 15, Turntable 16, Official 23–26 (the record list counts), 404 9, Mixer open 31, Braille open 18 (budget is 8 per page and player; header counted, so the figure may be stricter than the team's own count).
- Hard shadow on non-interactive elements: panels only on Home, How, Then vs Now (jukebox frame, cabinet, header band, which are the allowed top-level panels); plus `p.comic-box` on Listen and `p.on-space` and the readout on the Turntable.
- Largest empty area: How 1920 35% (729,600 px²), 404 26% at 1920 and 21% at 1536, Braille explorer 22.7%; all others under 20%.
- English in Bangla mode: "Bloop" (the name), "EN" (the language key), "EIC" (Home), and "Shift"/"Enter" in a screen-reader-only line.
- Text overlaps: 2–3 per page at 390 against the sticky player and 4–10 with the player sheet and Mixer open. These are measurement artefacts (page not scrolled to its end; a dialog over the header). The e2e layout test, which scrolls first, passes. Not re-run here.

## 6. What the screenshots can't show

- Sound: the mix, the needle drop, whether the first sound arrives in time, the voice.
- Screen readers: NVDA, VoiceOver and TalkBack announcements, braille display output, focus order.
- Real devices: phone touch targets and scrolling, hardware WebGL speed (this run used software rendering, so slow frames are not representative).
- Motion: every animation (stills only), and whether Reduce motion removes all of it.
- Bangla quality: wording and line breaks, beyond what's visible on two pages.
- Pages beyond the first screen, and Firefox and Safari.
