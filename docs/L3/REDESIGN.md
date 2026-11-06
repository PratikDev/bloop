# L3 Redesign: plan and feature checklist

Branch: `L3-redesign` (from `L3-readme-charts`, 29 Sep 2026). Approved by the L3 lead on 29 Sep.

Goal: a calmer, more distinctive interface with motion throughout, split into a few pages, **without losing or breaking any feature**. The L3 lead asked for all phases to be built in one go and checked together at the end.

---

## 1. Direction: "Signals over the Bay"

| Part | Choice |
|---|---|
| Idea | A jukebox picking up signals from orbit, built in Bangladesh. Pages are "stations"; the nav is a tuning dial with a needle. |
| Texture | Nakshi kantha running-stitch lines for dividers, the story timeline and focus paths. A light grain on surfaces. |
| Colour | Deeper ink-navy base, tinted shadows, one accent (shapla pink) only for "listening now". Chrome hues stay outside the data colormaps (255° to 330°). |
| Type | Instrument Serif (display) with Tiro Bangla; Geist (UI) with Anek Bangla; Geist Mono for coordinates, times and units. |
| Icons | Phosphor, one weight. |
| Motion | `motion` for springs, staggers, dock and popovers; View Transitions between pages; a small WebGL globe on Home (still image when motion is reduced or WebGL is missing). Every animation follows both the in-app and the OS "reduce motion" settings. |

## 2. Pages

| Route | Name | Holds |
|---|---|---|
| `/` | Home | Globe hero with today's real frame, Start listening, Explore without sound, and entries for the three pages below, all on one screen. |
| `/listen` | Listen | Explore, and Story as a guided tour on the same map (`?tour=1`). Inspector drawer: what you hear, where it comes from. |
| `/then-now` | Then vs Now | Compare decades (4 cities, 5 records) and Month by month (Place History, 42 places: the 4 Bangladesh cities and 38 more). |
| `/how` | How we know | Truth checks, scatter plot, sound rules, GLOBE teaser, credits, accessibility, Coming in October. |
| other | 404 | "No signal", with a way back to Listen. |

Help (keys) and Settings are a dialog and a popover available everywhere.

### Layout rules (every page)

| Rule | How |
|---|---|
| Understood at first glance | Each page opens with one plain headline that says what it shows, and one visual focus (the globe, the map, the chart, the checks). |
| Almost no scrolling | From 1280×720 up, each page fits one screen. On phones the main thing and its main action sit on the first screen; anything below is extra. |
| Not packed | Details live one step away (a drawer, a sheet, a popover or a view switch), not stacked down the page. Generous spacing; at most one primary button per screen. |

What that means per page:

| Page | First screen | One step away |
|---|---|---|
| Home | Globe, headline, Start listening, Explore without sound, and the three pages as dial entries. No scroll sections. | Nothing needed |
| Listen | Map, readout, dock | Mixer (popover), Inspector (drawer), Help |
| Then vs Now | Headline finding, chart, Listen card, city and record choice | Disclosure and honesty notes open in a side sheet instead of growing the page; Month by month is a view switch |
| How we know | Four summary tiles: ocean check, rain check, sound rules, GLOBE | Each tile opens its full text, plot or rule list in a sheet; credits in a sheet from the footer link |

## 3. Routing setup (Phase 0 result)

- Next hosts one optional catch-all page, `src/app/[[...path]]/page.tsx`, which renders TanStack Router in the browser only (`src/router/`).
- `/dev/audio` stays a Next route (it wins over the catch-all). In production it is a 404 unless built with `AUDIO_HARNESS=1`, as before.
- **Known seam:** Next's router writes its own history entries (marked `__NA`) from a React insertion effect. TanStack watches `pushState`/`replaceState`, so it would react inside that effect (a React error on Back). `src/router/history.ts` sends Next's writes past TanStack's watcher and keeps TanStack's entry keys.
- Spike check (`nasa-l3-qa/qa-router-spike.ts`), dev and production: deep links, unknown path, push, Back x2, Forward x2, reload, no full reloads, root mounted once (production), `/dev/audio` untouched. All passed.

## 4. Phases

| # | Phase | State |
|---|---|---|
| 0 | TanStack Router inside Next (spike) | Done |
| 1 | Design base: tokens, fonts, grain, stitch, motion helpers, reduce motion | Done |
| 2 | Shell: router, tuning-dial nav, persistent dock and caption, Settings, focus on navigation, 404 | Done |
| 3 | Home | Done |
| 4 | Listen (with the tour) | Done |
| 5 | Then vs Now (with Month by month) | Done |
| 6 | How we know | Done |
| 7 | Motion polish | Done |
| 8 | QA and docs | Done (see §6) |

### Decisions made while building

| Decision | Why |
|---|---|
| The mode comes from the URL only (`src/router/modes.ts`); `commands.setMode` navigates and `AppShell/use-route-sync.ts` copies the URL into the state | One source of truth; Back, Forward and links always agree with what is on screen |
| Live sound plays on Listen and How we know, rests on Home and Then vs Now (`isLiveMode`) | How we know sits beside the sound as the old side column did (Hear the legend over it); Then vs Now plays its own comparison |
| The page behind the intro is inert while it plays | Before the redesign "Skip intro" was the only focusable thing during the intro; kept |
| After a page change, focus goes to the page heading, unless the page placed it (Listen focuses its map) or an overlay holds it | Screen readers hear where they are; keyboard users keep the map keys working at once |
| Settings (language, Describe, Captions, Built-in voice) are remembered on the device | Per-device convenience; blocked storage just means the defaults |
| The first-visit hint on the map shows once per device | It goes away with "Got it" or the first cursor move |
| An unknown place in a Month by month link falls back to Chattogram | No endless "loading" for an old or mistyped link |
| Sweep is now a Listen action only (it was also in the old bottom bar during Then vs Now) | Its ring is drawn on the map; S still works on the map |
| Story is called "the tour" on screen ("Take the tour", "Stop the tour", "Back to the map") | There is no "Explore" on screen any more; the page is Listen |
| Credits moved from every screen's foot to How we know (a Credits sheet, with the SVS line always visible there) | The foot of every page was the most packed part. **Needs the team's OK against plan §15.** |
| **2 Oct.** Nothing sits on Listen's map but what you open (Inspector, Go to, the first-visit hint) and loading badges. When the stage is wider than 2:1 (most desktops, a container query `listen-wide`), the track choice, the value and the frame times sit in a panel beside the map, as tall as it; otherwise (16:10, 4:3, and the tour) the title, frame times and track choice sit above the map and the value in a one-line strip under it. From 1024 px the tour is a column beside the map | The title plate hid North America, the readout the South Pacific, and the tour panel a quarter of the map. Map width at 1280×720: 1152 px with the plates on it, 992 px now (1632 px at 1920×1080) |
| **2 Oct.** "Today's" is now "latest" everywhere on screen and in speech | The frames are the newest available, which are often a day or more old (25 and 27 Sept right now), so "today's" wasn't always true |
| **2 Oct.** With Describe on, Then vs Now and Month by month say each description before the sound and keep quiet while it plays (`src/hooks/use-narrated-player.ts`) | Describe used to speak the caption over the data (ducking it), so the voice covered the sound. "Play heat, rain and water" with Describe plays the parts one by one, each after its description; without Describe nothing changes |
| **2 Oct.** Go to (dock, Listen): type a latitude and longitude. Accepts signed decimals, N/S/E/W, a pasted pair ("23.8, 90.4") and Bengali digits; after Go, focus is back on the map | Asked for by the L3 lead. No key for it (G is kept for the game) |
| **2 Oct.** The tour holds the storm's heaviest frame on screen while its line is said, and opens the Checks drawer on the map's left. On phones its steps are a row of dots with the current step's name, and the line has a fixed minimum height | The map used to jump back to Chattogram ("Dry") while the line said 22 mm/h, and the drawer covered the place the tour points at. On phones the panel grew and shrank with each line, moving the map |
| **2 Oct.** How we know's "Sound rules" counts the sounds that play (11) and its sheet lists all 13 rules: on the map, in Then vs Now, and "written, but not played yet" (fires, vegetation) | The tile said 13 sounds while the sheet showed only the map's 7 rules, and 2 of the 13 don't sound yet |
| **2 Oct.** The tour's storm line takes both numbers from the sequence's `index.json` ("12 hours … 30 minutes per frame") | "half an hour per frame" was written into the sentence, breaking the rule that numbers come from the data |
| **2 Oct.** The dock keeps icons with short labels under them up to 1024 px, sharing the row's width; the header's dial has its own row up to 1024 px, and below 360 px the name shows as the mark only | Adding Go to made the dock overflow at 320, 360, 768 and 800 px; the header already overflowed at 320 px and pushed Help off screen at 768 px |

## 5. Feature checklist (nothing may be lost)

Each row is checked by hand and, where one exists, by the QA script named. The existing QA scripts click the old mode tabs, so they are updated in Phase 8; the old logs in `nasa-l3-qa/final-*.log` are the baseline.

| Feature | Where after the redesign | QA script | Checked |
|---|---|---|---|
| Start listening (creates the AudioContext from the gesture) | Home, and the start gate on any deep link | `qa.ts` | |
| Explore without sound (captions on, no opening) | Home, start gate | `qa-silent.ts` | |
| Opening "close your eyes", Skip, rain wait up to 4 s | Listen | `qa.ts`, `qa-slow-start.ts` | |
| Equator reveal of the frame | Listen | | |
| Map keys: arrows, Shift+arrows, Enter, Space, S, 1/2/3, M, D, C, T, L, P, X, H/?, Esc (letters only while the map has focus) | Listen (T goes to Then vs Now, P opens Inspector) | `qa-a11y.ts` | |
| Click or tap on the map moves the cursor | Listen | `qa-click.ts` | |
| Track choice Ocean / Rain / Both | Listen | `qa-track-choice.ts` | |
| Settings: Describe, Captions, Built-in voice, Reduce motion | Settings popover and Help | | |
| Language EN / বাংলা | Top bar | | |
| Jukebox motif | Top bar | | |
| Mixer: volume, mute, solo per voice; Mute all | Dock popover (sheet on phones) | | |
| Go to a latitude and longitude (2 Oct) | Dock, Listen | `audit-oct2.ts` (goto) | Yes |
| Sweep from Chattogram with map ring | Dock | `qa-review.ts` | |
| Storm time-lapse: loading %, cancel on press, frame captions | Dock | `qa-timelapse.ts`, `qa-timelapse-rate.ts` | |
| Satellite whisper | Listen | | |
| X-ray "coming in October" message | Listen | | |
| Status and error badges (loading rain, ocean or rain error, time-lapse error) | Listen, Home | | |
| Readout plate (value, place, frame labels, Bengali digit cells) | Listen | `qa-desktop.ts` | |
| Frame date and time visible in every view | All pages | | |
| Caption bar and live waveform | Persistent dock | | |
| Story: steps, Stop, Play again, Back to Explore, closing line | Listen tour | `qa-story.ts` | |
| Then vs Now: 4 cities, heat / monsoon / water with sound, fires / vegetation without | Then vs Now | `qa-thennow.ts`, `qa-thennow-layout.ts` | |
| Then vs Now play options: this part, then left now right, all three, stop | Then vs Now | `qa-thennow.ts` | |
| Then vs Now folds: disclosure, honesty notes, Pending badges | Then vs Now | | |
| Truth: ocean check and re-check, rain check and re-check, scatter plot, checked time | How we know | | |
| GLOBE teaser | How we know | | |
| Mapping: live rules, rules for every sound, Hear the legend | Listen Inspector (live), How we know (all) | | |
| Provenance for the cursor, time-lapse note | Listen Inspector | `qa-provenance.ts` | |
| Place History: 42 places (4 in Bangladesh, 38 world), heat / rain / water, decades, record notes | Then vs Now, Month by month | `qa-history-world.ts` | |
| History chart: drag or arrow keys to hear one month, held-key behaviour | Then vs Now, Month by month | `qa-scrub.ts`, `qa-held-key.ts` | |
| Help dialog: keys table, settings, Coming in October | Everywhere (H, ?) | | |
| Credits (plan §15 wording) | How we know, one-line link in the shell | | |
| Announcer live region, skip link, focus ring, 44 px targets | Everywhere | `qa-a11y.ts`, `qa-mobile.ts` | |
| Phone, iPad and short-desktop layouts | Everywhere | `qa-mobile.ts`, `qa-ipad.ts`, `qa-desktop.ts` | |
| No page scroll from 1280×720 up (page height equals the screen height on every route) | Everywhere | new check in `qa-desktop.ts` (Phase 8) | |
| L2 reuse: `buildThenNowInput`, `loadDemo`, `loadGrace` unchanged | `src/lib` | | |
| `/dev/audio` harness | Unchanged Next route | `qa-router-spike.ts` | Yes |
