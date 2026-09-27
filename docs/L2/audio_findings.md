# L2 Audio — Findings Log

One row per finding, ear test or tuned value (template from [`AUDIO_RESEARCH.md`](AUDIO_RESEARCH.md) §9).
Write the **pass rule before running** a test. Record failures too. Ear-test results are **settings**, not findings about users.

| Date | Question | What we found | Source or test ID | Confidence (High / Medium / Low) | Decision for our app | Owner |
|---|---|---|---|---|---|---|
| 27 Sep | Phase 0: do the mapping rules compute the numbers the plan expects? | `bun test`: 29 pass, 0 fail, 114 expect() calls (ocean 15 °C → 440 Hz; 1 °C ≈ 3.53 %; rain log midpoint → 21 drops/s; heat demo means ≈ 6.57 semitones apart; monsoon 15.104 → 9, 13.706 → 8 drops per step) | Phase 0 tests (`src/lib/audio/__tests__/mapping.test.ts`) | High (maths only; nothing heard yet) | `public/mapping.json` v0.1.0 is the single source of every rule | L2 |
| 27 Sep | Does the gain budget hold with the chosen starting values? | 3 × 0.25 + 0.15 = 0.90 < 1.0; with narration and ducking 0.75 × 0.3 + 0.15 + 0.6 = 0.975 < 1.0; heat 0.15 + heat deviation 0.10 = one voice budget | Phase 0 test "the gain budget holds" | High (arithmetic; loudness still to tune by ear, T3) | Keep starting values until Phase 8 | L2 |
