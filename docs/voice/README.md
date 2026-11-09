# Ask Bloop

Speak or type commands and questions about Bloop's records. Every action calls what the app's own buttons and keys
already call; every number in an answer is computed from NASA data by Bloop's engine. The parser understands English
and Bangla on its own, offline, with no key. An optional AI fallback only interprets the question, is off, and never
supplies a number.

Spec: `remaining features/CLAUDE_CODE_PROMPT_voice_ask_bloop.md`. Reconnaissance: [RECON.md](RECON.md). Report:
[REPORT.md](REPORT.md).

## How it works

1. **Input:** the typed box (always), or push-to-talk (hold **Speak**, or **Alt+K**; never always listening) where the
   browser has speech recognition. What was heard is put in the box, so it can be corrected before Enter.
2. **Parser** (`src/lib/ask-bloop/parser.ts`): English and Bangla patterns and keywords, Bangla digits and month
   names, a confidence threshold. Below it, Bloop asks a short question instead of guessing.
3. **Registry** (`src/lib/ask-bloop/registry.ts`, `intents.ts`): 21 intents, each with its examples in both languages.
   Slots are checked (`validate.ts`); places are words, mapped by Bloop's own gazetteer (`places.ts`), never coordinates.
4. **Handlers** (`src/components/AskBloop/`): each intent calls an existing command (play, the track, the needle, a
   page, a setting) or an existing engine function (the value at a point, the sonar's warmest or wettest spot, Compare,
   the mapping, the provenance line, the Truth panel's check).
5. **Answer:** a template filled from the engine's results, short and value first, through the app's speech mode (the
   status region or Bloop's voice, never both) and detail level. A value answer then plays that value's tone. The
   digit-provenance check (`digits.ts`) refuses any answer with a number the engine didn't return.

## Flags (build time, `src/lib/flags.ts`)

| Flag | Default | What it turns on |
|---|---|---|
| `NEXT_PUBLIC_ASK_BLOOP=1` | off | The Ask Bloop panel (typed box, answers, starters, settings) |
| `NEXT_PUBLIC_ASK_BLOOP_VOICE=1` | off | Push-to-talk (only after the [gate test](GATE_TEST.md) passes for a language) |
| `NEXT_PUBLIC_ASK_BLOOP_LLM=1` | off | Calls the AI fallback when the parser has no confident match |

With all three off the app behaves exactly as before.

## The AI fallback (off)

Built in `src/lib/ask-bloop/llm/` with a deployable function in `deploy/ask-intent/`. Bloop is a static export, so it
has no server routes: the function is deployed on its own, then the app is built with `NEXT_PUBLIC_ASK_BLOOP_LLM=1`
and `NEXT_PUBLIC_ASK_BLOOP_LLM_URL`. It sends only the words typed or said, the record ids and the registry's tools
(no image, no grid, no number of Bloop's), at temperature 0, with a 4-second timeout and one try of a fallback
provider; the reply must be a valid registry intent or nothing runs. Configure it only through the `ASK_BLOOP_*`
variables in `.env.example` (any OpenAI-compatible endpoint).

**Set a hard spending cap in the provider's dashboard for any paid key.** No key is in this repository.

## Privacy

Bloop records nothing and stores no audio. Where the browser offers on-device recognition, Ask Bloop uses it;
otherwise the browser may send the audio to its own speech service (Settings says which). The typed box avoids this.

## Tests

- `bun test src/lib/ask-bloop`: the registry (every example in both languages parses back to its intent), slots,
  Bangla digits and months, places and aliases, refusals of unsafe input, validation, digit provenance, the AI route
  with a stub provider.
- `bun scripts/ask-benchmark.ts`: the 40-utterance benchmark ([benchmark.json](benchmark.json)), parser only.
- `e2e/ask-bloop.e2e.ts`: the panel with the flag on and off, each action against the app's own path, answers'
  digits against the engine, Escape, the keyboard, axe.
- By hand: [MANUAL_CHECKS.md](MANUAL_CHECKS.md) (NVDA + Chrome), the [gate test](GATE_TEST.md), the
  [task study](STUDY.md).
