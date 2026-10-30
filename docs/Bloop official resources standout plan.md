# Bloop × the official Challenge #14 statement and resources (read 28 Oct 2026)

**Labels:**
- **[V]** = checked on the SVS page today.
- **[INF]** = my inference.
- **[HYP]** = needs a test.

Nothing here predicts judging.

---

## 1. What the official text says, clause by clause, and what each clause asks of Bloop

| Exact words | What it implies | Bloop move |
|---|---|---|
| "pairs **EIC visual frames** with dynamic sonifications generated in real time" | Unchanged from the summary: frames + live sound | Keep the core. Every record states its SVS ID and frame |
| "from shifting global **temperatures** to evolving **oceanic currents**" | The statement names **currents**. Bloop has no currents voice yet | **Add a currents voice from the two current resources (§2.3, §2.6)** |
| "relying exclusively on sight limits accessibility for **blind and low-vision users** and constrains how **the public can interact**" | Two audiences: BLV users and the general public | Keep the BLV-first design plus the fun public layer (3D, games) |
| "Auditory processing **can reveal subtle data patterns that might be missed by the naked eye**" | The statement makes a claim the research disputes (Tucker Brown 2022: no added benefit; Diaz-Merced: benefit only with a synced cursor) | **Test the claim:** the Hotspot Hunt known-answer test (eye vs ear vs both, synced cursor). Report what we find, whichever way it goes. Few teams will treat the brief's own claim as a hypothesis |
| "foster a **deeper emotional connection** to our home planet" | Emotion is an explicit goal | Letter to the future (L3), a human performer (M2), the then-vs-now pieces, and interpretation mode clearly labelled (M3) |
| "an interactive environment where the translation from sight to sound is **exploratory**, blending scientific data with **artistic expression**" | Exploration + art | Turntable + scenes + Listen/Analyze presets |
| "a 'jukebox' interface **or algorithm** that **analyzes EIC visual frames**" | Analysing the frames is the core act | Colorbar inversion **plus** the new computer-vision analyses in §3 |
| "computer vision to map **color spectrums to musical chords**", "translate **pixel density into rhythm**", "artistic rulesets that drive synthesizer parameters based on **visual shapes**" | Their three example techniques | **Do all three, value-safe:** §3.1 chords, §3.2 density rhythm, §3.3 shapes |
| "individuals can **select or experience a specific EIC visualization alongside its corresponding soundscape**" | Selection UX is the outcome | One record per official resource, one tap to play |
| "an interactive tool **or** a **curated collection of original, generated audio files** that tell the auditory story" | Two valid deliverable types | **Ship both:** live jukebox **and** an album (§4.3) |
| "machine learning algorithms, open-source audio synthesis frameworks, or custom data-driven artistic rulesets" | Any method is welcome | CV + rulesets; ML only where it can be checked (§3.4) |
| "aim for soundscapes that **balance data interpretation with artistic, musically pleasing outputs**" | **Musicality is now explicit.** "Pleasant" counts as much as "correct" | Make **Listen (musical) and Analyze (exact)** the headline; swara + meend proves you can have both (I3: lands within 0 cents). **Measure both:** accuracy **and** a pleasantness rating in the pilot |
| "interactive web-based jukebox, a standalone desktop application, a **backend API endpoint**, or an engaging **playlist**" | Four deliverable forms | Web app + **installable PWA** (counts as a desktop app) + **public API** + **album**: all four (§4) |
| "Sonification: the use of **non-speech audio**" | Speech is support, not the sonification | Keep speech for exact values only; the core is non-speech |
| "Visual Frames: … **extracting individual images (frames) from these sequences**" | Many resources are videos | Pipeline: `ffmpeg` frame extraction where SVS offers only movies (5011 lightning) |
| "how **intuitively** someone can select a visualization and **initiate the audio**" | First-use UX | One "Start listening" press; records carousel; 8-s extremes legend |
| "**Accessibility is a core theme** … **screen-reader** compatibility, **tactile feedback**, or **rich descriptive text** accompanying your audio" | Three named features | Screen reader ✅. **Tactile:** Android haptics + printed records (3D-4). **Rich text:** the **SVS API's own description and alt text** for every resource, plus code-computed descriptions (A2, AltGeoViz-style) |
| "A direct pixel-to-sound translation might result in **chaotic noise**; … apply artistic rulesets, **musical scales, or harmonies**" | They expect scales and harmony | Megh drone, raga gridlines, swara + meend, the chord layer (§3.1), the generative bed (A3) |
| "from computer vision and ML models to **audio synthesizers and digital audio workstations**" | DAWs are named | **Export stems + MIDI** (M2) so a musician can open Bloop's output in a DAW |
| "**Documenting your process** … the 'why' behind your artistic choices … the algorithms and scripts" | Process documentation is scored as part of the story | A "How Bloop hears" page: the mapping spec, each rule's "why", the truth tests, the code links |
| "**urgency of climate change** or the **beauty of our planet's interconnected systems**" | Two emotional registers | **Urgency:** then vs now, GRACE, Amphan. **Beauty + connection:** the Connected Earth suite (§5) |
| "More resources may be added before the hackathon" | The list can grow | Re-check the Resources tab every few days and on 13 Nov |
| Header image: **"Space for Earth"**, the EIC's immersive room | The EIC has immersive spaces | **Immersive/hyperwall mode** at the resources' own **7680×2160** EIC formats (§4.5) |
| Resources disclaimer: "comply with any data use parameters" of non-US-government sites | Partner data licences matter | Keep per-source credits and licences (JAXA, Copernicus, OpenAQ, and the rest) |

**Biggest shift** [INF]: the official resources are **10 specific SVS visualizations**, mostly animations of models and long records, **not** the daily gallery we built around. Most teams will take exactly these 10 and do pixel colour → sound. Bloop stands out if it:
1. covers **all 10**;
2. **recovers values from each and checks them against its source dataset**;
3. uses **computer vision that means something physically** for each (currents as motion, lightning as events, aerosols as types);
4. keeps our daily live frames as the "real time" layer.

---

## 2. Resource by resource: what it is [V], how to sonify it, how to verify it

| # | Official resource | What it actually is [V, SVS page] | Sonification (value-safe) | Verification against source | Bangladesh hook | 3D tie-in | Effort |
|---|---|---|---|---|---|---|---|
| 1 | **EIC Content Database** ("videos and images as data for processing the audio files") | The SVS visuals behind the EIC dashboards. Our J0 inventory found 72 items, 11 with frames + a colorbar | Every frame-pairable item becomes a record; every other item plays as **pattern sonification**, labelled "pattern, not values" | Colorbar items: the truth test where a source exists | Records start over Bangladesh | Record carousel | M (we have the inventory) |
| 2 | **Data Sonification: Caldwell 73** (SVS 13786) | SYSTEM Sounds (M. Russo, A. Santaguida). A **radar-style sweep around the image**; **radius → pitch** (farther from the centre = higher); colour → instrument (orange/red stars = marimba, blue = glockenspiel); the whole image as a choir | **"Radar sweep" mode, credited:** the sweep rotates around a centre (Dhaka, or the needle). Two variants: (a) **Caldwell mapping**: distance → pitch, colour class → instrument, labelled "after NASA's Caldwell 73 sonification"; (b) **Bloop mapping**: value → pitch, distance → time. Users compare the two | n/a (method) | A sweep centred on Dhaka | The tonearm sweep on the turntable | S |
| 3 | **Global Sea Surface Currents and Temperature** (SVS 3912) | **ECCO2 model** (MITgcm, assimilates satellite and in-situ data), **25 Mar 2007 – 3 Mar 2008**; flows coloured by SST, **0–32 °C** colorbar; **flat 2:1 frame sequences at 2048×1024 and 6840×3420** | Two layers. **Temperature:** colorbar inversion → the existing SST voice. **Motion:** **optical flow** between consecutive frames (OpenCV Farnebäck) → flow speed → granular stream density; flow direction → pan / glide direction; eddy rotation (vorticity) → a swirl effect | (1) Inverted SST vs **MUR 2007** at the same dates: rank test, "model vs observation" (MUR exists from 2002). (2) Flow direction vs **NASA OSCAR** surface currents (PO.DAAC; route to check): angle agreement. **Label ECCO2 as a model** | Bay of Bengal monsoon currents (East India Coastal Current reversal) [HYP: check that it's visible] | "Sound terrain" with currents flowing over it | M |
| 4 | **Change in Night Lights 2012–2023, EIC version** (SVS 5313) | NASA **Black Marble (Suomi NPP VIIRS)**: "more light in **purple**, less light in **orange**"; **7680×2160 EIC frames** (32:9), flat map (the related 5475 is equirectangular); no colorbar listed | **Pixel density / intensity → tempo or rhythm** (the resource's own suggestion). Purple = rising arpeggio voices, orange = falling; magnitude from saturation, **relative only** | **Sign test:** Black Marble annual composites 2012 vs 2023 (VNP46A4; NOAA-20 VJ146A4 for continuity). Agreement % for brighter/darker, as we did with CRW. **Note S-NPP ends 2 Nov; archive products remain** [INF] | **Dhaka/Chattogram brightening; the Padma Bridge corridor** [HYP] | **3D-10 light columns**: real 2012 vs 2023 heights | M |
| 5 | **GEOS Aerosols** (SVS 5669, Aug 19 2025 20:00 UTC still; also 5572) | GEOS-FP 2 km replay; **sea salt = blue, dust = pink/magenta, smoke = orange/red, sulfate = green**; 16:9 stills up to 7680×4320; a colorbar image | **Multi-track** (their suggestion): **hue segmentation** into 4 types → 4 instruments (sea salt shimmer, dust rasp, smoke crackle-drone, sulfate glass). Density per type → each voice's level; the mixer solos a type | Per-type AOD from **GEOS-FP / GEOS-CF** (`aod550_dust`, `_bc`/`_oc`, `_ss`, `_sla`: variable names to confirm) for the same date: rank test per type | Winter smoke + sulfate over the Indo-Gangetic Plain → Bangladesh; dust in the pre-monsoon [HYP] | Mixing desk "air" shell | M |
| 6 | **Perpetual Ocean 2: Western Boundary Currents** (SVS 5425) | **ECCO-2 2021–2023**: Kuroshio, Agulhas, Gulf Stream (to ~2.5 m/s). **Separate layer sequences:** beauty (white flows above 600 m), **temperature (0–25 °C)**, **salinity (33–36)**, land mask, dates; 3840×2160 at 60p (beauty also 9600×3240) | **A three-movement "Boundary Currents" suite.** Optical flow on the beauty layer → rhythm and tempo (their suggestion: "align visual shifts with rhythms or scales"). The temperature/salinity layers **invert to values** (each has its own colour table) → pitch / timbre. Each current is one movement | Temperature vs MUR 2021–23 in each region (camera views: **statistical regional comparison**, not pixel geolocation, unless the views are geo-registered [check]); speed vs OSCAR | Contrast piece: Bay of Bengal vs Gulf Stream, "why our sea is calmer" [HYP] | Western-boundary scene | M–L |
| 7 | **Air Quality Model Runs** (SVS 5533 / 5518) | **GEOS-CF**, **1 Jul – 14 Sep 2024**; PM2.5, O3, CO, NOx; **equirectangular 2:1**; frame sets at 4096×2048 and 2048×1024 (1,801 frames); **per-species colorbars (600×200)** | **Frame-paired air voices at last:** colorbar inversion per species → B7 haze filter (PM2.5), plus a voice each for O3, CO and NOx. **Fixes our stale-5151 gap** | Inverted pixels vs **GEOS-CF archive values for Jul–Sep 2024** (same model, so this tests the inversion), plus ground stations in Dhaka for those weeks (independent) | **Aug 2024: the eastern Bangladesh floods period**: air during the floods; North American fires for global contrast | Haze dome / snow globe with frame-paired values | M |
| 8 | **DYAMOND Global Carbon Dioxide** (SVS 5196) | GEOS–MITgcm coupled **DYAMOND nature run, Jan–Mar 2020**; CO2 in ppm; a colorbar image with **colour + opacity transfer functions**; mostly **globe orbit/zoom views** (not flat maps) | **Pattern sonification over time:** plume edges (shape detection) → swells; overall density → a slow pedal; colorbar → relative ppm along a fixed screen scan. Labelled "model nature run; relative values" | Shape/time patterns only. Context: Mauna Loa 2020 (in-situ, same months): seasonal level, not pixel truth | Asian emission plumes drifting over South Asia [HYP] | Time-tunnel CO2 pedal; GHG record | S–M |
| 9 | **Lightning Events from the ISS 2017–2023** (SVS 5011) | **ISS-LIS** final QC data; a **10-day roving window**; movies at 1080p / 4K / **7680×2160 EIC**, and a **4096×2048 Science On a Sphere movie** (2:1, Mar 2017 – Jul 2023); **no frame sets listed** → extract frames | **Punctuated percussion** (their suggestion): **blob detection** of new flashes per extracted frame → drum hits placed by longitude (pan) and latitude (pitch register). Season = groove | Flash counts per region/window vs **ISS-LIS flash data (GHRC)**: count correlation | **Bangladesh pre-monsoon morning storms** (69% pre-monsoon; sunrise-to-midday peak [V lit]) | **3D-24 thunder towers**: now frame-paired | M |
| 10 | **A 3D View of an Atmospheric River** (SVS 4960) | **MERRA-2 reanalysis**: integrated water-vapour transport (blue shading), clouds, precipitation; NE Pacific → US West Coast; frame dates ~29 Nov – 10 Dec 2021; frames 3840×2160 / 9600×3240 / **7680×2160** | **Immersive moving soundscape:** blue-shading density → pad thickness; the river's centreline (shape) → **HRTF position moving across the listener**; rain-from-cloud → the existing rain drops | Compare the river's track/strength with **MERRA-2 IVT** for the same days (`UFLXQV`/`VFLXQV` in MERRA-2's integrated diagnostics: name to confirm) | Monsoon moisture "rivers" into Bangladesh: explanatory contrast only [HYP] | A spatial-audio scene (headphones) | M |
| 11 | **GEDI Forest Height** (SVS 4950) | 16:9 renders **with a burned-in colorbar** (our L4 test); no flat 2:1 map | **Colour spectrum → pitch/rhythm** (their suggestion): read the in-frame colorbar (tick detection, as for 5176) → height per pixel → organ-pipe pitch in a sweep | **Distribution check:** histogram of frame heights vs GEDI L3 global; plus our point values (Lawachara 17.2 m, …) on the forest record | Sundarbans, Madhupur, Lawachara | **3D-9 forest of three lidars** | S–M |

**Rules for all 11:**
- Each record states **model vs observation**. ECCO2, GEOS-FP, GEOS-CF, DYAMOND and MERRA-2 are models or reanalyses.
- Each record states **its period** ("2007–08", "Jan–Mar 2020"), so nobody mistakes an archive animation for live data.
- Our daily frames (5101, 4285, 5176, 5315) stay the **"real time"** layer.

---

## 3. The three example techniques, done better than anyone else

### 3.1 "Color spectrums → musical chords" (value-safe)
- Use the colorbar position as the **harmony layer**: the colormap is divided into a few bands, and each band maps to a chord (e.g. in the Megh-safe palette).
- The **exact value pitch stays on top** (or lands exactly via meend).
- Result: the chord tells you the region of the scale, and the melody tells you the exact value.
- Test: pleasantness + accuracy vs plain tones in the pilot.

### 3.2 "Pixel density → rhythm"
Three natural fits:
- **night lights** (5313): pixel density → tempo;
- **lightning** (5011): flash blobs → hits;
- **fires** (5113 + FIRMS): hot pixels → Geiger clicks.

The rate is a stated linear rule; the counts are checked against the source (Black Marble, ISS-LIS, FIRMS).

### 3.3 "Visual shapes → synth parameters"
Contour and shape analysis gives each shape a sound:
- **storm cells** in the IMERG frames: area → voice count (B2), perimeter roughness → filter;
- **aerosol plumes** (5669): elongation → glide;
- **current eddies** (optical-flow vorticity in 3912/5425) → swirl/phaser depth;
- **the atmospheric river** centreline → spatial path.

Each shape metric is printed in the details card, so the rule is visible.

### 3.4 ML, only where it can be checked
- **k-means colour clustering** to recover a colormap when no colorbar exists. Prior art: arXiv 2507.20632 colormap recovery. Admit a recovered colormap only if the truth test passes.
- **Optical flow** (classical, or a small learned model) for currents: verified against OSCAR.
- No generative AI makes the data sound (book rule). AI music only in a labelled interpretation mode, or not at all.

---

## 4. All four deliverable forms (the statement lists them; ship them all)

1. **Interactive web jukebox:** the current app, with one record per official resource.
2. **"Standalone desktop application":** make Bloop an **installable PWA** with an offline cache of the album and the latest frames. Install → it runs like a desktop app [INF: counts as one; low effort].
3. **"Backend API endpoint":** a public, documented `GET /api/v1/sonify?svs=5101&lat=…&lon=…`, returning the value, unit, frame time, mapping parameters (frequency, rate) and the measured error. Plus `GET /api/v1/render?svs=…&preset=listen` returning a short WAV.
   - OpenAPI spec on the "How Bloop hears" page.
   - Rate-limited; no keys exposed.
   - Optional MCP wrapper (AI-6).
4. **"Curated collection of original, generated audio files" / "playlist":** **an album, "Bloop: Earth Information Sessions"**.
   - One track per official resource (11) + 3 Bangladesh tracks: Amphan, Jamuna, Dhaka then vs now.
   - Each track is rendered by the same engine.
   - **Liner notes per track:** source SVS ID, data period, mapping rule, measured agreement, the "why" behind the artistic choice.
   - Downloadable WAV/MP3 with embedded metadata (dataset, mapping, error), CC BY.
   - The "playlist accompanied by an explanation of the creative process", exactly as worded.
5. **Immersive / hyperwall mode** (the statement's "Space for Earth" image):
   - a **7680×2160** layout using the resources' own EIC 32:9 frame sets (5313, 5011, 4960 have them);
   - multichannel Web Audio where the device supports more than 2 channels (left-to-right speaker spread follows longitude), stereo fallback;
   - a demo of how Bloop would run in an EIC room.

---

## 5. Stories that use the official resources together ("interconnected systems")

- **Water's journey (Connected Earth suite):**
  1. ISS lightning storms (5011) →
  2. an atmospheric river carrying moisture (4960) →
  3. IMERG rain (4285) →
  4. Jamuna rising 8 m (SWOT) →
  5. currents carrying it away (3912/5425) →
  6. the sea's temperature (5101/5176).
- **Fire → smoke → breath:** FIRMS/5113 fires → GEOS smoke aerosols (5669) → GEOS-CF PM2.5 model runs (5533) → Dhaka ground stations.
- **People → light → carbon:** night lights 2012→2023 (5313) → DYAMOND CO2 plumes (5196) → Mauna Loa → Dhaka's heat then vs now.
- **Forests:** GEDI heights (4950) → Sundarbans lidar agreement → mangrove biomass.

Each story is a playlist **and** a Story-mode tour. Each step states its dataset and period. Short silences separate datasets (the GC referee's request).

---

## 6. Accessibility, sharpened by the statement's three named features

- **Screen reader:** already strong. Make every new record announce:
  - its SVS title;
  - its period;
  - model vs observation;
  - **the SVS description, fetched from the SVS API and stored**.
- **Tactile feedback:**
  - Android haptic pulses for discrete data (lightning hits, FWI class, fire counts);
  - **gamepad rumble** where supported [INF];
  - **3D-printed records** for 3 tracks, brought to the hackathon.
- **Rich descriptive text:**
  - per frame: code-computed descriptions ("Warmest water east of 88° E; heavy rain over Sylhet");
  - per track: liner notes;
  - per resource: the official SVS description, credited.
- **Prove it:** the YPSA co-design session (book J6), plus the pilot with pleasantness + accuracy scores.

---

## 7. Risks the official resources introduce

| Risk | Fix |
|---|---|
| Archive animations look "live" | Show the period on every record; keep the daily frames as the live layer |
| Model output treated as observation | Model badge on ECCO2, GEOS, DYAMOND, MERRA-2 |
| Regional camera views (5425, 4960, 5196) can't be geolocated per pixel | Statistical/regional validation only; say so |
| 5313 is S-NPP-based and S-NPP ends 2 Nov | The archive is fine; for continuity, validate with VJ146 annual |
| Big files (ProRes 4 GB, 9600-px sets) | Use the 2048–4096-px frame sets; never ship the raw frames; extract → value grids → small JSON/bin |
| "Chaotic noise" from many resources | One voice per record by default; suites add voices one at a time; the mixer solos |
| Over-claiming "ears reveal what eyes miss" | Report the measured result only |

---

## 8. Priority (internal heuristic: weighing judge-visible fit to the official text, verifiability and effort; not a prediction)

1. **Air Quality Model Runs (5533) → frame-paired air voice:** an equirectangular, colorbarred frame set. The cleanest win: it fills Bloop's biggest gap.
2. **Currents + SST (3912):** a flat 2:1 frame set; temperature inversion + optical flow; the statement names currents.
3. **ISS lightning (5011)** percussion + **GEDI (4950)** colour-spectrum sweep + **Night lights (5313)** density rhythm: these are the official resource's own suggestions, each verified.
4. **Caldwell 73 radar-sweep mode:** small effort, an explicit nod to NASA's own method.
5. **GEOS aerosols (5669)** multi-track by hue.
6. **The album + liner notes + API endpoint + PWA:** the deliverable forms.
7. **Perpetual Ocean 2 (5425), atmospheric river (4960), DYAMOND CO2 (5196):** the heavier camera-view pieces.
8. **Hyperwall mode** + the Connected Earth suites.
