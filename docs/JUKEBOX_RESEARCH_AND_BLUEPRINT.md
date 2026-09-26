# The Earth Information Jukebox — Research, Invention & Blueprint (v1)

**Challenge #14, NASA Space Apps 2026 ("The Next Frontier") · Prepared 24 Sep 2026**

This document is the output of a research and invention pass. It does **not** rank ideas or predict winners. Ideas are never discarded because they already exist somewhere; existing work is treated as a design input.

**How to read the labels**

| Label | Meaning |
|---|---|
| **[VERIFIED]** | Checked against a primary or official source (linked), or measured by our own experiment |
| **[INTERP]** | Our interpretation of a source |
| **[HYPOTHESIS]** | Plausible, not yet tested |
| **[NEW IDEA]** | Invented here; no evidence yet |
| **[UNKNOWN]** | Not found or not checked |

**Coverage limits of this pass (read first).**
- About 45 web searches and fetches across this conversation. GitHub code search, Devpost, ICAD proceedings and YouTube were **not** searched systematically.
- Space Apps project pages block automated access, so historical projects rely on pages you pasted and on NASA/partner news.
- No 2026 team code was inspected; team information comes from public blurbs only.
- A deeper follow-up sweep is listed in Section 20.

---

## 0. The ask, the constraints, and what we already proved

**Official summary (Tier 1, project file):** build an "Earth Jukebox", an interface, script, or application that **"pairs Earth Information Center (EIC) visual frames with dynamic sonifications generated in real time."** It is tagged *Intermediate, Beginner/Youth* and *Arts & Multimedia, Earth Science, Software*. [VERIFIED]

**2026 theme.** "The Next Frontier!" NASA frames the event as a gateway to "answer the questions that will propel humanity to the Moon, Mars, and beyond." Space Agency Partners include JAXA, ESA, ISRO, CSA and the UK Space Agency, among others. [VERIFIED — [NASA SMD announcement via astrobiology.com](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/)]

**Timeline.**
- Prototype due 1 Oct.
- Mentoring month.
- 240-second video due 1 Nov.
- Hackathon 14–15 Nov (local dates may differ).
- 30-second video for global judges.

**What past full statements added in this lineage (project file, historical analysis):**
- **2023, Sounds of Space.** "In hybrid products, the audio must convey the data about as well as the visuals." Also: "a strong solution includes at least one original sonification example." [VERIFIED]
- **2024, Imagine our Connected Earth.** Required showing how the **nine EIC focus areas** interact. Listed **hardware targets**: 80-touchpoint kiosks, immersive rooms, and a 7680×2160 hyperwall. [VERIFIED]
- **2025, Deep Dive.** VR ocean stories using EIC and SVS visuals. Suggested sonification, gaze and hand interaction, and accessibility modes. [VERIFIED]
- **→ Implication [INTERP]:** the 28 Oct statement may add EIC hardware targets (kiosk or hyperwall), the nine focus areas, and an "audio conveys data as well as visuals" style rule. Design for these now.

**Our own evidence so far [VERIFIED by our experiments]:**
- **Check A:** no public tool found that does frame → colorbar inversion → validation against source data → sound. Colour-to-value inversion *itself* has prior art (mcgibs, unmap, Poco et al.).
- **Check B:** SVS frames are reusable with credit to NASA's Scientific Visualization Studio.
- **Check C:** the EIC sea-surface-temperature frame (SVS 5101), inverted through its colorbar, matched NASA MUR SST with a **median error of 0.85 °C, 90th percentile 1.38 °C** (60 ocean points, one frame).
- **Check D:** the IMERG frames (SVS 4285) qualify: 3600×1800 equirectangular, `flatalpha` data-only layer, liquid and frozen log colorbars (0.1–50 mm/h). The rain test (D2) is **not yet run**.

---

## 1. Research landscape (what already exists)

### 1.1 NASA / EIC ecosystem
- **EIC exhibits.** Hyperwalls at NASA HQ, the Smithsonian National Museum of Natural History and Kennedy Space Center, showing "dashboards with real-time data on Earth systems".
  - HQ also has **"Earth Pulse", an LED sculpture that tracks communications between Earth missions and ground receiving stations.** [VERIFIED — [earth.gov NASA HQ exhibit](https://earth.gov/visit/exhibit/nasa-hq)]
  - Visitors are "greeted by chirping birds and other natural sounds". The visualizations are "updated as often as six minutes". [VERIFIED — [NASA exhibit article](https://science.nasa.gov/science-research/earth-science/nasas-new-exhibit-showcases-our-home-planet-and-climate/)]
  - EIC content is shared with museums, planetariums, libraries and schools. [VERIFIED — [EIC DIY exhibits slides, Oct 2025](https://www.nisenet.org/sites/default/files/catalog/uploads/10-7-25_-_diy_nasa_exhibits_master_slides.pdf)]
- **Nine EIC focus areas:** sea level change, air quality, biodiversity, wildfires, greenhouse gases, energy, disasters, water resources, agriculture. [VERIFIED — [SVS hyperwall playlist](https://svs.gsfc.nasa.gov/gallery/hyperwall-power-playlist-earth-science/)]
- **SVS Daily Visualizations for EIC** (~25 items, per your screenshot). Examples: IMERG 4285, Earth Observing Fleet 5067, VIIRS fires 5113, SST 5101, GOES 5120, sea ice 5046/5064/5099, GEOS-CF CO/NOx/O3/PM2.5 (5153/5154/5152/5151), GEOS-FP humidity, wind, precipitation and temperature (5150/5148/5149/5147), SST (5176), fire weather (5315), landslide exposure (5584), NDVI (5544). [VERIFIED — [gallery](https://svs.gsfc.nasa.gov/gallery/daily-visualizations/)]
- **SVS public JSON API** (e.g. `/api/4285`) returns titles, alt text, descriptions and file lists. The 4285 entry states that IMERG gives precipitation rates for the whole world every 30 minutes. [VERIFIED — [SVS API 4285](https://svs.gsfc.nasa.gov/api/4285)]
- **GIBS/Worldview** serves MUR SST and MUR SST anomaly layers, plus 30-minute IMERG. [VERIFIED — [Worldview release note](https://wiki.earthdata.nasa.gov/x/eRWECg); [IMERG in Worldview explainer](https://ceosr.science.gmu.edu/global-rainfall-at-your-fingertips/)]
  - The IMERG explainer notes: rates are estimated at the middle of each 30-minute period, in mm/h, and IMERG appears roughly 5 hours after observation. [VERIFIED, secondary]
  - GIBS publishes machine-readable colormaps with a `sourceValue` per colour (per the Check A report).
- **NASA sonification work:** Chandra "A Universe of Sound"; the SYSTEM Sounds 2020 Earth Day piece; Goddard "Sounds of the Sea" (RGB → notes); the Earthdata NDVI "From Data to Melody" blog. [VERIFIED via Check A report and [System Sounds](https://www.system-sounds.com/earth-day/)]

### 1.2 Academic landscape (sonification, accessibility, perception)

| Work | Key finding | Implication for the Jukebox |
|---|---|---|
| iSonic, Zhao, Plaisant, Shneiderman, Lazar (TOCHI 2008) [link](https://dl.acm.org/doi/10.1145/1352782.1352786) | 7 blind users over 42 hours found facts and trends in geo-referenced data. Uses the Auditory Information Seeking Principle: gist, navigate, filter, details on demand | The core interaction model for map exploration by ear [VERIFIED] |
| Umwelt, Zong et al. (CHI 2024) [doi](https://doi.org/10.1145/3613904.3641996) | Visualization, sonification and text as equal representations with a shared query. 5 blind/low-vision (BLV) experts used sound for overview and text for detail | One shared cursor across sound, text and map [VERIFIED] |
| MAIDR, Seo et al. (CHI 2024) [arXiv](https://arxiv.org/abs/2403.00717), [repo](https://github.com/xability/maidr) | Braille, text, sonification and review modes; 11 blind participants interpreted statistical charts accurately. The library adds AI descriptions | A pattern library for multimodal access [VERIFIED] |
| AltGeoViz, Li et al. (VIS 2024) [arXiv](https://arxiv.org/abs/2406.13853) | Alt text for the current map view, updated dynamically (3×3 grid summaries). Worked for 5 screen-reader users | Spoken regional summaries [VERIFIED] |
| VizAbility (UIST 2024) [doi](https://doi.org/10.1145/3654777.3676414) | LLM Q&A over chart specs with structured outputs to limit hallucination; 87.39% query-classification accuracy | Pattern for a grounded AI assistant [VERIFIED] |
| Walker 2002; Walker & Mauney (TACCESS 2010) [PubMed](https://pubmed.ncbi.nlm.nih.gov/12570096/) · [ACM](https://dl.acm.org/doi/abs/10.1145/1714458.1714459) | Mapping direction and scaling depend on the data dimension. Magnitude estimation is a design tool. Blind and sighted listeners mostly agree, with exceptions | Test the mappings; don't assume them [VERIFIED] |
| Arcand et al., A Universe of Sound (Front. Commun. 2024) [doi](https://doi.org/10.3389/fcomm.2024.1288896) | 3,184 participants reported learning gains and trust. Participants often misunderstood the sonifications ([astrobites summary](https://astrobites.org/2024/06/28/tuning-in-to-the-sound-of-the-universe/)) | Audio legends and explanation are required [VERIFIED] |
| Tucker Brown et al. (astronify, 2022) [arXiv](https://arxiv.org/pdf/2209.04465) | **No significant benefit** from adding sonification to plots for detecting signals; sound alone was worse. Diaz-Merced (2013) found benefit only when a **visual cursor swept in sync with the sound** | **Counter-evidence:** don't claim "ears beat eyes". A frame-locked, synchronized cursor is the evidence-backed design [VERIFIED] |
| Bearman thesis (2013) [Zenodo](https://zenodo.org/records/13809573); Fisher 1994; Ballatore et al. 2018 (via [Semantic Scholar](https://www.semanticscholar.org/paper/Using-Sound-to-Represent-Uncertainty-in-Bearman/7d55dee3fe080204339e6d5a0f91922f4c509b75)) | Sonifying uncertainty in spatial and satellite data **exists**. Loudness, order and clarity were the most intuitive uncertainty dimensions | Uncertainty sonification is **not new**; what's new is using NASA's own per-pixel quality fields live [VERIFIED / INTERP] |
| Audiovisual semiotics of uncertainty (2025) [arXiv](https://arxiv.org/html/2505.14379) | Loudness is well suited to uncertainty; redundant audio plus visual encoding helped | Encode confidence as loudness or clarity, mirrored visually [VERIFIED] |
| Chundury et al. (TACCESS 2026) [doi](https://doi.org/10.1145/3798100) | Dragging a finger with continuous sound gave intuitive trend detection but needed practice; hierarchical text made spatial mental models hard | A touch mode plus a training tutorial [VERIFIED] |
| Lindborg et al., 32 climate sonifications (Front. Psychol. 2022) [link](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.1020102/full) | Sound that feels arbitrary relative to the data is ineffective; aesthetics and efficacy must be balanced | Use ecological sounds (rain-like rain) [VERIFIED] |
| Nature Reviews Earth & Environment (2024) [link](https://www.nature.com/articles/s43017-023-00512-y) | Sonification for Earth-science communication and multi-dimensional data | Legitimises the Earth-science framing [VERIFIED] |
| Erie grammar (CHI 2024) [arXiv](https://arxiv.org/abs/2402.00156), [repo](https://github.com/see-mike-out/erie-web) | Declarative sonification with auditory legends; Web Audio and Web Speech compiler | Specify and publish the mapping precisely [VERIFIED] |
| STRAUSS (JOSS 2025) [repo](https://github.com/james-trayford/strauss) | Python sonification with text-to-speech captions | Offline rendering and the audio bulletin [VERIFIED] |

### 1.3 Colour-to-value inversion prior art (from the Check A report)
- mcgibs: reverse-maps GIBS pixel colours via the layer's colormap.
- Poco, Mayhua & Heer (TVCG 2018): legend extraction with OCR.
- arXiv 2507.20632: colormap recovery without a legend.
- `unmap` (two repos).

**None of these starts from EIC/SVS frames, validates against the declared source dataset, or makes sound.** [VERIFIED per report; not re-fetched]

### 1.4 Space Apps history (sound, EIC, imagery)
- **2023 Sounds of Space.**
  - **Arcobaleno** won Global Connection with a documented colour-to-note method, layers, a radial scan and genre choice.
  - Finalist pages you pasted show pixel/brightness mappings as the norm. Only **Area Six** (IRSA catalogues with quality filters, spatial audio, per-band timbre) and **Astral Arias** (CRISM hypercube, hover grid, a UWB walking installation) used real data values.
  - None reported testing with blind users. [VERIFIED from pasted pages]
- **2018:** SongSAT (satellite landscapes → music) was a global winner. **Soundiverse** (image → composed music) was a Global Nominee in "Artify the Earth". [VERIFIED — [Soundiverse page](https://2018.spaceappschallenge.org/challenges/help-others-discover-earth/artify-earth/teams/spart/project)]
- **2024 Imagine our Connected Earth:** audio-visual interactive products across the EIC areas; at least one local-level placement is documented. [VERIFIED — [UWC ISAK](https://uwcisak.jp/blog/news-events/uwc-isak-japan-students-shine-at-nasa-space-app-challenge-japan/)] Global winner in this challenge: [UNKNOWN]
- **Scale:** 2024 had 9,996 submissions and 10 global winners. [VERIFIED — [NASA](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/)]

### 1.5 2026 competitive signals (from public blurbs only, not verified further)

| Team / artefact | Signal | Source |
|---|---|---|
| Pundra repo "The-Earth-Information-Jukebox" | Numeric series (MODIS, GISTEMP, OCO-2, GRACE, SMAP) → normalised → Web Audio; EIC mentioned only as motivation | Check A report, [repo](https://github.com/ahsanur-official/The-Earth-Information-Jukebox) |
| Stack Underflow | TEMPO, POWER, GIBS → "listening to the Earth"; "looking in time" | Your screenshot |
| Sayqal | 45 years of change voiced in Uzbek maqom and doyra; Tone.js | Your screenshot |
| DeepSonic | Bathymetry → interactive sound; ML plus real time | Your message |
| Planet Buddy | Children and storytelling; challenge unclear | Your screenshot |
| Build-guide followers | POWER/NDVI/FIRMS/GRACE voices; visible mapping (guide p. 71–73) | Guide OCR |

---

## 2. Opportunity landscape (what existing work does not solve)

1. **Nobody verifies that the sound matches the data.** Past finalists, NASA's pieces and 2026 blurbs describe mappings, not measured fidelity. [INTERP from Sections 1.2–1.5]
2. **Frame pairing is rare.** Most projects sonify either images (no values) or series (no frames). The literal 2026 ask needs both.
3. **Human evidence is rare in hackathon sonification.** It is common in research (iSonic, MAIDR, Umwelt) but absent from the 2023 finalist pages.
4. **Uncertainty is known in research but not applied live.** NASA products carry per-pixel quality or freshness fields: MUR `analysis_error` and `dt_1km_data` (hours to the nearest infrared measurement), and IMERG quality indices. [VERIFIED for MUR `dt_1km_data` and `sst_anomaly` — [MUR dataset page](https://data.nasa.gov/dataset/ghrsst-level-4-mur-global-foundation-sea-surface-temperature-analysis-v4-1-d17d3)]
5. **Multi-agency disagreement is invisible to the public.** NASA IMERG vs JAXA GSMaP (both 0.1°), and NASA/JPL MUR vs UK Met Office OSTIA. GHRSST already publishes ensemble spread across SST analyses. [VERIFIED — [GMPE monitoring](https://ghrsst-pp.metoffice.gov.uk/ostia-website/gmpe-monitoring.html)]
6. **Provenance ("who measured this?") is shown as art (Earth Pulse) but never as data you can explore.**
7. **EIC venues already use sound (bird sounds at the entrance), but not data sound.** A kiosk or hyperwall-ready audio layer fits the EIC's own distribution model to museums and schools.
8. **Cultural expression without falsification.** Sayqal shows the appetite. Raga time theory encodes *time and season*, which can carry the frame's timestamp while values stay locked. [HYPOTHESIS]
9. **Detection claims are unproven.** Evidence is mixed (Section 1.2), so a small, honest detection experiment with a known answer would itself be a contribution.

---

## 3. Fifteen project architectures (each with one central interaction)

These are unranked. Each can stand alone, and most share the same core engine (Section 8), which is what makes combining them realistic.

| # | Architecture | Central interaction | What makes it different | Biggest weakness → repair |
|---|---|---|---|---|
| A | **Verified Earth Instrument** | Play any EIC daily frame; sound comes live from colorbar-inverted values; a truth panel shows the error against the source dataset | Every sound is provably the NASA value | Can feel "technical" → pair with a human story (E or D) |
| B | **Earth Orchestra** | Several EIC tracks play together as voices: temperature as drone, rain as percussion, fires as hits, air quality as breath, vegetation as a slow line | Maps onto the nine EIC focus areas (the 2024 statement required interaction between them) | Cacophony risk → mixer with solo/mute; the listening study tests how many voices people can separate |
| C | **Earth Detective** | Audio-first clues from a real event ("heavy rain arrived here, then fire risk rose there…"); the player finds where and when on the map | Real events and real data; the answer can be checked in the frames | Game risk → every clue is a real frame value; an answer reveal shows provenance |
| D | **Accessibility-first Earth Explorer** | Keyboard, touch or screen reader: gist sweep → navigate → details on demand, with spoken area summaries | Follows iSonic, Umwelt and AltGeoViz principles on live Earth observation | Needs BLV co-design → recruit early; small-n study |
| E | **Monsoon Watch** | Hear 30-minute IMERG rain over South Asia or Bangladesh; time-lapse plus live now | Local stakes and a vivid story | Regional focus may read as narrow → the same engine works globally |
| F | **Provenance Jukebox** | Each sound can be traced back: pixel → value → source file → satellite and instrument; passes of GPM-constellation satellites (via CelesTrak and satellite.js) as audible "who measured this" cues | Makes the spacecraft audible, echoing EIC's Earth Pulse sculpture | Orbit accuracy → validate pass times against published predictions |
| G | **Uncertainty-aware Jukebox** | Confidence becomes clarity or loudness (MUR `dt_1km_data`, analysis error, IMERG quality) | NASA's own quality fields made audible, live | Precedent exists → claim only the live-product application; test that people read it correctly |
| H | **Two-Agency Duet** | The same place and time heard from two products (IMERG vs JAXA GSMaP; MUR vs UK Met Office OSTIA), left and right ear | Disagreement between agencies becomes audible | GSMaP and IMERG share input satellites, so they aren't fully independent → say so; frame it as "algorithm disagreement" |
| I | **EIC Exhibit Sound Layer** | A kiosk or hyperwall mode: visitors touch regions, a room speaker array or headphones play the live data | Fits EIC venues and the 2024 hardware precedent | Can't test on a real hyperwall → simulate at 7680×2160 and document |
| J | **Earth Time Machine** | Then vs now: the ~2.5-year daily SST frame archive and longer SVS records; anomaly mode | Time depth with verified values | Long records may not be EIC daily frames → label the source |
| K | **Human–AI Listening Lab** | Humans, an audio-language model and a deterministic detector answer the same questions from the same sound | Explores whether machines can "hear" Earth data | No benchmark found [UNKNOWN] → research-only extra |
| L | **Collaborative Jam** | Several users each control a voice or region in a shared session | Social and classroom use | Networking complexity → optional |
| M | **Daily Earth Audio Bulletin** | An auto-generated 60-second audio segment (sonification plus spoken summary) for community radio or WhatsApp | Reaches low-bandwidth and blind audiences | Speech must be computed from data, not invented |
| N | **Young Explorer** | "Guess the ocean by ear", "find the storm" mini-games for the Beginner/Youth tag | Matches the challenge's tag | Under-18 rule for videos → test with adults, and children only with consent, not filmed |
| O | **Spatial Earth Soundscape** | The globe placed around the listener's head (HRTF); a phone's gyroscope steers where you face | Direction becomes spatial audio | Mobile browser support varies → progressive enhancement |

---

## 4. Feature inventory (34 features)

Build classes: **NOW** (1 Oct prototype) · **CORE-OK** (build once the core works) · **OPT** (optional) · **RESEARCH** · **NO** (don't build).

| # | Feature | User value | Scientific value | NASA relevance | Difficulty | Precedent | Differentiation | Validation | Class |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Frame-locked playback (EIC frames plus live sound) | Core experience | Links picture and data | Literal ask | Low | Many image sonifiers | Frame + value + live together | Latency test | NOW |
| 2 | Colorbar inversion engine (linear and log) | Invisible, but everything depends on it | Recovers physical units | Direct | Medium | mcgibs, unmap | Applied to EIC frames | Error vs source (done for SST) | NOW |
| 3 | Truth panel (per-track error vs source) | Trust | Published fidelity | Direct | Low | None found | High | Its content *is* the validation | NOW |
| 4 | Audio legend (reference tones) | Understanding | Reduces misreading | — | Low | Erie legends | Medium | Listening study | NOW |
| 5 | Mapping Spec page (all rules visible) | Transparency | Reproducibility | — | Low | Arcobaleno, build guide | Low alone | Review | NOW |
| 6 | Keyboard exploration plus spoken details | Access | — | — | Medium | iSonic, MAIDR | Medium | BLV tasks | NOW (basic) |
| 7 | Gist sweep (radial from the listener's location) | Fast overview | — | — | Low | Arcobaleno scan | Medium | Trend-task accuracy | NOW |
| 8 | Synchronized visual cursor during sound | Attention | Supported by Diaz-Merced | — | Low | Diaz-Merced 2013 | Medium | Detection study | NOW |
| 9 | Rain track via IMERG `flatalpha` | Monsoon story | Log-scale handling | Direct (NASA–JAXA GPM) | Medium | — | Medium | D2 test | CORE-OK |
| 10 | Fires track (VIIRS, 5113) as percussion | Events | Sparse-event mapping | Direct | Medium | Build guide idea | Medium | Checklist + FIRMS check | CORE-OK |
| 11 | NDVI slow voice (5544) | Seasons | — | Direct | Medium | Build guide | Low | Checklist | OPT |
| 12 | Air-quality breath voice (GEOS-CF 5151) | Health relevance | — | Direct (model) | Medium | Stack Underflow direction | Medium | Checklist | CORE-OK |
| 13 | Mixer with solo/mute (Orchestra) | Control | Separability | — | Low | DAW-like | Medium | Stream-separation test | CORE-OK |
| 14 | Spoken area summaries (3×3 grid, code-computed) | Access | — | — | Medium | AltGeoViz | Medium | BLV comprehension | CORE-OK |
| 15 | Grounded AI Q&A (numbers only from code) | Natural questions | — | — | Medium | VizAbility | Medium | Answer-accuracy benchmark | CORE-OK |
| 16 | Automatic colorbar reading (computer vision + vision model) across the EIC catalogue | Scale | Makes the method general | Direct | High | Poco et al. | High in combination | N of M tracks pass the truth test | CORE-OK |
| 17 | Uncertainty as clarity or loudness (MUR `dt_1km_data`, analysis error) | Trust | Uncertainty communication | Direct fields | Medium | Fisher, Bearman | Medium–high (live NASA fields) | Can listeners rank confidence? | CORE-OK |
| 18 | Two-agency duet (IMERG vs GSMaP; MUR vs OSTIA) | Curiosity | Product disagreement | NASA + JAXA / UK | High (registration, formats) | GHRSST ensemble plots (visual) | High | Correlation plus listener task | OPT |
| 19 | Provenance click-through (pixel → file → satellite) | Trust | Lineage | Direct | Medium | — | High | Correctness audit | CORE-OK |
| 20 | Satellite-pass cues (SGP4) | Wonder, "next frontier" | Observation geometry | GPM constellation | Medium | Earth Pulse (art) | High | Pass-time check | OPT |
| 21 | Music mode vs precise mode | Enjoyment vs accuracy | Measured trade-off | — | Low | Arcobaleno (scale) | Medium | Error and study comparison | CORE-OK |
| 22 | Raga time-and-season encoding (culture follows the frame's local time and season; values stay locked) | Cultural resonance | — | — | Medium | Sayqal direction; raga time theory | Medium | Does it hurt accuracy? (study) | OPT |
| 23 | Style skins (instrument sets) | Personalisation | — | — | Low | Arcobaleno genre | Low | — | OPT |
| 24 | Anomaly mode (MUR `sst_anomaly`, from 2019) | "What's unusual" | Climate framing | Direct | Low–medium | — | Medium | Truth test on anomaly | CORE-OK |
| 25 | Extreme "points of light" pings | Salience | — | — | Low | Arcobaleno | Low | Detection task | NOW |
| 26 | Touch-drag continuous sound (phone) | Access | — | — | Medium | TactualPlot | Medium | Practice curve | CORE-OK |
| 27 | Vibration for rain intensity (Android) | Access | — | — | Low | — | Low | — | OPT (verify support) |
| 28 | Spatial audio (HRTF) | Immersion | Direction as a channel | — | Medium | Area Six, Astral Arias | Medium | Localisation test | OPT |
| 29 | EIC kiosk/hyperwall mode (7680×2160 layout, many touch points) | Deployment | — | EIC | Medium | 2024 statement specs | Medium | Mock test | OPT (after 28 Oct) |
| 30 | Daily audio bulletin generator | Reach | — | — | Medium | STRAUSS text-to-speech | Medium | Listener comprehension | OPT |
| 31 | Young Explorer mini-games | Engagement | — | — | Medium | Planet Buddy direction | Low alone | Learning gain | OPT |
| 32 | Listening study built into the app (consented) | Evidence | Human data | — | Medium | Research practice | High | — | CORE-OK |
| 33 | Mapping optimisation from listener data | Better mapping | Measured improvement | — | Medium | Walker (magnitude estimation) | High | Held-out listeners | RESEARCH → CORE-OK if data exist |
| 34 | Rain nowcast track (optical flow; pySTEPS baseline) | Future rain | Forecast skill | IMERG | High | JAXA/RIKEN GSMaP nowcast exists [VERIFIED — [GSMaP guide](https://sharaku.eorc.jaxa.jp/GSMaP/guide.html)] | Medium | Automatic, vs later frames | RESEARCH |
| — | AI-generated music as the data sound | — | Harms fidelity | — | — | — | — | — | **NO** (allowed only as a separate, labelled "interpretation" mode) |
| — | Prithvi-WxC in the core loop | — | — | NASA–IBM model | Very high | [HF model](https://huggingface.co/ibm-nasa-geospatial/Prithvi-WxC-1.0-2300M) | — | — | **RESEARCH only** (2.3B parameters; no clear Jukebox need) |

---

## 5. Seventeen unusual combinations

1. **Verified SST** + **analysis-age clarity** (`dt_1km_data`) + **spatial audio**: hear the ocean, and hear which parts NASA measured recently vs filled in.
2. **IMERG rain** + **GSMaP** in the other ear: the monsoon as NASA and JAXA each see it.
3. **VIIRS fires** + **GEOS-CF PM2.5** + **wind (5148)**: hear fires start, then smoke "breathe" downwind (cause and effect across EIC areas, as the 2024 statement required).
4. **Frame-locked cursor** + **the known-answer anomaly test** (synthetic hotspot injected into values): a live demo of detection by ear vs by eye.
5. **Satellite passes (SGP4)** + **IMERG freshness**: a new rain "note" appears as a GPM pass brings in new data.
6. **Raga season encoding** + **IMERG monsoon onset**: the mode changes as the data shows the monsoon arriving; the values stay locked.
7. **AltGeoViz-style summaries** + **grounded AI Q&A** + **keyboard navigation**: an Umwelt-like shared cursor for Earth frames.
8. **Automatic colorbar reading** + **truth panel**: "25 EIC products; N pass the fidelity threshold", with a live scoreboard.
9. **Earth Detective** + **provenance reveal**: solve the mystery, then trace every clue back to a NASA file.
10. **Daily bulletin** + **Bangla narration** + **community radio**: a local-impact channel for blind listeners.
11. **Kiosk mode** + **multi-touch** + **orchestra mixer**: an EIC exhibit where several visitors each "play" one Earth system.
12. **Music vs precise mode** + **in-app study**: the app measures its own accuracy trade-off.
13. **Anomaly SST** + **then vs now** + **culture skins**: a 2.5-year "ocean memory" suite.
14. **Mapping optimisation** + **Young Explorer**: games double as magnitude-estimation trials (consented adults).
15. **MUR vs OSTIA duet** + **GHRSST ensemble spread**: hear where the world's SST analyses disagree.
16. **Human vs audio-LLM** listening on the same verified sound: a research demo of "who hears Earth better".
17. **Hyperwall layout** + **HRTF** + **phone as personal headphones**: a room-scale Earth where each visitor hears their own region.

### 5b. Radical idea matrix (sample rows)

| NASA data | Phenomenon | Sonification | Visual | AI | Game | Story | Accessibility | Validation |
|---|---|---|---|---|---|---|---|---|
| IMERG (+GSMaP) | Monsoon onset | Rain density; two ears for two agencies | Time-lapse + cursor | Q&A: "when did rain reach X?" | Predict the next frames | "Can you hear it coming?" | Keyboard + spoken times | Error vs file; prediction checked vs later frames |
| MUR SST + `dt_1km_data` | Ocean heat + data freshness | Pitch + clarity | Frame + fog overlay | — | Rank confidence | "Where NASA didn't look" | Spoken confidence | Listener ranking vs field |
| VIIRS fires + GEOS-CF PM2.5 + wind | Fire → smoke | Hits → breath drifting | Linked tracks | Summary phrasing | Trace the smoke | Cause and effect | Spatial audio | Timing vs values |
| MUR anomaly archive | Marine heatwaves | Rising drone | Then/now slider | Similarity search (research) | "Find the heatwave" | "The ocean remembers" | Audio bulletin | Anomaly values vs source |
| GPM constellation orbits | Observation geometry | Pass cues | Orbit ticks | — | "Catch the satellite" | "Who measured this?" | Spoken satellite names | Pass-time check |
| Synthetic injected hotspot (labelled) | Detection test | Same mapping | Same | — | Detector game | Honest science | BLV and sighted | Known answer |
| 25 EIC products | Whole-Earth dashboard | Orchestra | Grid / hyperwall | Legend reader | Multi-player jam | Nine focus areas | Solo/mute by voice | N of M pass the truth test |

---

## 6. Idea parking lot (never deleted; revisit anytime)

| Idea | Source / origin | Status |
|---|---|---|
| Cultural idiom as musical language | Sayqal | Adapted as #22/#23 (culture encodes time and style; values locked) |
| Long time depth | Sayqal | J, #24 |
| TEMPO air quality | Stack Underflow | Parking. Not in the EIC daily gallery [UNKNOWN whether EIC has TEMPO frames]; use GEOS-CF now |
| GIBS exact colormaps | Stack Underflow, mcgibs | Used as a second validation route |
| Kids and storytelling | Planet Buddy | N |
| Orbital mechanics | Orbit team | F, #20 |
| POWER/GRACE series | Build guide | Optional "your location over decades" context layer (clearly not frame-paired) |
| Physical walk-through installation (UWB) | Astral Arias 2023 | Parking. Combine with kiosk mode if hardware is available |
| K-means clustering for structure | Area Six 2023 | Parking. Structure the gist sweep by clusters; test in study |
| Glasses or microcontroller device | BlindX 2023 | Parking. Out of scope; mention as future |
| Theme sets (e.g. "love") | Cinta 2023 | Parking. Could be a curated story playlist |
| Lightning as sparse percussion | Research idea | Parking [UNKNOWN whether an EIC frame exists] |
| Space weather / geomagnetic sound | ESA Swarm "sound of Earth's magnetic field" (2023 resources) | Parking |
| Prithvi-WxC "Earth memory" similarity search | NASA–IBM | Research only |
| VR/WebXR version | 2025 Deep Dive lineage | Parking; spatial audio first |

---

## 7. Borrow → Improve → Combine (existing projects)

| Existing work | What it actually did | Borrow | Improve | Combine with |
|---|---|---|---|---|
| Arcobaleno (2023 Global Connection) | Documented colour-to-note method, layers, radial scan, genre choice; sight-impaired purpose | Documented rules, reading order, style choice, human purpose | Values not colours; live, not offline; validated; tested with blind users | A + D + #21 |
| Area Six (2023 finalist) | IRSA catalogues with strict quality flags; per-band timbre; spatial panning; k-means; upload your own data | Quality filtering, timbre per source, spatial audio | Apply to live EIC frames; add truth tests | B + #28 |
| Astral Arias (2023 finalist) | CRISM hypercube; hover grid; UWB walk-through installation | Hover exploration; physical installation | Keyboard and touch for blind users; kiosk mode | D + I |
| BlindX (2023 finalist) | Background soundstage plus object pulses; deterministic; microcontroller-ready | Background + events structure | Real values; the pulses become extremes and anomalies | #25 + G |
| SoundJourney / A Ordem (2023 finalist) | 7×7 grid: rows → notes, columns → stereo pan, brightness → volume; in-browser | Simple grid for kids | Physical units; legend | N |
| SongSAT (2018 winner), Soundiverse (2018 nominee) | Satellite or space image → music | Showed Earth imagery music can win | Verified values; interaction | B |
| Pundra 2026 repo | Numeric NASA series → Web Audio | Its data voices as context | Add frames and validation | "Your location" context layer |
| Build guide #14 page | POWER/NDVI/FIRMS/GRACE voices; exponential pitch mapping; visible rules | The mapping maths; voice roles | Fill voices with EIC tracks | B |
| NASA Chandra / SYSTEM Sounds | Professional sonification; large audience studies | Explaining the translation; trust | Earth, live, verified | Audio legend |
| EIC Earth Pulse sculpture | Visualises mission-to-ground communications | The concept of making observations visible | Make it audible and data-linked | F |
| iSonic / MAIDR / Umwelt / AltGeoViz | Research tools for BLV exploration | Interaction patterns | Applied to live EO frames | D |
| mcgibs / GIBS colormaps | Exact values from GIBS tiles | A second validation route | Three-way agreement: EIC frame, GIBS, source file | A |

---

## 8. The single underlying engine (supports every experience)

```
EIC frame (SVS) ──► Colorbar inversion (CPU/GPU) ──► Value grid (°C, mm/h, ppb…)
        │                                              │
        │                         ┌────────────────────┼─────────────────────┐
        ▼                         ▼                    ▼                     ▼
  Frame on screen          Sound mapping         Text summaries        Truth / provenance
  (synced cursor)          (Web Audio,           (code-computed;       (source-file checks,
                           documented spec)       optional AI phrasing)  GIBS 3-way, satellite)
                                  │
              Experiences: Instrument · Orchestra · Detective · Explorer · Kiosk · Bulletin · Kids
```

Every experience reads the **same value grid**, so one validation covers them all. This avoids "feature soup": features are views of one engine, not separate products. [NEW IDEA — architecture]

---

## 9. Frontier technology (useful vs decorative)

| Technology | Real job in the Jukebox | Deterministic alternative? | Verdict | Evidence |
|---|---|---|---|---|
| WebGL/WebGPU shader inversion | Live per-pixel conversion at frame rate | CPU works for points; slow for full frames | CORE-OK | [HYPOTHESIS] needs a performance test |
| Web Audio + AudioWorklet | Low-latency synthesis | — | NOW | Standard |
| Vision model + CV colorbar reader | Scale to all EIC products | Manual per track (fine for 2–3) | CORE-OK | Poco et al. precedent |
| LLM with tool calls (grounded Q&A) | Natural-language questions for blind users | Fixed commands | CORE-OK | VizAbility |
| LLM phrasing of code-computed summaries | Fluency | Template sentences | OPT | AltGeoViz uses templates |
| Speech recognition + text-to-speech (Web Speech API) | Voice control, spoken details | — | NOW/CORE-OK | Standard |
| HRTF spatial audio | Direction | Stereo pan | OPT | Area Six precedent |
| SGP4 (satellite.js) + CelesTrak GP data | Satellite-pass cues | — | OPT | [VERIFIED] [CelesTrak SGP4 tutorial](https://celestrak.org/software/tutorials/sgp4.php) notes satellite.js was corrected to match CelesTrak's reference |
| Bayesian optimisation of mapping | Tune on listener data | Hand-tuning | RESEARCH → CORE-OK | Walker (magnitude estimation) |
| Optical-flow nowcast (pySTEPS) | Rain forecast track | — | RESEARCH | GSMaP RIKEN nowcast exists |
| Audio-language models as listeners | Human vs AI lab | — | RESEARCH | No sonification benchmark found [UNKNOWN] |
| Earth foundation models (Prithvi-WxC, Prithvi-EO) | Similarity search / "Earth memory" | Nearest-neighbour on value grids | RESEARCH | [HF](https://huggingface.co/ibm-nasa-geospatial/Prithvi-WxC-1.0-2300M) |
| Generative music models | Separate "interpretation" mode only | — | NO for data | Breaks fidelity |
| WebXR / VR | Immersive version | Spatial audio | Parking | 2025 Deep Dive lineage |

---

## 10. NASA dataset opportunities

| EIC frame (SVS ID) | Source dataset | Quantity | Why useful | Status |
|---|---|---|---|---|
| SST 5101 | MUR SST v4.1 (PO.DAAC) | °C; `sst_anomaly` (from 2019); `dt_1km_data`; analysis error | Verified track; anomaly and uncertainty come for free | **Verified: 0.85 °C median error** |
| IMERG 4285 (`flatalpha`) | GPM IMERG half-hourly (NASA–JAXA GPM) | mm/h, rain vs snow; quality index | Monsoon story; log scale | Qualified; D2 pending |
| VIIRS fires 5113 | VIIRS active fires (FIRMS lineage) [INTERP] | Detections, maybe radiative power | Sparse percussion | Checklist needed |
| GEOS-CF PM2.5 / O3 / NOx / CO (5151/5152/5154/5153) | GEOS-CF (GMAO model) | Concentrations | Air-quality voice (EIC focus area) | Checklist needed |
| GEOS-FP near-surface temperature 5147, wind 5148, humidity 5150, precipitation and clouds 5149 | GEOS-FP (GMAO) | Physical fields | Easy linear tracks; wind for cause and effect | Checklist needed |
| NDVI 5544 | NRT NDVI | Vegetation | Slow seasonal voice | Checklist needed |
| Sea ice 5046/5064/5099 | Sea-ice concentration | % | Polar voice | Globe views: harder |
| Earth Observing Fleet 5067 | Mission and orbit visual | Satellite positions | Provenance layer | Pair with SGP4 |
| Fire weather 5315, landslide exposure 5584 | Experimental products | Indices | Disaster focus area | Checklist needed |

---

## 11. Partner-agency opportunities (only where they add something)

| Source | Agency | What it adds | Independent of NASA? | Access | Status |
|---|---|---|---|---|---|
| **GSMaP_NRT / GSMaP_NOW** | JAXA | Second rain algorithm at 0.1°, hourly (NRT) and 30-minute realtime; free with registration; credit "GSMaP data by JAXA" | **Partly.** Shares GPM constellation inputs; different algorithm | [Registration](https://sharaku.eorc.jaxa.jp/GSMaP/registration.html), [product](https://eolp.jaxa.jp/GSMaP_Hourly.html) | [VERIFIED availability] |
| **OSTIA** | UK Met Office / Copernicus Marine | Second SST analysis at 0.05° daily; mirrored on PO.DAAC (same earthaccess route) | **Partly.** Shares some GHRSST inputs | [PO.DAAC](https://podaac.jpl.nasa.gov/dataset/ostia-ukmo-l4-glob-v2.0) | [VERIFIED] |
| **GHRSST Multi-Product Ensemble** | Met Office / GHRSST | Median and spread across SST analyses: a ready-made "disagreement" field | Ensemble | [GMPE page](https://ghrsst-pp.metoffice.gov.uk/ostia-website/gmpe-monitoring.html) | [VERIFIED page exists; data access UNKNOWN] |
| **JAXA AMSR2 (inside MUR)** | JAXA | Already one of MUR's inputs; EUMETSAT OSI SAF supplies MUR's sea-ice data | — | Cite as "multi-agency product" | [VERIFIED — MUR description] |
| **GPM Core Observatory** | NASA + JAXA | IMERG's calibrator (joint mission) | — | Cite | [VERIFIED] |
| **CelesTrak GP data** | Non-agency (public orbital data) | Satellite positions for provenance cues | — | Public | [VERIFIED] |

**Rule applied:** NASA stays central; partner data adds a second measurement or a disagreement signal, never decoration.

---

## 12. Scientific contribution map

| Candidate contribution | Precedent | What is still missing (our opening) | Status |
|---|---|---|---|
| **C1. Frame-locked, verified sonification of EIC products** (published per-track error) | Inversion tools (mcgibs, unmap, Poco); sonification tools | No one ties EIC frames → values → source-dataset error → sound | [HYPOTHESIS: novel combination]; SST verified |
| **C2. Audio vs visual vs both, for live Earth frames, with sighted and BLV adults** | Astronomy (Tucker Brown 2022: no added benefit); georeferenced (iSonic) | Live Earth observation; frame-synced cursor (Diaz-Merced's condition) | [HYPOTHESIS] |
| **C3. Live uncertainty sonification from NASA's own quality fields** | Fisher 1994, Bearman 2013, Ballatore 2018 | Live NASA quality and freshness fields (MUR `dt_1km_data`, IMERG quality) | [HYPOTHESIS] |
| **C4. Audible disagreement between agencies' products** | Visual ensemble plots (GMPE) | Sound, and interaction | [NEW IDEA] |
| **C5. Audible provenance (satellite and instrument lineage)** | Earth Pulse (art, not data) | Data-linked, explorable | [NEW IDEA] |
| **C6. Mapping optimised on measured listener performance** | Magnitude estimation (Walker) | Applied to EIC tracks with held-out testing | [HYPOTHESIS] |
| **C7. Automatic, verified legend reading across the EIC catalogue** | Poco et al. (charts in papers) | EIC products, validated against sources | [HYPOTHESIS] |
| **C8. Culture encoding time and season, not values** | Raga time theory; Eos notes the associations are "mostly subjective" ([Eos](https://eos.org/opinions/the-melodies-of-monsoons-weather-in-indian-classical-music)) | Measuring whether it helps or hurts comprehension | [NEW IDEA] |

---

## 13. Validation map

| What we must prove | Method | Ground truth | Effort | Status |
|---|---|---|---|---|
| Sound values = data values | Inversion error vs source per track (median, 90th percentile, bias) | MUR, IMERG, GEOS files | Low | **SST done** (0.85 °C); rain next |
| Three routes agree | EIC-frame inversion vs GIBS `sourceValue` vs source file | Source file | Medium | [PLANNED] |
| Stable calibration | Repeat on an older frame; is the bias stable? | Source | Low | [PLANNED] |
| Real-time claim | Frame-to-sound latency; update freshness (frame date vs now) | Clock | Low | [PLANNED] |
| People understand the sound | Within-subject study: identify / compare / trend tasks; audio-only vs visual-only vs both; counterbalanced order | Correct answers from values | Medium | [PLANNED]; pre-register thresholds |
| **Detection with a known answer** | Inject a synthetic hotspot into value grids (not NASA data; clearly labelled); measure detection by ear vs eye vs both | The injected location | Medium | [NEW IDEA] |
| Mapping direction | Mini magnitude-estimation test (rain: pitch vs density vs loudness) | Listener agreement | Low | [PLANNED] |
| Uncertainty legibility | Listeners rank confidence of regions | `dt_1km_data` / quality field | Medium | [PLANNED] |
| Accessibility | BLV adults: task success, time, verbal feedback; consent | Values | Medium | [PLANNED]; recruit early |
| Learning | Short pre/post quiz (adults) | Quiz key | Low | OPT |
| AI Q&A correctness | Benchmark of ~50 questions with code-computed answers | Values | Medium | CORE-OK |
| Satellite passes | Compare SGP4 pass times with published predictions | Published passes | Low | OPT |

**Honesty rules:** small-n results are reported as small-n. No claim that sound beats sight unless *our* data shows it.

---

## 14. Competitive differentiation map (no ranking; based on public blurbs only)

| Capability | Pundra repo | Stack Underflow | Sayqal | DeepSonic | Guide followers | 2023 finalist pattern | **Our engine** |
|---|---|---|---|---|---|---|---|
| EIC frames on screen, paired | No (motivation only) | Unknown | Unknown | Unknown (bathymetry) | No | n/a | **Yes** |
| Real physical values | Normalised series | Likely (GIBS/POWER) | Likely (series) | Likely | Yes (series) | Rarely (2/16) | **Yes** |
| Published fidelity (error vs source) | No | Unknown | Unknown | Unknown | No | No | **Yes (SST)** |
| Exploration by ear (keyboard/touch) | Unknown | Unknown | Unknown | "Interactive" | Unknown | Some (hover) | **Planned** |
| Human evidence (listeners, BLV) | No | Unknown | Unknown | Unknown | No | None reported | **Planned** |
| Culture / music identity | — | — | **Strong** | — | — | Arcobaleno (genre) | Optional (#22/#23) |
| Time depth | Series (1980–2025) | "Looking in time" | **45 years** | — | Decades (POWER) | — | 2.5-year SST archive + anomaly |
| AI | Template (AI Studio) | Unknown | — | ML | — | Some k-means | Grounded, verifiable uses only |
| Multi-agency | — | — | — | — | — | — | NASA + JAXA (+UK/EU) |

**Interpretation [INTERP]:** the strongest separation comes from the combination "frame-paired + verified + explorable + evidenced". Each part alone can be copied; the combination is hard to copy late.

---

## 15. The 30-second experience (three designs, unranked)

**Design 1: "Proof you can hear" (Architectures A + D + G)**
- **0–3 s:** Black screen; rain sound builds. Caption: "This is NASA data."
- **3–10 s:** The IMERG frame fades in; a cursor sweeps over Bangladesh; the rain rhythm follows the cursor.
- **10–20 s:** Split view. "The pixel colour says 12 mm/h. NASA's IMERG file says 11.4 mm/h." The truth panel shows per-track error (SST 0.85 °C; rain [D2 result]). Confidence is heard as clarity: a faint, blurred tone where MUR hasn't measured recently.
- **20–30 s:** A blind listener answers "where is it raining hardest?" by ear. Caption: "[X]% correct by ear in our study." End card: "Earth Information Jukebox: every sound traceable to NASA."

**Design 2: "The monsoon, as two agencies hear it" (E + H + F)**
- **0–10 s:** The monsoon time-lapse; rain percussion.
- **10–20 s:** Headphones icon: left ear NASA IMERG, right ear JAXA GSMaP. Where they disagree, you hear it.
- **20–30 s:** A GPM satellite passes and a new "note" arrives. Caption: "Hear the Earth, and the spacecraft that measured it."

**Design 3: "Play the planet" (B + I + N)**
- **0–10 s:** Kiosk or hyperwall view; a hand touches the ocean and the ocean temperature drone rises.
- **10–20 s:** A second hand adds fires; a third adds smoke (PM2.5) drifting downwind. Cause and effect across EIC areas.
- **20–30 s:** A game prompt: "Find the heatwave by ear." Truth panel in the corner.

**All three:** only real numbers from our tests appear on screen. Placeholders like [X] are filled only after the study.

---

## 16. User journeys on one engine

| User | First 60 seconds | Deeper use |
|---|---|---|
| First-time visitor | The gist sweep from their location, audio legend, one tap to switch tracks | Orchestra mixer |
| Scientist | Truth panel; provenance click-through; product duet | Uncertainty mode; download value grids |
| Student | Guided tutorial; "which ocean is warmer?" | Earth Detective cases |
| Child (Beginner/Youth) | "Guess by ear" game | Collect "Earth badges" (no personal data) |
| Blind / low-vision user | Screen-reader landing; keyboard gist → navigate → details; spoken summaries | Grounded Q&A by voice; daily audio bulletin |
| General public | Monsoon Watch or "today's Earth" playlist | Share a 60-second clip |

---

## 17. Story, game and culture notes (short)

**Story structures that come from real data [NEW IDEA]:**
- "Can you hear the monsoon arriving?" (IMERG time-lapse)
- "Where did NASA not look?" (uncertainty)
- "Two agencies, one storm" (duet)
- "The ocean remembers" (anomaly, then vs now)
- "Who measured this?" (provenance)

**Game mechanics that teach something real:**
- Prediction ("will rain reach Dhaka in the next frames?", checked against later frames).
- Classification (rain vs snow by timbre).
- Anomaly finding (the injected-hotspot test doubles as a game, clearly labelled as synthetic).

Avoid points-for-clicking.

**Culture:**
- Raga time theory associates ragas with times of day and seasons (Megh and Malhar with the monsoon; Basant and Bahar with spring). [VERIFIED as tradition — [Megh (Wikipedia)](https://en.wikipedia.org/wiki/Megh_(raga)); [Eos](https://eos.org/opinions/the-melodies-of-monsoons-weather-in-indian-classical-music)]
- **Use it to encode the frame's local season and time, not values.** Offer other systems as style skins (maqam, Western orchestration, electronic).
- Consult a musician from each tradition before shipping a skin. [ETHICS NOTE]

---

## 18. Full blueprint — "Verified Earth Jukebox" (hybrid of A + B + D + F + G, with E as the showcase story)

**A. Core concept.** An EIC companion that plays NASA's daily Earth visualizations as live sound computed from the exact frame on screen. Every sound is converted back to a physical value and checked against its NASA source. People can explore it by ear, hear how confident NASA is, and trace any sound back to the satellite that measured it.

**B. Central user experience.** Pick an EIC product (or several). A gist sweep starts from your location. Then explore with keyboard, touch or mouse; press for exact values; open the truth panel or provenance at any time.

**C. Scientific contribution.**
- C1 (verified frame-locked sonification): SST done, rain next.
- C2 (human evaluation): in October.
- C3 (live uncertainty): if the core works.

C4–C7 are optional extensions (Section 12).

**D. NASA data architecture.**
- SST (5101 ↔ MUR v4.1), rain (4285 ↔ IMERG), plus one or two of fires, PM2.5 or near-surface temperature after the checklist.
- The SVS API for metadata and alt text.
- GIBS colormaps for the three-way check.

**E. Partner data.** JAXA GSMaP (rain duet) and UK Met Office OSTIA (SST duet): optional, clearly labelled.

**F. Audio architecture.**
- Per track: value → mapping (exponential frequency for linear quantities; log value → density or pitch for rain).
- Timbre by EIC focus area.
- Confidence → clarity or loudness.
- Music mode vs precise mode.
- AudioWorklet synthesis; spec published in Erie-like JSON.

**G. Visual architecture.**
- The EIC frame, full width, with a synced cursor.
- Truth panel; mapping panel with audio legend; provenance drawer.
- Optional two-ear "duet" split.

**H. AI architecture.** Only where deterministic methods fall short:
1. Colorbar reading across many products: CV plus a vision model, every result verified by the truth test.
2. A natural-language question router: the LLM translates the question into a structured query; code computes the answer.
3. Optional phrasing of code-computed summaries.

AI never produces a number.

**I. Game layer.** Earth Detective and "guess by ear" run on the same engine; the study tasks double as game rounds (with consent).

**J. Story layer.** Monsoon Watch is the showcase; "Who measured this?" is the closing beat.

**K. Accessibility layer.**
- Screen-reader landing, keyboard map, live regions, voice commands.
- Spoken summaries in Bangla and English (text-to-speech).
- Touch-drag mode; tutorial.

**L. Validation.** Section 13, with pre-written thresholds.

**M. Provenance.** Pixel → value (inversion method + error) → source file (granule name, date) → mission and instrument → satellite pass (optional).

**N. Demo sequence.** Design 1 in Section 15.

**O. Build phases.**

| Phase | Dates | Contents |
|---|---|---|
| Prototype | by 1 Oct | #1–8, #25; SST verified; rain playing (unverified label) |
| Core | Oct wk 1–2 | D2 rain test; keyboard and summaries; truth panel; a third track via checklist |
| Advanced | Oct wk 3–4 | Listening study; uncertainty mode; provenance; the GIBS three-way check |
| Polish | Nov | 240-second video (1 Nov); statement re-spec (28 Oct); 30-second cut |

**P. Dependencies.**
- The inversion engine comes before every track.
- The truth test comes before every public claim.
- Keyboard navigation comes before the BLV study.
- A stable mapping comes before the study.
- The study comes before the optimisation (#33).

**Q. Risk register.**

| Risk | Type | Severity | Mitigation |
|---|---|---|---|
| Rain inversion fails (log scale, alpha blending) | Technical | Serious | Swap in the GEOS-FP temperature track; report honestly |
| 28 Oct statement pins specific EIC products or hardware | Scope | Moderate | Engine is product-agnostic; kiosk layout ready |
| EIC/SVS feed stalls (e.g. 5101 last updated 19 Sep) | Data | Moderate | Cache the latest frames; show frame date; offline mode |
| BLV recruitment in time | Validation | Serious | Start outreach now; sighted pilot first; small-n honesty |
| Claims outrun evidence (e.g. "ears detect better") | Credibility | Serious | Only report measured results |
| Too many features (feature soup) | UX | Moderate | One engine; experiences as modes; ship 3 tracks well |
| Cultural misuse | Ethics | Moderate | Consult musicians; culture shapes style only |
| AI hallucination | Trust | Moderate | Tool-call architecture; answer benchmark |
| GSMaP / OSTIA licensing and formats | Legal / technical | Minor | Registration and credit lines; optional feature |
| Video rule: no minors | Rules | Minor | Adults only on camera |

**R. Research gaps.** See Section 20.

---

## 19. Two alternative blueprints (shorter)

**Alt-1: "Monsoon Watch" (E + C + M + H).**
- Regional depth over global breadth.
- IMERG (+GSMaP) rain for South Asia, an Earth Detective case library of real rain events, and a daily Bangla/English audio bulletin.
- **Strength:** local impact, vivid story, multi-agency.
- **Trade-off:** narrower EIC coverage; depends on D2 passing.

**Alt-2: "EIC Exhibit Orchestra" (B + I + O + N).**
- Built for EIC venues: multi-touch kiosk or hyperwall, several visitors "play" EIC systems, spatial audio, kid mode.
- **Strength:** fits the EIC distribution model and the likely hardware language of the statement; very demoable.
- **Trade-off:** hardware can't be tested for real; validation is lighter unless the truth panel is kept.

---

## 20. Research gaps (next sweep)

1. The other EIC daily products: run the Check D checklist on 5113, 5151, 5147, 5544.
2. The GIBS layer IDs and colormap XML for MUR SST and IMERG, for the three-way check.
3. The MUR `analysis_error` variable name and meaning (the dataset page confirms `dt_1km_data` and `sst_anomaly`).
4. The IMERG quality-index variable in the half-hourly files, and how the SVS frame renders snow vs rain.
5. GSMaP_NOW 30-minute format and exact registration terms; OSTIA NRT latency.
6. A GitHub code-search sweep: "EIC" + "sonification", "svs.gsfc" in code, Tone.js + GIBS. Also Devpost / Space Apps 2024 Connected Earth finalists.
7. Browser support: AudioWorklet, the Vibration API (Android vs iOS), HRTF performance on low-end phones.
8. BLV organisations in Bangladesh for co-design and the study (ethics and consent).
9. Whether any audio-language model benchmark covers sonification (none found).
10. Whether the EIC has TEMPO or lightning frames.

---

## 21. Development direction (evidence and trade-offs, not a ranking)

**What the evidence supports now:**
- The "Verified Earth Jukebox" core (Section 18) is the only direction with our own measured evidence (SST 0.85 °C) and a clear gap in both the research and the competition (Sections 2 and 14).
- Everything else plugs into the same engine as a *mode*, so choosing the core doesn't close any door.

**Choices that still need a human decision:**
1. **Showcase story.** Monsoon (local, vivid, needs D2), ocean (verified already), or orchestra (breadth, exhibit-ready).
2. **Depth vs breadth.** Three verified tracks with a strong study, or six tracks with lighter validation.
3. **Which "next frontier" hook to feature.** Provenance and satellites (F), multi-agency duet (H), or uncertainty (G). Each is a different October workload; pick one, park the others.
4. **Culture layer.** Include a raga or other skin in October (with a consultant), or park it.

**Evidence that would change the direction:**
- D2 fails → rain becomes an unverified "context" track, and the showcase moves to the ocean or orchestra.
- The BLV study can't be organised → shift weight to the known-answer detection test and the three-way fidelity checks.
- The 28 Oct statement requires specific hardware or products → adopt Alt-2 elements.

---

## 22. Gamified layer (all games run on the same verified engine)

**Design rules.**
1. **Score = accuracy against real data.** Players earn points only for answers that match the values. No points for clicking.
2. **Every round ends with the truth.** Show the frame, the value, and the NASA source file. This is the learning loop.
3. **Playable by ear and keyboard.** Blind players get the same game.
4. **Rounds double as evidence.** With consent, anonymous answers feed the listening study (Section 13).
5. **Kids.** No personal data, no public leaderboard names, no minors in videos.

| Game | How it works | What it teaches | Data | Validation value | Class |
|---|---|---|---|---|---|
| **Warmer or Colder?** | Hear two ocean regions; pick the warmer one | Ocean heat patterns | SST 5101 (verified) | "Compare" task accuracy | **NOW** (easiest for 1 Oct) |
| **Guess the Place by Ear** | Hear a region's sound; tap where you think it is; score by distance | Climate zones, geography | SST, rain | "Identify" task | CORE-OK |
| **Will It Rain Here?** | Hear the last few 30-minute IMERG frames around a city; predict the next one | How rain systems move | IMERG 4285 | Checked automatically against the real next frame | CORE-OK (after D2) |
| **Earth Detective** | A case file of audio clues from a real event (e.g. a cyclone landfall, a marine heatwave); find where and when | Cause and effect across EIC areas | Several tracks | Case solved = correct place and time | CORE-OK |
| **Hotspot Hunt** | Find a **synthetic, clearly labelled** hotspot hidden in real data, by ear, by eye, or both | Detection by sound vs sight | SST + injected anomaly | Known-answer detection test | CORE-OK |
| **Two Agencies, One Storm** | Hear NASA IMERG in one ear and JAXA GSMaP in the other; find where they disagree | Measurement uncertainty | IMERG + GSMaP | Agreement with computed differences | OPT |
| **Catch the Satellite** | Predict when a GPM satellite passes over your region; hear it arrive | Orbits and observation | CelesTrak + satellite.js | Pass-time check | OPT |
| **Earth Jam** (multiplayer) | Each player controls one Earth system; team goal: "play the story of fire → smoke" | System interactions | Fires, PM2.5, wind | Cooperative task completion | OPT |
| **Ocean Thermometer** (young explorers) | Hold a key to "dip" into the ocean; guess warm or cold; collect badges | Basic ocean science | SST | Simple accuracy | CORE-OK |
