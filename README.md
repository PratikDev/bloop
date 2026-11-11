<div align="center">

<img src="docs/readme/banner.svg" alt="Bloop: hear NASA's view of today's ocean and rain as live sound" width="100%">

<p>
  <img alt="Team PTSD" src="https://img.shields.io/badge/Team-PTSD-ff9bd4?style=flat-square&labelColor=15122a">
  <img alt="NASA Space Apps 2026" src="https://img.shields.io/badge/NASA%20Space%20Apps-2026-ff9bd4?style=flat-square&labelColor=15122a">
  <img alt="Challenge 14" src="https://img.shields.io/badge/Challenge-%2314%20Earth%20Jukebox-ff9bd4?style=flat-square&labelColor=15122a">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-app-edeaf6?style=flat-square&logo=nextdotjs&logoColor=edeaf6&labelColor=15122a">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-edeaf6?style=flat-square&logo=typescript&logoColor=edeaf6&labelColor=15122a">
  <img alt="Web Audio" src="https://img.shields.io/badge/Web%20Audio-live%20sound-edeaf6?style=flat-square&labelColor=15122a">
  <img alt="Accessible" src="https://img.shields.io/badge/Keyboard%20%2B%20screen%20reader-first-edeaf6?style=flat-square&labelColor=15122a">
  <img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-edeaf6?style=flat-square&labelColor=15122a">
</p>

**Hear exactly what NASA's Earth Information Center is showing, and trust it:<br>every sound traces back to a verified NASA measurement.**

Built by **Team PTSD** for the NASA Space Apps Challenge 2026.

[What you can do](#what-you-can-do) · [How it works](#how-it-works) · [Run it](#run-it) · [Accessibility](#made-to-be-heard) · [Credits](#credits)

</div>

<br>

<div align="center">
  <img src="docs/readme/opening.gif" alt="The opening: a dark screen says 'Close your eyes' while a pink waveform line moves with the live sound of today's ocean and rain, then the world map opens outward from the equator" width="88%">
  <br>
  <sub><b>"Close your eyes."</b> Ten seconds of today's real ocean and rain as sound, then the NASA frame opens out from the equator.</sub>
</div>

<br>

## The idea

NASA's Earth Information Center (EIC) publishes stunning visualizations of our planet, but they are for eyes only. Bloop takes the **exact EIC frame on screen** (today's sea surface temperature, the latest half-hourly rainfall) and turns each pixel's colour back into the value it stands for, using the frame's own colorbar. Those values become **sound, generated live** while you explore. Then we **check the values against NASA's source datasets** and show how close they are.

Blind and low-vision users can explore the planet by ear with a keyboard and speech. Everyone else hears patterns like the monsoon moving over the Bay of Bengal.

**Why "Bloop"?** The name comes from [the Bloop](https://oceanservice.noaa.gov/facts/bloop.html), a mysterious underwater sound that NOAA scientists recorded in the southern Pacific in 1997 with hydrophones placed thousands of kilometres apart. In 2005 it was traced to an icequake: an iceberg cracking and breaking away from an Antarctic glacier. Like the Bloop, our project lets you learn about the ocean by listening to it.

## How it works

<img src="docs/readme/how-it-works.svg" alt="How it works: the frame's pixel colour is read back to a value with its own colorbar, checked against NASA source data, and played as live sound" width="100%">

| Warmer ocean | More rain | Snow | West ↔ East | No data |
|:---:|:---:|:---:|:---:|:---:|
| a higher pitch | denser drops | soft bells | left ↔ right ear | silence and a short tick |

Every rule and number lives in one file, [`public/mapping.json`](public/mapping.json), and the app's **Mapping** panel explains each one in words.

## What you can do

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/explore.gif" alt="Exploring the map with the arrow keys: the cursor moves over the world, pink rings pulse with the sound, and the readout shows the value under the cursor" width="100%">
      <h3>🎧 Explore by ear</h3>
      Move the cursor with the arrow keys, a mouse or a finger. The ocean hums, rain falls as drops, and pink rings pulse with the actual sound. Press <kbd>Enter</kbd> to hear the value spoken, followed by a chime naming the satellite that measured it.
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/timelapse.gif" alt="The storm time-lapse: half-hourly rain frames play in sequence while the cursor follows the heaviest rain near Bangladesh" width="100%">
      <h3>⛈️ Storm time-lapse</h3>
      The last 48 half-hourly IMERG rain frames at 2 frames per second. The cursor follows the heaviest rain near Bangladesh, and each frame's own value and time appear on screen.
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/readme/thennow.gif" alt="Dhaka then vs now: a chart of pre-monsoon heat anomalies with a pink playhead moving across the years as they play" width="100%">
      <h3>🌡️ Dhaka then vs now</h3>
      <i>In these records: hotter, no wetter, and the water underground is falling.</i> Heat (NASA GISTEMP), monsoon rain (GPCP, cross-checked with GPCC rain gauges) and groundwater (GRACE), each with a chart whose playhead follows the sound. Play them one after the other, or "then" in your left ear and "now" in your right. Switch to <b>Chattogram, Rajshahi or Sylhet</b> (same method, labelled as not cross-checked), and see two more records: <b>fires</b> (NASA FIRMS, same-sensor example years) and <b>vegetation</b> (MODIS NDVI).
    </td>
    <td width="50%" valign="top">
      <img src="docs/readme/story.gif" alt="Story Mode: a panel on the map lists the tour's steps and shows the line being spoken" width="100%">
      <h3>📖 Story Mode</h3>
      A guided tour of about 90 seconds: the ocean hum over the Bay of Bengal, a sweep from Chattogram, the storm, the satellite whisper, and how we know the sound is right. Every number spoken is read from NASA data files.
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="68%" valign="top">
      <img src="docs/readme/desktop.png" alt="The desktop layout: the world map with the readout plate, and the side panel open on Place History with Chattogram's monthly heat record and a playhead" width="100%">
    </td>
    <td width="32%" valign="top" align="center">
      <img src="docs/readme/phone.png" alt="The phone layout: the map on top, a large readout of the value under the cursor, and big touch buttons below" width="100%">
    </td>
  </tr>
  <tr>
    <td valign="top"><sub><b>Place History:</b> monthly heat, rain or groundwater for Bangladesh's four cities and <b>38 more places worldwide</b>, a decade at a time with a playhead. Drag along the chart, or use its arrow keys, to hear any single month in the record. Beside it, the <b>Truth</b>, <b>Mapping</b> and <b>Provenance</b> panels.</sub></td>
    <td valign="top" align="center"><sub><b>On a phone:</b> the same app, with 44 px touch targets.</sub></td>
  </tr>
</table>

### And also

- **🌊 Sweep:** rings of sound spread out from Chattogram across the Bay of Bengal.
- **🔍 Truth panel:** how each value was checked against NASA's source data, with the measured error and the newest frame's re-check.
- **☁️ Citizen observers vs satellite:** a teaser of GLOBE cloud reports from Bangladesh set against satellite cloud cover (coming in October).
- **🧭 Provenance panel:** for the point on screen, its value, dataset, NASA SVS visualization and frame time.
- **🎼 Legend and warm-up:** hear what 0, 10, 20 and 30 °C, light and heavy rain, and snow sound like before you explore.

### Official records, the Turntable and braille

- **🗂️ Official records:** NASA's Earth Information Center items and related SVS visualizations, each decoded back into values and played as one voice, with its period, credits, licence and the check it passed (or why it has none). Related records too sparse to play are kept off the shelf.
- **💿 Turntable:** the live Earth on a disc; drop the needle anywhere on the globe, search a place, and open four 3D scenes (Ghost Earths, Delta, Sound terrain, the Dhaka time tunnel).
- **⠿ Braille explorer:** <kbd>B</kbd> on Listen (or the dock's Braille) shows the data as braille cells along a line through the cursor; the caret is the needle.
- **🔁 Proof in unison:** <kbd>U</kbd> plays the nearest checked point's frame value and file value as two tones; any difference beats.
- **🏷️ Data-age badges:** every frame says how old its data is and where it came from (`public/data/meta/freshness.json`).
- **🩺 Health checks:** `npm run health` checks every record's files, values, labels, links and freshness.

## Made to be heard

Accessibility is the point of the project, not an extra.

| | |
|---|---|
| ⌨️ **Keyboard first** | Arrow keys move the cursor (<kbd>Shift</kbd> for 10°), <kbd>Enter</kbd> speaks, <kbd>Space</kbd> pauses, <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> switch tracks, <kbd>S</kbd> sweeps, <kbd>Esc</kbd> stops everything. <kbd>H</kbd> lists every key. |
| 🗣️ **Screen readers** | The map is one focusable region; settled values are announced once, never spammed. |
| 💬 **Captions** | Every sound has a caption. **Describe** mode says what is playing. |
| 🔇 **Without sound** | "Explore without sound" shows values as text and captions. |
| 🌀 **Reduced motion** | Follows the system setting: still rings, cuts instead of wipes. |
| 🇧🇩 **English / বাংলা** | Every string in the app goes through one table, ready for Bangla. |

## Run it

You need [Bun](https://bun.sh).

```sh
bun install
bun run dev      # open http://localhost:3000
```

> [!TIP]
> Wear headphones: west sounds left, east sounds right. Browsers start sound only after a click, so press **Start listening**.

| Command | What it does |
|---|---|
| `bun run build` then `bun run start` | Static production build in `out/`, served at http://localhost:3000 |
| `bun run lint` | ESLint |
| `bunx tsc --noEmit` | Type check |
| `npm run health` | Record health check (Python) |
| `npm run refresh:live` | Refreshes every updating record; ships only what passes its truth check |

**Team page and release builds.** The Team page (`/team`) reads `content/team.json`: the team name, each member's name and role, the challenge, the local event and the licence. A field still `"TODO"` shows nothing on the page. `bun run build` lists the TODO fields, and with `BLOOP_RELEASE=1` it stops until none remain (`bun run check:team` runs the check alone).

The audio engine's test page (`/dev/audio`) is available in development only. For a test deployment that includes it, build with `AUDIO_HARNESS=1 bun run build`.

<details>
<summary><b>Rebuilding the data (optional)</b></summary>

<br>

The data the app reads is already in `public/data/`. To rebuild it you need Python, the packages in `pipeline/requirements.txt`, and a NASA Earthdata login:

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
| `src/app/`, `src/components/` | The web app (Next.js, React, shadcn/ui) |
| `src/lib/audio/` | The sound engine (Web Audio); its public API is `@/lib/audio` |
| `src/lib/audio-adapter/` | The one place the UI connects to the sound engine |
| `src/lib/audio-jukebox/` | The second engine: the Official records, the Turntable and its scenes, Unison |
| `src/lib/audio-engines.ts` | Where the two engines meet: one AudioContext, Mute all and Stop for both |
| `src/lib/data/` | Data loaders and the grid decoder |
| `public/mapping.json` | Every value-to-sound rule and tuned number |
| `public/data/` | The data files the app reads (grids, JSON) |
| `pipeline/` | Python scripts that build `public/data/` |
| `docs/` | The team build plan and each lane's notes |

</details>

## Honesty rules

> [!IMPORTANT]
> - No number appears unless it comes from our data files or our tests.
> - The sound is generated live; the data is near real time, and the frame's time is always shown.
> - Comparisons use multi-year windows; single years are labelled "example years".
> - Anything not working yet is labelled "Coming in October". Wording still under team review carries a "Pending team approval" badge.

## Credits

The credits are built from the record registry (`public/data/meta/freshness.json`, the Official and Related indexes, and the voices each page plays: `src/lib/credits/`), so they list every source a playing record uses and only those. The app shows the same list on How we know (Credits), Official records (Credits), the Turntable (Credits) and the Team page. It is grouped as Observations, Models and reanalyses, and NASA visualizations (SVS, with each record's IDs). Each entry gives the provider, the pages where it plays and a link. Sources we built and checked but don't play (GPCC, FIRMS, MODIS MOD13Q1, GLOBE and others) are listed separately as "Used in our testing (not playable)". NASA POWER was checked and dropped: it disagreed with independent records.

We follow each dataset's own acknowledgement text where one is provided (for example GRACE and GPCP).

**Partner agencies:** IMERG comes from the joint NASA–JAXA GPM mission. MUR includes JAXA AMSR2 and EUMETSAT sea-ice inputs. GPCC is from Germany's national weather service (Deutscher Wetterdienst).

**Audio:** all sound is generated by our code; there is no third-party music and there are no samples.

## Licence

Open source under the [MIT License](LICENSE), © 2026 Team PTSD, as the NASA Space Apps Challenge asks for public, reusable code.

## Use of AI

AI tools helped with coding and writing. AI never produces the numbers you see or hear: every value comes from NASA data, read by our code.
