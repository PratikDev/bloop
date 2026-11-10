# Session A: resume notes

Written 2026-11-10 before a context compaction. Read this in full before doing anything else.

## Role and setup

- **Session:** Session A (interface). Peer: Session B (graphics), session name `session b` (use `ListAgents` to find it; send with `SendMessage`).
- **Worktree:** `C:\Users\User\bloop-a`, branch `session-a`. Never edit the original folder `C:\Users\User\bloop` (on `final-pass`) except to fast-forward it.
- **Ports:** dev 3100 (`bun run dev -- -p 3100`), production 3101 (`bun run build && python pipeline/health/static_server.py out 3101`, run from `bloop-a`). Never 3000. Session B uses 3200 and 3201. Temporary comparison servers may use 3102 to 3106.
- **Playwright browsers:** `PLAYWRIGHT_BROWSERS_PATH='D:\Jukebox\tools\ms-playwright'`; always set `BLOOP_URL=http://localhost:3101`.
- **Files I own:** the interface: `src/components/Dock/**`, `Header/**`, `Rack/**`, `Records/**`, `Cabinet/**`, `JukeboxArt/**`, `JukeboxJourney/**`, `pages/**`, `OfficialRecords/**`, `ThenNow/*` (not `MotionStage/`), `AppShell/**`, `src/lib/records.ts`, `src/lib/i18n/**/records.ts`, `globals.css` layout blocks, the e2e files.
- **Never edit (Session B's):** `src/components/Turntable/scene/**`, `src/components/Globe/**`, `src/components/Starfield/**`, `src/components/SpaceWindow/**`, `src/components/ThenNow/MotionStage/**`, `src/components/Player/**`.

## Remaining items, in order

| # | Item | State |
|---|---|---|
| 1 | CI e2e workflow | merged, `45230e7` |
| 2 | Phase 3: records, rack, mini player, Cabinet, JukeboxArt, page treatments | merged, `750a9cb` |
| 3 | 3D Earth brief 1: `data-tt-occluder` on bars and menus | merged, `c61dee4` |
| 4 | 3D Earth brief 2: mini player takes the Turntable dock's actions | merged, `750a9cb`; rework in `43d3a43` (not merged) |
| 5 | Journey with coin, marquee width, `DataTube` | merged, `2ca5942` |
| 6 | Journey focus fix | merged, `e3071e1` |
| 7 | Phase 7 leftovers | merged, `17d9d1f` |
| 8 | Journey Esc test fix | merged, `e3302e2` |
| 9 | `docs/status/map-sizes.md` baseline | merged, `99b5d03` |
| 10 | Layout rebuild: one screen per page, maps at baseline, Home jukebox around the globe, journey halves, "Now playing" in More, phone map pans | in progress: `43d3a43` + `397751e` + the wip commit with this file. **Next action below.** |
| 11 | Home globe mount in the new window (A places B's Globe; B verifies) | in progress, inside item 10 |
| 12 | Recount controls under the clarified rule; move extras into More | not started; script ready: `scratchpad/counts2.mjs` |
| 13 | Re-check the strip above the header and the blue dot on :3101 | done in an earlier build (not reproduced: no element above the header, no blue pixels at the bottom left); re-check once more after the merge |
| 14 | Home at 1536×730 and 1920×1080: no page scroll | not started (`scratchpad/final.mjs` measures scroll; add 1536×730) |
| 15 | Merge item 10, post the window size and position in `docs/status/session-a.md`, message Session B | not started |
| A1–A11, A-bn | **Audit items, from Pratik, after item 15 and before item 16.** Re-check each on the rebuilt code at :3101 first; fix only what's still broken; report which ones the rebuild already fixed. Full text under "Audit items" in Pratik's decisions below. A1 zoom and short screens (blocker) · A2 focus after Start goes to the map region · A3 Next route announcer · A4 Help opens on its title · A5 forced colours + `prefers-contrast: more` · A6 Home caption vs Pause motion · A7 player labels at 390 px + `layout.e2e.ts` includes `aria-hidden` text · A8 visible sound-button label · A9 player caption ≥ 200 px at 1280–1440 · A10 Official records roving focus · A11 smaller items · A-bn Bangla drafts for A's files | not started |
| 16 | Motion item 4: bubbles in Listen's tubes (component `Cabinet/TubeBubbles.tsx` exists) | not started |
| 17 | Motion items 1, 2, 5, 8, 12 (tonearm, split-flap, live equaliser, panels landing, scrubber spring) | not started |
| 18 | Motion item 15 (spinning-record loader); item 14 mostly exists in `key` | not started |
| 19 | Remove banned animations: `animate-pulse` dot in `Opening.tsx`, `signal-pulse` in `SignalMark` and `StoryPanel`, `breathe` keyframes, `RISE`/`STAGGER` in `StartGate` | not started |
| 20 | Pointer upgrade: Listen cursor like the Turntable pointer (optional) | not started |
| 21 | Phase 8 (starts after items 10 to 20 and A1–A11, A-bn are merged and B has written "B done"). Adds the audit's checks: 200% and 400% zoom on every page, 320×568, forced colours, text spacing, one announcement per page change, Help focus | not started |

### Exact next action for item 10

1. The uncommitted Turntable credits fix is committed as `wip:` with this file. It moves the credits dialog out of the More popover, because the dialog unmounted with the menu, so `feature credits` failed. The background run started for it (`feature credits|turntable*|records-drawer`) may not have finished.
2. Rebuild: `bun run build` in `bloop-a`. Serve on 3101 if nothing listens there.
3. Re-run: `BLOOP_URL=http://localhost:3101 PLAYWRIGHT_BROWSERS_PATH='D:\Jukebox\tools\ms-playwright' bun run e2e --project=chromium --reporter=list --workers=3 e2e/features.e2e.ts -g "feature (credits|turntable|turntable-keys|turntable-view|turntable-search|turntable-sources|turntable-tour|records-drawer)$"`
4. Status of the last targeted run on `397751e`: 40 of 41 passed, and the only failure was `feature credits`, which the wip fixes. The full run before it: everything else passed or was fixed (braille selectors, journey focus, `engines` Esc count, the `credits` and `history-panel` moves, language-independent `navTo`). `health-records` always skips.
5. Then sizes: `node scratchpad/sizes.mjs http://localhost:3101 scratchpad/sizes-now.json` and `python scratchpad/compare.py` (must print `0 smaller of 25`). The last run on the layout code: 0 smaller; no page scroll at any size.
6. Counts: `node scratchpad/counts2.mjs` (the clarified rule). Move anything over the limit into More.
7. Squash nothing; rebase on `final-pass`, run the gate, fast-forward: `cd C:\Users\User\bloop && git merge --ff-only session-a`.
8. Write `docs/status/session-a.md` with the Home window size and position, commit, fast-forward, message Session B.

Scratchpad: `C:\Users\User\AppData\Local\Temp\claude\2e52256bd57c9580\21873d31-e554-4cc2-88ec-df7bc6dd637a\scratchpad\` (scripts `sizes.mjs`, `compare.py`, `counts2.mjs`, `final.mjs`, `journey.mjs`, `shots.mjs`, `keys.mjs`, `p7.mjs`; baseline `sizes-base.json`).

## Home window details (for Session B, after the merge)

- Component: `src/components/JukeboxArt/Frame.tsx`, `JukeboxFrame`, props `window` (the globe), `tube` (the amber `DataTube`), `footer` (caption and Pause motion).
- Size: `--jf-window` on `.jukebox-home` in `globals.css`: phones `100vw`; from 1024 px `min(36rem, 100dvh - 13.5rem, 100vw - 15.5rem - 24rem)`; from 1280 px the last term uses `32rem`. So 576 px at 1440×900 and 1920×1080, 504 px at 1280×720, 432 px at 1024×768, 390 px at 390×844. B's renderer keeps 16 px clear inside it.
- Position: centred in Home's right column, under the coral arch with the marquee, tubes left and right, coin plate and footer below.
- Home already mounts B's `Globe` inside `SpaceWindow` in that window, with `onViewChange={setFacing}` feeding `<DataTube facing={facing} paused={pause.paused} />`.

## Pratik's decisions, word for word

From the decision messages in this session:

> **Home globe:** keep it turning slowly on Home. It's the first impression for judges and it shows the real data frame. This is the one exception to "only star twinkle is ambient". Give it a visible "Pause motion" key, and make reduced motion (OS or app setting) keep it still.

> **Globe sway:** drop the idle ±6° sway everywhere else. Agreed.

> **A0:** switch the track to "both" before `playLegend()`, so it always plays the full warm-up. Agreed.

> **Ring pulses:** cap at 3 per second. Agreed.

> **Odometer:** 160 ms. **Turntable loading:** the spinning record. **Gate:** the long version with `next typegen` first. All agreed.

> **box-shadow:** allowed for the key press (item 14) and the panel landing (item 8) only, both short. Everything else stays transform, opacity and clip-path.

> **`refresh:live`:** not by agents. Pratik runs it before judging.

> **Firefox:** in phase 8, Session A tells Pratik when it's ready. Pratik pushes `final-pass` and opens a draft pull request into `main`, which runs the e2e workflow (Chromium and Firefox) without merging anything. Agents never push.

> **Run straight through.** Stop only on a failure you can't fix within the step's time box, or a real conflict with the other session. Report after each merge.

> **Yes to all four, built with the journey after the phase 3 merge.** [...] **Coin drop:** it must fit inside the journey's 1-second total and never delay the sound. **Marquee widening with the sound:** motion item 7 applied to the marquee. Only one wordmark animates at a time. **Data-driven amber tube on Home:** Read the value from the same ocean frame data the Listen readout uses, at the point the globe is facing. Over land or where there's no data, the tube drains to empty with no bubbles. Never hold the last ocean value. It eases over 280 ms and stops with the globe's Pause motion key and the reduced-motion setting. It's `aria-hidden`: no new text and no announcements. **The facing point comes from Session B.** The Globe is B's component, so build the tube to take `{ lat, lon }` as a prop, with your reading hook inside. B will add `onViewChange` to the Globe when it mounts it in Home's window and wire it to your tube.

> **Yes to all three of your proposals, with "Now playing" in More.** While the time-lapse runs, "Now playing" is the **first** item in More. It works during the time-lapse and opens the player sheet, focusing its heading and returning focus to More when closed. Records stays visible. Release the phase 7 merge.

> **The Home globe: no exemption.** The globe must be at least its baseline size (544 px at 1440 wide, and the baseline at each other size). Rebuild Home's jukebox **around the globe**: the globe is the centrepiece, at at least its baseline size, inside a round `SpaceWindow` (Session B mounts the globe and stars). `JukeboxArt` for Home becomes a frame around that window: the coral arch rises behind the globe's top edge, with the "Bloop" marquee above the globe; the amber and dial-blue bubble tubes sit at the left and right of the globe; a slim coin-slot plate sits below it; no big grille on Home. The frame never covers the globe disc, and keeps the 16 px clear space around it. The page still fits one screen at 1280×720 and larger, with the text column at the left (narrow it to about 32rem if needed). If something must give, the frame gets slimmer (thinner arch, narrower tubes), never the globe. Phones: text first, then the globe at full width inside the same slim frame. The journey (§C) adapts: after the grow, the whole jukebox front (arch, tubes and plate, with the globe) splits down the middle into two halves that slide apart to the screen edges and reveal Listen. Everything else in §C stays: sound never delayed, Esc or any key skips, reduced motion is a 150 ms cut, and the arch lands where Listen's crown is. The amber Home tube (data-driven, from Session B's `onViewChange`) stays one of the side tubes. Tell Session B the window's new size and position once it's built, so its mount fits.

> **Before merging:** the map-size check (Home globe at least the baseline at all five sizes), no page scroll at 1280×720 and 1440×900, and the congestion counts.

> **The control limit, clarified:** The header's fixed controls (logo, nav, language, Settings, Help) **don't count**. Count only the page and the player bar: at most **8 on desktop, 5 on phones**. A scrolling list (the Official records list, the rack) counts as **one control**, as long as it's one focusable region you move through with the arrow keys or Tab. Recount every page with this rule. If a page is still over, move its least-used control into More or a drawer.

> **Coral:** the rule is **at most one** coral control per screen, not exactly one. How we know having none is correct.

> **The strip above the header and the blue dot:** re-check after the rebase on :3101. Pratik is checking the dot in a private window to rule out a browser extension. If you can't reproduce either, say so and move on.

> **The rebase conflict with Session B's Home fix:** keep your new Home (the jukebox around the globe). Bring over B's fix only if its cause still exists in your version: the Pause motion row adding height. Then re-measure Home at 1536×730 and 1920×1080 (no page scroll).

> One confirmation: you're placing Session B's Globe into the new Home window yourself (your item 11), so Session B won't re-mount it. After your layout merge, post the window's size and position in docs/status/session-a.md; B will then only verify the size, the amber tube and the canvas test. Phase 8 starts after your items 10–20 are merged and B writes "B done".

> **Layout rules from Pratik:** as little scrolling as possible, never smaller maps, and nothing should feel congested. Fewer things per screen, never smaller things. [Full text: one screen per page at 1280×720 and larger for Home, Listen, Then vs Now and Official records; How we know may scroll at most one screen; app-style layout with the header, `main` (`flex: 1; min-height: 0`) and the player bar; the map or chart window gets `flex: 1`; lists scroll inside themselves with `tabindex="0"`, an `aria-label` and a visible focus ring; compaction order: 1 move secondary content into a drawer, tab, sheet or More, 2 crown to one line, 3 readout to one line, 4 tubes to 20 px, 5 only then gaps, never below the floor; floor: 24 px between groups, 16 px between items, gutters 32 px from 1024 px and 16 px on phones, 16 px clear around the map or globe window, body text at least 16 px, nothing under 14 px, line-height at least 1.4; at most 2 top-level panels next to the main window; about 60 visible words outside the map on Home, Listen, Then vs Now and the Turntable; borders and hard shadows only on things you can press plus the main window and at most 2 panels; no value twice; phones: Listen's map window about 60% of the viewport height, panning to keep the needle in view; at 200% zoom, 320 px or with Comfortable text the page flows and scrolls; checks before each merge: the pre-merge check, every map, globe and chart at least its size in `docs/status/map-sizes.md`, no page scroll at 1280×720 and 1440×900, the counts at 1280×720 and 390×844, one look at the screenshots.]

> Pratik's screenshot of Home at 1920 wide shows a vertical page scrollbar on desktop at normal zoom. [...] There must be no page scroll at 1280×720 and larger. [...] Never hide the problem with `overflow: hidden` on `html` or `body`. [...] "Pause motion" and the frame caption: move both directly under the Home globe window: the caption centred under it, the Pause motion key beside the caption.

**The four decisions earlier marked "not received"**, word for word from Pratik:

> 1. **No stripes or year counter on Fires, Vegetation or Water.** Those charts have no year axis, and we don't invent one. Their motion stage shows the globe on the city only (no pulse, since they have no sound). (Session B has already done this; on your Then vs Now page, don't add any.)

> 2. **Then vs Now side column:** while a part is playing, the listen controls fold down to just the Play/Stop key, and the motion stage gets the freed height.
>    - **Playing:** only Play/Stop stays in the controls block. "More ways to listen" and the other controls hide (`hidden` or `inert`, not just transparent). The stage grows to fill the column: target a globe of at least 200 px across at 1440×900, and 160 px at 1280×720 and 1536×730. Never let the page scroll, and never change the chart panels' size.
>    - **Stopped:** the controls come back and the stage returns to its current size.
>    - **Transition:** 280 ms, `--ease-mechanical`, height via a transform-friendly approach (e.g. animate a wrapper's `grid-template-rows` or a scale on the stage). Instant under reduced motion.
>    - **Focus:** stays on Play/Stop throughout. If focus was on a control that hides, move it to Play/Stop first.
>    - **Screen readers:** no new announcements; the hidden controls are out of the tab order while hidden.
>    - **Check:** the globe sizes above, no page scroll at the six sizes, charts unchanged, keyboard play/stop works. Include it in your layout merge.

> 3. **onViewChange:** the Globe calls it once when it first draws, once when a drag ends, and once when the frame data finishes loading, in every state including paused and reduced motion; and continuously (at most about 10 a second) only while it's turning normally. Your `DataTube` needs nothing more than the wiring you already have; just confirm it still updates in those cases.

> 4. **Testing policy:** while working, no tests required. Before every merge into `final-pass`, run `bunx next typegen && bunx tsc --noEmit && bun run lint && bun test && bun run build`. e2e, axe, screenshots, the overlap test and performance checks wait for phase 8, which runs everything. Exception: anything an item below says to check before its merge.

**Audit items**, word for word from Pratik:

> An independent audit tested the local `final-pass` before your layout rebuild. Insert these items **after your layout merge (item 15) and before the remaining motion items**. Re-check each one on your rebuilt code at :3101 first; fix only what's still broken, and say which ones the rebuild already fixed.
>
> **A1. Blocker: zoom and short screens.**
> - At 200% zoom Listen's content got about 25 px; at 400% zoom four pages got zero height; on a 320×568 phone Listen got 29%.
> - Rule: when the viewport is shorter than 40rem (640 CSS px), or narrower than 320 px, or Comfortable text is on, use normal page flow. The page scrolls, and the header and player are not pinned (`position: static`). The player collapses to one row.
> - **Check:** at 1280×720 with 200% zoom, the main content gets at least 50% of the viewport height when scrolled to; at 400% zoom every page scrolls and nothing is clipped; at 320×568 Listen's map is reachable and at full width.
>
> **A2. Focus after Start.**
> - After Start and the intro, focus lands on the hidden page heading, and arrow keys do nothing until Tab.
> - Fix: after the journey from Start or Continue listening, focus goes to the **map region** (it has the "sound map" name), so arrow keys work at once.
> - Other page changes keep focus on the page heading.
>
> **A3. Route announcer.**
> - Next.js's built-in route announcer reads the **previous** page's title on every page change, clashing with focus moving to the new heading. It's also a second live region (§0.6 rule 1).
> - Fix: make sure `document.title` is set before Next's announcer reads it, or stop it from announcing (it can't be removed, but its text can be kept empty or correct).
> - **Check:** one page change produces exactly one announcement, naming the new page.
>
> **A4. Help focus.** `HelpDialog` opens focused on the "Built-in voice" toggle, scrolled past the key tables. Open it focused on its title, at the top.
>
> **A5. High contrast** (`@media (forced-colors: active)`):
> - The chosen pill and the selected tab need a visible marker (border or underline in `Highlight`).
> - Chart lines and dots use `CanvasText` or `Highlight` strokes so they stay visible.
> - Also add `@media (prefers-contrast: more)`: outlines from 2.5 to 3.5 px, and `navy-soft` text becomes navy.
>
> **A6. Home overlap.** The frame caption overlaps "Pause motion" at 1280×720 and 1024×768 (`layout.e2e.ts` fails). Make sure your new Home layout passes it at all six sizes.
>
> **A7. Player labels at 390 px.**
> - "Braille / Records / Mixer" run into each other.
> - Fix the labels: shorter, wrap, or icon plus label stacked; at least 44 px targets.
> - Also fix the test: `layout.e2e.ts` must include visible text even if it's `aria-hidden`. It should exclude only `data-overlay` containers.
>
> **A8. Sound button text.** The main sound button is icon-only. Give it a visible label ("Turn sound on" / "Pause sound", the existing keys).
>
> **A9. Player caption squeeze.** Check that your one-row player shows the live caption at at least 200 px wide at 1280–1440 px. Truncation is fine if the full caption is reachable.
>
> **A10. Official records Tab trail.**
> - The 19 record strips plus 8 related records are each a Tab stop before the map.
> - Make each group one Tab stop with arrow keys inside (roving tabindex; Home/End to the ends; `aria-pressed` kept), so the list also counts as one control.
>
> **A11. Smaller items, in your files:**
> - **Slider knobs:** at least 24 px with a visible focus ring on the knob itself (`ui/slider.tsx`).
> - **Touch targets:** every button at least 44 px tall on all sizes, including the Then vs Now controls and related records.
> - **Clipping:** the Listen frame-time line doesn't clip at 1440. Record titles in the player and the Then vs Now "Listen" label don't clip with larger text spacing (`min-height`, wrapping).
> - **Focus rings:** replace `transition-all` on buttons so the focus ring appears instantly (transition only `transform` and `box-shadow`).
> - **Tour from the player:** starting the tour from the player puts focus on the tour panel's heading.
> - **Sheet backdrop:** sheets keep their backdrop (scrim) everywhere, including over the Turntable.
>
> **Bangla strings.** About 410 strings are English-only in Bangla mode. Draft Bangla for every string in your files (everything except `src/components/Turntable/scene`, `Player` and the Scenes, which are Session B's). Order: controls, announcements and errors first, then headings, then the rest. List them for Pratik's review in priority order.
>
> **Phase 8 adds** the audit's checks: 200% and 400% zoom on every page, 320×568, forced colours, text spacing, the one-announcement-per-page-change check, and Help focus.

Audit evidence from the audit session, copied into `docs/status/audit/`: notes `AUDIT-STATE.md`; scripts `audit.mjs`, `audit2.mjs`, `ring.mjs`, `announcer.mjs` (Playwright; `audit2.mjs` and `ring.mjs` take `BLOOP_URL`; `announcer.mjs` has its two ports hard-coded) and `static_server.py`. Screenshots were not copied. Code pointers from the audit, on `final-pass` @ `b80f001`: frame `AppShell/index.tsx:56` (`h-dvh` grid); journey focus `JukeboxJourney/index.tsx:92`; Home overlap `pages/Home/index.tsx:73`; Help `HelpDialog.tsx:101`; sound button `Dock/SoundButton.tsx:21`; dock labels `Dock/dock-button.ts:5`; test skip `e2e/layout.e2e.ts:56`; slider thumb `ui/slider.tsx:45`; charts `charts/YearlyChart.tsx`; pills `ChoiceGroup.tsx:72`. The rebuild may have moved these.

## Rules I'm following

- **Never push, never touch `main`, never deploy.** Merge only by `git merge --ff-only session-a` from `C:\Users\User\bloop` (on `final-pass`). Rebase `session-a` on `final-pass` first. If the generated `docs/i18n/TO_TRANSLATE.md` conflicts, regenerate it with `bun run i18n:todo`.
- **Pre-merge check** (decision 4 above supersedes the e2e part: only the five commands before each merge, plus whatever an item says to check before its merge; e2e, axe, screenshots, overlap and performance wait for phase 8): `bunx next typegen && bunx tsc --noEmit && bun run lint && bun test && bun run build`, then Chromium e2e on 3101 for the affected files (the full suite in phase 8), sizes against `docs/status/map-sizes.md`, no page scroll at 1280×720 and 1440×900, and the counts at 1280×720 and 390×844.
- **Commits:** AGENTS.md: atomic, list every path, `git status` first; never `git add -A`, `git add .`, `git commit -a`, `git stash`, `git restore`, or `git reset` on others' work. No co-author lines.
- **Strings:** every string in `src/lib/i18n/en/` and `bn/`; `bun run i18n:todo`; list new Bangla strings in each report.
- **Motion rules:** every animation answers an action, the sound or the data; the only ambient motion is star twinkle (≤15%) and the Home globe; transform, opacity and clip-path only (box-shadow only for key press and panel landing); interruptible; ≤600 ms except loops; reduced motion turns off spins, bubbles, landing, breathing, drift and twinkle; animated elements `aria-hidden`; nothing flashes more than 3 times per second; a Pause motion key on any self-running stage.
- **Long test runs:** no `timeout` wrapper (one killed a run at 53 of 71); run in the background; use `--workers=3`; never edit e2e files while a run is going.

## Waiting on

- Nothing blocks item 10. After the merge, Session B verifies the Home window (576 px at 1440, baseline at every size, the tube following the globe, the Home canvas test). Watch `docs/status/session-b.md` and `git log final-pass` in `C:\Users\User\bloop`, and incoming `SendMessage`s.
- Phase 8 waits for items 10 to 20 merged and "B done" (already in `docs/status/session-b.md` once; check it again).

## Running processes

- Static server for `bloop-a/out` on port 3101 (background task started this session). Stop it before compaction if a check isn't running; restart with the command above.
- A background Playwright run for the credits fix may still be running; let it finish or stop it, then re-run it as in "Exact next action" step 3.
