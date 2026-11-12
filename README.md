<div align="center">

<img src="docs/readme/banner.svg" alt="Bloop: a jukebox whose record is today's NASA ocean-temperature frame, turning as the Earth does, beside the words Hear Earth's ocean and rain" width="100%">

<p>
  <img alt="Team PTSD" src="https://img.shields.io/badge/Team-PTSD-ff6b4a?style=flat-square&labelColor=14213d">
  <img alt="NASA Space Apps 2026" src="https://img.shields.io/badge/NASA%20Space%20Apps-2026-ff6b4a?style=flat-square&labelColor=14213d">
  <img alt="Challenge 14" src="https://img.shields.io/badge/Challenge%20%2314-Earth%20Information%20Jukebox-ff6b4a?style=flat-square&labelColor=14213d">
  <br>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-static%20export-cfe9df?style=flat-square&logo=nextdotjs&logoColor=cfe9df&labelColor=14213d">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-cfe9df?style=flat-square&logo=typescript&logoColor=cfe9df&labelColor=14213d">
  <img alt="Web Audio" src="https://img.shields.io/badge/Web%20Audio-generated%20live-cfe9df?style=flat-square&labelColor=14213d">
  <img alt="Keyboard and screen reader first" src="https://img.shields.io/badge/keyboard%20%2B%20screen%20reader-first-cfe9df?style=flat-square&labelColor=14213d">
  <img alt="English and Bangla" src="https://img.shields.io/badge/English%20%2B%20বাংলা-cfe9df?style=flat-square&labelColor=14213d">
  <img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-cfe9df?style=flat-square&labelColor=14213d">
</p>

### Hear exactly what NASA's Earth Information Center is showing, and trust it.
Every sound traces back to a NASA measurement that we checked.

[How it works](#how-a-pixel-becomes-a-sound) · [Inside the jukebox](#inside-the-jukebox) · [Ways to listen](#ways-to-listen) · [Accessibility](#made-to-be-heard) · [Run it](#run-it) · [Credits](#credits)

</div>

<br>

<div align="center">
  <img src="docs/readme/opening.gif" alt="The opening: in space, the words Close your eyes over a coral line that moves with the live sound of today's ocean and rain, then the jukebox opens onto Listen's map" width="90%">
  <br>
  <sub><b>"Close your eyes."</b> Today's real ocean and rain as sound, then the jukebox opens onto NASA's frame.</sub>
</div>

<br>

## The idea

NASA's Earth Information Center (EIC) publishes beautiful pictures of our planet, and they are for eyes only. Bloop takes **the exact EIC frame on screen**, today's sea surface temperature and the latest half-hourly rain, and reads each pixel's colour back into the value it stands for, using the frame's own colour bar. Those values become **sound, generated live** as you move a needle over the Earth. Then we **check the values against NASA's source data** and show how close they are.

Blind and low-vision people can explore the planet by ear with a keyboard, speech and braille. Everyone else hears patterns, like the monsoon moving over the Bay of Bengal.

> [!NOTE]
> **Why "Bloop"?** The name comes from [the Bloop](https://oceanservice.noaa.gov/facts/bloop.html), a mysterious underwater sound that NOAA's hydrophones recorded in the southern Pacific in 1997. In 2005 it was traced to an icequake: an iceberg cracking away from Antarctica. Like the Bloop, this project lets you learn about the ocean by listening to it.

## How a pixel becomes a sound

<img src="docs/readme/how-it-works.svg" alt="Four steps. 1: the pixel under the needle in NASA's frame, the Bay of Bengal at 21.5 degrees north, 89.8 east. 2: its colour read back on the frame's own colour bar: 29.8 degrees. 3: a written rule turns minus 5 to 35 degrees into 220 to 880 hertz, so 29.8 degrees is 735 hertz. 4: the sound is made live, louder in the right ear because the place is east of centre, with a caption and a spoken value. Underneath: the ocean values are checked against NASA MUR SST, 0.31 degrees median error, and rain against IMERG." width="100%">

| Warmer ocean | More rain | Snow | West ↔ East | No data |
|:---:|:---:|:---:|:---:|:---:|
| a higher pitch | denser drops | soft bells | left ↔ right ear | silence and a short tick |

Every rule and number lives in one file, [`public/mapping.json`](public/mapping.json). The app explains each one in words, and **How we know** shows the checks.

### From NASA to your ears

```mermaid
flowchart TB
    subgraph NASA["1 · NASA"]
        direction LR
        F["EIC frames<br/>SVS 5101 ocean · SVS 4285 rain"]
        S["Source datasets<br/>MUR SST · GPM IMERG"]
    end
    subgraph P["2 · Daily pipeline"]
        direction LR
        R["Read each pixel's colour<br/>back to a value"] --> C{"Agrees with<br/>the source?"}
        C -- no --> K["Keep the last<br/>checked frame"]
        C -- yes --> D[("public/data")]
    end
    subgraph B["3 · Your browser"]
        direction LR
        N["The needle<br/>reads the grid"] --> M["A rule from<br/>mapping.json"] --> O(["Live sound · caption ·<br/>spoken value · braille"])
    end
    F --> R
    S --> C
    D --> N
    linkStyle default stroke:#ff6b4a,stroke-width:2.5px

    classDef nasa fill:#7db8f0,stroke:#14213d,color:#14213d,stroke-width:2px
    classDef step fill:#fff8e6,stroke:#14213d,color:#14213d,stroke-width:2px
    classDef hot fill:#ff6b4a,stroke:#14213d,color:#14213d,stroke-width:2px
    classDef data fill:#ffb238,stroke:#14213d,color:#14213d,stroke-width:2px
    class F,S nasa
    class R,C,K,N,M step
    class O hot
    class D data
    style NASA fill:#cfe9df,stroke:#14213d,color:#14213d
    style P fill:#cfe9df,stroke:#14213d,color:#14213d
    style B fill:#cfe9df,stroke:#14213d,color:#14213d
```

## Inside the jukebox

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/home.png" alt="Home: the heading Hear Earth's ocean and rain, a coral Start listening key and the 90-second tour, beside a jukebox whose window holds a globe of today's ocean temperature" width="100%">
      <h3>Home</h3>
      The window holds a globe of <b>today's NASA ocean frame</b>. Start listening, take the 90-second tour, or explore without sound.
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/explore.gif" alt="Listen: the needle moves over the world map with the arrow keys, coral rings pulse at the needle, and the readout changes between values and No ocean data here" width="100%">
      <h3>Listen</h3>
      Move the needle with the arrow keys, a mouse or a finger. The ocean hums and rain falls as drops. Press <kbd>Enter</kbd> to hear the value and the place spoken. Over land it says so: <i>No ocean data here</i>.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/timelapse.gif" alt="The storm time-lapse on a globe: half-hourly rain frames over South Asia, with the cursor following the heaviest rain near Bangladesh" width="100%">
      <h3>Storm time-lapse</h3>
      The last <b>48 half-hourly IMERG rain frames</b> on a globe or a flat map. The needle follows the heaviest rain near Bangladesh, and each frame shows its own value and time.
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/thennow.gif" alt="Then vs Now: Dhaka's April to May heat, 1981 to 1990 beside 2016 to 2025, with a playhead and the year moving through the charts as they play, and a city globe beside them" width="100%">
      <h3>Then vs Now</h3>
      <i>Dhaka in April–May: 1.37 °C warmer in 2016–2025 than in 1981–1990</i> (NASA GISTEMP). Heat, monsoon rain (GPCP, cross-checked with GPCC rain gauges) and the water underground (GRACE), for Dhaka, Chattogram, Rajshahi and Sylhet. The playhead follows the sound.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/turntable.gif" alt="The Turntable: the Earth turning in space beside a coral turntable whose record is the same data; the readout names each place under the needle" width="100%">
      <h3>Turntable</h3>
      The Earth and a turntable side by side, and the record <i>is</i> the Earth. Click the globe or the record to drop the needle. Search a place, ask "Where am I?", or open the 3D scenes: Ghost Earths, the playable delta, Sound terrain and the Dhaka time tunnel.
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/official.png" alt="Official records: the record list on the left, and the Fires and fire weather record playing, with NASA's active-fire picture, its sound layers and the forecast for Bangladesh" width="100%">
      <h3>Official records</h3>
      NASA's Earth Information Center items and related SVS visualisations, each read back into values and played. They include fire weather with FIRMS fire detections as Geiger clicks, landslide exposure, night lights by city, and NASA's own sonification method.
    </td>
  </tr>
</table>

<div align="center">
  <img src="docs/readme/how.png" alt="How we know: six checks with their numbers: ocean temperature 0.31 degrees median error against NASA MUR SST; rain about 27 percent typical difference from NASA IMERG; 15 sounds, each following a written rule; ground vs satellite 43 percent agreement, an early preview; Earth Orchestra, 6 families; data voice check, 1 cent limit" width="88%">
  <br>
  <sub><b>How we know:</b> every number on the page comes from a check you can open and read.</sub>
</div>

### The record rack

Everything that plays is a record with a code, the way a jukebox works. Type a code on the **Records** key, or pick one from the rack.

| Shelf | Records |
|---|---|
| **A** · Live | `A0` How it sounds (the legend) · `A1` Ocean temperature · `A2` Rain and snow · `A3` Ocean and rain together |
| **B** · Then vs Now | `B1` Heat · `B2` Monsoon rain · `B3` Water underground · `B4` Fires · `B5` Vegetation (`B4`, `B5`: charts only) |
| **C** · Official records | NASA's EIC and SVS records, `C1` onwards, in the order of the official index |
| **D** · Guided | `D1` The tour · `D2` Storm time-lapse · `D3` Sweep from Chattogram |

## Ways to listen

**Earth Orchestra.** Each Earth system plays in its own instrument family, so you can learn the systems by ear. Pitch, timing and the numbers never change; only the instrument does.

| Ocean | Air and weather | Land and life | Fire and smoke | Ice and water storage | People and carbon |
|:---:|:---:|:---:|:---:|:---:|:---:|
| breathy flute<br><sub>a synthesised bansuri</sub> | soft, airy pad | plucked string<br><sub>a synthesised dotara</sub> | muted metallic pluck<br><sub>with a crackle</sub> | glassy bell | felt piano |

**The Science to Art dial.** *Measure*, *Blend* or *Music*. The further you turn it, the more musical Bloop sounds, but the data voice stays within **1 cent** of its pitch at every stop. A test on every record checks this.

**Ask Bloop.** Type a question or a command in English or Bangla, like *what is the temperature in Cox's Bazar*, *find the wettest place in the Bay of Bengal*, *compare August 2023 with March 2023* or *go to the turntable*. A parser reads it, and the answer comes from Bloop's own data, never from an AI. It is in Listen's **More** menu.

**Water's journey.** *A Bangladesh suite:* lightning, an atmospheric river, the rain over Bangladesh, landslide exposure on its hills, the water stored underground, and the Bay of Bengal. Each plays in its own family, with two seconds of silence between them.

**Data or choice?** Every record says which parts of the sound come from the data and which are our artistic choices.

## Made to be heard

Accessibility is the point of the project, not an extra. One reading reaches you in whichever way works for you:

```mermaid
flowchart LR
    V(["One reading<br/>29.8 °C · Bay of Bengal"])
    V --> A["Sound<br/>pitch for the value,<br/>left ↔ right for longitude"]
    V --> T["Caption<br/>on screen, for every sound"]
    V --> S["Speech<br/>your screen reader<br/>or Bloop's voice"]
    V --> X["Braille<br/>cells along a line;<br/>the caret is the needle"]
    V --> L["Low vision<br/>high contrast, large text,<br/>a lens on the map"]

    classDef hot fill:#ff6b4a,stroke:#14213d,color:#14213d,stroke-width:2px
    classDef out fill:#fff8e6,stroke:#14213d,color:#14213d,stroke-width:2px
    class V hot
    class A,T,S,X,L out
```

| Key | What it does |
|---|---|
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | Move the needle 1° (with <kbd>Shift</kbd>, 10°) |
| <kbd>Enter</kbd> | Speak the value and the place |
| <kbd>Space</kbd> | Pause or resume the live sound |
| <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> | Ocean, rain, or both |
| <kbd>S</kbd> | The sweep outward from Chattogram |
| <kbd>D</kbd> · <kbd>C</kbd> | Describe mode · captions |
| <kbd>L</kbd> · <kbd>P</kbd> | Hear the legend · where this value comes from |
| <kbd>B</kbd> | Braille data explorer (Listen and Then vs Now) |
| <kbd>M</kbd> | Mute or unmute everything |
| <kbd>H</kbd> | Every key |
| <kbd>Esc</kbd> | Stop all sound and close panels, from anywhere |

- **Screen readers:** the map is one focusable region, and each move is said once. Letter keys work only while the map has focus, so they never clash with screen-reader keys.
- **Speech choices:** your screen reader, Bloop's built-in voice, or neither, never both at once. Descriptions come in brief, standard or detailed.
- **Low-vision mode:** high-contrast dark and light themes, a custom theme with a contrast warning, larger text and spacing, a calm view, and a Context Lens on the map.
- **Without sound:** "Explore without sound" shows every value as text and captions.
- **Reduced motion:** follows your system setting and the app's own. Every moving stage has a **Pause motion** key that stops the motion, never the sound.
- **English and বাংলা:** every string in the app has a Bangla version, under native-speaker review in [`docs/i18n/REVIEW.md`](docs/i18n/REVIEW.md).

<table>
  <tr>
    <td width="50%" align="center"><img src="docs/readme/phone-home.png" alt="Home on a phone: the menu button, the heading, Start listening, the tour and Explore without sound, with the jukebox below" width="78%"></td>
    <td width="50%" align="center"><img src="docs/readme/phone-listen.png" alt="Listen on a phone: the map in the cabinet with the needle on the Bay of Bengal, and the player below with Pause sound, the value 29.2 degrees and the west to east slider" width="78%"></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><sub><b>On a phone:</b> the same app, with 44 px touch targets and the player within thumb reach.</sub></td>
  </tr>
</table>

## Run it

You need [Bun](https://bun.sh).

```sh
bun install
bun run dev      # open http://localhost:3000
```

> [!TIP]
> Wear headphones: west sounds left, east sounds right. Browsers only start sound after a click, so press **Start listening**.

| Command | What it does |
|---|---|
| `bun run build` then `bun run start` | Static production build in `out/`, served at http://localhost:3000 |
| `bun run lint` | ESLint |
| `bunx tsc --noEmit` | Type check |
| `bun test` | Unit tests |
| `bun run e2e` | Browser checks (Playwright, Chromium and Firefox) |
| `npm run health` | Record health check: writes `docs/HEALTH.md` (Python and Playwright) |
| `npm run refresh:live` | Refreshes every updating record; ships only what passes its truth check |
| `bun run i18n:todo` | Rewrites `docs/i18n/TO_TRANSLATE.md`, the Bangla strings still to translate |

<details>
<summary><b>Feature flags</b></summary>

<br>

Features are switched in [`src/lib/flags.ts`](src/lib/flags.ts). A feature is on in production once it works in this design and its checks pass. Each flag also has a `NEXT_PUBLIC_*` variable that can override it, and `NEXT_PUBLIC_BLOOP_PREVIEW=1` shows every feature, ready or not.

</details>

<details>
<summary><b>Rebuilding the data (optional)</b></summary>

<br>

The data the app reads is already in `public/data/`, and GitHub Actions refresh it every day (`.github/workflows/data-daily.yml`). To rebuild it yourself you need Python, the packages in `pipeline/requirements.txt`, and a NASA Earthdata login:

```sh
cd pipeline
pip install -r requirements.txt
python run_all.py            # options: --no-sequence --no-context --with-global
```

</details>

<details>
<summary><b>Project layout</b></summary>

<br>

| Path | What it holds |
|---|---|
| `src/app/`, `src/components/`, `src/router/` | The web app (Next.js static export, React, shadcn/ui, TanStack Router) |
| `src/lib/records.ts` | Every playable thing, with its code: the rack, the player and the crowns all read it |
| `src/lib/audio/` | The sound engine (Web Audio); its public API is `@/lib/audio` |
| `src/lib/audio-adapter/` | The one place the interface connects to the sound engine |
| `src/lib/audio-jukebox/` | The second engine: Official records, the Turntable and its scenes |
| `src/lib/audio-engines.ts` | Where the two engines meet: one AudioContext, one Mute all and one Stop |
| `src/lib/art/` | Earth Orchestra, the Science to Art dial, Water's journey |
| `src/lib/earth/` | Fire weather, landslide exposure, night lights, NASA's radar method |
| `src/lib/ask-bloop/` | Ask Bloop's parser and answers |
| `src/a11y/`, `src/lib/low-vision/` | Descriptions, braille short forms, low-vision themes |
| `src/lib/data/` | Data loaders and the grid decoder |
| `src/lib/i18n/` | Every string, in English and Bangla |
| `public/mapping.json` | Every value-to-sound rule and tuned number |
| `public/data/` | The data files the app reads (grids, JSON) |
| `pipeline/` | Python scripts that build and check `public/data/` |

</details>

## Honesty rules

> [!IMPORTANT]
> - No number appears unless it comes from our data files or our tests.
> - The sound is generated live. The data is near real time, and the frame's time is always shown.
> - Comparisons use multi-year windows. Single years are labelled "example years".
> - A modelled or forecast record says so, and is never labelled as a measurement.
> - Anything not built yet is labelled "Planned".

## Credits

The credits are built from the record registry (`public/data/meta/freshness.json`, the Official and Related indexes, and the voices each page plays: `src/lib/credits/`), so they list every source a playing record uses, and only those. The app shows the same list on How we know, Official records, the Turntable and the Team page. It is grouped into Observations, Models and reanalyses, and NASA visualisations (SVS, with each record's IDs). Each entry gives the provider, the pages where it plays and a link. Sources we built and checked but don't play (GPCC, FIRMS, MODIS MOD13Q1, GLOBE and others) are listed separately as "Used in our testing (not playable)". NASA POWER was checked and dropped, because it disagreed with independent records.

We follow each dataset's own acknowledgement text where one is provided (for example GRACE and GPCP).

**Partner agencies:** IMERG comes from the joint NASA–JAXA GPM mission. MUR includes JAXA AMSR2 and EUMETSAT sea-ice inputs. GPCC is from Germany's national weather service (Deutscher Wetterdienst).

**Audio:** all sound is generated by our code. There is no third-party music, and there are no samples.

## Licence

Open source under the [MIT License](LICENSE), © 2026 Team PTSD, as the NASA Space Apps Challenge asks for public, reusable code.

## Use of AI

AI tools helped with coding and writing. AI never produces the numbers you see or hear: every value comes from NASA data, read by our code.
