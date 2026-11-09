# Ask Bloop: reconnaissance (Phase 0)

Spec: `remaining features/CLAUDE_CODE_PROMPT_voice_ask_bloop.md`. Written 9 Nov 2026 on `bloop-dev`, after the
accessibility core (steps 1–8). Decisions agreed with the team on 8 Nov 2026: parser-only (Phases 0–4, typed and
voice, behind flags); the LLM route (Phase 5) is built but stays off; desktop website only.

## The app

| Thing | Where |
|---|---|
| Framework | Next.js (this repo's version; read `node_modules/next/dist/docs/` before using its APIs), React 19, TypeScript strict, Tailwind v4, shadcn/ui on Base UI |
| Build | `bun run build`, a **static export** (`next.config.ts`: `output: "export"`), served from `out/` |
| Router | Next's app router; the shell keeps one state across pages (`src/components/AppShell`, `use-route-sync.ts`) |
| State | One reducer and context: `src/components/AppState/reducer.ts`, `use-app-state.ts`; accessibility choices in `AppState/access.ts` (speech mode, verbosity, channels) |
| Commands | `src/components/Commands/use-commands.ts`: every action the UI and keys call (`togglePlaying`, `stopAll`, `setTrack`, `setCursor`, `setMode`, `setLang`, `speakCurrent`, `openPanel`, `openHelp`, …) |
| Unit tests | `bun test` (colocated `*.test.ts`) |
| Browser tests | Playwright, Chromium + Firefox desktop (`playwright.config.ts`, `e2e/**/*.e2e.ts`), axe-core via `e2e/lib/axe.ts` |
| Lint | `bun run lint` (ESLint, Next core web vitals + TypeScript) |
| Flags | `src/lib/flags.ts`: public env vars read at build time (`NEXT_PUBLIC_*`), each with a default |

## Sound, speech and the status region

- The AudioContext is created once in `src/lib/audio/context.ts` (`startEngine()`, after the Start gesture); the graph
  (`getGraph()`) holds the master chain. The Turntable runs on the second engine (`src/lib/audio-jukebox`); one plays at
  a time (`src/lib/audio-engines.ts`).
- Start / first-tap unlock: the home page's **Start listening** (`commands.start`), or "Tap to start sound" after a reload.
- Spoken lines: `commands.say()` → the status region or Bloop's voice (`src/lib/audio/speech.ts`, `speechSynthesis`),
  as the speech mode says (accessibility core step 1).
- **One status region**: `src/components/Announcer/index.tsx`, `role="status"`, `aria-live="polite"`, present from load,
  never hidden, debounced. No routine `role="alert"`. Ask Bloop answers go through it (`useAnnounce`).

## Keys

All bound keys and where: `docs/accessibility/ACCESSIBILITY.md` → Keys, and `src/components/ExploreControls/use-map-keys.ts`
(map keys, only while the map has focus), `src/components/LowVision/use-apply-low-vision.ts` (Alt+L, anywhere).
Ask Bloop's push-to-talk key must avoid all of them and never fire in a text field.

## How things are set

| Spec action | Bloop's existing path |
|---|---|
| select a record | `commands.setTrack("ocean" \| "rain" \| "both")` (1 / 2 / 3) |
| set the needle / place | `commands.setCursor(latLon, { remember: true })`; places from `src/lib/geo` (gazetteer, `search`) |
| scrub time | Listen shows the latest frames; PageUp / PageDown hold a newer / older rain frame at the needle (`use-map-keys.ts`) |
| modes / pages | `commands.setMode(mode)` (explore = Listen, story = tour, thenNow, how, official, turntable, team, home) |
| value at a point | `readAt(fields, latLon)` (`src/lib/reading.ts`); spoken by `spokenReading()` |
| highest / lowest near here | `sonarTarget(grid, latLon)` (`src/lib/sonar.ts`) |
| two dates at a place | `compareAt(layer, name, latLon, a, b)` (`src/lib/compare.ts`; monthly heat, rain, water) |
| provenance and checks | `src/lib/provenance` (the "How we got this" facts); the provenance line (Shift+P) |

## Records

The live records are NASA EIC frames decoded to values: sea-surface temperature (`public/data/latest/sst.json` + `.bin`,
unit °C) and rain (IMERG, mm/h). Monthly records for Compare: GISTEMP (heat), GPCP (rain), GRACE (water). Each manifest
carries its unit, frame time and source; validation rows are in the provenance facts (e.g. "MUR check 0.31 °C").

## Conflicts (spec vs code), and the option that changes least

1. **Branch**: the spec asks for `feature/ask-bloop`; the team decided to work on `bloop-dev`, no new branches.
2. **Records in scope**: the spec suggests SVS 3912 SST and PM2.5; Bloop's records are the live ocean and rain frames
   and the monthly heat / rain / water layers. v1 uses those.
3. **Listen / Analyse modes and the Science↔Art dial do not exist**: `set_mode` and `set_dial` are skipped; pages are
   opened with `open_page` instead.
4. **No playback-rate control**: `slower` / `faster` skipped.
5. **`set_time` to a date**: Listen has no scrubber (latest frames only). v1 supports `next_frame` / `previous_frame`
   (the existing rain-frame hold); dates go through `compare_dates` (monthly records).
6. **No schema library** (no zod in the repo): slots are a typed union (`src/lib/ask-bloop/intents.ts`) checked by
   hand-written validators; no new dependency.
7. **Static export: no server routes.** The LLM fallback (§5.4) needs a separate serverless function; it is built but
   off (`ASK_BLOOP_LLM`), and with no `ASK_BLOOP_*` keys in `.env.local` it cannot run.
8. **Gazetteer**: reused (`src/lib/geo`: Natural Earth places and seas, Bangladesh's districts, English and Bangla,
   typo-tolerant search). Ask Bloop adds only a names-only alias list (`src/lib/ask-bloop/places.ts`: Chittagong →
   Chattogram, Dacca → Dhaka, …), each tested against `public/geo`. No coordinates are typed anywhere.

9. **"Lowest near here"** needs the sonar's own search for a minimum. The spec says not to refactor; the repo's rules
   say never to repeat logic. Least change: `src/lib/sonar.ts` now has `extremeNear(g, at, "highest" | "lowest")`,
   and `sonarTarget` is that function with "highest" (same cells, same rule, same tests passing).
10. **Pages vs modes**: Bangla calls Then vs Now "আগে বনাম এখন"; the parser accepts it (and "তখন বনাম এখন").

## Needs human input

- A Bangla speaker to check the Bangla examples and answer templates (they ship as drafts, listed in
  `docs/i18n/TO_TRANSLATE.md`).
- Ocean regions and named currents beyond Natural Earth's marine polygons (e.g. "Gulf Stream") are not defined; v1
  answers only for places the gazetteer has.
- An LLM provider and key, if the fallback is ever turned on.

## Baseline

Before Ask Bloop: unit tests 370/370 (step 7); the a11y + features + health browser suite passed in full at step 6
(340/340, Chromium + Firefox). The run covering steps 7 and 8 is recorded in `docs/accessibility/RESULTS.md`; Ask
Bloop's own runs (flag off and on) are added there when Phase 1 lands.
