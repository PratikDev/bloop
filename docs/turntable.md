# Turntable Earth (prototype)

The latest EIC frame on a globe that turns under a fixed tonearm. The needle reads the point beneath it and plays it with the app's existing voices and `mapping.json` rules. Longitude changes as the globe turns; latitude is the needle's groove. Branch: `feat/turntable-earth`. Build plan: [turntable-plan.md](turntable-plan.md).

## Open it

- **Locally:** `bun install`, then `bun run dev` (or `bun run build && bun run start`). Open http://localhost:3000, choose **Start listening**, then the **Turntable** tab.
- **Vercel preview:** push the branch, open the preview URL Vercel posts on the PR, then the **Turntable** tab.
- **Debug overlay:** add `?debug=1` to the URL (any build). It shows the needle's lat/lon, SST cell and value, a camera-ray pick of the needle tip, the flat map's reading of the same place, and FPS. It also exposes `window.__turntable` for the checks below. It is a separate chunk that never loads without the flag.

three.js (`three@0.186.1`) and the view load only when the tab is chosen (`next/dynamic`, like Then vs Now).

## Controls

Keys work while the turntable has focus (Tab to it), like the map keys. Every key also has a button or pointer equivalent.

| Key | Action | Pointer / button |
|---|---|---|
| ← / → | Turn the globe 1° (Shift: 10°); stops the turning | Drag sideways |
| ↑ / ↓ | Move the needle 1° north or south (Shift: 10°), within ±80° | Click or tap a point: it comes under the needle |
| Space | Start or stop the turning | **Turn / Stop turning** |
| Enter | Speak the value and place under the needle (existing speech path, e.g. "28.9 degrees Celsius, at 18.0 degrees north, 88.0 degrees east.") | |
| R / Shift+R | Next / previous record | Record cards |
| 1 / 2 / 3 | Ocean / Rain / Ocean + Rain record | Record cards, or the top bar's track buttons |
| + / − | Faster / slower (¼×, ½×, 1×, 2×, 4×; 1× = one turn a minute) | **−** / **+** |
| Esc | Stop all sound and go back to the flat map (global) | **Flat map** (keeps the needle's lat/lon) |

The other map letters keep their meaning on the turntable: H/? help, M mute, D describe, C captions, L legend, P provenance, X, S sweep, T Then vs Now. The Help dialog has a new "On the turntable" table.

**Key clashes:** none of these is global, so nothing was overridden. Space pauses the *sound* on the flat map but the *turning* on the turntable (as specified); the bottom bar's **Pause sound** and **M** still control sound there. Esc keeps its global meaning and also leaves the turntable, as it already leaves Story.

## What is real and what is a placeholder

| Record | Status | Data | Sound |
|---|---|---|---|
| Ocean | Live | `latest/sst.bin` (MUR SST via SVS 5101); texture `latest/sst.webp` | Existing ocean voice: f = 220 × 4^((T+5)/40) Hz |
| Rain | Live | `latest/rain.bin` + `rain_phase.bin` (IMERG via SVS 4285); texture = night + land mask from the SST no-data cells + `latest/rain.png` | Existing drops: 2 + 38t per second on log 0.1–50 mm/h; frozen → snow bell |
| Ocean + Rain | Live | Both | Both voices, through the existing mixer (same as track "Both") |
| Air, Forests, Fire, Energy, Sea level, Disasters, Agriculture, Water and groundwater | Placeholder | None | None. Disabled cards labelled "Coming next" |

- Records **are** the app's track modes, so the mixer (mute/solo/volume), frame labels, readout, captions and side panels behave exactly as on the flat map.
- The globe texture is drawn by the flat map's own `drawBase()` at 2048 × 1024, so both views show the same pixels.
- Record labels are read from `sst.json` / `rain.json`: dataset name (`source_dataset`, before any colon), SVS ID, frame time (UTC), age ("Latest available: N days old", from `frame_time_utc` and the viewer's clock), and the measured error **as the Truth panel shows it**. Ocean shows "Verification being updated", because the Truth panel deliberately shows no SST number until the recalibrated error is checked on a separate frame. Rain shows "~27%" (`rainTruth()`, pending team approval). A missing field shows "—".
- Land and no data are silent (null reaches the voice). Nothing is interpolated.
- The needle drop is a UI earcon (two low notes, ping's level and envelope from `mapping.json`), captioned "Needle drop: a new record". It is not data.
- The frame time is always on screen (the existing frame label under the readout: "EIC frame: …, … UTC. Sound generated live from this frame.").

## How it works

- `src/lib/sphere.ts`: `latLonToSphere()` and `sphereHitToLatLon()`. These are the only lat/lon ↔ globe conversions. They build the globe mesh (vertices + UVs), place the needle and turn clicks into places.
- The needle **is** the app cursor. Each frame, the loop turns the globe, places the needle and reads the globe point under its tip with `sphereHitToLatLon`. That reading is stored unchanged in the app state, so the readout, speech and sound all look up the same grid cell.
- At a fixed 30 Hz control rate, `readAt()` → `valueAt()` at the needle goes to `audio.setOcean / setRain`: the same calls Explore makes, which re-synthesise from the value. Rotation speed never reaches the audio code.
- React state follows the needle at ~7 Hz (and at once on keys, clicks and stops), so the app doesn't re-render 30 times a second.
- WebGL: pixel ratio capped at 2; a fresh canvas per visit; geometries, materials, texture and renderer are disposed and the context released on leaving.
- Reduced motion (OS setting or the in-app toggle): the globe doesn't turn on its own and the needle doesn't animate. Turning can still be started by hand.

## Verification results

Run on 27 Oct 2026 against the production build (`next build && next start`) in headless Microsoft Edge on the RTX 3050 laptop GPU (ANGLE/D3D11), driven by Playwright. Data: SST frame 25 Sep 2026 00:00 UTC, rain frame 28 Sep 2026 08:30 UTC.

### 1. Mapping (unit test, `bun run test`)

`src/lib/sphere.test.ts`: **8/8 pass.** 1,000 random points (fixed seed, |lat| ≤ 89.9°) round-trip within 0.01° (requirement). These must be exact, and are within 1e-9°: (0, 0); (89.9, 0); (−89.9, 0); Dhaka (23.81, 90.41); Bay of Bengal (18.0, 88.0). (0, 180) and (0, −180) map to the same point (distance < 1e-12) and both read back as −180°, the grid's column 0.

### 2. Picking (3D needle vs the flat map's `valueAt`)

For each point, the needle was moved there and read three ways: the needle reading (what is heard, shown and spoken), a camera ray through the needle tip's pixel (the click path), and the flat map's pixel transform of the same place (`toXY` → `toLatLon`, as FrameView does on click).

| Point | Needle (lat, lon) | SST cell (needle / camera / 2D) | Needle °C | 2D °C | Equal |
|---|---|---|---|---|---|
| Ocean 1 | 13.50, 153.71 | 223157 / 223157 / 223157 | 29.846 | 29.846 | yes |
| Ocean 2 | −54.08, 128.08 | 419692 / 419692 / 419692 | 4.105 | 4.105 | yes |
| Ocean 3 | −16.68, −160.88 | 310326 / 310326 / 310326 | 27.243 | 27.243 | yes |
| Ocean 4 | −51.75, 174.22 | 413679 / 413679 / 413679 | 7.972 | 7.972 | yes |
| Ocean 5 | 56.74, 11.25 | 96800 / 96800 / 96800 | 16.175 | 16.175 | yes |
| Land: Dhaka | 23.81, 90.41 | 193281 / 193281 / 193281 | no data | no data | yes |
| Land: Sahara | 23.00, 10.00 | 195100 / 195100 / 195100 | no data | no data | yes |

"Equal" compares the full reading (ocean °C, rain mm/h and phase), exactly (`===`), not rounded. For both land points the update sent to the voices carried `valueC = null` (ocean silent), as the flat map sends.

### 3. Texture alignment

| Needle at | Readout | Screenshot |
|---|---|---|
| Dhaka (23.81° N, 90.41° E) | "No ocean data here" (land) | [dhaka.png](turntable-screens/dhaka.png) |
| 18° N, 88° E (Bay of Bengal) | 28.9 °C (28.862) | [bay-of-bengal-18n-88e.png](turntable-screens/bay-of-bengal-18n-88e.png) |
| 0° N, 0° E (Gulf of Guinea) | 26.6 °C (26.639), ocean | [gulf-of-guinea-0n-0e.png](turntable-screens/gulf-of-guinea-0n-0e.png) |

In each screenshot the needle tip sits on that place in the texture (India and the Bay; the Gulf of Guinea coast).

**The one 3D/2D disagreement found:** at exactly 0° N, 0° E the debug camera-ray pick reads SST cell 261631 instead of 262656. The equator and the prime meridian are both cell edges in this grid, and the ray lands ~1e-14° south-west of the needle's point, in the diagonal neighbour cell. The needle itself (sound, readout, speech) and the flat map both read 262656, so nothing heard or shown disagrees. Clicks land on arbitrary sub-pixel positions, so this can only happen on an exact edge.

### 4. Audio

- **Pitch doesn't depend on speed.** At 18° N 88° E (28.862 °C) after turning at 0.5×, 1× and 4×: the rule frequency is 711.372 Hz each time. The master analyser's peak (parabolic interpolation, 2048-point FFT) is 711.515 Hz each time, identical to 3 decimals. While turning across 80–100° E at 18° N, the frequency sent in each SST cell visited at all three speeds (21 cells, 13 of them ocean) was bit-identical at every speed: **0 mismatches**.
- **Rain rate follows 2 + 38t (log 0.1–50 mm/h).** 20 s counts of scheduled drops at fixed points:

  | Point | Phase | mm/h | Rule (/s) | Measured (/s) |
  |---|---|---|---|---|
  | 50° S, 176° W | rain | 0.596 | 12.92 | 12.95 |
  | 50° S, 173° W | rain | 3.552 | 23.83 | 23.75 |
  | 47.5° S, 50° E | rain | 11.68 | 31.11 | 30.85 |
  | 50° S, 2° W | snow (bell) | 1.081 | 16.55 | 16.45 |

  Within 1% (the voice jitters each interval ±30% by design; earlier runs were within 2.4%).
- **No clicks on record change.** At a dry ocean point (20° S, 60° E), the largest sample-to-sample step on the master output (after the limiter) was 0.01117 while steady and 0.01118 across Ocean → Ocean + Rain → Ocean switches, needle-drop earcon included. A click would be a step many times larger.
- **Master cap and limiter:** `audio-adapter/graph.ts` is unchanged. The voices still run bus → fade → sonification → master (`masterGain`) → compressor; the needle-drop earcon goes to the existing earcon bus → master.

### 5. Performance

- **FPS while turning at 1×:** 143–144 (the display's 144 Hz refresh cap). With Chrome DevTools **4× CPU slowdown** (`Emulation.setCPUThrottlingRate`): **103–111** (96–113 in a separate 10 s run each for Ocean and Ocean + Rain). Target was ≥ 30 there and 60 normally.
- **Memory (JS heap after forced GC):** 11.19 MB at start, 11.86 MB after 20 record switches, 11.34 MB after 40: no growth. Leaving and reopening the view: 12.41 / 12.52 / 12.57 MB after 10 / 20 / 30 cycles, levelling off. A heap-snapshot diff over 30 cycles shows no retained WebGL contexts, canvases, textures or shaders. What grows is Chrome's own performance-timeline entries, and Then vs Now shows the same.
- **Leak found and fixed during verification:** the deck first used `MeshStandardMaterial`. three.js registers every renderer on a module-level PBR lookup texture (`DFG_LUT`), so each visit kept its whole renderer and GL context alive (+1 context per visit). The deck now uses flat-shaded `MeshLambertMaterial`, which doesn't touch that texture.
- **Lazy loading:** the three.js chunk (547 KB minified) and the Turntable code are not among the page's initial scripts; they load when the tab is opened. The initial bundle gains only the new strings, the tab and the Help rows. I did not measure a byte-level comparison against the base commit (a clean second install failed on Windows path length).

### 6. Regression

- `bun run lint`, `bunx tsc --noEmit`, `bun run build`: pass. `bun run test`: 8/8.
- Production build, automated: Explore (arrows move the cursor, Enter speaks with a caption, 1/2/3 switch the track), Play sweep, storm time-lapse, Story (runs; Esc ends it), Then vs Now, Bangla toggle (Bengali digits in the frame labels), Help (H, including the new turntable table). **No console errors or warnings** in any run.

### 7. Keyboard-only run

From a fresh page with keys only: Enter on Start listening → Enter on Skip intro → Shift+Tab to the mode tabs → arrows to Turntable → Tab to the turntable → 2 (announced "Record: Rain. Rain and snow, latest available frame 28 Sept 2026, 08:30 UTC.") → R → Shift+R → Space ("Turning stopped") → ↑, Shift+↑, → (needle 21.5° N → 32.5° N) → + ("Speed 2×") → − → Enter (caption "Dry, at 32.5 degrees north, 71.0 degrees east.") → Tab to **Flat map** → Enter (Explore, focus on the sound map at the same place) → back to Turntable → Esc (Explore, focus on the sound map). The mouse was never used. All steps passed.

Method: Playwright (`playwright-core`) drove the production build (`next start`) in headless Edge, calling the `?debug=1` hooks (`window.__turntable`). The scripts are kept outside the repo; they can be added under `docs/` if the team wants them.

## Known limitations

- **Cell edges:** at a point exactly on a grid-cell edge, two different float paths to the "same" lat/lon can round to neighbouring cells (see 0° N, 0° E above). The needle, readout, speech and flat map always agree because they share one stored reading. Only the debug camera-ray pick can differ, by ~1e-14°.
- **Drop timing while turning:** the needle sends a new update only when the reading (value, phase or whole-degree pan) changes. Each update restarts the drop voice's next-drop timer (existing `voices/drops.ts` behaviour, the same as dragging on the flat map). So over fast-changing rain the drop rate follows the rule only on average; at a fixed point it is exact (above).
- **Esc message:** after Esc, Explore's own settled-reading announcement replaces "Stopped. Back to the flat map." in the live region (the Story mode has a special case for this in `ExploreControls`; I didn't touch it for the turntable).
- **Sweep** works on the turntable (sound and captions) but its ring is only drawn on the flat map.
- **Bangla:** the new strings are English-only and fall back like the rest of the app until a human translation exists.
- **Speed label** ("Speed 1×") is a control setting, not data.
- **Needle-drop earcon** is an L3 engine extension (`playNeedleDrop`, PROPOSAL in `audio-adapter/types.ts`, no-op fallback). L2's engine doesn't need it to keep working.
- The 3D globe was not tested on a phone or with a real screen reader; the keyboard and live-region checks were automated.

## TODO hooks (marked `TODO(turntable: …)` in code)

- **More records**, one per EIC area: `Turntable/records.ts`. Each needs an L1 grid + metadata, a `valueAt` track and a voice in `mapping.json`.
- **Bloop drop** (needle-drop cue with pitch = Bay of Bengal SST): `Turntable/needle-drop.ts`.
- **Proof in unison** (frame tone + NASA source-file tone at the same point): `Turntable/needle-sound.ts`.
- **Amphan cold scar, playable delta, satellite orrery** (sibling scenes reusing `latLonToSphere` and the deck): `Turntable/scene.ts`.
