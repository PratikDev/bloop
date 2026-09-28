# What's Remaining

For everyone on Team PTSD: what still has to happen before the feature freeze (**Tue 29 Sep, 12:00**) and the Video 1 upload (**Wed 30 Sep**), who owns it, and how to know it's done.

**Written 28 Sep, evening**, from the merged `main` (L1, L2 and L3 joined, plus L3's UI batch on `L3-interface`). Tick items here as you finish them.

---

## 1. Where we are

**The code is done.** On `main`, the type check, lint, all 92 tests and the production build pass. The app runs on L2's sound engine, and L3's stand-in engine is gone. Scripted browser checks (headless Edge, measured through the app's own audio analyser) pass for every mode: Explore, sweep, storm time-lapse, Then vs Now, Place History and Story Mode.

**What's left is mostly people, not code:** listening, screen-reader and device tests, narration clips, Bangla translation, the deployed URL, and the video. The code items left are small and depend on other people's inputs (narration clips, colorbar files).

| Deadline | What |
|---|---|
| **Tue 29, 10:00** | L4's narration clips (EN and BN), or we keep the browser voice |
| **Tue 29, 12:00** | **Feature freeze.** Listening, tests and the freeze notes done |
| Tue 29, afternoon | Record screen clips and voice-over |
| **Wed 30** | Edit, subtitles, under 4:00 (aim 3:50), upload to YouTube, submit the Google Form |
| Thu 1 Oct, 23:59 | Official deadline (we submit a day early) |

---

## 2. Must do before the freeze (Tue 29, 12:00)

### 2.1 Listen to the joined app (L3 with L2) — **highest priority**

The scripted checks prove the sound plays, stops and follows the charts. They can't tell whether it sounds good. Nobody has listened to the joined app yet.

- **How:** `bun run dev`, open `http://localhost:3000`, headphones and then a laptop speaker. Go through the unticked item in [`docs/L3/integration.md`](L3/integration.md) §1: Start → opening → Explore; Then vs Now (all three parts, Stop, "then left, now right"); Place History (play a decade, then drag along the chart); press M, then Then vs Now (silent); Esc from every mode; storm time-lapse; Story Mode end to end.
- **Listen for:** clicks or pops, distortion at full volume, anything startling, rain density that sounds wrong, voices you can't tell apart.
- **Known:** L2's engine is about 45% louder than L3's old stand-in (for example, Story ocean peak 0.194 vs 0.133 on a 0 to 1 scale). Nothing clips. Decide in the mix pass (2.3) whether to lower it.
- **Done when:** the item in `integration.md` is ticked, and anything that sounds wrong is written down for L2.

### 2.2 L2's listening tests with teammates (L2, everyone)

From [`docs/L2/REMAINING_WORK.md`](L2/REMAINING_WORK.md):

- [ ] **T3 loudness balance** (item 4): each teammate opens `/dev/audio` → "Loudness balance (T3)" on headphones and a phone speaker, and moves the slider until the three pitches sound equally loud. L2 then sets `loudnessCompensation.exponent` in `public/mapping.json` (now `0`).
- [ ] **T7 how many voices at once** (item 5): each teammate runs 10 trials at 1, 2, 3 and 4 voices on `/dev/audio` → "How many voices at once (T7)". L2 then sets `maxConcurrentVoices` (now `3`). Pass rule: at least 8 of 10 correct.
- `/dev/audio` only works in development (`bun run dev`). For a phone test over the internet, deploy a build made with `AUDIO_HARNESS=1 bun run build`.

### 2.3 Mix pass (L2 with L4)

- [ ] Play the opening, Then vs Now, the storm time-lapse and Story Mode exactly as they'll be recorded (item 7 in L2's list). Change only gains and timbres in `public/mapping.json`, never rules. Write each change in `docs/L2/audio_findings.md`.

### 2.4 Screen-reader test (L3, anyone with NVDA)

The app is built for blind and low-vision users, and **no screen reader has been tried by a person yet**. This is the biggest untested risk.

- [ ] **NVDA + Chrome on Windows**, the 8 steps in [`docs/L3/PROGRESS.md`](L3/PROGRESS.md) §9: Tab to the map, arrows move and the value is read once; Enter with Built-in voice off; S with Describe on; mode tabs and Story (each line read once, Esc says "Story stopped. Back to Explore."); Then vs Now; the panels, including dragging the History chart with the arrow keys (it's a slider now); Help; বাংলা.
- [ ] **VoiceOver on a Mac** and **TalkBack on Android**: steps 1, 3, 4 and 8.
- **Done when:** each step is noted pass or fail in PROGRESS §9; failures go to L3.

### 2.5 Devices and browsers (anyone)

- [ ] **iPhone** (L2 item 1): lock and unlock, then one tap gives sound again; sound plays with the silent switch on. If nobody has an iPhone, write "untested on iPhone" in the freeze note.
- [ ] **Mid-range Android, Chrome:** drag over heavy rain; drops don't stutter. Place History: drag along the chart with a finger.
- [ ] **Firefox and Safari:** the keyboard flow and the sound (only Edge and Chrome have been tried).
- [ ] **Console check, Chrome and Edge** (L2 item 8, and plan §13): no errors while using every mode and `/dev/audio`.
- [ ] **200% zoom** in Chrome at 1280×720: Story panel, Help, the panels sheet.
- [ ] **Reduced motion** on: the rings become one still ring, the map opens with a cut, the sweep shows a dot.

### 2.6 Narration clips (L4, then L3)

- [ ] **L4:** English and Bangla MP3s in `public/audio/narration_en/` and `public/audio/narration_bn/`, named after their segment (for example `opening.mp3`), by **Tue 29, 10:00**, with the subtitle text for each clip.
- [ ] **L3, about 1 hour once the clips arrive:** add `playClip` and `preloadClips` to the `L2AudioApi` contract in `src/lib/audio-adapter/types.ts` (as required entries, no fallback); add the `caption.clip` string (clip URL → its subtitle) to `src/lib/i18n/en/captions.ts` and to `bangla-strings.md`; call `preloadClips` once at start-up and `playClip` where the opening and Story Mode narrate, keeping `speak()` as the fallback.
- **If the clips miss 10:00:** skip this. Narration stays on the browser's voice (decision D12); note it in both freeze notes.

### 2.7 Bangla (a translator)

The video ends on the app in Bangla mode (plan §14, 3:45–3:50), and §13 asks for captions in both languages.

- [ ] **At minimum,** translate the "Priority: the video's closing shot" section at the top of [`docs/L3/bangla-strings.md`](L3/bangla-strings.md): the strings visible in that shot.
- [ ] **Ideally,** all 275 strings (Section 16 wording by a person, never a machine).
- Translations go in `src/lib/i18n/bn.ts` under the same key; anything untranslated shows in English.
- If the spoken strings are done, set `BANGLA_SPEECH_READY` in `bn.ts` (speech stays English until then).

### 2.8 The deployed URL (L1)

- [ ] Confirm the shared Vercel deployment of `main` is live and share the URL with the team.
- [ ] Open it on a laptop and an Android phone (plan §13): Start, sound, Explore, the time-lapse.
- [ ] In DevTools → Network, check `/data/latest/*.bin`: is it compressed (`content-encoding`), and how big is the transfer? Request C3 asks for gzipped grids (5.9 MB → about 0.7 MB).

### 2.9 Freeze notes (L2 and L3)

- [ ] **L2** (item 9): the full-app run on a laptop speaker, headphones and a mid-range Android; the final settings (duck level, look-ahead, loudness exponent, max voices, harmonic gains) in the findings log; every row in `REMAINING_WORK.md` ✅ or ✂️.
- [ ] **L3:** update `docs/L3/PROGRESS.md` with the listening, screen-reader and device results, and what shipped.

### 2.10 Wording still pending team approval

These show a "Pending team approval" badge in the app until the team decides. Details in [`docs/L3/contract-proposals.md`](L3/contract-proposals.md).

- [ ] **A1 (L1, team):** was the ocean error measured on a held-out frame? Until then, the Truth panel says "Verification being updated" for the ocean.
- [ ] **A2 (L1, team):** align `verified.matched_run` with `latest_check.imerg_run`, and approve the new rain wording (the app says "Early run … ~28%"; plan §16 says "Late run … ~27%").
- [ ] **A3 (L1):** demo captions exactly as §16.
- [ ] **A4 / E2 (team):** the §16 water wording says one gap; the data has 35 missing months.
- [ ] **E1 / E3 (team, L4):** plan and video script: the sweep is from Chattogram (not Dhaka); the credits split into "Data in this app" and "Also used in our testing".

---

## 3. The video (L4, everyone): Tue afternoon and Wed 30

From plan §14. **Hard requirements:** at most 240 s; the team name (**Team PTSD**); **every member named, on screen and in the voice-over**; the problem and challenge statement; our approach; YouTube link in the Google Form.

- [ ] **Member names and roles:** they aren't written anywhere in the repo yet. Collect them for the 0:15–0:45 shot (and add them to the README).
- [ ] Record with system audio (OBS), and a separate clean voice-over.
- [ ] Shots, per §14: "Close your eyes" opening (0:00–0:15); Dhaka then vs now (1:15–1:45); Story Mode, storm time-lapse, satellite whisper, Truth panel (1:45–2:45); keyboard-only, eyes-closed Explore (2:45–3:15, since the game isn't built); "Coming in October" roadmap (3:15–3:45); the app in Bangla mode (3:45–3:50).
- [ ] **The shot list needs one change:** X-ray (1:45–2:45) is not built; it's blocked on L1's colorbar files (C1). Use the Truth or Provenance panel in its place, or show X-ray as "Coming in October", which is how the app labels it.
- [ ] **The Truth panel shot:** §14 quotes "0.85 °C; ~27%", but the app currently shows "Verification being updated" for the ocean and "~28%, Early run" for rain (see 2.10). Every on-screen number must match what the app shows.
- [ ] Subtitles in English (Bangla optional); NASA SVS credit visible; no copyrighted music; no one under 18 on camera; final length under 4:00 (aim 3:50).
- [ ] Upload to YouTube and submit the Google Form on **Wed 30**.

---

## 4. Not built (in the plan, but cut or blocked)

| Plan item | Status | Owner |
|---|---|---|
| C2 Pipeline X-ray | **Blocked** until L1 publishes the colorbar images and colour tables (C1). The app says "Coming in October". | L1, then L3 |
| B3 FIRMS fire percussion | Not started; L2's optional list, cut first | L2 |
| H2 Variability → timbre, seasonality → rhythm | Not started; L2's optional list | L2 |
| B5/B6 Extreme pings and area summary | Not built; on the plan's "cut first" list | L3 |
| "Warmer or Colder?" game | Not built; lowest priority in the plan; the video has a fallback shot | — |
| Teasers: GLOBE duet, Earth Ear ID, Earth postcard | Not built (L2 cut the ensemble and GLOBE duet, D11) | — |
| Catalogue of the 23 products | Deferred until L1 provides the data file (C2) | L1, L3 |

---

## 5. Done on 28 Sep (for reference)

- L2's sound engine connected to the UI; L3's stand-in engine and its badge deleted; one copy of the "heaviest frame" rule (`peakFrame`) and of the audio types.
- The rain grid and rain image now load only after Start: 2.2 MB before Start instead of about 7.6 MB. The opening waits up to 4 s for the rain, then plays the ocean alone.
- The time-lapse button shows its loading percentage, with a progress bar, and pressing it cancels the load.
- Place History: drag along the chart, or focus it and use the arrow keys, to hear one month. The chart is a slider for screen readers.
- The History chart no longer floods the console with Recharts warnings below 1280 px.
- A visual README (animated banner, feature GIFs, how it works, accessibility, credits) and the MIT licence for Team PTSD.
- L2: `/dev/audio` hidden in production unless built with `AUDIO_HARNESS=1`; the test page imports `peakFrame` from `@/lib/audio`.

---

## 6. After the video (October)

- The 28 Oct full challenge statements: re-check every feature against them.
- A mentor is assigned after 1 Oct; the 1 Nov video needs the full working build.
- Candidates: X-ray (once colorbars exist), Place History for L1's 42-place global history data, sound in a hidden phone tab, drawing the time-lapse from the grids instead of 10 MB of images, compressed grids, the phone landscape layout, and the "Coming in October" concepts in plan §11.7.
