# Turntable Earth v2: plan and audit

Branch: `feat/turntable-v2` (child of `feat/turntable-earth` at 5879ee5). Presentation only. Data, `valueAt()`, the sound mapping and every number stay exactly as in v1.

## 1. Audit of the v1 screen

Screens taken at 1280×720, 1920×1080 and 390×844 before any change: `docs/turntable-v2-screens/before-*.png`. Contrast was measured with the WCAG formula on the palette in `globals.css`.

| # | Problem | Cause (checked) | Fix |
|---|---|---|---|
| 1 | Bottom bar cut off on the left ("Turn", "Play sound") | In `next dev`, the Next.js dev indicator (round "N" badge, fixed bottom-left) sits on top of the caption, buttons and credits. Production builds don't show it | Turn the dev indicator off in `next.config.ts` (`devIndicators: false`). The error overlay still appears. Also give the bottom bar room so nothing touches the screen edge |
| 2 | Caption clipped ("…uiet: dry here") | The same badge covers its first letters. The caption is also `truncate` (one line, cut with an ellipsis) | As 1, plus allow the caption two lines instead of cutting it |
| 3 | Purple-on-purple, low contrast | Measured: `line` colour used as text 4.06:1 on night / 3.63:1 on dusk; "disabled" text at 50% 2.84:1 (both fail 4.5:1). Most other text passes (haze 5.9–7.7:1, moon 15.4:1) but is small and purple on purple | New text tokens with ≥ 4.5:1 for all text; no `line`-coloured text; locked records use full-contrast text + a lock icon instead of fading. Ratios reported in `docs/turntable.md` |
| 4 | Text too small | Record labels, frame label and badges use `text-small` (12.8 px) | Body ≥ 16 px everywhere in the Turntable view |
| 5 | Globe is small | Fixed cinematic camera, globe ≈ 30% of the canvas height; canvas capped at 60dvh beside a 17 rem record column and the 24 rem side panel | Two camera modes; Explore mode fills ~75% of the view with the globe. Side panel collapsible in Turntable. Records become a sleeve row under the stage |
| 6 | Tonearm is grey boxes; flat purple floor | Lambert boxes and cylinders, flat-shaded | PBR (`MeshPhysicalMaterial`) lit by three's `RoomEnvironment`: brushed-metal arm with pivot, counterweight, headshell and glowing stylus; vinyl platter with procedural grooves; contact shadow; warm dark studio backdrop, no floor plane |
| 7 | You can't tell where you are | No borders, coastlines, place names, graticule or "where am I"; lat/lon only in the readout | Natural Earth borders/coastlines/rivers/seas, Bangladesh districts, ranked city labels with collision avoidance, graticule, search, reverse lookup, bookmarks, tour, inset locator |
| 8 | Record cards are a wall of text | All metadata shown on every card, plus 8 "coming next" cards of equal weight | Record sleeves: cover = frame thumbnail; flip for the facts; coming-next sleeves small, dimmed artwork with a lock icon and a name |
| 9 | Data colours look washed out | The globe texture is the whole SST frame including NASA's grey land | Realistic Earth below; the data layer shows only the frame's ocean pixels (land cut by the SST no-data mask) and rain pixels, opacity 0–100% (default 85%) |
| 10 | Mobile (390 px): globe small, cards scroll off with long text | Same layout as desktop, squeezed | Stage first, full width; sleeves in a horizontal snap row; readout card below the globe |
| 11 | No legend | Only the number | Legend bar under the globe: the frame's own range from `value_range`, ticks at `mapping.json` legend values, a marker at the current value, and the actual pixel colour under the needle |

## 2. Globe approach: hand-built layers in our scene (not three-globe)

three-globe 2.45.6 (MIT, vasturiano) was the recommended option. I'm choosing the alternative because three-globe conflicts with three of the requirements:

1. **Bangla place names.** three-globe's labels layer builds 3D text from a typeface.js font (Helvetiker by default). Bangla needs complex-script shaping (conjuncts such as "ঢাকা" → "ঢা" + "কা", "চট্টগ্রাম"), which typeface geometry can't do, and a Bangla typeface JSON would be several MB. Labels must be HTML (browser text shaping, real fonts, readable at any size, crisp, and exposed to zoom/contrast settings).
2. **No collision avoidance** in three-globe labels; we need ranked, non-overlapping labels per zoom level.
3. **Exact alignment and size.** The data layer must use our unit-tested `latLonToSphere()` (three-globe's `polar2Cartesian` happens to share the axes, but its globe mesh and radius 100 are its own). Its dependency tree adds h3-js (7.7 MB unpacked), d3-geo/scale/array/color/chromatic, tween.js, kapsule and more for features we wouldn't use.

What we build instead (all in the existing three.js scene, all positioned with `latLonToSphere`):

- Earth sphere with a `ShaderMaterial`: day texture, night texture, a soft terminator from the sun direction, a subtle bump from relief, and a specular ocean mask (from the SST no-data grid, so no extra download).
- Atmosphere: Fresnel rim shader on a slightly larger back-face sphere.
- Data layer: a separate sphere at 1.002 R carrying the frame image (ocean pixels only, rain where wet), opacity uniform.
- Lines (borders, coastlines, districts, rivers, graticule): `LineSegments` built from GeoJSON with `latLonToSphere`, lifted 1.003 R.
- Labels and the readout card: HTML overlay, positioned by projecting the anchor each frame, back-face culled, greedy collision avoidance by rank.

## 3. Packages

| Package | Version | Licence | Use |
|---|---|---|---|
| three | 0.186.1 (already) | MIT | Scene, `RoomEnvironment`, `PMREMGenerator` (from `three/examples/jsm`) |
| mapshaper | 0.7.98 | MPL-2.0 | Dev only: simplify and clip geography in `scripts/build-geo.mjs` |
| sharp | 0.35.4 (already installed via Next; made explicit) | Apache-2.0 | Dev only: stitch, resize and encode WebP in `scripts/fetch-basemap.mjs` |
| fflate | latest | MIT | Dev only: unzip Natural Earth's shaded-relief raster |
| astronomy-engine | 2.1.19 | MIT | Dev only: reference sun position in the terminator unit test |
| axe-core, lighthouse | 4.14.0 / 13.5.0 | MPL-2.0 / Apache-2.0 | Verification only, installed outside the repo (not dependencies) |

No new runtime dependency.

## 4. External assets (downloaded once by scripts; nothing hot-linked at runtime)

| Asset | Source | Licence | Credit shown |
|---|---|---|---|
| Day surface: Blue Marble Next Generation | NASA GIBS WMS `BlueMarble_NextGeneration`, `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi` (service: AccessConstraints none, Fees none) | NASA imagery, open use ("NASA promotes full and open sharing of data") | "Background: NASA Blue Marble (composite, not today's clouds)" |
| Night lights: Black Marble 2016 | GIBS `VIIRS_Black_Marble` (TIME=2016-01-01) | Same | "Night: NASA Black Marble" |
| Relief for the bump map | Natural Earth 50m Shaded Relief `SR_50M.zip`, `https://naciscdn.org/naturalearth/50m/raster/SR_50M.zip` | Public domain | "Relief: Natural Earth" |
| GIBS service acknowledgement | GIBS API docs ask for it | — | "Imagery from NASA's Global Imagery Browse Services (GIBS), part of NASA's ESDIS" |
| Countries, coastlines (110m world; 10m South Asia), rivers, seas/oceans, populated places (with `NAME_BN`/`name_bn`) | Natural Earth v5.1.2 GeoJSON, `github.com/nvkelso/natural-earth-vector` pinned at commit `ca96624a56bd078437bca8184e78163e5039ad19` | Public domain ("No permission is needed to use Natural Earth"). NE notes some third-party sources granted NE a licence; NE distributes the result as public domain | "Borders, places, rivers, seas: Natural Earth (public domain)" |
| Bangladesh districts (ADM2, 64 units) | geoBoundaries gbOpen BGD ADM2, `github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM2/geoBoundaries-BGD-ADM2_simplified.geojson` (source: Bangladesh Bureau of Statistics, OCHA ROAP) | CC BY 3.0 IGO (confirmed via the geoBoundaries API) | "Districts: geoBoundaries (CC BY 3.0 IGO), source BBS / OCHA ROAP" |
| Story places | Our own list, `public/geo/story-places.json`, each with a source: Sundarbans 21.95 N 89.18 E and Madhupur 24.62 N 90.05 E (team plan P4 points); St Martin's Island 20.61306 N 92.32667 E and Lawachara NP 24.31972 N 91.78361 E (Wikipedia); Jamuna reach area: Sirajganj 24.460 N 89.705 E on the Jamuna (Wikipedia; the SWOT reach itself isn't chosen yet); Bay of Bengal 18.0 N 88.0 E (test point inside NE's "Bay of Bengal" polygon) | Facts (coordinates) | — |
| Data frames | Existing `public/data/latest/*` | NASA SVS | "Data frames: NASA SVS 5101 / 4285 for the NASA Earth Information Center" |

Texture sizes: 4096×2048 WebP by default, 2048×1024 on low-end/mobile, 8192×4096 opt-in (Quality setting). Expected tab download ≈ 3–4 MB at 4096 (textures ≈ 2.5 MB, geography ≈ 1 MB, three.js chunk ≈ 0.55 MB), all lazy.

## 5. Design layers vs data (unchanged honesty rules)

- Realism layers are decoration. Every number, sound, highlight, ripple colour and particle rate comes from `valueAt()` on the existing grids (or the frame's own pixels for the colour swatch).
- Where Natural Earth and the SST no-data mask disagree about land/ocean, the grid wins for sound and readout. The mismatch rate on 1,000 coastal points is reported.
- The sun position is computed from the frame time with a small tested function; toggle "Sun at frame time / Always day".
- Labels say "Background: Blue Marble composite, not today's clouds".

## 6. Keys and clashes (resolved inside the Turntable only; Explore keeps its keys)

| Key | v2 Turntable | Clash and resolution |
|---|---|---|
| ← → / ↑ ↓ (Shift ×10) | Turn / needle latitude (as v1) | — |
| Space, Enter, R / Shift+R, Esc | As v1 | Esc first stops a tour or fly-to, or closes search; otherwise its global meaning (stop all, back to the flat map) |
| / or G | Search | G is noted as "reserved for the game" in `use-map-keys.ts`; no game exists. Used only inside the Turntable |
| L | Where am I | Map's L = legend. On the Turntable the legend moves to Shift+L |
| 1–9 | Bookmarks (story places) | v1 used 1/2/3 for records; records stay on R / Shift+R and the sleeves |
| T | Tour | Map's T = Then vs Now. Then vs Now stays one click/Tab away in the mode tabs |
| + / − | Zoom | v1 used them for turning speed; speed moves to [ and ] |
| V | Jukebox / Explore camera | — |
| O | Data overlay opacity (steps 0, 25, 50, 85, 100%) | — |
| H, M, D, C, P, X, S | Unchanged | — |

## 7. Shared files I expect to touch (minimal)

`next.config.ts` (dev indicator), `CaptionBar` (wrap instead of cut), `JukeboxApp` + `SidePanel` (collapsible column in Turntable only), `use-global-escape.ts` (let a view consume Esc first), `HelpDialog` + i18n (new keys), `audio-adapter` earcon (vinyl crackle added to the existing needle-drop cue), `globals.css` (new colour tokens). No change to data, `mapping.json`, `valueAt`, the Truth wording or the data contract.

## 8. Verification plan

Values before/after (same 7 points as v1, exact equality), label anchors raycast within 0.1°, reverse lookup cases, search cases (needle within 0.2°), coastline-vs-mask mismatch on 1,000 coastal cells, subsolar point vs astronomy-engine for 3 dates (≤ 1°), pitch at 0.5/1/4×, rain particle rate = audio drops/s at 3 points, Lighthouse accessibility, axe-core (0 serious), keyboard-only run (search → tour → where am I → record → flat map), contrast table, FPS normal and 4× CPU, tab download size, heap after 20 record switches and 20 searches, regression of all modes, screenshots at 1280×720 / 1920×1080 / 390×844 in `docs/turntable-v2-screens/`.

## 9. Decisions confirmed (27 Oct 2026)

- **Bangla:** a Turntable-only string table with drafted Bangla, marked "draft, needs a translator", and `lang="bn"` on those elements. `bn.ts` and `<html lang>` for the rest of the app stay unchanged. Place names use Natural Earth `name_bn`.
- **Globe:** hand-built layers in our scene, with HTML labels (not three-globe).
- **Legend:** neutral bar with the frame's range and ticks, a value marker and the actual pixel colour under the needle. No reconstructed colormap; X-ray stays "coming in October".
- **Dev badge:** `devIndicators: false` in `next.config.ts`.

## 10. Hooks for later records

A typed record registry (`RecordSpec`): each future EIC area (air, forest, fire, energy, sea level, disasters, agriculture, water) becomes live with one entry that names its grid loader, `valueAt` track, voice id (from `mapping.json`) and legend range. Until then each entry is `status: "coming"` with no data and no sound.
