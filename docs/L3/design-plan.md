# L3 Design Plan: "Night over the Bay"

Status: draft for review (Phase 1). No UI code has been written.
Owner: L3 (Interface / Accessibility). Source of truth for scope: `docs/TEAM_BUILD_PLAN.md` §9, §11, §16.

---

## 1. Concept

The app is an instrument for listening to the planet. The map is the stage; the chrome recedes like a concert hall at night so NASA's colours and the sound are the performance.

One accent colour marks everything that **listens or points**: the cursor, the sound rings, the sweep ring, the playhead, the live waveform and focus rings. Nothing else uses it.

### 1.1 What changed from the brief's starting direction, and why

**Marigold is replaced by shapla pink.** I measured the hue of every pixel in today's real frames (`latest/sst.webp`, `latest/rain.png`, `sequence/rain_000.png`, `sequence/rain_020.png`), in 15° bins, ignoring greys:

| Hue band | Ocean temperature (SST) | Rain |
|---|---|---|
| 0°–45° (red → orange) | 31.7% | 3.9% |
| **45°–75° (marigold, yellow)** | 0% | **17.1%** |
| 75°–165° (yellow-green → green) | 0% | 65.1% |
| 180°–240° (cyan → blue) | 33.3% | 13.6% |
| **255°–330° (violet → magenta → pink)** | **0%** | **0% (≤ 0.02% in the time-lapse)** |
| 345°–360° | 1.3% | 0% |

Marigold (~45°) sits in the rain colormap's light-rain yellow, so a marigold cursor over a rain band would read as data. That breaks the brief's own rule ("UI chrome must never use colours that could be mistaken for data colours"). The only hue range that neither NASA colormap uses is **255°–330°**, so:

- **All chrome lives in that range.** The surfaces are indigo (hue ~248°, low lightness).
- **The accent is shapla pink** (hue 326°). The shapla, a water lily, is the national flower of Bangladesh. It floats on the water where the sound rings spread, so it fits the "monsoon country" story.
- **The background moves from navy `#0F2236` to indigo `#15122A`.** Navy is hue 211°, the same family as the ocean temperature frame's cold polar water (`#003462`) and the rain colormap's frozen blues. The indigo sits outside both.

This rule came from measuring the data, not from taste. It will be re-run on any new frame type we add.

---

## 2. Tokens

Colours are declared once in `src/app/globals.css` (Tailwind v4 `@theme`) and then mapped onto shadcn's variables (`--background`, `--primary`, `--ring`, and so on). No arbitrary Tailwind colour values anywhere.

| Token | Hex | Hue / saturation | Role |
|---|---|---|---|
| `--night` | `#15122A` | 248° / 0.57 | App background |
| `--dusk` | `#201C3A` | 248° / 0.52 | Raised surfaces: top bar, bottom bar, side sheet |
| `--tide` | `#2C2750` | 247° / 0.51 | Selected tab, pressed toggle, hovered row |
| `--land` | `#26223F` | 248° / 0.46 | Land fill under the rain frame (from the ocean temperature no-data mask) |
| `--line` | `#7870A8` | 250° / 0.36 | Input and control boundaries, coastlines |
| `--moon` | `#EDEAF6` | 255° / 0.05 | Primary text |
| `--haze` | `#ABA4C8` | 252° / 0.18 | Secondary text |
| `--shapla` | `#FF9BD4` | 326° / 0.39 | The only accent: cursor, rings, sweep, playhead, waveform, focus |
| `--ink` | `#0B0918` | 248° / 0.62 | Cursor outline; text on a shapla fill |
| `--scrim` | `--night` at 88% | n/a | Plate behind on-map text |

There's no red, green or blue anywhere in the chrome. Status and warnings use a **shape and a word**, never a colour:

| Status | Treatment |
|---|---|
| Pending team approval | Dashed `--line` outline, text "Pending team approval" |
| Interim sound engine | Small sine glyph and text "Interim sound engine" |
| Error | Notched square glyph and a plain sentence in `--moon` |
| Coming in October | Hollow circle glyph and text "Coming in October" |

### 2.1 Contrast (computed, WCAG 2.x relative luminance)

| Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|
| `--moon` text | `--night` | 15.37 | 4.5 | Pass |
| `--moon` text | `--dusk` | 13.74 | 4.5 | Pass |
| `--moon` text | `--tide` | 11.70 | 4.5 | Pass |
| `--haze` text | `--night` | 7.71 | 4.5 | Pass |
| `--haze` text | `--dusk` | 6.89 | 4.5 | Pass |
| `--haze` text | `--tide` | 5.87 | 4.5 | Pass |
| `--shapla` (focus ring, waveform, UI) | `--night` | 9.46 | 3.0 | Pass |
| `--shapla` | `--dusk` | 8.45 | 3.0 | Pass |
| `--shapla` | `--tide` | 7.20 | 3.0 | Pass |
| `--ink` text | `--shapla` fill | 10.21 | 4.5 | Pass |
| `--line` boundary | `--night` / `--dusk` / `--tide` | 4.06 / 3.63 / 3.09 | 3.0 | Pass |
| `--line` coastline | `--land` | 3.39 | 3.0 | Pass |
| `--moon` text | `--scrim` over a pure white pixel (worst case) | 8.3 at 80%, higher at 88% | 4.5 | Pass |
| `--haze` text | `--scrim` over a pure white pixel (worst case) | 5.53 at 88% | 4.5 | Pass (fails at 80%, which is why the scrim is 88%) |

Adjusted during the check: `--line` started as `#5A5280` (2.56:1) and was raised to `#7870A8`, and the scrim went from 80% to 88% opacity. `--moon` on `--shapla` is only 1.63:1, so white text on a pink fill is banned; use `--ink`.

`--land` against `--night` is only 1.20:1 on purpose, because the land fill is a quiet background. Land/ocean information comes from the 3.39:1 coastline stroke, which meets WCAG 1.4.11 for non-text graphics.

### 2.2 The cursor on every colormap

The cursor is a **two-colour ring**: a 2 px `--shapla` ring with a 1.5 px `--ink` outline inside and outside. On any data colour, at least one of the two reaches 3:1.

| Data colour (sampled or colormap end) | `--shapla` vs it | `--ink` vs it | Visible by |
|---|---|---|---|
| SST land grey `#696969` | 2.85 | 3.59 | ink |
| SST cold polar navy `#003462` | 6.53 | 1.56 | shapla |
| SST warm red `#8A302A` | 4.29 | 2.38 | shapla |
| SST peach `#BE724E` | 1.91 | 5.35 | ink |
| SST light blue `#5E758F` | 2.47 | 4.14 | ink |
| Rain yellow `#FFFF00` | 1.80 | 18.34 | ink |
| Rain green `#00FF00` | 1.41 | 14.35 | ink |
| Rain red `#FF0000` | 2.07 | 4.92 | ink |
| Snow cyan `#40C0FF` | 1.07 | 9.57 | ink |
| White | 1.93 | 19.69 | ink |

This will be re-checked on screen against the real colorbars once L1 publishes them (see `contract-proposals.md`).

### 2.4 Colour-vision deficiency check (added before the Phase 2 checkpoint)

**Method:** Machado, Oliveira and Fernandes (2009) simulation matrices at full severity, applied in linear RGB. Contrast is computed on the simulated colours. The cursor passes if at least one of its two rings reaches 3:1.

**Sample colours (`--shapla` / `--ink` contrast under each simulation):**

| Data colour | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|
| SST land grey `#696969` | 2.55 / **3.58** | **3.05** / **3.59** | 2.75 / **3.58** |
| SST cold polar navy `#003462` | **5.46** / 1.67 | **7.31** / 1.50 | **5.83** / 1.69 |
| SST warm red `#8A302A` | **4.68** / 1.95 | **4.12** / 2.66 | **4.16** / 2.37 |
| SST peach `#BE724E` | 1.97 / **4.64** | 1.88 / **5.81** | 1.85 / **5.30** |
| SST light blue `#5E758F` | 2.12 / **4.31** | 2.71 / **4.04** | 2.36 / **4.17** |
| Rain yellow `#FFFF00` | 1.86 / **16.96** | 1.62 / **17.77** | 1.76 / **17.26** |
| Rain green `#00FF00` | 1.69 / **15.43** | 1.23 / **13.46** | 1.46 / **14.33** |
| Rain red `#FF0000` | 2.97 / **3.07** | 1.77 / **6.17** | 2.00 / **4.92** |
| Snow cyan `#40C0FF` | 1.17 / **10.66** | 1.24 / **8.85** | 1.05 / **10.33** |
| White `#FFFFFF` | 2.15 / **19.64** | 1.80 / **19.72** | 2.00 / **19.65** |

Every row passes (bold = at least 3:1). The tightest is rain red under protanopia, at 3.07:1 from the ink ring.

**Every pixel, not just samples.** Ten samples can miss the failure zone, so the same test ran on every opaque pixel of `latest/sst.webp`, `latest/rain.png`, `sequence/rain_000.png` and `sequence/rain_047.png`. It found a real problem with the first pink:

| Pixels where neither ring reaches 3:1 | Normal vision | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| Original `--shapla` `#F58BCB`, ocean temperature frame | 0.47% | **3.32%** | 0% | 0.47% |
| Original `--shapla` `#F58BCB`, rain frames | ≤ 0.02% | ≤ 0.51% | 0% | 0% |
| **New `--shapla` `#FF9BD4`, all four frames** | **0%** | **0%** | **0%** | **0%** |

The failing pixels were mid-luminance ocean reds: too light for the ink ring and too dark for the old pink. Under protanopia the pink's simulated luminance drops, which widened that gap.

**Fix:** `--shapla` changed from `#F58BCB` to `#FF9BD4`. The hue stays inside the 255°–330° gap (326°), and every table in §2 above has been updated.

### 2.3 Shape tokens

Radius has a hierarchy; it isn't one value everywhere:

| Element | Radius |
|---|---|
| Map | 0 (full bleed) |
| Side sheet, bottom sheet, dialogs | 14 px, **only on the edge facing the map**, so a sheet looks attached to the frame rather than floating |
| Buttons, toggles, sliders, tabs | 6 px |
| Readout plate | 0 on the side touching the map edge, 6 px on the open corner |

- **Focus ring:** 2 px `--shapla`, with a 2 px `--night` gap (`outline-offset: 2px`). The gap keeps it visible on `--tide` and on a pink-filled button.
- **Shadows:** none. Depth comes from the surface steps `--night` → `--dusk` → `--tide`.

---

## 3. Typography

Both families were checked in `next/font/google`'s own list (installed Next 16.3.6) and in the font files from `google/fonts`.

| Family | Available | Axes / weights | Subsets | Used for |
|---|---|---|---|---|
| **Anek Bangla** | Yes | Variable: `wght` 100–800, **`wdth` 75–125** | bengali, latin, latin-ext | All UI, the readout |
| **Tiro Bangla** | Yes | 400 only | bengali, latin, latin-ext | Story Mode narration and captions only |

No Noto fallback is needed. Both fonts have U+2212 (minus sign), U+00B0 (°) and U+2009 (thin space), so "−5.82 cm" and "28.4 °C" render properly.

### 3.1 Tabular figures: Latin digits yes, Bengali digits no

I read the fonts' OpenType tables:

- **Anek Bangla has `tnum`.** It makes every Latin digit 1107 units wide, so `font-variant-numeric: tabular-nums` works for English.
- **`tnum` does not cover Bengali digits (০–৯).** Their widths stay between 1124 and 1505 units, so a Bangla readout would still jump.
- **Tiro Bangla has no `tnum` at all.** That doesn't matter, because it's never used for changing numbers.

**Fix for the Bangla readout only:** each digit goes in its own fixed-width cell, `display: inline-block; width: 0.76em; text-align: center`. The width is the widest Bengali digit (1505/2000 em), rounded up. This only affects the hero readout; running text keeps natural spacing. The screen reader gets the plain string, not the cells.

### 3.2 Scale (ratio 1.25, base 16 px)

| Step | Size | Font / settings | Used for |
|---|---|---|---|
| −1 | 12.8 px | Anek 500, wdth 100 | Badges, chart axis labels |
| 0 | 16 px | Anek 400, wdth 100, line-height 1.5 | Body, panel text, controls |
| 1 | 20 px | Anek 500, wdth 100 | Panel headings, coordinates in the readout |
| 2 | 25 px | Anek 600, wdth 100 | App title, dialog titles |
| 2 (serif) | 25 px | Tiro 400, line-height 1.45 | Story Mode narration line |
| 1 (serif) | 20 px | Tiro 400 | Caption bar |
| 5 | 48.8 px (mobile) / 61 px (desktop) | **Anek 350, wdth 112**, tabular, line-height 1.0 | **The readout value** (weight chosen by test, §3.3) |

- **The readout is the typographic hero.** It uses a light weight, slightly extended through the `wdth` axis, like the scale on an instrument dial.
- **The unit sits apart from the value.** "°C" and "mm/h" are at step 1 in `--haze`, baseline-aligned and separated by a thin space, so the number stands alone.
- **Sentence case everywhere.** No all-caps, no letter-spaced eyebrows and no monospace. Small labels use Anek at step −1.
- **Bangla:** `lang="bn"` on the root when Bangla is active, and line-height goes up to 1.6 for body text, because Bengali conjuncts need the room.

### 3.3 Readout weight test at 200% zoom (added before the Phase 2 checkpoint)

**Setup:**
- Headless Edge with `--force-device-scale-factor=2`, which renders like 200% zoom.
- The real Anek Bangla variable font at `wdth` 112.
- Weights 300, 350 and 400.
- Two renders:
  - desktop: 61 px, Latin digits, on the 88% scrim over a real crop of the ocean temperature frame (Arabian Sea: grey land and warm red);
  - mobile: 48.8 px, Bengali digits in the fixed-width cells from §3.1.

**Results:**

| Weight | Latin digits (61 px) | Bengali digits (48.8 px) |
|---|---|---|
| 300 | Legible. Strokes are thin but clean. | **Too thin.** The loops of ৮ and ৪ and the tail of ২ become hairlines, and the counters start to close up visually. |
| **350** | Legible, still reads as light. | **Clearly legible.** Every stroke holds. |
| 400 | Legible, but heavier than needed. It loses the instrument-dial lightness. | Legible, no gain over 350. |

**Choice: 350.** It's the lightest weight that stays clearly legible in **both** scripts, and one weight is used for both so the readout doesn't change character when the language switches.

The test page and screenshot are not committed (they were scratch files).

---

## 4. Layout

### 4.1 Desktop (≥ 1024 px)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ♪ Earth Information Jukebox    Explore | Story | Then vs Now    Ocean Rain Both    │ top bar (--dusk)
│                                                   Describe  EN / বাংলা  Help         │
├────────────────────────────────────────────────────────────────┬────────────────────┤
│                                                                ╭ Truth              │
│                                                                │ Mapping            │
│                        EIC FRAME (full bleed, 2:1)             │ Provenance         │ one side sheet,
│                              ◎ cursor + sound rings            │ History            │ vertical tabs,
│                                                                │                    │ 14 px radius
│ ┌──────────────────────────────────┐        [Interim sound     │ (panel content,    │ on its map edge
│ │ 28.4 °C                          │         engine]           │  real HTML text)   │
│ │ 21.5° N, 89.8° E                 │                           │                    │
│ │ EIC frame: Sea surface ...,      │                           │                    │
│ │ 2026-09-25 00:00 UTC. Sound ...  │                           │                    │
│ └──────────────────────────────────┘ readout plate (--scrim)   ╰                    │
├────────────────────────────────────────────────────────────────┴────────────────────┤
│ Warm tone: 28.4 °C ocean                                                            │ caption bar (Tiro)
│ ▶ Pause   Ocean [vol] Mute Solo   Rain [vol] Mute Solo   Play sweep   Keys ⌨   ∿∿∿∿∿∿ │ bottom bar (--dusk)
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- **Top bar left:** ♪ is the sonic-identity button. It plays the motif, and its accessible name is "Play the Jukebox motif".
- **Top bar, other controls:** mode tabs (shadcn `Tabs`), then the track selector (a `ToggleGroup` with one choice), then Describe (`Toggle`), language (`ToggleGroup`) and Help (`Dialog`).
- **Side sheet:** one side sheet (shadcn `Sheet`, or a fixed panel on wide screens) with vertical `Tabs`: Truth, Mapping, Provenance, History. It isn't a grid of cards.
- **Readout plate:** bottom-left of the map, on an 88% scrim. Value on one line, coordinates on the next, frame label below. No middle-dot joiners.
- **Frame label:** always the §16 frame-label sentence, built from the frame's `frame_time_utc` and product name.
  - In Explore and Story it's on the plate.
  - In Then vs Now the stage shows the comparison player, and the same `FrameLabel` component moves into the stage header. The frame date is visible in every view.
- **Badges:** "Interim sound engine" sits top-right on the map (shape and text badge, §2). Truth items built from JSON carry "Pending team approval".
- **Bottom bar:**
  - The play/pause button (Space) plays and pauses the live sound.
  - Per-voice mixer: volume `Slider`, a Mute `Toggle` and a Solo `Toggle` for each voice.
  - "Play sweep" (S), and "Keys", which opens Help at the keyboard section.
  - The live waveform sits at the far right.
- **Caption bar:** full width, above the bottom bar. It's the last line of the audio log, and captions can be switched off with C.

### 4.2 Mobile (< 768 px)

```
┌───────────────────────────────┐
│ ♪ Jukebox          বাংলা  ☰   │ top bar; ☰ opens settings (Describe, Help, reduce motion)
├───────────────────────────────┤
│ Explore | Story | Then vs Now │ 44 px tall segments
├───────────────────────────────┤
│                               │
│   EIC FRAME (2:1, full width) │ drag / tap to move cursor
│            ◎                  │
├───────────────────────────────┤
│ 28.4 °C                       │ readout moves below the map
│ 21.5° N, 89.8° E              │ (the map is too short for a plate)
│ EIC frame: Sea surface ...    │
├───────────────────────────────┤
│ Ocean | Rain | Both           │ track selector
│ Warm tone: 28.4 °C ocean      │ caption
├───────────────────────────────┤
│ ▶ Pause   Sweep   Mixer   ⓘ  │ ⓘ opens panels as a bottom sheet
└───────────────────────────────┘
```

- Every target is at least 44 × 44 px.
- The mixer and the panels open as bottom sheets (shadcn `Sheet side="bottom"`), with the 14 px radius on the top edge only.
- The map never scrolls horizontally, and the page has 16 px side gutters, except the map, which stays full bleed.

### 4.3 Tablet (768–1023 px)

Same as desktop, but the side sheet overlays the map (opened from a "Panels" button) instead of taking a column.

---

## 5. Motion

Only movement that shows a change in data or answers a user action. DOM transitions use `motion/react` and animate only `transform` and `opacity`. Canvas layers are redrawn in `requestAnimationFrame`, timed from `AudioContext.currentTime`.

| # | What | Trigger | Spec | Reduced-motion version |
|---|---|---|---|---|
| 1 | **Opening, "Close your eyes" (C1)** | Start button, the only sequence the user doesn't drive | Dark screen; about 10 s of ocean and rain sound; caption "Close your eyes." Then the live waveform appears as one horizontal line, the caption "Now open your eyes." shows, the line settles onto the equator, and the frame is revealed outward from it (a `clip-path: inset()` wipe from the equator to both poles, 1.2 s, ease-out). A Skip button is always focusable. | No wipe: an instant cut, with the captions and sound unchanged |
| 2 | **Sound rings at the cursor** | Sound events | Ocean: even rings, spacing follows pitch (higher pitch, tighter rings), one ring each ~600 ms. Rain: **one ripple per scheduled drop** (per-drop event), so heavier rain gives more ripples. Snow: slower, fainter, wider rings. **No data: no rings at all**, plus the soft tick and the caption. | A static ring whose radius shows the value |
| 3 | **Readout digits** | Value change | Cross-fade in under 150 ms (opacity only). The screen reader gets only the settled value, via the debounced live region. | Instant swap |
| 4 | **Sweep ring (A6)** | S / "Play sweep" | A `--shapla` ring expands from Dhaka (23.81° N, 90.41° E), with its radius tied to the sweep step event from the audio clock, so the eye follows the ear. | A dot jumps step by step instead of a growing ring |
| 5 | **Live waveform** | Always, once started | A 1.5 px `--shapla` line from the `AnalyserNode` (time domain, 2048 samples), drawn 30 times a second. Flat when silent. | Still drawn (it's data, not decoration), at 10 fps |
| 6 | **Pipeline X-ray (C2)** | X | **Deferred until L1 publishes the colorbar images and colour tables.** The spec stays as in the brief. Until then, X announces "X-ray needs the colorbar data. Coming soon." | A static three-step diagram |
| 7 | **Panel open/close** | User | The sheet slides from its edge (transform, 200 ms). | Instant |

Things that never animate: page load (beyond #1), hover lifts, section entrances, and any looping decoration.

Hidden tab: the canvas loop and the waveform stop on `visibilitychange`; the audio keeps playing.

---

## 6. Copy rules

- Sentence case. Button labels say what happens: "Start listening", "Play sweep", "Hear the legend", "Skip intro", "Pause sound".
- Name things the way users know them: "Ocean temperature", "Rain and snow". SVS IDs and dataset names only appear in Provenance.
- Errors say what happened and what to do next, without apologising. For example: "Couldn't load today's rain frame. Showing the last saved frame from [date, time UTC]." (the date comes from the metadata).
- **§16 and the pending decisions:**
  - Truth and demo captions follow `docs/L3/contract-proposals.md` §A. They're built from JSON numbers and carry "Pending team approval".
  - The ocean temperature Truth section says "Verification being updated" until the held-out frame check is confirmed.
  - Demo captions are shown exactly as `dhaka_then_now.json` gives them.
- All strings, including aria-labels, go through `src/lib/i18n/`. §16 wording is marked for human translation only.

---

## 7. Accessibility structure (how the design meets plan §9.4)

- **Focus order:** "Start listening", then the top bar, the map region, the bottom bar and the side sheet.
- **Map region:** `role="application"`, `aria-roledescription="sound map"`. Its `aria-label` changes with the track, value and place.
- **Letter shortcuts** only work while the map region has focus (WCAG 2.1.4). Esc works everywhere.
- **One live region** (`aria-live="polite"`, debounced 300 ms) for values, modes and results.
  - When "Built-in voice" is on, a spoken value isn't also pushed to the live region at the same moment.
  - This needs a real NVDA test (see the Phase 2 report).
- **Reduced motion:** the `prefers-reduced-motion` OS setting sets the default, and an in-app "Reduce motion" toggle in Help/settings can override it either way.

---

## 8. Self-review: would a generic prompt have produced this?

| Part | Generic? | What I changed |
|---|---|---|
| Palette | The brief's own draft (navy and a warm yellow accent) is close to the "dark background, one bright accent" default. It also clashed with the rain data. | Chrome hues are now **derived from the gap in NASA's colormaps** (255°–330°). The accent is shapla pink, for a stated local reason. |
| Accent use | Generic kits put the accent on primary buttons. | The accent is **only** on listening and pointing things. Primary buttons are `--moon` text on `--tide`, and only "Start listening" is pink. |
| Type | A single sans with one heavy display weight is the default. | Anek's **width axis** is used for the readout; a serif appears only when the app is narrating; Bengali digits are fixed with per-digit cells. |
| Radius / shadows | One radius everywhere, soft shadows. | The radius depends on where a surface is attached (map edge vs open corner), and there are no shadows. |
| Status badges | Coloured pills (green "Verified", amber "Beta"). | Shape and word only, never colour, because colour here means data. |
| Motion | Fade-up entrances and hover lifts. | The only motion comes from the audio clock or a user action. The one set piece (opening) draws the frame out of the sound's own waveform. |
| Layout | A dashboard grid of cards. | One stage, one attached side sheet, a readout plate sitting **on** the data. |
| Wireframe symbols | The "·" joiners and "→" buttons in my own drafts. | Removed. ♪ ∿ ◎ appear only as icons with accessible names, never as text decoration. |

Still at risk of looking templated, to check in the Phase 2 screenshots: the top bar's crowding on laptops at 1280 px, and whether the vertical tabs in the sheet read as a generic settings page.

---

## 9. Open items for review

1. **Accept shapla pink and the indigo chrome** in place of marigold and navy (§1.1). If you'd rather keep marigold, it has to be restricted to the ocean track, and the rain cursor needs another colour, which weakens the "one accent" idea.
2. On mobile, the readout moves below the map instead of sitting on it. Is that OK?
3. The frame label moves into the stage header in Then vs Now. Is that OK?
