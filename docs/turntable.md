# Turntable Earth (v2)

The latest EIC frame over a realistic Earth on a turntable. The needle reads the point beneath it and plays it with the app's existing voices and `mapping.json` rules: longitude changes as the globe turns, latitude is the needle's groove. v2 rebuilds the presentation (realistic globe, places, navigation, readability, motion). **Data, `valueAt()`, the sound mapping and every value are unchanged from v1.**

Branches: v1 `feat/turntable-earth`, v2 `feat/turntable-v2` (its child). Plans: [turntable-plan.md](turntable-plan.md) (v1), [turntable-v2-plan.md](turntable-v2-plan.md) (v2 audit, approach, assets). The repository now lives at `D:\Jukebox\nasa-sac` (moved from OneDrive Desktop on 27 Oct 2026, because drive C: was full).

## Open it

- **Locally:** `bun install`, then `bun run dev` (or `bun run build && bun run start`). Open http://localhost:3000, choose **Start listening**, then the **Turntable** tab.
- **Vercel preview:** push the branch and open the preview URL, then the **Turntable** tab.
- **Debug overlay:** add `?debug=1` (any build): needle lat/lon, SST cell, value, a camera-ray pick, the flat map's reading of the same place, FPS, and `window.__turntable` for the checks below.
- Everything for the tab (three.js, textures, geography) loads only when the tab is opened: **3.29 MB** measured (textures at 4096, geography, JS chunks).

## Controls

Keys work while the turntable has focus (Tab to it). Every key has a button, the globe (drag, click, wheel, pinch) or the sleeves.

| Key | Action | Pointer / button |
|---|---|---|
| ← / → | Turn the globe 1° (Shift: 10°); stops the turning; switches to the close-up view | Drag |
| ↑ / ↓ | Move the needle 1° north / south (Shift: 10°), within ±80° | Drag up/down (close-up), or click a point |
| Space | Start / stop the turning | **Turn / Stop turning** |
| Enter | Speak value + unit + place + "frame time … UTC, latest available" (existing speech path) | |
| / or G | Search a place (English or বাংলা), offline | Search box |
| L (Shift+L) | Where am I? (Shift+L: hear the legend) | **Where am I?** |
| 1–9 | Bookmarks: Bay of Bengal, Sundarbans, Dhaka, St Martin's Island, Jamuna at Sirajganj, Madhupur, Lawachara, Chattogram, Cox's Bazar | |
| T | Tour (Bay of Bengal → Sundarbans → Dhaka → St Martin's → Jamuna); the value is spoken at each stop | **Tour / Stop tour** |
| + / − | Zoom in / out (whole Earth to district level) | Wheel, pinch, zoom buttons |
| [ / ] | Turn slower / faster (¼× … 4×) | **−** / **+** |
| V | Jukebox view / close-up view | **Jukebox view / Close-up view** |
| O | Data layer opacity: 0, 25, 50, 85, 100% | **Data layer** slider |
| R / Shift+R | Next / previous record | Sleeves |
| Esc | Stops a tour or flight, or closes search; otherwise stops all sound and goes back to the flat map | **Flat map** (same lat/lon) |

Also: **My location** (asks the browser once, flies there; never stored or sent), **Sun at frame time / Always day**, **Grid lines**, **Texture quality** (Auto / 2048 / 4096 / 8192 px). Help (H/?) lists all of this under "On the turntable".

**Key clashes, resolved inside the Turntable only** (Explore keeps its keys): L was the legend → Shift+L; T was Then vs Now → the mode tabs; 1–3 were tracks → R and the sleeves; + / − were speed → [ / ]. G is noted as "reserved for the game" in `use-map-keys.ts`; no game exists, and it's used only here. Every other map letter (H, M, D, C, P, X, S) keeps its meaning.

## What is data and what is design

| Layer | Source | Data or design |
|---|---|---|
| Data frame on the globe | The app's own `sst.webp` / `rain.png` (SVS 5101 / 4285), land cut by the SST grid's no-data mask | **Data** (display image, same pixels as the flat map) |
| Every number, sound, ripple colour, particle rate, extreme ping | `valueAt()` on the existing grids; the frame's own pixel under the needle | **Data** |
| Day / night Earth, relief, ocean glint, atmosphere | NASA Blue Marble / Black Marble, Natural Earth relief, SST mask | Design |
| Sun / terminator | Computed from the frame time (`src/lib/geo/sun.ts`) | Design (decoration) |
| Borders, rivers, seas, places, districts, labels, search, where-am-I | Natural Earth, geoBoundaries, our story places | Orientation |
| Turntable, sleeves, animations | Procedural, own design | Design |

Rules kept: the grid decides land/ocean for sound and readout (realism layers never do); no number appears unless it comes from data/JSON (distances in "where am I" come from Natural Earth coordinates); the frame time and "latest available, N days old" are always shown; "Verification being updated" and "pending team approval" are unchanged; NASA's colormap is never recoloured (the legend bar shows the frame's range and the actual pixel colour, not a reconstructed colorbar; X-ray stays "coming in October").

## Assets, licences and credits

| Asset | Source | Licence | Credit |
|---|---|---|---|
| Blue Marble Next Generation (day) | NASA GIBS WMS `BlueMarble_NextGeneration` | NASA, open use | NASA Blue Marble |
| Black Marble 2016 (night) | GIBS `VIIRS_Black_Marble` | NASA, open use | NASA Black Marble |
| Shaded relief (bump) | Natural Earth `SR_50M` | Public domain | Natural Earth |
| Countries, coastlines, rivers, seas, places (`name_bn`) | Natural Earth v5.1.2, commit `ca96624` | Public domain | Natural Earth |
| Bangladesh districts (64) | geoBoundaries gbOpen BGD ADM2 (source BBS, OCHA ROAP) | CC BY 3.0 IGO | geoBoundaries |
| Story places | `public/geo/story-places.json` (team plan, Wikipedia coordinates, each with its source) | Facts | — |
| GIBS service | — | — | "Imagery via NASA GIBS (ESDIS)" |

Rebuild them with `node scripts/fetch-basemap.mjs [--hires]` (textures to `public/textures/`) and `node scripts/build-geo.mjs` (geography to `public/geo/`); each folder has a `SOURCES.json`. The credits strip at the end of the Turntable's side column reads: "Background: NASA Blue Marble · Night: NASA Black Marble · Relief: Natural Earth · Borders, places, rivers, seas: Natural Earth (public domain) · Districts: geoBoundaries (CC BY 3.0 IGO; source BBS, OCHA ROAP) · Imagery via NASA GIBS (ESDIS) · Data frames: NASA SVS 5101 / 4285 for the NASA Earth Information Center". The globe itself is labelled "Background: Blue Marble composite, not today's clouds".

## Verification (27 Oct 2026, production build, headless Edge on an RTX 3050 laptop GPU, Playwright)

**Unit tests (`bun run test`): 22/22.** Mapping round trip (1,000 points within 0.01°, exact cases within 1e-9°); subsolar point vs astronomy-engine for 3 dates: within **0.005°** (limit 1°): 25 Sep 00:00 UTC −0.774/177.957 vs −0.777/177.962; 28 Sep 08:30 UTC −2.080/50.171 vs −2.082/50.175; 21 Jun 12:00 UTC 23.435/0.457 vs 23.439/0.454; gazetteer and search cases.

**Values unchanged (before = v1, after = v2), exact equality:**

| Point | SST cell (v1 = v2 = 2D) | °C (v1 = v2 = 2D) |
|---|---|---|
| 13.50, 153.71 | 223157 | 29.846 |
| −54.08, 128.08 | 419692 | 4.105 |
| −16.68, −160.88 | 310326 | 27.243 |
| −51.75, 174.22 | 413679 | 7.972 |
| 56.74, 11.25 | 96800 | 16.175 |
| Dhaka 23.81, 90.41 | 193281 | land (silent) |
| Sahara 23, 10 | 195100 | land (silent) |

**Labels:** Dhaka, Chattogram, Khulna and St Martin's anchors raycast back to within **1.4e-14°** (limit 0.1°); all 54 labels on screen at that moment within 2.1e-14°.

**Reverse lookup:** 18.0 N 88.0 E → "Bay of Bengal" (341 km SE of Bhubaneswar). 23.81 N 90.41 E → "Dhaka, Bangladesh" (Dhaka District). 0 N 0 E → **"South Atlantic Ocean"**: Natural Earth's own name there (checked on the raw 10m file: its "Gulf of Guinea" polygon spans only ~3–6° N near the coast; 3 N 2 E gives "Gulf of Guinea"). Sundarbans (21.95 N 89.18 E) → **Satkhira District**, Bangladesh.

**Search:** "dhaka", "ঢাকা", "sundarbans", "bay of bengal", "cox" each fly to the right place; the needle lands within 6e-14° (limit 0.2°).

**Coastline vs data mask:** on 1,000 coastal SST cells (cells with a land/ocean neighbour), Natural Earth 10m land and the grid's no-data mask disagree at the cell centre on **27.2%** (219 grid-ocean / NE-land, 53 grid-land / NE-sea). On 1,000 cells anywhere: **1.7%**. Coastal grid cells are ~0.35° wide and average 4×4 source pixels, so a partly-ocean cell has a value even when its centre is on land. The grid decides sound and readout.

**Audio:** at 18 N 88 E (28.862 °C) after turning at 0.5×, 1×, 4×: rule 711.372 Hz each time, analyser 711.515 Hz each time. Rain particles vs the voice's drops/s at 3 points: rule 12.92 / 23.83 / 31.11, particles 12.89 / 23.78 / 31.07, audio drops 13.0 / 23.7 / 30.7. Record switching at a dry ocean point: largest sample step 0.0156 vs 0.0112 steady (the soft crackle grains; no click); the master cap and limiter are unchanged.

**Accessibility:** Lighthouse accessibility **100**; axe-core (WCAG 2.1 A/AA + best practice) **0 violations** in English and in বাংলা. Keyboard-only run: open → search ("/", type, arrows, Enter; "Arrived: Dhaka, Bangladesh…") → tour (T; Esc stops only the tour) → where am I (L) → record change (R) → Enter → Flat map (focus on the sound map): **11/11 steps pass**. Contrast (WCAG): body 15.4:1, panels 13.7:1, selected 11.7:1, secondary 5.9–7.7:1, card text over the worst case (scrim over white ice) 11.0:1 / secondary 5.5:1, labels vs halo 16.6:1, focus ring 9.5:1, control borders 7.7:1. Body text ≥ 16 px; controls ≥ 44 px.

**Performance (FPS while turning):** Jukebox 144 (display cap), **60–82 with 4× CPU slowdown**; close-up 143–144, **41–64 with 4× CPU**. JS heap after 20 record switches and 20 searches: 19.8 → 19.8 → 19.3 MB, and 19.5 MB after 40 of each (no growth). Tab download 3.29 MB.

**Regression:** `bun run lint`, `bunx tsc --noEmit`, `bun run build` pass. Explore (arrows, Enter, 1/2/3), sweep, storm time-lapse, Story (Esc ends it), Then vs Now, বাংলা toggle (`<html lang>` unchanged), Help: all pass. **No console errors or warnings** in production.

Screenshots: `docs/turntable-v2-screens/` — before (`before-*.png`) and after (`after-1280x720.png`, `after-1920x1080.png`, `after-390x844.png`), plus `v2-dhaka.png`, `v2-bay-of-bengal.png`, `v2-gulf-of-guinea-0n-0e.png`, `v2-rain-particles.png`, `v2-bangla.png`, `v2-help.png`, `v2-sleeve-details.png`.

### Bugs found and fixed during verification

- A leftover boolean in the loaded-texture object made the Earth's texture setup throw (silently, so the realistic textures never showed) and made leaving the Turntable crash the page. Fixed; all three ways out (Flat map, Esc, tab) checked.
- Label layout forced a page layout every frame (re-hiding every label ever created, reading the card size); 4× CPU close-up was 18–25 FPS. Fixed with horizon culling, change-only DOM writes, canvas text metrics and a ResizeObserver.
- three's PBR materials register on a module-level lookup texture (`DFG_LUT`) that kept every disposed renderer alive (the v1 leak); v2 releases it on unmount, so the deck can use `MeshPhysicalMaterial`.
- The phone layout overflowed sideways; fixed with a shrinkable grid column.

## Known limitations

- **Bangla:** Turntable strings are developer drafts (`src/components/Turntable/strings-bn.ts`), marked for a translator; the app's other strings (e.g. "No ocean data here") still show English; honesty wording and credits stay English on purpose. Districts and story places have no Bangla names in the sources, so they show in English.
- **Rivers:** Natural Earth names the Padma "Ganges" and the Jamuna "Brahmaputra" in Bangladesh, and leaves the Meghna unnamed in its 10m layer; labels follow Natural Earth.
- **Jamuna SWOT reach:** the team hasn't chosen the reach yet; the bookmark is Sirajganj on the Jamuna.
- **Esc** keeps its global meaning: with Help open, Esc closes Help *and* leaves the Turntable (as it already ends Story).
- **Extreme ping** is new logic (the app had only the earcon): the hottest/wettest cell on the needle's groove within ±70° of the view centre.
- **Drop timing while turning** (from v1): each new reading restarts the drop voice's next-drop timer, so over fast-changing rain the rate follows the rule only on average; at a fixed point it's exact.
- The 4096 basemap is soft at district zoom (≈10 km/px); 8192 is available in Texture quality.
- Not yet tested on a real phone or with a screen reader by a person; checks were automated.

## TODO hooks (typed, in code)

- **More records:** `RECORD_PLUGINS` in `Turntable/records.ts` — one entry per EIC area (air, forests, fire, energy, sea level, disasters, agriculture, water) with a grid loader, voice id, legend and image.
- **Bloop drop** (needle-drop cue with pitch = Bay of Bengal SST): `Turntable/needle-drop.ts`.
- **Proof in unison** (frame tone + NASA file tone): `Turntable/needle-sound.ts`.
- **Amphan cold scar, playable delta, satellite orrery** (sibling scenes): `Turntable/scene/index.ts`.
