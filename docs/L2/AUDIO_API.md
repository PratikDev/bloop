# Audio API (for L3 and anyone wiring sound into the UI)

**Owner:** L2 · **Import from:** `@/lib/audio` only (never from its internal files)
**Status:** the full API exists with its final signatures, and it already satisfies L3's `AudioEngine` interface (`src/lib/audio-adapter/types.ts`, including L3's requests B1–B3 and earcon params) — checked with `tsc` on 27 Sep. Functions of later phases are typed placeholders that log `audio: <name>() is not implemented yet (Phase N).` and do nothing, so the whole UI can be wired now. The **Phase** column says when each one starts making sound.

> **The one rule:** the browser blocks audio until the user clicks or presses a key. Call `ensureAudio()` **inside** a click or keydown handler (the Start button, which must be the first focusable element with a clear label). Every other function is safe to call before that: it either does nothing or keeps its setting for later.

All inputs are plain numbers. The audio engine never fetches and never reads `lib/data.ts`; you pass it values from `valueAt()`.

## Lifecycle and mixer (Phase 1 — working)

| Function | What it does |
|---|---|
| `ensureAudio(): Promise<void>` | Creates / resumes the single AudioContext. **Call inside a user gesture.** |
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

## Live exploration (Phase 2)

| Function | Call it when |
|---|---|
| `setTrackMode(mode: "ocean" \| "rain" \| "both")` | Track selector / keys 1, 2, 3 |
| `setOcean(valueC: number \| null, lon: number)` | The cursor moves (`valueAt("ocean", …).valueC`; `null` = land / no data) |
| `setRain(mmPerHour: number \| null, phase: RainPhase, lon: number)` | The cursor moves (`valueAt("rain", …)`; dry = `0` + `"dry"`, no data = `null` + `"nodata"`) |
| `silenceLive()` | The cursor leaves the map or exploration pauses |

Calls may arrive at 60 Hz; they're cheap.

## Speech, legend, earcons (Phase 3)

| Function | Notes |
|---|---|
| `speak(text: string, lang: "en" \| "bn"): Promise<void>` | Ducks the sonification while speaking. Resolves when done. With no Bangla voice on the device it stays silent and emits `caption.noBanglaVoice`. |
| `playEarcon(id: "nodata" \| "whisper" \| "ping", opts?: { lon?: number; params?: CaptionParams })` | Emits `caption.earcon.<id>` with your `params` (whisper: `{ source }`). `whisper` after a spoken value; `ping` at an extreme point. |
| `playLegend(voice)` → `PlayerHandle` | The **L** key. `voice`: `"ocean" \| "rain" \| "snow" \| "heat" \| "water"`. |
| `playLegendForMode(mode)` → `PlayerHandle` | Short legend when the track or app mode changes. |
| `playWarmup()` → `PlayerHandle` | ~30 s volume check + legends. Suggested right after Start. |

## Sequences (Phase 4), Then vs Now (Phase 5), time-lapse (Phase 6)

| Function | Input |
|---|---|
| `playSweep(points: SweepPoint[], opts?: { stepMs?: number })` | The gist-sweep path you build from `valueAt()` |
| `playMotif(bandMeansC: (number \| null)[])` | 4 latitude-band mean SSTs: 60°S–30°S, 30°S–0°, 0°–30°N, 30°N–60°N |
| `playOpening(points: SweepPoint[], opts?: { durationSec?: number })` | ~20 points for the "close your eyes" opening |
| `playThenNow(input: ThenNowInput, part: "heat" \| "monsoon" \| "water" \| "all")` | Built from `demo/dhaka_then_now.json` + `context/grace.json` |
| `playCompare(a: CompareSide, b: CompareSide, mode: "sequential" \| "split")` | Comparison Player |
| `playTimelapse(frames: SweepPoint[], opts?: { fps?: number; loop?: boolean })` | Values at the cursor for each time-lapse frame |

`SweepPoint` = `{ lon, lat, valueC, mmPerHour, phase }`. All players return a `PlayerHandle`: `{ stop(): void; done: Promise<void> }`.

## Recorded narration (Phase 8)

`preloadClips(urls: string[]): Promise<void>` at start-up, then `playClip(url): Promise<void>`.

## Events

```ts
type AudioEvent =
  | { kind: "caption"; key: string; params: Record<string, string | number> } // you turn key + params into EN/BN text
  | { kind: "step"; player: string; index: number; total: number; time: number } // move a chart playhead / map cursor
  | { kind: "state"; ready: boolean; playing: boolean; ducked: boolean }
  | { kind: "drop"; voice: "rain" | "snow"; time: number; gain: number; lon: number }; // one per drop/bell (Phase 2)
```

A `drop` event arrives when the drop is handed to Web Audio, slightly **before** it sounds: draw its ripple when `getAnalyser()!.context.currentTime >= time`. `gain` is the drop's loudness 0..1 relative to the voice cap.

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
| `caption.value` | `track`, `value`, `phase` (rain) | live voices, ≤ 4 per second | Phase 2 |
| `caption.nodata` | `track` | cursor enters a no-data area | Phase 2 |
| `caption.noSpeech` | — | browser can't speak | Phase 3 |
| `caption.noBanglaVoice` | — | no Bangla voice on the device | Phase 3 |
| `caption.earcon.nodata` / `.whisper` / `.ping` | your `params` (whisper: `source`) | `playEarcon()` | Phase 3 |
| `caption.legend` | `voice`, `label` | each legend step | Phase 3 |
| `caption.legendUnavailable` | `voice` | legend not available yet (heat, water) | Phase 3 |
| `caption.warmup.start` / `.end` | — | warm-up | Phase 3 |
| `caption.sweep.start` / `.end` | — | sweep | Phase 4 |
| `caption.motif` | — | motif | Phase 4 |
| `caption.opening.closeEyes` / `.openEyes` | — | opening | Phase 4 |

## Switching the app to this engine

L3's UI imports `audio` from `src/lib/audio-adapter/index.ts`. Once L2's voices are ready (Phases 2–4), the switch is:

```ts
import * as l2 from "@/lib/audio";
export const audio: AudioEngine = l2;
export const IS_INTERIM_ENGINE = false;
```

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
