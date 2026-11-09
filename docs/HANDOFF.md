# Bloop: handoff for the next session

Written 2026-11-09 from git, the files and test output. Anything that could not be checked is marked **unverified**.

The plan is [`docs/BLOOP_FINAL_PASS.md`](BLOOP_FINAL_PASS.md). Section numbers below (§5.3 and so on) refer to it.

**Start here:** the working code is on `home-fix`, in `C:\Users\User\bloop-home`. It is ahead of `final-pass`, which holds only the first three commits and this document. Read AGENTS.md first. Never add Claude as an author or co-author on any commit or PR.

## 1. Branches and commits

`git log --oneline main..final-pass`:

| Commit | What it did |
|---|---|
| `11a096b` | Sound words for real sounds, caption boxes, Then vs Now comic panels (made by session `bloop-8c`) |
| `2f51179` | Phase 2: daylight palette, soft neo-brutalist surfaces, Archivo and Anek Bangla only |
| `c947be7` | Phase 1: judging blockers (Listen head, Esc, 404, stale copy, link previews) |

(`final-pass` also has the commit that adds this file on top of those three.)

`home-fix` holds those three plus these, and is **not yet merged into `final-pass`**:

| Commit | What it did |
|---|---|
| `b484a9d` | Turntable §1–§6: paper panels on space, labelled controls, Sources and checks in More, flat starfield, no bloom or vignette |
| `f2894ff` | Turntable §6 items 1–4: sound caption in the bar, whole globe labels only, How we know button removed |
| `e23d700` | Shared animation ticker, four loops moved onto it |
| `9ec62e6` | Then vs Now tab contrast |
| `593bd8c` | `.gitattributes`: LF line endings |
| `bb16210` | Home fix: wide-type scale, pages grow instead of overlap, Home trimmed, overlap test |

- **`main`** points to `d7c3495` (Merge pull request #20). Untouched.
- **Pushed:** `origin/home-fix` is at `b484a9d`. `final-pass` has **not** been pushed (no `origin/final-pass`).
- **Next merge:** `home-fix` into `final-pass`. It will not fast-forward, because `final-pass` has this document on top.

## 2. Worktrees

`git worktree list`:

| Path | Branch | For |
|---|---|---|
| `C:/Users/User/bloop` | `final-pass` | The original folder. Session `bloop-8c` worked here. Its `.next/` and `out/` are older builds |
| `C:/Users/User/bloop-home` | `home-fix` | All current work. Has its own `node_modules`, `.next/` and `out/` |

Neither can be removed yet. `bloop-home` can go once `home-fix` is merged into `final-pass`.

## 3. Done, per item

### Phase 1: `c947be7`
Applied by hand from Appendix A (the patch file was not in the repo).
- **Deviations:** `public/og.jpg` is deliberately missing; §3.2 leaves it for phase 8. Nav numbers were then removed entirely in `bb16210`.

### Phase 2 (theme, Archivo-only type, serif and italic removed): `2f51179`
- **Deviations:**
  - Focus ring: navy beside navy fills, not paper. The 3 px offset puts the ring on the page around the control, where paper is nearly invisible. Paper only on the night sky.
  - `display-tight` keeps `text-wrap: balance` as well as its tracking; it has no font family.
  - Body gradients, the film grain and the blur in the page-change animation were also removed.
  - A `night-sky` utility was added: tokens re-pointed for the intro and space windows.

### Sound words: `11a096b`
Made by session `bloop-8c`, on its own brief, which this session has not seen. Deviations: **unverified**. Open review points are in section 7.

### Home fix: `bb16210`
- **Deviations:**
  - `--text-hero` added (same as `text-display`, stops at 66 px). `text-display` as specified wrapped to 3 lines at 1920 px in the 40rem column.
  - `start.silentHint` was kept because the start gate still shows it (`StartActions silentHint`). Home no longer shows it.
  - The shell is now one screen tall at every width and `main` scrolls, so the dock never covers content.
  - The dock's action row drops to a second row below 1280 px (`xl:flex`), to pass the overlap test at 1024 px. See section 7 on the dock squeeze.
  - `ChoiceGroup` pills now wrap long names.
  - "Reset sound choice" only shows in Settings after Start.

### LF line endings: `593bd8c`
`git add --renormalize .` changed no tracked file; only `.gitattributes` was added. No deviation.

### Tab contrast: `9ec62e6`
axe on `/then-now`: clean at `d7c3495`, 4 serious at `2f51179` and at `11a096b`, so **phase 2 introduced them**. Cause: `text-foreground/60` in `ui/tabs.tsx`, 3.94:1. Now `text-haze`. No deviation.

### Ease token
`--ease-mechanical` is `cubic-bezier(0.2, 0.9, 0.1, 1)`. No commit was needed.

### Turntable fix (§1–§6): `f2894ff` and `b484a9d`
- **Done:** token remap; panels on `on-space`; every control labelled; 4 keys plus More; Sources and checks drawer restored; readout chip like Listen; legend tubes; search as a labelled key; scene sleeves; loading panel; flat `#0B1530` sky with 800 stars; bloom and vignette removed; globe labels as paper pills, at most 6, hidden on collision or near the edge.
- **Platter-ring cause:** the rim is the platter body, a fully metallic aluminium that mirrors the studio HDRI. Bloom then spread that reflection into a glow. With bloom gone the halo is gone. The reflection was still near-white, so the platter got its own darker metal (`PLATTER_REFLECTANCE = 0.55`, `materials.platter` in `scene/deck.ts`). `envMapIntensity` has no effect here because the environment is scene-wide.
- **Data check:** six ocean pixels matched within ±1 per channel before and after (`f2894ff` build vs the Turntable build). Sky reads exactly 11,21,48.
- **Deviations:**
  - Play/Pause stays on the bar as a fifth, coral key, because every action had to stay. The brief's four keys sit beside it. More also holds Records, Tour, Turning and speed, and Settings.
  - There are two Search controls, the top-right key and the bar key, because the brief asks for both.
  - The sky and stars are drawn in the overlay pass (`createStudio(palette, { exact: true })`) so tone mapping cannot shift the colour. The deck became an occluder, and the overlay composite now sets alpha. The Scenes keep the sky in the main pass, so it is not exact there.
  - The Scenes share these tokens, so text directly over them was changed to `text-star` and their dock now shows labels.
  - Loading has no determinate bar; no texture progress is available.
  - The legend no longer shows the frame-pixel marker. The tube fill carries the level.
  - The bar's caption stays until the next one instead of fading, so the bar has no blank row. The `then-now` e2e check now waits for its tabs (it was a race).
  - On a 390 px phone the readout chip covers the top of the globe. Not fixed.

## 4. Not done

Detail for each phase is in `docs/BLOOP_FINAL_PASS.md`.

### Phase 3: nothing built (§5)
`src/lib/records.ts` does not exist. Still to do: records registry; header pills and vinyl logo, with Official records leaving the nav; Listen cabinet, crown and tubes; one-line readout; rack with code entry; mini player; Liner notes ("Sources and checks") on Listen; Turntable using the shared mini player.

### Phase 4: nothing built (§6)
Now Playing sheet: sleeve, frame scrubber, captions as lyrics, Up next.

### Phase 5: nothing built (§7)
`Starfield` and `SpaceWindow` do not exist. Globe extension, Then vs Now motion stage, time-lapse globe, intro stars, Home `SpaceWindow`.

The Home tour key is already done (`bb16210`), and Home has four cards fewer than the plan expected: the cards were removed entirely.

### Motion pass: mostly not done
**Done:** `src/hooks/use-ticker.ts`, with four loops on it: `src/hooks/use-playhead.ts`, `src/components/FrameView/use-overlay-loop.ts`, `src/components/Waveform.tsx`, `src/components/panels/ProofHelix.tsx`. `--ease-mechanical` exists. Blur removed from `motion` props and keyframes.

**Still there and banned:** `animate-pulse` in `Opening.tsx`; `animate-signal-pulse` in `SignalMark.tsx` and `Story/StoryPanel.tsx`; the `signal-pulse` and `breathe` keyframes and `--animate-*` entries in `globals.css`; `RISE`/`STAGGER` fade-ups in `StartGate`, `How` and `NotFound`.

The brief exists only in chat, so here it is in full:

> Motion pass for Bloop. Make the interface beautiful through motion that is caused by something real: a user action, the sound, or the data. A jukebox is a machine, so the motion should be mechanical and physical. No decorative motion. Follow AGENTS.md (i18n, no Tailwind arbitrary values, type-safe, hooks in component folders or `src/hooks/`). If an element named below doesn't exist yet, skip that item and list it in your summary.
>
> **Rules.** (1) Every animation answers a user action, the sound, or the data; the only ambient motion allowed is star twinkle (at most 15% of stars); spinning happens only while sound plays. (2) Data honesty: never crossfade, interpolate or morph between data frames or values; time-lapse frames cut; the odometer rolls only between real settled values; motion moves the needle and the chrome, never the data. (3) Sync to sound: audio-driven visuals read levels from `analyserFor(mode)` (`src/lib/audio-engines.ts`), as `Waveform.tsx` does, and time from the audio clock in `src/lib/audio-adapter/index.ts`; never `setInterval` for anything that should match the sound. (4) One shared ticker, `src/hooks/use-ticker.ts`; WebGL loops keep their own. (5) GPU-friendly only: `transform`, `opacity`, `clip-path`; the single exception is the wordmark's width axis; no layout properties, no `filter: blur`, no box-shadow animation except the press and land shadows. (6) Interruptible; nothing longer than 600 ms except loops. (7) Reduced motion, OS and `state.reduceMotion`: off entirely for spins, bubbles, landing, breathing, drift, twinkle; instant for flips, odometers, tubes; the equaliser becomes a static "playing" glyph. (8) Accessibility: every animated element `aria-hidden` or presentational; no announcement depends on animation; nothing flashes more than 3 times per second; every stage with self-running motion over 5 s has a "Pause motion" key that stops motion and never the sound.
>
> **Tokens (`:root`).** `--duration-press: 80ms; --duration-flip: 280ms; --duration-land: 360ms; --duration-scene: 600ms; --ease-mechanical: cubic-bezier(0.2, 0.9, 0.1, 1); --ease-settle: cubic-bezier(0.34, 1.4, 0.64, 1)`. Export the same values for `motion/react` from `src/lib/motion.ts`.
>
> **Remove:** blur entrances; `@keyframes breathe` and `animate-breathe`; `signal-pulse` / `animate-pulse` glow dots (a playing indicator becomes the equaliser or a static mark); `@keyframes rise` as a generic fade-up.
>
> **The motions.**
> 1. Needle drop: when sound starts, a tonearm on the cabinet crown's right swings from its rest post onto the record, 500 ms `--ease-mechanical`, then a 2-step settle (−2° and back, 80 ms); on stop it lifts back, 400 ms; the map reveal follows. Reduced motion: placed, no swing.
> 2. Changing record: the crown's title strip flips like a split-flap (rotateX 0 → −90°, 140 ms, swap text, 90° → 0, 140 ms); where View Transitions exist, the rack and crown chips share `view-transition-name: now-playing-chip`. A new pick cancels the old.
> 3. Vinyl spin (mini-player disc, player-sheet disc, Turntable platter): 33⅓ rpm, 1.8 s per turn, while sound plays. Spin up over 400 ms, down over 700 ms, velocity driven by the ticker. Each label has an off-centre mark.
> 4. Bubble tubes: ocean bubble rise speed follows the normalised value; rain bubbles per second follow the log rate, zero when dry; flat paper circles 4–8 px, 1.5 px navy outline, pool of 8 per tube, at most 3 new per second; fill eases over 280 ms; bubbles stop when sound pauses.
> 5. Equaliser: 3 bars read low, mid and high bands from `analyserFor(mode).getByteFrequencyData()` at 15 fps, quantised to 4 heights; silent means rest height.
> 6. Odometer: each changed digit rolls vertically, 160 ms, tabular; skip the roll while an arrow key is held. One shared `Odometer` component.
> 7. Wordmark (Home hero and intro only): `wdth = 112 + 13 × level`, capped at 125; 60 ms attack, 300 ms release; holds at 125 when silent or under reduced motion.
> 8. Panels land on route change: top-level slabs from `translateY(-8px)` with 0 px shadow to their place with 6 px shadow, 360 ms `--ease-settle`, staggered 40 ms, at most 3. Text doesn't animate. Nothing on scroll. Keep the View Transition that holds header and dock.
> 9. Stars follow the globe: in a `SpaceWindow` with a globe, the starfield shifts opposite to longitude change by 5%, wrapping. No independent drift.
> 10. Then vs Now: ring pulses on each beat (scale 1 → 1.6, opacity 1 → 0, 400 ms) on the audio clock; year uses `Odometer`; each stripe fills with a 120 ms clip-path wipe; the playhead moves continuously between indices on the audio clock.
> 11. Time-lapse: frames cut; the globe eases to the storm point; the ring pulses once per frame.
> 12. Scrubber knob: critically damped spring, about 200 ms.
> 13. Turntable: platter uses item 3; keep and restyle `needle-drop.ts`, no glow.
> 14. Press and hover: keys press into their shadow (80 ms); strips lift 1 px on hover; nothing else reacts to hover.
> 15. Loading: replace spinners with a slowly spinning record plus text; a determinate bar where progress is known.
>
> **Banned:** fade-up or slide-in on scroll, `whileInView`, scroll-linked parallax; blur-in, glow or pulse halos, gradient blobs, animated gradient borders; magnetic buttons, cursor trails, 3D tilt cards; text scramble, typewriter, marquees; confetti, Lottie, skeleton shimmer; springy bounce everywhere; crossfades between data frames.
>
> **Checks.** The gate; `git grep -n -e "whileInView" -e "useScroll" -e "animate-breathe" -e "animate-pulse" -e 'filter: "blur' -- src ':!src/components/AudioHarness'` prints nothing; reduced motion both ways; sync within one frame; data honesty; 10 s Performance recording at 4× CPU with no frame over 33 ms and only the shared ticker and WebGL loops on requestAnimationFrame; axe; every self-running motion has a working Pause motion key; `bun run e2e`. Commit message: `feat(motion): mechanical jukebox motion synced to sound; remove blur, glow and fade-up`.

Items 1–5, 9, 10, 12 need elements from phases 3–5. Item 7 needs a "Bloop" wordmark on Home and the intro. Check `ComicWordmark` (`11a096b`) first.

### Phase 6: partly done (§8)
- **Done:** bloom and vignette removed; `--space` background and stars; labelled controls; loader.
- **Not done:** toon deck (`MeshToonMaterial`, inverted-hull outlines, hard shadow); flat land and quantised lighting; removing SSAO, atmosphere, DoF and AgX, and the atmosphere's precomputed load (this is the load-time win); scene sleeves as line-art icons; first-frame time measurement.
- The Blue Marble note goes away with flat land (code comment in `CreditsLink.tsx`).

### Phase 7 leftovers (§9)
1. Frame labels still on Then vs Now and How we know.
2. How we know: the ground-vs-satellite stat is not rephrased. Tiles are content-height.
3. Official records: grouping as C1… strips, map coastlines, copy fixes, commas between SVS items. The dock no longer covers content.
4. Then vs Now: broken axis, no orphan tabs on phones, chart before controls on phones, shared-cell note before the chart, More ways to listen menu, More records tab, finding sentence above the chart.
5. Information pages without the gate: not done (`gated` still covers every page but Home).
6. Designed loading, error and empty states.
7. Bangla: nav labels, `SourceBadges`, frame-rule sentences. `formatUtc` with `lang` already works.
9. `<noscript>` block.
10. `npm run refresh:live`.

Item 8 was done in phase 1. The Turntable part of item 4 is done.

### Phase 8: not started (§10)
`public/og.jpg`, `e2e/a11y.e2e.ts`, `docs/FINAL_PASS.md` do not exist. Also: full manual checklist, screen-reader passes, low-vision passes, performance budget, Lighthouse, congestion pass.

### §0.6 rules not yet implemented
Comfortable text setting, forced-colours rules, latitude slider and "Move the needle" group, three skip links, chart data tables, Pause motion keys.

### §12 team tasks (people, not agents)
Listening pass, two user tests, Bangla review, 30-second video (due 14 Nov), data refresh before judging.

## 5. Test state

**Gate** (run in `bloop-home`):

```sh
bunx next typegen && bunx tsc --noEmit && bun run lint && bun test && bun run build
```

Passes at `b484a9d`: 204 unit tests, 0 failures.

**E2E, production build:**

```sh
BLOOP_URL=http://localhost:3101 PLAYWRIGHT_BROWSERS_PATH='D:\Jukebox\tools\ms-playwright' bun run e2e --project=chromium
```

| Date | Commit | Port | Browser | Result |
|---|---|---|---|---|
| 2026-11-09 | `b484a9d` (before its one test-only change) | 3101 | Chromium 1194 | 66 passed, 1 failed, 1 skipped |
| 2026-11-09 | `b484a9d` | 3101 | Chromium 1194 | `then-now` alone: 8 of 8 after making the test wait for its tabs |
| 2026-11-09 | `e23d700` | 3101 | Firefox 1495 | 55 passed, 0 failed, 1 skipped. **Not re-run since** |

**Firefox:** it **has** run locally, once, on `e23d700` (results in `bloop-home/data_raw/_tmp/features/firefox-3d`). It has not run on `f2894ff` or `b484a9d`.

**CI e2e workflow:** does not exist. `.github/workflows` holds only the `data-*` and `official-resources-watch` workflows.

**axe, serious or critical, on `b484a9d`, port 3101:** none on `/`, `/listen`, `/then-now`, `/how`, `/official`, `/turntable`. Also none with the Turntable's More popover or Sources and checks drawer open, at 1440 and 390 px.

**Skipped or known-failing:**
- `health-records.e2e.ts`, "live layer: SST and rain move with the needle and sound": skipped in both browsers. It needs the plan file written by `npm run health`, so the skip does not depend on any code here. So this check has not actually run.
- `bangla` and `open-data` feature checks are PARTIAL, not failing: untranslated strings, and no query API.
- Before phase 1, only the `TO_TRANSLATE` unit test failed (CRLF on Windows). Fixed by `593bd8c` for fresh checkouts. A full e2e baseline on `d7c3495` was never completed; only the braille tests were run there (6 of 6).

## 6. Environment

- **Ports:** production 3101, dev 3100. **Never 3000.** An old `next dev` from the `bloop` folder answered on `localhost:3000` during this session and showed an old build. Temporary comparison servers used 3102–3106.
- **`BLOOP_URL`** points Playwright at a running server. Without it, the config starts `bun run dev` on 3000, so always set it.
- **Serve production:** `bun run build && python pipeline/health/static_server.py out 3101` in `bloop-home`.
- **Playwright 1.56.1 browsers:**
  - Pinned builds are on `D:\Jukebox\tools\ms-playwright` (`chromium-1194`, `chromium_headless_shell-1194`, `firefox-1495`, all complete). Set `PLAYWRIGHT_BROWSERS_PATH` to that.
  - `%LOCALAPPDATA%\ms-playwright` has only `chromium-1234` and `chromium-1248`. The partial `chromium-1194` and `__dirlock` there were deleted.
  - Some earlier scratch runs used Chromium 1248.
  - `bunx playwright install` hangs at 247 MB while unpacking under Node 26.7. Under Bun it fails outright. This works: `npx -y node@22 node_modules/playwright/cli.js install chromium firefox`.
- **Windows and Git Bash:**
  - `core.autocrlf=true` on this machine.
  - Git Bash rewrites leading `/` arguments into Windows paths; use `MSYS_NO_PATHCONV=1`.
  - Heredocs through the Bash tool mangled backslashes; write scripts to files.
- **Paths:** repo `C:\Users\User\bloop`, worktree `C:\Users\User\bloop-home`, global instructions `C:\Users\User\.claude\CLAUDE.md`.

## 7. Decisions made in chat

- `--ease-mechanical: cubic-bezier(0.2, 0.9, 0.1, 1)`.
- The caption stream is unchanged; the ocean value in a caption is allowed (captions are a transcript, not a display).
- The Turntable drawer lives in More as "Sources and checks".
- The dock squeeze is fixed by phase 3, not by wrapping.
- Merge only into `final-pass`; `main` stays untouched until phase 8 passes and Pratik approves.
- Sound words pending Pratik's review: snow → "ting" / টুংটাং proposed; হু হু; the settings label ধ্বন্যাত্মক শব্দ.

Also from chat: never add Claude as an author or co-author; every commit goes to `home-fix` and is pushed there.

Note: the code still has snow as "hush" / ফিসফিস (`src/lib/sound-words.ts`). The proposal above is not applied.

## 8. Strings awaiting Pratik's Bangla review

All drafts. Taken from `git diff main` on the Bangla files, on `home-fix`.

| Key | English | Bangla |
|---|---|---|
| `badge.comingOctober` | Planned | পরিকল্পিত |
| `field.soundOctober` | No sound for this record yet | এই রেকর্ডের এখনো শব্দ নেই |
| `frame.compact` | EIC frames: {list}. Sound generated live from these frames. | EIC ফ্রেম: {list}। শব্দ এই ফ্রেমগুলো থেকে সরাসরি তৈরি। |
| `frame.compactItem` | {product}, {datetime} UTC | {product}, {datetime} UTC |
| `globe.teaser` | Early preview | প্রাথমিক প্রিভিউ |
| `home.frameCaption` | NASA EIC frame: ocean temperature, {date}. | নাসা EIC ফ্রেম: সমুদ্রের তাপমাত্রা, {date}। |
| `home.title` | Hear Earth's ocean and rain. | শুনুন পৃথিবীর সমুদ্র আর বৃষ্টি। |
| `home.tour` | Take the 90-second tour | ৯০ সেকেন্ডের ট্যুর নিন |
| `how.openGlobe` | Read the preview | প্রিভিউ পড়ুন |
| `key.x.action` | X-ray: how a colour becomes a number and a sound (planned) | এক্স-রে: একটি রং কীভাবে সংখ্যা ও শব্দ হয় (পরিকল্পিত) |
| `october.heading` | Planned next | পরের পরিকল্পনা |
| `settings.soundWords` | Sound words | ধ্বন্যাত্মক শব্দ |
| `start.lead` | NASA's pictures of Earth, turned into live sound you can explore by ear, with or without sight. | নাসার তোলা পৃথিবীর ছবি, এখন জীবন্ত শব্দে: কান দিয়ে ঘুরে দেখুন, চোখে দেখতে পান বা না পান। |
| `story.xraySkipped` | X-ray is planned: it waits for NASA's colorbar data. | এক্স-রে পরিকল্পিত: এটি নাসার কালারবার ডেটার অপেক্ষায়। |
| `turntable.loading` | Loading the turntable | টার্নটেবিল লোড হচ্ছে |
| `turntable.more` | More | আরও |
| `turntable.more.back` | Back | ফিরে যান |
| `turntable.search.short` | Search | খুঁজুন |
| `turntable.sources` | Sources and checks | উৎস ও যাচাই |
| `xray.unavailable` | X-ray is planned: it needs NASA's colorbar data, which isn't published yet. | এক্স-রে পরিকল্পিত: এর জন্য নাসার কালারবার ডেটা লাগবে, যা এখনো প্রকাশিত হয়নি। |

Sound words in `src/lib/sound-words.ts` (not i18n keys):

| Id | English | Bangla | Marked draft in code |
|---|---|---|---|
| `rainLight` | plip | টুপটাপ | no |
| `rainHeavy` | drum | ঝমঝম | no |
| `oceanWarm` | hum | গুনগুন | no |
| `oceanCool` | hoo | হু হু | yes |
| `snow` | hush | ফিসফিস | yes |

The `turntable.*` keys in `docs/i18n/TO_TRANSLATE.md` still show in English in Bangla mode.

## 9. Backups and leftovers to clean up

| Item | State | Safe to delete? |
|---|---|---|
| `C:\Users\User\bloop-backup-20261109-1848` | The pre-worktree backup: `tracked.patch`, untracked copies, `my-hunks.md` | Yes. All of it is committed on `home-fix` or in `11a096b` |
| Stash entries | None | Nothing to do |
| Temporary worktrees | `bloop-axe-base` already removed | Nothing to do |
| `C:\Users\User\bloop-home` | Current work | No, not until `home-fix` is merged |
| Session scratchpad builds (`out-baseline`, `out-phase1`, `out-2f51179`, `out-11a096b`, `out-f2894ff`) and screenshots under `%TEMP%\claude\…\scratchpad` | Comparison copies and final screenshots | Yes, once the screenshots are no longer needed |
| `C:\Users\User\AppData\Local\ms-playwright\chromium-1234`, `chromium-1248` and their headless shells | Older browsers, not used by Playwright 1.56.1 | Yes, unless another project needs them. **Unverified** whether one does |
