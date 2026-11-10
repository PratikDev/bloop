# Mix pass (CV/ML build, piece D, 10 Nov 2026)

What Bloop sends to the speakers in each mode, measured, and the levels it is held to. The value → pitch and value →
density rules and the mapping files' levels were not changed (hard rule); this pass measures them, sets the new chord's
level, and adds a test that fails on clipping or a loudness drift.

## The standard and the numbers we hold to

- **Loudness target: −18 LUFS integrated** (ITU-R BS.1770-4 meter, gating as the standard). We follow **AES TD1008**
  (AES recommendation for loudness of internet audio streaming and on-demand distribution), which recommends −16 to
  −20 LUFS for content played in browsers and on phones, unlike broadcast's −23 LUFS (EBU R128), which would leave Bloop
  very quiet next to the rest of a listener's web audio. −18 sits in the middle of that range.
- **True-peak ceiling: −1 dBTP** (4× oversampled, BS.1770 Annex 2's method), AES TD1008's ceiling for lossy playback.
- **Drift tolerance: ±3 LU** per mode against the recorded numbers below (live data changes the sound from day to day, so a fixed number would fail on a new frame;
  3 LU is a clearly audible change in programme loudness, so a drift of that size is a real change to the mix).
- The meters: `src/lib/cv/loudness.ts`, checked against BS.1770's reference (a full-scale 997 Hz sine in one channel
  reads −3.01 LUFS) in `loudness.test.ts`.

## Gain structure

| Layer | Level | Where it is set |
|---|---|---|
| Data voices (melody) | the loudest: each voice at its `sound.maxGain` into its channel, capped by `voiceMaxGain` | `public/mapping.json` (unchanged) |
| Value chord | **8 dB under the melody** by design (`CHORD_DB = −8`); measured: **−7.6 dB RMS** (the pad's weak 2nd and 3rd harmonics add 0.4 dB) | `src/lib/audio/layers/chord/voice.ts` |
| Earcons | short (no-data tick, ping: tens of ms), on their own bus | unchanged |
| Master limiter | the master DynamicsCompressor (threshold −6 dB, ratio 20:1, 3 ms attack) acts as a gentle limiter; no mode measured here reaches it (the loudest true peak is −7.8 dBTP) | `public/mapping.json` `global.compressor` (unchanged) |
| Mute all, Esc | Mute all sets the master to 0; Esc fades every bus in 50 ms and stops every source; the chord's tones are on the sonification bus and are stopped by the same Esc (its `onStopAll`), and Esc stops the app's playing state, which lets go of the chord's owner | unchanged; chord wired in |

## Measured (Chromium, 30 s per mode, `docs/audio/mix_results.json`)

Recorded at the start cursor with a recorder in front of the destination (the app is not changed). Duet = proof in
unison (U). Turntable = the live needle on the Turntable page. Rain = the storm time-lapse (the start cursor is dry: rain
is silent there, by the "silence means no data or dry, never zero" rule).

| Mode | Integrated (LUFS) | vs −18 target (LU) | True peak (dBTP) | Mono − stereo (LU) | Flatness | Flatness after 200 Hz HP |
|---|---|---|---|---|---|---|
| Listen Ocean | −14.1 | +3.9 | −10.1 | −0.7 | 0.000 | 0.000 |
| Listen Rain (time-lapse) | −31.8 | −13.8 | −15.9 | −0.6 | 0.035 | 0.034 |
| Listen Both | −14.1 | +3.9 | −10.8 | −0.7 | 0.000 | 0.000 |
| Listen Ocean + chord | −13.1 | +4.9 | −7.8 | −0.5 | 0.000 | 0.000 |
| Duet (proof in unison) | −15.3 | +2.7 | −9.7 | −1.3 | 0.750 | 0.750 |
| Then vs Now | −19.6 | −1.6 | −13.7 | 0.0 | 1.000 | 1.000 |
| Turntable | −17.7 | +0.3 | −12.1 | −0.3 | 0.269 | 0.269 |

- **No clipping:** every mode's true peak is at least 6.8 dB under the −1 dBTP ceiling.
- **Mono fold-down:** folding to mono changes loudness by at most 1.3 LU (equal-power panning; nothing cancels), so the
  layers stay where they were.
- **Small speakers:** after a 200 Hz high-pass, Ocean is still a pure tone (flatness ≈ 0) and Rain still noise-like
  (flatness 0.034): the two stay distinct. (Flatness over sparse drops is low in absolute terms because most of each
  window is silence between drops; the test checks Rain stays more than 5× flatter than Ocean.)
- **Against the target:** the steady-tone modes sit 3–5 LU above −18 and sparse rain 14 LU below it. Bringing them to
  the target means changing the voices' levels in `mapping.json`, which this build may not touch; it is listed as the
  next mix step, with these numbers as the baseline. The chord, the only new layer, was set relative to the melody.

## Integration trims (10 Nov 2026)

The pass above measured the levels and left them; integration brings them toward the target **without touching
`public/mapping.json`**: a constant per-voice gain at each voice channel's input (`src/lib/audio/mix-trims.ts`, applied
in `graph.ts`, the opening sweep and the chord's melody reference). The trims are computed, never typed, by
`scripts/mix-trims.ts` from CV's untrimmed measurements, frozen in `docs/audio/mix_baseline.json`:

> trim = min(target − measured loudness, (master compressor threshold − 1 dB) − measured true peak)

so no trim pushes a mode's peaks into the master compressor (threshold −6 dBFS, from `mapping.json`). The rain voice is
sparse drops: its integrated loudness is low because of the silence between drops, so its trim is capped by its peaks
(+8.9 dB of the +13.8 dB to target) rather than chasing the average.

| Voice | Trim (dB) | From mode | To target | Peak room |
|---|---|---|---|---|
| ocean | −3.9 | Listen Ocean | −3.9 | +3.1 |
| rain, snow | +8.9 | Listen Rain | +13.8 | +8.9 |
| heat, monsoon, water | +1.6 | Then vs Now | +1.6 | +6.7 |

Re-measured on the integrated build (every CV, ART and DATA flag on; Chromium, 30 s; `mix_results.json`):

| Mode | Before (LUFS) | After (LUFS) | vs −18 (LU) | True peak after (dBTP) |
|---|---|---|---|---|
| Listen Ocean | −14.1 | −16.4 | +1.6 | −10.6 |
| Listen Rain (time-lapse) | −31.8 | −23.0 | −5.0 | −7.0 |
| Listen Both | −14.1 | −17.7 | +0.3 | −13.4 |
| Listen Ocean + chord | −13.1 | −16.8 | +1.2 | −10.7 |
| Duet (proof in unison) | −15.3 | −19.2 | −1.2 | −7.7 |
| Then vs Now | −19.6 | −16.3 | +1.7 | −9.7 |
| Turntable | −17.7 | −17.5 | +0.5 | −11.3 |

- Every mode but rain is within ±3 LU of −18; rain is 5 LU under it, held there by its peak cap (its loudest drops now
  sit at −7 dBTP, the cap).
- Ocean and Then vs Now came out about 1.6 LU louder than the trims alone predict: on the integrated build the dial's
  default (Blend) plays them in their Earth Orchestra families, whose harmonics add loudness. Pitch is unchanged
  (the pitch-identity and Check 5 runs in `docs/BUILD_2026-11-10.md`).
- The chord still sits 7.6 dB RMS under the melody (it follows the ocean voice's trim).
- No true peak reaches −1 dBTP; the loudest is −7.0 dBTP.

## The test

`e2e/cv/mix.e2e.ts` (one test per mode, a fresh app each): fails if a mode is silent, if its true peak reaches −1 dBTP,
if mono folding moves it more than 3 LU, or if its loudness drifts more than 3 LU from `mix_results.json`; also the
small-speaker check and the chord's 6–10 dB gap. `UPDATE_MIX=1 MIX_SECONDS=30` (Chromium) rewrites the file.

Check 5 (pitch accuracy of the rendered chain, every voice < 0.001 cents): `docs/audio/check5_results.json`, method in
`pipeline/stats/check5_audio.py` and `docs/cvml/BUILD.md`.
