# Ask Bloop: speech recognition gate test

A dev-only page that measures how well the browser's speech recognition hears Ask Bloop's commands (spec §7). The
team runs it; the gate decides whether `NEXT_PUBLIC_ASK_BLOOP_VOICE` is turned on for a language.

## Open it

- `bun run dev`, then <http://localhost:3000/dev/voice>. A production build serves a 404 there unless built with
  `VOICE_GATE=1` (for a test deploy).
- Use Chrome on Windows (desktop). The spec's Android phone condition is not part of this build (desktop only).

## Run it

1. Pick the language (English or Bangla) and the condition: **headphones**, or **speakers** (the page then plays
   Bloop's sound through the speakers while it listens, ducked as in the app).
2. For each of the 20 prompts, press and hold **Speak**, read the prompt aloud, release. The page shows the
   transcript, what the parser made of it, and whether that is the expected intent and slots (not an exact string
   match). **Skip** moves on without a result.
3. At the end, **Download CSV** or **Download JSON**: browser, OS, language, condition, on-device or cloud, prompt,
   transcript, parsed intent, correct (yes/no), latency in ms.

The prompts are the registry's own examples (`src/lib/ask-bloop/registry.ts`), 20 per language; the Bangla ones are
drafts until a Bangla speaker checks them.

## The gate (set before any result, not tuned after)

- Turn voice on for a language only if intent accuracy is **at least 80%** for that language with headphones on
  Chrome desktop.
- If Bangla fails and English passes: English voice; Bangla through the typed box, said plainly in the help text.
- If speakers are much worse than headphones: keep ducking, and add "Headphones recommended for voice" to the help.

## Privacy

Nothing is recorded or stored by Bloop. Where the browser offers on-device recognition the page uses it and says so;
otherwise the browser may send the audio to its own speech service. The typed box avoids this.
