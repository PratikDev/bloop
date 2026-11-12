---
name: bloop-final-pass
description: Bloop's final pass before NASA Space Apps judging. Ships the judging fixes, the "daylight jukebox" soft neo-brutalist redesign with a song-player layer, space-window stages with stars, motion for Then vs Now and the storm time-lapse, a toon-shaded 3D turntable, and the open issues from the site review. Use when asked to "do the Bloop final pass", "run the redesign", or any phase of it.
---

# Bloop final pass

This file is the whole brief. Work through it top to bottom. Each phase ends
with checks; a phase is done only when its checks pass. The app must build and
run after every phase, so the team can stop after any phase and still ship.

## 0. Ground rules (read first)

### 0.1 Authorisation, and how it relates to AGENTS.md

`AGENTS.md` (loaded through `CLAUDE.md`) still applies, with two explicit
overrides from the user, Pratik:

1. **Move through the phases without asking.** AGENTS.md says "do not move from
   one phase/task to another unless I ask you to". This file is that ask: run
   phase 1, then 2, and so on. Stop and ask only when a check fails and you can't
   fix it within the phase's time box, or when this file says "ask".
2. **Commit at the end of each phase**, following AGENTS.md's commit rules
   exactly: atomic, list every path, `git status` first, never commit unrelated
   files. Use the commit message given at the end of each phase. Do not push and
   do not open a PR unless asked.

Everything else in AGENTS.md stays in force, in particular:

- TypeScript strict, no `any`, keep everything type-safe.
- No file grows too long; split by concern (component folder + `use-*.ts` hooks).
- DRY: one place for each piece of logic, type or token.
- **No Tailwind arbitrary colour values.** Every colour is a CSS variable in
  `src/app/globals.css`, exposed through `@theme inline`, used as a class.
- shadcn/ui components first (`src/components/ui/`).
- Component-specific hooks live in the component's folder; shared hooks in `src/hooks/`.
- "This is NOT the Next.js you know": before touching a Next.js API (fonts,
  metadata, `not-found`), read the matching guide in `node_modules/next/dist/docs/`.

### 0.2 Non-negotiables for this project

- **Never invent data.** Every number, date, place and claim shown or spoken
  comes from the data files the app already loads. If a design slot needs a
  value that doesn't exist, leave the slot out. Don't fill it.
- **Data colours are sacred.** NASA frame pixels and the colour scales on maps,
  globes and the turntable are never tinted, tone-mapped, blended or recoloured
  by the theme. The theme changes chrome only.
- **No serif, no italic, no accented word in a headline.** Instrument Serif
  italic and the one-word pink accent are the look Pratik rejected. They must
  not survive anywhere: page titles, the logo, the intro, the splash, the 404,
  map labels, or Bangla text. The type is Archivo (and Anek Bangla) in roman
  only, with weight and width doing the work (§4.5).
- **Every user-facing string goes through i18n.** Add the key to the English
  file in `src/lib/i18n/en/` and the Bangla file in `src/lib/i18n/bn/` (the
  `Translated<>` type makes Bangla mandatory). Bangla text you write is a draft:
  list every new Bangla string in the phase summary so Pratik can review it.
  Run `bun run i18n:todo` after string changes so `docs/i18n/TO_TRANSLATE.md`
  stays in sync (a unit test checks it).
- **Accessibility does not regress.**
  - Real `<button>`/`<a>`/`<input>`.
  - Visible focus.
  - Touch targets ≥ 44 px.
  - Text contrast ≥ 4.5:1 (the palette in §3.1 lists the passing pairs).
  - Status never carried by colour alone.
  - `prefers-reduced-motion` and the app's own Reduce motion setting
    (`state.reduceMotion`) both stop non-essential motion.
  - Screen-reader announcements stay as they are unless a phase says otherwise.
- **Keyboard shortcuts stay as they are:**
  - Arrows, Shift+arrows, Enter, Space, `1 2 3`, `S`, `B`, `U`, `H`, `T`, `Esc`, `/`, `L`.
  - The Turntable's keys (`V`, `+`, `−`, `1–9`, …).
  - No new single-letter global shortcut may collide with these. In particular,
    **record codes are never typed as global keys** (`B` is Braille, `S` is
    Sweep). Codes are typed into a field (§4.4).
- **Esc behaviour** after phase 1:
  - Esc closes the top layer first (dialog, sheet, popover, menu, Inspector,
    Help) and the sound keeps playing.
  - With nothing open, Esc stops all sound.
  - On the intro, Esc equals Skip intro.
  - Keep this.

### 0.3 Commands (from `package.json`; the package manager is Bun)

| Command | Use |
|---|---|
| `bun install` | install |
| `bun run dev` | dev server, http://localhost:3000 |
| `bunx tsc --noEmit` | type check |
| `bun run lint` | ESLint |
| `bun test` | unit tests (must stay at 0 failures) |
| `bun run build` | static export to `out/` (Next `output: "export"`) |
| `bun run start` | serve `out/` at http://localhost:3000 (Python static server) |
| `bun run e2e` | Playwright, Chromium and Firefox (`bunx playwright install chromium firefox` once) |
| `bun run i18n:todo` | regenerate `docs/i18n/TO_TRANSLATE.md` |
| `npm run refresh:live` | refresh the live data (Python pipeline, needs network) |

**The gate.** Run this after every phase, in this order:

```sh
bunx tsc --noEmit && bun run lint && bun test && bun run build
```

Then run `bun run e2e`. When an e2e test fails only because a selector or label
changed on purpose, update the test in `e2e/` to match the new UI. Keep what it
checks; never delete a test to make it pass.

### 0.4 Map of the code (verified paths)

| Concern | Where |
|---|---|
| Theme tokens, utilities, fonts mapping | `src/app/globals.css` (`:root` tokens; `@theme inline`; `@utility …`) |
| Canvas/WebGL code reads colours from CSS | `src/lib/css-tokens.ts` (`readPalette()`; tokens must stay **hex**, not `var()`) |
| Fonts and metadata | `src/app/layout.tsx` (`next/font/google`) |
| Router (TanStack inside one Next catch-all) | `src/app/[[...path]]/page.tsx`, `src/router/` (`routes.tsx`, `search.ts`, `modes.ts`) |
| App shell, Esc, start gate | `src/components/AppShell/` |
| Global state | `src/components/AppState/` (`reducer.ts`: `setCursor`, `setTrack`, `track: TrackMode`, default `"both"`) |
| Header and nav | `src/components/Header/` (`TuningDial.tsx`, `nav-items.ts`) |
| Dock (bottom bar) | `src/components/Dock/` |
| Listen page | `src/components/pages/Listen/` |
| Map | `src/components/FrameView/` |
| Frame label and badges | `src/components/FrameLabel.tsx`, `src/components/SourceBadges/` |
| Home globe (custom WebGL, not three.js) | `src/components/Globe/` (`renderer.ts`, `shader.ts`, `use-globe.ts`) |
| Time-lapse | `src/components/TimeLapse/` (`TimeLapseFrame` has `index`, `total`, `timeUtc`, `point`, `image`) |
| Then vs Now | `src/components/ThenNow/` (`use-then-now-player.ts` returns `soundingPart`, `index`, `splitIndex`) |
| Parts | `src/components/ThenNow/parts.ts`: `VIEW_PARTS = ["heat","monsoon","water","fires","vegetation"]` |
| Captions | `src/components/CaptionBar/use-latest-caption.ts` |
| Intro | `src/components/Opening.tsx` |
| Official records | `src/components/OfficialRecords/`, page `src/components/pages/Official/` |
| 3D turntable | `src/components/Turntable/` (`scene/post.ts`, `scene/deck.ts`, `scene/earth.ts`, `scene/studio.ts`, `quality.ts`) |
| i18n | `src/lib/i18n/en/*.ts`, `src/lib/i18n/bn/*.ts` |
| e2e | `e2e/` (`features/*.ts`, `lib/app.ts`) |

If a path above doesn't exist when you start, the repo moved on: find the new
location with `git grep` before changing anything, and say so in the summary.

### 0.5 Decongestion rules (apply in every phase)

The current site shows too much at once, and soft neo-brutalism makes clutter
louder: every outline and shadow competes. These rules win over any layout
detail elsewhere in this file. Each one is checkable.

1. **One loud thing per screen.**
   - Listen: the cabinet.
   - Then vs Now: the motion stage and chart.
   - Turntable: the deck.
   - Everything else is quiet: no fill, or paper fill with no shadow.
2. **Outlines and hard shadows mark what you can press, plus the one or two
   top-level panels.** Static groups (text blocks, stats, lists of facts) get
   spacing, not borders. Check: no element without a role or handler has a
   `key` shadow.
3. **One primary action visible per screen.** That's the coral fill. Secondary
   actions are paper keys; anything beyond three secondary actions goes into a
   "More" menu (shadcn `DropdownMenu` or `Popover`). Check: at most one coral
   filled button in view at any time, record chips excepted.
4. **Liner notes hold the details.** Sources, badges, check numbers, frame
   rules ("Higher = warmer…"), credits and data age live in one **Liner
   notes** panel per record (the jukebox name for the sleeve's back). On the
   main surface, a record shows at most **one** status pill, which is the data
   age, and only when it's past its freshness limit.
   - The visible label is **"Sources and checks"**. That's plain words for
     screen-reader users and readers whose first language isn't English;
     "Liner notes" is only the internal name used in this file.
   - On Listen, Liner notes is the existing Inspector (`pages/Listen/Inspector.tsx`,
     "About this sound": Where it's from, What you hear, Checks), renamed and
     restyled. Keep its tabs and content.
   - Check: `SourceBadges` renders only inside Liner notes, plus that one age
     pill.
5. **Never show the same value twice on one screen.** For example, the tube
   carries the level and the readout carries the number.
6. **Copy diet.**
   - Interface sentences ≤ 20 words.
   - Helper lines appear once, near the control they explain.
   - No paragraph above a primary action.
   - First-visit hints show once (already remembered) and never cover the map:
     they sit under it.
7. **Space.**
   - An 8 px spacing scale.
   - At least 24 px between groups.
   - At least 32 px page gutters from 1024 px.
   - A screen that doesn't fit at 1280×720 gets fewer things, not smaller
     things. Minimum text size is 14 px.
8. **Numbers are not decoration.** Drop the 01–05 numbers from the nav
   entirely; pages aren't a sequence. Record codes stay; they're how you pick a
   record.

### 0.6 Blind and low-vision users come first

Blind and low-vision people are Bloop's core audience, not an edge case. Every
phase must meet **WCAG 2.2 AA** plus the rules below. When a visual idea in this
file conflicts with them, these rules win. Phase 8 tests all of them.

**Screen-reader users**

1. **One live region.**
   - Every announcement goes through the existing Announcer
     (`src/components/Announcer/`, documented as "the one aria-live region").
   - New UI adds **no** `aria-live`: not the captions panel, the readout, the
     year counter or the player caption.
   - The few existing regions (Go to menu, Start actions, Turntable dock
     button) stay as they are.
   - Check:

     ```sh
     git grep -n "aria-live" -- src ':!src/components/AudioHarness'
     ```

     shows no hits beyond those files and the Announcer.
2. **Announce changes once, never per frame.**
   - Choosing a record announces "Now playing A3, Ocean and rain together"
     once.
   - The time-lapse doesn't announce each frame (2 frames a second would
     flood); keep today's caption behaviour.
   - Settled values are announced once, as today.
3. **Structure.**
   - One `h1` per page.
   - `h2` for "Now playing", "Pick a record" and the player.
   - `h3` for rack groups.
   - Landmarks: `header` with `nav`, `main`, `aside aria-label="Records"`,
     `section aria-label="Player"`.
   - Extend the existing skip link into three: Skip to map, Skip to records,
     Skip to player.
4. **Everything visual has a non-visual equivalent.**
   - Tubes: `role="img"` plus a label (§5.3).
   - Globe stages: the canvas is `aria-hidden`, and the stage holds one
     visually hidden sentence ("Globe centred on Dhaka") that updates when the
     city changes. It's not a live region.
   - Charts and stripes: inside each part's existing Details disclosure, add a
     real `<table>` (caption, `th scope="col"`, Year and Value columns) built
     from the **same series** the chart uses.
   - Sleeves, discs, stars and the arch are decorative (`aria-hidden`).
5. **Native controls with useful values.**
   - The longitude slider is labelled "West to east", with `aria-valuetext`
     like "89.8° east, Bay of Bengal" (the gazetteer place when there is one).
   - The time-lapse progress bar gives the frame time as its value text.
   - Record strips start their name with the code and use `aria-pressed`.
6. **Phones with VoiceOver or TalkBack can't drag the map reliably.** Next to
   the longitude slider, add a "South to north" latitude slider (−90 to 90,
   same `setCursor` action). Together with Go to, they form a "Move the needle"
   group, all reachable on phones. Map gestures must never trap focus.
7. **Focus.**
   - Opening the player sheet moves focus to its heading; closing it returns
     focus to the control that opened it. Base UI does this; verify it.
   - Page changes keep today's behaviour: focus goes to the page heading.
8. **Speech.** Keep the existing Built-in voice setting and its hint. Add no new
   speech.

**Low-vision users**

9. **Zoom and reflow.**
   - Usable at 200% browser zoom.
   - Reflows at **320 CSS px** width (1280 px at 400%) with no sideways
     scrolling, except inside the map and data tables.
   - The arch, tubes, rack and player stack at that width.
10. **Text.**
    - Body ≥ 16 px; nothing under 14 px; line-height ≥ 1.4.
    - Condensed `font-strip` only on titles ≥ 17 px, never on body text or
      captions.
    - Add a **Comfortable text** setting in the Settings menu, beside Reduce
      motion, saved with the other prefs (`AppState/prefs.ts`). It sets
      `data-text="comfortable"` on `<html>`, and `globals.css` overrides then
      set the base size to 112.5%, put `font-strip` and `font-wide` back to
      width 100%, and add 0.01em letter-spacing. The width axis makes this a
      few variables.
11. **Text spacing (WCAG 1.4.12).** Nothing clips when a user forces
    line-height 1.5, letter-spacing 0.12em and word-spacing 0.16em. Text
    containers use `min-height`, never a fixed `height`.
12. **Non-text contrast ≥ 3:1** for every control edge and state; the navy
    outlines pass. **Selection never by colour alone:** a selected strip also
    gets `aria-pressed`, a 3.5 px border and the equaliser glyph.
13. **Focus ring.** 3 px with a 3 px offset: navy on light surfaces, paper on
    `--space` and on navy fills. Never removed.
14. **Forced colours (Windows High Contrast).** Add
    `@media (forced-colors: active)` rules:
    - borders use `CanvasText`;
    - selected strips and focus use `Highlight`;
    - icons use `currentColor`;
    - the Starfield is hidden;
    - hard shadows may disappear, which is fine.

    Test with Chrome DevTools → Rendering → "Emulate CSS media feature
    forced-colors".
15. **Moving content can be paused (WCAG 2.2.2).**
    - Anything that moves by itself for more than 5 s (globe turn and sway,
      star twinkle, the year counter) gets a visible "Pause motion" key on its
      stage.
    - The Reduce motion setting stops all of it.
    - Pausing motion never pauses sound.
16. **Magnifier users need related things close together.**
    - The readout sits directly under the map.
    - The player caption sits with the transport.
    - The Turntable value chip sits next to the readout panel, not across the
      screen.
    - Never put essential information at opposite edges.
17. **Data colours can't change (§0.2)**, so every value is also given as text
    and sound. Never ask a user to read a value from a colour.

## 1. What Pratik asked for (the full list, in order)

1. Rate the live site (https://bloop-ptsd.pages.dev/, repo
   https://github.com/PratikDev/bloop) and report every issue. Done: the review
   is folded into phases 1 and 7.
2. Redesign the UI to fit a **jukebox** aesthetic.
3. Fix the critical issues found in the review. Done as a patch; phase 1 applies it.
4. Make the jukebox look **soft neo-brutalist** and replace the current
   purple/pink gradient-and-glow colours ("AI slop"). Phase 2.
5. Add a **song-player** layer on top of the jukebox (now playing, sleeve,
   transport, scrubber, captions as lyrics, up next). Phases 3 and 4.
6. Bring the **3D part** (the Turntable) into the same style. Phase 6.
7. Give **Then vs Now** and the **storm time-lapse** visual motion alongside the
   sound (the 3D Earth turning, or other relevant animation). Phase 5.
8. Add a **space-inspired** layer (stars, night sky) because the data is NASA's. Phase 5.
9. Package all of this as one file Claude Code can run, with no room for errors.
   That's this file.
10. Suggest anything else that makes it better, and fix how **congested** the
    site is: §0.5 and the cuts in phases 3 and 7.
11. Rate the redesign's UX and fold the fixes in: no duplicate title, previous
    and next stay inside a group, a "West to east" slider, the record list in a
    sheet on phones, a progress bar with no knob, stripes in the chart,
    "Sources and checks", designed loading and error states, one shared player
    on the Turntable.
12. Put **blind and low-vision users** first: §0.6, which is never cut.
13. Double-check the whole session and the plan. Done: the fixes from that
    review are in this version.

## 2. Phase 0: set up (15 min)

1. `git status` must be clean on `main`. If not, stop and ask.
2. Make the working branch: `git checkout -b final-pass`.
3. Run `bun install`, then the gate (§0.3).
4. Write down any check that already fails **before** your changes; those are
   not yours to fix unless a phase says so. Put the list in the phase-0 summary.

No commit for phase 0.

## 3. Phase 1: judging fixes (45 min)

### 3.0 Apply the patch

Pratik has a patch file `0001-Fix-judging-blockers-Listen-head-overlap-Esc-behavio.patch`.
If it's in the repo root, run `git am 0001-Fix-judging-blockers-*.patch`.
If it isn't there, or `git am` fails, run `git am --abort` and apply
**Appendix A** by hand. Appendix A contains the same changes as a diff, minus
two generated files:

- `public/og.jpg`: create it in §3.2.
- `docs/i18n/TO_TRANSLATE.md`: regenerate it with `bun run i18n:todo`.

What the patch does:

1. **Listen head overlap.** On stages narrower than 2:1 (1440×900, 1024×768),
   the frame label in the page head is one truncated line
   (`FrameLabel compact`, new keys `frame.compact` and `frame.compactItem`).
2. **Esc on the intro** does what Skip intro does: the intro claims Esc through
   `pushEscapeHandler`, so the global stop doesn't run.
3. **Esc closes the top layer first.** Help, open Base UI popups
   (`[data-open]` dialog, menu or listbox), then the Inspector. Only with nothing
   open does Esc stop all sound.
4. **Branded 404.** `src/app/not-found.tsx` renders `<ClientRouter />`, so the
   static `404.html` shows the app's own "No signal here" page.
5. **No stale copy.** Every "Coming in October", "Teaser", "Not built yet" and
   "(pending team approval)" is gone, in English and Bangla.
6. **Link previews.** Title "Bloop: the Earth Information Jukebox",
   `metadataBase`, Open Graph and Twitter tags, `public/og.jpg` (1200×630).
7. **Nav numbers** 01–05 show from `xl` (1280 px) up, so the nav fits at 1024 px.

### 3.1 Check

- The gate passes, with 188/188 unit tests or more.
- In `bun run dev`:
  - Start listening, then press Esc on the intro. Sound keeps playing (the dock shows Pause).
  - Open Help (`H`), press Esc. Help closes and sound keeps playing. Press Esc again: sound stops.
  - Open `/nope`. You see "No signal here" inside the app shell.
- In `out/index.html`: `<title>Bloop: the Earth Information Jukebox</title>`
  and `og:image` = `https://bloop-ptsd.pages.dev/og.jpg`.

### 3.2 The preview image

If `public/og.jpg` is missing, leave it until phase 8, which re-takes it from the
redesigned home page. Remove nothing from `layout.tsx` meanwhile; a missing image
only affects link previews.

Commit: `fix: judging blockers (Listen head, Esc, 404, stale copy, link previews, nav)`.

## 4. Phase 2: the "daylight jukebox" theme, soft neo-brutalism (2 h)

Goal: recolour and restyle the whole app from `globals.css` and `layout.tsx`
first, then fix the handful of components whose colour pairs break. No layout
changes in this phase.

### 4.1 Palette (exact values)

| Token (new) | Hex | Role |
|---|---|---|
| `--sea` | `#CFE9DF` | page ground ("sea glass") |
| `--sea-deep` | `#A9D3C5` | hover/active fill on sea, land on globes |
| `--paper` | `#FFF8E6` | surfaces, title strips, panels |
| `--navy` | `#14213D` | outlines, primary text, shadows |
| `--navy-soft` | `#3C4A66` | secondary text |
| `--bubble` | `#FFB238` | ocean and heat, bubble tubes, current caption |
| `--coral` | `#FF6B4A` | play, selection, record chips (**fill or border only, never text**) |
| `--dial` | `#7DB8F0` | rain |
| `--space` | `#0B1530` | night sky inside space windows (phase 5) |
| `--star` | `#FFF8E6` | stars |
| `--star-warm` | `#FFB238` | a few warm stars |
| `--shadow-on-space` | `#7DB8F0` | hard shadow of a panel that sits on `--space` |

Contrast pairs, all checked:

| Text | On | Ratio |
|---|---|---|
| navy | sea | 12.4:1 |
| navy | paper | 15:1 |
| navy | coral | 5.7:1 |
| navy | bubble | 8.9:1 |
| navy | dial | 7.6:1 |
| navy | sea-deep | 9.7:1 |
| navy-soft | sea | 6.9:1 |
| navy-soft | paper | 8.5:1 |
| paper | navy | 15:1 |
| paper | space | 17:1 |

Forbidden pairs:

- Coral text on anything.
- navy-soft text on navy or space.
- Paper text on coral, bubble or dial.

On `--space`, text is paper only.

### 4.2 Old token names → new values

Keep every old token **name**, because components use them through classes and
`readPalette()`. Point each one at the new palette, written as **hex** (not
`var()`, since `css-tokens.ts` reads raw values for canvas code):

| Old token | New value | Notes |
|---|---|---|
| `--night` | `#CFE9DF` | page background |
| `--dusk` | `#FFF8E6` | raised surfaces |
| `--tide` | `#A9D3C5` | active/hover fills |
| `--land` | `#A9D3C5` | globe land (Home globe shader `u_land`) |
| `--line` | `#14213D` | borders |
| `--moon` | `#14213D` | primary text, filled "light" buttons now navy |
| `--haze` | `#3C4A66` | secondary text; also the Home globe's rim uniform (phase 5 replaces the rim) |
| `--shapla` | `#FF6B4A` | accent fill |
| `--ink` | `#FFF8E6` | it was "dark text on a light fill"; light fills become navy, so it flips to paper (see §4.4) |
| `--void` | `#0B1530` | the intro stage becomes space |
| `--scrim` | `rgb(20 33 61 / 0.55)` | |
| `--glass` | `#FFF8E6` | opaque now |
| `--glass-edge` | `#14213D` | |
| `--glow` | `transparent` | |
| `--shadow-tint` | `#14213D` | |
| `--chart-then` | `var(--haze)` | unchanged expression |
| `--chart-now` | `var(--moon)` | unchanged expression |
| `--chart-grid` | `#A9D3C5` | |

Leave the Turntable tokens (`--studio-*`, `--deck-glass`, `--vinyl`, `--metal`,
`--label*`, `--amber`, `--atmosphere`, `--sun-glint`, `--terminator-warm`,
`--tt-*`, `--geo-*`) alone in this phase. Phase 6 owns them.

**Minimum text size (§0.6 rule 10).**
- Set `--text-small: 0.875rem` (14 px; it's 0.8rem, 12.8 px, today).
- Replace every `text-xs` in `src/components` (including `ui/badge.tsx`) with
  `text-small`, and every hard-coded size under 14 px.
- In `ui/badge.tsx`, also change the fixed `h-5` to `min-h-5 h-auto`, so badge
  text can wrap instead of clipping (§0.6 rule 11).
- Check: `git grep -n "text-xs\|text-\[1[0-3]px\]" -- src/components ':!src/components/AudioHarness'` → no hits.

Set `color-scheme: light` on `:root`, and in `layout.tsx` set the viewport
`colorScheme: "light"` and `themeColor: "#CFE9DF"`.

Add the new tokens from §4.1 to `:root` and to `@theme inline` as `--color-*`.
Also add `space`, `star`, `star-warm` to `TOKENS` in `src/lib/css-tokens.ts`.

### 4.3 Shapes and utilities (rewrite in `globals.css`)

**Shape rules:**

- Outlines 2.5 px (`--outline: 2.5px`); 3 px on top-level panels.
- Hard shadows, no blur: 4 px on keys, 6 px on panels, 8 px on the cabinet.
- Only interactive elements and top-level panels get an outline and a shadow
  (§0.5 rule 2).
- Radii:
  - Keys and strips: 10 px (`--radius: 10px`).
  - Tiles: 14 px (`--radius-plate-value: 14px`).
  - Panels and sheets: 22 px (`--radius-sheet-value: 22px`).
  - Pills and tubes: fully round.

**Rewrite these utilities:**

- `--shadow-float` → `4px 4px 0 var(--navy)`.
- `--shadow-glow` → `none`.
- `@utility surface-glass` → opaque paper: `background: var(--paper)`,
  `border: var(--outline) solid var(--navy)`, `box-shadow: 6px 6px 0 var(--navy)`,
  **no** `backdrop-filter`.
- `@utility surface-plate` → the same, with a 4 px shadow.
- `@utility eyebrow` → no mono, no uppercase, no tracking: Archivo 600, `0.9375rem`.
- `@utility label-halo` → remove the soft text-shadow; labels sit on a paper
  pill (`background: var(--paper)`, 2 px navy border, `border-radius: 999px`,
  `padding: 0 .4em`).
- `@utility readout-figure` → `font-family: var(--font-display)`, weight 900,
  `font-stretch: 118%`, `font-variant-numeric: tabular-nums`.

**Add these utilities:**

- `@utility font-wide` → `font-family: var(--font-display); font-weight: 900;
  font-stretch: 125%; font-variation-settings: "wdth" 125;`.
- `@utility font-strip` → `font-family: var(--font-display); font-weight: 700;
  font-stretch: 82%; font-variation-settings: "wdth" 82;`.
- `@utility key` → `border: var(--outline) solid var(--navy); box-shadow: 4px 4px 0
  var(--navy); transition: transform 80ms ease-out, box-shadow 80ms ease-out;`.
  Hover moves it `translate(-1px,-1px)` with a 5 px shadow; active moves it
  `translate(4px,4px)` with no shadow. Under `prefers-reduced-motion: reduce`,
  `transition: none`.
- `@utility slab` → 3 px navy border, `box-shadow: 6px 6px 0 var(--navy)`,
  `background: var(--paper)`, `border-radius: var(--radius-sheet)`.
- `@utility on-space` → for panels on `--space`: paper fill, navy border,
  `box-shadow: 6px 6px 0 var(--shadow-on-space)`.

**Remove every `backdrop-blur` / `backdrop-filter`** (3 uses today) and every
soft `box-shadow` with blur radius > 0 in `src/`.

### 4.4 Colour pairs that break after the remap (fix these)

After the remap, `bg-moon` is navy and `text-ink` is paper. The pairs that
change meaning:

| Pattern | Uses | Fix |
|---|---|---|
| `bg-moon` + `text-ink` (light buttons: Skip intro, the 404 button, slider thumb …) | 8 files | Now navy with paper text. Correct. Check each one still reads as a button: add `key`. |
| `bg-shapla` + `text-ink` | | Paper on coral **fails**: change the text to `text-moon` (navy). |
| `bg-shapla` + `text-moon` / `text-night` | | Fine. |
| `text-shapla` (6 uses) | | Coral text fails: use `text-moon` and show the accent another way (coral underline, coral chip or border). |
| `bg-ink` (4 uses) | | Was near-black, now paper: check each, use `bg-moon` where a dark fill was meant. |
| `bg-void` (intro) | | Becomes `--space`; its text must be paper (`text-star`). |

Find them with:

```sh
git grep -n -e "bg-shapla" -e "text-shapla" -e "bg-moon" -e "text-ink" -e "bg-ink" -e "bg-void" -- src
```

Fix every hit. The surrounding text must meet the contrast table in §4.1.

### 4.5 Type: Archivo + Anek Bangla, both with a width axis

In `layout.tsx`, replace Geist, Geist Mono, Instrument Serif and Tiro Bangla
with:

```ts
import { Anek_Bangla, Archivo } from "next/font/google";
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
const anek = Anek_Bangla({ variable: "--font-anek", subsets: ["bengali"], axes: ["wdth"], preload: false });
```

Both families are variable on `wdth` and `wght`; Archivo is wdth 62–125 and
Anek Bangla is wdth 75–125, as listed in Next's `font-data.json`. Don't pass a
`weight` when using `axes`.

Then in `@theme inline`:

```css
--font-sans: var(--font-archivo), var(--font-anek), system-ui, sans-serif;
--font-heading: var(--font-archivo), var(--font-anek), system-ui, sans-serif;
--font-display: var(--font-archivo), var(--font-anek), system-ui, sans-serif;
--font-mono: var(--font-archivo), var(--font-anek), ui-monospace, monospace; /* numbers use tabular-nums */
```

**Delete `--font-serif` entirely; don't remap it.** A leftover `font-serif`
class must fail visibly rather than quietly survive. Then remove every serif and
italic use. These are all of them on `main` today:

| Where | What it is | Change to |
|---|---|---|
| `font-serif` in 21 files under `src/` | page titles, readouts, captions, chart titles | `font-wide` for page and section titles; `readout-figure` for big values; plain text (no class) for captions, chart titles and sentences |
| `src/app/layout.tsx` | `Instrument_Serif`, `Tiro_Bangla` (with `italic` styles), Geist, Geist Mono | Archivo and Anek Bangla only (above) |
| `src/components/pages/Home/index.tsx` | `<em className="text-shapla">` around `home.titleAccent`: the italic pink accent phrase | No `<em>`, no accent colour. Merge `home.titleLead` + `home.titleAccent` into one key `home.title` ("Listen to Earth's latest frames.") in `en/` and `bn/`, and delete the two old keys. One headline in `font-wide`, navy. |
| `src/components/Header/Brand.tsx` | the logo word in `font-serif … italic` | `font-wide`, roman |
| `src/components/Opening.tsx` | "Close your eyes." in `font-serif … italic` | `font-wide`, roman, paper on `--space` |
| `src/router/Splash.tsx` | the first paint: "Bloop" in `font-serif … italic` | `font-wide`, roman. The server sends it before the fonts and app arrive, so it's what judges see first. |
| `src/components/Turntable/LabelLayer.tsx` | sea names drawn `italic` on the canvas | Roman at weight 400 in `navy-soft`, with 0.04em letter-spacing so seas still differ from countries (which stay weight 500–600). Remove `"italic"` from the label kinds and from the `measure.font` string. |
| `@utility readout-figure`, `@utility display-tight` | serif-based utilities | `readout-figure` per §4.3; `display-tight` keeps only its tracking and line-height, with no font family |

Body text stays Archivo at normal width.

Remove the `--font-geist`, `--font-geist-mono`, `--font-instrument` and
`--font-tiro` variables from `FONT_VARIABLES`, and delete their imports.

### 4.6 Check

- The gate passes.
- `git grep -n "backdrop-blur\|backdrop-filter" -- src` → no hits.
- No serif or italic left:

  ```sh
  git grep -n -e "italic" -e "font-serif" -e "Instrument_Serif" -e "Instrument Serif" -e "Tiro_Bangla" -e "Tiro Bangla" -e "font-instrument" -e "font-tiro" -e "<em" -- src ':!src/components/AudioHarness'
  ```

  → no hits. The search is case-sensitive on purpose: the lowercase word
  "instrument" in audio code and data sentences is fine. Font comments in
  `globals.css` and `CaptionBar/index.tsx` that still name Instrument Serif or
  Tiro Bangla must be updated.
- The first paint (`out/index.html` before JavaScript runs) shows "Bloop" in
  roman. Check with JavaScript disabled in DevTools.
- `git grep -n "text-shapla" -- src` → no hits.
- `git grep -nE "(bg|text|border)-\[#" -- src` → no hits (no arbitrary colours).
- Manual pass on every page at 1440×900 and 390×844:
  - No unreadable text pair (§4.1).
  - No glow and no blur.
  - Every panel has a navy outline and a hard shadow.
- Bangla on: the Bangla font renders, and Bengali digits still appear.

Commit: `feat(theme): daylight jukebox palette, soft neo-brutalist surfaces, Archivo`.

## 5. Phase 3: jukebox structure and the mini player (3 h)

### 5.1 Records registry (one source of truth)

Create `src/lib/records.ts`. Every playable thing gets a **code**, a title key,
a subtitle key, a group, a "length" kind, and an action. These are the seed
rows; titles come from existing i18n keys where one exists, otherwise add one:

| Code | What | Action | Length shown |
|---|---|---|---|
| A0 | How it sounds (the legend warm-up: 0, 10, 20, 30 °C, light and heavy rain, snow) | `commands.playLegend()` (exists in `src/components/Commands/`) | nothing |
| A1 | Ocean temperature (live frame) | `dispatch({ type: "setTrack", track: "ocean" })` and go to Listen | "Live" |
| A2 | Rain and snow (live frame) | `setTrack` `"rain"` | "Live" |
| A3 | Ocean and rain together | `setTrack` `"both"` | "Live" |
| B1 | Heat | navigate `/then-now?part=heat` | nothing |
| B2 | Monsoon rain | `/then-now?part=monsoon` | nothing |
| B3 | Water underground | `/then-now?part=water` | nothing |
| B4 | Fires | `/then-now?part=fires` | "Chart only" |
| B5 | Vegetation | `/then-now?part=vegetation` | "Chart only" |
| C1… | Official records, in the official page's own order | navigate `/official?record=<id>` | nothing |
| D1 | The tour | navigate `/listen?tour=true` | nothing |
| D2 | Storm time-lapse | `timeLapse.start()` on Listen | "48 frames" |
| D3 | Sweep from Chattogram | the existing sweep command | nothing |

**A0 is the first strip in the rack.** On a first visit (the same remembered
flag the first-visit hint uses), it carries a small paper tag "Start here", and
the hint under the map says "New here? Play A0 to learn the sounds first." Once
A0 has been played, the tag and that sentence go. This teaches the sound
mapping before exploring, for everyone, and especially for blind users, who
can't read the legend.

Rules for the registry:

- The `track` values must be the existing `TrackMode` values from
  `@/lib/audio-adapter/types`.
- C codes are generated from the official records list (find its source in
  `src/components/OfficialRecords/` and `use-official-record.ts`) by index.
  Never hand-maintain them.
- `/official` has no URL state today (`src/router/routes.tsx`). Add
  `officialSearch` in `src/router/search.ts` with `record?: string`, validated
  against the list of record ids (unknown ids are dropped, like the other
  pages). Wire it as `validateSearch` on the official route, and make the page
  select that record on load.
- Lengths: only show what is true. "Live", "48 frames" (only if the time-lapse
  plays 48 frames; read the count from the time-lapse data, don't hardcode it),
  "Chart only" for parts with no sound. **No made-up durations.**

### 5.2 Header

- Nav as pills: navy-filled pill for the current page (paper text), paper pills
  with navy outline for the others. Items: Listen, Then vs now, How we know,
  Turntable.
- **Official records leaves the header nav.** It stays reachable from rack
  group C, from How we know, and by URL.
- Update `nav-items.ts` and the e2e nav tests.
- Remove the 01–05 numbers from `TuningDial.tsx` entirely (§0.5 rule 8).
- Any other small header control (e.g. the music-note button beside the logo):
  find what it does first. Keep its function, but move it into Settings or the
  player's More menu, so the header holds only the logo, nav, language,
  Settings and Help.
- The logo is a small vinyl record (navy disc, two groove rings, coral label)
  plus "Bloop" in `font-wide`, about 32 px. Inline SVG with `aria-hidden`; the
  link keeps its accessible name.
- Right side: `বাংলা`/`EN`, Settings, Help, all as `key` buttons, 46 px square.

### 5.3 Listen page: the cabinet

Replace the page's visual frame. Keep every existing behaviour, component and
announcement inside it.

```
┌──────── cabinet (flex 999 1 640px) ──────────┐ ┌─ rack (flex 1 1 340px) ─┐
│        ╭──── crown (coral, arched) ────╮      │ │ Pick a record           │
│        │ Now playing  [A3] Ocean + rain│      │ │ A Live frames           │
│ ┌tube┐ ┌──────── map window ────────┐ ┌tube┐  │ │  [A1] Ocean temp  Live  │
│ │amb.│ │  FrameView (unchanged)     │ │dial│  │ │  …                      │
│ └────┘ └────────────────────────────┘ └────┘  │ │ B Then vs now …         │
│ [Ocean 29.8 °C] [Rain Dry] [Under the needle] │ │ C Official records …    │
│ badges: measurement · frame ages · How we know│ │ D Guided …              │
└───────────────────────────────────────────────┘ └─────────────────────────┘
[ mini player bar: sleeve · title/artist · ⏮ ⏯ ⏭ · caption + scrubber · Go to · Braille · Mixer ]
```

- **Crown.** Coral fill, 3 px navy border, top radius large enough to read as
  an arch (`border-radius: 999px 999px 0 0` clipped by its width), no bottom
  border. It holds:
  - the label "Now playing", as an `h2`; the page's `h1` stays "Latest ocean
    and rain, as sound", visually hidden;
  - a paper title strip with the code chip (navy fill, paper text) and the
    record title in `font-strip`.
- **Map window.** `FrameView` inside a 3 px navy border, 14 px radius. Nothing
  about the map's rendering changes.
- **Bubble tubes** sit left and right of the map: vertical pills 34 px wide.
  - Left (`--bubble`): the ocean value at the cursor, filled from the bottom on
    this frame's own scale (the same min/max the Turntable legend uses: "This
    frame's ocean temperature range").
  - Right (`--dial`): the rain rate on its log scale.
  - Each tube is `role="img"` with an `aria-label` giving the value and scale.
  - Under 1024 px they become horizontal bars under the map.
  - Fill height animates only when motion is allowed.
  - Values come from the same reading the Readout uses. **Never estimate.**
- **Readout: one line, no boxes** (§0.5 rules 2 and 5):
  - the ocean value large (`readout-figure`);
  - the rain value beside it;
  - then the place name (gazetteer) and lat/lon in `navy-soft`.
  - Tubes carry no numbers. This replaces the current Readout's look; reuse its
    data and announcements.
- **Under the readout, one row:**
  - the data-age pill, only when past the freshness limit;
  - a **Liner notes** key, which opens the Inspector renamed "Liner notes",
    holding `SourceBadges`, the frame labels, the rules and the checks;
  - the "How we checked these" link to `/how`.
- **Frame label.** The full label lives in Liner notes. The page head keeps
  phase 1's one-line compact label, which names the frames and times.

### 5.4 The rack ("Pick a record")

- One section per group (A–D), headed by the letter in `font-wide` plus the
  group name.
- **Only the current record's group is open.** The others are collapsed
  accordion rows (a shadcn-style disclosure: a real `<button aria-expanded>`)
  showing letter, name and record count. At most about 6 strips are visible at
  once.
- Each record is a **title strip**: a real `<button>`, min-height 56 px, paper
  fill, 2.5 px navy border, 10 px radius, `key` shadow.
  - The code chip (46×42) is paper normally and coral when selected.
  - Then the title (`font-strip`), the subtitle, the length (right-aligned,
    tabular), and an equaliser glyph when playing.
  - `aria-pressed` on the selected strip; `aria-label` = "code, title.
    subtitle. length".
- Group C shows the first three records plus a strip "All official records"
  linking to `/official`.
- **Code entry.**
  - A labelled `<input>` ("Record code", placeholder "e.g. B2") with a Play
    button.
  - On submit, case-insensitive lookup in the registry; unknown codes announce
    "No record B9" through the existing announcer.
  - Typing "B2" must not toggle Braille or switch tracks.
    - In this repo, the map's shortcuts fire only while the map region has
      focus (`ExploreControls` → `use-map-keys.ts`).
    - Window-level handlers guard with `isTypingTarget()` from
      `src/a11y/keys.ts`.
    - Verify every `keydown` listener you find (`git grep -n "keydown" --
      src`). Any that would fire while the code field is focused gets the same
      `isTypingTarget(e.target)` guard. Don't rely on `stopPropagation`,
      because some listeners run in the capture phase.
- **Layout.**
  - Phones (under 1024 px): the rack moves into a bottom `Sheet` opened by a
    "Records" key in the mini player, so the map gets most of the screen.
  - The crown shrinks to one line on phones.
  - From 1024 px the rack is the right column.

### 5.5 Mini player (the dock)

Restyle `src/components/Dock/` as a player bar. It's a `slab`, 22 px radius,
and wraps on narrow screens. Left to right:

1. **Sleeve.** A 62 px square thumbnail of the current frame (`object-fit:
   cover`, centred on the cursor's longitude) with a small vinyl disc peeking
   out on the right (decorative). Then the title (`font-strip`, at least 17 px) and the "artist"
   line, which is the group's source line, e.g. "NASA EIC frames, played live".
2. **Transport.** Previous record, Play/Pause (64 px coral circle, the existing
   play/pause command and its labels), Next record. Previous/next walk the
   registry order **within the current group only**. They are disabled
   (`disabled`, with a visible dimmed state that still passes 3:1) at the
   group's first and last record, and they **never navigate to another page**.
3. **Caption and scrubber.**
   - The live caption (from `useLatestCaption`, as today) sits above a scrubber.
   - In **live** records, the scrubber is the needle's longitude, 180° W to
     180° E: a real `<input type="range" min=-180 max=180 step=1>`, labelled
     **"West to east"**, with "W" and "E" printed at the ends and
     `aria-valuetext` as in §0.6 rule 5. Changing it dispatches the same `setCursor` action the
     arrow keys use (latitude unchanged). The fill is bubble, the thumb a paper
     knob with a navy outline.
   - During the **time-lapse**, it shows frame progress (see phase 4).
4. **Keys.** Go to, Braille, Mixer, each a `key` with icon and label. The
   Mixer key is navy-filled.
5. The **Sweep, Storm time-lapse and Tour buttons leave the dock.** They're
   records D3, D2 and D1 now; their keyboard shortcuts stay.
6. **No duplicate title** (§0.5 rule 5). On Listen, the crown already shows
   the record, so the mini player hides its sleeve and title there and shows
   the caption and transport only. Other pages show the full mini player.
7. **The Turntable gets the same mini player** (same component), so the app
   feels like one product across pages.
   - Its own controls **go into the mini player's key area** (Turn, Search,
     Where am I, plus "More" for Bookmarks, Layers, View, Keys).
   - The Turntable never shows two bottom bars.

### 5.6 Check

- The gate passes; update e2e selectors that point at removed dock buttons to
  use the rack strips.
- At 1440×900, 1280×720, 1024×768, 390×844:
  - Nothing overlaps.
  - Nothing is clipped.
  - Nothing scrolls sideways (the phase-1 overlap bug stays fixed).
- Keyboard only:
  - Tab reaches every strip and the code field.
  - Typing B2 + Enter opens Monsoon rain.
  - Braille didn't toggle while typing.
- NVDA or Orca quick pass: the strips read code, title and state; the tubes read
  their values.

Commit: `feat(listen): jukebox cabinet, record rack with codes, mini player`.

## 6. Phase 4: the full player (1.5 h)

A "Now playing" panel for timed records, opened from the mini player's sleeve
or title. Use the shadcn `Sheet` (`side="bottom"` on phones, `side="right"` from
1024 px), so focus trapping and Esc come for free. Contents:

- **Sleeve.** The current frame (for the time-lapse: the frame on screen),
  square, 3 px navy border, 8 px hard shadow, with a vinyl disc peeking out
  behind it. Over its bottom edge sits a paper strip: code chip + "Frame N of
  M, <frame time UTC>" from `TimeLapseFrame.index/total/timeUtc`.
- **Title block.**
  - "Now playing", the title in `font-wide` (about 56–64 px).
  - The source line, e.g. "GPM IMERG half-hourly rain, NASA and JAXA".
  - The record's `SourceBadges`.
- **Segmented scrubber** for the time-lapse:
  - One segment per frame (`total` segments): played = bubble, current =
    coral, future = paper; every 6th divider thicker.
  - It's **read-only**: `role="progressbar"`, `aria-valuemin=1`,
    `aria-valuemax=total`, `aria-valuenow=index+1`, `aria-valuetext` = frame
    time.
  - The `TimeLapse` API has only `start()`/`stop()`, so do not fake seeking.
  - Because it's read-only, it gets **no thumb or knob**, so nobody tries to
    drag it.
  - Start and end times come from the first and last frames' `timeUtc`.
- **Transport.** Previous record, Play/Pause (80 px coral circle), Next record.
- **Captions as lyrics.**
  - The last three captions from the caption stream: older lines in
    `navy-soft` at 19 px; the current line in a bubble-filled block, 30 px,
    `font-strip`. **No `aria-live`**: the Announcer already speaks captions
    (§0.6 rule 1).
  - Keep a short ring buffer in the panel's hook.
  - Never write caption text yourself; show what the engine emits.
- **Up next.** The next three records in registry order, as title strips.
- For **the tour** (D1), the same panel shows the tour's step list from the
  Story state instead of a scrubber, if `src/components/Story/` exposes the
  steps. If it doesn't, show captions and Up next only.

**Check:** the gate. Esc closes the sheet and leaves the time-lapse playing
(phase 1 rule). Reduced motion: no segment animation.

Commit: `feat(player): now playing sheet with frame progress, captions, up next`.

## 7. Phase 5: space windows, stars, and motion for Then vs Now and the time-lapse (3 h)

Design rule: **space lives inside windows.** The UI chrome stays daylight.
Every place that shows Earth as a planet is a window into a night sky:

- the Home globe;
- the new globe stages below;
- the intro;
- the Turntable backdrop (phase 6).

A window is a `--space` rectangle with a 3 px navy border and 14–22 px radius
that sits on the cabinet or panel like a porthole.

### 7.1 `Starfield` component (`src/components/Starfield/index.tsx`)

- Inline SVG, `aria-hidden="true"`, `pointer-events: none`, absolutely fills
  its parent, drawn behind content.
- Deterministic: stars come from a seeded PRNG (e.g. mulberry32 with a fixed
  seed per instance), so server and client markup match. No `Math.random()` in
  render.
- Star mix:
  - ~120 paper dots at 1–2 px radius;
  - ~10 `--star-warm` dots;
  - 4–6 four-point sparkles (a small plus shape, 10–14 px, paper).
  - Flat fills only: **no blur, no glow, no gradients**.
- Twinkle: a CSS opacity step animation (keyframes 1 → 0.35 → 1, 4–7 s,
  staggered delays) on about 15% of stars, only under
  `@media (prefers-reduced-motion: no-preference)` **and** when the app's
  `state.reduceMotion` is false (add a `data-still` attribute and a CSS rule
  that turns it off).
- Prop `density?: "sparse" | "normal"` (sparse = half the stars) for small windows.

### 7.2 `SpaceWindow` component (`src/components/SpaceWindow/index.tsx`)

A wrapper: `position: relative; overflow: hidden; background: var(--space);
border: 3px solid var(--navy); border-radius: var(--radius-sheet)`, with a
`<Starfield/>` behind its children. Text inside uses `text-star`. Any panel
inside uses the `on-space` utility.

### 7.3 Extend the Globe (`src/components/Globe/`)

Make the existing WebGL globe reusable for live content:

1. **`renderer.ts`.**
   - Change `createGlobeRenderer` to take `images: HTMLImageElement[]` (drawn
     in order onto the offscreen `scaled` canvas, so a rain frame can sit over
     the ocean frame).
   - Add `setImages(images)`, which redraws the offscreen canvas and calls
     `texImage2D` again on the same texture.
   - Add `setTarget({lat, lon})`, which updates `u_target` (the ring position).
   - Add `setRing(hex)`, which updates `u_ring`.
2. **`shader.ts`.**
   - Replace the soft atmospheric rim (`u_glow`) with a **hard 3 px navy
     outline** at the disc edge (step function, no smoothstep wider than one
     pixel for anti-aliasing).
   - Read the outline colour from `readPalette().line`.
   - Land keeps `u_land` (now `--sea-deep`).
   - **Do not alter the sampled frame colours**: no lighting multiply on data
     pixels beyond what exists today. If the current shader shades the day
     side, keep it as is.
3. **`use-globe.ts`.** Add an options object:

   ```ts
   interface GlobeOptions {
     images: HTMLImageElement[];
     focus?: { lat: number; lon: number } | null;
     autoTurn?: boolean;
     reduceMotion: boolean;
   }
   ```

   - With `focus`, ease `view.lon/lat` toward the focus each frame
     (`view += (target - view) * (1 - Math.exp(-dt * 3))`, shortest way round
     in longitude) instead of the constant turn. Once settled, add a gentle
     ±6° longitude sway (period 12 s) so it feels alive.
   - Reduced motion: jump to the focus, no sway.
   - Keep drag, inertia, off-screen pause and the `supportsWebGL()` fallback
     exactly as they are.
4. `Globe` gets `images`, `focus`, `ringColor` props. Home passes `[sst]` and
   no focus, so it behaves as today.

### 7.4 Then vs Now: motion stage (`src/components/ThenNow/MotionStage/`)

Shown beside the chart from 1024 px; above it on phones. It's a `SpaceWindow`
containing:

- **The globe**, focused on the selected city. Add
  `src/lib/places/bangladesh-cities.ts`:

  ```ts
  { Dhaka: { lat: 23.81, lon: 90.41 },
    Chattogram: { lat: 22.36, lon: 91.78 },
    Rajshahi: { lat: 24.37, lon: 88.60 },
    Sylhet: { lat: 24.90, lon: 91.87 } }
  ```

  Type it as `Record<ClimateCellName, LatLon>`. The ring sits on the city.
- **A pulse on every beat.** When `player.index` (or `splitIndex`) changes
  while `soundingPart` is set:
  - the ring pulses once (a CSS-free uniform tween in the renderer, or a scaled
    SVG ring overlaid at the projected point; pick the renderer if
    `u_target`/`u_time` already animate a ring, which they do on Home);
  - the ring colour follows the value's sign against the record's baseline:
    `--bubble` above, `--dial` below. Read the value with the **same index →
    value mapping the chart's playhead uses** (find where `PartView` consumes
    `index`) and reuse that function. Don't write a second one.
- **The year odometer.** A large `font-wide` number showing the year at the
  playhead, from the same mapping. It changes with a 120 ms vertical slide
  (none under reduced motion). `aria-hidden`: the chart, its data table and the
  captions already carry it for assistive tech. The stage has a "Pause motion"
  key (§0.6 rule 15).
- **Record stripes**, drawn as the **chart's background bands** (not a
  separate strip), so there's one picture to watch. The globe stays small
  beside the chart and the year counter sits on the chart's playhead. One flat
  stripe per year in the shown windows, filled left to right as the playhead
  passes. Bubble if the value is
  above the baseline, dial if below, paper outline for not-yet-played.
  Fires and Vegetation (no sound) show their stripes fully drawn with no
  playhead.
- **When nothing is playing**, the globe idles on the city (sway only) and
  every stripe is drawn.
- **Split mode** ("Then left, now right"): two rings are out of scope. Keep one
  ring and pulse it on `splitIndex`.

### 7.5 Storm time-lapse: motion stage

On Listen, while the time-lapse runs, the map window gets a toggle **Globe / Flat
map** (a two-option `ChoiceGroup`; Globe by default; remembered in the existing
prefs, see `src/components/AppState/prefs.ts`).

In Globe mode the window becomes a `SpaceWindow` with the Globe showing:

- `images = [sstImage, frame.image]` (`useFrameImages().sst` + `TimeLapseFrame.image`);
- `focus = frame.point` (the storm-following cursor);
- `ringColor = --coral`.

`setImages` runs on each frame change. **Do not re-create the renderer per
frame.** The stage holds a visually hidden sentence ("Globe following the
heaviest rain") and a "Pause motion" key, which stops the turning only; frames
and sound continue. When the run ends, the toggle disappears and the flat map returns.
The flat map path must keep working exactly as today (Flat map mode, no WebGL,
or reduced motion).

### 7.6 Intro and Home

- **Intro (`Opening.tsx`).** The stage is already `bg-void`, which is
  `--space` after phase 2. Add `<Starfield/>` behind it, paper text, and a navy
  waveform turned paper. The Skip intro button is a paper `key` with a
  `--shadow-on-space` shadow.
- **Home.** Wrap the hero globe in a `SpaceWindow` (sparse stars).
  - **The judge's path:** next to the coral "Start listening", a paper key
    "Take the 90-second tour" opens `/listen?tour=true` (the tour starts after
    the start gate's click, as today).
  - Keep one helper line under them (headphones), and drop the second.
  - Under the hero, the five page cards become four (no Official records),
    with one sentence each.

### 7.7 Check

- The gate passes.
- Then vs Now, Dhaka, Heat:
  - Play: the globe turns to Dhaka, the ring pulses in time with the sound, the
    year counts up, and the stripes fill.
  - Stop: everything stops within one frame.
  - Switch city: the globe eases to the new city.
- Time-lapse:
  - The globe follows the storm and the frames change.
  - Toggling to Flat map shows today's map behaviour.
  - Ending the run returns the flat map.
- Reduced motion (OS setting **and** the app setting, separately): no sway, no
  twinkle, no pulse animation, odometer cuts. Frames still change, because they
  are content.
- Performance: at most one WebGL context per visible globe; the Home globe
  pauses off-screen as before.

Commit: `feat(space): starfield and space windows; globe motion for Then vs Now and the time-lapse`.

## 8. Phase 6: the 3D turntable, toon-shaded (time box 2.5 h, with a fallback)

Read `src/components/Turntable/scene/post.ts`, `deck.ts`, `earth.ts`,
`studio.ts` and `quality.ts` fully first.

Today's post chain is:

> render → [SSAO, Ultra] → takram aerial perspective (atmosphere) → [DOF] →
> bloom → AgX tone mapping → vignette → overlay composite (data) → SMAA

The data overlay is already composited **after** tone mapping. Keep that
property.

### 8.1 Target look

- A flat coral plinth with a navy outline and a hard offset shadow.
- A navy platter with grooves and a paper record label.
- A cel-shaded globe with flat land.
- A paper/navy tonearm with a coral stylus.
- A `--space` background with stars.
- Labelled controls.

### 8.2 Steps

1. **Post chain.**
   - Remove SSAO, the aerial-perspective atmosphere, DOF, bloom and vignette.
   - Replace AgX with no tone mapping.
   - Keep the overlay composite and SMAA.
   - Remove the atmosphere's precomputed texture load
     (`PrecomputedTexturesLoader`, the `public/atmosphere/` fetch) from the
     startup path. This also fixes the long black first load.
   - Keep `quality.ts` tiers but drop the fields that no longer do anything,
     and update the Settings UI that shows them.
2. **Deck.**
   - `MeshPhysicalMaterial` → `MeshToonMaterial` with a 3-step `gradientMap` (a
     3×1 `DataTexture`, `NearestFilter`). Colours come from new tokens added to
     `globals.css` and `css-tokens.ts`: `--deck-top: #FF6B4A`,
     `--deck-side: #E0533A`, `--platter: #14213D`, `--groove: #3C4A66`,
     `--label: #FFF8E6`, `--arm: #FFF8E6`, `--arm-edge: #14213D`,
     `--stylus: #FF6B4A`.
   - Outlines: the inverted-hull method. For each deck mesh, add a clone with
     `MeshBasicMaterial({ color: navy, side: BackSide })`, scaled by about 1.02
     around its own centre (or pushed along normals in a tiny vertex shader for
     non-convex parts), `renderOrder` before the mesh.
   - Hard shadow: a flat navy `ShapeGeometry`/`PlaneGeometry` under the plinth,
     offset +x/+z, `MeshBasicMaterial`, no real shadow maps.
3. **Earth.**
   - Land becomes a flat `--sea-deep` fill with navy country lines (the
     existing geo overlay lines, recoloured through `--geo-border: #14213D`).
   - Lighting quantised to 2 steps (lit, shade at 75%) on **land only**.
   - **The data overlay keeps its exact pixel colours**. Verify by sampling
     one ocean pixel on the 2D map and the same point on the globe in the debug
     overlay (`src/components/Turntable/debug.ts`): the RGB must match within
     ±2 per channel.
   - Clouds and night lights are off in this style.
4. **Background.** Clear colour `--space`. Add a star sphere: `Points` with
   about 800 stars on a sphere of radius about 50× the globe's, `PointsMaterial({
   sizeAttenuation: false, size: 1.5–2.5 })`, paper colour, a few in
   `--star-warm`, no additive blending, `depthWrite: false`, excluded from
   picking.
5. **Interface over the scene.** Every Turntable control gets a visible text
   label next to its icon (today they're icon-only). The panels use `on-space`.
   The value chip at top-left gets 24 px margins (today it touches the screen
   edge). Long place names wrap to two lines instead of truncating.
6. **Loading.** Until the first frame renders, show an `on-space` panel
   "Loading the turntable" with a determinate bar if texture progress is
   available, else an indeterminate stripe animation (still under reduced
   motion). "Press any key to skip" appears only after the first frame.
7. **Scenes** (Ghost Earths, Delta, Sound terrain, Dhaka time tunnel). Show
   them in the Turntable's side panel as record **sleeves**: square paper cards,
   2.5 px navy outline, a flat line-art icon on a palette fill, the title in
   `font-strip`, real buttons.

### 8.3 Fallback

If after 2.5 h the toon pipeline isn't passing its checks, revert phase 6's
`scene/` changes (`git restore -- src/components/Turntable/scene`) and ship only:

- step 1 (the lighter post chain, which is still a big load-time win);
- the space background colour and stars (step 4);
- steps 5 and 6 (labels, margins, loader).

Say so in the summary.

### 8.4 Check

- The gate passes.
- The turntable shows its first frame in under 5 s on a mid-range laptop over a
  normal connection; record the time in the summary.
- The data pixel check from step 3 passes.
- No console errors.
- The e2e turntable feature passes (`e2e/features/turntable.ts`).

Commit: `feat(turntable): toon-shaded deck, flat land, starfield, labelled controls, fast first frame`.

## 9. Phase 7: the remaining review items (2 h)

Do these in order; each is small.

1. **Frame labels only where they mean something.** Remove `FrameLabel` from
   Then vs Now and How we know headers. Listen keeps it (phase 3 badges row);
   Home keeps the one under the globe.
2. **How we know.**
   - Make the four tiles content-height: no empty middle; the number, the
     sentence and the link sit together.
   - Rephrase the ground-vs-satellite stat so it's clear what it measures. Use
     the existing data sentence; if the meaning isn't in the data file, ask
     Pratik rather than guess.
3. **Official records.**
   - Same page width and gutters as other pages.
   - Group the 19 pills under headings by kind (model / observation / EIC) as
     title strips with codes C1… (from the registry).
   - The record map gets coastlines (reuse the geo overlay lines the Turntable
     draws, or the `--geo-border` line layer) so the blobs have geography.
   - The dock never covers content: add bottom padding equal to the dock height
     on every scrolling page.
   - Copy fixes:

     | Before | After |
     |---|---|
     | "date-list, 1 frames" | "1 frame" |
     | "Record Aug 2025 to Aug 2025" | "Aug 2025" |
     | "19 Aug 2025 – 19 Aug 2025" | "19 Aug 2025" |
     | "coastline match 0.916 (passes at 0.90)" | "Map lines up with coastlines (score 0.916, pass 0.90)" |
     | "rank vs MERRA-2 ρ 0.41" | "Agreement with NASA MERRA-2: ρ 0.41" (where the sentence already explains what ρ means) |

     Make each fix in the formatter or the data-sentence code, not by string
     patching.
   - Separate the "SVS 5669 SVS 5572 GEOS Aerosols (2025)" items with commas.
4. **Then vs Now.**
   - The chart axis covers only the two windows: a broken axis with a visible
     gap marker between "then" and "now", so the middle third isn't blank.
   - Place tabs don't orphan a single tab on phones: use a horizontal scroll
     row.
   - On phones, the chart comes before its play controls.
   - Where two cities share one grid cell, show the existing note **before**
     the chart, not after.
   - **Fewer controls:**
     - One coral Play button.
     - "Then left, now right" and "Play heat, rain and water" move into a
       "More ways to listen" menu.
     - Fires and Vegetation (no sound) move behind a "More records" tab.
     - The finding sentence sits above the chart; sources go into the existing
       Details disclosure.
   - **Turntable:**
     - The legend shows only while the needle moves or on hover/focus of the
       readout.
     - Globe place labels are capped at 6 visible.
     - Its controls live in the shared mini player (§5.5 item 7): 4 labelled
       keys (Turn, Search, Where am I, Mixer) plus "More" for Bookmarks,
       Layers, View and Keys. There's one bottom bar, never two.
5. **Information pages without the gate.** How we know (and Official records)
   render without the Start gate. The gate appears only when the user triggers
   sound there.
6. **Loading, error and empty states.**
   - Design each one in the theme, with plain text and no spinner as the only
     signal: slow data, a failed frame image, no WebGL (the Globe and the
     Turntable fall back to the flat frame, which exists for the Home globe),
     and an unknown record code.
   - Errors say what happened and what to do next, through the Announcer
     too.
7. **Bangla.**
   - Nav labels "Official records" and "Turntable", all `SourceBadges` strings,
     and the frame-rule sentences ("Higher = warmer", "More drops = heavier
     rain") get Bangla keys.
   - Times use Bengali digits too (`formatUtc` with `lang`).
   - List every new Bangla string for review.
8. **Turntable copy.** Remove "(pending team approval)" if it's still anywhere
   (phase 1 removed the English one).
9. **No-JS fallback.** Add a `<noscript>` block to the root layout, styled with
   the theme: "Bloop needs JavaScript to play sound from NASA's frames." plus
   the project description and a link to the README on GitHub.
10. **Data freshness.** Run `npm run refresh:live` if the environment has Python
   and network access. If it can't run, say so in the summary. **Never edit
   data files by hand.**

**Check:** the gate. Then a full manual pass at 1440×900, 1280×720, 1024×768,
1920×1080 and 390×844 on every page: nothing overlaps, nothing is clipped,
nothing scrolls sideways.

Commit: `fix: review follow-ups (frame labels, How, Official, Then vs Now, gate, Bangla, noscript)`.

## 10. Phase 8: final verification and hand-off (45 min)

1. **Re-take the preview image.**

   ```sh
   bun run build && bun run start &
   bunx playwright screenshot --viewport-size=1200,630 http://localhost:3000/ public/og.jpg
   ```

   (Check the image: the hero must fill it. If the start gate or splash shows,
   wait for the hero with a small Playwright script instead.)
2. **Run the gate and `bun run e2e`.** Everything passes.
3. **Manual checklist** in a production build (`bun run start`):
   - **Start listening:** intro on space with stars → Esc → the map plays sound.
   - **Rack:** every strip works. Code entry B2 works. Typing doesn't trigger
     shortcuts.
   - **Mini player:** pause/play, prev/next, the longitude scrubber moves the
     needle and the sound follows.
   - **D2 time-lapse:** globe in a space window follows the storm, the player
     sheet shows frame N of M and captions; Esc closes the sheet, sound
     continues; Esc again stops.
   - **Then vs Now Dhaka Heat:** globe, pulse, odometer, stripes. Chattogram:
     the globe moves.
   - **Turntable:** first frame fast, toon look, stars, labelled controls, data
     colours exact.
   - **Bangla:** every page, no English left in the chrome.
   - **Reduced motion:** OS setting and the app setting.
   - **Keyboard only:** every page.
   - **Phone width:** every page.
   - **`/nope`:** branded 404.
   - **Accessibility pass** (§0.6), on a production build:
     - **Automated:** add `e2e/a11y.e2e.ts`. Use the existing helpers in
       `e2e/lib/app.ts` to pass the start gate. Inject
       `node_modules/axe-core/axe.min.js` (axe-core is already a dev
       dependency) with `page.addScriptTag({ path: path.join(process.cwd(),
       "node_modules/axe-core/axe.min.js") })`, then run `axe.run()` on `/`,
       `/listen`, `/then-now`, `/how`, `/official` and `/turntable`. Expect 0
       violations of impact "serious" or "critical". Also run it with the
       player sheet open.
     - **Screen readers, the full flow** (start, pick B2 by code, play, the
       time-lapse, Then vs Now, Sources and checks, Esc behaviour):
       - NVDA with Firefox or Chrome on Windows;
       - VoiceOver on macOS or iOS;
       - TalkBack on Android.

       If a device isn't available, say so in the hand-off notes. Never claim
       a test that wasn't run.
     - **Low vision:**
       - 200% zoom on every page;
       - 320 px width on every page with no sideways scrolling;
       - Comfortable text on;
       - forced colours emulated;
       - the text-spacing override (§0.6 rule 11).
     - **Motion:** every moving stage pauses with its key.
   - **Performance budget.** Production build, Chrome DevTools with "Fast 4G"
     and 4× CPU slowdown:
     - Home shows its heading and a usable "Start listening" within 3 s.
     - The first sound plays within 2 s of the click.
     - Home downloads nothing before Start beyond the ocean frame and the app
       code.
     - Lighthouse on `/`: Accessibility 100, Performance ≥ 80.

     Record the numbers in the hand-off notes. If one misses, find the largest
     request in the Network panel and lazy-load it behind Start.
   - **Congestion pass** (§0.5) on every page at 1280×720:
     - one coral action;
     - no duplicated values;
     - badges only in Liner notes (plus the stale pill);
     - nothing static has a shadow.
4. **Write `docs/FINAL_PASS.md`** (short): what changed per phase, what was cut
   or fell back, the new Bangla strings to review, the pre-existing failures
   from phase 0, and the measured turntable first-frame time.
5. **Deploy note for Pratik** (don't deploy yourself): Cloudflare Pages builds
   with `bun run build` and serves `out/`.

Commit: `chore: final pass hand-off notes, preview image`.

## 11. If time runs out

§0.6 (blind and low-vision rules) is never cut: whatever ships must pass it.

**Time budget.** The phases add up to about 17–19 hours of focused work,
including the accessibility testing. That's more than one day for one agent, so
plan for the cut line below, and keep the screen-reader and device tests for a
person on the team (§0.6 testing needs real devices).
The phases are ordered by value. Minimum to ship: **phases 1, 2 and 3, plus item 5 of phase 7** (information pages without the start gate)
(gate-free info pages). Then add phase 5's Then vs Now stage and the time-lapse
stage, then phase 4, then phase 6. Never leave the tree mid-phase: finish the
current phase's checks or `git restore` its files, then stop and write the
hand-off notes.

## 12. Team tasks (people, not the agent)

These are what lift Bloop from good to excellent. They need ears and real
people. The agent should list them in the hand-off notes, not attempt them.

1. **Listening pass (45 min, two people, headphones, then a phone speaker).**
   - Run `bun run dev` and open `/dev/audio`. Use its Loudness and Mixer
     sections to check that every record plays at a similar loudness: no
     record should make you reach for the volume.
   - Then play every rack record:
     - Does each sound clearly differ from its neighbours?
     - Is warm vs cold obvious within 5 seconds?
     - Is rain vs dry obvious?
     - Does anything clip, click or get tiring after a minute?
   - Fix with the mapping values in `public/mapping.json`; never by changing
     the data.
2. **Two short user tests (15 min each), before judging.**
   - One blind or low-vision screen-reader user, and one sighted person who
     has never seen Bloop.
   - Three tasks each, no help:
     - "Find out how warm the sea is near Chattogram."
     - "Play the storm and tell me where the rain is heaviest."
     - "Tell me whether Dhaka got hotter."
   - Note where they get stuck, and fix the top three issues.
3. **Bangla review** of every string the agent lists as new.
4. **The 30-second final video** (due 14 Nov):
   - Start listening;
   - A0 "How it sounds";
   - picking B1 by code;
   - the globe turning to Dhaka with the year climbing;
   - the storm followed on the globe.

   Use real sound throughout and captions on screen.
5. **Data refresh** right before judging (`npm run refresh:live`), and a check
   that the home page doesn't show the stale-data pill.

## Appendix A: the phase 1 changes as a diff (fallback for `git am`)

Apply with `git apply --3way appendix-a.diff` after saving the block below to a
file. Then create `public/og.jpg` in phase 8, and run `bun run i18n:todo`.

```diff
diff --git a/src/app/layout.tsx b/src/app/layout.tsx
index 81e31dc..e7dffcd 100644
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -13,9 +13,21 @@ const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["
 const anek = Anek_Bangla({ variable: "--font-anek", subsets: ["bengali"], preload: false });
 const tiro = Tiro_Bangla({ variable: "--font-tiro", subsets: ["bengali"], weight: "400", style: ["normal", "italic"], preload: false });
 
+const DESCRIPTION = "Hear NASA Earth Information Center frames as live sound, and see how the values were checked.";
+
 export const metadata: Metadata = {
-  title: { default: appEn["app.title"], template: `%s · ${appEn["app.title"]}` },
-  description: "Hear NASA Earth Information Center frames as live sound, and see how the values were checked.",
+  // Absolute URLs for link previews (the Space Apps submission, Discord, social posts).
+  metadataBase: new URL("https://bloop-ptsd.pages.dev"),
+  title: { default: `${appEn["app.title"]}: the Earth Information Jukebox`, template: `%s · ${appEn["app.title"]}` },
+  description: DESCRIPTION,
+  openGraph: {
+    type: "website",
+    siteName: appEn["app.title"],
+    title: `${appEn["app.title"]}: the Earth Information Jukebox`,
+    description: DESCRIPTION,
+    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Bloop: a globe of today's ocean temperature beside the words Listen to Earth's latest frames" }],
+  },
+  twitter: { card: "summary_large_image" },
 };
 
 export const viewport: Viewport = {
diff --git a/src/app/not-found.tsx b/src/app/not-found.tsx
new file mode 100644
index 0000000..b66b032
--- /dev/null
+++ b/src/app/not-found.tsx
@@ -0,0 +1,8 @@
+import { ClientRouter } from "@/router/ClientRouter";
+
+// The static export writes this page as 404.html, which the host serves for any unknown address.
+// The app's router then shows its own "no signal" page (pages/NotFound) inside the normal shell,
+// instead of Next's default white 404.
+export default function NotFound() {
+  return <ClientRouter />;
+}
diff --git a/src/components/AppShell/use-global-escape.ts b/src/components/AppShell/use-global-escape.ts
index 8185bb1..6ec9a94 100644
--- a/src/components/AppShell/use-global-escape.ts
+++ b/src/components/AppShell/use-global-escape.ts
@@ -2,26 +2,43 @@
 
 import { useEffect } from "react";
 import { consumeEscape } from "@/lib/escape";
+import { useAppState } from "../AppState/use-app-state";
 import type { Commands } from "../Commands/use-commands";
 
+/** Open dialogs, sheets, popovers and menus (Base UI marks an open popup with data-open). */
+const OPEN_POPUP = '[role="dialog"][data-open], [role="alertdialog"][data-open], [role="menu"][data-open], [role="listbox"][data-open]';
+
 /**
- * Esc stops all sound and closes panels from anywhere on the page (plan §9.3).
- * `alsoStop` covers things that run without sound (the silent time-lapse).
- * Capture phase: an open sheet or dialog would otherwise take the first Esc.
+ * Esc closes the top layer first, then stops all sound (plan §9.3):
+ * - a view may claim it for something smaller (Turntable: close search, stop a tour; the intro: skip);
+ * - an open Help, Inspector, sheet, popover or menu takes it and closes, and the sound keeps playing;
+ * - with nothing open, Esc stops all sound. `alsoStop` covers things that run without sound (the silent time-lapse).
+ * Capture phase, so this runs before an open popup handles the same key.
  */
 export function useGlobalEscape(commands: Commands, alsoStop: () => void): void {
+  const { state, dispatch } = useAppState();
+  const { helpOpen, panelOpen } = state;
   useEffect(() => {
     const onKey = (e: KeyboardEvent) => {
       if (e.key !== "Escape") return;
-      // A view may use this Esc for something smaller first (Turntable: close search, stop a tour).
       if (consumeEscape()) {
         e.preventDefault();
         return;
       }
+      if (helpOpen) {
+        dispatch({ type: "setHelpOpen", open: false });
+        return;
+      }
+      // Base UI closes its own popup on this same key press; only the popup goes.
+      if (document.querySelector(OPEN_POPUP)) return;
+      if (panelOpen) {
+        dispatch({ type: "setPanelOpen", open: false });
+        return;
+      }
       commands.stopAll();
       alsoStop();
     };
     window.addEventListener("keydown", onKey, true);
     return () => window.removeEventListener("keydown", onKey, true);
-  }, [commands, alsoStop]);
+  }, [commands, alsoStop, helpOpen, panelOpen, dispatch]);
 }
diff --git a/src/components/FrameLabel.tsx b/src/components/FrameLabel.tsx
index 6fa8f9e..ed5b7aa 100644
--- a/src/components/FrameLabel.tsx
+++ b/src/components/FrameLabel.tsx
@@ -17,7 +17,7 @@ import { useShownPoint } from "./TimeLapse/use-shown-point";
  * it is the time of the frame being shown. Only the frames of the track shown.
  * Each frame carries its source and data-age badges (meta/freshness.json).
  */
-export function FrameLabel({ className }: { className?: string }) {
+export function FrameLabel({ className, compact = false }: { className?: string; compact?: boolean }) {
   const { state } = useAppState();
   const { sst, rain, fields } = useLiveData();
   const t = useT();
@@ -31,6 +31,17 @@ export function FrameLabel({ className }: { className?: string }) {
         track !== "ocean" && rain ? { product: t("frame.product.rain"), time: rain.meta.frame_time_utc, voice: "rain" as const } : null,
       ].filter((f) => f !== null);
 
+  // One line, no rule or badges: the Listen page's head has a fixed height on screens narrower than 2:1,
+  // and the full label (with its age badges) didn't fit there. The details stay in the Inspector.
+  if (compact) {
+    const text = t("frame.compact", { list: frames.map((f) => t("frame.compactItem", { product: f.product, datetime: formatUtc(f.time, state.lang) })).join(" · ") });
+    return (
+      <p title={text} className={cn("truncate text-small text-haze", className)}>
+        {text}
+      </p>
+    );
+  }
+
   return (
     <div className={cn("space-y-1 text-small text-haze", className)}>
       {frames.map((f) => {
diff --git a/src/components/Header/TuningDial.tsx b/src/components/Header/TuningDial.tsx
index 17d867c..f7f1239 100644
--- a/src/components/Header/TuningDial.tsx
+++ b/src/components/Header/TuningDial.tsx
@@ -33,7 +33,7 @@ export function TuningDial({ className }: { className?: string }) {
                   active ? "text-moon" : "text-haze hover:text-moon",
                 )}
               >
-                <span aria-hidden="true" className={cn("hidden font-mono text-small tabular-nums sm:inline", active ? "text-shapla" : "text-haze/70 group-hover:text-haze")}>
+                <span aria-hidden="true" className={cn("hidden font-mono text-small tabular-nums xl:inline", active ? "text-shapla" : "text-haze/70 group-hover:text-haze")}>
                   {formatIndex(i + 1, state.lang)}
                 </span>
                 <span className="hidden sm:inline">{t(item.label)}</span>
diff --git a/src/components/Opening.tsx b/src/components/Opening.tsx
index 0c86a09..c59b1e9 100644
--- a/src/components/Opening.tsx
+++ b/src/components/Opening.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import { useEffect, useRef, useState } from "react";
+import { useCallback, useEffect, useRef, useState } from "react";
 import { ArrowRight } from "@phosphor-icons/react";
 import { AnimatePresence, motion } from "motion/react";
 import { Button } from "@/components/ui/button";
@@ -8,6 +8,7 @@ import { EASE_OUT_SOFT } from "@/lib/motion";
 import { audio } from "@/lib/audio-adapter";
 import type { PlayerHandle } from "@/lib/audio-adapter/types";
 import { openingPath } from "@/lib/data";
+import { pushEscapeHandler } from "@/lib/escape";
 import { captionText } from "@/lib/i18n";
 import { useAnnounce } from "./Announcer/use-announcer";
 import { useAppState, useT } from "./AppState/use-app-state";
@@ -67,10 +68,20 @@ export function Opening() {
   }, [active, sstStatus, dispatch]);
 
   // Skip works whether or not the sound has started yet.
-  const skip = () => {
+  const skip = useCallback(() => {
     handleRef.current?.stop();
     dispatch({ type: "introDone" });
-  };
+  }, [dispatch]);
+
+  // Esc does exactly what Skip does. The opening claims it, so the global Esc
+  // (stop all sound) doesn't run and leave the map silent after "Start listening".
+  useEffect(() => {
+    if (!active) return;
+    return pushEscapeHandler(() => {
+      skip();
+      return true;
+    });
+  }, [active, skip]);
 
   // Its own stage, unlike any page: near-black, a breathing glow, a big signal
   // ring, no header or dock. It fades away as the map opens from the equator.
diff --git a/src/components/pages/Listen/index.tsx b/src/components/pages/Listen/index.tsx
index 233b24a..b5eb6df 100644
--- a/src/components/pages/Listen/index.tsx
+++ b/src/components/pages/Listen/index.tsx
@@ -53,7 +53,7 @@ export function ListenPage() {
               <h1 id="listen-title" data-page-title tabIndex={-1} className="font-serif text-title leading-tight md:text-headline lg:truncate lg:text-title">
                 {t("listen.title")}
               </h1>
-              <FrameLabel className="hidden lg:block lg:listen-wide:hidden" />
+              <FrameLabel compact className="hidden lg:block lg:listen-wide:hidden" />
             </div>
             {!story && <TrackChoice className="shrink-0 lg:listen-wide:hidden" />}
           </header>
diff --git a/src/lib/i18n/bn/app.ts b/src/lib/i18n/bn/app.ts
index fefa42d..f5bbc49 100644
--- a/src/lib/i18n/bn/app.ts
+++ b/src/lib/i18n/bn/app.ts
@@ -48,7 +48,7 @@ export const appBn: Translated<typeof appEn> = {
   "help.open": "সাহায্য",
   "help.keys": "কীবোর্ড",
 
-  "badge.comingOctober": "অক্টোবরে আসছে",
+  "badge.comingOctober": "পরিকল্পিত",
   "badge.loadingRain": "বৃষ্টি লোড হচ্ছে",
 
   "map.roleDescription": "শব্দ-মানচিত্র",
@@ -84,6 +84,8 @@ export const appBn: Translated<typeof appEn> = {
   "frame.product.rain": "বৃষ্টি ও তুষার",
   // Plan §16 "Frame label": a translation, to be checked by the team.
   "frame.label": (p: { product: string; datetime: string }) => `EIC ফ্রেম: ${p.product}, ${p.datetime} UTC। শব্দটি এই ফ্রেম থেকে সরাসরি তৈরি।`,
+  "frame.compact": (p: { list: string }) => `EIC ফ্রেম: ${p.list}। শব্দ এই ফ্রেমগুলো থেকে সরাসরি তৈরি।`,
+  "frame.compactItem": (p: { product: string; datetime: string }) => `${p.product}, ${p.datetime} UTC`,
 
   "sound.pause": "শব্দ থামান",
   "sound.play": "শব্দ চালান",
@@ -121,7 +123,7 @@ export const appBn: Translated<typeof appEn> = {
   "whisper.kind.sst": "সমুদ্রপৃষ্ঠের তাপমাত্রা",
   "whisper.kind.rain": "বৃষ্টি",
   "whisper.announce": (p: { text: string; source: string }) => `${p.text} উৎস: ${p.source}।`,
-  "xray.unavailable": "এক্স-রে অক্টোবরে আসছে: এর জন্য নাসার কালারবার ডেটা লাগবে, যা এখনো প্রকাশিত হয়নি।",
+  "xray.unavailable": "এক্স-রে পরিকল্পিত: এর জন্য নাসার কালারবার ডেটা লাগবে, যা এখনো প্রকাশিত হয়নি।",
 
   "announce.track": (p: { track: string }) => `এখন শুনছেন: ${p.track}।`,
   "announce.mode": (p: { mode: string }) => `${p.mode} মোড।`,
diff --git a/src/lib/i18n/bn/context.ts b/src/lib/i18n/bn/context.ts
index f257835..41fc6e2 100644
--- a/src/lib/i18n/bn/context.ts
+++ b/src/lib/i18n/bn/context.ts
@@ -52,7 +52,7 @@ export const contextBn: Translated<typeof contextEn> = {
   "thenNow.moreTitle": "আরও রেকর্ড, আগে বনাম এখন",
   "thenNow.part.fires": "আগুন",
   "thenNow.part.vegetation": "গাছপালা",
-  "field.soundOctober": "এই রেকর্ডের এখনো শব্দ নেই: অক্টোবরে আসছে",
+  "field.soundOctober": "এই রেকর্ডের এখনো শব্দ নেই",
   "field.place": "স্থান",
   "field.sources": "এই সংখ্যাগুলো কোথা থেকে এসেছে",
   "field.rule": "নিয়ম",
diff --git a/src/lib/i18n/bn/help.ts b/src/lib/i18n/bn/help.ts
index aece3bc..b27d9e5 100644
--- a/src/lib/i18n/bn/help.ts
+++ b/src/lib/i18n/bn/help.ts
@@ -23,9 +23,9 @@ export const helpBn: Translated<typeof helpEn> = {
   "key.t.action": "আগে বনাম এখন",
   "key.l.action": "লেজেন্ড শুনুন (নমুনা শব্দ)",
   "key.p.action": "এই মান কোথা থেকে এসেছে",
-  "key.x.action": "এক্স-রে: একটি রং কীভাবে সংখ্যা ও শব্দ হয় (অক্টোবরে আসছে)",
+  "key.x.action": "এক্স-রে: একটি রং কীভাবে সংখ্যা ও শব্দ হয় (পরিকল্পিত)",
 
-  "october.heading": "এখনো তৈরি হয়নি",
+  "october.heading": "পরের পরিকল্পনা",
   "october.xray": "এক্স-রে: একটি রং কীভাবে সংখ্যা ও শব্দ হয় (নাসার কালারবার ডেটার অপেক্ষায়)",
   "october.aiByEar": "“কানে শুনে এআই যাচাই” আর “পৃথিবীকে জিজ্ঞেস করুন”, একটি ভয়েস এজেন্ট (এআই কখনো সংখ্যা তৈরি করে না)",
   "october.study": "অন্ধ ও স্বল্পদৃষ্টিসম্পন্ন প্রাপ্তবয়স্কদের নিয়ে একটি শ্রবণ-গবেষণা",
diff --git a/src/lib/i18n/bn/pages.ts b/src/lib/i18n/bn/pages.ts
index 8c56690..2f53d8c 100644
--- a/src/lib/i18n/bn/pages.ts
+++ b/src/lib/i18n/bn/pages.ts
@@ -76,7 +76,7 @@ export const pagesBn: Translated<typeof pagesEn> = {
   "how.globe.value": (p: { percent: number }) => `${int(p.percent)}%`,
   "how.open": "পুরো যাচাই পড়ুন",
   "how.openRules": "সব নিয়ম দেখুন",
-  "how.openGlobe": "টিজার পড়ুন",
+  "how.openGlobe": "প্রিভিউ পড়ুন",
   "how.credits": "কৃতজ্ঞতা",
   "how.keys": "কী ও প্রবেশযোগ্যতা",
 
diff --git a/src/lib/i18n/bn/panels.ts b/src/lib/i18n/bn/panels.ts
index c5717da..6f1c147 100644
--- a/src/lib/i18n/bn/panels.ts
+++ b/src/lib/i18n/bn/panels.ts
@@ -35,7 +35,7 @@ export const panelsBn: Translated<typeof panelsEn> = {
   "truth.checkedOn": (p: { datetime: string }) => `যাচাই করা হয়েছে ${p.datetime} UTC`,
   "truth.rain.plotCaption": (p: { run: string; points: number }) => `ওপরের যাচাই, চিত্রে (IMERG ${p.run} রান, ${int(p.points)}টি বিন্দু)।`,
 
-  "globe.teaser": "টিজার: অক্টোবরে আসছে",
+  "globe.teaser": "প্রাথমিক প্রিভিউ",
   "globe.plan": "নাগরিক পর্যবেক্ষক বনাম স্যাটেলাইট: দুটি দৃষ্টিভঙ্গি, ঠিক বনাম ভুল নয়।",
   "globe.featured": (p: { date: string; lat: number; lon: number; ground: number; satellite: number; reports: number }) =>
     `একটি সাধারণ দিন: ${p.date} তারিখে ${formatFixed(p.lat, "bn", 2)}° উত্তর, ${formatFixed(p.lon, "bn", 2)}° পূর্বের কাছে মাটিতে থাকা পর্যবেক্ষকেরা ` +
diff --git a/src/lib/i18n/bn/story.ts b/src/lib/i18n/bn/story.ts
index 68cb8a7..503408f 100644
--- a/src/lib/i18n/bn/story.ts
+++ b/src/lib/i18n/bn/story.ts
@@ -29,7 +29,7 @@ export const storyBn: Translated<typeof storyEn> = {
   "story.stormPeak": (p: { reading: string; datetime: string }) => `এর পথে সবচেয়ে ভারী: ${p.reading}, ${p.datetime} UTC।`,
   "story.stormFailed": "ঝড়ের ফ্রেম লোড করা যায়নি, তাই এই ধাপ বাদ দেওয়া হলো।",
   "story.whisper": (p: { reading: string }) => `ঝড়টি এখন যেখানে: ${p.reading}।`,
-  "story.xraySkipped": "এক্স-রে অক্টোবরে আসছে: এটি নাসার কালারবার ডেটার অপেক্ষায়।",
+  "story.xraySkipped": "এক্স-রে পরিকল্পিত: এটি নাসার কালারবার ডেটার অপেক্ষায়।",
   "story.truth": (p: { sentence: string }) => `আমরা কীভাবে জানি? ${p.sentence}`,
   "story.truthLoading": "বৃষ্টির তথ্য লোড হলে যাচাইয়ের প্যানেলে বৃষ্টির যাচাই দেখা যাবে।",
   "story.end": (p: { close: string }) => `এ ছিল একটি জায়গা। পৃথিবীর যেকোনো জায়গা শুনতে “${p.close}” বেছে নিন।`,
diff --git a/src/lib/i18n/en/app.ts b/src/lib/i18n/en/app.ts
index 620da2f..c23a550 100644
--- a/src/lib/i18n/en/app.ts
+++ b/src/lib/i18n/en/app.ts
@@ -42,7 +42,7 @@ export const appEn = {
   "help.open": "Help",
   "help.keys": "Keys",
 
-  "badge.comingOctober": "Coming in October",
+  "badge.comingOctober": "Planned",
   "badge.loadingRain": "Loading rain",
 
   "map.roleDescription": "sound map",
@@ -85,6 +85,9 @@ export const appEn = {
   // Plan §16 "Frame label", exact wording.
   "frame.label": (p: { product: string; datetime: string }) =>
     `EIC frame: ${p.product}, ${p.datetime} UTC. Sound generated live from this frame.`,
+  // The same label on one line, for the Listen page's head on screens narrower than 2:1 (FrameLabel compact).
+  "frame.compact": (p: { list: string }) => `EIC frames: ${p.list}. Sound generated live from these frames.`,
+  "frame.compactItem": (p: { product: string; datetime: string }) => `${p.product}, ${p.datetime} UTC`,
 
   "sound.pause": "Pause sound",
   "sound.play": "Play sound",
@@ -123,7 +126,7 @@ export const appEn = {
   "whisper.kind.sst": "sea surface temperature",
   "whisper.kind.rain": "rain",
   "whisper.announce": (p: { text: string; source: string }) => `${p.text} Source: ${p.source}.`,
-  "xray.unavailable": "X-ray is coming in October: it needs NASA's colorbar data, which isn't published yet.",
+  "xray.unavailable": "X-ray is planned: it needs NASA's colorbar data, which isn't published yet.",
 
   "announce.track": (p: { track: string }) => `Now hearing: ${p.track}.`,
   "announce.mode": (p: { mode: string }) => `${p.mode} mode.`,
diff --git a/src/lib/i18n/en/context.ts b/src/lib/i18n/en/context.ts
index a513c64..1b664d5 100644
--- a/src/lib/i18n/en/context.ts
+++ b/src/lib/i18n/en/context.ts
@@ -49,7 +49,7 @@ export const contextEn = {
   "thenNow.moreTitle": "More records, then vs now",
   "thenNow.part.fires": "Fires",
   "thenNow.part.vegetation": "Vegetation",
-  "field.soundOctober": "No sound for this record yet: coming in October",
+  "field.soundOctober": "No sound for this record yet",
   "field.place": "Place",
   "field.sources": "Where these numbers come from",
   "field.rule": "Rule",
diff --git a/src/lib/i18n/en/help.ts b/src/lib/i18n/en/help.ts
index 359358b..526ec87 100644
--- a/src/lib/i18n/en/help.ts
+++ b/src/lib/i18n/en/help.ts
@@ -23,10 +23,10 @@ export const helpEn = {
   "key.t.action": "Then vs Now",
   "key.l.action": "Hear the legend (reference sounds)",
   "key.p.action": "Where this value comes from",
-  "key.x.action": "X-ray: how a colour becomes a number and a sound (coming in October)",
+  "key.x.action": "X-ray: how a colour becomes a number and a sound (planned)",
 
   // Team plan §11.7 concept-only items, plus X-ray: shown with a "Coming in October" label.
-  "october.heading": "Not built yet",
+  "october.heading": "Planned next",
   "october.xray": "X-ray: how a colour becomes a number and a sound (waits for NASA's colorbar data)",
   "october.aiByEar": "\"Check the AI by ear\" and \"Ask the Earth\", a voice agent (the AI never produces numbers)",
   "october.study": "A listening study with blind and low-vision adults",
diff --git a/src/lib/i18n/en/pages.ts b/src/lib/i18n/en/pages.ts
index 8f69d70..817b124 100644
--- a/src/lib/i18n/en/pages.ts
+++ b/src/lib/i18n/en/pages.ts
@@ -80,7 +80,7 @@ export const pagesEn = {
   "how.globe.value": (p: { percent: number }) => `${formatInteger(p.percent, "en")}%`,
   "how.open": "Read the full check",
   "how.openRules": "See every rule",
-  "how.openGlobe": "Read the teaser",
+  "how.openGlobe": "Read the preview",
   "how.credits": "Credits",
   "how.keys": "Keys and accessibility",
 
diff --git a/src/lib/i18n/en/panels.ts b/src/lib/i18n/en/panels.ts
index 86949d5..bfa83fd 100644
--- a/src/lib/i18n/en/panels.ts
+++ b/src/lib/i18n/en/panels.ts
@@ -40,7 +40,7 @@ export const panelsEn = {
     `The check above, plotted (IMERG ${p.run} run, ${formatInteger(p.points, "en")} points).`,
 
   // GLOBE duet teaser (contract §12; plan §16 "GLOBE (teaser)" wording is the heading line).
-  "globe.teaser": "Teaser: coming in October",
+  "globe.teaser": "Early preview",
   "globe.plan": "Citizen observers vs satellite: two perspectives, not right vs wrong.",
   "globe.featured": (p: { date: string; lat: number; lon: number; ground: number; satellite: number; reports: number }) =>
     `A typical day: on ${p.date} near ${formatFixed(p.lat, "en", 2)}° N, ${formatFixed(p.lon, "en", 2)}° E, observers on the ground ` +
diff --git a/src/lib/i18n/en/story.ts b/src/lib/i18n/en/story.ts
index c855436..ba582ae 100644
--- a/src/lib/i18n/en/story.ts
+++ b/src/lib/i18n/en/story.ts
@@ -24,7 +24,7 @@ export const storyEn = {
   "story.stormPeak": (p: { reading: string; datetime: string }) => `Heaviest on its path: ${p.reading}, ${p.datetime} UTC.`,
   "story.stormFailed": "The storm frames couldn't load, so this step is skipped.",
   "story.whisper": (p: { reading: string }) => `Where the storm is now: ${p.reading}.`,
-  "story.xraySkipped": "X-ray is coming in October: it waits for NASA's colorbar data.",
+  "story.xraySkipped": "X-ray is planned: it waits for NASA's colorbar data.",
   "story.truth": (p: { sentence: string }) => `How do we know? ${p.sentence}`,
   "story.truthLoading": "The rain check appears in the Truth panel once rain has loaded.",
   // `close` is the on-screen name of the button that ends the story (story.backToExplore), so the two never drift apart.
diff --git a/src/lib/i18n/en/turntable.ts b/src/lib/i18n/en/turntable.ts
index 978d3e7..ee3f0ce 100644
--- a/src/lib/i18n/en/turntable.ts
+++ b/src/lib/i18n/en/turntable.ts
@@ -50,7 +50,7 @@ export const turntableEn = {
   "turntable.missing": "none",
   "turntable.frameTime": (p: { datetime: string }) => `Frame: ${p.datetime} UTC`,
   "turntable.error": (p: { text: string }) => `Measured error: ${p.text}`,
-  "turntable.error.rain": (p: { percent: number }) => `typically within ~${formatInteger(p.percent, "en")}% (pending team approval)`,
+  "turntable.error.rain": (p: { percent: number }) => `typically within ~${formatInteger(p.percent, "en")}%`,
   "turntable.error.ocean": (p: { median: number; n: number }) =>
     `median ${formatFixed(p.median, "en", 2)} °C against NASA MUR (${formatInteger(p.n, "en")} points, latest frame)`,
 
```
