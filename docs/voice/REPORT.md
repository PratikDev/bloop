# Ask Bloop: report

Built 9 Nov 2026 on `bloop-dev`, parser-only, as agreed (see [RECON.md](RECON.md)). How it works and the flags:
[README.md](README.md).

## Built, per phase

| Phase | What | Where |
|---|---|---|
| 0 | Reconnaissance, conflicts, needs human input, baseline | [RECON.md](RECON.md) |
| 1 | The registry (21 intents, examples EN + BN), handlers calling the app's own commands, the typed box, answers through the status region or Bloop's voice | `src/lib/ask-bloop/{intents,registry,validate}.ts`, `src/components/AskBloop/` |
| 2 | Question intents from the engine (value here / at a place, highest or lowest near, Compare two months, the sound's rule, the provenance line, the Truth panel's check), the value's tone after it, the digit-provenance check | `src/components/AskBloop/questions.ts`, `src/lib/ask-bloop/digits.ts` |
| 3 | The deterministic parser (EN + BN, Bangla digits and month names) and places through Bloop's gazetteer (aliases only, no coordinates) | `src/lib/ask-bloop/{parser,normalise,places}.ts` |
| 4 | Push-to-talk (hold Speak or Alt+K; off-able; on-device where offered), ducking with release on every ending, earcons, the input language, five starters, settings; the gate-test page | `src/lib/ask-bloop/voice.ts`, `src/components/AskBloop/use-push-to-talk.ts`, `src/app/dev/voice/`, `src/components/VoiceGate/` |
| 5 | The AI fallback, built and **off**: schema from the registry, validation, 4 s timeout, one fallback provider, rate limit, no numbers sent | `src/lib/ask-bloop/llm/`, `deploy/ask-intent/` |
| 6 | Docs, benchmark and runner, manual checks, gate test, study protocol | `docs/voice/`, `scripts/ask-benchmark.ts` |

**Skipped, and why:** `set_mode` (Listen / Analyse) and `set_dial` (Science↔Art): the app has neither. `slower` /
`faster`: no playback-rate control. `set_time` to a date: Listen shows the latest frames (frame steps and
`compare_dates` are built). TalkBack and the Android gate condition: desktop website only. The provider smoke test:
no keys (the route is unit-tested with a stub provider).

## Existing files touched

| File | Why |
|---|---|
| `src/components/pages/Listen/index.tsx` | Mounts the panel (flag on only); the fitted stage leaves one row for its button |
| `src/lib/flags.ts` | `askBloop`, `askBloopVoice`, `askBloopLlm` |
| `src/lib/i18n/index.ts`, `bn/index.ts`, `bn/drafts.ts` | The strings, Bangla marked as drafts |
| `src/lib/audio/index.ts` | Exports the existing `beginDuck` (the one audio hook the spec allows) |
| `src/lib/sonar.ts` | `extremeNear` for highest and lowest; `sonarTarget` unchanged in behaviour (RECON conflict 9) |
| `.env.example` | The `ASK_BLOOP_*` variables, empty |

## Tests

All on 9 Nov 2026.

- **Unit** (`bun test src/lib/ask-bloop`): 57/57. Registry: every intent has three or more examples in each language,
  and each one parses back to its intent; slots; Bangla digits and months; places and aliases (each alias's target is
  in `public/geo`); 10 unsafe inputs run nothing; validation refuses unknown intents, extra slots, coordinates;
  digit provenance; the AI route with a stub provider (valid intent only, one fallback try, no retry loop, no data
  sent, rate limit, unconfigured refuses).
- **Benchmark** (`bun scripts/ask-benchmark.ts`, parser only): intents 35/35, slots 25/25, refusals 5/5, median parser
  latency under 0.1 ms. Parser + AI: not run (off, no key). Numeric correctness: 100% by construction.
- **Browser** (`e2e/ask-bloop.e2e.ts`, Chromium + Firefox, flag on): 16/16. The panel is labelled and axe clean; a
  typed question is answered once with the same words Enter says; actions leave the app as its own controls do (the
  track, the needle on Dhaka's gazetteer point, the page, the detail setting); unsafe input runs nothing and says no
  number; an unknown place is said so; Bangla in the box works; typing never reaches the map's keys; the median
  answer is under 25 words.
- **No regression** (spec §6.3): with Ask Bloop off, the full a11y + features + health run was 414/414 (steps 7 + 8);
  with it on, 458/458 (the same suites plus braille and Ask Bloop).
- **Not run:** the gate test and the manual NVDA checks (people run these; see GATE_TEST.md and MANUAL_CHECKS.md).

## Known limits and open items

- Bangla examples and answers are drafts until a Bangla speaker checks them; Bangla voice depends on the gate test.
- Places are what Bloop's gazetteer has (Natural Earth places and seas, Bangladesh's districts); named currents are not
  defined.
- The AI fallback has never run against a real provider (no key); its schema and validation are unit-tested only.
- Not tested with NVDA yet (the manual checks are written); not tested with users (the study protocol is written).

## Recommended flags for the Video 2 build

`NEXT_PUBLIC_ASK_BLOOP=1` (typed box and answers). `NEXT_PUBLIC_ASK_BLOOP_VOICE=1` only after the gate test passes
for English (and then only English voice unless Bangla passes too). `NEXT_PUBLIC_ASK_BLOOP_LLM` unset.
