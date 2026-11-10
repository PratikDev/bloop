# Session B resume (written 2026-11-10, before compacting)

Read this in full before doing anything else after a compaction.

## 1. Role and setup

- **Session:** B (graphics). Session A (interface) works in parallel. A's address for messages: `uds:\\.\pipe\LOCAL\cc-msg-e90265ccfea13412dc9f0a37b23681ce` (name "session a").
- **Worktree:** `C:\Users\User\bloop-b`. **Branch:** `session-b`, off `final-pass`. The original folder `C:\Users\User\bloop` is on `final-pass`; only `git merge --ff-only session-b` is ever run there.
- **Ports:** dev 3200 (`bun run dev -- -p 3200`), production 3201 (`bun run build && python pipeline/health/static_server.py out 3201`, run from `bloop-b`). Never 3000. Session A uses 3100 and 3101.
- **Playwright browsers:** `PLAYWRIGHT_BROWSERS_PATH='D:\Jukebox\tools\ms-playwright'`. Use the real GPU (`--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`). Check scripts are in the session scratchpad (`tt-check.cjs`, `size-check.cjs`, `reflow.cjs`, `contrast.cjs`, `home-check.cjs`, `tl-check.cjs`, `tn-check.cjs`, `pl-check.cjs`, `dot2.cjs`). Scratchpad path: `C:\Users\User\AppData\Local\Temp\claude\2e52256bd57c9580\9ad10cd8-002c-4715-82fb-17e5b5c6f85f\scratchpad`.
- **Files I own (role message):** `src/components/Turntable/scene/**`, `src/components/Globe/**`, `src/components/Starfield/**`, `src/components/SpaceWindow/**`, `src/components/ThenNow/MotionStage/**`, `src/components/Player/**`.
- **Also mine by agreement or by brief:** `src/components/Odometer/**`, `src/hooks/use-spin.ts`, `src/lib/spin.ts`, `src/lib/seeded-random.ts`, `src/lib/places/bangladesh-cities.ts`, `src/components/Dock/PlayerKey.tsx` (A removes it when its More item lands), and the Turntable's non-scene files the 3D Earth brief needed: `Turntable/fit.ts`, `use-occluder-fit.ts`, `use-sound-rings.ts`, `LoadingPanel.tsx`, `use-tier-dpr.ts`, `NeedleChip/**`, `needle-drop.ts`, `use-turntable.ts`, `use-turntable-actions.ts`, `debug.ts`, `Stage.tsx`, `index.tsx`, `settings.ts`, `quality.ts`, `Drawers.tsx`, `SleeveRow.tsx`, `CreditsLink.tsx`, `DockButton.tsx`, `LegendBar.tsx`, `SearchBox.tsx`, `control.ts`, `use-globe-pointer.ts`, `use-intro.ts`, `use-scene-assets.ts`, `TurntableCanvas.tsx`. A agreed to stay out of `Turntable/scene/` and to touch only the Turntable's Dock side.
- **Never edit Session A's other files**, except small mount points in their own commits. Mount points I have used: `pages/Home/index.tsx`, `pages/Listen/index.tsx` (TimeLapseStage), `Opening.tsx` (Starfield), `Dock/Sleeve.tsx` and `Dock/MiniPlayer.tsx` (player sheet), `ThenNow/index.tsx`, `ThenNow/PartView.tsx`, `ThenNow/Layout.tsx`, `ThenNow/FieldPartView.tsx`, `charts/YearlyChart.tsx`, `charts/chart-style.tsx`, `AppState/reducer.ts`, `prefs.ts`, `index.tsx` (the `timeLapseGlobe` pref), `panels/PanelTabs.tsx` (chosen-tab outline), `hooks/use-playhead.ts`. Shared files (`globals.css`, `css-tokens.ts`, i18n): my changes sit in their own commented blocks.
- **Global rule:** never add Claude as an author or co-author. Never push. Never touch `main`. Never deploy.

## 2. Remaining items, in order

| # | Item | State | Next action |
|---|---|---|---|
| 1 | Shared motion tokens, spin, Odometer | merged `b48a8db` | — |
| 2 | Starfield, SpaceWindow | merged `db4aef9` | — |
| 3 | Phase 6 toon Turntable (in full, no fallback) | merged `c3250c8`, `2d22402`, `24716a5` | — |
| 4 | 3D Earth brief: never covered, docked readout, swatch, toon arm, pick swing, glide, platter spin, rings, loader | merged `2d22402`, `24716a5` | — |
| 5 | Globe extension, first Home mount with onViewChange | merged `70c9e1c` | — |
| 6 | Intro in space; time-lapse globe stage | merged `9f08d9b`, `f0f0074` | — |
| 7 | Then vs Now stage, stripes, playhead, year on panel, 16 px clear | merged `f79d90c`, `5827f64` | — |
| 8 | Phase 4 player sheet; single open function | merged `61cd7a9`, `1a1b1ad`, `30a300e` | — |
| 9 | Home Pause key adds no height | merged `12014a5` | — |
| 10 | Item 24: globe sizes (Then vs Now stage moved to the side column; panels back to 404/384/277/306) | merged `c810fdd` | — |
| 11 | Item 25: 200% zoom / 320 px reflow; Turntable scrolls on narrow screens | merged `31c6175` | — |
| 12 | Item 19: Turntable contrast (text passes; key outlines and chosen tab fixed) | merged `adc65ac` | — |
| 13 | Item 30: no stripes or year on Fires, Vegetation, Water; their stage is the city globe without a pulse | merged `c810fdd` | — |
| 14 | Items 31 and 32: atmosphere packages removed; docs/turntable.md updated | merged `e505a82`, `c63274f` (status `cdee5e9`) | — |
| 15 | **Item 28: verify the Home globe in A's new window** | **not started: waiting on A** | When A's Home merge is on `final-pass`: rebase `session-b`, build, serve on 3201, run `size-check`-style measurements on Home at 1920x1080, 1536x730, 1440x900, 1280x720, 1024x768, 390x844 (the canvas's disc = min(canvas w, h) − 38). Check: disc ≥ 576 px window at 1440 (544 px disc incl. outline) and ≥ the Home globe baseline in `docs/status/map-sizes.md` at every size; `onViewChange` still fills the amber tube (`home-check.cjs`); e2e `home` feature's canvas count (`e2e/features/pages.ts`). Fix only what's broken. Don't re-mount. |
| 16 | **"Then vs Now stage growing while playing"** | **wording received (§3); A folds the controls** | My part: the stage follows its container smoothly (ResizeObserver, no new WebGL context, 16 px clear, ring and year positioned at both sizes). Check after A's merge with item 28: disc ≥ 200 px at 1440×900, ≥ 160 px at 1280×720 and 1536×730. |
| 16b | **B1–B5 audit items** (§3) | in progress | B1 player sheet MEDIA + text tokens; B2 Phosphor icons; B3 forced colours; B4 Bangla drafts listed for Pratik; B5 200%/400% zoom reflow. |
| 17 | Write "B done" with the final commit in `docs/status/session-b.md` | not started | After items 15 and 16 are merged. |

## 3. Pratik's decisions, word for word

Decisions below are copied from the messages Session B received. Where Pratik's compaction message names a decision whose text never reached this session, that's marked **not received**.

**Answers to the first questions (both sessions):**
> 1. **Home globe:** keep it turning slowly on Home. It's the first impression for judges and it shows the real data frame. This is the one exception to "only star twinkle is ambient". Give it a visible "Pause motion" key, and make reduced motion (OS or app setting) keep it still.
> 2. **Globe sway:** drop the idle ±6° sway everywhere else. Agreed.
> 3. **A0:** switch the track to "both" before `playLegend()`, so it always plays the full warm-up. Agreed.
> 4. **Ring pulses:** cap at 3 per second. Agreed.
> 5. **Odometer:** 160 ms. **Turntable loading:** the spinning record. **Gate:** the long version with `next typegen` first. All agreed.
> 6. **box-shadow:** allowed for the key press (item 14) and the panel landing (item 8) only, both short. Everything else stays transform, opacity and clip-path.
> 7. **`refresh:live`:** not by agents. Pratik runs it before judging.
> 8. **Firefox:** in phase 8, Session A tells Pratik when it's ready. Pratik pushes `final-pass` and opens a draft pull request into `main`, which runs the e2e workflow (Chromium and Firefox) without merging anything. Agents never push.
> 9. **Run straight through.** Stop only on a failure you can't fix within the step's time box, or a real conflict with the other session. Report after each merge.
> 10. **§0.6 items (blind and low-vision rules), split by owner:** … **Session B:** a "Pause motion" key on every stage you build (globe stages, Then vs Now motion stage, the Home globe once you mount it), plus the hidden "Globe centred on …" sentence on each globe stage.
> 11. **Worktrees:** use the names in your role message (`../bloop-a` and `../bloop-b`), not `bloop-next`.

**onViewChange (three messages):**
> When you mount the Globe in Home's jukebox window, expose where it's facing: add an `onViewChange?: (view: { lat: number; lon: number }) => void` prop to Globe, called from the existing render loop at most about 10 times a second and not at all while paused or under reduced motion. Session A's Home amber tube uses it to show the ocean temperature at the facing point. Session A names the tube component and its prop in its phase 3 merge report. Wire it in the same mount-point commit.

> Yes, add those calls. Call onViewChange: once when the globe first draws, once when a drag ends, and once when the frame data finishes loading, in every state including paused and reduced motion. Continuous calls (at most about 10 a second) only while it's turning normally.

(Implemented in `Globe/controller.ts`; "frame data" = the frame image and the SST grid, via `dataKey`.)

**Congestion rule:**
> Congestion rule from Pratik also applies to your stages: inside a globe or motion stage, at most one overlay at a time besides the pointer and the globe's own labels (max 6); the "Pause motion" key is a small paper key in a corner, not a panel; no captions or stats inside the stage (they live in the readout and the chart). Keep 16 px clear around the globe disc.

**Layout rules (replace any earlier layout message):**
> Layout rules from Pratik for your parts: as little page scrolling as possible, never smaller maps, nothing congested. If you received an earlier layout message, this replaces it.
> - The Then vs Now motion stage fits beside the chart panels from 1024 px inside Session A's one-screen frame. It takes the space it's given and never forces the page to scroll.
> - Your globes stay at least as large as Session A's baseline in docs/status/map-sizes.md (once A writes it). The Turntable already fills the screen and fits the globe into the free space.
> - Inside any globe or motion stage, at most one overlay at a time besides the pointer and the globe's own labels (max 6). The "Pause motion" key is a small paper key in a corner, not a panel. No captions or stats inside a stage; they live in the readout and the chart. Keep 16 px clear around the globe disc.
> - At 200% zoom or 320 px width, normal page scrolling returns; your stages reflow, they don't clip.

**Now playing in More, and the Home globe:**
> 1. Your player key moves into More as "Now playing" (first item in More while the time-lapse runs). Session A wires it; keep the player sheet's open function as the single entry point so it works from More.
> 2. The Home globe keeps at least its baseline size (544 px at 1440 wide). Session A is rebuilding Home's jukebox as a frame around a large round window instead of a small one, and will tell you the window's size and position. Mount the globe and stars there when A reports it, with the onViewChange wiring to the amber tube. Keep 16 px clear around the disc.

**The last work list (items 24, 25, 19, 31, 32, 30, 28):**
> 5. **Item 30, decision:** no stripes and no year counter on Fires, Vegetation or Water. Those charts have no year axis, and we don't invent one. Their motion stage shows the globe on the city only (no pulse, since they have no sound). Note it in your report.
> 6. **Item 28:** Session A is already placing your Globe in the new Home window through the `window` prop (its item 11). Once A merges, don't re-mount it. Verify instead:
>    - the globe is at least 576 px across at 1440 and at baseline at every size;
>    - `onViewChange` still drives the amber tube;
>    - the Home canvas test passes (item 29).
>    Fix only what's broken.
>
> When all of that's merged, write "B done" with the final commit in `docs/status/session-b.md`.

**Testing policy (base prompt):**
> - While working: no tests required.
> - Before every merge into `final-pass` (required, about 3 minutes): `bunx next typegen && bunx tsc --noEmit && bun run lint && bun test && bun run build`. A merge must never break the build for the other session.
> - e2e, axe, screenshots, the overlap test and performance checks: only in phase 8 (Session A).

**Coral at most one:** the version Session B received is in the plan, §0.5 rule 3:
> **One primary action visible per screen.** That's the coral fill. Secondary actions are paper keys; anything beyond three secondary actions goes into a "More" menu (shadcn `DropdownMenu` or `Popover`). Check: at most one coral filled button in view at any time, record chips excepted.

**Control limit (header excluded, 8 on desktop, 5 on phones, a list counts as one):** **not received** word for word by Session B. Session A mentioned "at most 10 controls" earlier; the 8 / 5 numbers come from Pratik's compaction message. Ask for the exact wording if a change of mine affects control counts. My controls in a stage: only the Pause motion key (and the time-lapse's Globe / Flat map toggle, counted as one).

**Home jukebox built around the globe:** the wording received is decision 2 above ("rebuilding Home's jukebox as a frame around a large round window").

**Then vs Now stage growing while playing (received 2026-11-10, item 16):**
> "While a part is playing, the listen controls fold down to just the Play/Stop key, and the motion stage gets the freed height." The target is a globe of at least 200 px across at 1440×900, and 160 px at 1280×720 and 1536×730, over a 280 ms transition, instant under reduced motion, never page scroll, charts unchanged. **Your part:** make sure the stage follows its container's size smoothly. Resize the globe on a ResizeObserver without re-creating the WebGL context, keep 16 px clear around the disc, and keep the ring and year counter positioned correctly at both sizes. Check it after A's merge, along with item 28.

**Control limit (received 2026-11-10):**
> "The header's fixed controls (logo, nav, language, Settings, Help) don't count. Count only the page and the player bar: at most 8 on desktop, 5 on phones. A scrolling list (the Official records list, the rack) counts as one control, as long as it's one focusable region you move through with the arrow keys or Tab."

**Audit items (received 2026-11-10; do before A's merge lands):**
> - **B1. Player sheet:** use the shared `MEDIA` breakpoint list instead of the hardcoded phone breakpoint. Replace its arbitrary caption text sizes with the theme's text tokens.
> - **B2. Icons:** `PauseMotionKey` uses lucide icons, but the app uses Phosphor. Switch to Phosphor (check for any other lucide uses in your files).
> - **B3. High contrast** (`forced-colors: active`) on your stages: the globe's outline and ring, the swatch outline, the Then vs Now stripes and playhead, and the Turntable's selected states stay visible (`CanvasText` / `Highlight`). The Starfield is hidden there.
> - **B4. Bangla strings:** draft Bangla for every English-only string in your files (the Turntable scene and labels, Player, Scenes). Controls and announcements first. List them for Pratik's review.
> - **B5. Zoom:** at 200% and 400% zoom, your stages reflow inside the page's normal flow (A is making short screens scroll). Nothing clips, and the Turntable's globe stays clear of panels.

Notes: lucide in the Turntable Dock side (`Dock.tsx`, `DockMore.tsx`, `dock-actions.ts`) is A's; tell A. Scenes (`src/components/Scenes/**`) treated as mine for B2/B4 per this message.

## 4. Rules I'm following

- **Pre-merge check:** `bunx next typegen && bunx tsc --noEmit && bun run lint && bun test && bun run build` (221 tests at `cdee5e9`).
- **Merge steps:** commit on `session-b` (atomic, list every path; `git restore --staged :/` then `git add <paths>` then `git commit -m "…" -- <paths>`); `git rebase final-pass`; the pre-merge check; append one line to `docs/status/session-b.md` (step, commit, time, next) and commit it; `git merge-base --is-ancestor final-pass HEAD`; in `C:\Users\User\bloop` check `git status --porcelain` is empty, then `git merge --ff-only session-b`, nothing else. One session merges at a time; rebase again if `final-pass` moved.
- **Never:** `git add -A` / `.`, `git commit -a`, `git stash` on shared work, `git restore`/`reset` of the other session's work, pushing, `main`, deploying, `refresh:live`.
- **Strings:** every string in `src/lib/i18n/en/` and `bn/` (Turntable strings in `Turntable/strings-bn.ts`); run `bun run i18n:todo` after string changes; list every new Bangla string in the report.
- **No Tailwind arbitrary colour values**; colours are CSS variables in `globals.css` (my blocks are commented). Canvas code reads hex tokens through `css-tokens.ts`.
- **Layout and congestion:** maps never smaller than `docs/status/map-sizes.md`; one screen per page where possible; at most one overlay per stage besides the pointer and up to 6 globe labels; the Pause motion key is a small paper key in a corner; no captions or stats inside a stage; 16 px clear around every globe disc (built into `Globe/renderer.ts`: disc = canvas − 2 × (16 + 3) px); stages reflow at 200% and 320 px.
- **Motion:** every animation answers an action, the sound or the data; only star twinkle (≤15% of stars) and the Home globe's slow turn run by themselves; nothing crossfades between data frames; audio-driven visuals read the analyser and the audio clock; everything on the shared ticker (`hooks/use-ticker.ts`), paused when hidden or off-screen; transform, opacity and clip-path only (box-shadow only for key press and panel landing); interruptible, ≤600 ms except loops; reduced motion stops spins, pulses, drift, twinkle, auto-turn, swings and rings; every animated element `aria-hidden`; no new announcements; a Pause motion key on every self-running stage, never pausing sound. Tokens: `--duration-press: 80ms`, `--duration-flip: 280ms`, `--duration-land: 360ms`, `--duration-scene: 600ms`, `--ease-mechanical: cubic-bezier(0.2, 0.9, 0.1, 1)`, `--ease-settle: cubic-bezier(0.34, 1.4, 0.64, 1)`, mirrored in `src/lib/motion.ts`.
- **Turntable:** no interface element covers the globe (only the tonearm and up to 6 place labels); anything over the scene carries `data-tt-occluder`; data colours exact (swatch and ocean pixels within ±2).

## 5. Waiting on Session A

- **Its Home merge (new large round window, through `<JukeboxArt window={…} />`).** I'll know by A's message, or by `git log --oneline final-pass -10` showing its layout or Home commit, or a line in `docs/status/session-a.md` (on `final-pass`). Then do item 15.
- **Its layout merge** also moves Previous and Next into the player's More, fixes the `key` outline in its 23 files (`border-navy` after `key`), and wires "Now playing" in More via `openPlayerSheet(moreButton)`. A deletes `Dock/PlayerKey.tsx` then.
- **Open for Pratik:** the wording of "Then vs Now stage growing while playing" (item 16), the control-limit wording, the blue dot on Home (not reproduced; asked Pratik to inspect it), and the Turntable Esc behaviour (Esc stops sound and goes to `/listen`, since the prototype).

## 6. Running processes

- **Static server on 3201** (background task `bgh1z2iky`), serving `C:\Users\User\bloop-b\out` (built at `cdee5e9`). Kept running because Pratik views the site there. Restart: `cd C:\Users\User\bloop-b && python pipeline/health/static_server.py out 3201`.
- No dev server. Nothing on 3200.
