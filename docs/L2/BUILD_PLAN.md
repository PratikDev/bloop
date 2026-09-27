# L2 Audio — Phased Build Plan

**Lane:** L2 (Audio) · **Version:** 27 Sep 2026 · **Freeze:** Tue 29 Sep, 12:00
**Parent docs:** [`../TEAM_BUILD_PLAN.md`](../TEAM_BUILD_PLAN.md) (what we build, Sections 9–11, 16) · [`AUDIO_RESEARCH.md`](AUDIO_RESEARCH.md) (how to build it; patterns A1–A8, ear tests T1–T7)

> **For any agent or teammate picking this up:** read Section 0 and Section 1 fully, then check the **Phase status** table below to see where work stands. Start at the first phase that is not ✅. Every phase lists its prerequisites; if one isn't met, stop and report it instead of working around it. **Do not start the next phase until the person who owns this lane says so, and do not commit unless asked** (project `AGENTS.md`).

## Phase status

Update this table when a phase's checklist is fully ticked.

| Phase | Name | Target | Status |
|---|---|---|---|
| 0 | Mapping spec and pure maths | Sun 27 | ✅ done (27 Sep) |
| 1 | Audio engine core and dev harness | Sun 27 | ✅ done (27 Sep); L3 requests B1/B3 + `caption.stopped` added after the L3 merge |
| 2 | Live voices (ocean, rain, snow) | Sun 27 | ✅ done (27 Sep) |
| 3 | Speech, ducking, legend, warm-up, earcons | Sun 27 | ✅ done (27 Sep) |
| 4 | Sequence player, sweep, motif, opening | Sun 27 night / Mon 28 AM | ✅ done (28 Sep) |
| 5 | Then vs Now and Comparison audio | Mon 28 | ⬜ not started |
| 6 | Storm time-lapse audio | Mon 28 | ⬜ not started |
| 7 | Optional voices (cut first) | Mon 28 PM, only if 0–6 done | ⬜ not started |
| 8 | Mix polish, narration clips, phone checks, freeze | Tue 29 AM | ⬜ not started |

Status key: ⬜ not started · 🟡 in progress · ✅ done (all checklist items ticked) · ✂️ cut

---

## Contents

0. Ground rules (read first)
1. Architecture and ownership
2. The public audio API (the contract with L3)
3. Phase 0 — Mapping spec and pure maths
4. Phase 1 — Audio engine core and dev harness
5. Phase 2 — Live voices
6. Phase 3 — Speech, ducking, legend, warm-up, earcons
7. Phase 4 — Sequence player, sweep, motif, opening
8. Phase 5 — Then vs Now and Comparison audio
9. Phase 6 — Storm time-lapse audio
10. Phase 7 — Optional voices
11. Phase 8 — Mix polish, narration, phone checks, freeze
12. Open decisions
13. What L2 needs from other lanes
14. Findings log

---

## 0. Ground rules (read first)

### 0.1 Project rules
- **No commits** unless the lane owner asks. **No moving to the next phase** unless the lane owner asks.
- **Next.js 16 is not the Next.js in your training data.** Before writing any route or component, read the matching guide in `node_modules/next/dist/docs/01-app/` (e.g. `01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`). Heed deprecation notices.
- Everything under `src/` is `.ts` / `.tsx`. No `.js` / `.jsx`.
- UI uses **shadcn/ui** (base-ui flavour; see `components.json`). Add primitives with `bun run shadd <name>`. `src/components/ui/` is shared with L3: tell L3 when you add one.
- Package manager is **bun** (`bun install`, `bun run dev`, `bun test`).

### 0.2 Audio engineering rules (from AUDIO_RESEARCH Part A; do not break)
1. **One `AudioContext`** for the whole app, created lazily inside a user gesture (A3).
2. **Never assign `AudioParam.value`** after anything has been scheduled on that param. Use `glideTo` / `setTargetAtTime` / linear ramps (A1).
3. **Never exponential-ramp to or from 0.** Fades to silence use `setTargetAtTime(0, …)` or linear ramps (A1).
4. **All timed sound goes through the one shared look-ahead scheduler** (A2). Never time sound with `setTimeout` chains, React state, `useEffect` intervals or `requestAnimationFrame`.
5. **Gain staging is the volume cap** (A5): the maximum gains of everything that can play at once must sum below 1.0 before the master. The compressor is only a safety net.
6. **Every sound fades in** (no instant full-level starts) and **Stop fades out in ~50 ms** (C5).
7. **One noise buffer** created at start-up, reused by every drop (A4). Shared filters, low node counts (A7).
8. Audio code **never fetches**. It receives numbers. Audio must never wait on the network.

### 0.3 Honesty rules (TEAM_BUILD_PLAN Section 16; apply to every caption and spoken string)
- No number is spoken or captioned unless it came in as an input (from L1's data via L3) or from `mapping.json`. **No hard-coded data numbers in L2 code.**
- Personal style/instrument choices may change **timbre only**, never the value → pitch/density rule.
- Mappings marked `designChoice: true` are ours and untested; they are presented as such.
- Teammate ear-test results are **settings**, not user findings. Never phrase them as "listeners found …".
- Silence means **no data** ("honest silence"), never "zero".

### 0.4 Definition of "testable"
Each phase is checked two ways:
- **Automated:** `bun run test` (`bun test`) over the pure (non-Web-Audio) functions. These must pass on any machine.
- **Manual:** the dev harness page (`/dev/audio`, built in Phase 1 and extended every phase) has one section per phase. The checklist at the end of each phase is run by a person with ears, on a laptop speaker and headphones (and a phone where stated).

A phase is ✅ only when **every** box in its checklist is ticked. If a box can't be ticked, write why in the findings log (Section 14) and leave the phase 🟡.

---

## 1. Architecture and ownership

### 1.1 Who owns what
| Thing | Owner | Note |
|---|---|---|
| `src/lib/audio/**` | **L2** | All sound. The public API (Section 2) is the only thing other lanes import. |
| `public/mapping.json` | **L2** | Single source of truth for every value → sound rule. L3's Mapping panel renders it. |
| `src/types/data-contract.ts` §10 (mapping types) | **L2** | The rest of the file mirrors L1's output; L3 maintains the data-file types. |
| `src/app/dev/audio/**` | **L2** | Dev harness. Not linked from the main UI. |
| `src/lib/data/**` (`valueAt()`, grid decoders, `bandMeans()`, `sweepPath()`, `openingPath()`) | **L3** | L2 does **not** depend on it. L2 takes plain numbers. |
| `src/lib/audio-adapter/**` (the "which engine" switch + L3's interim engine) | **L3** | The UI imports `audio` from here. Swapping to L2's engine is a one-line change there (Section 2.3). |
| Wiring cursor/keyboard → audio API | **L3** | Already done against the adapter; see Section 2.3. |
| Caption bar, Describe mode UI, i18n strings | **L3** | L2 emits caption *events* with keys + params; the keys are fixed in Section 2.4 (L3 already has the English text). |
| `src/app/globals.css` (theme), re-themed shadcn components (`dialog`, `sheet`, `slider`, `tabs`, `toggle`, `toggle-group`, `tooltip`) | **L3** | L2 never edits these; if the harness needs one of them, it uses L3's file. |
| `public/mapping.json`, `src/lib/audio/mapping.ts` | **L2** | L3 imports `MAPPING`, `ruleText`, `mapVoice`, `normalise`, `voiceSpec` — **keep these export names stable**. |
| `src/lib/then-now.ts` (`buildThenNowInput()`), `src/lib/data/context.ts` (`loadDemo()`, `loadGrace()`, `loadGistemp()`, `loadGpcp()`) | **L3** | Demo/GRACE JSON → `ThenNowInput`, with shape checks. The Phase 5 harness **imports these**; L2 doesn't write its own adapter (DRY; agreed with L3 on PR #4). |
| `src/components/ui/chart.tsx` + `recharts` dependency | **L3** | Added in L3's PR #4 for the Then vs Now and History charts. |
| shadcn `badge`, `card`, `label`, `select`, `switch` (`src/components/ui/`) | **L2** (added for the harness) | L3 was asked on PR #4 not to add these same files, and to reuse L2's once merged. |
| `package.json` `"test": "bun test"` script, `@types/bun` | **L2** | L3 was asked on PR #4 not to add a second `test` script. `bun.lock` conflicts are fixed by regenerating it with `bun install`. |

### 1.2 Folder layout (L2)
`TEAM_BUILD_PLAN` lists a single `lib/audio.ts`. We use a folder so the import path stays `@/lib/audio` but the code is testable in pieces:

```
src/lib/audio/
├─ index.ts             # the public API (Section 2) — the ONLY file other lanes import
├─ types.ts             # public types: TrackMode, VoiceId, PlayerHandle, AudioEvent, SweepPoint...
├─ mapping.ts           # PURE: loads + validates mapping.json; value → frequency / rate / band / pan
├─ context.ts           # startEngine(), getCtx(), getGraph(), getNoise(); the single AudioContext
├─ graph.ts             # buses: voice channels → sonification bus → master → compressor → meter → destination
├─ mixer-state.ts       # PURE: mute / solo / mute-all / volume rules
├─ mixer.ts             # applies mixer-state to the graph
├─ params.ts            # glideTo(), fadeTo(), blip(); safe ramps
├─ queue.ts             # PURE: time-ordered event queue behind the scheduler
├─ scheduler.ts         # the shared look-ahead scheduler driver (25 ms tick, 0.1 s look-ahead; events already inside the window are handed over at once)
├─ sources.ts           # registry of playing sources, so stopAll() can stop them
├─ stop.ts              # stopAll() and onStopAll() hooks
├─ events.ts            # PURE: event emitter for AudioEvent (captions, steps, state)
├─ stubs.ts             # typed placeholders for API functions of later phases (shrinks each phase)
├─ dev.ts               # dev-harness helpers (test tone, ticks, peak meter); not public API
├─ captions.ts          # emitCaption() + a throttled caption emitter (≤ 4/s, settles on the last value)
├─ live.ts              # Phase 2: setOcean / setRain / silenceLive → voices, no-data tick, value captions; holdLive/releaseLive; routeRain
├─ nodata.ts            # PURE: tick only on entering no data, ≥ 300 ms apart (live + sweep)
├─ voices/
│  ├─ common.ts         # voice output (panner → channel), panTo(), voicePeak()
│  ├─ ocean.ts          # sine + glide
│  ├─ drops.ts          # generic drop loop on the scheduler (rate, jitter, drop events) for rain and snow
│  ├─ drop-timing.ts    # PURE: jittered intervals with an honest average, no-burst rate changes
│  ├─ rate-timeline.ts  # PURE: which rate is in force at each drop's time (sequences schedule ahead)
│  ├─ rain.ts           # noise-burst drops (liquid) through one shared band-pass
│  ├─ snow.ts           # soft bells (frozen), one bell synthesised once into a buffer
│  ├─ heat.ts           # then-vs-now heat pitch + Anomaly-Choir detune (Phase 5)
│  ├─ bass.ts           # GRACE water bass with harmonics (Phase 5)
│  ├─ clicks.ts         # FIRMS percussion (Phase 7)
│  └─ pad.ts            # NDVI slow pad (Phase 7)
├─ earcons.ts           # no-data tick, satellite-whisper chime, extreme ping; playEarcon() emits caption.earcon.<id>
├─ duck.ts              # ducking with per-speaker release (speech now, narration clips in Phase 8)
├─ speech.ts            # speak(): local voice preferred, no-voice/failure → caption.noSpeech, 5 s start watchdog
├─ voice-pick.ts        # PURE: which speech voice for a language (never English for Bangla)
├─ players/
│  ├─ sequence.ts       # step player on the scheduler; one at a time; steps run at their exact audio time; data-point step events; borrows live voices, lifts the track gate
│  ├─ steps.ts          # PURE: evenly spaced step times
│  ├─ sweep.ts          # gist sweep playback ("sweep" step events, no-data ticks)
│  ├─ motif.ts          # sonic identity (4 notes on the earcon bus, null band = rest)
│  ├─ opening.ts        # "close your eyes" bed (fades via the voices' channel inputs, restored after)
│  ├─ legend.ts         # audio legend, short legend on mode change
│  ├─ warmup.ts         # ~22 s warm-up: volume check + legends + no-data tick
│  ├─ then-now.ts       # heat / monsoon / water (Phase 5)
│  ├─ compare.ts        # A then B, or A left / B right (Phase 5)
│  └─ timelapse.ts      # storm time-lapse (Phase 6)
└─ *.test.ts            # bun tests, colocated next to the PURE module they test (AGENTS.md)
```

Dev harness: `src/app/dev/audio/page.tsx` (server page) renders `src/components/AudioHarness/` (client component folder: one `*Section.tsx` per phase, component-specific hooks `use-*.ts` beside them). Run tests with `bun run test`.

**Rule:** modules marked PURE import nothing from the Web Audio API and nothing from React, so `bun test` can run them. Everything that touches `AudioContext` is tested by ear on the harness.

### 1.3 Audio graph (from AUDIO_RESEARCH A8, with concrete gains)

```
ocean  ─ osc → gain → panner ─┐
rain   ─ drops → bandpass → gain → panner ─┤
snow   ─ bells → gain → panner ─┤
heat   ─ osc(+detuned osc) → gain ─┤──► sonificationBus (duckable, 1.0 → 0.3 during speech)
bass   ─ osc + harmonics → gain ─┤                    │
clicks / pad (optional) ─┘                            ▼
earcons (no-data tick, chime, ping) ─────────────► earconBus (max 0.15) ─┐
narration clips (Web Audio) ─────────────────────► narrationBus (max 0.6)─┤
                                                                          ▼
                                                                master (0.8, user volume ≤ 1.0)
                                                                          ▼
                                                          compressor (−6 dB, 20:1, 3 ms, 250 ms)
                                                                          ▼
                                                                     destination
```

**Gain budget (starting values, tune by ear in Phase 8):** per voice max 0.25; at most 3 voices at once → 0.75. Earcons 0.15. Narration plays with the sonification bus ducked to 0.3 → 0.75 × 0.3 + 0.15 + 0.6 = 0.975 < 1.0. Browser speech (Web Speech) is outside Web Audio; we duck around it (A6).

---

## 2. The public audio API (the contract with L3)

Written in full in Phase 1 as typed stubs (`index.ts`), then implemented phase by phase. **Signatures only change with L3's agreement.** Inputs are plain numbers and arrays, never `ValueAtResult` or file shapes, so L2 has no dependency on `lib/data.ts`.

### 2.1 Types (`types.ts`)
```ts
export type TrackMode = "ocean" | "rain" | "both";
export type RainPhase = "dry" | "liquid" | "frozen" | "nodata"; // same meaning as data-contract.ts
export type VoiceId = "ocean" | "rain" | "snow" | "heat" | "monsoon" | "water" | "fires" | "vegetation"; // also VOICE_IDS
export const LIVE_VOICES = ["ocean", "rain", "snow"];                     // LiveVoiceId
export const TRACK_VOICES = { ocean: ["ocean"], rain: ["rain", "snow"], both: ["ocean", "rain", "snow"] };
export type EarconId = "nodata" | "whisper" | "ping";
export type Lang = "en" | "bn";

export interface SweepPoint {         // one step of a sweep / opening / time-lapse
  lon: number;                        // −180..180 (drives stereo)
  lat: number;                        // for captions only
  valueC: number | null;              // ocean °C; null = land / no data
  mmPerHour: number | null;           // rain; 0 = dry; null = no data
  phase: RainPhase;
}

export interface PlayerHandle {
  stop(): void;                       // ~50 ms fade, then done resolves
  readonly done: Promise<void>;       // resolves when finished or stopped
}

export type AudioEvent =
  | { kind: "caption"; key: string; params: Record<string, string | number> } // L3 turns key+params into EN/BN text
  | { kind: "step"; player: string; index: number; total: number; time: number } // playhead sync (chart, map cursor)
  | { kind: "state"; ready: boolean; playing: boolean; ducked: boolean }
  | { kind: "drop"; voice: "rain" | "snow"; time: number; gain: number; lon: number }; // one per drop/bell, for ripples (L3 B2)
```

**Step events count data points only** (L3 proposal B5, accepted on PR #4). L3's chart playheads map `index` straight to a data point, so:
- a step that plays a data point emits `{ kind: "step", player, index, total, time }` where `index` is the **data index** and `total` the number of data points;
- silent steps (the gap between windows, a part's tail, the pause between parts in `"all"`) emit **no** step event;
- `player` names are fixed: `"sweep"`, `"thenNow.heat"`, `"thenNow.monsoon"`, `"thenNow.water"` (also inside `playThenNow(…, "all")`), `"compare"`, `"compare.split"`, and whatever `playSeries` is given (L3 passes `"history"`).
- The indexes: heat and monsoon count 0–19 (window A, then B); water uses the month index into `ThenNowInput.water.months`; `compare` counts side A then side B (`total` = both lengths); `compare.split` uses the shared step index (`total` = the longer side).

### 2.2 Functions (`index.ts`)
```ts
// Lifecycle ─ Phase 1
ensureAudio(): Promise<void>;                 // MUST be called inside a click/keydown handler (Start button)
isAudioReady(): boolean;
stopAll(): void;                              // Esc: fades everything in ~50 ms, stops players + speech
setMasterVolume(v: number): void;             // 0..1, user-facing, capped by the gain budget

// Mixer ─ Phase 1
setVoiceMuted(id: VoiceId, muted: boolean): void;
setSolo(id: VoiceId | null): void;
setAllMuted(muted: boolean): void;            // "M" key
setVoiceVolume(id: VoiceId, v: number): void; // per-voice slider 0..1, under the voice cap (L3 B3)
getAnalyser(): AnalyserNode | null;           // output after the compressor, fftSize 2048; null before Start (L3 B1)

// Live exploration ─ Phase 2
setTrackMode(mode: TrackMode): void;          // "1/2/3" keys
setOcean(valueC: number | null, lon: number): void;
setRain(mmPerHour: number | null, phase: RainPhase, lon: number): void;
silenceLive(): void;                          // cursor left the map / exploration paused

// Speech, legend, earcons ─ Phase 3
speak(text: string, lang: Lang): Promise<void>;         // ducks the sonification bus
playClip(url: string): Promise<void>;                   // recorded narration through Web Audio (Phase 8)
playEarcon(id: EarconId, opts?: { lon?: number; params?: CaptionParams }): void; // emits caption.earcon.<id> with params
playLegend(voice: "ocean" | "rain" | "snow" | "heat" | "water"): PlayerHandle;
playWarmup(): PlayerHandle;                             // ~30 s: volume check + legends

// Sequences ─ Phase 4
playSweep(points: SweepPoint[], opts?: { stepMs?: number }): PlayerHandle;
playMotif(bandMeansC: (number | null)[]): PlayerHandle;   // 4 latitude bands, see Phase 4
playOpening(points: SweepPoint[], opts?: { durationSec?: number }): PlayerHandle;

// Then vs Now / Compare ─ Phase 5
playThenNow(input: ThenNowInput, part: "heat" | "monsoon" | "water" | "all"): PlayerHandle;
playCompare(a: CompareSide, b: CompareSide, mode: "sequential" | "split"): PlayerHandle;
playSeries(side: CompareSide, opts?: { stepMs?: number; player?: string }): PlayerHandle; // one series, e.g. Place History (L3 B6)

// Time-lapse ─ Phase 6
playTimelapse(frames: SweepPoint[], opts?: { fps?: number; loop?: boolean }): PlayerHandle;

// Events ─ Phase 1 (emitted from every later phase)
onAudioEvent(cb: (e: AudioEvent) => void): () => void;  // returns unsubscribe
```
`ThenNowInput` and `CompareSide` are defined in Phase 5.

### 2.3 How L3 wires it (already built; L3 owns this)
L3's UI imports `audio` from `src/lib/audio-adapter/index.ts`, whose `AudioEngine` interface (`audio-adapter/types.ts`) is this API plus L3's requests (`getAnalyser`, `setVoiceVolume`, drop events, earcon params). Until L2's voices land, the adapter points at L3's **interim engine** and the UI shows an "Interim sound engine" badge.

**The swap** (L3 does it once L2's Phases 2–4 are ✅; `docs/L3/integration.md` §1). Since L3's PR #4 the adapter wraps the engine in `withFallbacks()`, which fills L3's optional extras (`getAnalyser`, `setVoiceVolume`, `playSeries`) if they're missing. Verified to type-check against L2's current `src/lib/audio` on 27 Sep (after PR #4):
```ts
// src/lib/audio-adapter/index.ts
import * as l2 from "@/lib/audio";
export const audio: AudioEngine = withFallbacks(l2);   // must type-check against L3's L2AudioApi
export const IS_INTERIM_ENGINE = false;
```
L2 implements `playSeries` itself (Phase 5). L3's fallback (`playCompare` with an empty second side) sends step events as `"compare"`, not the `player` name, so the History playhead wouldn't move with it (reported on PR #4).
Afterwards L3's `audio-adapter/types.ts` should re-export L2's types instead of repeating them (DRY).

Keep this true: **every change to L2's public API must still satisfy L3's `AudioEngine`** (`bunx tsc --noEmit` with a one-line check file, as in the findings log).

### 2.4 Caption keys (fixed; L3 already has English text for these, Bangla pending in `docs/L3/bangla-strings.md`)
L2 emits exactly these keys and params. Adding a key means telling L3 so they add strings.

| Key | Params | Emitted by | Phase |
|---|---|---|---|
| `caption.stopped` | — | `stopAll()` | 1 ✅ |
| `caption.value` | `track` ("ocean" \| "rain"), `value` (°C or mm/h), `phase` (rain only) | live voices, at most every 250 ms | 2 |
| `caption.nodata` | `track` | entering a no-data area | 2 |
| `caption.noSpeech` | — | `speak()` when the browser has no speech | 3 |
| `caption.noBanglaVoice` | — | `speak(…, "bn")` with no Bangla voice | 3 |
| `caption.earcon.nodata` / `caption.earcon.whisper` / `caption.earcon.ping` | whatever the caller passes in `params` (whisper: `source`) | `playEarcon(id, { params })` | 3 |
| `caption.legend` | `voice`, `label` (legend label from `mapping.json`) | `playLegend()` | 3 |
| `caption.legendUnavailable` | `voice` | `playLegend()` for a voice with no legend yet (heat/water before Phase 5) | 3 |
| `caption.warmup.start` / `caption.warmup.end` | — | `playWarmup()` | 3 |
| `caption.sweep.start` / `caption.sweep.end` | — | `playSweep()` | 4 |
| `caption.motif` | — | `playMotif()` | 4 |
| `caption.opening.closeEyes` / `caption.opening.openEyes` | — | `playOpening()` | 4 |
| `caption.thenNow.caption` | `text` (the part's caption from `input.captions`, as-is) | `playThenNow()`, just before a part's first step | 5 |
| `caption.thenNow.window` | `label` (e.g. "1981–1990") | `playThenNow()`, first step of each window (heat, monsoon) | 5 |
| `caption.thenNow.end` | — | `playThenNow()`, when the last part ends | 5 |
| `caption.water.gap` | `from`, `to` ("YYYY-MM", first and last missing month of that stretch) | `playThenNow(…, "water")`, once per run of missing months | 5 |
| `caption.water.windowStart` / `caption.water.windowEnd` | `month` ("YYYY-MM") | `playThenNow(…, "water")`, at `windowA`/`windowB` edges | 5 |
| `caption.compare.side` | `label` (the side's label) | `playCompare(…, "sequential")` and `playSeries()`, first step of each side | 5 |
| `caption.compare.useHeadphones` | `a`, `b` (the two side labels) | `playCompare(…, "split")`, at start | 5 |

The Phase 5 keys above were fixed on L3's PR #4: L3's UI already has English text for them, so L2 uses these exact names and params. Keys still planned for Phases 6 and 8 (`caption.timelapse.start/peak/end`, `caption.clip`) are **not** in L3's strings yet: tell L3 before emitting them, and L3 tells L2 before relying on a new key.

**Track gate:** legend, warm-up and opening must be heard even when the current track mode would mute that voice (e.g. the rain legend in Ocean mode). Players that name their own voices lift the track-mode gate while they play; mute and solo still apply.

---

## 3. Phase 0 — Mapping spec and pure maths

**Goal:** `public/mapping.json` exists, is typed, validated, and every value → sound rule is a tested pure function. After this phase, nobody writes a formula anywhere else.

**Prerequisites:** none.

**Reads:** TEAM_BUILD_PLAN Section 10 (all rules), Section 11.5; AUDIO_RESEARCH B1, B2, B5, Section 10 (VoiceScale idea).

### 3.1 Tasks
1. **Replace §10 of `src/types/data-contract.ts`** (`VoiceRule`, `MappingSpec`) with structured types. Keep the comment header style of the file.
   ```ts
   export type InputScale = "linear" | "log";
   export type OutputScale = "linear" | "exponential";

   export interface ContinuousMapping {
     kind: "continuous";
     input: { unit: string; min: number; max: number; scale: InputScale };        // clamps to [min,max]
     output: { param: "frequency" | "dropsPerSecond" | "dropsPerStep" | "gain";
               unit: string; min: number; max: number; scale: OutputScale; round?: boolean };
   }
   export interface BandsMapping {
     kind: "bands";
     input: { unit: string; transform: "abs" | "none" };
     bands: { upTo: number | null; label: string; detuneCents: number; roughness: number }[]; // null = no upper bound
   }
   export interface RuntimeRangeMapping {
     kind: "runtimeRange";                        // range computed from the series being played
     input: { unit: string; range: "p5-p95" | "zero-to-max"; transform: "none" | "log1p" };
     output: { param: "frequency" | "gain"; unit: string; min: number; max: number; scale: OutputScale };
   }
   export type VoiceMapping = ContinuousMapping | BandsMapping | RuntimeRangeMapping;

   export interface VoiceSpec {
     id: string;                                  // matches VoiceId in lib/audio/types.ts, or an earcon id
     label: { en: string; bn: string };
     group: "live" | "thenNow" | "context" | "earcon";
     source: { dataset: string; svsId?: number };
     status: "verified" | "context" | "designOnly";   // badge in the Mapping panel
     mapping: VoiceMapping | null;                // null for earcons without a value rule
     silence: string;                             // human text: when this voice is silent and why
     sound: { timbre: string; attackMs: number; releaseMs: number; glideMs?: number; maxGain: number };
     pan: "longitude" | "center" | "compareSide";
     legend: { value: number; label: string }[];  // reference points played by playLegend
     designChoice: boolean;
     note?: string;                               // one line shown under the rule in the panel
   }

   export interface MappingSpec {
     version: string;
     global: {
       masterGain: number; voiceMaxGain: number; earconMaxGain: number; narrationMaxGain: number;
       maxConcurrentVoices: number;
       compressor: { thresholdDb: number; ratio: number; attackSec: number; releaseSec: number };
       duck: { level: number; attackSec: number; releaseSec: number };
       stopFadeMs: number;
       pan: { rule: "lon/180"; min: -1; max: 1 };
       loudnessCompensation: { refHz: number; exponent: number };   // gain × (refHz / f)^exponent; 0 = off (tuned in Phase 8)
       rules: string[];                           // human sentences for the panel
     };
     voices: VoiceSpec[];
   }
   ```
2. **Write `public/mapping.json`** with these voices (numbers from TEAM_BUILD_PLAN §10; do not invent others):

   | id | group | mapping | Numbers | designChoice | legend |
   |---|---|---|---|---|---|
   | `ocean` | live | continuous | °C −5..35 linear → 220..880 Hz exponential | false | 0, 10, 20, 30 °C |
   | `rain` | live | continuous | mm/h 0.1..50 **log** → 2..40 drops/s **linear** | false | 0.5, 5, 25 mm/h |
   | `snow` | live | continuous | same as rain | false | 0.5, 5 mm/h |
   | `heat` | thenNow | continuous | anomaly °C −2..3 linear → 220..880 Hz exponential | false | −1, 0, +1, +2 °C |
   | `heatDeviation` | thenNow | bands | abs(anomaly): <0.5 → 0 ¢ ; 0.5–1.0 → 8 ¢ ; 1.0–1.5 → 20 ¢ ; >1.5 → 35 ¢ + roughness | **true** | — |
   | `monsoon` | thenNow | continuous | mm/day 0..25 linear → 0..15 drops per step linear, `round: true` (= round(mm/day × 0.6)) | false | 5, 15 mm/day |
   | `water` | thenNow | runtimeRange | cm p5–p95 of the series → 80..320 Hz exponential | false | (from series) |
   | `fires` | context | runtimeRange | count, log1p, zero-to-max → click gain 0..1 linear | false | — |
   | `vegetation` | context | continuous | NDVI 0..1 → 150..600 Hz exponential | false | 0.2, 0.5, 0.8 |
   | `nodata` | earcon | null | soft short tick on *entering* a no-data area | **true** | — |
   | `whisper` | earcon | null | soft chime after a spoken value | false | — |
   | `ping` | earcon | null | short bright ping at the extreme point | false | — |
   | `motif` | earcon | null | 4 notes, each = a latitude band's mean SST through the `ocean` rule | false | — |

   The detune cents and roughness values in `heatDeviation`, and legend reference points, are **our starting values** (design choices) — mark them so in `note`.
   `heat` (maxGain 0.15) and `heatDeviation` (maxGain 0.10) share one voice budget (0.25), because the deviation is a second voice layered under heat.
   Global starting values: master 0.8, voice max 0.25, earcon max 0.15, narration max 0.6, max concurrent voices 3, compressor −6 dB / 20 / 0.003 / 0.25, duck 0.3 / 0.1 s / 0.15 s, stop fade 50 ms, loudness compensation exponent **0** (off until T3).
   Bangla labels: write English and leave `bn` as the English text prefixed `TODO:` if unsure; L3/L4 fill real Bangla.
3. **`src/lib/audio/mapping.ts` (PURE):**
   - Import the JSON statically (`resolveJsonModule` is on): `import raw from "../../../public/mapping.json"`. Static import means audio never waits on a fetch; L3's panel can import the same file.
   - `validateMapping(raw): MappingSpec` — throws with a clear message if a field is missing, `min >= max`, a log input has `min <= 0`, bands aren't ascending, or `maxGain > global.voiceMaxGain`.
   - `normalise(value, input): number | null` → t in [0,1] (clamped), `null` in → `null` out. Log scale: `(log10(v) − log10(min)) / (log10(max) − log10(min))`; values `<= 0` on a log input return `null` for rain rate (caller treats dry separately).
   - `mapContinuous(value, mapping): number | null` → output unit. Exponential: `min × (max/min)^t`. Linear: `min + (max−min)·t`. Apply `round` if set.
   - `bandFor(value, mapping): { index, label, detuneCents, roughness }`.
   - `runtimeRange(series: (number|null)[], range): { min, max }` — ignores nulls; p5–p95 uses linear-interpolated percentiles.
   - `panFor(lon): number` → `clamp(lon/180, −1, 1)`.
   - `loudnessGain(freqHz, comp): number` → `(refHz / f)^exponent`, 1 when exponent is 0.
   - `ruleParts(voice): RuleParts | null` — the rule's pieces (formatted min/max, units, scales, bands) so L3 can build the sentence in **either** language from the numbers.
   - `ruleText(voice): string` — the **English** rule sentence the Mapping panel shows, generated from the numbers (e.g. "Ocean temperature −5 to 35 °C → pitch 220 to 880 Hz (exponential: equal steps in value sound like equal musical steps)"). Bangla is built by L3 from `ruleParts()` (L3 owns i18n). Earcons without a rule return their `silence` text.
   - Also: `MAPPING` (the validated file), `voiceSpec(id)`, `mapVoice(id, value)`, `mapRuntime(value, mapping, range)`, `formatNumber(n)` (true minus sign).
4. **Tests `src/lib/audio/mapping.test.ts`** (colocated) (`bun test`) — see checklist for the exact cases. `@types/bun` is a dev dependency so `tsc` understands `bun:test`.

### 3.2 Out of scope
Any Web Audio code. Any UI (L3 renders the panel).

### 3.3 Deliverables checklist (Phase 0)
- [x] `src/types/data-contract.ts` §10 contains the structured types above; `bunx tsc --noEmit` passes.
- [x] `public/mapping.json` exists with all 13 entries in the table; opening `http://localhost:3000/mapping.json` in the browser shows valid JSON.
- [x] `validateMapping` accepts the real file and rejects 4 hand-made bad copies (min ≥ max; log min 0; unordered bands; maxGain too high) — each a test.
- [x] Test: ocean −5 °C → 220 Hz; 35 °C → 880 Hz; 15 °C → 440 Hz (t = 0.5 → 220 × 2); 50 °C clamps to 880; `null` → `null`.
- [x] Test: 1 °C step ≈ 3.5 % frequency change (e.g. 20 → 21 °C ratio ≈ 1.0353) — matches AUDIO_RESEARCH B2.
- [x] Test: rain 0.1 mm/h → 2 drops/s; 50 → 40; √(0.1×50) ≈ 2.236 → 21 drops/s (t = 0.5); 0 → `null`.
- [x] Test: heat anomaly −2 → 220 Hz; +3 → 880 Hz; −0.14 and +1.228 (the demo window means) give frequencies whose ratio is 4^(1.368/5) ≈ 1.46 (≈ 6.6 semitones, AUDIO_RESEARCH B2).
- [x] Test: heatDeviation bands: 0.3 → band 0; 0.5 → band 1; −1.2 → band 2 (abs); 2.0 → band 3.
- [x] Test: monsoon 15.104 mm/day → 9 drops per step; 13.706 → 8.
- [x] Test: `runtimeRange` ignores nulls; p5–p95 of 1..100 → ≈ 5.95..95.05.
- [x] Test: `panFor(90.4)` ≈ 0.502; `panFor(−180)` = −1; `panFor(200)` = 1.
- [x] Test: `ruleText(voiceSpec("ocean"))` contains "−5", "35", "220", "880".
- [x] `bun test` shows all mapping tests passing (paste the summary line into the findings log).
- [x] No formula for any voice exists outside `mapping.ts` (search the repo for `220 *`, `Math.pow(4`, `* 0.6`).

---

## 4. Phase 1 — Audio engine core and dev harness

**Goal:** a single, safe audio engine that starts on a click, routes through the gain budget and compressor, has a precise scheduler, stops cleanly, and can be poked from a dev page. No data voices yet — just test tones.

**Prerequisites:** Phase 0 ✅ (reads global values from `mapping.json`).

**Reads:** AUDIO_RESEARCH A1, A2, A3, A5, A8, C5. Next docs: `01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`.

### 4.1 Tasks
1. **`types.ts`** — all public types from Section 2.1 (and placeholders for `ThenNowInput`, `CompareSide`).
2. **`index.ts`** — every function in Section 2.2 exported. Functions of later phases are stubs that `console.warn("not implemented: <name> (Phase N)")` and return a resolved/no-op handle, so L3 can wire the full UI today.
3. **`context.ts`** — `ensureAudio()` exactly as AUDIO_RESEARCH A3 (lazy, `latencyHint: "interactive"`, `resume()` if suspended); `getCtx()` throws a clear error if called before `ensureAudio()`. On first creation, builds the graph (below) and the noise buffer (2 s white noise, mono, created once).
4. **`graph.ts`** — builds Section 1.3's buses. Each voice gets its own `GainNode` ("voice gain", max `voiceMaxGain`) and a `mute` `GainNode` (1 or 0) so mute/solo never fights value-driven gain changes. Solo = mute all other voices (earcons and narration are never muted by solo). `setAllMuted` ramps the **master** to 0/restore. All changes via `glideTo` (20 ms).
5. **`params.ts`** — `glideTo(param, target, glideSec)` (A1 code), `fadeTo(param, target, sec)` (linear ramp; safe for 0), `now()`.
6. **`scheduler.ts`** — split in two:
   - **PURE core** `createScheduleCore({ lookaheadSec })`: holds a queue of `{ time, run }`; `advance(currentTime)` returns and removes every event with `time < currentTime + lookaheadSec`, in time order. `clear(owner)` removes events belonging to a player.
   - **Driver**: `setInterval(tick, 25)` calling `advance(ctx.currentTime)` and running each event's `run(time)`. Look-ahead 0.1 s; `setLookahead(0.2)` exposed for phones (A2). The driver starts on `ensureAudio()` and never stops.
7. **`stopAll()`** — clears all scheduled events, cancels speech (`speechSynthesis.cancel()`), fades the sonification, earcon and narration buses to 0 over `stopFadeMs`, stops all live sources after the fade, emits `state`, then restores bus gains to their normal level (so the next play works) — restore happens silently because sources are stopped.
8. **`events.ts`** — `emit(e)`, `onAudioEvent(cb)`; emits `state` on ready/stop.
9. **`setMasterVolume(v)`** — master = `global.masterGain × clamp(v,0,1)`.
10. **Dev harness** `src/app/dev/audio/page.tsx` (server page) rendering `src/components/AudioHarness/` (client; read the Next docs first). Sections are added per phase. Phase 1 section:
    - **Start audio** button (first focusable element, `aria-label="Start audio"`), shows context state (`suspended`/`running`) and sample rate + `baseLatency`.
    - **Test tone** (440 Hz sine on the ocean voice gain, fades in over 20 ms), with a frequency slider (220–880) that uses `glideTo`.
    - **Scheduler test:** "Play 20 ticks at 100 ms" — schedules 20 short clicks at exact 100 ms intervals via the scheduler.
    - Master volume slider, Mute all toggle, Solo selector, **Stop** button, and Esc key → `stopAll()`.
    - A live log of `AudioEvent`s.
    - "Busy the main thread 60 ms / 300 ms" buttons (a blocking loop), with a readout of each tick's headroom (how early it reached Web Audio) and how many were late.
11. **Tests `scheduler.test.ts`** for the pure core.
12. Write **`docs/L2/AUDIO_API.md`**: the Section 2 API, one example per function, and the "call `ensureAudio` inside a gesture" warning. Send it to L3.

### 4.2 Out of scope
Data voices, speech, players. Loudness tuning.

### 4.3 Deliverables checklist (Phase 1)
- [x] `bun test` passes, including scheduler tests: events returned in time order; nothing beyond the look-ahead window returned; `clear(owner)` removes only that owner's events; an event scheduled in the past is returned on the next `advance` (not lost).
- [x] `bunx tsc --noEmit` and `bun run lint` pass.
- [x] `/dev/audio` loads with **no console errors** and **no sound** before Start is pressed; the console shows no "AudioContext was not allowed to start" warning.
- [x] Pressing Start (mouse **and** keyboard: Tab to it, press Enter) shows state `running`.
- [x] Test tone fades in with no click; dragging the frequency slider glides with no zipper noise or clicks (laptop speaker and headphones).
- [x] "20 ticks at 100 ms" sounds perfectly even and the readout shows **late 0**; pressing "Busy main thread 60 ms" (shorter than the 100 ms look-ahead) during it still gives **late 0**; "Busy main thread 300 ms" makes a few ticks late (**expected** — that's the look-ahead's limit, and why heavy UI work must stay off the audio path).
- [x] Stop button and Esc both silence everything within a fraction of a second, **with no click**; the test tone works again afterwards.
- [x] Mute all silences and restores; Solo on "ocean" keeps the tone, Solo on "rain" silences it.
- [x] Master volume at 100 % with the test tone never distorts; log shows nothing above 0 dBFS (optional: `AnalyserNode` peak readout on the harness).
- [x] Calling any later-phase function logs a clear "not implemented (Phase N)" warning and does not throw.
- [x] `docs/L2/AUDIO_API.md` exists and L3 has been told where it is.

---

## 5. Phase 2 — Live voices (ocean, rain, snow)

**Goal:** CORE features A2, A7 (audio side) and A8: the cursor's values sound instantly, correctly and cleanly; stereo by longitude; honest silence; a soft cue when entering no-data.

**Prerequisites:** Phase 1 ✅.

**Reads:** TEAM_BUILD_PLAN §10 (Ocean, Rain, Snow, Stereo, Silence); AUDIO_RESEARCH A1, A4, B3, C2.

### 5.1 Behaviour spec
| Input | Ocean voice | Rain / snow voice |
|---|---|---|
| `setOcean(28.4, 89.8)` | sine at `mapContinuous(28.4)` Hz; glide `glideMs` (30 ms) from the previous pitch; pan `panFor(89.8)` | — |
| `setOcean(null, lon)` | fade to 0 over release (≈ 80 ms) — **silence** | — |
| `setRain(5, "liquid", lon)` | — | rain voice: drops at `mapContinuous(5)` drops/s (mean); snow silent |
| `setRain(5, "frozen", lon)` | — | snow voice: bells at the same density rule; rain silent |
| `setRain(0, "dry", lon)` | — | both silent (dry is honest silence) |
| `setRain(null, "nodata", lon)` | — | both silent + no-data tick (see below) |
| `setTrackMode("ocean")` | active | muted via mode gain |
| `setTrackMode("rain")` | muted | active |
| `setTrackMode("both")` | active | active |

- **Ocean timbre:** sine; soft attack when coming out of silence (20 ms); per-frequency gain × `loudnessGain(f)` (exponent 0 for now).
- **Rain drops:** per AUDIO_RESEARCH A4 (`playDrop`): new `AudioBufferSourceNode` from the shared noise buffer, random start offset into the buffer, 2 ms linear attack, `setTargetAtTime(0, …, 0.015)` decay, stop at +0.1 s, into a **shared** band-pass (≈ 2.5 kHz, Q ≈ 1.2; tune by ear). Peak gain rises slightly with t: `peak = 0.6 + 0.4·t` (× voice gain). Drop timing is scheduled on the scheduler: next interval = `(1 / rate) × jitter`, where jitter is uniform in [0.7, 1.3] **and the mean stays 1/rate** (honest average; AUDIO_RESEARCH A4 design choice).
- **Snow bells:** 2–3 sine partials (e.g. 1×, 2.76×, 5.4× of ~1.2 kHz, quieter upper partials), 5 ms attack, ~400 ms exponential-style decay via `setTargetAtTime`. Same density rule and jitter as rain.
- **Rate changes:** when `setRain` changes the rate, the drop loop uses the new rate from the next scheduled drop (no restart, no burst).
- **No-data tick:** fired only on the **transition** into no-data (ocean `null` while mode includes ocean — i.e. entering land — or rain `nodata`), not on every call; one soft 15 ms click on the earcon bus at `earconMaxGain × 0.5`, panned to lon. Emit caption `{ key: "caption.nodata", params: { track } }`. Rate-limit: at most one tick per 300 ms.
- **Captions:** emit `caption.value` events **at most every 250 ms** during continuous movement (params `{ track, value, phase? }`, Section 2.4) so L3 can caption without flooding the screen reader.
- **Drop events (L3 B2):** every scheduled rain drop / snow bell emits `{ kind: "drop", voice, time, gain, lon }` when it is handed to Web Audio (`time` = when it will sound, `gain` = its peak 0..1 relative to the voice cap). L3 draws one ripple per drop. (Speaking the value on Enter is L3's call to `speak()` in Phase 3.)
- **Every voice call must be cheap** (no allocation beyond drops); cursor updates may arrive at 60 Hz.

### 5.2 Harness section (Phase 2)
- Track mode radio (Ocean / Rain / Both).
- Ocean: °C slider −5..35 (step 0.1), "No data" toggle, longitude slider −180..180.
- Rain: mm/h slider **log-scaled** 0.1..50, phase select (dry / liquid / frozen / nodata), longitude slider.
- "Jump" buttons: 0 °C ↔ 30 °C instant jumps (for T1); rain presets 2 / 5 / 10 / 20 / 40 drops/s (for T6; convert back to mm/h with the inverse of the mapping — add `inverseContinuous` to `mapping.ts` + a test).
- "Random walk" button: moves the ocean value and longitude randomly at 60 Hz for 10 s (simulates a mouse drag).
- A readout of the current output (Hz, drops/s, pan) computed with the same `mapping.ts` functions.

### 5.3 Ear tests in this phase (write pass rules in the findings log **before** running)
- **T1 Click test** (AUDIO_RESEARCH §7): 0 ↔ 30 °C jumps with 30 ms glide; 3/3 teammates hear no click, laptop and phone.
- **T4 Pitch step:** pairs of ocean tones 1 °C apart in random order (add a "T4 pair" button that plays two tones 600 ms each with 300 ms gap and hides which is higher); ≥ 8/10 correct per teammate.
- **T6 Rain rate + load:** 2, 5, 10, 20, 40 drops/s on a mid-range Android; no stutter at 40/s; teammates rank the 5 correctly. If stutter: raise look-ahead to 0.2 s and retest.

### 5.4 Deliverables checklist (Phase 2)
- [x] `bun test` passes (incl. `inverseContinuous` round-trip test).
- [x] Ocean slider 20 → 21 °C is audibly higher; readout shows the Hz from `mapContinuous`.
- [x] Ocean "No data" → silence within ~0.1 s, one soft tick, caption event in the log; toggling back fades the tone in without a click.
- [x] Longitude −180 → hard left, 0 → centre, +180 → hard right (headphones).
- [x] Every drop/bell emits one `drop` event (count in the harness log matches the drops heard; `time` is in the future when emitted, `gain` 0..1).
- [x] Rain presets 2 → 40 drops/s are clearly distinguishable; average rate over 10 s at 10 drops/s is 10 ± 1 (count in the harness log).
- [x] Rain "dry" is silent with **no** tick; "nodata" is silent **with** one tick; frozen switches from drops to bells at the same density.
- [x] Track mode Ocean / Rain / Both works; switching modes fades, never clicks.
- [x] Random walk for 10 s: no clicks, no crackle, no console errors, CPU stays reasonable (DevTools Performance shows no long tasks from audio code).
- [x] Caption events arrive at ≤ 4 per second during the random walk.
- [x] T1 result recorded in the findings log: PASS / FAIL + action taken.
- [x] T4 result recorded.
- [x] T6 result recorded (device model written down), look-ahead value decided.
- [x] Stop / Esc still silences everything, including drops already scheduled.

---

## 6. Phase 3 — Speech, ducking, legend, warm-up, earcons

**Goal:** CORE A4 (audio legend + 30 s warm-up) and A5 audio side (speech with ducking), plus C7 audio (satellite-whisper chime) and the extreme ping earcon.

**Prerequisites:** Phase 2 ✅.

**Reads:** AUDIO_RESEARCH A6, B2 (legend problem), C3, C4.

### 6.1 Tasks
1. **`speech.ts` — `speak(text, lang)`**: AUDIO_RESEARCH A6 code. Duck the sonification bus to `duck.level` on `start`, restore on `end` **and** `error` (glide times from `mapping.json`). Pick a voice: prefer a *local* voice (`voice.localService === true`) for `lang` (`en-US`/`en-GB` for en, `bn-BD`/`bn-IN` for bn); if the browser has no speech at all, **or has no voices installed** (common on Linux Chromium), **or the utterance errors or never starts within 5 s**, resolve and emit `caption.noSpeech` (an interruption by a newer `speak()` stays silent); if no Bangla voice exists, resolve immediately, emit caption `caption.noBanglaVoice` and do **not** fall back to reading Bangla with an English voice. Cancel any current utterance before speaking a new one (rapid Enter presses). Voices load asynchronously (`voiceschanged`); handle the empty list at start-up.
2. **Earcons (`earcons.ts`)** on the earcon bus, each ≤ 300 ms, panned when `lon` given:
   - `nodata` — (from Phase 2) soft tick.
   - `whisper` — soft two-note chime (e.g. 1.6 kHz → 2.1 kHz sines, 150 ms each, gentle decay). Played **after** a spoken value finishes (C7). `playEarcon(id, { lon, params })` emits `caption.earcon.<id>` with the caller's `params` (whisper: `{ source }`, the dataset/mission from metadata via L3 — L2 never hard-codes them).
   - `ping` — one short bright tone (≈ 2.5 kHz, 80 ms) at the extreme point's longitude (B5).
3. **Legend (`players/legend.ts`)** — `playLegend(voice)` plays each `legend` entry of that voice from `mapping.json` in turn: caption `caption.legend` `{ voice, label }` → 1.2 s of that sound → 0.4 s gap → next. Labels come from `mapping.json`, not code. A voice with no legend yet (heat/water before Phase 5; water's legend is built from the series range) emits `caption.legendUnavailable` `{ voice }`. Lifts the track gate (Section 2.4). Uses the scheduler (it's the first sequence; Phase 4 generalises it — fine to refactor then).
4. **Warm-up (`playWarmup`)** — ~22 s (3 s volume check + 9 legend points × 1.6 s + gaps + tick). **Decision (27 Sep): keep 22 s**, although TEAM_BUILD_PLAN A4 says "30 s" (less waiting before exploring), bracketed by `caption.warmup.start` / `caption.warmup.end` and lifting the track gate: (1) 3 s steady mid-level tone for the volume check (A5), (2) ocean legend, (3) rain legend, (4) snow legend, (5) 1 s silence + one no-data tick (with its `caption.earcon.nodata`). Stoppable any time (Esc).
5. **Legend replay on switch (AUDIO_RESEARCH C3):** export `playLegendForMode(mode)`; L3 calls it when the track mode or app mode changes. Make it short (first and last legend points only, ≈ 3 s) so it doesn't annoy; full legend stays on "L".

### 6.2 Harness section (Phase 3)
- Text box + language select + **Speak** (with ocean + rain playing underneath).
- "Speak 10 random values" button (for T2): speaks "28.4 degrees" etc. over ocean + rain, with a ducking on/off toggle.
- Buttons: each earcon; Legend per voice; Warm-up; Legend-for-mode.
- A list of available speech voices (`name`, `lang`, `localService`) — used to answer "Bangla voice on Android?" (AUDIO_RESEARCH §12).

### 6.3 Deliverables checklist (Phase 3)
- [x] Speak "Twenty-eight point four degrees" over ocean + rain: the sound audibly dips during speech and returns smoothly after (no jump).
- [x] Interrupting speech (Speak twice quickly, or Esc) always restores the bus — never stays ducked (check with the bus gain readout).
- [x] **T2** run with the pass rule written first (10/10 values understood with ducking); result in findings log; duck level adjusted if needed and written back to `mapping.json`.
- [x] Bangla: phone voice lists **skipped by decision (27 Sep)** — recorded clips (Phase 8) are the Bangla audio default; with no Bangla voice, `speak(…, "bn")` stays silent and emits `caption.noBanglaVoice`.
- [x] Ocean legend plays 0, 10, 20, 30 °C in rising pitch with a caption each; rain legend light → heavy; snow legend bells.
- [x] Warm-up runs ~22 s end-to-end (decided 27 Sep), Esc stops it at any point without a click.
- [x] Whisper chime and ping are clearly different from each other and from drops/bells; neither is startling at full master volume.
- [x] No number in any caption or legend string comes from L2 code (grep `players/legend.ts`, `earcons.ts`, `speech.ts` for digits used in captions).

---

## 7. Phase 4 — Sequence player, sweep, motif, opening

**Goal:** one generic, scheduler-driven step player with playhead events; on top of it the gist sweep (A6), sonic identity (C9) and the "close your eyes" opening bed (C1).

**Prerequisites:** Phase 3 ✅. For real (not harness) input: L3's sweep path and latitude-band means (Section 13).

### 7.1 Tasks
1. **`players/sequence.ts`** — `createSequence({ id, steps, stepMs, onStep(i, time) })` returns a `PlayerHandle`.
   - Schedules step `i` at `start + i × stepMs` through the scheduler (owner = this player), calling `onStep(i, audioTime)` inside the scheduler callback so parameter changes land **exactly** on the audio clock.
   - Emits `{ kind: "step", player: id, index, total, time }` for playhead sync, **only for steps that play a data point** (Section 2.1: steps can be marked silent, and `index` / `total` count data points, not steps). **As agreed with L3 (AUDIO_API.md "Step events")**, the event is emitted when the step is handed to Web Audio, up to the look-ahead early, carrying `time`; the UI shows it when the audio clock reaches `time` (same as `drop`). No `setTimeout` in the engine.
   - `stop()` clears only this player's events, fades its voices, resolves `done`. Starting a new sequence of the same kind stops the previous one.
   - Voices need an **"at time t" setter**: extend ocean/rain/snow with `setAt(value, lon, time)` (param automation at `time` instead of `now`). The rain drop loop must look up the rate *in force at each drop's time* (keep a small time-ordered list of rate changes).
2. **Sweep (`playSweep(points, { stepMs = 80 })`)** — each point drives ocean and/or rain (per track mode) at its time; entering no-data plays the tick; `caption.sweep.start` / `caption.sweep.end`; emits step events. The path is L3's `sweepPath()` (rings outward from **Chattogram**, 22.36 N 91.78 E, `SWEEP_CENTER` in `lib/data/places.ts`, from `valueAt()`; team decision 27 Sep, was Dhaka; L2 is unaffected because it only plays the points it's given); the harness uses a synthetic path.
3. **Motif (`playMotif(bandMeansC)`)** — 4 notes, 350 ms each, 50 ms gaps, soft bell-sine timbre, pitch of each = `mapContinuous(bandMean)` with the **ocean** rule; `null` band → a rest (silence). Bands are fixed (design choice, record in `mapping.json` `motif.note`): **60 S–30 S, 30 S–0, 0–30 N, 30 N–60 N**, played south → north. Emits `caption.motif`. L3 computes the band means with `bandMeans()` (area-weighted, same four bands). Played at app start (after warm-up) and on track switch (L3 triggers).
4. **Opening (`playOpening(points, { durationSec = 10 })`)** — C1: ~10 s bed of real ocean + rain sound: steps through the given points (L3's `openingPath()`, a path over the Bay of Bengal) with long glides, ocean + rain both on (lifts the track gate), fades in over 2 s and out over 1.5 s; emits caption `caption.opening.closeEyes` at start and `caption.opening.openEyes` at the end (L3/L4 own the text and the fade-in of the frame). Skip = `stop()`.

### 7.2 Harness section (Phase 4)
- "Synthetic sweep": 60 points, ocean values from 30 °C falling to 5 °C, lon −180 → 180, every 15th point no-data; step-ms slider (40–200).
- "Motif" with editable 4 band values (and a "null" checkbox per band).
- "Opening" using a synthetic 20-point path.
- A progress bar driven **only** by `step` events (proves playhead sync).

### 7.3 Deliverables checklist (Phase 4)
- [x] `bun test` passes — add tests for the pure step-time maths (`stepTimes(start, n, stepMs)`) and the rate-at-time lookup for drops.
- [x] Synthetic sweep: pitch falls smoothly, pans left → right, ticks exactly at the no-data points; progress bar moves in step with the sound (no visible lag or lead > ~50 ms).
- [x] Busy main thread 60 ms (shorter than the look-ahead) during a sweep: **audio** stays even (the bar may stutter; that's allowed).
- [x] Starting a sweep while one plays replaces it cleanly; Esc stops it without a click.
- [x] Motif plays 4 notes in the right order (south → north) with correct relative pitches for hand-typed values (e.g. 10, 25, 28, 15 °C → low, high, highest, mid); a null band is a rest.
- [x] Opening plays ~10 s, fades in and out, emits both captions at the right moments; Skip stops it.
- [x] Caption and step events visible in the harness log for every player.

---

## 8. Phase 5 — Then vs Now and Comparison audio

**Goal:** the killer demo (TEAM_BUILD_PLAN §11.5) as sound: heat pitch + Anomaly-Choir detune, monsoon drop density, GRACE water bass with gap silence; plus the Comparison Player (B1) and playhead events for L3's scrubbing chart (H3).

**Prerequisites:** Phase 4 ✅. Decision D1 (Section 12) confirmed.

**Reads:** TEAM_BUILD_PLAN §10 (Heat, Heat deviation, Monsoon, Water), §11.5, §16 (exact caption wording); AUDIO_RESEARCH B2, B3, B4; `src/types/data-contract.ts` §5 and §9 (the real demo + GRACE shapes).

### 8.1 Input types (add to `types.ts`)
Plain arrays — L3 fills them from `demo/dhaka_then_now.json` and `context/grace.json`.
```ts
export interface WindowSeries { label: string; years: number[]; values: number[] } // one value per year
export interface ThenNowInput {
  heat:    { A: WindowSeries; B: WindowSeries };          // GISTEMP Apr–May anomalies, °C
  monsoon: { A: WindowSeries; B: WindowSeries };          // GPCP Jun–Sep, mm/day
  water:   { months: string[]; cm: (number | null)[]; windowA: [string, string]; windowB: [string, string] }; // GRACE Bangladesh
  captions: { heat: string; monsoon: string; water: string }; // the exact Section 16 captions from the JSON
}
export interface CompareSide { label: string; values: (number | null)[]; voice: "heat" | "monsoon" | "water" }
```

### 8.2 Voices
- **`voices/heat.ts`** — two sines: main at `mapContinuous(anomaly, heat)`; second voice detuned by the band's `detuneCents` from `bandFor(anomaly, heatDeviation)` (band 0 → second voice silent); band 3 adds roughness = amplitude modulation at ~30 Hz, depth from `roughness`. **Timbre must differ from the ocean voice** (AUDIO_RESEARCH B2 legend problem): e.g. triangle wave + low-pass, so "same pitch = same °C" confusion can't happen.
- **Monsoon** — reuses the rain drop generator: each step plays exactly `mapContinuous(mm/day, monsoon)` drops spread evenly (with small jitter) across the step.
- **`voices/bass.ts`** — sine at `mapContinuous` with `runtimeRange(series, "p5-p95")` computed over the **whole** GRACE series being played; add 2nd and 3rd harmonics (gain 0.5, 0.25) so pitch survives phone speakers (AUDIO_RESEARCH B3; test T5); `null` month → fade to silence and emit caption `caption.water.gap` `{ from, to }` once per run of missing months (the record has 35 missing months in 19 stretches, not only Jul 2017–May 2018; L3 proposal A4).
- **Routing:** the heat, monsoon and water voices go through the mixer like the live voices (their own channels), so mute, solo and mute-all (M) also silence Then vs Now and History. L3's interim engine skips the mixer for these (reported on PR #4); don't copy that.
- **Stopping:** `stop()` / `stopAll()` must also cancel monsoon drops already scheduled for the rest of the current step. A whole step's drops are scheduled at once (up to 400 ms ahead), which is more than the scheduler's 100 ms look-ahead. L3's interim engine lets these play after Stop (reported on PR #4); register them in `sources.ts` so they can be cut.

### 8.3 Players (`players/then-now.ts`)
- `playThenNow(input, "heat")`: caption `input.captions.heat` → window A (10 steps, 400 ms each, label caption at start "1981–1990") → 800 ms silence → window B (10 steps) → end. Each step = one year: heat pitch + detune band.
- `"monsoon"`: same structure, 10 + 10 yearly steps, drops per step from the mapping (see decision D1).
- `"water"`: the **full monthly record** (292 months, 60 ms/step ≈ 17.5 s) so the fall and the Jul 2017–May 2018 gap are both heard; captions at windowA start/end and windowB start/end; gap = silence + caption (decision D2).
- `"all"`: heat → monsoon → water with 1 s gaps; max 1 voice at a time (keeps within the 3-voice limit trivially).
- Captions: `caption.thenNow.caption { text }` before each part (the part's text from `input.captions`), `caption.thenNow.window { label }` at the start of each window, water edge captions, and `caption.thenNow.end` at the end (Section 2.4).
- Every **data** step emits a `step` event (`player: "thenNow.heat"` / `"thenNow.monsoon"` / `"thenNow.water"`, also inside `"all"`) for L3's chart playhead. Silent gaps emit none; `index` is the data index (Section 2.1).
- **Variability → timbre and seasonality → rhythm are NOT in this phase** (Phase 7, optional).

### 8.4 Comparison Player (`players/compare.ts`)
- `mode: "sequential"`: side A, 800 ms gap, side B — same voice, same step length; `caption.compare.side { label }` at the start of each side. Step events `player: "compare"`, `index` counts A then B.
- `mode: "split"`: A and B **at the same time**, A panned hard left, B hard right; `caption.compare.useHeadphones { a, b }` at start. Step events `player: "compare.split"`, one per step.
- **`playSeries(side, { stepMs, player })`** (L3 B6, accepted on PR #4; replaces the Phase 7 `playHistory` idea): one side only, steps of `stepMs` (default heat and monsoon 150 ms, water 60 ms), `caption.compare.side { label }` at start, step events under `player` (default `"series"`; L3's Place History passes `"history"`). It's the same code path as one side of the sequential compare.
- Disclosure text (windows, datasets, numbers) is L3's panel, sourced from the JSON — L2 only emits captions with labels.

### 8.5 Harness section (Phase 5)
- A "Load real demo" button that loads the demo and GRACE files with **L3's** `loadDemo()` / `loadGrace()` (`@/lib/data`) and builds `ThenNowInput` with **L3's** `buildThenNowInput()` (`@/lib/then-now`). Don't write a second adapter (DRY; agreed on PR #4). The harness is the only L2 code that imports from `lib/data`; the engine itself still takes plain arrays.
- Buttons: Heat / Monsoon / Water / All; Compare sequential / split (heat A vs B); Series (one decade of Dhaka heat through `playSeries`, loaded with L3's `loadGistemp()`).
- A simple progress bar per player from `step` events, labelled with the current year/month.

### 8.6 Ear tests in this phase
- **T5 Phone bass:** GRACE bass 80–320 Hz on a phone speaker with and without harmonics; pass = pitch movement audible on the phone with harmonics.
- **T3 Loudness balance** can start here (ocean 220/440/880 Hz) — finish in Phase 8.

### 8.7 Deliverables checklist (Phase 5)
- [ ] `bun test` passes — tests: `runtimeRange` over the real GRACE Bangladesh series ignores its 35 nulls; heat A mean (−0.14) and B mean (1.228) map to pitches ≈ 6.6 semitones apart; monsoon step drop counts for the real A/B means are 9 and 8.
- [ ] Heat: window B is clearly higher than window A on laptop speaker; years with |anomaly| > 1.5 sound audibly rough/detuned; heat timbre is clearly **not** the ocean timbre.
- [ ] Monsoon: B is **not** denser than A (it's slightly sparser) — matches "not wetter".
- [ ] Water: the bass sinks over the record; the Jul 2017–May 2018 gap is silent with its caption; after the gap it resumes smoothly.
- [ ] All captions come from `input.captions` (i.e. the JSON), character-for-character equal to TEAM_BUILD_PLAN §16 (check the harness log against §16).
- [ ] "All" plays heat → monsoon → water with gaps; Esc stops it mid-way without a click.
- [ ] Compare sequential and split both work; split is clearly left/right on headphones.
- [ ] Step events drive the progress bar in time with the sound for all three parts; silent gaps emit none, and `index` / `total` count data points (heat 0–19, water = month index).
- [ ] Every caption key and param matches Section 2.4 exactly (L3 already shows text for them).
- [ ] `playSeries` plays one side and its step events carry the given `player` name (`"history"`).
- [ ] Mute-all (M), mute and solo also silence the Then vs Now voices; Stop / Esc during monsoon leaves no drops playing afterwards.
- [ ] The adapter swap still type-checks: a check file with `withFallbacks(l2)` from `@/lib/audio-adapter` passes `bunx tsc --noEmit`.
- [ ] T5 recorded in the findings log (phone model), harmonic gains decided.

---

## 9. Phase 6 — Storm time-lapse audio

**Goal:** C4 audio: the last ~48 half-hourly IMERG frames play at ~2 frames/s; the sound follows the rain at the cursor (which L3 moves to the heaviest nearby cell).

**Prerequisites:** Phase 5 ✅ (reuses sequence player + rain/snow voices). Real input needs L3's time-lapse decoder (Section 13).

### 9.1 Tasks
1. `playTimelapse(frames, { fps = 2 })`: one step per frame (500 ms at 2 fps); each step sets rain/snow at that frame's `mmPerHour` / `phase` / `lon` with the same rules as live rain; `nodata` frames → silence + tick (once per run of no-data); dry → silence.
2. Step events carry the frame index; caption per step is **not** emitted (too chatty) — emit `caption.timelapse.start` with `{ count }`, `caption.timelapse.peak` when the heaviest frame plays (value from input), and `caption.timelapse.end`. L3 shows the frame time from its own index.
3. Frame changes glide the drop rate (no restart bursts between frames).
4. Loop option `loop: boolean` for the kiosk/video recording (default false).

### 9.2 Harness section (Phase 6)
- "Synthetic storm": 48 frames rising from dry to 40 mm/h and back, 3 frames of frozen in the middle, 2 no-data frames; fps selector (1 / 2 / 4); progress bar.

### 9.3 Deliverables checklist (Phase 6)
- [ ] Synthetic storm: density rises and falls smoothly; frozen frames switch to bells and back; no-data frames are silent with a tick; peak caption at the right frame.
- [ ] 48 frames at 2 fps take 24 s ± 0.2 s (log start/end audio times).
- [ ] No drop bursts at frame boundaries (listen at 4 fps too).
- [ ] Loop mode restarts seamlessly; Esc stops it.
- [ ] Runs on the mid-range Android without stutter (same device as T6).

---

## 10. Phase 7 — Optional voices (cut first)

**Only start if Phases 0–6 are ✅ and it's before Mon 28, 18:00.** TEAM_BUILD_PLAN §17 cuts B3 (FIRMS) first. Each item below is independent; tick the ones built, mark the rest ✂️.

| Item | Spec | Test |
|---|---|---|
| **FIRMS percussion (B3)** `voices/clicks.ts` + `playFires(caseA, caseB)` | One day per step (61 steps, 120 ms); click gain = `mapContinuous` of `log1p(count)` over `zero-to-max` of **both** cases together (so A and B share a scale); MODIS vs MODIS only; caption "Example years, same sensor (MODIS)" from the JSON-supplied caption | CHT 2003 vs 2023 audibly similar; Punjab similar; never compare MODIS to VIIRS |
| **NDVI pad** `voices/pad.ts` | Slow pad (2 detuned saw → low-pass 800 Hz, 300 ms attack), 150–600 Hz per `vegetation` rule, one 16-day composite per step (150 ms) | Sundarbans A vs B ~same; Dhaka control lowest |
| **Variability → timbre (H2)** | Window `spread` → low-pass cutoff 800–3000 Hz on heat/monsoon voices; `designChoice: true` in mapping.json | B window (bigger spread) sounds slightly brighter; caption says "design choice" |
| **Seasonality → rhythm (H2)** | For monthly Place History playback (`playSeries`, Phase 5): accent (+3 dB, 20 ms) on the climatological peak month; `designChoice: true` | Accent audible every 12 steps |

Place History audio is no longer a Phase 7 item: it's `playSeries()` in Phase 5 (L3 B6, agreed on PR #4). L3's History panel plays one metric at a time, so the planned two-voice `playHistory(months, heatAnoms, rainMmDay)` is dropped.

**Deliverables checklist (Phase 7):** one line per built item: "- [ ] <item>: test in the table passes; entry added/updated in `mapping.json`; `designChoice` set correctly".

---

## 11. Phase 8 — Mix polish, narration clips, phone checks, freeze

**Goal:** everything sounds balanced and safe on real devices, recorded narration plays through the mix, and L2 is frozen by **Tue 12:00**.

**Prerequisites:** Phases 0–6 ✅ (7 optional).

### 11.1 Tasks
1. **T3 Loudness balance** — ocean at 220 / 440 / 880 Hz, same gain, headphones + phone; adjust `loudnessCompensation.exponent` in `mapping.json` until teammates rate them equally loud; apply the same to heat. Record the value.
2. **T7 How many voices** — 1, 2, 3, 4 voices together (ocean, rain, water, heat); "which are playing?"; pass ≥ 8/10 at the chosen default. Set `maxConcurrentVoices` from the result.
3. **`playClip(url)`** — fetch + `decodeAudioData` **ahead of time** (`preloadClips(urls)` called by L3 at start-up — the only place L2 touches the network, and never during playback); plays through the narration bus with the sonification bus ducked (same duck values); resolves on end; Esc stops it. Emits caption `{ key: "caption.clip", params: { url } }` (L3 maps url → subtitle).
4. **Screen-off / background check** — on Android, start a sweep or then-vs-now, turn the screen off. Record whether audio continues evenly. Background timer throttling may slow the 25 ms scheduler tick (**unverified**; audible tabs are reportedly exempt). If it stutters: raise look-ahead to 1 s while `document.hidden` and back on return; retest.
5. **Mix pass** with L4 on the actual video segments: opening, then-vs-now, time-lapse, story. Adjust only gains/timbres in `mapping.json` — no rule changes.
6. **Clean-up:** remove every `console.warn("not implemented")` stub that's now implemented; stubs left for cut features say "cut for Video 1" instead. Remove debug logs.
7. **Freeze note:** at 12:00 update the status table, write the final settings (duck, look-ahead, loudness exponent, max voices, harmonic gains) into the findings log.

### 11.2 Deliverables checklist (Phase 8)
- [ ] T3 recorded; exponent set in `mapping.json`.
- [ ] T7 recorded; `maxConcurrentVoices` set.
- [ ] A recorded EN clip and a BN clip play via `playClip`, duck the sonification, and stop on Esc.
- [ ] Screen-off test recorded (device, result, fix if any).
- [ ] Full app run on laptop speaker, headphones and a mid-range Android: no clicks, no distortion at max volume, nothing startling.
- [ ] The CORE acceptance items that touch audio (TEAM_BUILD_PLAN §13) all pass: sound responds instantly; no clicks or pops; volume capped; keyboard-only run works (with L3).
- [ ] `bun test`, `bunx tsc --noEmit`, `bun run lint` all pass; no console errors in Chrome and Edge.
- [ ] No hard-coded data numbers in `src/lib/audio/**` (grep for digits in caption params and strings).
- [ ] Status table updated; freeze settings written to the findings log.

---

## 12. Open decisions

Resolve with the lane owner before the phase that needs it. Record the answer here.

| ID | Question | Needed by | Default if no answer |
|---|---|---|---|
| D1 | Monsoon step = one **year** (Jun–Sep mean, 10 per window, matches the on-screen numbers) or one **month** (TEAM_BUILD_PLAN §10's "150 ms per month")? | Phase 5 | **One year**, 400 ms/step; update TEAM_BUILD_PLAN §10 text. |
| D2 | Water plays the **full record** (hears the fall and the gap) or only windows A and B (no gap inside them)? | Phase 5 | **Full record**, 60 ms/month, windows marked by captions. |
| D3 | Who computes latitude-band means (motif) and "max in view" (ping)? | Phase 4 | **Resolved (27 Sep):** L3 — `bandMeans()` is in `lib/data/summaries.ts`. `maxInView()` for the ping is still to add (L3). |
| D4 | Sweep step length and path density (points per ring). | Phase 4 | Path: **resolved**, L3's `sweepPath()` (`SWEEP_RINGS` in `lib/data/places.ts`). Step: 80 ms default in L2. |
| D5 | Heat-deviation detune cents per band (8 / 20 / 35) and roughness. | Phase 5 | Starting values; tune by ear, stay `designChoice: true`. |
| D6 | Snow bell partials and rain band-pass centre. | Phase 2 | Values in Phase 2 spec; tune by ear. |
| D7 | Step events for silent gaps (L3 B5). | Phase 4 | **Resolved (27 Sep, PR #4):** data points only; silent steps emit none (Section 2.1). |
| D8 | Place History audio: L2's `playHistory()` or L3's `playSeries()` (B6)? | Phase 5 | **Resolved (27 Sep, PR #4):** `playSeries(side, { stepMs, player })` in Phase 5; `playHistory` dropped. |
| D9 | Caption keys and params for Then vs Now and Compare. | Phase 5 | **Resolved (27 Sep, PR #4):** L3's existing keys (Section 2.4). |
| D10 | Then vs Now data adapter for the harness. | Phase 5 | **Resolved (27 Sep, PR #4):** reuse L3's `buildThenNowInput()` / `loadDemo()` / `loadGrace()`; no `adapters.ts`. |

---

## 13. What L2 needs from other lanes

| From | What | Needed by | Blocking? |
|---|---|---|---|
| L3 | Wiring of the API into the real UI (Start button first in focus order, cursor → `setOcean`/`setRain`, keys → mode/mute/legend/Esc, captions from events) | Phase 2 onward | No — harness covers L2 testing |
| L3 | Sweep path as `SweepPoint[]` from `valueAt()` | Phase 4 (real use) | ✅ `sweepPath()`, `openingPath()` exist |
| L3 | `bandMeans()` ✅ / `maxInView()` ⏳ (D3) | Phase 4 (real use) | No |
| L3 | `buildThenNowInput()`, `loadDemo()`, `loadGrace()`, `loadGistemp()` for the Phase 5 harness (D10) | Phase 5 (harness) | Yes for the "Load real demo" button: they're in L3's PR #4, so it must be on `main` first (then bring this branch up to date) |
| L3 | Update `docs/L3/` (contract-proposals, integration, PROGRESS) with the PR #4 decisions: B5 and B6 accepted, the Section 2.4 caption keys, and the shared files in Section 1.1 | Phase 5 | No; asked on PR #4 |
| L3 | Time-lapse frames as `SweepPoint[]` at the cursor (decoded from `sequence/*.u8.gz`) | Phase 6 (real use) | No |
| L3 | Caption text for every caption key L2 emits (EN + BN) | Phase 3 onward | ✅ English for the Section 2.4 keys (Bangla pending); new keys need L3 first |
| L4 | Recorded narration clips (EN, BN) and their subtitles | Phase 8 | Only for `playClip` test |
| L1 | Shapes stay frozen (already agreed) | — | — |

The caption key list lives in Section 2.4 here and in `docs/L2/AUDIO_API.md`; keep both in step.

---

## 14. Findings log

Record every ear test and every tuned value in **`docs/L2/audio_findings.md`** using the AUDIO_RESEARCH §9 template:

| Date | Question | What we found | Source or test ID | Confidence | Decision for our app | Owner |
|---|---|---|---|---|---|---|

Rules: write the **pass rule before running** a test; record failures too; ear-test results are settings, not user findings.
