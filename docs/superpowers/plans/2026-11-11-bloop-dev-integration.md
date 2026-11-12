# bloop-dev Features in the final-pass Design: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tick a box only after its verification passed. If context is lost, re-read this file and `git log --oneline -15` before doing anything.

**Goal:** Every priority feature of `bloop-dev` works inside the `final-pass` redesign, with nothing from `final-pass` removed.

**Architecture:** One real git merge of `bloop-dev` at its last pre-cleanup commit (`ef57880`) into a branch cut from `final-pass`. Conflicts are resolved by fixed rules (final-pass owns every layout and style; bloop-dev contributes logic). Features then get switched on one at a time through `src/lib/flags.ts`, each mounted in a home that already exists in the final-pass design.

**Tech stack:** Next.js (static export), React, TypeScript strict, Tailwind v4 tokens in `src/app/globals.css`, shadcn/ui, Phosphor icons, TanStack Router, Bun (`bun test`), Playwright (`bun run e2e`).

**Spec:** this file. The decisions below were agreed with the owner on 2026-11-11. Deadline: 2026-11-12 12:00 local.

## Global Constraints

- **Branch:** `integrate-bloop-dev` (cut from `final-pass` at `e540b6b`). Never commit to `final-pass` or `main`. Push only to `origin/integrate-bloop-dev`.
- **Merge target:** `ef57880`, not the tip of `origin/bloop-dev`. The 16 commits after it only delete tests, CI and docs, strip comments, un-export symbols and split files; merging them would cut final-pass work and add ~130 conflict hunks of noise.
- **Nothing from final-pass is cut.** Its layouts, styles, copy, e2e specs, CI, docs, Bangla review work, Fires and Vegetation parts and the atmosphere removal all stay.
- **Design is final-pass's.** No new layout system, no old-design markup. Token names (`text-moon`, `text-haze`, `bg-tide`, `surface-glass`, `rounded-plate`, `eyebrow`) exist in final-pass and already map to the new palette, so bloop-dev components keep them. The one removed name is `font-serif`: replace with `font-wide` on headings (`text-title`, `text-headline`, `text-display`), delete it elsewhere.
- **No arbitrary colours.** A new colour is a variable in `globals.css`.
- **Icons:** Phosphor only. Replace any `lucide-react` import the merge brings in.
- **Flags:** a feature is visible only when its `ready` argument in `src/lib/flags.ts` is `true`. `PREVIEW` no longer turns flags on in development (Task 1), so `bun run dev` shows what production shows.
- **Not shown in the old style, ever.** A feature not restyled or not passing its checks keeps `ready: false`.
- **Clean code:** KISS, DRY, YAGNI. No `// >>> CV`, `// <<< DATA`, `// ART` marker comments in any file touched by hand. No dead imports, no commented-out code, no new abstraction with one caller. No `any`.
- **Commits:** one per task, files listed explicitly, conventional prefix (`merge:`, `feat(x):`, `fix(x):`, `test:`, `docs:`). **Never** a `Co-Authored-By` trailer or a "Generated with" line.
- **Bangla:** new strings arrive as drafts; list them in `docs/i18n/REVIEW.md` in the final task. Do not rewrite reviewed Bangla.
- **Gate after every task:** `bun run lint` clean, `bunx tsc --noEmit` clean, `bun test` green. Before each push also `bun run build`.

## Review Focus

1. A visitor with saved final-pass preferences (`jukebox.prefs.v1` holding `soundWords`, `comfortableText`, `timeLapseGlobe`) opens the merged app: every saved value still applies. Pinned by a case in `src/components/AppState/prefs.test.ts` (Task 1).
2. Sound off or not yet started: Orchestra, the dial, the journey and the new records never autoplay and never throw. Pinned by each feature's e2e spec (Tasks 3 to 7).
3. High-contrast theme on a final-pass page (Home cabinet, Listen cabinet, Turntable): no navy-on-black or paper-on-white text. Pinned by the axe pass in `e2e/a11y/low-vision.e2e.ts` (Task 8).
4. Bangla mode: no English fallback inside a sentence for a visible feature, and no raw message key on screen. Pinned by `src/lib/i18n/i18n.test.ts`.
5. Phone width (390 px): every new control is reachable without a horizontal scroll. Pinned by `e2e/layout.e2e.ts` running with the features on (Task 9).

---

## Conflict Resolution Rules (Task 1 uses these)

Markers: **O** keep the final-pass side, **T** keep the bloop-dev side, **B** hand-merge as stated. After resolving, fix what no longer compiles by removing the unused import or restoring the missing export; never by deleting a final-pass feature.

**Whole-file rules**

| Path | Rule |
|---|---|
| `src/components/Dock/ListenActions.tsx`, `src/components/TimeLapse/TimeLapseButton.tsx`, `src/components/pages/Home/Stations.tsx` | Stay deleted (`git rm`). Their callers on the bloop-dev side are in hunks resolved **O**. |
| `.gitattributes` | **O** (`* text=auto eol=lf` already covers the one file bloop-dev lists). |
| `playwright.config.ts` | Restore final-pass's file (`git checkout final-pass -- playwright.config.ts`), then add the `testIgnore` list from Task 1 Step 6. |
| `package.json` | Keep every final-pass script and dependency; accept bloop-dev's added scripts (`check:team`, `listen-test:summary`) and its `build` line. |
| `docs/i18n/TO_TRANSLATE.md` | Take either side, then regenerate with `bun run i18n:todo`. |
| `e2e/braille-protocol.e2e.ts`, `e2e/braille.e2e.ts`, `e2e/features/listen.ts`, `e2e/features/pages.ts`, `e2e/lib/app.ts` | **O**. If a bloop-dev spec needs a helper that only its side exported, add that one export back. |
| `src/lib/then-now.test.ts` (add/add) | **B**: keep every test from both sides. |
| `public/atmosphere/**`, `@takram/*` packages | Must not come back. If the merge adds them, remove them. |
| `src/lib/i18n/{en,bn}/*.ts` | **B**: keep every key from both sides. Where the two sides worded the same key differently, **O**. Where bloop-dev renamed a key (`field.soundOctober` → `field.noSound`), keep both keys. |

**Per-file rules for content conflicts**

| File | Rule |
|---|---|
| `src/app/globals.css` | Hunk 1 (focus ring): **O**, plus bloop-dev's `transition-property` line inside `:focus-visible`. Hunk 2: **O**, then append bloop-dev's whole low-vision block after it. |
| `src/app/layout.tsx` | **B**: final-pass fonts (`Archivo`, `Anek_Bangla`) plus the three low-vision fonts (`atkinson`, `notoBn`, `hindBn`) and `LANG_SCRIPT`. No Geist, Instrument Serif or Tiro. |
| `src/components/AppShell/index.tsx` | **O** both hunks. |
| `src/components/AppShell/use-global-escape.ts` | **O** (final-pass's layered Esc). |
| `src/components/AppShell/use-route-sync.ts` | **B**: `TITLED_PAGES` lookup, extended so `/transcript` and `/team` get a title; keep final-pass's `navigated` flag and scroll reset, and bloop-dev's `const from` line. |
| `src/components/AppState/{index.tsx,prefs.ts,reducer.ts}` | **B**: bloop-dev's `pickPrefs`/`PREF_KEYS` mechanism; `PrefKey`, `PREF_KEYS`, the boolean list and `ToggleKey` are the union of both sides (final-pass's `soundWords`, `comfortableText`, `timeLapseGlobe`, `allMuted` stay). |
| `src/components/Commands/{index.tsx,use-commands.ts}` | **B**: both imports; `SettingKey = ToggleKey`. |
| `src/components/BrailleExplorer/use-live-braille-source.ts` | **B**: final-pass's `label`/`short`, plus bloop-dev's `gap`/`note`. |
| `src/components/CaptionBar/index.tsx` | **B**: final-pass markup and `useRecordSounding`; add bloop-dev's sound-caption line under it behind `FLAGS.timedText`. |
| `src/components/Dock/{index.tsx,MixerMenu.tsx,dock-button.ts}` | **O**. |
| `src/components/ExploreControls/index.tsx` | **B**: bloop-dev's announce effect (leads, held frame, sound-only steps), keeping final-pass's rule that the first reading after a page appears is not announced. |
| `src/components/FrameView/index.tsx` | **B**: final-pass's phone panning, plus bloop-dev's `remember` argument and dwell handlers. |
| `src/components/Globe/index.tsx` | **B**: final-pass's props, plus `useHide3d`. |
| `src/components/Header/SettingsMenu.tsx` | **B**: final-pass's menu with, after `reduceMotion`: `AccessSettings` (replacing the `builtInVoice` toggle and its note when `FLAGS.speechChoices`), `hide3d`, `ChordToggle`, `ArtSettings`, each behind its flag. |
| `src/components/Header/{index.tsx,nav-items.ts}` | **O**. `TITLED_PAGES` gains Team and Transcript entries. |
| `src/components/HelpDialog.tsx` | **B**: both blocks. |
| `src/components/MonthByMonth/{RecordNotes.tsx,index.tsx}` | **O** for the component signature and markup; add `MonthlyProvenance` after `RecordNotes`; keep bloop-dev's exported helpers only if something imports them. |
| `src/components/OfficialRecords/index.tsx` | **O** for layout (Cabinet, RecordStrip, `official-grid`). Imports: union. Feature mounts come in Tasks 3, 4 and 5. |
| `src/components/Readout.tsx` | **O**. |
| `src/components/Scenes/delta/DeltaView.tsx`, `tunnel/TunnelView.tsx` | **B**: final-pass's Phosphor icons; bloop-dev's "save description" button with Phosphor `FileText`. |
| `src/components/Scenes/registry.ts` | **T** for `SCENE_VOICES`; keep `sceneCover` only if imported. |
| `src/components/Scenes/terrain/{TerrainView.tsx,use-terrain-data.ts}` | **B**: union of imports; final-pass's `loadSharedImage`, plus bloop-dev's optional `anomalyImage`. |
| `src/components/StatusBadge.tsx` | **O**; add bloop-dev's `note` kind next to `october` if any merged code uses it. |
| `src/components/ThenNow/{index.tsx,PartView.tsx}` | **O**. Feature mounts come in Tasks 5 and 6. |
| `src/components/Turntable/**` | **O**, except: `LabelLayer.tsx` gains the `data-globe-labels` attribute; `TurntableCanvas.tsx` gains `useHide3d`/`Hidden3DNote` around final-pass's canvas (no `Environment`, no `ContactShadows`). |
| `src/components/pages/Home/index.tsx`, `pages/ThenNowPage/index.tsx`, `pages/Listen/index.tsx` | **O**. |
| `src/components/pages/Listen/Inspector.tsx` | **B**: both imports. |
| `src/components/pages/How/{Tile.tsx,index.tsx}` | **O**. Cards come in Task 5. |
| `src/components/panels/MappingPanel.tsx` | **B**: both imports. |
| `src/components/panels/PanelTabs.tsx` | **B**: `shownTab(state.panel)` with final-pass's `bg-paper`. |
| `src/lib/audio/index.ts` | **B**: union of exports. |
| `src/router/routes.tsx` | **B**: union of imports and routes (`team`, `listen-test`, `transcript` added; final-pass's `officialSearch` kept). |

---

## Feature Homes (Tasks 3 to 8 use these)

| Feature | Flag(s) | Home in the final-pass design |
|---|---|---|
| Fire weather chord, Wildfires, Landslide rumble, Night lights, NASA radar method | `dataFireWeather`, `dataWildfires`, `dataLandslides`, `dataNightLights`, `dataRadar`, `dataLeftovers` | Official records: each is a row in `official-list` (through `src/lib/records.ts`, so it gets a C code and a `RecordStrip`); its player renders in `official-player` in place of the default `Player`. Fire weather's layer control: inside `MixerContent`. |
| Earth Orchestra | `artOrchestra` | Sound itself needs no UI. Instrument style choice: Settings. Legend: `Player/NowPlaying.tsx`, under the title. |
| Science to Art dial | `artDial` | Settings (`ArtSettings`). Per-record dial check: Official's player column, in the record's Details. |
| From the data / our artistic choice | `artChoices` | `MappingPanel` (each voice) and Official's player column. |
| Braille explorer on Then vs Now | none (always on once mounted) | A row in the player's More menu through `more-slot` ("Braille explorer"), and the `B` key; the explorer opens with final-pass's `BrailleExplorer` shell. |
| Short braille lines | `speechChoices` (the `brailleLines` choice lives in `AccessSettings`) | Settings. |
| Ask Bloop | `askBloop`, `dataAsk` | A row in More on Listen (`ListenItems`) that opens a shadcn `Sheet` (right on desktop, bottom on phones, same props as `PlayerSheet`). |
| Water's journey | `artJourney` | A row in More on Listen that opens the same kind of `Sheet` holding `JourneyPanel`. |
| Low-vision mode | `lowVision` | Header: `LowVisionButtons` in the right-hand group before `SettingsMenu`. Options: its own panel (`LowVision/Panel`). |
| Your lifetime + MIDI (optional) | `artLifetime` | Then vs Now's view choice gains "Your lifetime"; MIDI export is a row in More. |

Supporting behaviour with no visible UI of its own, on from Task 2: `describe` (the `D` key), `mapKeys`, `speechChoices`, mentor items 1, 2, 3, 9, 10 and 12.

Stay off (`ready: false`) unless a later task says otherwise: `timedText`, `expedition`, `tuning`, `tablePlaces`, `cvRead`, `cvChord`, `cvCard`, `cvListenTest`, `dataHealth`, `artRawPixel`, `artLetter`, `artListenTest`, `askBloopVoice`, `askBloopLlm`.

---

### Task 1: Merge `ef57880`, everything off, tree green

**Files:** every path in the merge; `src/lib/flags.ts`; `playwright.config.ts`; `src/components/AppState/prefs.test.ts`.

**Produces:** a branch that builds and behaves exactly like `final-pass`, with all bloop-dev code present and unreachable.

- [ ] **Step 1:** `git switch integrate-bloop-dev && git merge --no-commit --no-ff ef57880`
- [ ] **Step 2:** Apply the whole-file rules, then the per-file rules. Confirm with `git diff --name-only --diff-filter=U` printing nothing.
- [ ] **Step 3:** Prove nothing of final-pass was dropped: `git diff --name-only --diff-filter=D final-pass` prints nothing.
- [ ] **Step 4:** In `src/lib/flags.ts` set `const PREVIEW = process.env.NEXT_PUBLIC_BLOOP_PREVIEW === "1";` and set `ready` to `false` on every flag. Update the file's header comment to say so.
- [ ] **Step 5:** Add to `prefs.test.ts`:

```ts
test("final-pass preferences survive the merge", () => {
  const saved = { lang: "bn", soundWords: false, comfortableText: true, timeLapseGlobe: false };
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(saved));
  expect(readPrefs()).toMatchObject(saved);
});
```

- [ ] **Step 6:** In `playwright.config.ts` add `const PENDING = ["**/e2e/a11y/**", "**/e2e/art/**", "**/e2e/cv/**", "**/e2e/data/**", "**/e2e/integration/**", "**/e2e/mentor/**", "**/e2e/ask-bloop.e2e.ts"];` and `testIgnore: PENDING` on the config. A feature task removes its glob (or narrows it) once that feature's specs pass.
- [ ] **Step 7:** Replace `font-serif` per the Global Constraints in every file the merge added; replace `lucide-react` imports with Phosphor.
- [ ] **Step 8:** Gate: `bun install`, `bun run lint`, `bunx tsc --noEmit`, `bun test`, `bun run build`. Then `bun run e2e` on Chromium; it must match final-pass's result (same specs, same passes).
- [ ] **Step 9:** Commit: `merge: bloop-dev at ef57880 into the final-pass design, every bloop-dev feature off`.

### Task 2: Behaviour with no UI of its own

**Files:** `src/lib/flags.ts`; whatever the gate shows.

- [ ] **Step 1:** Set `ready: true` for `describe`, `mapKeys`, `speechChoices`.
- [ ] **Step 2:** Run `bun test src/lib/describe src/a11y src/components/AppState src/lib/frame-gap.test.ts`.
- [ ] **Step 3:** Remove `**/e2e/a11y/**` from `PENDING` for `descriptions`, `map-keys` and `speech-choices` only (keep the other a11y specs ignored by listing them one by one). Adapt selectors in those three specs to final-pass's UI; a spec that cannot pass by 02:00 goes back on the list with a one-line reason.
- [ ] **Step 4:** Gate, then commit: `feat(a11y): describe here, map keys and speech choices on in the final-pass design`.

### Task 3: New data records in Official records

**Files:** `src/lib/records.ts`, `src/lib/records.test.ts`, `src/components/OfficialRecords/index.tsx`, `src/components/Mixer.tsx` (or wherever `MixerContent` lives), `src/lib/flags.ts`.

**Consumes:** `appRecordPlayer(record: string): ReactNode | null`, `appRecordExtras`, `isAppRecord`, `AppRecordId` from `src/components/EarthRecords` and `src/lib/earth/records`.

- [ ] **Step 1 (test first):** in `records.test.ts`, assert `buildRecords` returns a group C record for each of `fires_fwi`, `landslide_lhasa`, `nightlights_bm` when its flag is on, after the official rows, each with a unique `C` code.
- [ ] **Step 2:** Extend `buildRecords` to append the app records (title from `lib/earth`), so the rack, code entry and crowns pick them up with no other change.
- [ ] **Step 3:** In `OfficialRecords/index.tsx` render `appRecordPlayer(current) ?? <Player … />` inside `official-player`, and `appRecordExtras` under it. Add the fire-weather layer control to `MixerContent`.
- [ ] **Step 4:** Restyle the four players only where they break the page: they must sit inside `official-player` without a second scroll area and use `surface-plate`/`rounded-plate` panels.
- [ ] **Step 5:** `ready: true` for the six data flags. Run `bun test src/lib/earth`; un-ignore and adapt `e2e/data/{fire,landslides,night-lights,radar,leftovers}.e2e.ts`.
- [ ] **Step 6:** Gate, then commit: `feat(official): fire weather, wildfires, landslide exposure, night lights and the radar method as records`.

### Task 4: Earth Orchestra and the Science to Art dial

**Files:** `src/components/Header/SettingsMenu.tsx`, `src/components/Player/NowPlaying.tsx`, `src/components/OfficialRecords/index.tsx`, `src/lib/flags.ts`.

- [ ] **Step 1:** `bun test src/lib/art src/lib/audio/orchestra` green before touching UI.
- [ ] **Step 2:** `ArtSettings` is already in Settings from Task 1; check it fits the 18rem popover (the dial's stops wrap, nothing overflows).
- [ ] **Step 3:** Mount `Art/Orchestra/Legend` in `NowPlaying` under the title; mount `ArtRecord` in Official's player column.
- [ ] **Step 4:** `ready: true` for `artOrchestra`, `artDial`. Un-ignore and adapt `e2e/art/orchestra.e2e.ts`, `e2e/art/dial.e2e.ts`.
- [ ] **Step 5:** Listen check in the browser: ocean, rain and one Official record at dial stops Measure, Blend and Music; Esc cuts the tail.
- [ ] **Step 6:** Gate, then commit: `feat(art): Earth Orchestra and the Science to Art dial`.

### Task 5: From the data / our artistic choice

- [ ] **Step 1:** `DataChoice` is imported in `MappingPanel` from Task 1; render it under each voice's rule. In Official it comes with `ArtRecord` (Task 4).
- [ ] **Step 2:** `ready: true` for `artChoices`. `bun test src/lib/art` green.
- [ ] **Step 3:** Gate, then commit: `feat(art): what is data and what is our choice, on every record`.

### Task 6: Braille explorer on Then vs Now, short braille lines

**Files:** `src/components/ThenNow/index.tsx`, `src/components/ThenNow/ThenNowBraille.tsx`.

- [ ] **Step 1:** `bun test src/lib/then-now-braille.test.ts src/a11y/shortForms.test.ts` green.
- [ ] **Step 2:** In `ThenNow/index.tsx` add the `brailleInput` memo, `openBraille` (stops the part first) and the `B` key handler from bloop-dev's side; render a "Braille explorer" row through `useMoreSlot()` and the explorer itself under the part, using the same shell classes as `LiveBrailleExplorer`.
- [ ] **Step 3:** Extend `e2e/braille.e2e.ts` with one test: on `/then-now`, `B` opens the explorer, the value line is not empty, `Esc` closes it and focus returns.
- [ ] **Step 4:** Gate, then commit: `feat(braille): the explorer on Then vs Now, and short lines for a 40-cell display`.

### Task 7: Ask Bloop and Water's journey

**Files:** create `src/components/Dock/ListenSheets.tsx` (one component owning both sheets, so the two rows share one open state and one `Sheet` setup); modify `src/components/Dock/MoreItems.tsx`.

**Produces:** `ListenSheetItems()` rendering two More rows ("Ask Bloop", "Water's journey") and the sheet for whichever is open.

- [ ] **Step 1:** `bun test src/lib/ask-bloop src/lib/art/journey` green.
- [ ] **Step 2:** Build `ListenSheets.tsx`: rows use `MORE_ITEM`; the sheet copies `PlayerSheet`'s `SheetContent` props (side by `MEDIA.phone`, `data-tt-occluder`, focus back to the More button). `AskBloop` renders with `open` fixed true inside the sheet; `JourneyPanel` gets `onClose`.
- [ ] **Step 3:** Each row is gated by its flag; add `<ListenSheetItems />` to `ListenItems`.
- [ ] **Step 4:** `ready: true` for `askBloop`, `dataAsk`, `artJourney`. Un-ignore and adapt `e2e/ask-bloop.e2e.ts`, `e2e/data/ask.e2e.ts` and the journey test in `e2e/art/pieces.e2e.ts`.
- [ ] **Step 5:** Gate, then commit: `feat(listen): Ask Bloop and Water's journey open from More`.

### Task 8: Low-vision mode

**Files:** `src/app/globals.css`, `src/components/Header/index.tsx`, `src/components/AppShell/index.tsx`, `src/components/LowVision/*` as needed, `src/lib/flags.ts`.

- [ ] **Step 1:** `bun test src/lib/low-vision` green.
- [ ] **Step 2:** In each `:root[data-lv-theme=…]` block add final-pass's palette variables (`--sea`, `--sea-deep`, `--paper`, `--navy`, `--navy-soft`, `--bubble`, `--coral`, `--dial`, `--space`, `--star`, `--star-warm`, `--shadow-on-space`, `--tt-glass-shadow`) with the theme's own background, text and accent values, so every final-pass surface follows the theme.
- [ ] **Step 3:** Flow layout: `:root[data-lv-flow] .app-shell` and the cabinet size rules release their fixed heights so pages scroll at 200 to 300% text.
- [ ] **Step 4:** Mount `LowVisionButtons` in the header's right-hand group, `useApplyLowVision()` in `AppShell`, `HelpPanel` in `main`.
- [ ] **Step 5:** `ready: true` for `lowVision`. Un-ignore and adapt `e2e/a11y/low-vision.e2e.ts`; its axe pass must be clean on Home, Listen, Then vs Now and Official in `hcDark` and `hcLight`.
- [ ] **Step 6:** If by 10:30 the Context Lens still misplaces on the cabinet map, hide its button and keep themes, text size, spacing and calm view. Say so in the hand-off.
- [ ] **Step 7:** Gate, then commit: `feat(low-vision): themes, text size, spacing and calm view on the final-pass design`.

### Task 9: Close out

- [ ] **Step 1 (optional, only if before 10:00):** Your lifetime + MIDI per the Feature Homes table; commit `feat(art): Your lifetime and MIDI export`.
- [ ] **Step 2:** `bun run i18n:todo`; add the new Bangla drafts to `docs/i18n/REVIEW.md`.
- [ ] **Step 3:** Full gate plus `bun run e2e` (Chromium and Firefox). Record the counts.
- [ ] **Step 4:** `git log integrate-bloop-dev --not final-pass --format=%B | grep -icE 'co-authored-by|generated with'` prints `0`.
- [ ] **Step 5:** `git push -u origin integrate-bloop-dev`.
- [ ] **Step 6:** Hand-off note to the owner: what is on, what is off and why, the test counts, the specs still in `PENDING`, and that `origin/bloop-dev`'s 16 cleanup commits are not merged.
