# Turntable v3: plan (art direction and rendering rebuild)

Branch: `feat/turntable-v3` (child of `feat/turntable-v2` at 78a10af). Presentation only: every feature, number and sound behaviour stays as in v2. Data, grids, the pipeline, `mapping.json`, `valueAt()`, the Truth wording and the data contract are not touched.

## 0. What the app is built on (checked)

- Next.js 16.3.6, React 19.2.8, TypeScript strict, Tailwind 4, shadcn/ui on **Base UI** (`@base-ui/react` 1.8; `src/components/ui/*`).
- v2 Turntable: plain three.js 0.186.1, an imperative scene (`Turntable/scene/*`) driven by one requestAnimationFrame loop in `use-turntable.ts` (pose → `readNeedle()` → sound control at 30 Hz → cursor sync at 4 Hz). Labels, needle marks and the readout are HTML overlays fed by `subscribe()`.
- Fonts: Anek Bangla (variable, Latin + Bengali) and Tiro Bangla via `next/font/google` (self-hosted at build time, OFL).

## 1. Stack (versions pinned; installed on this branch)

| Need | Use | Version | Licence | Notes |
|---|---|---|---|---|
| Scene graph | **React Three Fiber** | 9.8.2 | MIT | Peer: React ≥19 <19.4, three ≥0.156 ✓ |
| Helpers | **@react-three/drei** | 10.7.9 | MIT | `Environment` (local file), `ContactShadows`. `Html`/`Text`: see deviations |
| Atmosphere | **@takram/three-atmosphere** (+ `@takram/three-geospatial`) | 0.19.1 (0.9.1) | MIT | Peer: three ≥0.170, postprocessing ≥6.36.7 ✓. Scattering LUTs generated on the GPU by `PrecomputedTexturesGenerator` (no download) |
| Post-processing | **postprocessing** (vanilla classes) | 6.39.5 | **Zlib** | Zlib (not MIT); permissive. Peer three ≥0.168 <0.187 ✓ (we're on 0.186.1). `@react-three/postprocessing` was tried and dropped: the chain needs a custom overlay pre-pass and strict ordering around takram's effect, which is simpler as one imperative module (`scene/post.ts`) |
| Ambient occlusion | postprocessing's **SSAOEffect** + `NormalPass` | 6.39.5 | Zlib | Ultra only. n8ao was dropped: it ships no TypeScript types |
| Scene easing | **maath** | 0.10.8 | MIT | `easing.damp*` for the camera, arm and record lift |
| UI motion | **motion** | 14.7.1 | MIT | Checkpoint B (chip, card, dock) |
| HDRI | Poly Haven **studio_small_09**, 1K `.hdr` (1.6 MB), stored in `public/textures/studio/` | — | CC0 | Reflections on vinyl, metal, glass. Lighting only; never shown as a background |
| KTX2 encoding | **ktx2-encoder** (basis_universal compiled to WASM; runs in Node) | 0.6.0 (dev only) | MIT (basis_universal: Apache-2.0) | No native `toktx` needed. The WASM encoder caps an image at 12 Mpix, so 8192×4096 maps are written as 2×2 tiles of 4096×2048 and merged at load time into one compressed texture (block rows copied per mip level, `textures.ts`) |
| KTX2 decoding | three's `KTX2Loader` + `basis_transcoder.{js,wasm}` copied from `three/examples/jsm/libs/basis/` to `public/basis/` | three 0.186.1 | MIT / Apache-2.0 | Served locally |
| Geo layers | v2's Natural Earth + geoBoundaries | unchanged | PD / CC BY 3.0 IGO | Already credited |

**Considered and not used:** CesiumJS (ion token for imagery/terrain, heavy, fights the turntable metaphor); `@takram/three-clouds` (no views from space yet); Theatre.js (core is Apache-2.0 but the studio is AGPL-3.0; the four camera moves are short enough to author as eased code paths, so no runtime is shipped); takram's `Stars` (its default data URL hot-links GitHub; we draw our own faint procedural star field, labelled design).

### Deviations from the brief (and why)

1. **UI primitives: Base UI instead of Radix.** The app's shadcn/ui is already built on Base UI (MIT, by the Radix/Floating UI/MUI authors) and AGENTS.md asks for shadcn components. Base UI has the same pieces with managed focus and ARIA: `Popover`, `Dialog`/`Drawer` (shadcn `sheet`), `Tooltip`, `ToggleGroup`, plus a `Combobox` listbox for search results. Adding Radix as well would ship two primitive libraries. If you want Radix anyway, say so before Checkpoint B.
2. **Globe labels stay HTML (restyled), not troika SDF text.** troika-three-text does bidi and Arabic joining but **no Indic shaping**: Bangla conjuncts ("চট্টগ্রাম", "ঢাকা" with its vowel signs) render as broken glyph runs. That was the v2 reason for HTML labels and it still holds. v3 labels become sentence-case, light weight, small, with a soft shadow instead of an outline, faded by angle-to-camera and zoom tier, and never over the needle. The record's centre label is a canvas texture drawn by the browser (so Bangla shapes correctly), not troika.
3. **The data layer is composited after tone mapping.** AgX/ACES tone mapping, bloom and vignette would shift NASA's colormap hues, which breaks the legend. The data sphere is rendered into its own target (occluded by the arm and deck via a depth-only pre-pass) and blended over the final image *after* tone mapping, before SMAA. Its only shading is a scalar light factor (lightness, never hue) so it sits in the scene. Clouds, bloom, DOF and particles can therefore never cover or tint the value being read.
4. **R3F hosts the scene, but v2's loop stays the clock.** The `<Canvas>` runs with `frameloop="never"`; `use-turntable`'s existing loop calls R3F's `advance()` after it has set the pose, read the needle and ticked the sound. The tested pose → `readNeedle()` → sound path is unchanged, and the `TurntableScene` API (`setPose`, `readNeedle`, `pick`, `project`, …) keeps its shape, so pointer, labels, debug and tests keep working. v2's imperative modules (overlay lines, particles) are mounted with `<primitive>` rather than rewritten.
5. **takram via its vanilla classes.** Its R3F `<AerialPerspective>` defaults a blue-noise texture to a GitHub URL (a hot-link), so `AerialPerspectiveEffect` + `PrecomputedTexturesGenerator` are used directly (nothing is fetched; the LUTs take ~10 s on this GPU at first load). The model's sun is scaled ×5 (`SUN_MATCH`, a design constant) so its haze matches the Earth shader's brightness.
6. **takram at globe scale.** Our globe has radius 1. A `worldToECEFMatrix` maps it to ECEF: scale 6,360 km per unit plus a Y-up → Z-up basis change, with a spherical `Ellipsoid` (our grids are spherical). We use `AerialPerspective` for **transmittance + inscatter only** (`sunLight`/`skyLight` off: the Earth shader does its own lighting because it needs night lights, glint and the data layer). The blue limb outside the disc comes from the same effect: the studio backdrop is real geometry far behind the globe, so rays that graze the atmosphere pick up inscatter over it. The `Sky` pass is off (it would replace the studio with black space). If this misbehaves at globe scale, the fallback is a matched analytic approximation (Rayleigh-tinted rim + terminator band), and I'll say so at Checkpoint A.

## 2. Earth assets (all downloaded once by `scripts/build-earth-textures.mjs`; nothing hot-linked)

| Map | Source (exact file) | Licence / credit | Shipped |
|---|---|---|---|
| Day albedo | NASA Visible Earth, Blue Marble Next Generation **with topography and bathymetry**, monthly 2004 composites at 21600×10800 (2 km/px): `eoimages.gsfc.nasa.gov/images/imagerecords/73000/<id>/world.topo.bathy.2004MM.3x21600x10800.jpg`, ids Jan 73580, Feb 73605, Mar 73630, Apr 73655, May 73701, Jun 73726, Jul 73751, Aug 73776, **Sep 73801**, Oct 73826, Nov 73884, Dec 73909 (all 12 checked: HTTP 200) | NASA content, not subject to US copyright; "NASA Earth Observatory, Blue Marble Next Generation" (Reto Stöckli) | Month = the frame's month (both live frames are September: SST 25 Sep, rain 28 Sep → `09`). 8192×4096 and 4096×2048 |
| Topography / bathymetry → normal map | Visible Earth 73934 `gebco_08_rev_elev_21600x10800.png` (land) and 73963 `gebco_08_rev_bath_21600x10800.png` (sea floor) | NASA Earth Observatory (GEBCO 2008 grid; Visible Earth says the GEBCO data are free to use with credit) → credit "Topography: NASA Earth Observatory / GEBCO" | Normal map 4096×2048. Subtle on land; a faint sea-floor tone at shallow seas |
| Night lights | Visible Earth 144898 "Earth at Night (Black Marble) 2016", `BlackMarble_2016_3km.jpg` (13500×6750) | NASA Earth Observatory (Joshua Stevens, Suomi NPP VIIRS data from Miguel Román, NASA GSFC) | 8192 / 4096; emission on the night side only |
| Clouds (optional) | Visible Earth 57747 "Blue Marble: Clouds", `cloud_combined_8192.tif` | NASA Earth Observatory / Visible Earth | 8192 / 4096 (Ultra only). Fades out in Close-up and while a value is read. Labelled "not today's clouds" |
| Ocean / glint mask | Our SST grid's no-data mask (built at runtime, as v2) | Data mask | No download |
| Studio HDRI | `dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr` | CC0 (Poly Haven) | 1.6 MB |

Every file is written as KTX2 (ETC1S for colour/clouds/night, UASTC for the normal map) plus a WebP fallback. `public/textures/earth/SOURCES.json` records URL, licence, credit, month and the SHA-256 of each download. No NASA insignia or logos are used anywhere (NASA Brand Center rules); credits are text only. The v2 GIBS textures stay in `public/textures/` until v3 replaces them, then are removed.

**Licences: I'm treating these as clear.** NASA Earth Observatory / Visible Earth imagery is NASA-produced (Blue Marble NG, Black Marble, cloud composite) and carries the standard NASA media guidance. The GEBCO-derived topography is credited to GEBCO too. If you know of a restriction I've missed, stop me here.

## 3. Rendering

**Earth** (`ShaderMaterial`, one pass): day albedo × Lambert from the frame-time sun (v2's tested `subsolarPoint`), normal map (tangent frame from the sphere), night lights × (1 − day) with a soft, slightly warm terminator band, ocean specular (GGX) and a Fresnel-tinted ocean at grazing angles from the water mask, emissive city lights > 1.0 so only they reach the bloom threshold. Then takram aerial perspective.

**Data layer**: separate sphere at 1.0015 R, ocean only (land transparent from the no-data mask), opacity slider, rendered into its own target and composited after tone mapping (section 1, deviation 3). Optional lit/terminator factor: lightness only.

**Clouds** (Ultra): a shell at 1.006 R with alpha from the cloud map; soft cast shadow by sampling the cloud map along the sun direction in the Earth shader. Fades with Close-up blend and while a reading is shown.

**Post chain** (pmndrs `EffectComposer`, HalfFloat): AerialPerspective → N8AO (Ultra) → selective bloom (luminance threshold 1.0 on HDR emissives: stylus tip, city lights, needle ripple) → DOF (Ultra, Jukebox view only, focus on the globe) → AgX tone mapping → vignette (subtle) → **data composite** → SMAA.

**Turntable** (own design, no brand likeness): smoked-glass plinth over a dark anodised base, bevelled; dark vinyl with procedural grooves (normal map), anisotropic sheen and clearcoat; centre label with the record name and frame time; brushed-aluminium tonearm (anisotropy) with pivot, bearing ring, counterweight, headshell, thin cable, stylus tip glowing with the needle value's colormap colour; the globe floats a few centimetres above the spindle on a faint glass rod; `ContactShadows` under the deck. Background: deep warm near-black studio (backdrop geometry), faint procedural stars visible only in Close-up. No floor plane.

**Quality tiers** (auto, overridable in Settings):

| Tier | Textures | Clouds | AO | DOF | Bloom | Auto rule |
|---|---|---|---|---|---|---|
| Ultra | 8K | yes | N8AO | Jukebox only | full | `deviceMemory ≥ 8`, ≥ 8 cores, desktop pointer, max texture ≥ 8192 |
| High | 8K | yes | no | no | full | desktop otherwise |
| Low | 4K | no | no | no | half-res, fewer mips | coarse pointer + small screen, `deviceMemory ≤ 4`, ≤ 4 cores, or max texture < 8192 |

**Download budget (estimate, checked after the build script runs):** High ≈ day 8K ETC1S ~5 MB + night 8K ~2 MB + normal 4K UASTC ~6 MB + clouds 8K ~4 MB + HDRI 1.6 MB + geography ~1 MB + JS ~1.5 MB ≈ 21 MB (target ≤ 25). Low ≈ 4K day/night/normal ~5 MB + HDRI + geography + JS ≈ 8 MB (target ≤ 8; if over, Low uses a 512 px HDRI and drops the normal map).

## 4. UI (Checkpoint B; summarised here so the plan is complete)

Default screen = globe + needle chip + slim legend + dock. Details card (I / Enter / hover; auto-collapse 4 s, not under keyboard focus or a screen reader; pin), dock (Play/Pause, Speed, Search, Where am I, Tour, Records, Jukebox/Close-up, Layers, Settings, Help), records carousel (R), Layers drawer (data opacity, clouds, labels, borders, districts, rivers, graticule, night side, quality, mixer), "How we know" drawer (Truth / Mapping / Provenance / History, closed by default), compact search (/), caption line above the dock (fades after 3 s), tiny Credits link. Palette: near-black, warm off-white, amber accent; contrast ≥ 4.5:1. Fonts: keep the app's Anek Bangla (display, big numbers ≥ 40 px) and pair it with Tiro Bangla for text; both cover Latin and Bengali.

**Keys.** Every v1/v2 key stays. New: **I** = details card (free on the map and in v2). **D clashes**: D is "describe on/off" on the map and in the v2 Turntable. Resolution: D keeps "describe"; **Shift+D** focuses the dock (same pattern as v2's L / Shift+L). Help updated in English and Bangla.

## 5. Motion (after Checkpoint B)

Intro ≤ 4 s once per session (skippable), record swap ≤ 1.2 s, great-circle fly-to with ease-in-out, one ripple per reading, rain particles at the audio's drops/s (existing rule), idle rotation + 30 s hint. Reduced motion: no intro, cuts instead of arcs, no auto-rotate, no particles, no DOF.

## 6. Process and checkpoints

1. **Checkpoint A (look-dev):** stills in `docs/turntable-v3-screens/lookdev/` (Jukebox product shot; Close-up Bay of Bengal with SST at 85%; night side over South Asia with city lights) with FPS on this machine. **Stop for approval.**
2. **Checkpoint B:** calm UI wired; screenshots at 1920×1080, 1280×720, 390×844. **Stop.**
3. Motion, accessibility, performance, tests, docs, recording, draft PR text (`docs/turntable-v3-pr.md`; no PR opened).

## 7. Verification (section 8 of the brief, unchanged)

Values at the same 7 points (exact equality with 2D `valueAt`); alignment crops (Bay of Bengal coast, Strait of Gibraltar) at 8K; 1,000-point coastal mismatch; terminator vs astronomy-engine for 3 dates (≤ 1°) and night lights only on the night side; Blue Marble month = frame month (unit test on the month picker); chip vs needle at 20 random positions; details auto-collapse; v2 search / tour / where-am-I tests; pitch at 0.5/1/4×; particles = drops/s at 3 points; Lighthouse ≥ 95; axe 0 serious; keyboard-only run; reduced-motion run; contrast table; FPS per tier (desktop High ≥ 60; Low measured with CPU/GPU throttling, since no Android device is attached to this machine; I'll say so); download per tier; heap after 20 swaps + 20 fly-tos; build, type-check, lint; other modes unchanged; no console errors.

## 8. Shared files I expect to touch

`package.json`/`bun.lock` (dependencies above), `next.config.ts` (only if R3F/takram need `transpilePackages`), `globals.css` (v3 tokens: near-black, warm off-white, amber), `HelpDialog` + i18n (I, Shift+D), `CaptionBar` (Turntable caption line), the Turntable folder. Nothing in `lib/data`, `lib/audio`, `pipeline/`, `public/data/` or the Truth wording.
