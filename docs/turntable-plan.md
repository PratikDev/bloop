# Turntable Earth: build plan

Branch: `feat/turntable-earth` (from `L1` at 656f413). Prototype only; every existing mode keeps working.

## What the repo is

- **Framework:** Next.js 16.3.6 (App Router, `src/app/page.tsx` renders one client component, `JukeboxApp`), React 19.2.8, TypeScript (strict), Tailwind 4 + shadcn/ui (Base UI). Built with `next build` (Turbopack); package manager **bun** (`bun run dev | build | lint`).
- **Modes:** not routes. `Mode = "explore" | "story" | "thenNow"` in `src/components/AppState/reducer.ts`; tabs in `src/components/ModeTabs.tsx`; labels in `MODE_LABELS` (`src/components/Commands/use-commands.ts`); `JukeboxApp/index.tsx` swaps `<Stage/>` for `<ThenNow/>` (lazy, `next/dynamic`, `ssr: false`). So Turntable is added **as a fourth mode tab**, lazy-loaded the same way (no `?view=` route).
- **three.js:** `three@0.186.1`, `@types/three@0.186.0` (current stable on npm today).

## Data

- Loaded once in `LiveDataProvider` (`src/components/LiveData/index.tsx`): `loadSst()` first, `loadRain()` after first paint (`src/lib/data/latest.ts`). Grid helpers in `src/lib/data/grid.ts` (`cellIndex`, row 0 = 90° N, col 0 = 180° W, little-endian). Contract types: `src/types/data-contract.ts`.
- **Value lookup:** `valueAt(fields, track, lat, lon)` in `src/lib/data/value-at.ts` (→ `oceanAt` / `rainAt` in `latest.ts`). Everything on screen goes through `readAt(fields, at)` in `src/lib/reading.ts`, which calls `valueAt` for both tracks. The turntable uses `readAt` too, so 3D and 2D share one lookup.
- **2D display images:** `FrameView/base-layer.ts` `drawBase()`: ocean = `latest/sst.webp`; rain = night fill + land layer built from the SST no-data mask (`buildLandLayer`) + `latest/rain.png`; both = SST + rain on top. Images via `FrameView/use-frame-images.ts`. The globe texture is drawn **with the same `drawBase()`** into a 2048×1024 canvas, so the globe and the flat map can't differ.

## Audio

- Engine boundary: `src/lib/audio-adapter/index.ts` exports `audio` (the interim engine wrapped in `withFallbacks`). Voices are created once in `initLive()` (`live.ts`): `createOceanVoice` (`voices/ocean.ts`) and `createDropVoice(…, "rain" | "snow")` (`voices/drops.ts`). Frozen rain is routed to the snow bell by `routeRain()`.
- `mapping.json` is imported and validated at module load in `src/lib/audio/mapping.ts` (`MAPPING`, `mapVoice`, `panFor` = lon/180). Voices call `mapVoice()` on every `set()`: they re-synthesise from the value; no buffers are resampled.
- The app drives voices through `audio.setOcean(valueC, lon)` / `audio.setRain(mm, phase, lon)` from `useSoundSync` (`Commands/use-sound-sync.ts`), only in Explore. Chain: voice → voice bus (mixer) → fade → sonification (ducked by speech) → master (`masterGain`) → compressor (limiter) → analyser → speakers.

## Keys, speech, captions, live region

- Map keys live on the focused sound map only (`ExploreControls/use-map-keys.ts`, `role="application"`); Esc is the only global key (`JukeboxApp/use-global-escape.ts` → `commands.stopAll()`).
- Enter → `commands.speakCurrent()` → `say()` in `Commands/index.tsx`: built-in voice (`audio.speak`) with a caption **or** the live region, never both; text from `spokenReading()` / `place.spoken` (formatting in `src/lib/i18n/format.ts`).
- One `aria-live="polite"` region in `Announcer/index.tsx` (`useAnnounce()`, 300 ms debounce).
- `CaptionBar` (bottom bar) shows the engine's caption events (`caption.value`, throttled to 4/s in `live.ts`) and UI captions (`postCaption`).
- Help: `HelpDialog.tsx` key table, strings in `src/lib/i18n/en/help.ts`. Reduced motion: `state.reduceMotion` (OS default + in-app toggle, `AppState/index.tsx`).

## Key clashes

None of the turntable keys is global, so nothing is overridden; they work only while the turntable has focus, like the map keys.

- **Space:** on the sound map it pauses the live sound; on the turntable it pauses rotation (as specified). Sound pause stays on the bottom-bar button and **M** still mutes.
- **Enter:** same meaning (speak value + place), at the needle.
- **Esc:** keeps its global meaning (stop all sound, close panels) and, in Turntable, also returns to Explore (as Esc already does for Story).
- **R, +, −:** unused elsewhere. **1 / 2 / 3** select the Ocean / Rain / Ocean + Rain records (same tracks as on the map).
- All other map letters (H/?, M, D, C, L, P, X, S, T) keep their meaning on the turntable.

## Design in one paragraph

Records **are** the existing track modes: Ocean = `ocean`, Rain = `rain`, Ocean + Rain = `both`, so choosing a record calls the existing `setTrack`, the mixer gates voices exactly as the track buttons do, and the frame labels, readout and Truth numbers follow. The needle **is** the app cursor: needle latitude = `cursor.lat`, the longitude under the needle = `cursor.lon`; the globe's rotation is derived from it. A `requestAnimationFrame` loop owns the needle while the turntable is open: it renders, and at a fixed 30 Hz control rate calls `readAt()` at the needle and feeds `audio.setOcean / setRain` (the same calls `useSoundSync` makes). React's `cursor` is synced at ~7 Hz while rotating (and immediately on keys, clicks and pause), so the readout and side panels follow without re-rendering the app 30 times a second.

## Files to add

| File | Why |
|---|---|
| `src/lib/sphere.ts` (+ `sphere.test.ts`) | `latLonToSphere()` / `sphereHitToLatLon()`, used for the globe mesh, the needle and picking; unit-tested with `bun test` |
| `src/components/Turntable/index.tsx` | The view: focusable region, canvas, carousel, controls, reused `<Readout/>` |
| `src/components/Turntable/scene.ts` | three.js renderer, camera, globe (mesh built with `latLonToSphere`), picking, dispose |
| `src/components/Turntable/deck.ts` | Platter, spindle, base and tonearm meshes, coloured from the CSS tokens |
| `src/components/Turntable/use-turntable.ts` | Mounts the scene, runs the loop (rotation, needle, cursor sync, needle drop) |
| `src/components/Turntable/needle-sound.ts` | 30 Hz control-rate feed of the existing voices, with honest silence |
| `src/components/Turntable/needle-drop.ts` | Lift / lower / touchdown timing (instant with reduced motion) |
| `src/components/Turntable/use-globe-texture.ts` | Draws the 2D map's `drawBase()` into the globe texture |
| `src/components/Turntable/use-globe-pointer.ts` | Drag to turn; click or tap to bring a point under the needle |
| `src/components/Turntable/use-turntable-keys.ts` | Turntable keys; falls back to the map's existing letter keys |
| `src/components/Turntable/TurntableControls.tsx` | Turn / stop, speed, Flat map buttons |
| `src/components/Turntable/records.ts`, `RecordCarousel.tsx` | Live records (labels read from `sst.json` / `rain.json`) and "coming next" placeholders |
| `src/components/Turntable/DebugOverlay.tsx`, `debug.ts` | `?debug=1` overlay and the picking/audio test hooks |
| `src/lib/i18n/en/turntable.ts` | English strings (Bangla falls back to English, as the app already does) |
| `docs/turntable.md`, `docs/turntable-pr.md`, `docs/turntable-screens/` | Deliverables |

## Files to touch (minimal)

| File | Why |
|---|---|
| `package.json`, `bun.lock` | `three`, `@types/three`, and a `test` script (`bun test`) |
| `AppState/reducer.ts` | Add `"turntable"` to `Mode`; name the existing "live sound may play" test `liveSoundOn()` so the turntable reuses it |
| `Commands/use-commands.ts`, `Commands/index.tsx` | Mode label; `speakAt(at)` (Enter speaks at the needle, `speakCurrent` now calls it); Esc leaves Turntable like Story |
| `Commands/use-sound-sync.ts` | Export the one "feed voices at a point" function; in Turntable the needle loop feeds the voices (like Story owns them), everything else unchanged |
| `ModeTabs.tsx`, `JukeboxApp/index.tsx` | The tab, and the lazy `<Turntable/>` |
| `ExploreControls/use-map-keys.ts` | Export the existing arrow, track-key and letter-key tables for reuse (no behaviour change) |
| `HelpDialog.tsx`, `i18n/index.ts` | A "Turntable" key table in Help; register the new strings |
| `audio-adapter/types.ts`, `fallbacks.ts`, `interim-engine.ts`, `earcons.ts` | Needle-drop earcon as an optional L3 extension (`playNeedleDrop`, no-op fallback), on the earcon bus so master cap and limiter apply. `mapping.json` is not changed |

## Open points (decided from the code, flagged for review)

- **Ocean "measured error":** the Truth panel deliberately shows **no** SST number ("Verification being updated") until the recalibrated error is checked on a separate frame. The record label mirrors the Truth panel, so it shows that text, not `verified.value`. Rain shows the Truth panel's `~N %` (`rainTruth()`).
- **Debug overlay** is behind `?debug=1` in any build (lazy chunk, zero cost otherwise), so it can also be checked on a Vercel preview.
