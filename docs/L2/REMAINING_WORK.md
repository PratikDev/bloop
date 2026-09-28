# L2 Audio — Remaining Work (to freeze)

The work left in the L2 lane from **28 Sep** until the freeze on **Tue 29 Sep, 12:00**. Anyone can pick up an item at any point: read "Before you start", choose the first open item that isn't blocked, and update its status here as you go.

Phases 0–6 are done (see [`BUILD_PLAN.md`](BUILD_PLAN.md) status table). This file tracks everything after that. The detailed specs stay in `BUILD_PLAN.md`; each item below links to them.

## Before you start

- **Branch:** `L2-audio-engine`. Bring it up to date with `main` first (`git fetch origin && git merge origin/main`).
- **Read:** [`BUILD_PLAN.md`](BUILD_PLAN.md) §11 (Phase 8) and §12 (decisions D1–D12), [`AUDIO_API.md`](AUDIO_API.md) (the public API and caption keys agreed with L3), and [`audio_findings.md`](audio_findings.md) (what has been tested and tuned).
- **Code:** engine in `src/lib/audio/`, tuned values in `public/mapping.json` (the only place for numbers), test page at `/dev/audio` (`src/app/dev/audio/page.tsx`, sections in `src/components/AudioHarness/`).
- **Run:** `bun run dev`, then open `/dev/audio` and press Start. **After editing engine code, reload the page** (hot reload leaves the old engine without sound).
- **Phone tests:** same Wi-Fi as the laptop; open the "Network" address `bun run dev` prints (e.g. `http://192.168.0.106:3000/dev/audio`). `next.config.ts` allows `192.168.*.*` in `allowedDevOrigins`; for another address range, add it there and restart the dev server, or the page never becomes interactive on the phone.
- **Check before every commit:** `bun test`, `bunx tsc --noEmit`, `bun run lint`.
- **Rules:** follow `AGENTS.md` (atomic commits, list each path; no Tailwind arbitrary values; keep files short). Any new or changed caption key must be agreed with L3 first and added to `AUDIO_API.md` and `BUILD_PLAN.md` §2.4. Ear-test results go in `audio_findings.md`, with the pass rule written **before** running the test.

## How to mark progress

| Mark | Meaning |
|---|---|
| ⬜ | Not started |
| 🟡 | In progress: add your name and the date in **Notes** |
| ⛔ | Blocked: say on what in **Notes** |
| ✅ | Done: add the commit hash in **Notes** |
| ✂️ | Cut: add the reason in **Notes** |

Change the mark in the table **and** tick the item's checklist below. Commit this file together with the work it describes.

## Work table

| # | Task | Phase | Priority | Depends on | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | Phone wake fix in `startEngine` | 8 | **Required, now** | an iPhone | 🟡 | Code done (28 Sep). Desktop ✓; Android (Honor 400 Pro) ✓, sound resumes by itself on return. iPhone test still to do |
| 2 | Merge `main` (PR #6) and re-check the demo captions | Follow-up | **Now, small** | — | ✅ | Merged 28 Sep (`a803fbb`); the three captions match the JSON word for word |
| 3 | Recorded narration: `preloadClips` / `playClip` | 8 | High | L4 clips (due Tue 29, 10:00) for the real test | ⬜ | |
| 4 | T3 loudness balance | 8 | High | teammates' ears | ⬜ | |
| 5 | T7 how many voices at once | 8 | High | teammates' ears | ⬜ | |
| 6 | Screen-off test on Android | 8 | High | an Android phone | ✅ | Honor 400 Pro (28 Sep): plays on and stays even while locked; no fix needed |
| 7 | Mix pass with L4 | 8 | High | L4's recording plan | ⬜ | |
| 8 | Clean-up | 8 | Medium | 1, 3 | ⬜ | |
| 9 | Freeze note | 8 | High (Tue 29, 12:00) | 1–8 | ⬜ | |
| 10 | Optional voices (FIRMS, NDVI, variability, seasonality) | 7 | Optional, cut first | time before the freeze | ⬜ | Only if 1–8 are done early |
| 11 | Ensemble (L1 §11) and GLOBE duet (L1 §12) | 7 | — | — | ✂️ | Cut for Video 1 (D11, 28 Sep); may come after the freeze |

## Items

### 1. Phone wake fix in `startEngine`

**Why:** after a phone is locked, the audio context can be `"interrupted"` (Safari) rather than `"suspended"`, and the current code only resumes a suspended context, so a tap gives no sound. On iPhone, Web Audio is also muted by the silent switch unless the page asks for a playback session. L3 already fixed this in their interim engine (`ae286f1` on `L3-interface`); L2 must match it so swapping engines doesn't regress. Spec: `BUILD_PLAN.md` §4.1 task 3 and §11.1 task 0.

**Files:** `src/lib/audio/context.ts`, `src/lib/audio/audio-session.ts`.

- [x] Before creating the `AudioContext`, set `navigator.audioSession.type = "playback"` where `navigator.audioSession` exists (typed without `any`): `src/lib/audio/audio-session.ts`, called on every `startEngine`.
- [x] Resume the context whenever its state is not `"running"` (not only when `"suspended"`).
- [x] `bunx tsc --noEmit` passes, including the engine-swap check in `audio_findings.md` (`const e: AudioEngine = l2;`).
- [x] Android (Honor 400 Pro, 28 Sep): locked → sound never stops; Chrome left → stops after ~70 s, and resumes by itself on return (no tap needed).
- [ ] iPhone: lock and unlock, then one tap gives sound again; sound plays with the silent switch on. If no one has an iPhone by the freeze, mark it "untested" in the freeze note.
- [x] Update the `ensureAudio()` row in `AUDIO_API.md` with the phone behaviour; add a findings-log row.

### 2. Merge `main` and re-check the demo captions

**Why:** L1's PR #6 changed the wording of the Dhaka demo captions ("10 years each", the real minus sign "−"). L2 shows captions exactly as the file gives them, so only a check is needed.

- [x] `main` merged into `L2-audio-engine` (`a803fbb`, 28 Sep, no conflicts; tsc and 91 tests pass).
- [x] Harness → Then vs Now → "Load real demo": the heat, monsoon and water captions match `public/data/demo/dhaka_then_now.json` word for word.
- [x] Add a findings-log row; in `BUILD_PLAN.md` §13, mark the L1 "merge into `main`" row as done.

### 3. Recorded narration: `preloadClips` / `playClip`

**Why:** recorded narration (EN, BN) must play through the same mix, with the sonification ducked, and stop on Esc. Spec: `BUILD_PLAN.md` §11.1 task 3; clip format and deadline: decision D12.

**Files:** new `src/lib/audio/clips.ts` (or `players/clip.ts`); remove both stubs from `src/lib/audio/stubs.ts`; export from `src/lib/audio/index.ts`.

- [ ] Agree the caption key with L3 first (proposed: `caption.clip` with `{ url }`, L3 maps the url to its subtitle); add it to `AUDIO_API.md` and `BUILD_PLAN.md` §2.4.
- [ ] `preloadClips(urls)` fetches and decodes ahead of time (the only network use in L2; never during playback).
- [ ] `playClip(url)` plays through the narration bus, ducks the sonification (same `duck` values as speech), resolves when it ends, and stops on Esc (`stopAll`).
- [ ] Harness section to test it; test with a generated clip until L4's arrive.
- [ ] With L4's clips (MP3, `public/audio/narration_en/` and `public/audio/narration_bn/`, named after their segment, e.g. `opening.mp3`): an EN and a BN clip play, duck, and stop on Esc.
- [ ] If L4's clips haven't arrived by **Tue 29, 10:00**: narration uses the browser speech voice only (D12). Note it here and in the freeze note.

### 4. T3 loudness balance

**Why:** high and low ocean pitches must sound equally loud. Spec: `BUILD_PLAN.md` §11.1 task 1.

- [ ] Write the pass rule in `audio_findings.md` before testing (e.g. "teammates rate 220 / 440 / 880 Hz as equally loud").
- [ ] Play the ocean voice at 220 / 440 / 880 Hz at the same gain, on headphones and a phone. Include the compressor's make-up gain (see the 27 Sep findings row).
- [ ] Set `loudnessCompensation.exponent` in `public/mapping.json` (now `0`); check heat sounds balanced with the same value.
- [ ] Record the result and the chosen value in the findings log.

### 5. T7 how many voices at once

**Why:** listeners must be able to tell which voices are playing. Spec: `BUILD_PLAN.md` §11.1 task 2.

- [ ] Write the pass rule first: "which voices are playing?" answered correctly ≥ 8 of 10 at the chosen default.
- [ ] Test 1, 2, 3 and 4 voices together (ocean, rain, water, heat).
- [ ] Set `maxConcurrentVoices` in `public/mapping.json` (now `3`); record the result.

### 6. Screen-off test on Android

**Why:** background timer throttling might slow the 25 ms scheduler tick when the screen is off (unverified). Spec: `BUILD_PLAN.md` §11.1 task 4.

- [x] On a mid-range Android, start a sweep or Then vs Now and turn the screen off. Record whether the sound stays even. (Honor 400 Pro: sound continues and stays even while locked; leaving Chrome stops it after ~70 s, accepted. See the findings log.)
- [x] Not needed (no stutter). If it stutters on another phone: raise the look-ahead to 1 s while `document.hidden`, back to 0.1 s on return; retest.
- [x] Record the device, the result and any fix in the findings log.

### 7. Mix pass with L4

**Why:** the video segments must sound balanced. Spec: `BUILD_PLAN.md` §11.1 task 5.

- [ ] With L4, play the opening, Then vs Now, the storm time-lapse and the story segments as they'll be recorded.
- [ ] Change only gains and timbres in `public/mapping.json` (no rule changes); record each change in the findings log.

### 8. Clean-up

**Why:** nothing unfinished or noisy ships. Spec: `BUILD_PLAN.md` §11.1 task 6.

- [ ] `src/lib/audio/stubs.ts` is empty (delete it) or only holds features marked "cut for Video 1".
- [ ] No debug logs left in `src/lib/audio/` (warnings for real problems may stay).
- [ ] Split `src/lib/audio/mapping.ts` (451 lines, too long for `AGENTS.md`) into smaller files without changing its exported names.
- [ ] No hard-coded data numbers in `src/lib/audio/**`.
- [ ] `bun test`, `bunx tsc --noEmit`, `bun run lint` pass; no console errors in Chrome and Edge.

### 9. Freeze note (Tue 29, 12:00)

**Why:** the team needs to know the final settings and what shipped. Spec: `BUILD_PLAN.md` §11.1 task 7 and §11.2.

- [ ] Full app run on a laptop speaker, headphones and a mid-range Android: no clicks, no distortion at full volume, nothing startling.
- [ ] Audio items in TEAM_BUILD_PLAN §13 pass (instant response, no clicks, volume capped, keyboard-only run with L3).
- [ ] Final settings written to the findings log: duck level, look-ahead, loudness exponent, max voices, harmonic gains.
- [ ] `BUILD_PLAN.md` status table updated (Phase 7 and 8 rows), and the §11.2 checklist ticked.
- [ ] Every row in this table is ✅ or ✂️.

### 10. Optional voices (Phase 7, cut first)

Only start if items 1–8 are done before the freeze. Specs and tests: `BUILD_PLAN.md` §10. Each is independent; mark the ones not built ✂️.

- [ ] FIRMS fire clicks (B3)
- [ ] NDVI vegetation pad
- [ ] Variability → timbre (`designChoice: true`)
- [ ] Seasonality → rhythm (`designChoice: true`)

### 11. Ensemble and GLOBE duet — ✂️ cut

L1's §11 (`ensemble_bd.json`) and §12 (`globe_duet.json`) data stays; L2 doesn't sonify it for Video 1 (decision D11, 28 Sep: L3's UI doesn't use them and there's no time before the freeze). If picked up after the freeze, agree the API names with L3 first.
