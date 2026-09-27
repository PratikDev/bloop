# L3 Contract Proposals and Pending Decisions

Items here are proposals for the team. Nothing in this file is final until the owner lane agrees.

---

## A. On-screen wording pending team approval (plan §16)

Until the team approves new §16 wording, L3 builds these sentences **from the JSON numbers** and shows a "Pending team approval" badge next to them.

### A1. Truth panel, ocean temperature (SST)
- **Conflict:** §16 says "median error 0.85 °C". `latest/sst.json` now says `verified.value: 0.31` (after the colorbar recalibration, `calibration.method: "H1 round -4..34"`). `latest_check.median_abs` is also about 0.32.
- **Decision (27 Sep):** don't show 0.31 °C until L1 confirms it was measured on a **held-out frame**, meaning a different frame from the one used for calibration. Until then the ocean Truth section shows **"Verification being updated"** instead of a number.
- **Ask to L1:** state in `sst.json` whether `verified` / `latest_check` came from the calibration frame or a held-out frame. A field such as `verified.held_out: boolean` plus the calibration frame date would let the UI decide without guessing.

### A2. Truth panel, rain
- **Conflict:** §16 says "IMERG (Late run)". Today's frame was checked against the **Early** run (`latest_check.imerg_run: "Early"`), while `verified.matched_run` still says "IMERG Late".
- **Decision:** the UI names the run the JSON says was checked, currently `latest_check.imerg_run` = Early. The percentage and the point count come from the JSON too.
- **Ask to L1:** make `verified.matched_run` and `latest_check.imerg_run` agree, or document which one the Truth panel should quote.

### A3. Then vs Now captions (`demo/dhaka_then_now.json`)
- **Conflict:** the JSON captions differ from §16:
  - heat says "10 and 10 years" where §16 says "10 years each";
  - rain and water use a plain hyphen "-9%", "-12%", "-5.82", where §16 uses the minus sign "−" (U+2212).
- **Decision:** the UI shows the captions **exactly as the JSON gives them**. The product lead is asking L1 to fix the JSON text to match §16, and the UI follows automatically.

---

### A4. Water wording: GRACE has 35 missing months, not one gap
- §16 (and the demo caption) says: "Silence = no satellite measurements (Jul 2017–May 2018)."
- `context/grace.json` has **35 missing months in 19 separate stretches** for the Bangladesh box: the 11-month gap between GRACE and GRACE-FO (Jul 2017–May 2018), plus **24 more months in 18 short stretches** between Jun 2002 and Sep 2018 (for example Jun–Jul 2002, Aug–Sep 2013, Aug–Sep 2018). NW India has the same missing months.
- The sound is silent for **every** missing month, so the current sentence explains only part of the silence a listener hears.
- **What the UI does now:** it shows the JSON caption as-is (decision A3), and each stretch of silence gets its own caption naming its months ("Silence: no satellite measurements, Aug 2013 to Sep 2013"). The chart shades every missing month.
- **Proposal for §16:** "Silence = no satellite measurement that month (35 months in total, including Jul 2017–May 2018 between GRACE and GRACE-FO)." The count and dates would come from `grace.json` (`missing_months`, `gap_note`). Needs team approval, then L1 updates the demo caption.

---

## B. Requests to L2 (for the real audio engine)

**Source of truth:** L2's API names and shapes in `docs/L2/BUILD_PLAN.md` §2 (and §8 for Then vs Now). The UI's `L2AudioApi` type mirrors them exactly. If L3 needs a new function, event or parameter, it is added here as a proposal first (like B1 to B6) and only used once L2 agrees, or behind a fallback that degrades safely.

| ID | Request | Status (28 Sep) |
|---|---|---|
| B1 | `getAnalyser()` | Requested; the UI has a fallback |
| B2 | Per-drop events | Requested; the UI skips ripples without them |
| B3 | `setVoiceVolume()` | Requested; the UI has a fallback |
| B4 | Shared files and merge rules | Agreed; see below |
| B5 | Step events count data points only | **Accepted by L2** |
| B6 | `playSeries()` | **Accepted by L2**; now part of `L2AudioApi`, fallback removed |
| B7 | Caption keys | **Agreed set** for Then vs Now; see below |
| B8 | Time-lapse caption keys, params and player name | **Heads-up to L2**, waiting for L2 to confirm |

### B1. `getAnalyser(): AnalyserNode | null`
- **Why:** the live waveform (bottom bar) and the sound rings at the cursor draw from the real output signal.
- **Where to tap:** post-master (after the compressor), so the picture shows what the listener hears.
- **Settings:** `fftSize` 2048.
- **Return value:** `null` before `ensureAudio()`.

### B2. Per-drop events
- **Why:** rain ripples are drawn one per scheduled drop, so the picture matches the sound exactly.
- **Proposed event** (added to `AudioEvent`):
  ```ts
  | { kind: "drop"; voice: "rain" | "snow"; time: number; gain: number; lon: number }
  ```
  - `time` is the `AudioContext.currentTime` the drop is scheduled for. The UI draws the ripple when `currentTime >= time`.
  - `gain` is the drop's loudness (0..1), which sets the ripple size.
- **Rate:** up to 40 per second (the rain density ceiling); the UI handles that.

### B3. `setVoiceVolume(id, v)`
- **Why:** plan §9.1 asks for a per-voice volume slider in the mixer. L2's API only has mute, solo and master volume.
- **Proposed:** `setVoiceVolume(id: VoiceId, v: number): void`, where `v` is 0..1 and is multiplied under the voice's `maxGain` cap.

### B4. Shared files and merge rules
Checked on 28 Sep in L2's review of PR #4: L3 and `L2-audio-engine` merge cleanly except `bun.lock`. Type check, lint and L2's tests pass on the merged code, and `withFallbacks(l2)` type-checks.

**Rule: before touching any shared file below, L3 checks with L2 (and L2 does the same with L3).**

| Shared file | Owner | Rule |
|---|---|---|
| `public/mapping.json`, `src/lib/audio/mapping.ts`, contract §10 mapping types | L2 | L3 carries byte-identical copies and never edits them; L2's version always wins |
| `package.json` **scripts** | L2 | L2 already has `"test": "bun test"`. **L3 won't add another `test` script**; L3's tests will run through L2's. |
| `package.json` dependencies, `bun.lock` | Both | L3 added `recharts` (for the shadcn `chart` component that plan §9.2 requires) and the same `@types/bun@^1.4.2` that L2 has. Both lanes add lines at the same place in `bun.lock`, so it will conflict once. **Decision (27 Sep):** L3 doesn't merge L2's branch; L2 merges into `main` first; a `bun.lock` conflict is resolved by regenerating the lockfile with `bun install` (or taking L3's lockfile, which L2 confirmed also works). |
| `src/components/ui/`: `dialog`, `sheet`, `slider`, `tabs`, `toggle`, `toggle-group`, `tooltip`, `chart` | L3 | Added and re-themed by L3 (no shadows, no black backdrop, no blur, labelled slider thumb). L2 reuses them rather than adding its own. |
| `src/components/ui/`: `badge`, `card`, `label`, `select`, `switch` | L2 | Added on L2's branch. **L3 won't add these**; L3 reuses L2's once they're in `main`. |
| `src/lib/then-now.ts` (`buildThenNowInput`), `src/lib/data/context.ts` (`loadDemo`, `loadGrace`) | L3 | **L2's audio test page reuses these.** L3 gives L2 a heads-up before changing their names or shapes. |
| `.claude/launch.json`, `src/lib/audio/**` (other than `mapping.ts`), `docs/L2/**` | L2 | L3 doesn't touch them |

- **Sweep centre is now Chattogram** (22.36° N, 91.78° E): a team decision on 27 Sep. L2's plan has been updated to match. Then vs Now stays Dhaka, because its data and §16 wording are Dhaka's.

### B5. Step events count data points only (accepted by L2, 28 Sep)
- Silent gaps (the pause between windows, the tail) emit **no** step event.
- `index` is the data index: 0 to 19 for heat and monsoon (window A, then B), and the month index for water. `total` is the number of data points.
- Player names: `"thenNow.heat" | "thenNow.monsoon" | "thenNow.water"`, `"compare"`, `"compare.split"`, `"sweep"`, and whatever `playSeries` is given (`"history"`).
- The interim engine does this; L2's engine will too.

### B6. `playSeries(side, { stepMs?, player? })` (accepted by L2, 28 Sep)
- **Why:** Place History (plan H1) plays one place's monthly series, one decade at a time.
- **Agreed:** one side, steps of `stepMs` (default: heat and monsoon 150 ms, water 60 ms), step events under the given `player` name. L2 builds this instead of its planned `playHistory(...)`.
- **Now required:** `playSeries` has moved from L3's optional extras into `L2AudioApi`, and the old `playCompare` fallback is removed. That fallback was also buggy: its step events came out as `"compare"`, so the History playhead never moved, and it added 0.8 s of silence at the end.

### B7. Caption keys (agreed set for Then vs Now, 28 Sep)
L2 sends exactly these keys with exactly these params; the UI has English text for each (`src/lib/i18n/en/captions.ts`):

| Key | Params |
|---|---|
| `caption.thenNow.caption` | `{ text }` (the JSON caption, shown as-is) |
| `caption.thenNow.window` | `{ label }` ("1981–1990") |
| `caption.thenNow.end` | none |
| `caption.water.gap` | `{ from, to }` ("YYYY-MM") |
| `caption.water.windowStart` | `{ month }` |
| `caption.water.windowEnd` | `{ month }` |
| `caption.compare.side` | `{ label }` |
| `caption.compare.useHeadphones` | `{ a, b }` |

**Any new caption key needs a heads-up in both directions:** L2 tells L3 before sending a new key (so the UI can add its text in both languages), and L3 tells L2 before expecting one. An unknown key shows on screen as its raw name: visible, but never a crash.

The live-exploration keys the interim engine sends today are listed in `docs/L3/integration.md` §1 for L2's reference. They aren't agreed yet; L2 confirms them with its Phase 2 and 3 work.

### B8. Storm time-lapse: caption keys, params and player name (heads-up to L2, 28 Sep)
L2's plan (Phase 6) says to tell L3 before emitting the time-lapse keys. L3 now has English text for them, with these params:

| Key | Params |
|---|---|
| `caption.timelapse.start` | `{ count }` (number of frames) |
| `caption.timelapse.peak` | `{ value, phase }`: the heaviest frame's mm/h, and `"liquid"` or `"frozen"` (the caption says "rain" or "snow") |
| `caption.timelapse.end` | none |

- **Player name:** `"timelapse"`; step `index` = frame index (0 to 47), `total` = number of frames. This follows B5.
- **Signature:** as in L2's plan, `playTimelapse(frames: SweepPoint[], { fps?: number; loop?: boolean })`. The UI passes `fps: 2` and doesn't use `loop`. It's now part of `L2AudioApi`.
- **Frames:** L3 builds one `SweepPoint` per frame: the point that follows the heaviest rain near Bangladesh (see `src/lib/data/storm.ts`), with that frame's decoded value.
- **Please confirm** the `peak` params (`phase` is L3's addition, so the caption can say "snow").

---

## C. Requests to L1 (data)

### C1. Colorbar images and colour tables (blocks X-ray, feature C2)
- **Needed:** for each live product (ocean temperature, rain liquid, rain frozen):
  - the colorbar image as the viewer sees it;
  - a colour table (RGB → value, with the pixel positions of the ticks).
- **Label vs calibration issue:** the ocean temperature colorbar is **labelled −5 to 35 °C**, but the calibration against MUR found the ticks mean **−4 to 34 °C** (`sst.json` → `calibration.legend_labels: "-5..35 C"`, `calibration.value_at_ticks_C: [-4, 34]`). The X-ray must not show a marker landing at "35 °C" on a tick that the data says means 34 °C. Proposal:
  - the X-ray shows the calibrated value;
  - a one-line note under the colorbar says "Colorbar labels read −5 to 35 °C; checked against NASA MUR, the ticks mean −4 to 34 °C";
  - the wording goes to the team for approval as a new §16 row.

### C1b. Truth plots
- `truth/rain_compare.png` is from the first check (IMERG **Late**, title `imerg_late_S0000`), while today's re-check in `rain.json` used the **Early** run. The UI shows the plot with the caption "Plot from the first check (IMERG Late run, 150 points), not today's re-check."
- `truth/sst_compare.png` is from the 21 Sep frame, before the recalibration. It stays hidden, along with the ocean number, until the held-out check is confirmed (§A1).
- **Ask to L1:** publish plots for the check the Truth sentence quotes. Also add `approx_percent` to `latest_check`: the UI currently computes it as (10^median_abs_log10 − 1) × 100, the same way `verified.approx_percent` is derived, which gives 28% for today's re-check.

### C2. Catalogue of the 23 EIC daily products (deferred)
- The catalogue screen waits for a data file listing each product and its status ("Verified", "Converted, not yet verified", "Picture only", "Coming in October"), so no badge is hard-coded in the UI.

### C3. Compress the grids (first-load size)
Measured on 27 Sep with `next start` on localhost (Vercel may differ, and there's no deployment URL to measure yet): `.bin` files are served as `application/octet-stream` with **no compression**, while the JSON files are gzipped.

| File | Sent now | gzip -9 | brotli 11 |
|---|---|---|---|
| `latest/sst.bin` | 1,048,576 B | 517,742 B | 444,704 B |
| `latest/rain.bin` | 3,240,000 B | 127,336 B | 106,117 B |
| `latest/rain_phase.bin` | 1,620,000 B | 52,073 B | 44,608 B |
| Total grids | **5.9 MB** | **0.70 MB** | 0.60 MB |

The images add `sst.webp` (207 KB) and `rain.png` (931 KB). The storm time-lapse adds **10.5 MB** more when it's first played (48 grids, already gzipped, and 48 PNG frames of about 158 KB each); it only loads when someone presses "Play storm time-lapse".
- **Ask to L1:** also publish `sst.bin.gz`, `rain.bin.gz` and `rain_phase.bin.gz`, the way `sequence/*.u8.gz` already is. L3 would decode them with the browser's `DecompressionStream("gzip")`: a small change in `src/lib/data/fetch.ts`.
- **Alternative:** a `headers` rule in `next.config.ts`. It's shared config, so this needs the team to agree, and it would have to be checked on Vercel.
- Until then, the rain grid loads after first paint, so the ocean view isn't blocked.

### C4. Then vs Now for Chattogram? (question for L1 and the team)
- The team is from Chattogram. In L1's context files:
  - **heat (GISTEMP):** Chattogram and Dhaka are the **same grid cell** (23.0° N, 91.0° E), so the heat numbers are identical;
  - **rain (GPCP, GPCC):** Chattogram has **its own cell** (21.25° N, 91.25° E); Dhaka shares one with Sylhet.
- A "Chattogram then vs now" would need L1 to rebuild the demo file for Chattogram (new rain windows and numbers) and the team to agree new §16 wording.
- **L3 needs no code change:** the UI renders any demo file of the same shape. Only the file path in `src/lib/data/paths.ts` would change.

### C5. Lighter storm time-lapse frames (for October)
The storm time-lapse is a **10.5 MB first download**: 48 grids (already gzipped) and 48 PNG frames of about 158 KB each. That's slow on phones and weak networks. Plan §17 lists the fallback for "Time-lapse too heavy": 24 frames instead of 48, at lower resolution.
- **Ask to L1 (October):** publish lighter frames, either of these:
  - the same 48 frames as **WebP** (the ocean image is already `sst.webp`); or
  - **24 frames** (hourly) at **lower resolution**.
- **L3 needs no code change** if `sequence.json` keeps its shape: the UI reads the frame list and file names from it.
- **Until then:** the time-lapse loads only when someone presses "Play storm time-lapse", and the app shows a loading message with a file count ("Loading the time-lapse: 12 of 96 files") while the frames download.

---

## D. Changes L3 makes to `data-contract.ts`

L3 may edit the **data-file types** (L3 owns `lib/data`); the **mapping types** (§10) belong to L2 and are not touched. Every change is listed here and in the phase report.

_None in Phase 2 or Phase 3 item 1._ The only contract change on `L3` is L2's own §10 mapping types, copied unchanged from `L2-audio-engine@8ccb937` (commit `4915728`).

---

## E. Team plan updates needed (TEAM_BUILD_PLAN.md and the video script)

### E1. Sweep starts from Chattogram, not Dhaka
- **Decision (27 Sep):** the sweep's rings now start from Chattogram (22.36° N, 91.78° E), the team's home city. It's on the Bay of Bengal coast, so the first ring already has ocean sound (Dhaka is inland). Then vs Now stays Dhaka.
- **Changed in L3:**

| Place | File | What it says now |
|---|---|---|
| Sweep centre | `src/lib/data/places.ts` (`SWEEP_CENTER`, was `DHAKA`) | 22.36° N, 91.78° E |
| Sweep path and ring | `src/components/Commands/index.tsx` | uses `SWEEP_CENTER` |
| Place name (one source) | `src/lib/i18n/en/places.ts` | "Chattogram" |
| Caption when the sweep starts | `src/lib/i18n/en/captions.ts` (`caption.sweep.start`) | "Sweeping outward from Chattogram" |
| Help dialog and keyboard help (key S) | `src/lib/i18n/en/help.ts` (`key.s.action`) | "Play the sweep outward from Chattogram" |
| Design plan, motion #4 | `docs/L3/design-plan.md` §5 | ring expands from Chattogram |
| Bangla list | `docs/L3/bangla-strings.md` | regenerated with the new English text |

- **Still says Dhaka, needs the same change:**
  - `docs/TEAM_BUILD_PLAN.md` §9.2 modules table (`sweep-controls.tsx`: "rings outward from Dhaka");
  - §9.3 keyboard map ("S: Sweep from Dhaka");
  - §11 feature A6 ("Gist sweep from Dhaka");
  - ~~L2's `docs/L2/BUILD_PLAN.md` Phase 4~~ (done: L2 updated its plan on 28 Sep);
  - the video script: the §14 shot list doesn't name the sweep centre today, but any narration or on-screen text that says "sweep from Dhaka" must say Chattogram (L4).

### E2. §16 water wording
- See A4. §11.5 (water row) and §13 (QA list) quote the same wording.
