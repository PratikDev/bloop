# Audio API (for L3 and anyone wiring sound into the UI)

**Owner:** L2 · **Import from:** `@/lib/audio` only (never from its internal files)
**Status:** the full API exists with its final signatures. Functions of later phases are typed placeholders that log `audio: <name>() is not implemented yet (Phase N).` and do nothing, so the whole UI can be wired now. The **Phase** column says when each one starts making sound.

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
| `onAudioEvent(cb): () => void` | Subscribe to events (below). Returns the unsubscribe function. |

`VoiceId` = `"ocean" | "rain" | "snow" | "heat" | "monsoon" | "water" | "fires" | "vegetation"` (also exported as the array `VOICE_IDS`).

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
| `playEarcon(id: "nodata" \| "whisper" \| "ping", opts?: { lon?: number })` | `whisper` after a spoken value; `ping` at an extreme point. |
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
  | { kind: "state"; ready: boolean; playing: boolean; ducked: boolean };
```

```tsx
useEffect(() => onAudioEvent((e) => {
  if (e.kind === "caption") showCaption(t(e.key, e.params));
}), []);
```

### Caption keys emitted so far

None yet (the first ones arrive in Phase 2). This list is kept up to date as phases land, so L3 can add EN/BN strings.

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
