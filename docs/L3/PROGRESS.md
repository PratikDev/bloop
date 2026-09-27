# L3 Progress Record: Interface and Accessibility

Last updated: 28 Sep 2026, after Phase 4 (captions, Describe mode, Bangla fallback, October labels, accessibility pass).
Branch: `L3-interface` on GitHub (`origin/L3-interface`), local branch `L3`.
Owner: L3 (Interface / Accessibility).

This file lets any teammate understand where L3 stands without reading the chat or the code. For the detailed requests to other lanes, see [contract-proposals.md](contract-proposals.md). For how to swap in L2's engine, see [integration.md](integration.md). For the visual design, see [design-plan.md](design-plan.md).

---

## 1. Summary

L3 builds the web app people see and use: the map, the controls, the panels, and the accessibility features that let blind and low-vision people explore NASA's frames by ear.

**Where it stands:** Phase 2 (the core app) is done. Phase 3 item 1 (Then vs Now and Place History) is done and pushed. Phase 3 item 2 (storm time-lapse) is done and pushed. The satellite whisper and Story Mode are done and pushed. Story Mode's length (97 s with the test voice, target 60 to 90 s) still needs a person to listen. X-ray is still blocked on L1's colorbar data. Phase 4 is done in code and scripted checks; screen readers, Bangla translation and a person listening remain (section 9).

**What works today:**
- You can open the app and choose "Start listening" or "Explore without sound".
- You can move a cursor over today's real NASA ocean temperature and rain frames with the mouse, touch or keyboard, and hear and read the value under it.
- You can hear a sweep outward from Chattogram.
- You can play the storm time-lapse, and Story Mode: a guided tour of about 1.5 minutes.
- After a spoken value, a chime and a caption name the satellite mission and dataset.
- You can play "Dhaka then vs now" (heat, monsoon, water) with charts that follow the sound, and play a decade of any place's monthly record.

**L2 has reviewed L3's work** (PR #4, 28 Sep): the branches merge cleanly except `bun.lock`, L2's engine type-checks against the UI's adapter, and every bug L2 found has been fixed (section 3b).

**The main caveat:** the sound comes from an **interim sound engine** that L3 built to L2's planned API, because L2's real engine isn't finished. The app says so with an "Interim sound engine" badge. The sound has been measured by software but **not yet listened to and approved by a person**.

---

## 2. Timeline

| Phase | What it produced |
|---|---|
| **Phase 0: report** | Checked the repo, branches and lockfile. Found that L1's real data was already published, L2's `audio.ts` didn't exist yet (only `mapping.ts`), and `lib/data.ts` didn't exist anywhere. Listed conflicts between the brief, the plan and the data (for example, the §16 ocean error number no longer matches the data). Proposed the file list. |
| **Phase 1: design plan** | [design-plan.md](design-plan.md): colours, contrast tables, type scale, layout for desktop, tablet and mobile, the motion list, and a self-review. Measured the colours in the real NASA frames and chose shapla pink and indigo because NASA's colormaps never use those hues. Added a colour-blindness check on every pixel of the real frames, and a 200% readout weight test. |
| **Phase 2: core app** | The interim sound engine, the real data decoder, the theme, app state and i18n, the map, the readout, keyboard and screen-reader support, the Truth and Mapping panels, the Start overlay and the opening sequence. Then "Explore without sound" and a class-merging fix. |
| **Phase 3, item 1** | Then vs Now (heat, monsoon, water with charts and playheads, "then left, now right", disclosure panel) and Place History (four places, heat or rain, a decade played month by month). Also: sweep moved to Chattogram, the L2 API split with fallbacks, and shape checks on L1's files. |
| **Phase 3, item 2 (28 Sep)** | Storm time-lapse: the last 48 half-hourly rain frames at 2 frames per second, the cursor following the heaviest rain near Bangladesh, each frame's own value and time on screen, and a sound-off version driven by a visual clock. |
| **Phase 3, whisper and Story Mode (28 Sep)** | Satellite whisper after every spoken value. Story Mode: ocean hum, sweep from Chattogram, storm time-lapse, satellite whisper, X-ray (skipped, labelled), "How we know". The time-lapse loading message now shows at once. |
| **Phase 4 (28 Sep)** | Captions for every sound (spoken lines and the end of Place History added); Describe mode; the Bangla setting (English fallback, English speech with Bangla on screen); "Coming in October" labels; credits split into "Data in this app" and "Also used in our testing"; an accessibility pass (keyboard, contrast, 200% zoom, phone, reduced motion). |
| **L2 review of PR #4 (28 Sep)** | Eight sound and UI bugs fixed (section 3b). L2 accepted step events counting data points (B5) and `playSeries` (B6), and agreed the Then vs Now caption keys (B7). Shared-file rules written down (contract-proposals §B4). |

---

## 3. What's built, feature by feature

Status key: **Complete** = works and was tested in a browser. **Interim** = works, but a temporary version will be replaced. **Pending** = not built, or blocked.

| Feature | What it does for the user | Main files | Status |
|---|---|---|---|
| **Interim sound engine** | Turns values into sound: the ocean as a pitch, rain as drops, snow as soft bells, heat and water for Then vs Now, speech with the sound dipping underneath, legend tones, the sweep, the opening. Esc fades everything in about 50 ms. | `src/lib/audio-adapter/` (`interim-engine.ts`, `graph.ts`, `scheduler.ts`, `live.ts`, `players.ts`, `sequence.ts`, `then-now.ts`, `speech.ts`, `earcons.ts`, `mixer.ts`, `voices/*`) | **Interim.** Uses L2's planned function names. To be replaced by L2's engine with a one-file change (`integration.md`). |
| **Audio adapter** | The one door between the UI and any engine. Checks at build time that an engine matches L2's API (now including `playSeries`, which L2 accepted), and fills in safe fallbacks for the remaining extras (analyser, per-voice volume). | `src/lib/audio-adapter/index.ts`, `types.ts`, `fallbacks.ts` | **Complete.** L2 checked that its engine type-checks against it. |
| **Data decoder** | Reads L1's real grids and gives the value at any point (`valueAt`). The rain grid loads after the page first appears, to keep the first load lighter. | `src/lib/data/` (`latest.ts`, `grid.ts`, `value-at.ts`, `fetch.ts`, `paths.ts`) | **Complete.** Checked against Python at 506 points. |
| **Context data loaders** | Loads the demo, GRACE, GISTEMP and GPCP files when a view first needs them, and checks their shape so a changed file shows an error instead of crashing. | `src/lib/data/context.ts`, `validate.ts` | **Complete.** |
| **Theme** | The "Night over the Bay" look: indigo surfaces, one shapla pink accent for anything that listens or points, Anek Bangla and Tiro Bangla fonts, one focus ring for everything. shadcn components re-themed. | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`, `src/lib/utils.ts` | **Complete.** |
| **App state and i18n** | One store for cursor, track, mode, language and settings. Every visible string goes through one table, so Bangla can be added in one place. | `src/components/AppState/`, `src/lib/i18n/` | **Complete** for English. **Pending** for Bangla (no strings translated yet; list in `bangla-strings.md`). |
| **Frame view** | Draws the EIC frame, the land mask and coastline under the rain frame, the cursor, the sound rings (drawn from the actual sound), rain ripples and the sweep ring. Sharp on high-density screens; pauses when the tab is hidden. | `src/components/FrameView/` | **Complete.** |
| **Readout and frame label** | The big value under the cursor, the coordinates, and the plan §16 frame label ("EIC frame: …, … UTC. Sound generated live from this frame."). On the map on wide screens, below it on phones. Bengali digits sit in fixed-width cells so they don't jump. | `src/components/Readout.tsx`, `FrameLabel.tsx` | **Complete.** |
| **Keyboard and screen reader** | The map is a focusable region. Keys: arrows (Shift for 10°), Enter speaks, Space pauses, 1/2/3 tracks, S sweep, M mute, D describe, C captions, T Then vs Now, L legend, P provenance, X X-ray, H or ? help. Letter keys only work while the map has focus; Esc works everywhere. One polite live region announces settled values. | `src/components/ExploreControls/`, `Announcer/`, `Commands/`, `HelpDialog.tsx`, `JukeboxApp/use-global-escape.ts` | **Complete** as built. **Not yet tested** with a real screen reader. |
| **Captions** | A caption for every sound event, in the serif font, in the chosen language (English until translated). Engine captions plus two the UI posts itself: each spoken line (Enter, Story, Describe) and "History finished". Checked: sweep, time-lapse, Then vs Now, Place History, legend, motif, whisper, Story. With sound off, it shows the reading instead. | `src/components/CaptionBar/`, `src/lib/ui-captions.ts`, `src/lib/i18n/en/captions.ts` | **Complete.** |
| **Start overlay** | "Start listening" is the first and only focusable thing on load; it unlocks audio. "Explore without sound" (second in focus order) opens the map with captions on and no audio; "Turn sound on" is available later. | `src/components/StartOverlay.tsx` | **Complete.** |
| **Opening ("Close your eyes")** | About 10 s of real ocean and rain sound over darkness, the live waveform as one line, then the frame opens outward from the equator. Skip and Esc end it. Instant cut with reduced motion. | `src/components/Opening.tsx`, `players.ts` (`playOpening`) | **Complete.** Simplified: the waveform line doesn't visibly move onto the equator before the reveal. |
| **Truth panel** | How we know the sound is right. Rain: sentence built from `rain.json` (today's re-check), plus the first check's plot, labelled as such. Ocean: "Verification being updated". | `src/components/panels/TruthPanel.tsx`, `src/lib/truth.ts` | **Complete**, but its wording is **Pending team approval** (see §8). |
| **Mapping panel** | Every value-to-sound rule, generated from L2's `mapping.json`, with "Hear the legend" buttons. Design choices are marked. | `src/components/panels/MappingPanel.tsx` | **Complete** in English. Rule sentences come from L2's `ruleText()` (English only). |
| **Provenance panel** | P (or the Provenance tab) shows, for the point on screen and the current track: the value, the full dataset name (`source_dataset`), the NASA SVS visualization with its ID and a link to its page, the frame time (for rain, with `frame_time_meaning`), and the check. The check follows the Truth panel's rules: ocean says "Verification being updated"; rain shows the sentence from `rain.json` with the Pending team approval badge. During the time-lapse it shows that frame's time and says the check is for today's frame. | `src/components/panels/ProvenancePanel.tsx`, `Checks.tsx` (shared with the Truth panel), `SidePanel.tsx` | **Complete** (minimal). |
| **Credits footer** | Team plan §15 credits, always visible under the bottom bar: the visualizations line, "Data in this app" (MUR, IMERG, GRACE, GISTEMP, GPCP, GPCC) and "Also used in our testing" (FIRMS, MODIS, GLOBE). Proposal E3 asks for the same split in the plan and README. | `src/components/Credits.tsx`, `BottomBar.tsx`, `i18n/en/app.ts` | **Complete.** |
| **Mixer** | Volume, mute and solo for ocean, rain and snow. In a bottom sheet on phones. | `src/components/Mixer.tsx`, `BottomBar.tsx` | **Complete.** Per-voice volume is an L3 extra (proposal B3). |
| **Sweep** | Rings outward from **Chattogram** (22.36° N, 91.78° E), in sound and on the map. | `src/lib/data/summaries.ts`, `places.ts`, `players.ts`, `FrameView/use-overlay-loop.ts` | **Complete** (the ring sweep). Row sweep not built (optional in the plan). |
| **Then vs Now** | "Dhaka then vs now": heat (GISTEMP), monsoon (GPCP) and water (GRACE). Each part has a chart with a pink playhead that follows the sound; captions exactly as the JSON gives them; a disclosure panel with datasets, windows and numbers. Play one part, all three, or "then left, now right". Every stretch of missing GRACE months is silent, with a caption naming the months. | `src/components/ThenNow/`, `src/components/charts/YearlyChart.tsx`, `HistoryChart.tsx`, `src/lib/then-now.ts`, `src/lib/audio-adapter/then-now.ts`, `voices/heat.ts`, `bass.ts`, `monsoon.ts` | **Complete**, with **Interim** sound. Captions **Pending team approval**. |
| **Place History** | Pick Chattogram, Dhaka, Rajshahi or Sylhet, then heat or rain, then a decade; hear it month by month with a playhead. Says when two places are the same grid cell in the dataset. | `src/components/panels/HistoryPanel/`, `src/lib/history.ts`, `src/hooks/use-playhead.ts` | **Complete**, with **Interim** sound. Dragging along the chart to hear a month isn't built yet. |
| **Storm time-lapse** | "Play storm time-lapse" loads the last 48 half-hourly IMERG frames (26 Sep 03:00 to 27 Sep 02:30 UTC) and plays them at 2 frames per second. The map shows each frame's own image; the cursor follows the heaviest rain near Bangladesh; the readout, frame label, caption and screen-reader label show that frame's value and time. Captions at start, at the heaviest frame, and at the end; one announcement at the start. Esc or Stop ends it. With sound off it still plays, on a visual clock. | `src/lib/data/sequence.ts`, `storm.ts`, `src/lib/audio-adapter/timelapse.ts`, `src/components/TimeLapse/` (`index.tsx`, `use-time-lapse.ts`, `use-shown-point.ts`), `BottomBar.tsx`, `FrameView/index.tsx`, `Readout.tsx`, `FrameLabel.tsx` | **Complete**, with **Interim** sound. First download is 10.5 MB; lighter frames requested (C5). A loading message shows (and is announced) as soon as loading starts, then counts files; stopping during loading cancels the run. |
| **Story Mode** | The Story tab starts a guided tour: (1) ocean hum over the northern Bay of Bengal, with today's value spoken; (2) the sweep from Chattogram; (3) the storm time-lapse, then its heaviest rain and that frame's time; (4) satellite whisper: today's rain where the storm ended, then the chime; (5) X-ray, shown as "Skipped: not ready yet" and said to be waiting for colorbar data; (6) "How we know": the rain check sentence from `rain.json`, with the Truth panel opened and the Pending team approval badge. A panel on the map lists the steps and shows the line being said. Every number said is read from L1's files. Esc, Stop story, or another mode ends it at once; Esc and Stop story announce one message, "Story stopped. Back to Explore." Play again at the end. With sound off it still runs: lines go to the live region, the sweep step says it needs sound, the time-lapse plays on its visual clock. | `src/components/Story/` (`index.tsx`, `script.ts`, `StoryPanel.tsx`, `use-story.ts`), `src/lib/abortable.ts`, `src/lib/i18n/en/story.ts`, `TimeLapse/use-shown-point.ts`, `ModeTabs.tsx` | **Complete**, with **Interim** sound and browser speech (English). **Length not verified by a person:** 97 s with the headless test voice, target 60 to 90 s. Recorded or Bangla narration: not yet. |
| **X-ray** | Shows how a colour becomes a number and a sound. | none yet (X announces it isn't ready) | **Pending**, blocked on L1's colorbar files (request C1). |
| **Satellite whisper** | After Enter speaks a value (or Story Mode says one), a soft chime and a caption lead with the mission: "Chime: measured by NASA and JAXA's GPM satellites (IMERG, Early run)". Ocean: "Chime: from NASA JPL's MUR sea surface temperature analysis" (the metadata names no single mission; PO.DAAC, the data archive, is left out; "analysis" because the ID says level 4, "L4"). Built from `source_dataset` and `latest_check.imerg_run`; if a name doesn't fit the pattern, the full dataset name is used. With a screen reader, the announcement ends with "Source: …". With sound off: no chime. Esc or a new value cancels a pending chime. | `src/lib/whisper.ts`, `Commands/index.tsx` (`say`), `i18n/en/app.ts`, `captions.ts` | **Complete**, with **Interim** sound. The full dataset name shows in the Provenance panel and in Story Mode's "Data:" line. |
| **Describe mode** | D (or the Describe toggle; also in Help, for phones) says what is playing: sweep start and end, time-lapse start, peak and end, legend points, warm-up, motif, Then vs Now windows, captions, gaps and window marks, compare sides, Place History. Not live values (Enter speaks those), not the opening (it announces itself), not during Story Mode (it narrates). Two-voices rule: through the same path as Enter, so it's the built-in voice (with a caption) or the live region, never both. | `src/components/CaptionBar/use-describe.ts`, `Commands/index.tsx` (`say`), `HelpDialog.tsx` | **Complete.** |
| **Bangla setting** | EN / বাংলা switches every string in the app's table (place names in Place History added to it). Untranslated strings show in English: **272 of 272 still to translate**. Speech stays English with Bangla on screen (plan §17) until `BANGLA_SPEECH_READY` is set; Story Mode shows its lines as Bangla subtitles. `<html lang>` stays `en` until a Bangla string exists, so screen readers don't read English with a Bangla voice. | `src/lib/i18n/` (`index.ts` `speechLang`, `contentLang`; `bn.ts`), `docs/L3/bangla-strings.md` | **Complete** as a mechanism; **translations: none yet**. Not from the app's table: L2's `mapping.json` labels and rule text, and L1's JSON captions (data, shown as given). |
| **"Coming in October" labels** | Help lists every §11.7 concept-only item and X-ray, each with a "Coming in October" badge. X-ray is also labelled in its Help row, when X is pressed, and in Story Mode's step list and narration. | `src/components/ComingInOctober.tsx`, `HelpDialog.tsx`, `i18n/en/help.ts` | **Complete.** |

### 3b. Fixes from L2's review of PR #4 (28 Sep)

| Bug L2 found | Fix | Checked by |
|---|---|---|
| History playhead wouldn't move if the engine had no `playSeries` (the fallback sent "compare" events and added 0.8 s of silence) | `playSeries` is now part of L2's API (B6 accepted); the fallback is removed | History playhead moves while a decade plays |
| Stop didn't fully stop monsoon: drops already scheduled for the step played after the sound came back | The monsoon voice tracks drops that haven't sounded yet and cancels them on Stop and Esc | Level 0.000 for 0.25 to 1.25 s after Stop |
| Mute all and solo didn't reach Then vs Now or History | Their shared bus now goes through the mixer: silent under Mute all, and while a live voice is soloed | Level 0.000 with Mute all and with ocean soloed; sound returns when solo is off |
| History playhead jumped when the place, record or decade changed during playback | Changing the selection stops the playback; the playhead follows the range actually playing | Playhead disappears and that sound stops when the decade changes |
| A click when sound came back after a fade (end of the opening; starting a new sequence during another) | The bus ramps back up instead of jumping; a sequence started during a fade waits for it | Largest step between neighbouring samples stays at the steady-tone level (0.0125) through both |
| Rain lagged one step during sweeps | A density change now takes effect at its own time | Same mechanism as the next row (not timed separately) |
| Light to heavy rain waited up to about 0.65 s | The next drop is placed one new-rate interval after the last drop | First new drop 0.08 s after the move; 36 drops in the next second (the rule says 40) |
| The opening got stuck if the ocean data failed, and Skip did nothing | Skip always ends the opening; a failed ocean load ends it automatically and shows the error | Both cases checked with the ocean file blocked or delayed |
| Found while measuring (not in L2's list): clicks on the map were ignored outside the revealed band during the 1.2 s reveal | Only the drawing is animated now; the click target stays whole | A click 0.5 s into the reveal moves the cursor |

---

## 4. Commits

All L3 commits, oldest first. None has a Claude co-author line.

| Hash | Message | Pushed to `L3-interface` | Also in `main` |
|---|---|---|---|
| `30d34b1` | docs(L3): design plan and contract proposals | Yes | Yes (PR #3) |
| `3365bbc` | docs(L3): CVD cursor check (shapla -> #FF9BD4) and readout weight test (350) | Yes | Yes |
| `4e47c13` | chore(L3): copy L2 mapping spec unchanged from L2-audio-engine@8ccb937 | Yes | Yes |
| `0bd0c40` | feat(L3): interim sound engine | Yes | Yes |
| `50d52bd` | feat(L3): grid decoder and valueAt() | Yes | Yes |
| `af773e5` | feat(L3): theme tokens and shadcn re-theme | Yes | Yes |
| `0f5b2a6` | feat(L3): app state, i18n and shared helpers | Yes | Yes |
| `0f91086` | feat(L3): explore UI, panels and opening | Yes | Yes |
| `0a90552` | docs(L3): Bangla strings and contract proposals | Yes | Yes |
| `bae73f9` | fix(L3): cn knows the design type sizes and sheet radius | Yes | No |
| `5434c37` | feat(L3): Explore without sound option on the Start overlay | Yes | No |
| `77d7642` | feat(L3): sweep outward from Chattogram | Yes | No |
| `4f01e7e` | feat(L3): interim Then vs Now, compare and series players | Yes | No |
| `e4453c8` | feat(L3): L2 API split with fallbacks and shared audio clock | Yes | No |
| `1300737` | feat(L3): context data loaders with shape checks | Yes | No |
| `5b0a46e` | feat(L3): Then vs Now stage and Place History charts | Yes | No |
| `47e6daa` | docs(L3): integration guide, proposals, Bangla strings | Yes | No |
| `c84fffb` | docs(L3): progress record | Yes | No |
| `5a77b30` | fix(L3): L2 review fixes (history playhead, monsoon stop, mixer, clicks, rain timing, opening, map click during reveal) | Yes | No |
| `21e4264` | docs(L3): record L2 agreements and review fixes | Yes | No |
| `47727d5` | feat(L3): storm time-lapse | Yes | No |
| `2421568` | docs(L3): time-lapse and B8 | Yes | No |
| `6a9180d` | feat(L3): satellite whisper and Story Mode | Yes | No |
| `46115a3` | docs(L3): whisper and Story Mode progress | Yes | No |
| `d5b1fa6` | feat(L3): Provenance panel, credits footer, story Esc message, ocean whisper wording | Yes | No |
| `9aa8118` | docs(L3): Provenance, credits and Bangla strings | Yes | No |
| `13c6ca3` | feat(L3): Phase 4 captions, Describe mode, Bangla fallback, October labels, credits split | Yes | No |
| (this commit) | docs(L3): Phase 4 progress, Bangla strings, proposals E3 | Yes | No |

The first three commits were made with an earlier hash and rewritten before any push, to remove a co-author line. Each of the last six commits was type-checked on its own in a separate worktree before pushing.

---

## 5. Decisions log

| # | Decision | Reason |
|---|---|---|
| 1 | **Shapla pink (`#FF9BD4`) and indigo** instead of the brief's marigold and navy. | Measured every pixel of the real frames: the rain colormap uses marigold's yellow (17% of rain pixels), so a marigold cursor would look like data. The hues 255° to 330° are used by neither NASA colormap. Shapla (the water lily) is Bangladesh's national flower. The first pink (`#F58BCB`) failed the colour-blindness check on 3.3% of ocean pixels, so it was lightened. |
| 2 | Readout weight **350**. | At 200% zoom, 300 made Bengali digits too thin; 350 is the lightest that stays clearly legible in both scripts. |
| 3 | **Real data, no mocks.** | L1's grids were already published. No "Mock data" badge is needed. |
| 4 | **Interim sound engine written to L2's planned API** (`docs/L2/BUILD_PLAN.md` §2 and §8). | L2's engine wasn't built. Same names and shapes mean L2's engine replaces it with a one-file change. |
| 5 | **Split the engine type into `L2AudioApi` and `L3AudioExtensions`, with fallbacks.** | If L2's engine doesn't match, the build fails early. If it lacks L3's extras, the UI degrades instead of breaking. |
| 6 | **AGENTS.md naming** (PascalCase files; a component's own hooks in its folder). | Repo rule. The plan's kebab-case names (`frame-view.tsx`) aren't used. |
| 7 | Ocean Truth shows **"Verification being updated"**, no number. | §16 says 0.85 °C; the data now says 0.31 °C after recalibration. The product lead won't show 0.31 °C until L1 confirms it was measured on a different frame from the one used for calibration. |
| 8 | Rain Truth names **the IMERG run the JSON says was checked** (Early today) and builds the sentence from the JSON numbers. | §16 says "Late run", but today's re-check used the Early run. |
| 9 | **Demo captions shown exactly as the JSON gives them**, marked "Pending team approval". | The JSON differs slightly from §16 ("10 and 10 years", hyphen instead of minus). The product lead asked L1 to fix the JSON; the UI follows automatically. |
| 10 | **Sweep from Chattogram**, not Dhaka. | The team is from Chattogram, and its grid cell is ocean, so the sweep has sound from the first ring (Dhaka is inland). |
| 11 | **Then vs Now stays Dhaka.** Request C4 (a Chattogram version) waits for October. | L1's demo file and §16 wording are Dhaka's. Heat is the same grid cell as Chattogram, but rain isn't. |
| 12 | **Don't merge L2's branch into L3.** L2 merges into `main`. A `bun.lock` conflict is solved by regenerating it with `bun install`. | Keeps lanes independent. |
| 13 | **X = X-ray, Space = pause and resume the live sound, G reserved** for the game. | The plan didn't define Space in Explore, and X-ray needed a key. |
| 14 | **Letter keys only while the map has focus.** Esc everywhere. | WCAG 2.1.4: single-letter shortcuts must not clash with screen-reader keys. |
| 15 | **"Explore without sound"** on the Start overlay. | People who can't or don't want to use sound must not be locked out. |
| 16 | **Colour never signals status.** Badges use a shape and words. | In this app colour means data. |
| 17 | Mobile: the **readout goes below the map**. In Then vs Now, the **frame label moves into the stage header**. | The map is too short on phones for text on top. The frame time must be visible in every view. |
| 18 | `cn` configured with our custom text sizes (`src/lib/utils.ts`). **Always import `cn` from `@/lib/utils`.** | The default setup silently dropped sizes like `text-lead` when a colour class followed them. |
| 19 | **Step events count data points only** (proposal B5). | Chart playheads can then map an event straight to a data point, whichever engine runs. |
| 20 | Every **stretch of missing GRACE months** gets its own silence caption. | There are 35 missing months, not one gap (proposal A4). |
| 21 | In the "Both" track, the **rain frame is drawn over the ocean frame**, and the readout shows both values. | Both sounds play, so both frames and both frame labels are shown. |
| 22 | **L2's API in `docs/L2/BUILD_PLAN.md` §2 is the source of truth.** A new function or event L3 needs is a proposal first. | Agreed with L2 on 28 Sep, so the lanes don't drift apart. |
| 23 | **`playSeries` is required**, not optional; its fallback is removed. | L2 accepted it (B6), and the fallback had a playhead bug. |
| 24 | **Caption keys are an agreed set** (B7). A new key needs a heads-up in both directions. | Captions are the shared language between the engine and the UI. |
| 25 | **Shared files have owners** (contract-proposals §B4): L2 owns the `test` script and the `badge`, `card`, `label`, `select` and `switch` components; L3 won't add them. | Avoids add/add and script conflicts when the lanes merge. |
| 26 | **L2's test page reuses L3's `buildThenNowInput`, `loadDemo` and `loadGrace`.** L3 gives L2 a heads-up before changing them. | One adapter, not two. |
| 27 | **Time-lapse follows the storm inside Bangladesh and the northern Bay** (15 to 26° N, 85 to 93° E), moving at most 3° per frame to the heaviest cell; ties go to the nearest cell (the first frame: nearest Chattogram). | The plan says "over Bangladesh and the Bay; the cursor follows the heaviest nearby cell". A wider box drifted to Myanmar and Nepal. Design choice; values along the path vary from 1.9 to 21.6 mm/h, so it's audible. |
| 28 | **With sound off, the time-lapse still plays**, on a visual clock (2 frames per second). | Nobody is locked out of a visual feature because they can't use sound. Only visuals are timed this way; sound always uses the audio clock. |
| 29 | **No per-frame announcements** to screen readers during the time-lapse; one announcement at the start (frame count and time range). | A new frame every half second would flood the live region. |
| 30 | **During the time-lapse, everything shows the time-lapse frame**: map image, cursor, readout, frame label (that frame's own time), caption and screen-reader label, all from one shared hook (`useShownPoint`). | Today's grid and an older frame must never be mixed on screen. |
| 31 | **The whisper caption leads with the mission**, parsed from `source_dataset`: an all-capitals first word is the mission ("GPM"), the next word the product, and the agencies come from the brackets. Rain adds today's IMERG run from `latest_check`. No match: the full name. | User request (28 Sep). Every name still comes from the metadata. |
| 32 | **The whisper plays after speech ends.** With a screen reader, the source is added to the same announcement. With sound off, there is no chime. | One voice at a time, and one live-region message (the announcer keeps only the last of quick messages). |
| 33 | **Story Mode skips X-ray** and says why. The storm peak is spoken with its frame time. The whisper step uses today's frame at the storm's last position (the newest time-lapse frame is today's frame). | Never fake a step; never mix an old value with today's map without saying so. |
| 34 | **Story Mode owns the live voices** while it runs (the live-sound sync leaves them alone) and hands them back with the user's track when it ends. Map keys and map clicks pause during the story. | Otherwise the sync silenced the ocean hum the moment the story started. |
| 35 | **The panel sheet opens only below 1024 px.** Wide screens always show the panel column. | The sheet is modal: open but hidden on desktop, it trapped focus and took Esc. |
| 36 | **"~" is read as "about"** by speech and screen readers; the screen keeps "~". | Speech engines read it as "tilde". |
| 37 | **Esc is handled once, in the capture phase**, by the global handler. In Story mode it goes back to Explore and announces "Story stopped. Back to Explore."; Stop story does the same. The map doesn't announce its reading straight after. | React applied the story's mode change between two Esc listeners, so the second one said "Stopped" over the story's message. Capture also gets Esc before an open sheet takes it. |
| 38 | **The whisper never calls an archive a mission.** Each bracketed agency keeps its first word ("JPL PO.DAAC" gives "JPL"); a centre and its agency are written together ("NASA JPL"), partner agencies with "and" ("NASA and JAXA"). | User request (28 Sep). Tuned to today's two datasets; any other name falls back to the full dataset name. |
| 39 | **Provenance and Truth share one check component** (`panels/Checks.tsx`). | The same honesty rules in both places, from one source. |
| 40 | **The credits footer splits §15's data line**: "Data in this app" and "Also used in our testing" (FIRMS, MODIS, GLOBE). | User request (28 Sep): don't credit data the app doesn't use as if it did. Proposal E3 asks the plan and README to match. |
| 41 | **Describe mode reuses the captions**, and says only what is playing, through `say()`. | One source of wording (captions and descriptions can't disagree) and one voice rule. |
| 42 | **Speech stays English while Bangla is on screen** until the spoken strings are translated (`BANGLA_SPEECH_READY`). Each line is built twice: in the screen language (caption, subtitle, screen reader) and in the speech language. | Plan §17 fallback; a Bangla voice reading English text is worse than English. |
| 43 | **`<html lang>` follows the text, not the setting**: `en` until a Bangla string exists. | Screen readers choose their voice from it. |
| 44 | **UI-posted captions** (`caption.speech`, `caption.history.end`) go through `src/lib/ui-captions.ts` into the same caption bar. | The engine can't caption browser speech, and `playSeries` doesn't caption its end. Heads-up to L2 in contract-proposals B7. |

---

## 6. Deviations from the team build plan

| What L3 does differently | Plan section that needs updating |
|---|---|
| Sweep starts from **Chattogram** | §9.2 (`sweep-controls.tsx` row), §9.3 (key S), §11 feature A6, L2's plan Phase 4; check the video narration (see proposal E1) |
| Water caption: GRACE has **35 missing months**, not only Jul 2017 to May 2018 | §16 water row, §11.5 water row, §13 QA list (proposal A4) |
| Ocean Truth number hidden; rain Truth names the Early run and uses today's re-check | §16 Truth rows (proposals A1, A2) |
| File names in PascalCase folders (`FrameView/index.tsx`, not `frame-view.tsx`); `lib/data.ts` is a folder `src/lib/data/`; `valueAt` takes the loaded frames as its first argument | §6 file tree, §9.2 module table |
| UI talks to sound only through `src/lib/audio-adapter/` (not `lib/audio.ts` directly) | §9.2 module table |
| New keys: **X** (X-ray), **Space** (pause and resume live sound); letter keys work only when the map has focus | §9.3 keyboard map |
| **"Explore without sound"** start option (not in the plan) | §9.1 layout, §9.4 accessibility |
| Right-panel tabs are Truth, Mapping (includes the legend), Provenance, History. The Comparison Player lives in the Then vs Now stage, not a panel tab. | §9.1 right panel |
| Then vs Now plays **yearly** values (400 ms per year) for heat and monsoon, following L2's plan §8.3, not the plan's 150 ms monthly steps | §10 heat and monsoon rows |
| GRACE plays the **Bangladesh** box only; NW India is shown on the chart but not played | §11.5 water row |
| Place History has a playhead and plays one decade; **dragging to scrub** isn't built yet | §11 H1, H3 |
| Opening: the frame opens from the equator, but the waveform line doesn't visibly settle onto the equator first | §11 C1 |
| No "Mock data" badge (real data is used) | brief only |

---

## 7. Honesty status

| On screen | Status | Blocking |
|---|---|---|
| Frame label ("EIC frame: …, … UTC. Sound generated live from this frame.") | **Final**: exact §16 wording; time from the JSON | nothing |
| Values under the cursor (°C, mm/h) | **Final**: decoded from L1's grids, checked against Python at 506 points | nothing |
| Ocean Truth | **"Verification being updated"**, no number | L1 to confirm the 0.31 °C was measured on a different frame from the calibration frame (A1) |
| Rain Truth sentence | **Pending team approval** badge; numbers from `rain.json` | team to approve new §16 wording; L1 to align `matched_run` and add `approx_percent` to `latest_check` (A2, C1b) |
| Rain Truth plot | Shown, captioned as the first check (Late run), not today's re-check | L1 to publish a plot for the check being quoted (C1b) |
| Then vs Now captions (heat, monsoon, water) | **Pending team approval** badge; shown exactly as the JSON gives them | L1 to fix the JSON text to match §16 (A3); team to update the water wording (A4) |
| Disclosure numbers (means, spreads, changes, GRACE boxes) | **Final**: from the JSON | nothing |
| Place History charts and shared-cell notes | **Final**: from the JSON (grid cell positions compared at runtime) | nothing |
| "0 °C (the 1951–1980 normal)" chart label | **Final**: from L2's `mapping.json` legend | nothing |
| Mapping panel rules | **Final**: generated from `mapping.json` numbers by L2's `ruleText()` | L2 owns the file |
| "Interim sound engine" badge | shown until L2's engine replaces it | L2 engine |
| Story Mode numbers | **Final**: every number said comes from L1's files (grids, `sequence/`, `rain.json`) | nothing |
| Story Mode "How we know" sentence | **Pending team approval** badge, as in the Truth panel | as the rain Truth sentence |
| Story Mode X-ray step | labelled "Skipped: not ready yet" | L1 colorbar data (C1) |
| Whisper caption | **Final**: names from the metadata; the mission-first wording is L3's | nothing |
| Provenance panel | **Final** fields from the metadata; ocean check "Verification being updated"; rain check **Pending team approval** badge | as the Truth panel |
| Credits footer | **Final**: §15 wording, split into "Data in this app" and "Also used in our testing" | team to split §15 and the README the same way (E3) |
| Concept-only items (§11.7) and X-ray | labelled "Coming in October" in Help (and X-ray wherever it appears) | nothing |

---

## 8. Testing

| What | How | Result |
|---|---|---|
| Grid decoder | TypeScript decoder vs an independent Python decode of the same bytes, 506 points including the grid edges | 506 of 506 match |
| Contrast | Computed WCAG ratios for every text and background pair; rechecked 28 Sep with the pairs added since (inactive tabs at 60% moon, credits and badges in haze, text on the scrim over a white map pixel) | All pass. Lowest text: haze on scrim over white 5.53, inactive tab 6.15 (AA 4.5). Lowest non-text: line border on tide 3.09 (3.0). |
| Cursor visibility for colour-blind users | Machado 2009 simulation (protanopia, deuteranopia, tritanopia) on every pixel of four real frames | 0% of pixels fail after the pink fix (design-plan §2.4) |
| Readout weight | Headless Edge at 2× scale (like 200% zoom), real fonts, real frame crop | 350 chosen (design-plan §3.3) |
| Keyboard-only flow, audio, speech, live region | Scripted headless Edge on the production build. Audio measured through the app's own `AnalyserNode`; speech checked by recording what was passed to `speechSynthesis.speak`; live region read from the page. | Start is the only focusable item before starting; focus goes to the map; ocean sound peak 0.13; silence over land (0.000); Enter speaks the value and place; tracks switch; legend plays; Esc stops all (0.000); Space resumes |
| Opening | Same scripts | "Close your eyes." caption, sound (peak about 0.1), Skip focused; after about 10 s the map is revealed and focused; Skip and Esc both end it |
| Explore without sound | Same scripts | No AudioContext is created; caption shows the reading; Enter goes to the live region, not speech; "Turn sound on" starts audio (peak 0.13) |
| Then vs Now | Same scripts | Heading focused on open; heat caption matches the JSON; the playhead moves through both windows; "then left, now right" shows two playheads; Stop gives silence (0.000); water plays with a caption for each stretch of missing months; the Jul 2017 to May 2018 gap is silent (0.000) |
| Place History | Same scripts, plus a direct check of the shared-cell logic | A decade plays with a playhead. Shared cells: heat Dhaka = Chattogram, rain Dhaka = Sylhet, rain Chattogram has its own cell |
| Reduced motion | OS setting emulated, and the in-app toggle | The page switches to reduced motion in both cases (checked on the `<html>` attribute; the reduced-motion visuals were not checked by screenshot) |
| Layout | Screenshots at 1440×900, 900×1100 (tablet) and 390×844 (phone), reviewed by eye | No horizontal scroll on the phone; every phone touch target is at least 44×44 px; issues found in review were fixed (bottom bar pushed off screen, sweep ring not drawing, collapsed sliders, unlabelled unbuilt modes, text sizes dropped) |
| Console errors | Collected in every scripted run | None |
| Code checks | `bun run lint`, `bunx tsc --noEmit`, `bun run build` after every step; each of the last six commits type-checked on its own | All pass |
| Merge safety | Dry-run merges (`git merge-tree`) of L3 with `L2-audio-engine` and `main`, plus a three-way merge of `package.json` and `bun.lock`. L2 also merged the branches and ran type check, lint and its tests on the result (28 Sep). | Clean, except `bun.lock` (known; see decision 12). L2 confirmed that taking L3's lockfile or running `bun install` fixes it. |
| Storm time-lapse | Scripted headless Edge: play with sound, sample at 1, 6 and 12 s, Esc, a full run; then sound off on a phone-sized screen | Loads 96 files in 0.77 s locally (10.5 MB); rain sounds (peak about 0.08); each frame's value, position and time on screen (for example frame 13: 26 Sep 09:00 UTC, 12 mm/h at 23.8° N, 86.8° E); start and peak captions; one screen-reader announcement; Esc gives silence and today's frame; a full run ends with "Time-lapse finished"; sound off: no AudioContext, frames advance at 2 per second, caption matches the frame; no console errors |
| Storm path and decoder | The time-lapse grid decoder against the contract formula on 20,000 random cells; the storm path printed for all 48 frames | 0 mismatches; the path stays over Bangladesh and West Bengal |
| Satellite whisper | Scripted headless Edge (`qa-story.ts`): Enter with the built-in voice on and off; Enter then Esc | Chime after the speech ends (level 0.20); caption "Chime: MUR, from NASA and JPL PO.DAAC; measured by NASA and JAXA's GPM satellites (IMERG, Early run)"; voice off: the live region ends with "Source: …"; Esc right after Enter: no chime |
| Story Mode | Same script: a full tour with sound (speech timed, levels sampled during each line); Esc after the end; Esc while the storm frames load; a full tour with sound off on a phone-sized screen, with Esc during "How we know" while the panel sheet is open | With sound: every step in order; levels: hum 0.13, sweep 0.18, time-lapse 0.09, whisper chime 0.09; every spoken number matched the data (29.1 °C; heaviest 22 mm/h at 26 Sep 04:00 UTC; 3.6 mm/h now; about 28%, 150 points); **97 s** in total. Esc after the end and during loading: back to Explore, silence, and the time-lapse doesn't start. Sound off: 47 s, no AudioContext, lines announced; one Esc during "How we know" closes the sheet and leaves the story. No console errors. Earlier `qa.ts` and `qa-timelapse.ts` unchanged. |
| Provenance, credits, Esc message | Scripted headless Edge (`qa-provenance.ts`): P on desktop and on a phone-sized screen; Provenance during the time-lapse; Esc and Stop story mid-tour; Esc in Explore; ocean-only Enter | P opens Provenance (desktop: the panel column, no sheet; phone: the sheet); every field matches `sst.json` and `rain.json`, with SVS links to svs.gsfc.nasa.gov/5101 and /4285; during the time-lapse the frame time is that frame's (for example 26 Sep 06:00 UTC) with the note about today's check; "Story stopped. Back to Explore." stays the last announcement after Esc (desktop and phone) and after Stop story; Esc in Explore still says "Stopped"; ocean caption "Chime: from NASA JPL's MUR sea surface temperature analysis"; credits visible on desktop and phone; phone: no horizontal scroll. `qa-story.ts`, `qa.ts` and `qa-timelapse.ts` unchanged. No console errors. |
| Phase 4 pass | Scripted headless Edge (`qa-a11y.ts`), keyboard only: start, every Tab stop, Explore keys, time-lapse, Place History (tabs by arrow keys), Provenance, Help, Then vs Now, Story, the Bangla setting; then 200% zoom at 1280×900 and 1280×720, a phone, and reduced motion | 23 Tab stops, all with a visible focus ring; every mode reached and played by keyboard; captions seen for sweep start and end, spoken lines, time-lapse, Place History ("Now playing: Chattogram, 2010s", "History finished"), Then vs Now; Describe on: the sweep start was spoken; X says "coming in October"; Help lists 9 October items; Bangla: `<html lang>` stays `en`, Story subtitles on screen, speech `en-US`; 200% zoom: no sideways scroll, no control cut off; phone: no sideways scroll, no target under 44 px with Story on; reduced motion: 0 running CSS animations during a sweep; no console errors. Earlier scripts unchanged. |
| Rain density at the heaviest rain today | Cursor on the heaviest cell today (40.33 mm/h), rain only, every drop's start time counted over 12 s | **38.67 drops per second measured; the rule gives 38.68 at 40.33 mm/h** (within 0.03%). Per second: 37 to 41. Mean gap 25.9 ms, longest 33.6 ms. The rule's 40 per second needs 50 mm/h, which today's data doesn't reach; 38.67 is 3.3% below 40. |
| L2 review fixes | A scripted headless Edge run for each bug in section 3b, then all earlier scripts again | All fixed as listed in section 3b; earlier checks unchanged; no console errors other than the one the test causes by blocking the ocean file |

**Where the test scripts are:** the browser scripts (`qa.ts`, `qa-silent.ts`, `qa-thennow.ts`) were run from a local scratch folder with `playwright-core` driving the installed Microsoft Edge. **They aren't in the repo yet**, so teammates can't run them. Adding them as a proper test setup is listed under remaining work.

---

## 9. Not yet verified

| What | Why it matters | How to test |
|---|---|---|
| **Screen readers** (NVDA, JAWS, VoiceOver, TalkBack) | The map uses `role="application"` so arrow keys reach it; screen readers differ in how they handle this. The scripted pass checks focus and the live region's text, not what a screen reader actually says. | **NVDA + Chrome on Windows, by a person:** (1) Tab to the map; arrows move the cursor and the value is read once it settles. (2) Enter with Built-in voice off: the value and "Source: …" are read. (3) S with Describe on (D): "Sweeping outward from Chattogram" is read, not twice. (4) Mode tabs by arrow keys; Story: each line read once; Esc says "Story stopped. Back to Explore." (5) Then vs Now: the heading is read on arrival; play a part. (6) Panels: Truth, Provenance (P), History by arrow keys; Play a decade. (7) Help (H): the table and the "Coming in October" list. (8) বাংলা: text is still English and read with an English voice. Then VoiceOver on a Mac and TalkBack on Android: steps 1, 3, 4 and 8. |
| **Listening by a person** | Only signal levels were measured; nobody has judged whether the sound is pleasant, clear or free of clicks | Listen on laptop speakers and headphones: ocean pitch glides, rain drops, snow bells, heat vs ocean timbre, the GRACE bass, the gap silence. L2's ear tests T2 to T6 cover this. |
| **Real Android phone** | Rain drops might stutter on a mid-range phone; touch drag on the map | Open the app on a mid-range Android in Chrome; drag over heavy rain. If drops stutter, raise the look-ahead in `src/lib/audio-adapter/scheduler.ts` from 0.1 to 0.2 s. |
| **Vercel deployment and compression** | Locally the `.bin` grids are sent uncompressed (5.9 MB; 0.7 MB if gzipped) | Deploy, open DevTools Network, check `content-encoding` and transfer size for `/data/latest/*.bin` (proposal C3). |
| **Bangla speech** | Many devices have no Bangla voice; the app then shows the value without speaking it | Switch to বাংলা and press Enter on each teammate's phone and laptop; note which have a Bangla voice. |
| **Other browsers** | Only Microsoft Edge (Chromium) was tested | Firefox and Safari: the full keyboard flow and the sound. |
| **200% zoom in a real browser** | Checked by emulation (a 640 px viewport at 2×): no sideways scroll or cut-off controls, screenshots reviewed | Ctrl + plus to 200% in Chrome at 1280×720: Story panel, Help, panels sheet. |
| **Story Mode length and sound** | Measured at 97 s with the headless test voice, which speaks slowly (about 10 characters a second); the target is 60 to 90 s. Nobody has listened to the tour. | Play Story Mode on a laptop with its normal English voice and time it. If it's over 90 s, shorten the lines in `src/lib/i18n/en/story.ts` or the pauses in `Story/script.ts`. Check that the hum, sweep and chime are clear under the ducked speech. |
| **Reduced-motion visuals** | Checked: the setting follows the OS, and no CSS animation runs during a sweep. Not checked: the canvas drawing itself (rings, sweep) | Turn on reduced motion and check that the rings become one still ring, the wipe becomes a cut, and the sweep shows a dot. |

---

## 10. Open requests to other lanes

Details for each are in [contract-proposals.md](contract-proposals.md).

| ID | Lane | Request | Status |
|---|---|---|---|
| A1 | L1, team | Confirm whether the 0.31 °C ocean error was measured on a held-out frame; add a field saying so | Open; ocean Truth shows "Verification being updated" |
| A2 | L1, team | Align `verified.matched_run` with `latest_check.imerg_run`; approve new rain wording | Open |
| A3 | L1 | Fix the demo captions to match §16 exactly | Open; product lead asked L1 |
| A4 | Team, L1 | Update §16 water wording: 35 missing months, not one gap | Open |
| B1 | L2 | `getAnalyser()` for the waveform, rings and audio clock | Open; the UI works without it (fallback) |
| B2 | L2 | Per-drop events for rain ripples | Open; ripples are skipped without them |
| B3 | L2 | `setVoiceVolume()` for per-voice volume | Open; mute and solo work without it |
| B4 | L2, L3 | Shared files and owners; check before touching; lockfile plan | Agreed |
| B5 | L2 | Step events count data points only | **Accepted by L2** |
| B6 | L2 | `playSeries()` for Place History | **Accepted by L2**; now required, fallback removed |
| B7 | L2, L3 | Caption keys for Then vs Now; heads-up for any new key | **Agreed** |
| B8 | L2 | Time-lapse caption keys (`start {count}`, `peak {value, phase}`, `end`) and player name `"timelapse"` | Heads-up sent; waiting for L2 to confirm |
| C1 | L1 | Colorbar images and colour tables (blocks X-ray); record the −5..35 °C label vs −4..34 °C calibration | Open, blocking X-ray |
| C1b | L1 | Truth plots for the check being quoted; `approx_percent` in `latest_check` | Open |
| C2 | L1 | Data file for the 23-product catalogue | Deferred |
| C3 | L1, team | Gzipped grids (or a headers rule) to cut first load from 5.9 MB to about 0.7 MB | Open |
| C5 | L1 | Lighter time-lapse frames in October (WebP, or 24 frames at lower resolution; plan §17) | Open |
| C4 | L1, team | "Chattogram then vs now" | Deferred to October |
| E1 | Team, L4 | Update the team plan and the video script: sweep from Chattogram | Open (L2's plan already updated) |
| E2 | Team | §16 water wording (same as A4) | Open |
| E3 | Team | Split the §15 credits in the plan and README: "Data in this app" and "Also used in our testing" | Open |

---

## 11. Known risks

| Risk | Effect | What reduces it |
|---|---|---|
| L2's engine arrives late or differs from its plan | Video recorded with the interim engine | The interim engine works and is labelled; the swap is one file; the build fails if the API differs |
| Nobody has listened to the interim sound properly | A bad-sounding demo | Ear test before recording (section 9) |
| Story Mode runs longer than 90 s with a slow voice | A longer video shot 1:45 to 2:45 | Human listen and timing (section 9); lines and pauses are easy to trim |
| `bun.lock` conflict when L2 merges | A failed merge | Regenerate with `bun install`, or take L3's lockfile (decision 12; L2 confirmed both work) |
| First load is about 7 MB (grids and images); the time-lapse adds 10.5 MB when played | Slow on phones or weak networks | Rain loads after first paint; the time-lapse loads only on request, with a loading message and file count; compression requested (C3); lighter time-lapse frames requested (C5) |
| No Bangla strings yet (272 to translate) | বাংলা mode shows English | `bangla-strings.md` lists every string for a translator, with the count at the top |
| Truth and caption wording still pending | On-screen wording could change after recording | Badges make the pending status visible; wording comes from the JSON, so fixing the JSON fixes the app |
| A change in L1's file shapes | A view could fail | Shape checks show a clear error; the rest of the app keeps working |
| Screen-reader behaviour unverified | Blind users might not be able to use the map | NVDA test (section 9) |
| Browser test scripts are not in the repo | Others can't repeat the checks | Add them to the repo (remaining work) |

---

## 12. Remaining work (priority order)

**Phase 3**
1. **Story Mode: listen and time it** (section 9); trim if over 90 s.
2. **X-ray**: blocked until L1 publishes colorbar files (C1). Then add it to Story Mode in place of the skipped step.
3. **Provenance panel**: the minimal panel is done; the plan's fuller version (processing steps, calibration details) only if time allows.
4. **Sweep**: the ring sweep is done; row sweep only if time allows.
5. Items on the plan's "cut first" list, only if time allows: extreme pings, area summary.

**Phase 4 (Tuesday morning, freeze at 12:00)**
Done in code: captions, Describe mode, the Bangla setting, October labels, the scripted accessibility pass.
1. **Human tests** (section 9): NVDA, VoiceOver and TalkBack; Story Mode listening and timing; 200% zoom in a real browser.
2. **Bangla**: a person translates `bangla-strings.md` (272 strings); then set `BANGLA_SPEECH_READY` if the spoken ones are done; recorded Bangla clips for Story Mode (L4).
3. Catalogue screen of the 23 products, only if L1 provides the data file (C2).

**Also**
- Add the browser test scripts to the repo. They must run through L2's existing `"test": "bun test"` script (decision 25), not a new one.
- Place History scrubbing (drag to hear a month).

---

## 13. How to run it

```
git switch L3            # or check out origin/L3-interface
bun install
bun run dev              # http://localhost:3000
bun run lint
bun run build
bun run start            # serves the production build
```

- Open the app in Chrome or Edge, press **Start listening**, and use the arrow keys on the map. H opens the key list.
- There is no automated test command yet (see section 8).
- Before a merge, `bunx tsc --noEmit` checks the types. A fresh checkout reports a `LayoutProps` error until `bun run build` or `bun run dev` has generated Next.js's types once.
