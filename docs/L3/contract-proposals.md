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

## B. Requests to L2 (for the real audio engine)

L2's planned API (`docs/L2/BUILD_PLAN.md` §2) is used as-is: same function names, same argument shapes. The interim engine in `src/lib/audio-adapter/` implements it, plus the two additions below. Please add them to the real engine so it can replace the interim one without UI changes.

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

### C2. Catalogue of the 23 EIC daily products (deferred)
- The catalogue screen waits for a data file listing each product and its status ("Verified", "Converted, not yet verified", "Picture only", "Coming in October"), so no badge is hard-coded in the UI.

---

## D. Changes L3 makes to `data-contract.ts`

L3 may edit the **data-file types** (L3 owns `lib/data`); the **mapping types** (§10) belong to L2 and are not touched. Every change is listed here and in the phase report.

_None yet._
