# Audio API (for L3 and anyone wiring sound into the UI)

**Owner:** L2 · **Import from:** `@/lib/audio` only (never from its internal files)
**Status:** the full API exists with its final signatures, including `playSeries` (Phase 5), and it satisfies L3's `AudioEngine` interface on `main` **and** PR #4's `withFallbacks(l2)` (checked 28 Sep) (`src/lib/audio-adapter/types.ts`, including L3's requests B1–B3 and earcon params) — checked with `tsc` on 27 Sep. Functions of later phases are typed placeholders that log `audio: <name>() is not implemented yet (Phase N).` and do nothing, so the whole UI can be wired now. The **Phase** column says when each one starts making sound.

> **The one rule:** the browser blocks audio until the user clicks or presses a key. Call `ensureAudio()` **inside** a click or keydown handler (the Start button, which must be the first focusable element with a clear label). Every other function is safe to call before that: it either does nothing or keeps its setting for later.

All inputs are plain numbers. The audio engine never fetches and never reads `lib/data.ts`; you pass it values from `valueAt()`.

## Lifecycle and mixer (Phase 1 — working)

| Function | What it does |
|---|---|
| `ensureAudio(): Promise<void>` | Creates / resumes the single AudioContext. **Call inside a user gesture.** Safe to call on every tap: it resumes from any state but `"running"` (after a phone lock Safari reports `"interrupted"`), and asks for the iPhone `"playback"` audio session so sound plays with the silent switch on. |
| `isAudioReady(): boolean` | True once audio is running. |
| `stopAll(): void` | The **Esc** key. Fades every sound out in ~50 ms (no click), stops players and speech. |
| `setMasterVolume(v: number): void` | User volume 0..1. Always capped by the gain budget in `public/mapping.json`. |
| `setAllMuted(muted: boolean): void` | The **M** key. |
| `setVoiceMuted(id: VoiceId, muted: boolean): void` | Mixer mute per voice. |
| `setSolo(id: VoiceId \| null): void` | Mixer solo; `null` clears it. Earcons and narration are never silenced by solo. |
| `setVoiceVolume(id: VoiceId, v: number): void` | Per-voice volume slider, 0..1, applied under the voice's volume cap. Mute and solo still win. |
| `getAnalyser(): AnalyserNode \| null` | The output after the compressor (`fftSize` 2048), for the waveform and sound rings. `null` before `ensureAudio()`. |
| `onAudioEvent(cb): () => void` | Subscribe to events (below). Returns the unsubscribe function. |

`VoiceId` = `"ocean" | "rain" | "snow" | "heat" | "monsoon" | "water" | "fires" | "vegetation"` (also exported as the array `VOICE_IDS`). `LIVE_VOICES` (`ocean`, `rain`, `snow`) and `TRACK_VOICES` (which live voices each track mode plays: rain mode = rain + snow) are exported too.

## Live exploration (Phase 2 — working)

| Function | Call it when |
|---|---|
| `setTrackMode(mode: "ocean" \| "rain" \| "both")` | Track selector / keys 1, 2, 3 |
| `setOcean(valueC: number \| null, lon: number)` | The cursor moves (`valueAt("ocean", …).valueC`; `null` = land / no data) |
| `setRain(mmPerHour: number \| null, phase: RainPhase, lon: number)` | The cursor moves (`valueAt("rain", …)`; dry = `0` + `"dry"`, no data = `null` + `"nodata"`) |
| `silenceLive()` | The cursor leaves the map or exploration pauses |

Calls may arrive at 60 Hz; they're cheap. Rain phase routes the sound: `"liquid"` → drops, `"frozen"` → bells, `"dry"` → silence, `"nodata"` → silence plus one soft tick when the cursor **enters** the no-data area. The same tick plays when `setOcean(null, …)` follows a value (entering land). Captions, ticks and `drop` events are skipped for tracks the listener can't hear (track mode, mute, solo).

## Speech, legend, earcons (Phase 3 — working)

| Function | Notes |
|---|---|
| `speak(text: string, lang: "en" \| "bn"): Promise<void>` | Ducks the sonification while speaking; a new call interrupts the previous one. Resolves when done. No Bangla voice → silent + `caption.noBanglaVoice`. No speech, no voices installed, or a failure → silent + `caption.noSpeech` (it never hangs: 5 s watchdog). |
| `playEarcon(id: "nodata" \| "whisper" \| "ping", opts?: { lon?: number; params?: CaptionParams })` | Emits `caption.earcon.<id>` with your `params` (whisper: `{ source }`). `whisper` after a spoken value; `ping` at an extreme point. |
| `playLegend(voice)` → `PlayerHandle` | The **L** key. `voice`: `"ocean" \| "rain" \| "snow" \| "heat" \| "water"`. Heat plays its mapping.json points (since Phase 5). Water always emits `caption.legendUnavailable`: its pitch range comes from the series being played, so it has no fixed legend. Plays whatever the track mode; exploration pauses and resumes from the latest cursor values afterwards. |
| `playLegendForMode(mode)` → `PlayerHandle` | Short legend when the track or app mode changes. |
| `playWarmup()` → `PlayerHandle` | ~22 s: volume check, then the ocean, rain and snow legends, then one no-data tick. Suggested right after Start. |

## Sequences (Phase 4), Then vs Now (Phase 5) and time-lapse (Phase 6) — all working

| Function | Input |
|---|---|
| `playSweep(points: SweepPoint[], opts?: { stepMs?: number })` | The gist-sweep path you build from `valueAt()` (L3's `sweepPath()`). Default 80 ms per point. Follows the track mode; ticks on entering no data; one `"sweep"` step event per point. Exploration pauses and resumes afterwards |
| `playMotif(bandMeansC: (number \| null)[])` | 4 latitude-band mean SSTs: 60°S–30°S, 30°S–0°, 0°–30°N, 30°N–60°N (L3's `bandMeans()`). `null` = a rest. ≈ 1.9 s |
| `playOpening(points: SweepPoint[], opts?: { durationSec?: number })` | ~20 points for the "close your eyes" opening (L3's `openingPath()`). 10 s by default, fading in over 2 s and out over 1.5 s; ocean and rain play whatever the track mode. `caption.opening.openEyes` only when it plays to the end (not on Skip) |
| `playThenNow(input: ThenNowInput, part: "heat" \| "monsoon" \| "water" \| "all")` | Built from `demo/dhaka_then_now.json` + `context/grace.json` |
| `playCompare(a: CompareSide, b: CompareSide, mode: "sequential" \| "split")` | Comparison Player. `"sequential"`: A, a short gap, then B. `"split"`: A in the left ear, B in the right, at the same time |
| `playSeries(side: CompareSide, opts?: { stepMs?: number; player?: string })` | One series on its own, e.g. a decade of Place History. Default step: heat and monsoon 150 ms, water 60 ms. Step events use your `player` name (default `"series"`). Working since Phase 5 (L3 proposal B6, agreed on PR #4) |
| `playTimelapse(frames: SweepPoint[], opts?: { fps?: number; loop?: boolean })` | One point per frame (L3's `followStorm()`), 2 fps by default. Rain/snow by phase as in live exploration; no-data frames are silent with one tick per run; heard whatever the track mode. `loop` restarts with no gap until stopped (no end caption). Step events `"timelapse"`, index = frame |
| `peakFrame(frames: readonly SweepPoint[]): number` | Not a player: the index of the frame with the heaviest rain or snow (first on a tie), or `-1` when every frame is dry or has no data. It's the same rule `playTimelapse` uses for its peak caption, so use it for the UI's peak marker and Story narration instead of a second copy (asked on L3's PR #7) |

`SweepPoint` = `{ lon, lat, valueC, mmPerHour, phase }`. `CompareSide` = `{ label, values: (number | null)[], voice: "heat" | "monsoon" | "water" }`; build `ThenNowInput` with L3's `buildThenNowInput()` (`@/lib/then-now`). All players return a `PlayerHandle`: `{ stop(): void; done: Promise<void> }`. `done` resolves when the player finishes **or** is stopped.

Mute, solo and mute-all (M) apply to the Then vs Now and series voices too, and `stop()` / `stopAll()` silence everything a player has already scheduled.

Only one player plays at a time: starting the sweep, motif, opening, a legend or the warm-up stops the one before it (without its end caption).

## Recorded narration (Phase 8 — working)

| Function | What it does |
|---|---|
| `preloadClips(urls: string[]): Promise<void>` | Call once at start-up (before or after `ensureAudio()`): fetches and decodes every clip so playback starts without delay. The only function in L2 that uses the network. Never rejects: a clip that can't be loaded is skipped with a console warning. |
| `playClip(url: string): Promise<void>` | Plays a clip through the narration bus, ducking the sonification like `speak()`. Emits `caption.clip` `{ url }` as it starts (you map the url to its subtitle). A new clip replaces the one playing. Resolves when it ends, is replaced, or is stopped (Esc). An un-preloaded url still plays (loaded then, with a console warning); one that fails to load resolves silently. |

Clips from L4 (D12): MP3 in `public/audio/narration_en/` and `public/audio/narration_bn/`, named after their segment, e.g. `/audio/narration_en/opening.mp3`.

## Events

```ts
type AudioEvent =
  | { kind: "caption"; key: string; params: Record<string, string | number> } // you turn key + params into EN/BN text
  | { kind: "step"; player: string; index: number; total: number; time: number } // move a chart playhead / map cursor
  | { kind: "state"; ready: boolean; playing: boolean; ducked: boolean }
  | { kind: "drop"; voice: "rain" | "snow"; time: number; gain: number; lon: number }; // one per drop/bell (working)
```

A `drop` event arrives when the drop is handed to Web Audio, slightly **before** it sounds: draw its ripple when `getAnalyser()!.context.currentTime >= time`. `gain` is the drop's loudness 0..1 relative to the voice cap.

### Step events

Step events count **data points only** (L3 proposal B5, agreed on PR #4), so a chart playhead can use `index` directly:

- Silent steps (the gap between two windows, the pause between parts, a player's tail) send **no** step event.
- `index` is the data index and `total` the number of data points. Like `drop`, a step event arrives up to ~100 ms before it sounds; show it when the audio clock reaches `time`.

| `player` | Sent by | `index` |
|---|---|---|
| `"sweep"` | `playSweep()` | point index |
| `"thenNow.heat"` / `"thenNow.monsoon"` | `playThenNow()` (also inside `"all"`) | 0–19: window A years, then window B years |
| `"thenNow.water"` | `playThenNow()` (also inside `"all"`) | month index into `ThenNowInput.water.months` |
| `"compare"` | `playCompare(…, "sequential")` | side A values, then side B values (`total` = both) |
| `"compare.split"` | `playCompare(…, "split")` | the shared step index (`total` = the longer side) |
| your `player` (default `"series"`) | `playSeries()` | value index (L3's Place History passes `"history"`) |
| `"timelapse"` | `playTimelapse()` | frame index (`total` = frames; restarts at 0 each loop) |

```tsx
useEffect(() => onAudioEvent((e) => {
  if (e.kind === "caption") showCaption(t(e.key, e.params));
}), []);
```

### Caption keys

These are the keys L3's i18n already has English text for (`src/lib/i18n/en/captions.ts`; Bangla is pending in `docs/L3/bangla-strings.md` and falls back to English). L2 emits exactly these; a new key is agreed with L3 first.

| Key | Params | When | Emitted from |
|---|---|---|---|
| `caption.stopped` | — | `stopAll()` | **now** |
| `caption.value` | `track`, `value`, `phase` (rain) | live voices, ≤ 4 per second (the last value always arrives) | **now** |
| `caption.nodata` | `track` | cursor enters a no-data area (only if that track is audible) | **now** |
| `caption.noSpeech` | — | browser can't speak (no speech, no voices, or it failed) | **now** |
| `caption.noBanglaVoice` | — | no Bangla voice on the device | **now** |
| `caption.earcon.nodata` / `.whisper` / `.ping` | your `params` (whisper: `source`) | `playEarcon()` | **now** |
| `caption.legend` | `voice`, `label` | each legend step | **now** |
| `caption.legendUnavailable` | `voice` | no fixed legend (water) | **now** |
| `caption.warmup.start` / `.end` | — | warm-up (`.end` only when it plays to the end) | **now** |
| `caption.sweep.start` / `.end` | — | sweep (`.end` only when it plays to the end) | **now** |
| `caption.motif` | — | motif | **now** |
| `caption.opening.closeEyes` / `.openEyes` | — | opening (`.openEyes` only when it plays to the end) | **now** |
| `caption.thenNow.caption` | `text` (the part's caption from `ThenNowInput.captions`, as-is) | just before each Then vs Now part | **now** |
| `caption.thenNow.window` | `label` (e.g. "1981–1990") | start of each window (heat, monsoon) | **now** |
| `caption.thenNow.end` | — | Then vs Now finished | **now** |
| `caption.water.gap` | `from`, `to` ("YYYY-MM") | once per run of missing GRACE months | **now** |
| `caption.water.windowStart` / `.windowEnd` | `month` ("YYYY-MM") | water reaches a comparison window's edge | **now** |
| `caption.compare.side` | `label` | start of each side (`playCompare` sequential, `playSeries`) | **now** |
| `caption.compare.useHeadphones` | `a`, `b` (the two side labels) | start of split playback | **now** |
| `caption.timelapse.start` | `count` (frames) | time-lapse starts | **now** |
| `caption.timelapse.peak` | `value` (mm/h), `phase` (`"liquid"` / `"frozen"`) | the heaviest frame plays (none if every frame is dry or no data) | **now** |
| `caption.timelapse.end` | — | time-lapse plays to the end (not when stopped or looping) | **now** |
| `caption.clip` | `url` (as passed to `playClip`) | a recorded narration clip starts | **now** |

The Phase 5 keys were agreed on L3's PR #4 and the time-lapse keys on L3's proposal B8 (accepted as proposed, including `phase` on the peak). `caption.clip` was agreed with L3 on 28 Sep.

## Switching the app to this engine

L3's UI imports `audio` from `src/lib/audio-adapter/index.ts`. Once L2's voices are ready (Phases 2–4), the switch is (`docs/L3/integration.md` §1):

```ts
import * as l2 from "@/lib/audio";
export const audio: AudioEngine = withFallbacks(l2); // fills any missing L3 extras (getAnalyser, setVoiceVolume, playSeries)
export const IS_INTERIM_ENGINE = false;
```

This type-checks against L2's current API (checked 27 Sep, after L3's PR #4). Every change to this API must keep it type-checking.

## Example wiring

```tsx
// Start button (first focusable element)
<Button aria-label="Start audio" onClick={async () => { await ensureAudio(); playWarmup(); }}>Start</Button>

// Cursor move
const o = valueAt("ocean", lat, lon);
setOcean(o.valueC, lon);
const r = valueAt("rain", lat, lon);
setRain(r.mmPerHour, r.phase, lon);

// Keys
if (e.key === "Escape") stopAll();
if (e.key === "m") setAllMuted(!muted);
```

## Try it

`bun run dev`, then open `/dev/audio` (L2's test page; not linked from the app).
