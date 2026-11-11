# Bloop final pass: hand-off notes

Written for Pratik and the team, 2026-11-10, ahead of the code freeze on 12 Nov. `final-pass` holds everything below; `main` is untouched until the draft pull request.

## What changed

**Judging fixes (phase 1).** Listen's heading, Esc, the branded 404, stale copy, link previews and navigation.

**Daylight jukebox (phases 2–3).** The palette, soft neo-brutalist surfaces and Archivo type; the jukebox cabinet with its coral crown on Listen, Then vs Now and Official records; the record rack with codes (A0–A3 live, B1–B5 Then vs Now, C1–C19 official records, D1–D3 guided); the mini player with Records and More; comic sound words and caption boxes.

**Song-player layer (phase 4).** The Now playing sheet (frame progress, captions, up next), opened from the sleeve or More.

**Space windows and motion (phase 5).** Stars, the Home globe in the jukebox window, the storm time-lapse on a globe (Globe / Flat map), the Then vs Now city globe with stripes, playhead and year, and the intro in space.

**Toon Turntable (phase 6, Session B).** The toon deck, the globe never covered, the needle's swatch and sound rings; now becoming two objects side by side (the Earth, and a vinyl turntable).

**Layout rebuild.** One screen per page from 1024×600 (normal page flow at 200% zoom, on short screens and with Comfortable text), every map, globe and chart at least its pre-redesign size (`docs/status/map-sizes.md`), at most one coral action per screen, and Home's jukebox built around the globe.

**Pratik's briefs.**
- Then vs Now: the crown; one coral Play that turns sound on; the player caption follows this page's record; panels grow into the free height; the unit above the axis; a stripe legend; paper year labels; Details as a visible key.
- How we know: four checks in a 2×2 grid, each with a uniquely named button under it, and the credits in a drawer.
- The header: language and Help on every page.
- Official records: the map keeps its size at 1536×730.

**Audit items A1–A11.** Zoom and short screens; focus after Start on the sound map; one announcement per page change; Help opens at its title; forced colours and more-contrast styles; the overlap test at six sizes; the caption's 200 px; Official's list as one Tab stop; 24 px slider knobs; 44 px targets; instant focus rings; the tour focuses its heading; sheets keep their scrim.

**Motion (items 1–19).** Bubbles in the tubes, the crown's tonearm and split-flap title, a live equaliser, panels landing on page change, the slider spring, the spinning-record loader. Every one stops under Reduce motion. The pulses, breathing glow and rise-in entrances are gone.

**Bangla.** Every string has a Bangla draft (0 untranslated keys). The 415 drafts are listed for review in `docs/i18n/REVIEW.md`, in priority order; the shared terms are in `docs/i18n/GLOSSARY.md` (Pause বিরতি দিন, Stop থামান, amber কমলা; "voice" কণ্ঠ is under review).

## Cut or fell back

- The rack chip and crown chip don't share a `view-transition-name` (motion item 2): the two are on screen together while the Records sheet is open, and a duplicate name would cancel the transition.
- Item 20, the Listen pointer upgrade, was optional and isn't done.
- Session B shelved the groove ring around the Turntable globe's base when the design changed to two objects.

## Checks (phase 8)

All on a production build (`bun run build`, served from `out/`), headless Chromium on Windows, 2026-11-11.

| Check | Result |
|---|---|
| Full Chromium e2e (94 tests, every spec) | **Final run, on `final-pass` 7040067** (all of Session B's work, including the performance merge and the Turntable fix): **91 passed, 2 failed, 1 skipped**. Neither failure is an app fault: (1) axe with the player sheet open ran while the sheet was still opening, with the controls behind it part-dimmed and not yet hidden; once open, the page behind is `aria-hidden` and axe finds nothing. The check now waits for the sheet to finish opening (as a user sees it) and passed 5 times out of 5. (2) `feature scene-tunnel` (a 3D scene, Session B's) hit the 120 s limit on this machine's software rendering; it passed alone in 44 s. The skipped test is the record health check's live layer (`e2e/health-records.e2e.ts`), which runs only after `npm run health` has written its plan; it wasn't part of this run. Earlier runs: on e8e2b5c, 90 passed and 3 failed (two test fixes and a too-tight time limit); on c0504f1, 89 passed and 4 failed (the tests acting before Listen, now loaded on demand, had arrived; the start helper now waits for it, and the Enter check turns the built-in voice off, since with it on Enter's line is spoken rather than written to the live region, by design). No test was loosened to pass. |
| axe (`e2e/a11y.e2e.ts`): Home, Listen, Then vs Now, How we know, Official records, the Turntable, the 404, the player sheet; and with the braille explorer open | no serious or critical violations |
| 200% and 400% zoom, 320×568, forced colours, text spacing, one announcement per page change, Help focus | pass on every page (Listen and the Turntable re-checked after the braille redesign and the two-object Turntable) |
| Reduced motion (the system setting and the app's own) | no running animations and no bubbles on Home, Listen, Then vs Now, How we know and Official records (the Turntable's motion is Session B's) |
| Feature inventory (`e2e/features.e2e.ts`, including the `reach-*` checks) | every record, Listen's controls, the storm time-lapse with Globe / Flat map, Then vs Now's parts, views and Details, How we know's links and Credits, every Official record, the Turntable's scenes, More, search and Where am I, Settings, Help, language and the 404: all reachable |
| Braille correctness | the value line's number equals the readout's and every cell is the readout's band at 27 points (ocean, rain, land, both sides of the antimeridian, both ends of the scale; both shapes; widths 14 and 40); one arrow is one point; routing lands on the cell's point; every line identical before and after the explorer redesign (16 English, 13 Bangla). The liblouis check needs NVDA, which isn't installed on this machine: **not re-run** (the lines are identical to those checked on 4 and 5 November). |
| Map, globe and chart sizes | Listen's map, the Home globe, Then vs Now's chart panels and the Official records map at or above the pre-redesign baseline (`docs/status/map-sizes.md`) at 1920×1080, 1440×900, 1280×720, 1024×768 and 390×844 (the Turntable's sizes are Session B's) |
| Turntable click responsiveness | Before Session B's last fix, the readout briefly showed the previous place between the click and the needle's touchdown. Session B's fix (9c5d05b) shows the picked place from the first frame after the click (0 stale frames in 7 recorded clicks, normal and reduced motion); the needle-drop sound and the arrival announcement still come at touchdown. Re-checked by Session A on `final-pass` 7040067, recording the readout on every frame around clicks on the globe: the hover preview stays through the press and then becomes the picked place; no frame shows the previous place. On this machine (software rendering) the touchdown itself couldn't be timed reliably. |
| Control counts | at most 8 per page and player on desktop. On phones the page scrolls, and controls are counted per screenful (Pratik, 2026-11-11): Then vs Now's City, Part, Play, Details, Pause motion, the sound key and More stay as they are. |

### Performance

Budget (§10): Home shows its heading and a usable Start within 3 s; the first sound within 2 s of the click; Home downloads nothing before Start beyond the ocean frame and the app code. Measured with Chrome's "Fast 4G" (9 Mbit/s down, 1.5 Mbit/s up, 60 ms) and 4× CPU slowdown on a production build.

| Build, measured by | Start usable | First sound after the click | Downloads before Start |
|---|---|---|---|
| Before Session B's performance merge (`final-pass` e8e2b5c), Session A, 1280×720, median of 3 | 4.1 s (heading 4.0 s) | 4.7 s | the app code and the ocean frame |
| Before, Session B, 1440×900 / 390×844 (its earlier build) | 7.4 s / 6.7 s | 5.4 s / 5.8 s | as above |
| After (`final-pass` c0504f1), Session A, 1280×720, median of 3 | 3.8 s (heading 3.7 s) | 3.1 s (runs: 3.0, 3.1, 6.0 s) | the app code, the ocean frame **and the rain grid** |
| After, Session B, 1440×900 / 390×844 | 3.5 s / 3.4 s | 2.2–4.3 s (median about 3 s) / 2.7 s | as above |

**Budget misses that remain:**
- **Start usable:** 3.4–3.8 s against 3 s, at every size measured.
- **First sound:** about 2.7–3.1 s (median) against 2 s, with single runs up to 4.3–6.0 s.
- **Downloads before Start:** the rain grid (4.7 MB) is fetched once Home or Listen is usable and idle, before Start, so the first sound is sooner, which goes against the budget's third line.

**Pratik's decisions (2026-11-11):** rain prefetch kept with a guard (Home and Listen only; off on Data Saver and slow-2g/2g/3g; where the browser doesn't report the connection, Firefox and Safari, as before); performance budgets accepted for judging (measured on Fast 4G with 4× CPU and no compression). The guard is Session B's e9eb2c9 (`src/lib/prefetch.ts` with a test, and `src/components/LiveData/index.tsx` in Session B's block); Session B checked it in Chromium on the production build: rain before Start on / and /listen (Chrome reports Fast 4G as 4g, so the measurements above stand), nothing before Start on /official, /turntable, 3G or Data Saver.

How these were measured: on a local static server that sends files **uncompressed** (no gzip or brotli), in headless Chromium on Windows; Session A with SwiftShader software rendering. The real host compresses, which shortens the downloads; that hasn't been measured (see "Not verified" below). No further performance pass was made after Session B's merge.

### Not verified

- **NVDA and liblouis:** the liblouis check (`tests/braille/louis_check.py`) needs NVDA's folder, and NVDA isn't installed on the machine that ran phase 8. It wasn't re-run after the braille explorer redesign. The braille lines are identical to the ones checked on 4 and 5 November, but the check itself is outstanding. No NVDA viewer run was made in this pass either.
- **VoiceOver and TalkBack:** not tested.
- **Static-host compression:** not verified. The performance numbers above were taken without compression; how Cloudflare Pages serves `out/` (compression, caching) hasn't been checked.
- **Firefox:** not run in this pass; the draft pull request's CI runs the e2e in Chromium and Firefox.
- **The Turntable's touchdown timing:** this machine's software rendering is too slow to time it; Session B measured it with hardware rendering.

## Deploy (for Pratik; the agents don't deploy)

Cloudflare Pages builds with `bun run build` and serves `out/`. The preview image is `public/og.jpg` (1200×630, Home's hero), with the alt text "Bloop: today's ocean temperature on a globe inside a jukebox window, beside the words Hear Earth's ocean and rain".
