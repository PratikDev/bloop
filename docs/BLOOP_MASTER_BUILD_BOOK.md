# BLOOP: The Master Build Book

**NASA Space Apps Challenge 2026 · Challenge #14 "The Earth Information Jukebox" · Team PTSD (CUET, Chattogram)**
**Version:** 27 Oct 2026, 03:00 Asia/Dhaka. Written after data-readiness runs 1–6 and before the full challenge statement comes out on 28 Oct.
**App:** https://bloop-ptsd.vercel.app · **Repo:** `PratikDev/nasa-sac`

This book replaces the scattered documents:
- the v1 research blueprint (§0–26);
- the team build plan;
- the data catalogue;
- the 63-idea sonification bank;
- the run 1–6 findings;
- the video review;
- the L1 guides and the 3D ideas.

Every idea, data source, test result and creative concept from those documents is here, with its **current** status. Part 0 lists the corrections. Build from this file. The old files stay as history.

**What this book is not.** It does not predict judging. Nothing here guarantees an award. Where it ranks, the ranking is an internal heuristic: it weighs evidence, effort and fit to the rubric. The team decides.

---

## Contents

- **Part 0:** How to read this book; label key; what changed since earlier documents
- **Part 1:** Ground truth: the challenge, rules, score sheet, awards, deadlines
- **Part 2:** Where Bloop stands today (built, verified, broken)
- **Part 3:** The winning thesis: differentiation, competitors, rubric strategy
- **Part 4:** The verified data registry (every dataset tested, by EIC area), coverage matrices, the claim ledger
- **Part 5:** The engine: architecture, data contract, mapping rules, guardrails
- **Part 6:** Sonification idea bank: all 63 ideas plus every earlier concept, each with its current data status
- **Part 7:** 3D, spatial and physical ideas
- **Part 8:** The flagship experience: modes, journeys, accessibility, Bangla, kiosk
- **Part 9:** Validation and human evidence plan
- **Part 10:** Videos (240 s and 30 s), project page, submission
- **Part 11:** Build plan: tiers, lanes, day-by-day to 13–14 Nov
- **Part 12:** Risk register
- **Part 13:** Honesty rules, exact wording, credits, licences, AI disclosure
- **Part 14:** Open questions and the cheapest checks
- **Appendix A:** Test-by-test ledger (all 161 tests, latest result)
- **Appendix B:** Research and precedent library
- **Appendix C:** Keys, setup, how to rerun the tests
- **Appendix D:** Glossary

---

# PART 0: How to read this book

## 0.1 Evidence labels

| Label | Meaning |
|---|---|
| **[R1]…[R6]** | Measured by our own data-readiness run 1–6 (26–27 Oct 2026) |
| **[TR]** | Team-reported pipeline result from the build period (Sep–Oct), not re-measured in runs 1–6 |
| **[V]** | Verified against a primary or official source (link given) |
| **[PV]** | Partially verified (exists; key detail unconfirmed, or secondary source) |
| **[INF]** | Our inference from evidence |
| **[HYP]** | Hypothesis: needs a test |
| **[UNK]** | Unknown / not checked |
| **[NEW]** | Invented by us; no evidence yet |
| **◆** | 3D idea added when the list was rebuilt (all 18 originals were later recovered and merged) |

Effort: **S** < 1 day · **M** 1–3 days · **L** > 3 days.
Tiers: **V2** = in the 240-s Video 2 (**due 13 Nov, 6:30 PM**; feature freeze Mon 9 Nov) · **HK** = live demo, 30-s video and project page by the hackathon (13–14 Nov) · **RM** = roadmap / after judging · **PK** = parked (kept, not scheduled).

## 0.2 Corrections: what earlier documents say that is now wrong

| Earlier claim | Where it appeared | Current truth | Source |
|---|---|---|---|
| SST truth number "median error 0.85 °C" | Team build plan §4/§7/§16, v1 blueprint §0/§10/§15/§25, data contract | **0.31 °C** median (60 points), 0.32 °C on a newer frame, after the colour scale was recalibrated | [TR]; video review |
| "D2 rain test not yet run" | v1 blueprint §0, §10 | **Passed:** rain/no-rain 100%, median abs log10 error 0.103 (≈ within 27%), IMERG Late matched best, rain/snow phase 100% | [TR] team build plan §4 |
| "5176 may not be an anomaly product" | Team build plan §19 | It **is** the MUR SST anomaly (−4…+4 °C). It agrees with NOAA Coral Reef Watch in sign at **91%** of 1,101 points, Spearman 0.79, offset −0.31 °C, all 9 colorbar ticks calibrated | [R2][R3] |
| "Invert 5151 PM2.5 frames for the haze voice" | Ideas B7, E5; catalogue P1 | **Dropped.** Only 1% of pixels match the colour scale, and the frames are **137 days stale**. Use GEOS-CF / CAMS / ground values for sound; show the frame as a picture only, labelled | [R2][R3] |
| "5584 landslide frame stale since Jan 2026" | Catalogue | **Fresh** (0.17 d). The earlier reading was a script bug. The LHASA archive at GES DISC is the one that ended (Feb 2021) | [R2] |
| "SVS 5544 NDVI ~104 days old" | Build plan | Now **135 days** stale. Use the MODIS/VIIRS NDVI catalogue route or ORNL MODIS points | [R2] |
| "GEOS-CF v1 for 'now' air" | Catalogue | **v1 stores stopped in Jan 2026.** Use the v2 Zarr stores only. Never splice v1 and v2 | [R2] |
| "OPERA ArcGIS ImageServer for Aug 2024 floods" | Catalogue test 5 | Service now **404**. Read the OPERA granules directly | [R1][R2] |
| "SWOT Version C reach IDs" | Catalogue | Version C ended Apr 2025. Use **Version D**: works, reach 43499600141 swings 8.06 m | [R1][R3] |
| "xeno-canto API v2" | Catalogue | **Retired.** v3 needs `XC_API_KEY`. All 4 Bangladesh Doel recordings are CC BY-NC-SA | [R1][R3] |
| "NASA POWER excluded" | Build plan | Still **excluded for long-term rain/heat claims** (failed P1b). Its **solar** values agree with ERA5 (r 0.85, −0.44 kWh/m²/day), so a labelled solar voice is acceptable | [TR][R3] |
| "GRACE bass: 5th–95th percentile of each series" | Build plan §10 mapping | **Must change.** Per-series scaling hides the ~9× difference. Use one shared range of about −70…+35 cm for both regions. This is still unfixed in the deployed `mapping.json` | [R3–R4] A3 WARN |
| "SVS blocks all browser CORS" | Build plan T1 | The SVS API allows one named outside site (`tempo.multiverse.music`), so SVS *can* allow sites. It doesn't allow ours. Asking is possible; not a plan | [R1] |
| "Bloop's app returns 404 for data" | Run 1–2 findings | **Fixed:** all 14 files are served from `bloop-ptsd.vercel.app` | [R3] A1 PASS |
| "DONKI via DEMO_KEY" | Catalogue | DONKI returned **503 even with a real key**. Treat it as optional; use SWPC | [R2][R3][R4] |
| "Video 2 due 1 Nov" | Participants Guide, build plan, earlier versions of this book | **Video 2 (240 s) is due 13 Nov, 6:30 PM** (hackathon day 1). **The organizers confirmed this on 27 Oct**; there is no 1 Nov submission | Organizers, 27 Oct (user-reported) |
| "Suomi NPP fine" | All docs | **S-NPP science products stop on 2 Nov 2026, 13:00 UTC** (NOAA NESDIS). Switch every VIIRS-SNPP product to NOAA-20/21 | [V] [NESDIS notice](https://www.nesdis.noaa.gov/news/cessation-of-suomi-national-polar-orbiting-partnership-s-npp-data-users-onafter-november-01-2026); [Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/suomi-npp-observations-cease-november-2-2026) |
| "GEDI 4950 frame can be inverted" | J1 result | **No.** Its 127 files include 35 large images, all 16:9 (3840×2160) renders with a burned-in colorbar, and no flat 2:1 map. Use it as a visual; GEDI L3/L4B values drive the sound | [R6] L4 |

---
# PART 1: Ground truth (what we must satisfy)

## 1.1 The challenge, verbatim

> "NASA's Earth Information Center (EIC) produces stunning visualizations of our changing planet, but presenting Earth science through visualization alone limits who can reach it. We invite you to make this complex Earth science accessible, engaging, and multi-sensory by translating sight into sound. Your challenge is to build an "Earth Jukebox"—an interface, script, or application that pairs Earth Information Center (EIC) visual frames with dynamic sonifications generated in real time."

Tags: *Intermediate, Beginner/Youth* · *Arts & Multimedia, Earth Science, Software*. Theme: **"The Next Frontier"** [V].

**Clause-by-clause coverage.** Re-check every row on 28 Oct, when the full statement is published.

| Clause | What it literally asks | How Bloop answers it | Evidence we can show |
|---|---|---|---|
| "EIC visual frames" | Use the EIC visualizations themselves | Frames from the SVS EIC galleries play on screen. Sound comes from their pixels (5101, 4285, 5176; more under §4.2) | Frame inversion: SST 0.31 °C [TR]; rain ≈27% [TR]; anomaly 91% sign [R2] |
| "pairs … with" | Frame and sound belong together | Frame-locked cursor, time-lapse and scrubbing; every sound has a frame ID and time | Provenance drawer (feature B4) |
| "dynamic sonifications" | Sound changes with the data, not a fixed track | Web Audio synthesis from value grids; 9 EIC areas each have a voice (§4) | Engine checks I1–I4 [R2] |
| "generated in real time" | Computed live | Sound is synthesised live in the browser. Data is near-real-time; the frame time is always shown | Rain frames 0.2 d old, SST 0.8 d [R2]. **Deployed data is about a month old: refresh it (§2.3)** |
| "accessible" | People who can't use the visuals | Keyboard, speech, screen reader, explore without sight, Bangla, captions | iSonic/Umwelt/MAIDR design lineage; YPSA co-design (J6, planned) |
| "engaging" | People want to use it | Story mode, games, 3D turntable Earth, Bangladesh stories | Ear-test logger numbers (C6, planned) |
| "multi-sensory" | More than one sense | Sound + vision + text + speech; Android haptics (J5); tactile printed records (3D-4) | — |
| "translating sight into sound" | Faithful translation | Colour → value → sound, with measured error; "proof in unison" (C1) makes the error audible | I1: beat rate = \|f1−f2\| [R2] |

**2023–2025 lineage, as hypotheses about the 28 Oct statement** [V for the past statements; INF for 2026]:
- **2023:** "the audio must convey the data about as well as the visuals"; "at least one original sonification example".
- **2024:** show how the **nine EIC focus areas** interact; hardware targets such as 80-touchpoint kiosks, immersive rooms and a 7680×2160 hyperwall.
- **2025:** VR with EIC/SVS visuals, sonification, gaze and hand interaction, accessibility modes.

Bloop is designed so that any of these can be added in under a day: kiosk layout K3, 9-area orchestra, WebXR 3D-16.

## 1.2 Eligibility (Participants Guide) [V, project file]

Answer one official 2026 challenge (named on the project page) · public repository · **NASA open data** (others welcome on top) · event code open source · every team member registered with a role. **English subtitles are required on video demos.** **No recognisable names, voices or faces of anyone under 18.** Credit every third-party asset, template or generated content.

## 1.3 The Bangladesh score sheet (local judging) [V, Participants Guide]

| # | Criterion | Points | What it measures | Bloop's lever (detail in §3.4) |
|---|---|---|---|---|
| 1 | Impact | 1–20 | Scale/significance; reach | BLV access + Bangla + community-radio bulletin + EIC venues + Bangladesh climate stories |
| 2 | Creativity | 1–20 | Originality of idea **and execution** | Audible verification (C1), turntable Earth, river strings, Bengali value-safe layers |
| 3 | Validity | 1–20 | Scientific soundness, feasibility, usability | Measured errors, independent cross-checks, honest nulls, ear-test pilot |
| 4 | Relevance | 1–20 | Alignment; "how deeply NASA data sits at the core" | Literal frame-pairing; NASA-first, partner on top |
| 5 | Presentation | 1–20 | Clarity, storytelling, reach | 240-s structure, "close your eyes" hook, one-line story |
| 6 | Teamwork | 1–5 | Real collaboration | Four lanes visible in the repo and the video |
| 7 | User experience | 1–5 | 5 = anyone can use it | Extremes-first legend, 30-s warm-up, presets |
| 8 | NASA data usage | 1–5 | **5 = NASA open data plus other agency/third-party, clearly shown** | NASA core + JAXA/NOAA/Copernicus/ground, labelled per voice |
| 9–11 | Category named / repo open / project page complete | 0–1 each | — | Checklist §10.4 |
| — | Women participation bonus | +5% | One or more women members | Team composition (team to confirm) |

**Anchor scale for criteria 1–5:**
- **20 "Absolutely wow":** no one else could have imagined it.
- **10:** a unique idea and implementation, though a similar concept has been heard of.
- **5:** a public idea with a unique implementation.
- **1:** idea and implementation both public.

**Implication** [INF]: "sonify NASA data" alone sits at 1–5. The points come from the **combination** and from the **execution** (Part 3).

Relevance asks: "Is this NASA-data-first, or just NASA-data-added?"

## 1.4 Awards [V, Participants Guide]

**Local:**
- up to 2 winners;
- Innovation Space / People's Choice (optional);
- **Global nominations: 1 per 10 projects submitted.** Decided behind closed doors; no appeal.

**Global:** NASA experts shortlist about 30 Global Finalists and pick one winner per category. **Global judges see only the project page, headlined by the 30-second video.**

| Global category | Natural fit for Bloop [INF; not a prediction] |
|---|---|
| Global Connection | Strong (accessibility; the 2023 sound winner Arcobaleno won here) |
| Best Use of Data | Strong (verified frame inversion, multi-agency duets) |
| Art & Technology | Strong (sonification as craft + 3D) |
| Local Impact | Strong (Bangladesh stories, Bangla, radio) |
| Best Storytelling | Medium–strong (Story mode, Amphan, "hotter, not wetter") |
| Best Use of Science | Medium (validation, honest nulls) |
| Most Inspirational | Medium |
| Best Use of Technology / Galactic Impact / Best Mission Concept | Weaker fit |

Local judges tick the categories they nominate for. The tick is not a score. **Don't distort the project to chase a category.**

Bangladesh's global record [V, guide]: champions in 2018, 2021, 2022 and 2023 (Best Storytelling, Team Voyagers, Rajshahi); 2025 finalists included ExoVisionaries, **Chattogram**. In the last cycle the nine cities produced over 500 projects.

## 1.5 Deadlines (Asia/Dhaka unless stated)

| Date | What | Notes |
|---|---|---|
| ~~1 Oct, 11:59 PM~~ | Video 1 (prescreening) | Done |
| **28 Oct** | Full challenge statements + partner resources | Re-run the clause table (§1.1) and the partner list (§4.9) the same day |
| ~~1 Nov~~ | ~~Video 2~~ | **No submission on 1 Nov.** The organizers confirmed on 27 Oct that Video 2 is due 13 Nov |
| 2 Nov | Space Apps Connect opens (project pages) | **Also: S-NPP products stop, 13:00 UTC** |
| 13 Nov | Global Offers; Project Submission guides | Bangladesh hackathon day 1 |
| **13 Nov, 6:30 PM** | **Video 2 (240 s)**: team, every member named, problem and challenge, **solution + working demo**, **NASA data named out loud** | Confirmed by the organizers (27 Oct). YouTube link in the Google Form + file in the Local Lead's Drive. It falls on hackathon day 1, so **finish it before the event** (upload by 12 Nov) |
| **13–14 Nov** | Bangladesh hackathon (Fri–Sat) | Global window 14–15 Nov |
| **14 Nov, 12:00 PM** | **Video 3 (30 s)** + project page complete | The run of show says final upload at 09:00 on 14 Nov. Aim for 09:00 |
| 14 Nov, 11:00 | Local judging starts (240 Seconds of Glory) | — |
| 16 Nov | Local winners; nominations go to NASA | — |
| Dec / Jan 2027 | Global finalists / global winners | — |

**Rules conflict to settle in writing** [V conflict, red-team doc]: the official FAQ says teams may not begin work before the hackathon; the Local Lead permits pre-event work. Keep a dated work log. Ask the Chattogram Local Lead (Abhijit Bhowmik) for written confirmation.

---

# PART 2: Where Bloop stands today

## 2.1 What is built and deployed [TR; checked in the video review and runs R3–R6]

- **Modes:** Explore · Story · Then vs Now · বাংলা toggle · Explore without sound (captions) · mixer · sweep from Dhaka · 48-frame (24 h) storm time-lapse · keyboard (arrows; Enter speaks the value; H lists keys).
- **Tracks:** Ocean (SVS 5101 → MUR-checked), Rain/Snow (SVS 4285 → IMERG-checked, liquid vs frozen colorbars).
- **Then vs Now killer demo:** GISTEMP heat +1.37 °C; GPCP −9% / GPCC −12%; GRACE Bangladesh +0.83 → −5.82 cm, NW India +8.71 → −53.63 cm; the GRACE gap as silence.
- **Optional data (merged PRs):**
  - global history cube: GISTEMP/GPCP/GRACE, 42 places, confidence layer;
  - Bangladesh ensemble timeline;
  - GLOBE ground-vs-satellite duet.
- **Truth panel** (SST + rain wording), **Mapping panel**, **Provenance**.
- **Served files:** all 14 data files + `mapping.json` [R3] A1 PASS.
- **Unconfirmed:** whether "Describe mode" exists. Check with L3 before claiming it.

## 2.2 Verified pipeline numbers (the core)

| Check | Result | Status |
|---|---|---|
| SVS 5101 SST frame → °C vs MUR | **Median 0.31 °C** (60 points); newer frame 0.32 °C | [TR] |
| SVS 4285 rain frame → mm/h vs IMERG | Rain/no-rain agreement 100% (150 rain + 150 dry); median abs log10 error 0.103 (≈ within 27%); bias −0.103 (frame ~21% low); phase 100%; best match **IMERG Late**, frame time = start of the half-hour | [TR] D2 |
| SVS 5176 anomaly → °C vs NOAA CRW | 91% sign agreement (\|anomaly\| ≥ 0.5 °C, n = 1,101 of 1,500), Spearman 0.79, median offset −0.31 °C (\|·\| 0.46), ticks 9/9 | [R2][R3] |
| Engine: proof in unison | Beat rate = \|f1 − f2\| exactly (e.g. 28 °C, Δ0.31 → 7.46 Hz expected, 7.5 measured); 1 °C = 0.600 semitones, so 0.31 °C = 0.19 st | [R2] I1 |
| Engine: scrub | Pitch identical at 0.5×/1×/4× scrub | [R2] I2 |
| Engine: swara + meend | Settles on the exact value, max error 0.0000 cents over 200 values | [R2] I3 |
| Engine: shared water scale | Shared: BD falls 2.13 st, NW India 19.95 st (9.4×). Per-series: 13.3 vs 19.95 (1.5×), which hides the real difference. **On the real app data** (27 Oct build): per-series 3.46 vs 20.30 st (5.9×) → shared range 1.52 vs 14.25 st (**9.4×**). The shared range is now in `mapping.json` | [R2] I4 (synthetic) + build report |

## 2.3 What is broken or pending (team actions, ordered)

| # | Item | Owner | Fix | Then rerun |
|---|---|---|---|---|
| 1 | **Deployed data about a month old** (SST frame 31.5 d, rain 29.4 d) | L1 | `pipeline/run_all.py` → commit `public/data` → redeploy. Then a **daily GitHub Actions** job for the frame steps | `run(['A2'])` |
| 2 | **GRACE bass scaled per series** (`runtimeRange p5-p95`) | L2 | `mapping.json`: one fixed cm→Hz range for both regions, about **−70…+35 cm** (spans BD −30.6…+32.2, NW India −68.8…+25.6) | `run(['A3'])` |
| 3 | **S-NPP ends 2 Nov** | L1 | Switch Black Marble to VJ146 (NOAA-20), FIRMS to `VIIRS_NOAA21_NRT`/`VIIRS_NOAA20_NRT`, NDVI to the NOAA-20 equivalent. Check that SVS 5113 keeps updating on NOAA-21 | Rerun E5, E12, C5113, K4 after 2 Nov |
| 4 | Truth-panel plot still shows the old 0.85 °C version (hidden) | L1 | Redraw `truth/sst_compare.png` with the 0.31 °C data | Visual check |
| 5 | NASA API key appeared once in pasted output (run 3) | You | Regenerate at api.nasa.gov if that output was shared anywhere | — |
| 6 | Browser checks not yet run | L3 | Copy `bloop_browser_checks.html` to `public/`, open it on laptop Chrome, an Android phone and an iPhone; save the JSON | — |
| 7 | FFWC flood API | You | Email api.support@bwdb.gov.bd. The host was unreachable from Colab in R1–R2; it may be Bangladesh-only | H1 |
| 8 | US Embassy Dhaka PM2.5 Excel files | You | Download by hand from pasteur.epa.gov/uploads/10.23719/1528454/ (scripts get 403) | F16 |
| 9 | Fire-weather (5315) has no SVS archive | L1 | Run `run(['C5315'])` daily; it saves `fwi_archive/FWI_YYYYMMDD.png` | — |
| 10 | People | L4 | A Bengali musician to sign off raga/tala layers; a YPSA (Chattogram) co-design hour; ~10 adults for the ear-test pilot | §9 |

---
# PART 3: The winning thesis

## 3.1 The concept in one paragraph

**Bloop lets anyone hear exactly what NASA's Earth Information Center is showing, and trust it.**
- **The core loop.** We take the EIC frame on screen and turn each pixel's colour back into the physical value it encodes (°C, mm/h), using the frame's own colorbar. Live sound is generated from those values. We check them against NASA's source datasets and play the error back as sound.
- **One voice for every EIC area.** Each of the nine EIC areas gets a verified voice: ocean, rain, rivers, groundwater, air, fire, forests, light, sea level. Every voice is labelled "frame-paired" or "context".
- **Partner agencies on top.** JAXA, NOAA, Copernicus and Bangladesh ground monitors sit on top as clearly marked duets.
- **Who it serves.** Blind and low-vision people can explore the planet by keyboard and ear. Everyone else gets Bangladesh's story through a 3D jukebox Earth: Cyclone Amphan's cold scar, the Jamuna singing an 8-metre river song, groundwater falling under NW India, and Dhaka's air as heard by satellites, models and the ground.

**One-liners** (pick one and keep it everywhere):
- "Hear what NASA is showing, and trust what you hear." (current tagline)
- "Every sound is a NASA measurement. You can hear when it's wrong."
- "The Earth Information Jukebox that proves its own songs."

## 3.2 The differentiation stack

Any team can copy one layer. Copying the stack is hard, especially late [INF].

| Layer | What it is | Who else has it (public evidence) | Status |
|---|---|---|---|
| 1. Frame-paired | Sound comes from the exact EIC frame on screen (the literal ask) | No known competitor. The build guide's #14 page uses series (POWER/NDVI/FIRMS/GRACE) and never EIC frames | Built |
| 2. Value-verified | Colour → value with **measured error** vs NASA source | None of the competitors or 2023 finalists report this | 0.31 °C / ≈27% / 91% sign |
| 3. Verification you can hear | Frame tone and source tone in unison; beats = error (C1) | No precedent found | Engine proven (I1); UI to build |
| 4. Every EIC area has a verified voice | 9 areas, each backed by a tested route | Planet FM lists 8 themes as playlists, without a stated data source | §4: all 9 have ≥1 verified route |
| 5. Independent cross-checks, said out loud | NASA×JAXA r 0.95 (say "partly independent"); wells × GRACE r +0.93; ground vs 2 models | None | R4–R5 |
| 6. Honest nulls and gaps | "Not wetter" plays plainly; data gaps get a neutral texture | None | Built (C4 partly) |
| 7. Explorable by ear | iSonic-style keypad, gist sweep, speech, presets | GitHub prototype has good basic a11y (keyboard, contrast, aria-live) | Built (basic) |
| 8. Bangladesh-specific and Bengali | Amphan, Jamuna, Sundarbans, Dhaka air; Megh drone, tala clock, meend residual (value-safe) | Sayqal does Uzbek maqom (culture shaping values is the risk) | Partly built (Bangla UI) |
| 9. 3D jukebox world | Turntable Earth, record carousel, playable delta | Unknown | To build (Part 7) |
| 10. Human evidence | Ear-test pilot with real counts; BLV co-design | None in hackathon sonification | Planned (Part 9) |

**What is NOT new. Never claim these:**
- turning map colours back into values (mcgibs, `unmap`, Poco et al. 2018, arXiv 2507.20632);
- sonification itself; image-to-sound; spectrogram/inverse-FFT sonification (STRAUSS Spectraliser; 2023 finalist Cinta);
- deviation-from-normal mapping (HadCRUT3 panning; USPTO 9918679);
- spatial/geographic sonification (iSonic, HadCRUT panning);
- uncertainty sonification (Fisher 1994; Bearman 2013; Ballatore 2018);
- GISTEMP-to-pitch (Crawford 2013);
- a Space Apps sonification for blind users (Arcobaleno, 2023 Global Connection).

**Stay with the combination:** EIC frame → value → measured error → audible proof → live sound.

## 3.3 Competitor landscape (public evidence only; no predictions about teams)

| Team / artefact | What they show | Strength to absorb | Weakness (status) | How Bloop absorbs it | Bloop IDs |
|---|---|---|---|---|---|
| **Planet FM (Space Tunes; 6 members)** (transcript) | City search; Google/Facebook/Outlook sign-in; 8 themed playlists per city; Dhaka AQI line 2000–2026 with scrolling description; crowdsourced photos | Radio metaphor; city entry; theme coverage; living-dataset idea | No source named for the AQI line. No NASA product gives *observed* daily Dhaka PM2.5 back to 2000 [INF]. Themes are not data. Sign-in adds friction | Station dial where each station is a verified dataset; three honest air layers + ground; GLOBE + listen-and-report instead of unflagged photos; no sign-in | I1, E5, B7, F5, L2, J4, L1 |
| **Earth 616** (transcript) | GISTEMP v4 annual 1880–2025 → pitch (2015: +0.90 °C → ≈733.3 Hz); data-quality check (146 records); fixed range; "unified Earth state" feeding visualisation, sound and AI explanation; "what am I hearing?"; MVP not finished | Fixed range; data-quality talk; shared state; explanation need | One global series, no frames, not spatial; Crawford 2013 pattern; AI narration risks invented numbers | 20-s credited GISTEMP prologue (D2) → dive into frame-paired Dhaka; deterministic captions (A2); "check the AI by ear" | D2, A2, AI-1 |
| **GitHub "Earth Jukebox" (`jaherunhasanrimon/...`)** | 146 GISTEMP values; −0.5…+1.3 °C → 11-step C-major pentatonic + 400–4000 Hz low-pass; 4 years/s; keyboard, high contrast, aria-live | Solid a11y; pleasant | Many-to-one quantisation; "verified" unexplained; no frames | Swara + meend residual (exact pitch recovered); iSonic nav + presets; show *how* it's verified | H2, J1, J2, C1 |
| **Pundra University repo "The-Earth-Information-Jukebox"** | MODIS, GISTEMP, OCO-2, GRACE, SMAP series → normalised → Web Audio; EIC only as motivation | Many series | Normalised (loses units); no frames | "Your location" context layers, units kept | Context layer |
| **Stack Underflow** (blurb) | TEMPO, POWER, GIBS; "looking in time" | GIBS idea | TEMPO doesn't cover Bangladesh; POWER fails long-term checks here | GIBS colormap as a second decoding path | G7, K15 |
| **Sayqal** (blurb) | 45 years of change in Uzbek maqom + doyra; Tone.js | Cultural identity; time depth | Risk: cultural scale bends values | Bengali layers only where values can't move (H1–H6) | H-family |
| **DeepSonic** (blurb) | Bathymetry → interactive sound; ML | Interactivity | Unknown | Spatial sound terrain (3D-7) | — |
| **Planet Buddy** (blurb) | Children + storytelling | Youth tag | Unclear | Young Explorer games; lesson pack | N, K4 |
| **AstroSonix pattern** (2023, Poland) | LLM infers image "emotion" → generated music; 6th of 71 locally | Phone-friendly delight | Weak data link | Emotion through atmosphere and timbre on value-locked layers | A3, H1, B4 |
| **Arcobaleno (2023 Global Connection winner)** | Images → sound for visually impaired people; documented method; radial scan; genre choice | The award went to *who it served* | Colours, not values; mapping details not readable | Values, verification, BLV co-design | M1, J-family |
| **2023 finalists** (Area Six, Astral Arias, BlindX, SoundJourney/A Ordem, Cinta) | Real IRSA catalogue values with quality flags, per-band timbre, spatial audio, k-means (Area Six); CRISM hypercube, hover grid + UWB walk-through (Astral Arias); background + object pulses (BlindX); 7×7 grid (SoundJourney); spectrogram images (Cinta) | Per-band timbre; spatial; installation; grid for kids | Mostly pixel/brightness mappings; none reported blind-user tests | §7 borrow table | — |
| **SongSAT (2018 winner), Soundiverse (2018 nominee)** | Satellite imagery → music | Shows Earth imagery music can win | No values | Orchestra B | — |
| **Build-guide followers** (Bangladesh) | POWER/NDVI/FIRMS/GRACE voices; exponential pitch; visible mapping | Mapping maths | No EIC frames; POWER unreliable here | We use the same maths on EIC tracks | — |

**Structural risk** [V, red-team doc A9]: the strongest competitor is usually Track A done extremely well: a musician-led team making moving sonifications with polished UX. Craft is half the deliverable in #14. **Bloop must look and sound beautiful, not just be right** (Parts 7 and 8).

## 3.4 Rubric strategy: how each criterion gets its maximum

| Criterion | What earns the top band | Concrete Bloop moves |
|---|---|---|
| Impact (20) | Major problem, transformative, path to scale, inspires adoption | Blindness affects 1.0% of Bangladeshis aged 40+ (IAPB) [V]; community radio ran 176 h of Mora programming [V]; CPP has 76,000 volunteers [V]. Routes: K1 daily Bangla bulletin (radio/IVR), K3 EIC kiosk, K4 lesson pack, J6 YPSA. **State the reach path, not reach numbers we don't have** |
| Creativity (20) | "I could not have imagined it" | C1 proof in unison; turntable Earth + record carousel; Jamuna river string; Amphan cold scar; tactile records; Megh drone with meend landing exactly. **Execution matters as much as the idea** |
| Validity (20) | Sound science, feasible, usable | Truth panel numbers; independence stated; honest null (C4); shared scales; ear-test pilot counts; nothing claimed beyond tests |
| Relevance (20) | Literal fit; NASA at the core | Frame-paired (literal); 9 EIC areas; all NASA voices first, partners labelled |
| Presentation (20) | Clear, structured, story, broad reach | WHO/WHY/WHAT/HOW; "close your eyes" hook; one-line story "hotter, not wetter, and the water underground is falling"; English subtitles |
| Teamwork (5) | Visible collaboration | Four lanes named in the video; commit history across members |
| UX (5) | Anyone can use it | 8-s extremes legend (C2), 30-s warm-up, Listen/Analyze presets, big readout |
| NASA data usage (5) | NASA + other agency, clearly shown | Per-voice provenance badges: NASA / JAXA / NOAA / Copernicus / ground |

## 3.5 Opportunity gaps existing work leaves open (v1 §2, still true) [INF]

1. **Nobody verifies that the sound matches the data.** Mappings are described, never measured.
2. **Frame pairing is rare.** Projects sonify either images (no values) or series (no frames).
3. **Human evidence is rare in hackathon sonification.** It is common in research (iSonic, MAIDR, Umwelt).
4. **NASA's own uncertainty fields are never applied live.** MUR has `dt_1km_data` and `analysis_error` [R1 confirmed present]; IMERG has quality indices.
5. **Multi-agency disagreement is invisible.** IMERG vs GSMaP; MUR vs OSTIA vs AMSR2; GHRSST GMPE ensemble spread.
6. **Provenance ("who measured this?") is shown only as art** (EIC HQ's "Earth Pulse" LED sculpture), never as data you can explore.
7. **EIC venues already use sound** (chirping birds at the entrance) **but not data sound.** NASA's launch description lists no non-visual access features [V]. Say exactly that; don't say "EIC has no audio".
8. **Cultural expression without falsification.** Raga time theory encodes time and season, not values.
9. **Detection claims are unproven.** Tucker Brown 2022 found no added benefit from sound; Diaz-Merced 2013 found benefit only with a synchronised visual cursor. A small, honest, known-answer test is itself a contribution.
10. **New since v1:** no Bangladesh early-warning channel uses non-speech sonification, and no Bangladesh-made climate data sonification was found [weak evidence: limited search].

## 3.6 Borrow → improve → combine (v1 §7, updated)

| Existing work | Borrow | Improve | Combine with |
|---|---|---|---|
| Arcobaleno | Documented rules, reading order, style choice, human purpose | Values not colours; live; validated; blind-user tests | A + D architectures, J2 presets |
| Area Six | Quality filtering; timbre per source; spatial panning; k-means; upload your own data | Live EIC frames + truth tests | Orchestra B, HRTF #28 |
| Astral Arias | Hover exploration; UWB walk-through installation | Keyboard and touch for blind users; kiosk mode | D + I, 3D-17 |
| BlindX | Background soundstage + object pulses | Real values; pulses = extremes/anomalies | #25 pings + G uncertainty |
| SoundJourney / A Ordem | 7×7 grid: rows → notes, columns → pan, brightness → volume | Physical units; legend | Young Explorer |
| SongSAT / Soundiverse | Earth imagery music can win | Verified values; interaction | Orchestra |
| Pundra repo | Data voices | Frames + validation | Context layer |
| Build guide #14 | Exponential pitch formula; voice roles | Fill voices with EIC tracks | Orchestra |
| Chandra "A Universe of Sound" / SYSTEM Sounds | One instrument per layer; spatial scan with cursor; "what to listen for" caption; BLV consultant (Christine Malec) | Earth, live, verified | Audio legend, A2 captions |
| EIC "Earth Pulse" sculpture | Making observations visible | Audible and data-linked | Satellite orrery 3D-5, X2 |
| iSonic / MAIDR / Umwelt / AltGeoViz | Gist → navigate → details; sound for trends + text for values; mode keys; 3×3 summaries | Applied to live EO frames | J1, J2, B5/B6 summaries |
| mcgibs / GIBS colormaps | Exact values from GIBS tiles | Three-way agreement: EIC frame, GIBS, source file | C1, G7 |
| Crawford (cello 2013, quartet 2015) | Published step; one instrument per latitude band on a **shared** step | Spatial, frame-paired | D1, D2, M2 |
| Loud Numbers (Geere & Quick) | Start with time series; keep it simple; **test extremes first**; atmosphere carries emotion; hotter = louder + rougher | Value-locked | C2, B7 |
| Krause | Biophony / geophony / anthrophony; same place, two Junes | Satellite stems | D3 |
| Paterson (melting ice records) | The medium enacts the data | Labelled interpretation mode | M3, 3D-4 |
| No Man's Sky "Pulse" (Weir) | Rules choose curated fragments | Rules tied to data states, fixed gain | A3 |
| Brian Foo "Two Trains" | Instrument count follows data | Satellite frames | B2, E7 |
| LightSound | Timbre switches at regimes | Ocean heat regimes | B4 |
| Pulse oximetry study | Continuous mapping + an extra range cue beats an alarm (100% in 3.3 s vs 73.2% in 27.4 s) | Applied to SST regimes | B4, F3 |
| SOHO "Sounds of the Sun" / Chandra Perseus | Real cycles sped up (42,000×; +57–58 octaves) | Earth rain audification | G1, G2 |

---
# PART 4: The verified data registry

All values were measured in our runs unless labelled otherwise. "Age" is the newest-data age at test time (25–27 Oct 2026).

## 4.1 Access routes (how data gets into Bloop)

| Route | What it serves | Auth | Browser-callable (CORS) | Use in Bloop | Tested |
|---|---|---|---|---|---|
| **SVS API + frame folders** (`svs.gsfc.nasa.gov/api/<id>`) | EIC frames, colorbars, metadata, alt text | None | **No** for our origin (API allows only `tempo.multiverse.music`) | Pipeline downloads frames → inverts → same-origin JSON/bin | B0–B5584, J0 [R2–R3] |
| **CMR / Earthdata Search** | Catalogue of every NASA collection; newest granule; bbox coverage | None for search | Yes | Freshness monitor, granule discovery | D01–D43 [R2–R3] |
| **earthaccess** (Earthdata Login) | Granule download/open (PO.DAAC, GES DISC, LP DAAC, NSIDC, ORNL, LAADS, OB.DAAC, ASDC, SEDAC, GHRC) | Earthdata Login; approve **NASA GESDISC DATA ARCHIVE** | n/a (pipeline) | All E/K/L value tests | [R1–R6] |
| **GIBS WMTS + colormap XML** | Map tiles plus a `sourceValue` per colour | None | **Yes: `ACAO *` on tiles** [R1]. Canvas pixel read still needs the browser check | Second decoding path (three-way check); browser-side value layers | G7: MUR25 216 entries, 100% of tile pixels decode [R1–R2]; K15 by area [R3–R4] |
| **Worldview Snapshots API** | Rendered true-colour/layer images for a date and bbox | None | Yes (`ACAO *`) | Story stills (e.g. 21 Aug 2024 flood) | K14 PASS: 41,661-byte JPEG [R3] |
| **Giovanni** | No-download maps/time series | Web UI open; API 403 | No | Manual exploration only | K18 [R3] |
| **FIRMS API** | Active fire points, country counts | `FIRMS_MAP_KEY` (5,000 transactions / 10 min) | Key in URL, so pipeline only | Fire Geiger, counts | E12, K4, C5113 [R2–R3] |
| **VEDA / U.S. GHG Center STAC + TiTiler** (`/cog/point/{lon},{lat}?url=`) | EIC dashboard COGs: NO2, night lights, CO2/CH4 fluxes… | None. **Raw S3 buckets return 403; use the raster API** | Likely (not browser-tested) | Point values for air/GHG/energy voices | G8: VEDA 247, GHG 37 collections; K16 VEDA **6/8** and K5 GHG **3/6** collections returned Bangladesh values [R4] |
| **GEOS-CF public Zarr (S3)** | GMAO model: PM2.5, O3, NO2, CO, T, wind; analysis + 5-day forecast | None | Unknown | "Now" air voice (labelled model) | G2 [R1–R3]; v1 stopped Jan 2026, use **v2** |
| **JAXA Earth API (Python/JS)** | GSMaP daily, AMSR2, SGLI | None, no count limit | JS library designed for the browser | NASA × JAXA duet | F1 [R2]; K10 r 0.95 [R5] |
| **Open-Meteo (wrapper)** | CAMS air quality, GloFAS discharge, ERA5 | None (<10k/day, non-commercial, CC BY 4.0) | **Yes (`*`)** | Quick partner voices; always show ECMWF/Copernicus provenance | F5 [R1–R2] |
| **Copernicus CDS/ADS/EWDS** | ERA5, CAMS, GloFAS (official) | Keys + licence acceptance | No | Optional; F5 covers all three keyless | F6–F8 SKIP (no keys) |
| **NOAA ERDDAP** | Coral Reef Watch, OISST | None | Unknown | Coral heat, SST triad, 5176 check | F2, F3, C5176 [R1–R3] |
| **Hydrocron (PO.DAAC)** | SWOT reach/node time series | None needed in our runs | **Yes (`*`)** [R3] | River notes | E6 [R3] |
| **ORNL MODIS web service** | MODIS/VIIRS land products at points | None | **Yes** (echoes origin) | NDVI points | E10 [R1–R2] |
| **OpenAQ v3** | Ground PM2.5 (DoE CAMS stations etc.) | `OPENAQ_API_KEY` (keep server-side) | n/a | Ground truth voice | F14, K2 [R2–R5] |
| **NOAA/AWS open buckets** | Himawari-9, GK2A (10-min full disk), hydrophones | None | n/a | Cloud layer, hydrophone bed | F4, F19 [R1–R2] |
| **USGS, EONET, SWPC, CelesTrak** | Quakes, events, solar wind, orbits | None (CelesTrak: stop on any non-200) | **Yes (`*`)** | Live event layer, satellite orrery | G1, G3, G4, G6 [R1–R2] |

**Architecture rule** [INF, §5]: anything without proven browser CORS or that needs a key goes through the pipeline/cron and is served as same-origin JSON. Describe satellite data as "latest available", not "real-time".

## 4.2 EIC frames: every item we know about

### 4.2.1 SVS Daily Visualizations gallery (23 items; R2 confirmed 23, no new ones, none missing)

| SVS | Product | Newest age [R2] | Colorbars | Inversion status | Role in Bloop |
|---|---|---|---|---|---|
| **5101** | SST, MUR, near real time (4096×2048 EXR, no-dates variant) | **0.81 d** | 7 | **Verified 0.31 °C** [TR] | Core ocean voice |
| **4285** | IMERG near-real-time precipitation (3600×1800 `flatalpha` PNG, every 30 min) | **0.23 d** | 4 (rain + snow, black/white) | **Verified ≈27%, phase 100%** [TR] | Core rain/snow voice + time-lapse |
| **5176** | SST anomaly, MUR (−4…+4 °C; EXR colorbar) | **3.3 d** | 2 | **Verified vs CRW: 91% sign, ρ 0.79, −0.31 °C** [R2–R3] | Normal tone (B3), heat regimes (B4), coral (F3) |
| **5113** | VIIRS active fires, SNPP + NOAA-21, 5-day FRP window | **0.9 d** | 0 | Tile Spearman 0.60–0.62 vs FIRMS (18k hot px vs 550k FIRMS points) [R2–R3]: moderate | Fire clicks from FIRMS; frame as picture. **Check it keeps updating after S-NPP ends (2 Nov)** |
| **5315** | Experimental Fire Weather Index (GISS GlobalFWI), 1-day forecast, **Robinson** projection | **0.06 d** | In-image legend (6 classes) | **6 classes decode distinctly; 93% of coloured pixels decode**; all Bangladesh points "very low" (25–26 Oct) [R1–R2] | Fire-weather chord (B8). No SVS archive: **we archive it daily** |
| **5584** | Global landslide exposure (LHASA) | **0.17 d** (was a script bug, not stale) | 3 categories, no numeric bar | Categorical | Threshold rumble (E1 landslide movement) |
| **5099** | Polar sea ice, two-year history | **0.93 d** | 0 | Globe views: hard to invert | Cryosphere visual; values from NSIDC v4 |
| **5120** | GOES-East/West true colour, last 5 days | **0.1 d** | 0 | n/a (imagery) | Americas only: Bangladesh out of view [INF]. Global-contrast texture only |
| 5147 | GEOS-FP near-surface temperature (2048×1024, burned-in labels) | Undated by listing (page updated 26 Oct) | 2 | R3: 100% of points match the colour scale, **Spearman 0.68** vs GEOS-CF (wrong model time). R4 retried at the frame's time: number in the run-4 report | Display + "model" label; values from GEOS-CF |
| 5148 | GEOS-FP near-surface wind | Undated | — | R3: 69% match, **Spearman 0.40** (weak) | **Don't invert yet** |
| 5149 | GEOS-FP precipitation and clouds | Undated | — | Not tested | Context visual |
| 5150 | GEOS-FP near-surface humidity (2 weeks) | — | — | **MP4 only + 14 PNG stills**; frames need extraction from the MP4 [R2] | Low priority |
| 5151 | GEOS-CF PM2.5 | **137 d stale** | 2 | **1% of pixels match the scale: drop inversion** [R3] | Picture only; values from GEOS-CF v2 / CAMS / ground |
| 5152 / 5153 / 5154 | GEOS-CF O3 / CO / NOx | **137 d stale** | 2 each | Not tried | Picture only |
| 5544 | NDVI, SNPP VIIRS NRT (8640×4320) | **135 d stale** | 1 | n/a | Use the MOD13Q1/VNP13A1 catalogue route or ORNL points |
| 4897 | Seasonal IMERG variation (official IMERG daily climatology) | Undated | — | Checklist pending | Anomaly Choir baseline for rain (C4/H1) |
| 5046 / 5064 | Arctic / Antarctic sea ice by year | **1,305 d stale** | 0 | — | Archive visual only |
| 5067 | Earth Observing Fleet – Now (updated every 10 min) | Undated by listing | — | n/a | Visual for the satellite orrery (3D-5) + CelesTrak |
| 5072 | Atlantic hurricane wind plots | — | — | Charts, not maps | Not used |
| 5577 | SDO Sun This Week | Undated | — | n/a | Space-weather opener (X1) |

### 4.2.2 The wider EIC gallery (J0) [R3]

The EIC gallery has 6 dashboard galleries, 2 video galleries, 6 EIC videos, 9 beauty pieces and the daily gallery: **72 items in all, 11 with frames/EXR/TIFF plus a colorbar.** The full list is in `samples/J0_eic_inventory.csv`.
- **Dashboard galleries:** Earth Now, Climate Vital Signs, Greenhouse Gases, CO2 Sources and Sinks, Air Quality, Wildland Fires.
- **Video galleries:** Hurricanes, Agriculture.
- **EIC videos:** biodiversity, fire, greenhouse gases, methane, Jane Goodall habitat, coastal resilience.

| EIC area | Items | Frame-pairable (J0) |
|---|---|---|
| Air quality | 8 | 4 |
| Greenhouse gases | 16 | 2 |
| Disasters | 9 | 1 |
| Water resources | 8 | 1 |
| Biodiversity | 3 | 1 (= 4950, **now ruled out** by L4 [R6]) |
| Agriculture | 4 | 1 |
| Sea level | 8 | 0 |
| Wildfires | 5 | 0 |
| Energy | 1 | 0 |
| Other | 15 | 2 |

**Beauty pieces** (J1 [R3], L4 [R6]):

| SVS | Piece | Frame-pairable? | Use |
|---|---|---|---|
| 4950 | GEDI forest height | **No.** 16:9 3840×2160 renders with a burned-in colorbar (folders `GEDI_global_w_colorbar`, `GEDI_CA_w_colorbar`, …); 127 files, 35 large images, 2 colorbars, 0 flat 2:1 maps | Visual; sound from GEDI L3/L4B values (L2). **Optional test:** crop the global 16:9 render if a flat map sits inside it |
| 5011 | ISS lightning 2017–2023 | No | Visual; sound from the LIS/OTD climatology (E16) |
| 5313 | Night lights change 2012–2023 | No | Visual; sound from Black Marble (E5) |
| 3912, 5425 | Ocean currents | Not checked as frames | Visual |
| 5196 | CO2 | Not checked | Visual; Mauna Loa / OCO-2 voice |
| 5533 | Air-quality model run | Not checked | Visual |

Also: SVS 5011 page (ISS-LIS), SVS 14983 "Cosmic Echoes" (Landsat crop data in audio; a precedent), and SVS 5600, a long SST visualization: candidate for A4 "pre-cyclone SST then vs now" if it passes the checklist.

## 4.3 Registry by EIC area (every dataset tested, with its number)

### 4.3.1 Sea level, ocean and coast

| Dataset | Route | Age / record | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **MUR SST v4.1** (`MUR-JPL-L4-GLOB-v4.1`) | earthaccess (PO.DAAC) | 1.5–2 d [R1–R2] | Has `analysed_sst`, `dt_1km_data`, `sst_anomaly`, `analysis_error` [R1]. Bay of Bengal spans **1.12–1.16 °C** across 4 test points = **0.7 semitones** on the global scale [R1–R2] | 5101 truth, C1, C5, J3 | The global −5…35 °C scale makes the Bay nearly inaudible: **use J3 zoom** |
| **SVS 5101 / 5176 frames** | Pipeline | See 4.2 | 0.31 °C / 91% sign | Core | Show the CRW offset |
| **NOAA Coral Reef Watch** (SSTA, DHW 5 km) | ERDDAP | Daily | 5176 check above. **St Martin's Island DHW: 68/81 valid pixels; 1.4–2.1 °C-weeks (15 Oct) → 3.2–4.0 (24 Oct; e.g. 3.99, 3.23)** [R1–R2] | F3 coral story, B3 | CRW alert levels start around 4 °C-weeks [open: check the CRW threshold page before quoting] |
| **OSTIA** (UK Met Office; `OSTIA-UKMO-L4-GLOB-v2.0`) | PO.DAAC | 0.33 d | 30.10 °C vs MUR 29.76 °C at the test point [R1] | F2 triad | Shares IR inputs with MUR |
| **NOAA OISST v2.1** | ERDDAP | ~2-week lag | 29.98 °C (10 Oct, 20.125 N 89.125 E) [R2] | F2 triad | Lagged |
| **AMSR2 SST** (JAXA instrument; `AMSR2-REMSS-L3U_RT-v8.2`) | PO.DAAC (REMSS) | 7.6 d | 31.39 °C (17 Oct) vs MUR 30.18 °C (22 Oct) [R3] | F2 triad (the most independent voice: microwave) | Not like-for-like: 5 days apart, and **skin vs foundation** temperature |
| JAXA SGLI SST (`JAXA.G-Portal_GCOM-C.SGLI_standard.L3-SST.daytime.v3_global_daily`) | JAXA STAC | — | STAC 200 [R2] | Optional triad voice | Catalogue resolution conflict |
| **NASA-SSH GMSL indicator** | PO.DAAC | File to 19 Oct 2026 (1,752 rows) | Last value **11.58** (2026.78) [R3]; run-4 rate ≈0.34 cm/yr (as reported) | D5 sea-level tone | [open] Read the header for units and reference period before showing a number. JPL's published 2024 rise: 0.59 cm/yr vs 0.43 expected [V] |
| **PSMSL tide gauges** | PSMSL | Hiron Point 1983–2003 (RLR, n 249); Cox's Bazar 1978–2000 (n 261); Chittagong 1983–1992 (metric, "not research quality"); station 416: 1937–1991 [R1–R2] | No present-day local gauge | D5 "silent after 2003" voice | Altimetry excludes delta subsidence |
| **SMAP sea-surface salinity** (JPL 8-day V5) | PO.DAAC | 4.8 d | Northern Bay **15.8 psu (Oct 2025) vs 21.8 psu (Apr 2026)**: 6 psu fresher after the monsoon [R1–R2] | E6 sweet-water plume | Fresh = higher pitch is a design choice: test it |
| **PACE OCI chlorophyll** (L3M BGC NRT; 8-day composite after fix) | OB.DAAC; **GIBS layer decodes** | 1.3 d | R3: empty box (latitude-order bug); R4 reran with fix and 8-day composites (value in run-4 report) | Ocean colour voice; spectrum-to-timbre (PK) | Case-2 waters bias chlorophyll |
| **CYGNSS L2 winds** | PO.DAAC | 5.3 d | Listed [R2] | Cyclone wind texture | Number of active satellites unknown |
| **Cyclone cold wake (MUR + IBTrACS)** | Both | Amphan, May 2020 | **Mean −2.79 °C, strongest −3.92 °C over 12 track points (3 days before vs 3 after)** [R3] K11 | B5, 3D-2 Amphan cold scar | Two dates, not a climatology; event ≠ trend |
| **IBTrACS v04r01 (NI)** | NCEI | 62,864 rows | Recent Bay storms: Dana, Fengal, Montha, Ditwah, Kajiki, Bualoi, Senyar, Shakhti [R1–R2] | I4 music-box year, B5 | Recent storms provisional |
| **EONET** | NASA | Live | Tropical Cyclone **Arnab, 25 Oct 2026** among 367 events in the box [R3] | Event chimes | [open] Check where Arnab is before using it. Not a precise positional source |

### 4.3.2 Air quality

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **OpenAQ v3 ground PM2.5** (DoE CAMS network etc.) | API (key) | Live | 15 Dhaka locations, 0 in Chattogram [R2]; 26 sensors [R3]; **11 stations ≤ 6 h old: median 72.2 µg/m³** [R5] | Ground voice (truth layer) | Station QA varies; DoE data "unvalidated at publication" |
| **CAMS** (Copernicus, via Open-Meteo) | Keyless | Hourly | **127.1 µg/m³** at the K2 time [R5]; earlier snapshots 26–51 [R1], 32–36 [R2] | Partner model voice | **CAMS assimilates MODIS AOD**, so it is not independent of NASA |
| **GEOS-CF v2** (analysis / forecast Zarr) | S3 | Daily runs | **50.4 µg/m³** (analysis, 25 Oct 08:30) at the K2 time [R5]; 111.7 (ana, 24 Oct) [R2]; 105.3 ana / 54.3 fcst [R3]; v1: 232.6–248.8 µg/m³ but **stopped Jan 2026** | NASA "now/forecast" voice | Model. Ratios at K2: CAMS/ground **1.76**, GEOS/ground **0.70** |
| **MERRA-2 aerosols** (M2T1NXAER; PM2.5 = DUST25 + OC + BC + SS25 + 1.375·SO4) | GES DISC | ~24 d lag | Dhaka **16.1 µg/m³ (26 Aug)** [R1], **22.8 (27 Aug)** [R2]: monsoon low | E5 backbone (2000→) | No nitrate; biased low in South Asia; GES DISC: "shouldn't be used to validate other products" |
| **ACAG satellite PM2.5** (V6.GL.02.04 etc.) | WUSTL Box (by hand) | Monthly 1998–2023 | 6 versions listed, 25 download links [R2] | E5 anchor (slow bass) | CC BY 4.0 |
| **AERONET** Dhaka University (2012) + Bhola (2013) | AERONET | Live | Both active to 26 Oct 2026: 255 and 320 L1.5 days in ~22 months [R1–R2] | Ground AOD voice | Dhaka aerosol ~75% anthropogenic vs ~37% at Bhola [V lit] |
| **MAIAC AOD** (MCD19A2) | LP DAAC | 4.4 d | Listed [R3] | Haze reverb | Terra/Aqua ending: plan VIIRS continuity |
| **TROPOMI NO2 NRT** (ESA, GES DISC mirror) | GES DISC | ~1 d | Listed [R2] | Partner voice (ESA), brick kilns/traffic (unverified for Bangladesh) | Archive kept ~10 days |
| **OMI aerosol optical depth** | **GIBS decodes ≥90%** [R3] | — | Browser-ready value layer | Air-quality GIBS layer | Aura ending |
| **VEDA NO2 etc.** | TiTiler | — | Part of the 6/8 collections returning values [R4] | EIC air dashboard data | — |
| **US Embassy Dhaka** | EPA (403 for scripts) / WAQI @8781 **404** | **Feed halted 4 Mar 2025** [V] | Hourly 2016–2025 (published: annual means 79.7–98.0; Jan 180–210, Jul/Aug 26–30 µg/m³) [V] | Ground segment of E5; "the monitor went quiet" | Download by hand |
| **WAQI** (DoE station @538612) | WAQI | Live | HTTP 200 [R2]; values need `WAQI_TOKEN` | Optional | Mirror |
| **SVS 5151–5154** | — | 137 d stale | 1% colour match | Picture only | — |
| **TEMPO** | ASDC | — | North America only | Contrast line only: "South Asia has no NASA geostationary air-quality eye" | — |

### 4.3.3 Biodiversity

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **GEDI L3 gridded canopy height + L4B biomass** | ORNL DAAC | Mission products | L3 heights: **Sundarbans 6.0 / 9.9 / 2.8 m** (values as reported for the Sundarbans entry), **Madhupur 7.1 m, Lawachara 17.2 m, Dhaka 17.0 m** (likely buildings) [R4] | Forest canopy voice, 3D-9 canopy cathedral | Coarse grid; the Dhaka value is a control that shows the artefact |
| **NASA CMS Bangladesh mangrove canopy height (hmax95) + biomass** | ORNL DAAC | 2000-era mapping (a baseline, not live) | Sundarbans centre **10.2 m, 67 Mg/ha** [R4] L1 | Coast-to-inland "skyline melody" | Baseline year |
| **CMS global mangrove canopy height** (`CMS_Global_Map_Mangrove_Canopy_1665`) | ORNL | Static | Listed [R2] | — | R² 0.93, RMSE 2.4 m vs GEDI [V] |
| **ICESat-2 ATL08** (canopy) | NSIDC | 115 d | One Sundarbans track: **median 7.9 m (n = 2 segments)** [R4] L3 | Independent lidar check on GEDI | Tiny sample |
| **GEDI L2A** | LP DAAC | 323 d | Listed [R2] | Footprint check | — |
| **SVS 4950** | — | — | Not invertible (R6) | Visual | — |
| **PACE chlorophyll** | OB.DAAC / GIBS | 1.3 d | See ocean | Ocean life voice | — |
| **GBIF Oriental Magpie-Robin (Doel)**, Bangladesh (non-NASA) | GBIF API (`*`) | — | **16,679 records.** By month: Jan 1,433 · Feb 1,414 · Mar 1,557 · Apr 1,522 · May 1,582 · **Jun 995 · Jul 975 · Aug 845 · Sep 1,020** · **Oct 1,971** · Nov 1,419 · Dec 1,944 [R3] | "Observations" voice only | Most likely shows **when people go birding**, not bird presence [INF] |
| **VIIRS SNPP EVI 8-day** | **GIBS decodes** [R3] | — | — | Vegetation value layer | **SNPP ends 2 Nov** |
| **xeno-canto** (Doel recordings) | API v3 (`XC_API_KEY`) | — | 4 Bangladesh recordings, all **CC BY-NC-SA 4.0** [R3] | Non-commercial bed with credit + share-alike | Team recordings avoid the question |

### 4.3.4 Wildfires

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **FIRMS** (VIIRS SNPP/NOAA-21, MODIS) | API key | NRT | Last 5 d: CHT VIIRS-NOAA21 **2**, SNPP 0, MODIS 0; **Punjab VIIRS-SNPP 49+** [R2]. National Bangladesh last 10 days: **0** on all three [R3] (October is the off-season [INF]) | Fire Geiger B6 | **Switch SNPP → NOAA-21/20 by 2 Nov** |
| **FIRMS history** (team P2) | API | 2003–2023 | CHT Mar–Apr: MODIS **4,954 (2003) → 4,033 (2023)**; VIIRS 2023 **14,521**. Punjab Oct–Nov: MODIS **11,879 → 9,850**; VIIRS 2023 **36,165** [TR] | A11 fire seasons | Compare MODIS with MODIS only (VIIRS sees ~3×); single years = "example years" |
| **SVS 5113** | Pipeline | 0.9 d | Tile ρ 0.60–0.62 | Picture + visual sync | Moderate |
| **SVS 5315 FWI** | Pipeline | 0.06 d | 6 classes; Bangladesh "very low" | B8 chord | Experimental; no archive |
| **VNP14IMG_NRT** (375 m swaths) | LANCE | 0.49 d | Listed | 5113 source | SNPP |
| GIBS fires | — | — | **No fire layer decoded** [R3] | — | — |

### 4.3.5 Greenhouse gases

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **NOAA GML Mauna Loa CO2** | CSV | Daily | **426.96 ppm (24 Oct 2026)** [R1–R2] | CO2 pedal tone (A9/C3 breathing) | In-situ, independent |
| **OCO-2 XCO2 Lite** | GES DISC | **89–90 d** | Newest 28–29 Jul 2026 | Don't promise a live CO2 satellite voice | Proposed FY26 termination (outcome unconfirmed) |
| **EMIT CH4 plumes** | LP DAAC | Newest over Bangladesh **Jan 2023** | No recent plume | No methane story | — |
| **U.S. GHG Center** | STAC + TiTiler | — | 37 collections; **3/6 returned Bangladesh values** [R4] | CO2/CH4 flux voices (gridded models) | Many are model/inventory products: label them |
| SVS 5196 CO2 beauty piece; EIC GHG dashboards | — | — | 16 EIC GHG items, 2 frame-pairable (J0) | Visual | — |
| GIBS GHG | — | — | **No GHG layer decoded** [R3] | — | — |

### 4.3.6 Energy

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **Black Marble VNP46A2** (daily, SNPP) | LAADS | 8.3 d | Dhaka 5×5 px median: **30.7, 32.2, 25.5, 28.2 nW·cm⁻²·sr⁻¹** (2 of 6 days cloud-blocked); monthly ≈ **32.3** [R3] | Night-light voices (E7) | **SNPP ends 2 Nov: switch to VJ146A2** |
| **VJ146A2** (NOAA-20) | LAADS | 8.3 d | Listed | Cross-sensor check, continuity | — |
| **VNP46A1** (at-sensor, NRT-ish) | LAADS | 1.3 d | Listed | — | SNPP |
| **Remal blackout at Khulna** (K12) | — | 17–31 May 2024 | Values 12.9, 6.4, 10.1 … **4.17 on 29 May**; min/median 0.47; clouds on most days [R3] | E7 rests | **Inconclusive: don't claim a blackout** |
| **CERES SYN1deg daily** (HDF4) | ASDC | 86 d | Dhaka, 31 Jul 2026: **surface SW down 190.6, TOA SW up 168.6, TOA LW up 198.0 W/m²** [R5] L6 | Energy-balance voice (in vs out), 3D-8 | Terra/Aqua/NOAA-20 product |
| **NASA POWER solar** vs **ERA5** | POWER API / Open-Meteo | 2024 | 366 days: **r 0.85; POWER 0.44 kWh/m²/day lower** [R3] K6 | Labelled solar voice | POWER **excluded** for long-term rain/heat (failed P1b) |
| SVS 5313 night-lights beauty piece | — | — | Not pairable | Visual | — |
| GIBS "energy" | — | — | R3 picked an ozone layer by mistake; fixed later | — | — |

### 4.3.7 Disasters

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **OPERA DSWx-S1 / DSWx-HLS** (Aug 2024 floods) | earthaccess | DSWx-S1 0.9–1.3 d; HLS 2.1–2.7 d; DIST-ALERT 2.1–2.7 d | Water (+class 3) fraction: **5 May 0.000 (HLS: clouds)**, **9 Aug 0.081 (HLS)**, **21 Aug 0.798 (S1)** [R3] | E2 three chords | **Not comparable as is:** different sensors and possibly different tiles. Use the same MGRS tile and the same sensor before quoting. OPERA is "preliminary and unvalidated" |
| **LANCE / MCDWD flood NRT** | LANCE | 0.33 d | Granule over Bangladesh found [R3] | Daily flood drone | Earthdata Login |
| **SVS 5584** | Pipeline | 0.17 d | 3 categories | Landslide rumble | — |
| **LHASA v2 at GES DISC** | earthaccess | **Ended Feb 2021** | Variable `p_landslide` [R2] | Demote the landslide movement unless the GPM landslide site has current files | — |
| **USGS earthquakes** | GeoJSON | Live | 20 significant quakes this month [R2] | Live percussive layer (X1) | USGS ≠ NASA |
| **EarthScope waveform → WAV** | FDSN + ObsPy | — | **M7.7 Mandalay 2025 at IU.CHTO, 146,400 samples → `G2_quake_CHTO_400x.wav`** [R1–R2] | G2 ground that shakes | IRIS audio service retired 26 Aug 2026; credit EarthScope/NSF |
| **NISAR** (NASA–ISRO) | ASF | Newest 23 Oct 2026 | 10 products over the Sundarbans, **~6.6 GB each** [R1–R2] | F4 spotlight only | Provisional; permanent gap 27 Jul–10 Aug 2026 |
| **Disasters Charter** 905 (Aug 2024) / 762 (Sylhet 2022) | Web | — | Pages timed out from Colab [R2] | Illustration | Open in a browser |
| **Worldview snapshot, 21 Aug 2024** | API | — | 200, JPEG [R3] | Story still | — |
| IBTrACS, EONET, cold wake | — | — | See ocean | — | — |

### 4.3.8 Water resources

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **IMERG half-hourly** Late / Early / Final (V07) | GES DISC | Late 0.63–0.66 d; Early 0.21–0.25 d; **Final ends Sep 2025** | Point pull speed **2.5–2.84 s per file → ~12–13.8 h per cell-year** [R1–R2] | Rain truth, G1 audification (overnight job), B2 | Label the Final → Late switch |
| **IMERG Late daily** | GES DISC | 1.3–1.9 d | — | F1 duet | — |
| **NASA IMERG × JAXA GSMaP (daily, Dhaka box 89.91–90.91 E, 23.31–24.31 N, 1–10 Jul 2025)** | earthaccess + JAXA Earth API (`JAXA.EORC_GSMaP_standard.Gauge.00Z-23Z.v6_daily`, band PRECIP, 10 px/deg) | — | **10 pairs, daily r 0.95** [R5] K10 | F1 two agencies, one monsoon | **Partly independent:** both use GPM passive microwave. Only 10 days: extend to Jun–Sep before quoting widely |
| **GRACE/GRACE-FO JPL mascon RL06.3 v4 CRI** | PO.DAAC | Newest Jul 2026 | Team: Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm (2003–06 vs 2021–24); NW India trend −3.25 cm/yr, BD −0.35 cm/yr; gap Jul 2017–May 2018 [TR]. App series: BD −30.6…+32.2, NW India −68.8…+25.6 cm [R3] | D1 water quartet, killer demo | ~3° true resolution |
| **HydroShare Bangladesh wells** (CC BY 4.0; per-station monthly climatology) | HydroShare | 2000–2014 | **1,268 stations: seasonal-cycle r +0.93 vs GRACE; wells swing 2.7 m, GRACE 41 cm** [R5] K8 | Ground check of the GRACE story; 3D-11 aquifer | Seasonal rhythm only: the file has no trend |
| **SWOT RiverSP Version D + Hydrocron** | PO.DAAC | 5 d | Jamuna reach **43499600141: 36 passes, 8.06 m swing** (Jun 2025 – Jan 2026); neighbours 43499600151/161/171 swing 1.34 / 0.91 / 1.52 m [R3] | E3 river notes, 3D-3 playable delta | Pick reaches by measured swing; SWORD IDs change between versions |
| **SMAP soil moisture** (SPL3SMP_E) | NSIDC | 1.3 d | Bangladesh box **0.304 (Feb) vs 0.427 m³/m³ (Aug)** [R4] (5 days, AM + PM) | Wet-earth voice | Avoid the 14 May–28 Jul 2026 reprocessing window |
| **GloFAS discharge** (Copernicus via Open-Meteo) | Keyless | Daily | Bahadurabad cell ≈ **2,343–2,414 m³/s** [R1–R2] | River-flow partner voice | Model |
| **GLDAS Noah 0.25° 3-hourly** | GES DISC | 86 d | Listed [R3] | Runoff/soil context | Lagged |
| **VIIRS snow cover** (VJ210A1, NOAA-20) | NSIDC | **0.5 d** | Listed [R3] | Himalayan snow → rivers (A16) | Already NOAA-20 (survives the S-NPP end) |
| **GPCP v2.3 / GPCC v2020** | NOAA PSL | Monthly | Jun–Sep Dhaka **15.10 → 13.71 mm/day (−9%)**; GPCC **14.79 → 13.03 (−12%)** [TR] | "Not wetter" honest null | Coarse cells |
| **FFWC (BWDB)** | API (registration) | — | `api3.ffwc.gov.bd` unreachable from Colab; main site 200 [R1–R2] | River gauges | May be Bangladesh-only |
| **data.gov.bd daily water levels** | Web | — | Reachable | FFWC fallback | May be stale |

### 4.3.9 Agriculture

| Dataset | Route | Age | Measured value | Powers | Caveat |
|---|---|---|---|---|---|
| **MODIS NDVI** (MOD13Q1, 250 m) | Catalogue + ORNL service | 10 d | Team P4 (2001–03 vs 2021–23): **Sundarbans 0.550 → 0.566; Madhupur 0.482 → 0.530; Dhaka control 0.274 → 0.260** [TR]. ORNL composites to Aug 2026 [R1] | Slow vegetation voice | Terra ending |
| **VIIRS NDVI** (VNP13A1) | **Catalogue** (to 30 Sep / 15 Oct 2026) | 10 d | **ORNL's VIIRS stops at May 2024**: use the catalogue route [R1–R2] | Continuity voice | **SNPP ends 2 Nov**: find the NOAA-20 version |
| **Rice "crop heartbeat", Bogura** (K9) | ORNL | 1 year | 23 composites; NDVI peaks > 0.5 on **16 Oct 2025, 9 May 2026, 10 Jun 2026** [R3] | C4 rice-season waves | Which peak is aman vs boro needs an agronomist [open] |
| **ECOSTRESS ET** (`ECO_L3T_JET` v003) | LP DAAC | 19 d | L5 ran in run 4 (not rerun, so treat as passed; value in the run-4 report) | Agriculture/water voice | ISS overpass times irregular |
| **ECOSTRESS LST** (`ECO_L2T_LSTE` v003) | LP DAAC | 4–4.5 d | Listed | Dhaka heat transect (A13) | — |
| **HLS Landsat 30 m** | LP DAAC | 2.2–2.7 d | Listed | River erosion | — |
| **OPERA DIST-ALERT** | LP DAAC | 2.1–2.7 d | Listed | Land disturbance | — |
| **VIIRS EVI 8-day (GIBS)** | GIBS | — | Decodes ≥90% [R3] | Browser value layer | SNPP |

### 4.3.10 Human dimensions, cryosphere, Sun–Earth, long records (not EIC areas, but Earthdata disciplines)

| Dataset | Route | Measured value | Powers |
|---|---|---|---|
| **SEDAC GPW v4.11 population density** (30′ grid, 2020) | SEDAC | **Dhaka 7,920; Chattogram 4,018; Khulna 1,056 people/km²** [R5] L7 (30′ cells ≈ 55 km dilute cities: use 2.5′ files for city-level numbers) | "Who lives under each sound" weighting; K5 digest |
| **geoBoundaries ADM2** | API | **64 districts, CC BY 3.0 IGO** [R2] | District digest K5 |
| **NSIDC Sea Ice Index v4** | HTTPS | Arctic **6.72 M km² (17 Oct 2026)** [R2] | Polar voice (A7), M3 variant; don't voice the v3→v4 splice |
| **GIBS sea ice** | GIBS | Decodes ≥90% [R3] | Browser layer |
| **NOAA SWPC RTSW** (new `json/rtsw/*` paths; `proton_speed`) | Keyless | Fields present [R1–R2] | Space-weather tension (X1) |
| **NASA DONKI** | api.nasa.gov | **503** in R2, R3, R4 (even with a key) | Optional only |
| **CelesTrak GP** | Keyless | Terra, Aqua, Suomi NPP, NOAA-20/21, GPM, SMAP, SWOT, PACE, Landsat 9 elements fetched [R2] | Satellite orrery (3D-5), "who measured this" (X2) |
| **Himawari-9 / GK2A** (NOAA AWS) | S3 | Newest full disk **0.2 h (12 min) old** [R1–R2] | 10-minute cloud layer (needs server decoding) |
| **NASA GISTEMP v4** | GISS | 146 years 1880–2025; Crawford step 0.03 °C → **59 semitones** [R1–R2]; Dhaka Apr–May **+1.37 °C** (1981–90 vs 2016–25) [TR] | D2 prologue, killer demo |
| **NEX-GDDP-CMIP6** | NCSS point | **Apr–May 2081 mean daily max 36.1 °C (ACCESS-CM2, SSP5-8.5: one model)** [R2] | D4 two futures (needs ~5 models) |
| **NOAA GSOD Dhaka (41923)** | NCEI | Only 2 complete early years [TR] | Supporting only |

## 4.4 Natively audio sources

| Source | Status | Licence | Use |
|---|---|---|---|
| EarthScope miniSEED → WAV | Works (Mandalay WAV) [R1–R2] | Credit EarthScope/NSF | G2 |
| NOAA passive acoustic bucket (`noaa-passive-bioacoustic`) | Reachable; prefixes MD_WEA_CPOD/, adeon/, aeon/, afsc/ [R2] | No explicit licence; cite DOI 10.25921/PF0H-SQ72 | G3 variant (global framing) |
| xeno-canto v3 | 4 Doel recordings, all NC-SA [R3] | NC-SA | Non-commercial only |
| Freesound | 0 CC0 results for one narrow query [R3]; widened to 5 queries in R4 | Per file | G3 bed; **team recordings preferred** |
| Chandra/NASA sonification audio | Exists | **No licence found: don't embed** | Cite as precedent |
| EMFISIS plasma-wave audio (U. Iowa) | Exists | Not checked | PK |
| Astronify (BSD-3), STRAUSS, Erie | Tools | Open | Offline rendering, captions |

## 4.5 Dead, stale or excluded (don't build on these)

| Item | Why | Instead |
|---|---|---|
| NASA POWER, long-term rain/heat | Failed P1b: monsoon ×2.16 vs GPCP ×0.91; heat −0.89 °C vs GISTEMP +1.37 [TR] | GISTEMP, GPCP, GPCC |
| GEOS-CF v1 | Ended Jan 2026 | v2 Zarr |
| SVS 5151–5154 inversion | 137 d stale; 1% match | Model + ground values |
| SVS 5544 | 135 d stale | Catalogue NDVI |
| SVS 5046/5064 | 1,305 d stale | 5099 + NSIDC v4 |
| SVS 4950 inversion | 16:9 renders | GEDI values |
| SVS 5148 inversion | ρ 0.40 | Values from GEOS-CF |
| LHASA at GES DISC | Ended 2021 | 5584 frame (fresh) |
| SWOT Version C | Ended Apr 2025 | Version D |
| OPERA ArcGIS services | 404 | Granules |
| IRIS audio/timeseries services | Retired 26 Aug 2026 | EarthScope FDSN + ObsPy |
| SWPC legacy `plasma-*`/`mag-*` JSON | Removed ~30 Apr 2026 | `json/rtsw/*` |
| xeno-canto API v2 | Gone | v3 + key |
| GLOBE API | HTTP 202, no rows [R1–R2] | GLOBE CSV route (831 BD observations in 2025) |
| US Embassy feed | Halted 4 Mar 2025 | Historic files + DoE/OpenAQ |
| EMIT Bangladesh | Newest Jan 2023 | — |
| OCO-2 live | 90 d lag; termination proposed | Mauna Loa |
| IMERG Final for recent months | Ends Sep 2025 | IMERG Late |
| **S-NPP products** | **Stop 2 Nov 2026** | NOAA-20/21 |
| Terra/Aqua (MODIS, MAIAC, CERES-Terra/Aqua) | "Begin shutting down late 2026 or early 2027" vs end of life 2027–28: conflict preserved [V] | VIIRS continuity notes |
| CALIPSO | Ended 1 Aug 2023 | — |
| LIS | Ended 2023; no Asian successor; GOES GLM can't see Bangladesh [INF] | Climatology only |
| SMAP 14 May–28 Jul 2026 | Reprocessing | Other dates |
| NISAR 27 Jul–10 Aug 2026 | Permanent gap | Other dates |
| Himawari P-Tree | No redistribution | NOAA AWS copy |
| BMD paid data | No redistribution | Links/screenshots only |
| TEMPO for Bangladesh | Not covered | Contrast line only |
| Open-Notify ISS (`http://`) | Mixed content | CelesTrak |

## 4.6 Independence: which "duets" share inputs (say it out loud)

| Pair | Shared input | How to say it |
|---|---|---|
| IMERG × GSMaP | GPM passive-microwave constellation | "Two agencies, two algorithms, partly independent" |
| MUR × OSTIA × OISST | Infrared inputs to L4 blends | "Partly independent; AMSR2 microwave is the most independent" |
| CAMS × MODIS AOD | CAMS assimilates MODIS | "Not independent of NASA" |
| ESA CCI soil moisture | Merges SMAP + AMSR2 | Don't count it as a third voice |
| Open-Meteo | Repackages ECMWF/Copernicus | Show the original provenance |
| MERRA-2 | Reanalysis | "Model estimate; not for validation" |
| GEOS-CF frame × GEOS-CF values | Same model | Tests the inversion only, not the truth |
| 5147 × GEOS-CF | Same GEOS family | Not independent |
| 5176 × CRW | Different agency and baseline | Independent check; expect an offset |
| Wells × GRACE | Different physics (water level vs gravity) | Independent (seasonal rhythm only) |
| GEDI × ICESat-2 × CMS mangrove | CMS uses GEDI for calibration; ICESat-2 is a separate lidar | ICESat-2 is the independent one |

Under the project's independence rule, a shared-input agreement counts only as **partial** confirmation.

## 4.7 Coverage matrices

### 4.7.1 The nine EIC areas: every one has at least one verified voice [X3]

| EIC area | Frame-paired voice | Verified value voices (tested) | Partner / ground | Best story | Gap |
|---|---|---|---|---|---|
| **Sea level** | 5176 anomaly (via SST) | NASA-SSH GMSL 11.58 (units open), PSMSL gauges, SMAP SSS 15.8/21.8 | PSMSL | D5 "the gauge went silent in 2003" + global rise | Units/reference of GMSL |
| **Air quality** | — (5151 stale) | GEOS-CF v2 50.4, MERRA-2, AERONET, OMI GIBS, VEDA | OpenAQ ground 72.2; CAMS 127.1 | "Three instruments, three answers: listen to the ground" | No fresh frame |
| **Biodiversity** | — (4950 not pairable) | GEDI L3 (Lawachara 17.2 m…), mangrove 10.2 m / 67 Mg/ha, ICESat-2 7.9 m, PACE | GBIF Doel (observations) | 3D-9 canopy cathedral; Sundarbans skyline | Live signal (mostly static maps) |
| **Wildfires** | 5113 (moderate ρ 0.6), 5315 classes | FIRMS counts | — | B8 forecast-vs-outcome chord; CHT/Punjab seasons | Off-season now |
| **Greenhouse gases** | — | Mauna Loa 426.96, GHG Center 3/6 | NOAA | CO2 breathing pedal | No Bangladesh satellite signal |
| **Energy** | — | Black Marble 25–32, CERES 190.6/168.6/198.0, POWER solar r 0.85 | ERA5 | "Dhaka at night"; Earth's energy in vs out | Remal inconclusive |
| **Disasters** | 5584 classes; 4285 + 5101 (cold wake) | Amphan −2.79/−3.92 °C, OPERA, EONET, quakes | IBTrACS, USGS, EarthScope | **Amphan cold scar** | OPERA cross-sensor |
| **Water resources** | **4285 rain (verified)** | IMERG, GRACE, SWOT 8.06 m, SMAP 0.304/0.427, wells r 0.93 | GSMaP r 0.95, GloFAS | Follow the water (E1); playable delta | FFWC |
| **Agriculture** | — (5544 stale) | NDVI Bogura peaks, P4 points, ECOSTRESS | — | Crop heartbeat | Aman/boro labelling |

### 4.7.2 Earthdata disciplines (the nine in our coverage matrix)

| Discipline | Tested sources |
|---|---|
| Atmosphere | GEOS-CF, MERRA-2, MAIAC, TROPOMI, AERONET, OMI, CERES, IMERG |
| Biosphere | GEDI, CMS mangroves, ICESat-2 canopy, PACE, NDVI/EVI |
| Cryosphere | Sea ice v4, 5099, VIIRS snow |
| Human dimensions | SEDAC GPW, Black Marble, geoBoundaries |
| Land surface | NDVI, ECOSTRESS, HLS, OPERA DIST, LST |
| Ocean | MUR, OSTIA, AMSR2, OISST, CRW, SMAP SSS, PACE, GMSL, CYGNSS |
| Solid Earth | USGS quakes, EarthScope waveforms, NISAR |
| Sun–Earth interactions | SWPC, DONKI (down), SDO 5577, CERES TOA |
| Terrestrial hydrosphere | GRACE, SWOT, SMAP SM, GLDAS, OPERA DSWx, GloFAS, wells |

### 4.7.3 DAACs used (11 of 12)

| DAAC | Used for |
|---|---|
| PO.DAAC | MUR, OSTIA, AMSR2 (REMSS), GRACE, SMAP SSS, SWOT/Hydrocron, NASA-SSH, CYGNSS, OPERA DSWx |
| GES DISC | IMERG, MERRA-2, LHASA, OCO-2, TROPOMI, GLDAS |
| LP DAAC | MAIAC, ECOSTRESS, EMIT, HLS, OPERA DIST, GEDI L2A |
| NSIDC | SMAP soil moisture, ICESat-2 ATL08, VIIRS snow, sea ice |
| ORNL DAAC | GEDI L3/L4B, CMS mangroves, MODIS/VIIRS web service |
| LAADS | Black Marble |
| OB.DAAC | PACE |
| ASDC | CERES |
| GHRC | LIS/OTD climatology |
| ASF | NISAR |
| SEDAC | GPW |
| CDDIS (space geodesy) | **Unused.** Low value for #14 [INF] |

### 4.7.4 Tools named in the Earthdata/EIC search result

| Tool | Status in Bloop |
|---|---|
| Earthdata Search (CMR) | D-sweep, freshness monitor |
| Worldview | Snapshot API for story stills (K14) |
| Giovanni | Manual only (API 403) |
| FIRMS | Fire voice |
| GIBS | Second decoding path (G7, K15) |
| VEDA / GHG Center | Point values via TiTiler (K16, K5) |
| EIC galleries | Frames (B, J) |

## 4.8 Claim ledger: numbers you may put on screen

Rule: a number goes on screen only if it is in this table (or in the app JSON it came from), with its label.

| Claim (exact) | Status | Source | Verified | Falsifier |
|---|---|---|---|---|
| "Checked against NASA MUR SST: median error 0.31 °C (60 ocean points)" | [TR] | Pipeline truth test | Oct | Re-run on the refreshed frame differs by > 0.1 °C |
| "Checked against NASA IMERG (Late run): typically within ~27%; agreed on where it was raining at every sampled point" | [TR] | D2 | Sep | New frame format |
| "SST anomaly agrees with NOAA Coral Reef Watch in sign at 91% of points; offset −0.31 °C (different baselines)" | [R2][R3] | C5176 | 26 Oct | — |
| "Dhaka, April–May: +1.37 °C (NASA GISTEMP, 1981–1990 vs 2016–2025, 10 years each)" | [TR] | build_demo | Sep | — |
| "Dhaka, June–September: not wetter. GPCP −9% (1981–1990 vs 2016–2025); rain gauges (GPCC) −12% (1981–1990 vs 2010–2019)" | [TR] | build_demo | Sep | — |
| "Water storage (GRACE): Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm (2003–06 vs 2021–24). Silence = no satellite measurements (Jul 2017–May 2018)" | [TR] | build_demo | Sep | — |
| "Cyclone Amphan cooled the Bay of Bengal by 2.8 °C on average along its track (up to 3.9 °C), 3 days before vs 3 days after (NASA MUR)" | [R3] | K11 | 26 Oct | Different window → different number (state the window) |
| "The Jamuna at reach 43499600141 rose and fell 8.06 m across 36 SWOT passes (Jun 2025–Jan 2026)" | [R3] | E6 | 26 Oct | — |
| "NASA IMERG and JAXA GSMaP agree day-to-day (r = 0.95, 10 July days over Dhaka); partly independent" | [R5] | K10 | 26 Oct | Longer window: report the new r |
| "Bangladesh's wells and GRACE share the same seasonal rhythm (r = +0.93, 1,268 wells)" | [R5] | K8 | 26 Oct | — |
| "Dhaka PM2.5 at [time]: ground stations 72 µg/m³, Copernicus CAMS 127, NASA GEOS-CF 50" | [R5] (snapshot) | K2 | 25–26 Oct | Must be re-computed for whatever time is shown |
| "Northern Bay of Bengal water is 6 psu fresher after the monsoon (SMAP: 15.8 vs 21.8 psu)" | [R1] | E4 | 25 Oct | — |
| "Soil moisture over Bangladesh: 0.30 (Feb) vs 0.43 m³/m³ (Aug) (SMAP)" | [R4] | K13 | 26 Oct | — |
| "Coral heat stress at St Martin's Island rose from ~2 to ~4 °C-weeks in 9 days (NOAA CRW)" | [R1–R2] | F2 | 24 Oct | Recheck the latest before showing; add the CRW alert-level source |
| "Sundarbans mangrove canopy ~10 m, 67 Mg/ha (NASA CMS, 2000-era map)" | [R4] | L1 | 26 Oct | — |
| "Dhaka gets 190.6 W/m² of sunlight at the surface; Earth above it reflects 168.6 and emits 198.0 W/m² (CERES, 31 Jul 2026)" | [R5] | L6 | 26 Oct | — |
| "Mauna Loa CO2: 426.96 ppm (24 Oct 2026)" | [R1] | E15 | 25 Oct | Use the latest value |
| "Global temperature since 1880 spans 59 semitones on Crawford's 0.03 °C step" | [R1] | E9 | 25 Oct | — |
| "Fires, CHT, Mar–Apr, MODIS: 4,954 (2003) vs 4,033 (2023), example years, same sensor" | [TR] | P2 | Sep | — |
| "Proof in unison: 0.31 °C ≈ a fifth of a semitone" | [R2] | I1 | 26 Oct | — |

**Never say:**
- "sound beats sight";
- "more erratic rain" (not tested);
- "real-time this minute";
- "today's ocean" (say "the latest");
- "Remal blackout";
- "methane plume over Dhaka" (EMIT);
- "AQI 2000–2026";
- any NASA POWER long-term number;
- any model value as a "measurement";
- "EIC has no audio" (say "the launch description lists no non-visual access features");
- "first ever" for anything in the §3.2 not-new list;
- the old **0.85 °C**.

## 4.9 Partner and other-agency catalogue (full detail; NASA stays central)

**Rubric logic.** "NASA open data plus other agency or third-party sources, clearly shown" scores 5/5 on NASA data usage. Relevance asks for NASA-data-first, so partner voices sit **on top of** the NASA core.

| Source | Agency | What it adds | Cadence / access | Independence | Status |
|---|---|---|---|---|---|
| **GSMaP** (NOW: 0-h latency, half-hourly; NRT: hourly, 4-h latency; hourly 0.1° archive from 1998) | JAXA (partner) | Second rain algorithm | NOW/NRT need free **G-Portal / JAXA registration** ([registration](https://sharaku.eorc.jaxa.jp/GSMaP/registration.html); [product](https://eolp.jaxa.jp/GSMaP_Hourly.html); [FAQ](https://sharaku.eorc.jaxa.jp/GSMaP/faq/GSMaP_faq06.html)); commercial use allowed with credit "GSMaP data by JAXA". **JAXA Earth API: daily or coarser, keyless** | Partly (GPM microwave) | Daily route ✅ r 0.95 |
| **JAXA Earth API** (`jaxa.earth` Python; `jaxa.earth.umd.js` v2.0.1 for browsers: Chrome/Edge/Safari/Firefox) | JAXA | GSMaP, AMSR2, SGLI | No registration, no key, no count limit; per-dataset licences in STAC ([site](https://data.earth.jaxa.jp/en); [JS](https://data.earth.jaxa.jp/api/javascript/v2.0.1/en/docs/documents/For_Browsers.html); [catalogue](https://data.earth.jaxa.jp/app/mcp/catalog.v2.md)) | — | ✅ (SGLI resolution conflict in its catalogue) |
| **AMSR2** | JAXA | The most independent SST voice (microwave); also inside MUR | REMSS L3U on PO.DAAC | Most independent | ✅ |
| **Himawari-9** (10-min full disk; SST 2 km; AOT 5 km) | JMA/JAXA (JMA is not a partner) | Cloud/convection layer over Bangladesh | **Use the NOAA AWS copy** (P-Tree forbids redistribution) | Different satellite | ✅ 12 min old |
| **GK2A** (`noaa-gk2a-pds`) | KMA (not a partner) | Second geostationary view | NOAA AWS | Different satellite | ✅ |
| Meteosat-9 IODC (15 min, oblique, "best effort") | EUMETSAT | Third geostationary view | EUMETSAT account | — | Not tested |
| **OSTIA** | UK Met Office (UKSA is a partner; the Met Office itself is "other agency") | Second SST analysis, 0.05° | PO.DAAC / CMEMS | Partly (IR) | ✅ 30.10 °C |
| **GHRSST GMPE** (median + spread of SST analyses) | Met Office / GHRSST | A ready-made disagreement field ([GMPE](https://ghrsst-pp.metoffice.gov.uk/ostia-website/gmpe-monitoring.html)) | Data access unknown | Ensemble | [UNK] |
| **NOAA OISST** | NOAA | Third SST analysis | ERDDAP, ~2-week lag, free redistribution | Partly | ✅ |
| **NOAA Coral Reef Watch** (SSTA, DHW, BAA, 5 km from 1985) | NOAA | Independent check on 5176; coral heat | ERDDAP | Independent analysis | ✅ |
| **CAMS** (0.4°, 00/12 UTC, CC-BY) | Copernicus/ECMWF | Air-quality model | ADS key, or keyless via Open-Meteo | **Assimilates MODIS AOD** | ✅ 127.1 |
| **ERA5** (hourly from 1940, ~5-day lag) | Copernicus | Reanalysis reference (solar check r 0.85) | CDS key, or keyless via Open-Meteo | Overlapping observations | ✅ |
| **GloFAS v5.0** | Copernicus CEMS | River-discharge model | EWDS key, or keyless via Open-Meteo | Model | ✅ |
| **TROPOMI** (Sentinel-5P) | ESA (partner) | NO2 | GES DISC mirror (NRT ~3 h; archive ~10 days) | Independent sensor | ✅ listed |
| **ESA SMOS** | ESA | Independent L-band salinity | — | Independent | Not tested |
| **ESA CCI soil moisture** | ESA | — | — | **Merges SMAP + AMSR2: not a third voice** | — |
| **NISAR** | NASA–ISRO (ISRO is a partner) | Joint-mission spotlight | ASF; ISRO MOSDAC Level-2 NRT after sign-up (foreign-user terms unknown) | One mission, two agencies | ✅ ASF |
| **Hydroweb** (3 days after a pass) | CNES/Theia (**not a partner**) | River altimetry | — | — | Not tested |
| CSA RCM via EODMS | CSA (partner) | Radar | Licence listed inconsistently | — | PV |
| **IBTrACS v04r01** | NOAA NCEI | Cyclone best tracks | Update cadence conflict preserved (twice weekly vs three times a week or weekly) | Blends agency estimates | ✅ |
| **NOAA GML Mauna Loa** | NOAA | CO2 in situ | CSV | Independent of OCO-2 | ✅ |
| USGS / EarthScope (NSF) | Other agency | Quakes, waveforms | Keyless | — | ✅ |
| GPCC | DWD (Germany) | Gauge-only rain | NOAA PSL | Independent (gauges) | ✅ |
| CelesTrak | Non-agency | Orbits | Policy: stop on any non-200 | — | ✅ |
| OpenAQ / DoE CAMS stations / US Embassy | Third party / Bangladesh govt / US State Dept | Ground truth | Key / mirror / files | Independent (in situ) | ✅ / 🟡 |

**Use partner data from the partners' own services.** NASA's CMR shows 0 JAXA, ESA or ISRO collections over Bangladesh (K17). **Check the official #14 partner resources on 28 Oct**: anything they name takes precedence over this list.

## 4.10 Build reference: exact paths, variables, boxes, coordinates [TR, team build plan + catalogue]

**SVS 5101 (SST).**
- Page https://svs.gsfc.nasa.gov/5101/ · API https://svs.gsfc.nasa.gov/api/5101.
- Frames: `…/vis/a000000/a005100/a005101/frames/4096x2048_2x1_30p/sst_mur_no-dates/`. The dated `…/sst_mur/` folder is only for reading the date.
- Stills: `sst_mur_<YYYYMMDD>_no-dates.exr`. Use equirectangular only, never the Robinson or hurricane versions.
- Colorbar `…/a005101/sst_mur_colorbar.png` (3840×2160 containing the strip): **−5 to 35 °C linear**; land = neutral colour.
- Colorbar changed? Follow the L1 guide, Appendix A, "Colorbar CHANGED procedure".

**SVS 4285 (rain).**
- Frames: `…/a004285/frames/3600x1800_2x1_30p/flatalpha/imergert_alpha.<ISO time>.png`. **Windows can't save colons: rename on download.**
- Colorbars: `rainbarwhite2.png` / `rainbarblack2.png` (liquid), `snowbarwhite2.png` / `snowbarblack2.png` (frozen); **0.1–50 mm/h log**; strip x 40–416, y 37 (377 px); RGB-only matching.
- 3600×1800 = IMERG's 0.1° grid exactly. The frame timestamp is the **start** of the half-hour.

**SVS 5176 (anomaly).**
- `sst_mur_anomaly_nodates_most_recent.exr`; variants `sst_mur_anomaly`, `_pacific`, `_nodates`, `_robinson`.
- Colorbar `sst_mur_anomaly_auto_colorbar_01.exr`: −4…+4 °C, ticks at **x 127…896 px (96.1 px/°C)**, 9 ticks.

**SVS 5315.** `FWI_forecast_latest.png` (2160×1080, Robinson); classes <10 / 10–20 / 20–40 / 40–50 / 50–70 / >70.

**SVS 5151 family.** `frames/2048x1024_2x1_12p/MC01_stage4_GMAO_pm25_…`; `PM2.5_colorbar.png` / `_plain.png` (528×125). Mask burned-in labels. **5147 metadata says 3 m, the description says 2 m.**

**SVS 5113.** `frames/4096x2048_2x1_30p/EIC/` (~824 items) and `/SoaS/` (no dates, for a sphere); `VIIRS_fires_latest.exr/.png`; no colorbar file.

**SVS 5544.** 8640×4320 equirectangular and Robinson (undated); 4096×2048 dated variants; `NDVI_colorbar.png` with no stated range.

**MUR.** `MUR-JPL-L4-GLOB-v4.1`; `analysed_sst` (K), `sst_anomaly` (from 2019), `dt_1km_data` (hours to the nearest IR measurement), `analysis_error`. Open with `decode_timedelta` set explicitly (xarray warning seen in R3). Check C's best match was MUR 2026-09-21.

**IMERG.**
- `GPM_3IMERGHHL` (Late; matched best), `GPM_3IMERGHHE`, `GPM_3IMERGHH` (Final), `GPM_3IMERGDL` (daily Late).
- Variables `Grid/precipitation` (mm/h), `Grid/probabilityLiquidPrecipitation`.
- The daily file has a root-level layout (fixed in R4).

**GRACE.**
- `TELLUS_GRAC-GRFO_MASCON_CRI_GRID_RL06.3_V4`, file `GRCTellus.JPL.200204_202607.GLO.RL06.3M.MSCNv04CRI.nc` (~2 GB in memory: never ship to the browser).
- Variables: `lwe_thickness` (cm, vs 2004–2009), `uncertainty`, `land_mask`, `scale_factor`; longitude 0–360.
- Boxes: **Bangladesh lon 88–93, lat 20.5–26.7; NW India lon 72–78, lat 26–32.** Gap Jul 2017–May 2018 (35 missing months in total).

**GISTEMP.** `https://data.giss.nasa.gov/pub/gistemp/gistemp250_GHCNv4.nc.gz` → `tempanomaly` (vs 1951–1980).

**GPCP.** `https://downloads.psl.noaa.gov/Datasets/gpcp/precip.mon.mean.nc` (`precip`, mm/day; open with `decode_times=False`; time = 1800-01-01 + days).

**GPCC.** `…/gpcc/full_v2020/precip.mon.total.2.5x2.5.v2020.nc` (mm/month ÷ days).

**GSOD Dhaka.** `https://www.ncei.noaa.gov/data/global-summary-of-the-day/access/<YEAR>/41923099999.csv` (MAX °F, PRCP inches; 9999.9/99.99 = missing).

**FIRMS.**
- `https://firms.modaps.eosdis.nasa.gov/api/area/csv/<MAP_KEY>/<SOURCE>/<w,s,e,n>/<1–10 days>/<YYYY-MM-DD>`.
- Sources: `MODIS_SP` (from Nov 2000), `VIIRS_SNPP_SP` (from 2012); NRT `VIIRS_NOAA21_NRT`, `VIIRS_NOAA20_NRT`, `MODIS_NRT`.
- Boxes: **CHT lon 91.6–92.7, lat 21.2–23.7 (Mar–Apr); Punjab lon 73.8–77.0, lat 29.5–32.5 (Oct–Nov).**

**ORNL MODIS service.**
- `https://modis.ornl.gov/rst/api/v1/MOD13Q1/...`, band `250m_16_days_NDVI`, ×0.0001, ≤ 10 dates per request.
- Points: **Sundarbans 21.95 N 89.18 E; Madhupur 24.62 N 90.05 E; Dhaka control 23.78 N 90.40 E; Bogura (K9)**.

**City cells (build_context).** Dhaka 23.81 N 90.41 E; Chattogram 22.36, 91.78; Rajshahi 24.37, 88.60; Sylhet 24.90, 91.87.

**GLOBE.** Clouds 2025 v3.4 matched CSV: 831 Bangladesh observations, all satellite-matched, 139 locations. Use the CSV, not the API.

**GEOS-CF.**
- Public Zarr stores `geos-cf-v2-ana-latest.zarr/`, `geos-cf-v2-fcst-latest.zarr/` (bucket `smce-geos-cf-public`); the v1 stores ended Jan 2026.
- PM2.5 band `PM25_RH35`; pick variables case-insensitively (v2 renamed them).
- Also NCCS datashare, OPeNDAP and the FLUID point export (JSON).

**JAXA GSMaP daily (K10).** `je.ImageCollection("JAXA.EORC_GSMaP_standard.Gauge.00Z-23Z.v6_daily").filter_date([...]).filter_resolution(ppu=10).filter_bounds(bbox=[89.91,23.31,90.91,24.31]).select(band="PRECIP").get_images()` → `data.raster.img`.

**VEDA/GHG point.** `<raster API>/cog/point/{lon},{lat}?url=<COG href>` (the S3 hrefs return 403 directly).

**CERES.** `CER_SYN1deg-Day_Terra-Aqua-NOAA20` Edition 4B, HDF4 via `pyhdf`; SDS `init_all_sfc_sw_dn`, `init_all_toa_sw_up`, `init_all_toa_lw_up`.

**GPW.** `gpw-v4-population-density-adjusted-to-2015-unwpp-country-totals-rev11_2020_30_min_asc.zip` (.asc in a zip; use the 2.5′ file for cities).

**OPERA Aug 2024 extent.** 88.60–92.18 E, 20.90–26.11 N (Feni/Noakhali/Cumilla).

**SWPC.** `json/rtsw/rtsw_wind_1m.json` (`proton_speed`, `proton_density`); Kp/Dst/F10.7 are key-value objects since ~31 Mar 2026 (NWS SCN 26-21).

**DONKI fallback.** NASA CCMC DONKI service (also tried in R4; treat as optional).

**Other catalogue facts kept for completeness:**
- Embassy per-year AirNow files (GHDx); DoE annual means from 2002 (second-hand; 2016 capture 64%).
- The DoE CAMS network measures PM2.5, PM10, O3, SO2, NOx and CO.
- Bangladesh's NAQMP 2024–2030 cites USEPA AQI breakpoints [PV]. Convert to AQI only from bias-corrected daily means, and name the standard.
- MERRA-2 PM2.5 = (DUSMASS25 + OCSMASS + BCSMASS + SSSMASS25 + 1.375·SO4SMASS) × 1e9.
- TRMM-LIS 1997–2015 + ISS-LIS 2017–2023.
- NASA Global Landslide Catalog/COOLR (access unverified).
- Black Marble NRT ~3 h via LANCE.
- LANCE VIIRS flood (VCDWD daily, VCDWDG hourly cumulative) replaces MODIS.
- 5120's description mentions only GOES-16.
- NSIDC G02135 (v4, AMSR2 input; "Basic" service level).
- CMS mangroves are TanDEM-X + GEDI (12 m).
- EMIT L2B V002 (60 m; ±54°; gap Sep 2022–Jan 2023).
- TEMPO NRT V02 has NO2/HCHO and no ozone.
- BMD data portal: Tk 800/item + Tk 100/station + Tk 100/5 yr + 15% VAT, ≥ 5 working days, no redistribution.
- OCO-2 end of life "≥ 2026" (WMO OSCAR).
- GHG Center STAC: 1.0.0 with CQL2.
- NOAA passive acoustics: NRS, ADEON, SanctSound; WAV/FLAC in GCS.
- Open-Notify: plain `http://` (avoid).

**Not-new reminders from v1 §23.2:** StarSound (Cooke 2019) and VoxMagellan exist; geographic spatial sonification exists. Claims that these were "never applied to geography" were OVERSTATED.

**Other services named in earlier research, not yet tested:** GDACS, ReliefWeb, Smithsonian GVP, GLDAS/FLDAS/GFMS, AppEEARS, Harmony, the LHASA point/WMS route, the GLOBE API for protocols other than clouds, AERONET L2.0 years, UHSLC 134/136 recency, OSCAR/SSH anomaly, GEDI L4A, ECOSTRESS v3 L1, Pandora (none found in Bangladesh), OMI/AIRS, CHIRPS (roadmap rain record).

---
# PART 5: The engine (one engine, many experiences)

## 5.1 Architecture

```
 NIGHTLY / HOURLY PIPELINE (Python; GitHub Actions cron)                               STATIC APP (Vercel)
 ┌──────────────────────────────────────────────────────────────────────┐
 │ SVS frames 5101·4285·5176·5113·5315·5584 ─► colorbar inversion (LUTs) │──► value grids (.bin) + meta (.json)
 │ IMERG/MUR/CRW/… source files ─► truth tests (error per track) ───────│──► truth/*.json (+ plots)
 │ GEOS-CF Zarr · OpenAQ · CAMS · GSMaP · SWOT · GRACE · FIRMS · CERES… │──► context/*.json (small series/points)
 │ GIBS colormap decode (3rd route) ─► three-way check ──────────────────│──► truth/threeway.json
 │ CelesTrak GP (2 h) · USGS · EONET · SWPC (cache) ────────────────────│──► live/*.json
 └──────────────────────────────────────────────────────────────────────┘
                                   │ same-origin files (no CORS, no keys in the browser)
                                   ▼
   ONE VALUE GRID ─► VIEW: absolute | anomaly (Choir) | change (Change Choir)
                  ─► RENDER: tones | elemental textures | spectral overview | musical layer (value-locked)
                  ─► SPACE: stereo by longitude | HRTF | 3D scene position
                  ─► TEXT: code-computed captions, 3×3 summaries, spoken values (EN/BN)
                  ─► TRUST: truth panel · proof in unison · provenance drawer · Citizen Ear · check-the-AI-by-ear
   EXPERIENCES (modes of one engine): Explore · Story · Then vs Now · Orchestra · Games · Duets · 3D Jukebox · Kiosk · Bulletin
```

**Why a pipeline** [TR T1, R1]:
- SVS blocks browser pixel reads for our origin.
- FIRMS and OpenAQ keys must stay server-side.
- GRACE is about 2 GB.
- If SVS stalls, the app falls back to cached frames.
- Low bandwidth for Bangladesh users.

**"Real time", stated honestly:** the **sound** is synthesised live in the browser. The **data** is near-real-time: rain every 30 min, arriving hours late; SST daily. The frame time is always on screen.

**Freshness monitor** [NEW]. The cron also writes `meta/freshness.json`: each product's newest timestamp, from the B/D tests. The app shows a small "data age" badge, and Bloop never presents stale data as current. A2 failed precisely because this was missing.

## 5.2 Tech stack

- **Pipeline:** Python 3.10+, `numpy`, `pillow`, `opencv-python` (EXR, `OPENCV_IO_ENABLE_OPENEXR=1`), `xarray`, `h5netcdf`, `h5py`, `pyhdf` (CERES HDF4), `rasterio` (GeoTIFF/ASCII grids), `earthaccess`, `zarr`/`s3fs` (GEOS-CF), `jaxa.earth`, `pandas`, `obspy` (quake WAV), `matplotlib`.
- **App:** the current deployed stack (TypeScript; `src/lib/data/latest.ts`, `sequence.ts`, `grid.ts`; data contract in `src/types/data-contract.ts` sections up to 14).
  - Audio: Web Audio API + AudioWorklet.
  - Speech: Web Speech API, with recorded Bangla clips as fallback.
  - Drawing: Canvas 2D; **three.js** for the 3D jukebox (Part 7).
- **Hosting:** Vercel (`bloop-ptsd.vercel.app`); public repo `PratikDev/nasa-sac`.
- **Browsers:** Chrome/Edge desktop and Android are primary; Safari/Firefox best effort. Feature-detect vibration, AudioWorklet and HRTF.

## 5.3 Data contract (existing + proposed additions)

**Existing** [TR, build plan §7 + PR sections 13–14]:
- Grids are little-endian, row 0 = 90° N, col 0 = 180° W.
- `latest/sst.bin`: 1024×512 Uint16, value = round((°C + 5) × 1000); 65535 = land/no data.
- `latest/rain.bin`: 1800×900, 2×2 max; 0 = dry; round((log10(mm/h) + 1) × 20000) + 1; 65535 = no data.
- `latest/rain_phase.bin`: 0 dry, 1 liquid, 2 frozen.
- `sequence/rain_000…047`: 1200×600.
- `context/gistemp_bd.json`, `gpcp_bd.json`, `gpcc_bd.json`, `grace.json`, `firms.json`, `ndvi.json`, `globe_bd.json`, `ensemble_bd.json`, `globe_duet.json`; `demo/dhaka_then_now.json`.
- `global/` cube (heat/rain/water int16 gz + `confidence.json` + `places.json` with 42 places + `manifest.json`).
- `truth/*.png`.

Metadata schema per product:
```json
{ "product": "sst", "svs_id": 5101, "svs_page": "...", "frame_time_utc": "...",
  "source_dataset": "MUR-JPL-L4-GLOB-v4.1 (NASA/JPL PO.DAAC)",
  "grid": {"width":1024,"height":512,"encoding":"uint16_offset","scale":1000,"offset":-5,"nodata":65535},
  "verified": {"metric":"median_abs_error_C","value":0.31,"n_points":60,"test":"truth_sst"},
  "credit": "Visualization: NASA's Scientific Visualization Studio. Data: MUR SST, NASA/JPL PO.DAAC.",
  "generated_utc": "..." }
```

**Proposed additions** [NEW]. Each is optional, additive and non-blocking, the same pattern as PR 13/14.

| File | Content | From test |
|---|---|---|
| `latest/sst_anom.bin` + `.json` | 5176 inverted anomaly, 1024×512, Int16 0.001 °C; `verified` = CRW sign 0.91, ρ 0.79, offset −0.31 | C5176 |
| `latest/sst_dt.bin` | MUR `dt_1km_data` (hours since IR) at the same grid → clarity | E1 |
| `latest/fwi_class.bin` | 5315 class 0–6, reprojected from Robinson | C5315 |
| `context/cold_wake_amphan.json` | 12 track points: before/after SST, Δ | K11 |
| `context/swot_reaches.json` | Reach IDs, pass times, WSE; amplitude | E6 |
| `context/duet_rain.json` | IMERG vs GSMaP daily pairs + r | K10 |
| `context/wells_grace.json` | Monthly climatology of wells + GRACE + r | K8 |
| `context/air_dhaka.json` | Per hour: ground median (n stations), CAMS, GEOS-CF v2; ratios | K2 (cron hourly) |
| `context/salinity_bay.json` | SMAP SSS Oct vs Apr box means (+ series) | E4 |
| `context/soil_bd.json` | SMAP SM by month | K13 |
| `context/forest_points.json` | GEDI L3/L4B, CMS mangrove, ICESat-2 at named points | L1–L3 |
| `context/energy_dhaka.json` | CERES daily SW down / TOA SW up / LW up | L6 |
| `context/nightlights.json` | Black Marble VJ146 Dhaka/Chattogram/Khulna daily + monthly | E5, K12 |
| `context/coral_stmartins.json` | CRW DHW series | F2 |
| `context/sealevel.json` | GMSL series (units confirmed) + PSMSL gauges | K1, F12 |
| `context/co2.json` | Mauna Loa daily | E15 |
| `context/population.json` | GPW 2.5′ at points/districts | L7 |
| `live/sats.json` | CelesTrak elements (refreshed every 2 h; stop on non-200) | G6 |
| `live/events.json` | EONET + USGS (Bangladesh box) | G1, G3, K7 |
| `truth/threeway.json` | Frame vs GIBS sourceValue vs source file at the same points | G7 |
| `meta/freshness.json` | Newest data time per product | B, D |

## 5.4 Sound mapping specification (`mapping.json`)

**Existing rules** [TR, build plan §10]. Changes are marked. Every rule is shown to users in the Mapping panel.

| Voice | Data | Rule | Sound |
|---|---|---|---|
| Ocean | SST °C (−5…35) | t = (T + 5)/40; f = 220 × 4^t Hz (1 °C = 0.6 semitones) | Warm sine, ~30 ms glide |
| **Ocean, zoomed axis (J3, new)** | SST, regional span (e.g. 26–32 °C over 2 octaves) | Same exponential form; range spoken and captioned like a y-axis | Same; "zoomed" badge always visible |
| Rain | IMERG mm/h (0.1–50, log) | t = (log10 r − log10 0.1)/(log10 50 − log10 0.1); drops/s = 2 + 38t | Band-passed noise drops; slight redundant loudness |
| Snow | IMERG frozen phase | Same density rule | Soft bell |
| Stereo | Longitude | pan = lon/180 | StereoPanner |
| Silence | Land, dry, no data | No sound ("honest silence") | — |
| **Missing data (new, guardrail 6)** | Gaps (GRACE 2017–18, Embassy after Mar 2025) | A neutral texture (quiet clock tick/soft noise) + label "no satellite in orbit" / "the monitor went quiet" | Never a fade-out, never minor-key |
| Heat then vs now | GISTEMP anomaly (−2…+3 °C) | f = 220 × 4^((a + 2)/5) | Sine |
| Heat deviation (Anomaly Choir) | \|anomaly\| bands <0.5 / 0.5–1 / 1–1.5 / >1.5 °C | Pure → detuned → rough; warm and cold treated the same | Consonance → dissonance = "unusual", not "bad" |
| **SST anomaly normal tone (B3, new)** | 5176 anomaly −4…+4 °C | Fixed reference tone = 0; data voice bends by anomaly; beating vs the reference | Sine pair |
| Monsoon then vs now | GPCP mm/day (0–25) | Drops per step = round(mm/day × 0.6); 1 step = 1 month (150 ms) | Drops |
| **Water bass (FIX: shared scale)** | GRACE cm | **Fixed range −70…+35 cm → 80–320 Hz (exponential), the same for every region** | Low sine; gap = neutral texture |
| Fires | FIRMS count/day | Click strength = log(1 + n)/log(1 + max); **Fire Geiger: Poisson rate = count** (B6); FRP → click brightness (filter), not loudness | Clicks |
| Vegetation | NDVI 0–1 | 150–600 Hz exponential. **Not NASA's inverted NDVI polarity** (a design choice to test) | Slow pad |
| **Air (new)** | PM2.5 µg/m³ | Low-pass cutoff exponential 8 kHz → 800 Hz across the stated range; grain density as a redundant cue (B7) | "Hearing through haze" |
| **River (new)** | SWOT WSE (m, shared metre scale) | One note per reach; sparse passes = sparse notes (no interpolation) | Plucked (Karplus–Strong) |
| **Salinity (new)** | SMAP SSS psu | Fresher → higher, purer tone (design choice) | Sine + breath |
| **Soil (new)** | SMAP SM m³/m³ | Dry → crackle; wet → legato | Texture |
| **Forest (new)** | Canopy height m | Height → pitch of an organ-pipe partial (3D-9) | Pipe |
| **Light (new)** | Black Marble radiance | Number of shimmering voices (Foo instrument count) | Shimmer |
| **Energy (new)** | CERES W/m² in vs out | Two tones; their difference = beating (an energy imbalance you can hear) | Sine pair |
| Variability → timbre | Year-to-year spread | Brighter filter + slight roughness | — |
| Seasonality → rhythm | Month | Accent on the climatological peak month | — |
| Extremes | Hottest/wettest in view | One bright ping | Earcon |
| Satellite whisper | Metadata | Chime + caption naming dataset and mission | Earcon |
| Sonic identity / **Bloop drop (A1)** | Bay of Bengal SST box median → drop pitch, then 4 latitude bands | Pitch = data; drop shape = branding | Water drop + 4-note motif |

**Global audio rules:** master volume capped; limiter; mute/solo per voice; **personalisation changes timbre only, never value → pitch/density**.

## 5.5 Guardrails (enforced in `mapping.json` or the QA checklist)

1. **Polarity.** Keep SST → pitch positive: 10/10 blind listeners chose it; sighted 11–6 (Walker & Mauney). Untested polarities are labelled "design choice" and tested: rain → density, fresh → higher, FWI → dissonance, NDVI.
2. **Shared scales for any comparison.** One scale for both sides (the GRACE fix).
3. **Maximum simultaneous voices is an open risk.** The "3–4 streams" limit has no primary source [UV]. Default to 2 voices + 1 bed; make solo/mute obvious; measure in the pilot.
4. **Pitch–loudness interaction.** Never encode a second variable in loudness on a pitched voice (Neuhoff et al.). Redundant loudness on the same variable is OK. Proximity gain (I5) and beds (A3/G3) stay fixed.
5. **Speech for exact values.** Sound carries trends; speech and text carry numbers (Umwelt, MAIDR). Every mode has "speak value"; min/max are always available as text.
6. **The GRACE gap must not sound like a requiem.** Neutral texture, the label "no satellite in orbit", no fade-out, no minor key. Use the same texture for every missing-data case.
7. **"Not wetter" must not be dramatised.** Unchanged density rule, no swell, no drought imagery, no erosion effect.
8. **AI never produces numbers.** Captions come from JSON fields. AI explanations cite engine values only. The app works without AI.
9. **No warning-like sounds:** no sirens, megaphone tones, mosque-speaker cadences or BMD signal formats. Bulletins say "for learning, not an official warning".
10. **Ambiguous sounds never carry data.** Shepard–Risset glides are UI-only; scrubbing re-synthesises per frame (I2); raga quantisation always resolves to the exact pitch (H2).
11. **Cultural respect and licences.** Consult a Bengali musician before raga/tala skins; no sacred sounds without advice. Don't embed Chandra audio (no licence found). xeno-canto/Freesound: check each file's licence. Don't re-serve Himawari P-Tree. Tagore *compositions* are usable; existing *recordings* are not.
12. **Events ≠ trends; frame-paired ≠ context.** Every piece states which it is.
13. **One number everywhere:** 0.31 °C in the video, the panel and the captions.
14. **Comparison Player guard (new):** it refuses single-year comparisons unless they are labelled "example years". Windows, number of years, datasets, versions, frame-paired/context and the computed numbers are always visible.
15. **Model ≠ measurement (new):** GEOS-CF, CAMS, MERRA-2, GloFAS, GLDAS, NEX-GDDP and GHG Center fluxes always carry a "model" badge and a distinct timbre family.
16. **Stale data ≠ live (new):** any product older than its freshness limit shows its age and plays with a "recorded" texture.

## 5.6 Keyboard map (Help panel) [TR]

| Key | Action | Key | Action |
|---|---|---|---|
| Arrows | Move cursor 1° (Shift 10°) | D | Describe on/off |
| Enter | Speak value + place | C | Captions on/off |
| Space | Play/pause | G | Game |
| S | Sweep from Dhaka | T | Then vs Now |
| 1/2/3 | Ocean/Rain/Both | L | Legend |
| M | Mute all | P | Provenance |
| H or ? | Help | Esc | Stop/close |
| **Proposed:** 4–9 | Air/River/Water/Forest/Fire/Light | **U** | Proof in unison (C1) |
| **Proposed:** Numpad 1–9 | Jump to region (J1 keypad map) | **Z** | Zoom-the-ear axis (J3) |
| **Proposed:** A / N | Analyze / Listen preset (J2) | **R** | Records carousel (3D) |

## 5.7 Accessibility requirements (must)

Tab reachability with a visible focus ring · ARIA live region · a text alternative for every canvas · captions for every sound event · Describe mode · contrast ≥ 4.5:1 · reduced motion · capped volume, no sudden loud sounds, a clear Stop · a fully audio-only path through Explore and Game · Earth Ear ID comfort check (§6, J4) · low-frequency preset.

## 5.8 The Comparison Player (v1 §25.4)

- **Modes:** sequential (A then B), duet (left/right), overlay (B as a ghost track).
- **Selectors:** window, season, baseline, location, scenario.
- **Disclosure panel:** always visible.
- **Ear-test logger:** randomised "which is later?"; % correct stored with consent, anonymous.
- **Guard:** see guardrail 14.

---
# PART 6: Sonification idea bank (everything, with current data status)

**Golden rule.** Personalisation and music change **timbre only**, never the value → pitch/density mapping. No number appears unless it is verified.

**Data status after runs 1–6:**

| Symbol | Meaning |
|---|---|
| ✅ | Data verified |
| 🟡 | One more check or a design caveat |
| ⛔ | Blocked/dropped route |
| ⚙️ | Needs no new data (UX, engine or people) |

Tiers: **V2** Video 2 (240 s, due 13 Nov; freeze 9 Nov) · **HK** hackathon (live demo, 30-s video, page) · **RM** roadmap · **PK** parked.

## 6.1 The 63 ideas (13 families)

### A. Signature and identity

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test (pass rule) |
|---|---|---|---|---|---|---|
| **A1** | **The Bloop drop** | Each session opens with a water-drop "bloop". Its pitch is today's Bay of Bengal SST (fixed-box median) via f = 220 × 4^((T+5)/40). It fans out into the 4-band latitude motif. Spoken: "Bay of Bengal, 29.x °C, NASA MUR via EIC frame." Shape = branding; pitch = data (say so in the legend) | ✅ 5101 fresh 0.8 d. ⚠️ Day-to-day Bay changes are a fraction of a semitone on the global scale (the whole Bay spans 0.7 st [R1]), so **play the drop on the J3 zoomed axis** | S | **V2** | 5 listeners order 5 days of drops: ≥ 4/5 correct on warmest and coolest |
| **A2** | **"What you're hearing" caption engine** | Auto one-liner from verified JSON fields only: dataset, frame time, mapping rule, value under the cursor, measured error ("Higher = warmer · each semitone ≈ 1.7 °C · MUR check 0.31 °C"). No LLM text. Doubles as screen-reader text | ⚙️ | S | **V2** | 20 captions vs pipeline JSON: zero mismatches |
| **A3** | **Generative bed, procedural voice** | Two separate layers: (1) the procedural data voice; (2) an ambient bed of curated fragments, **chosen** by season or frame type, at **fixed gain**, never by value (No Man's Sky "Pulse" pattern) | ⚙️ | M | HK | A/B with 5 listeners: the bed costs no more than one answer in five on "which region is warmer?" |

### B. Frame-paired live listening (the literal ask)

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **B1** | **Chandra scan with iSonic ticks** | Left-to-right raster across the EIC frame with a visible cursor; soft tick at each row end; bell at frame end; longitude → pan; existing pitch/density rules | ✅ 5101, 4285 | S | **V2** | After one sweep, 5 listeners answer "Is the warm water east or west?": ≥ 4/5 |
| **B2** | **The storm in 48 bars** | One IMERG frame = one bar. **Number of rain voices** = count of 0.1° cells > 1 mm/h in the Bangladesh–Bay box ÷ N (published table). Drop density inside each voice keeps the log rule (Foo "Two Trains") | ✅ 48-frame sequence built | S | **V2** | Voice count = wet-cell count (exact by construction); 3 listeners hear "growing vs shrinking" |
| **B3** | **The normal tone** | Quiet fixed reference = anomaly 0. The data voice bends above or below it by the 5176 anomaly (−4…+4 °C); deviation is heard as interval and beating | ✅ **Passed: 91% sign (≥ 90% criterion), ρ 0.79, offset −0.31 °C** [R2–R3]. Show the offset | M | **V2** | Done (C5176). Next: 3 listeners say "warmer/cooler than normal" correctly at 5 points |
| **B4** | **Marine-heat regime timbre** | Pitch = continuous SST; **timbre switches** at a documented marine-heatwave threshold (breathy bansuri-like below, bowed esraj-like above). Personalisation may swap instruments, never the threshold (LightSound; pulse-oximetry evidence) | 🟡 Hobday et al. 2016 defines a heatwave as above the 90th-percentile climatology for ≥ 5 days. That needs a percentile climatology, not just the MUR anomaly: **source it** | M | HK | Blind A/B, 5 listeners: faster or more accurate detection of "entered heat regime" with the cue |
| **B5** | **The cold wake** | A cyclone's rain spiral crosses the Bay (B2 voices); the SST voice behind it plays lower: the ocean cooled | ✅ **Amphan: −2.79 °C mean, −3.92 °C strongest (12 points)** [R3]. ⚠️ Amphan (2020) is probably older than the SVS frame archive (~2.5 years for SST) [INF], so it is MUR-value-paired, not frame-paired. **Frame-paired version:** a recent storm inside the archive (Montha / Ditwah / Senyar 2025, or **Arnab, 25 Oct 2026** [R3]) | M | **V2** (Amphan as story) / HK (recent storm, frame-paired) | Run K11 on Arnab/Montha; pass = a measurable SST drop along the track |
| **B6** | **Fire Geiger** | Clicks as a Poisson process, **rate = exact hot-pixel/FIRMS count** in a box per frame; FRP → click brightness (filter), not loudness; "no fires" = stated silence | 🟡 FIRMS ✅; 5113 ρ 0.6 (moderate). **Off-season: 0 national detections in 10 days** [R3]. Use Mar–Apr archive dates for demos. **Switch SNPP → NOAA-21 by 2 Nov** | S | HK | 5113 count vs FIRMS: same order of magnitude and clusters ✅ (done) |
| **B7** | **Hearing through haze** | A low-pass filter closes over every voice as Dhaka PM2.5 rises: cutoff 8 kHz → 800 Hz exponential across the stated range; grain density redundant. The Embassy's ~5–6× monsoon-to-winter swing fits without exaggeration | ✅ values (ground 72.2, CAMS 127.1, GEOS-CF v2 50.4 [R5]). ⛔ 5151 frame inversion (stale, 1% match) | M | **V2** (ground voice) / HK (three-layer) | Ground vs models shown together; the bias is stated, not tuned away |
| **B8** | **Tomorrow's fire-weather chord** | Six FWI classes (<10 … >70) → six fixed harmonic states (open fifth → dense cluster). In replay, the following days' fire clicks land on the forecast chord: forecast meets outcome | ✅ 5315 classes decode; daily archive started. Bangladesh is "very low" in Nov: **demo on a global region with active fire weather** | S → M | HK | Classes decode ✅; 7-day archive pairs with FIRMS |

### C. Verification made audible (the deepest moat)

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **C1** | **Proof in unison** | Frame-derived tone and source-file tone together **in one ear**. Identical values = pure unison; any difference = beats whose rate (Hz) = \|f1 − f2\|. Caption: "beats = disagreement; 0.31 °C median ≈ a fifth of a semitone" | ✅ **I1: 28 °C, Δ0.31 → 7.46 Hz expected, 7.5 measured; 1 °C = 0.6 st** [R2] | S | **V2 (flagship)** | ✅ math; next: 3 listeners rank three pairs by error size |
| **C2** | **Extremes-first legend** | Before any mode: today's coldest and hottest verified pixels, then driest and wettest, each with its spoken value (1st/99th percentile, said so). About 8 s | ✅ | S | **V2** | 5 listeners: ≥ 80% correct "closer to hot or cold" on 4 random pixels |
| **C3** | **Pipeline X-ray** | Hover: colour swatch → marker slides along the colorbar → number → note (≈ 1.2 s) → **then C1's unison against the source file** | ✅ built (BP-C2); add the C1 tail | S | **V2** | Timing on the demo machine |
| **C4** | **The honest null** | The monsoon then-vs-now plays deliberately unremarkably: the same density rule, no swell; caption "Not wetter: GPCP −9%, GPCC −12%". Plus a **control** place that barely changed (Dhaka NDVI control 0.274 → 0.260) | ✅ | S | **V2** | Blind "which is later?": a near-chance result *supports* the honest framing; report it either way |
| **C5** | **Freshness as clarity** | MUR `dt_1km_data`: recently measured pixels sound clear; interpolated ones get a reverb tail (**not** a low-pass, which is B7's cue) | ✅ field present [R1] | M | HK | 5 listeners rank 3 pixels by confidence: ≥ 4/5 |
| **C6** | **"Which is later?" ear-test logger** | Randomised A/B of then-vs-now windows; % correct stored (consented, anonymous) | ⚙️ | S | **V2** | ~20 people × 3 pairs before the 9 Nov freeze; publish raw counts as a pilot |

### D. Anomaly and change

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **D1** | **Shared-scale water quartet** | NW India and Bangladesh GRACE bass on **one** cm → Hz scale; optional Dhaka heat as a third voice on its own labelled scale (Crawford "Planetary Bands") | ✅ data; **⛔ the deployed mapping is still per-series (A3 WARN).** I4: shared scale 9.4× vs per-series 1.5× (synthetic); real app data: 9.4× vs 5.9×. **Fixed in `mapping.json` (27 Oct)** | S | **V2** | Fix `mapping.json`; 5 listeners "which fell further?": ≥ 4/5 |
| **D2** | **Twenty-second deep-time prologue** | GISTEMP global annual 1880–2025 in ~20 s on Crawford's 0.03 °C/semitone (59 semitones total); dive into Dhaka; credit Crawford on screen. Keep Bloop's Dhaka scale for Dhaka and print both | ✅ [R1] | S | **V2** | The dive lands under 25 s with captions readable |
| **D3** | **Three voices of one place, then vs now** | Krause stems for one district: **geophony** = IMERG rain density; **biophony** = NDVI pad; **anthrophony** = Black Marble shimmer (voice count) + FIRMS clicks. Window A then window B, same scales | 🟡 All four routes ✅; switch Black Marble to VJ146; **pre-register windows** | M | HK | Each stem's change is computed and printed before anyone listens |
| **D4** | **Two futures, spread as chord width** | Dhaka days > 35 °C, 1995–2014 vs 2081–2100, SSP2-4.5 vs SSP5-8.5: median → pitch/rhythm; **ensemble spread → chord width** | 🟡 NCSS route ✅, one model (36.1 °C Apr–May 2081 mean tasmax) [R2]; **needs about 5 models** | M | RM (HK if time) | 5-model pull; spread computed |
| **D5** | **Sea level with the delta's caveat** | GMSL as a slow rising tone with annual vibrato. A second voice, the Hiron Point tide gauge, **goes silent after 2003**: the gap in local measurement is the point (Paterson's "the medium carries meaning") | 🟡 GMSL file ✅ (units/reference open); PSMSL ✅ | M | HK | Overlay 1993–2003 GMSL vs Hiron Point; both captioned |

### E. Bangladesh stories

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **E1** | **Follow the water (suite)** | Six movements, one instrument each, short silences between them: rain (IMERG drops) → storage (GRACE bass) → rivers (SWOT notes) → flood (OPERA chords) → salinity plume (SMAP) → sea level (D5). Label each "frame-paired" or "context" | 🟡 IMERG ✅, GRACE ✅, SWOT ✅ (1 strong reach), OPERA 🟡 (cross-sensor), SMAP SSS ✅ (6 psu), GMSL 🟡. Landslide movement demoted (LHASA archive ended) | L | HK (movements 1–3) / RM | 3 listeners name the variables after the first two movements |
| **E2** | **Three chords of August 2024** | OPERA DSWx for 5 May, 9 Aug, 21 Aug 2024: Feni–Noakhali–Cumilla water fraction → chord density; inundated vegetation (radar under canopy) → the same chord muffled | 🟡 Run result (0.000 → 0.081 → 0.798) **mixes HLS optical and S1 radar**: redo with **DSWx-S1 on one MGRS tile** for all three dates. Charter 905 for illustration | S | HK | The S1-only fraction rises across the three dates on one tile |
| **E3** | **River reaches as notes** | Each SWOT reach (Padma/Jamuna/Meghna) = one note; WSE → pitch on a shared metre scale; the chord rises through the monsoon; sparse ~21-day revisits = sparse notes (no interpolation); optional plucked, Bhatiali-coloured timbre | ✅ **43499600141: 36 passes, 8.06 m** [R3]; neighbours 0.9–1.5 m. **Find 3–5 more high-swing reaches** (Padma, Meghna, upper Jamuna) | M | **V2** (1 reach) / HK (chord) | ≥ 3 reaches with ≥ 3 m swing and ≥ 8 passes |
| **E4** | **The morning thunder score** | 24 h × 12 months percussive score from the LIS/OTD climatology; flash density → drum-hit density; the pre-monsoon sunrise-to-midday peak becomes a recurring "morning storm" motif. **No death "toll bells"**: cite deaths in text only | ✅ `lolrdc` has 24-step variables (LRDC_COM_FR, LRDC_LIS_FR, …) [R2] | M | HK | Extract the Bangladesh cell; check the documented 69% pre-monsoon share |
| **E5** | **Dhaka air, three honest layers** (absorbs Planet FM) | (a) MERRA-2 daily PM2.5 → filter cutoff (B7 rule); (b) ACAG monthly → slow bass; (c) ground → click voice (Embassy hourly to 4 Mar 2025, then DoE/OpenAQ). **On 4 Mar 2025 the Embassy voice stops**, with a spoken "the monitor went quiet". Each layer labelled | ✅ MERRA-2, ✅ ACAG links, ✅ OpenAQ; 🟡 Embassy Excel by hand (scripted access 403). **Test 4 (MERRA-2 vs Embassy r) not yet run** | M | HK | MERRA-2 vs Embassy daily 2016–21: r near 0.6, else use monthly |
| **E6** | **The sweet-water plume** | SMAP SSS, northern Bay: fresher → higher, purer tone; post-monsoon N→S pan follows the plume | ✅ **15.8 vs 21.8 psu** [R1] | M | HK (V2 possible) | Polarity mini-test (5 people) |
| **E7** | **Night-light rests** | Black Marble radiance for Dhaka/Chattogram → number of shimmering voices; storm outages → rests whose length = outage days | 🟡 Radiance ✅ (25–32); **Remal inconclusive** (clouds); switch to VJ146 | M | RM | Find a clear-sky outage date seen in both sensors |

### F. Partner-agency duets (independence said out loud)

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **F1** | **Two agencies, one monsoon** | IMERG (left) and JAXA GSMaP (right) on identical rules; mono mode: **chord width = their difference**. Spoken: "partly independent: both use GPM microwave satellites" | ✅ **r 0.95 over 10 July days** [R5] | M | **V2** / HK | Extend to Jun–Sep (≥ 60 days) and report the r |
| **F2** | **Three-ocean SST triad** | MUR, JAXA AMSR2 (microwave, the most independent) and NOAA OISST (or UK OSTIA) as a 3-note chord at the cursor; unison = agreement | 🟡 Values ✅ (MUR 30.18, AMSR2 31.39, OSTIA 30.10 vs MUR 29.76, OISST 29.98). **Same-day matching + skin-vs-foundation note required** | M | HK | 10 Bay points, one date: all three within a stated tolerance |
| **F3** | **Coral heat at St Martin's** | 5176 anomaly + NOAA CRW Degree Heating Weeks at Bangladesh's only coral island; DHW → slow tremolo depth on the B3 voice | ✅ **DHW 1.4–2.1 → 3.2–4.0 °C-weeks in 9 days** [R1–R2] | S | **V2** / HK | Source the CRW alert-level thresholds before quoting "alert" |
| **F4** | **NISAR spotlight** (NASA–ISRO) | One pre-processed Sundarbans/haor scene: backscatter → grain density, Chandra-style scan | 🟡 10 scenes, ~6.6 GB each [R1–R2]; provisional | L | RM | One scene subset under 1 GB |
| **F5** | **Sky duet with GLOBE observers** | A matched GLOBE cloud observation (ground voice) vs its satellite match: "two perspectives, not right vs wrong"; "delayed duet" | ✅ CSV route (831 BD obs, 139 locations, 2025); `globe_duet.json` built; ⛔ live API (202, empty) | S | HK | Duet file has ≥ 20 unique place-days |

### G. Natively audio layers

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **G1** | **The monsoon's heartbeat** (IMERG audification) | A Dhaka half-hourly IMERG series as a 44.1 kHz waveform. The diurnal cycle comes out at ≈ 919 Hz with a ≈ 1.84 kHz harmonic; the annual cycle is a ≈ 2.5 Hz throb; ~25 years ≈ 10 s. Loudness of the tone = strength of the daily cycle. Pair it with a spectrogram | 🟡 Possible but slow: **12–13.8 h per cell-year** [R1–R2]; Final ends Sep 2025, then Late (label the switch). **Start an overnight job now** so HK has 2–5 years | M | HK (if started now) / RM | FFT of 1 year shows a 1/day peak |
| **G2** | **Ground that shakes** | One pre-rendered audification of a real regional quake (miniSEED → ObsPy → WAV) as a labelled secondary layer | ✅ **Mandalay M7.7 (2025) at IU.CHTO → `G2_quake_CHTO_400x.wav`** [R1–R2] | S (done) | HK | Audible P/S arrivals ✅; credit EarthScope/NSF |
| **G3** | **Real rain under measured rain** | A team-recorded Bengali monsoon field recording (tin roof, river) at **fixed gain** under IMERG's synthetic drops; variant: NOAA hydrophone audio under SST (global framing) | 🟡 Freesound 0 CC0 (one query), xeno-canto NC → **record our own** | S | **V2** | 3 listeners: the bed doesn't mask the drops |

### H. Bengali and raga layer, value-safe

**Invariant:** snapping a value to a raga's 5–6 swaras is many-to-one, so it breaks exactness. Raga lore chooses **presets, drones, gridlines and clocks only, never pitch**. Megh (thaat Kafi; no Ga, no Dha) is a rain raga sung through the rainy season.

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **H1** | **Megh drone by season** | Tanpura-style Sa–Pa drone + soft Megh pad loads for frames dated Jun–Sep; a different preset in the dry season (e.g. Basant/Bahar for spring); drone on a **fixed** Sa | ⚙️ frame metadata; musician sign-off | S | **V2** | 5 listeners: no drop in warmer/colder accuracy with the drone on |
| **H2** | **Swara + meend residual** | Musical mode: snap to the nearest Megh swara, then glide (meend) to the **exact** pitch; the glide depth = the residual | ✅ **I3: settles within 0.0000 cents over 200 values** [R2]; idiom needs musician sign-off | M | HK | ✅ math |
| **H3** | **Raga gridlines** | Megh swaras sound very faintly as tick marks; the continuous voice sits between them ("just above Pa") | ⚙️ | S | HK | 3 listeners: better "higher or lower than before?" |
| **H4** | **Tala as calendar clock** | Khol/tabla theka: one cycle = one year; a printed beat → month table; sam (beat 1) at the start of June; data events placed on the clock, the drum never carries a value | 🟡 A 12-beat option (teentaal's 16 doesn't divide into 12 months) needs a tabla player | M | HK | A tabla player signs off the table |
| **H5** | **Synth-built Bengali ensemble skin** | Karplus–Strong ektara/dotara plucks for sparse events (fires), breath noise + sine "bansuri" for SST, membrane-model khol for the clock; credited "synthesised" | ⚙️ (no CC Bengali sample library found) | M | HK | 3 listeners still separate the fire and SST voices |
| **H6** | **Dataset leitmotifs** | A 2–3 s motif per dataset, played only on entry as a navigation earcon (boat-song-like for rivers…). Avoid sacred sounds (conch) unless a consultant agrees | ⚙️; the Bhatiali association is unverified | S | HK | 5 users identify ≥ 3/4 motifs after one exposure |

### I. Interaction metaphors (metaphor drives navigation, never mapping)

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **I1** | **Bloop Betar: the station dial** (absorbs Planet FM's FM) | A tuning dial; each frequency is a dataset station; tuned pink-noise static between stations; on a station, a 6-s Bangla/English bulletin of verified values, then the live sonification; arrow keys tune. **Merges with the 3D record carousel (3D-1)** | ⚙️; must not imitate BMD/Betar branding | M | **V2** (as carousel) / HK | 3 people find "rain" in under 10 s |
| **I2** | **DJ scrub with re-synthesis** | Drag to scrub the time-lapse; audio re-synthesised per frame (never a resampled buffer) | ✅ I2 [R2] | S | **V2** | ✅ |
| **I3** | **Earth stethoscope** | Cursor = chest-piece; the value sets a heartbeat **tempo** by a printed linear formula (e.g. 50 bpm at frame min → 140 bpm at max), redundant with pitch | ✅ (Walker & Mauney: tempo:temperature, BLV 6 positive vs 2 negative) | S | HK | 5 listeners find "faster = warmer" natural: ≥ 4/5 |
| **I4** | **The music-box year** | A rotating pin cylinder: each pin = a real event on its date (IBTrACS landfalls, OPERA flood dates, FWI extremes) | ✅ IBTrACS [R1–R2] | M | HK (3D-6 cabinet) | 2024 NI storms' dates match IBTrACS |
| **I5** | **Approach and listen** | On the global cube, rotating a region toward you fades its datasets in by proximity (gain only, values untouched; Outer Wilds pattern) | ✅ global cube | M | HK (3D-1) | 3 users don't mistake proximity loudness for value |
| **I6** | **Earth pattern composer** | Type or arrange ("rain fire haze") to set the **order and mix** of locked stems; export | 🟡 Strudel licence (possibly AGPL); a home-grown sequencer avoids it | M | RM | Output stems identical to solo playback |

### J. Accessibility and BLV

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **J1** | **Keypad map + classify mode** | The 3×3 numeric keypad jumps to regions; arrows move to neighbours; "classify" mode = 5 pitch bins (iSonic: 95% vs 33% task success) beside the continuous "trend" mode | ✅ | S | **V2** | 2 BLV or blindfolded users find the warmest region (success + time) |
| **J2** | **Listen / Analyze presets + modality keys** | "Listen" = musical bed + H1 drone; "Analyze" = plain tones, continuous pitch, spoken ticks, speed slider. Single keys toggle Sound / Text / Review (MAIDR). Local storage remembers preferences | ⚙️ | S | **V2** | Mode switch under 2 s |
| **J3** | **Zoom the ear** | A legend-declared regional axis: for the Bay, 26–32 °C over 2 octaves, spoken and captioned like a y-axis zoom. Never mix zoomed and global scales in one comparison | ✅ **Need proven: the Bay spans 0.7 semitones on the global scale** [R1] | S | **V2** | 5 listeners rank 4 Bay points: more accurate zoomed |
| **J4** | **Earth Ear ID + low-band preset** | 60-s comfort check: ~8 frequency bands + a loudness ceiling → monotonic compress/shift of the output range; one-click low-frequency preset | ⚙️ "Comfort check, not a hearing test"; on-device only | S | HK | One older adult; within-subject generic vs calibrated |
| **J5** | **Count-pulse haptics** | Android only: pulse count = a discrete value (FWI class 1–6; fire clusters in view); feature-detect; never core | 🟡 Browser check pending; iOS Safari unsupported | S | HK | 2 Android phones |
| **J6** | **Touch-the-delta + YPSA co-design hour** | A swell-paper or 3D-printed river map of Bangladesh used with Bloop (pairs with 3D-4); one Accessible Oceans-style co-design session through YPSA (Chattogram; over 80% of its team members have disabilities; it already produces Bangla accessible audio) | ⚙️ people; consent; no filming without permission | M | HK (**contact this week**) | A session date secured |

### K. Education, kiosk and broadcast

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **K1** | **Daily Bangla rain bulletin** (radio + IVR) | Auto 60-s MP3: a plain-register Bangla voice reads verified IMERG values for coastal districts, then 20 s of sonification; IVR variant ("press 2 for Chattogram"). "Education and context, not an official warning" | 🟡 Bangla TTS on devices unknown (browser check), so **use a recorded team voice**; IMERG ✅; districts ✅ (64) | M | HK | 3 naive listeners name the rainiest district |
| **K2** | **Bay of Bengal sea-area poem** | Fixed-order cadenced bulletin: region, variable, value, trend ("Northern Bay. Sea surface twenty-nine point four. Rising."), each line followed by its tone; team-named areas, not official ones; borrow the Shipping Forecast cadence, not BBC content | ✅ 5101/5176 | S | **V2** (voice-over) | Every number matches the JSON |
| **K3** | **EIC kiosk audio mode** | Touch or press a region on a 7680×2160 layout; hear the current frame with a spoken description | ⚙️ | M | HK (after 28 Oct) | Readable and playable with 3 touch points |
| **K4** | **"Sound of a monsoon year" lesson pack** | 40-min class: H4 tala-clock year, C2 legend, a "Warmer or Colder?" round, a predict-then-hear worksheet | ⚙️ | M | RM | One teacher uses it without the team present |
| **K5** | **"What did my district sound like this week?"** | Pick a district; a 15-s digest of rain (IMERG), haze (**ground/GEOS-CF, not 5151**) and fires (FIRMS) on fixed scales, spoken values; optional population weighting (GPW) | 🟡 Routes ✅; district aggregation stated | M | HK | Built for 2 districts; 3 people say it answers a question they have |

### L. Sharing and participation

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **L1** | **Audio postcard with provenance** | 10–20 s audio + frame image, with dataset, frame time, mapping rule and measured error in the caption and metadata | ⚙️ | S | HK | A teammate reconstructs the source from the metadata alone |
| **L2** | **Listen-and-report (Citizen Ear)** | Users flag "this sounds wrong"; each flag is auto-checked (deviation band, MUR freshness, NASA/JAXA disagreement) and labelled *real anomaly / artefact / unexplained* (HARP precedent) | 🟡 Auto-check inputs ✅ (dt_1km, duet) | M | HK | 3 seeded artefacts are all labelled correctly |
| **L3** | **Letter to the future** | A dated card read aloud: "Bay of Bengal, [date]: sea surface [x] °C, [y] °C above normal. Measured by NASA MUR, checked by Bloop." Neutral tone, no mourning music (Okjökull plaque) | ✅ (use the refreshed values) | S | **V2** (ending) | 3 people: sincere, not preachy |

### M. Performance and video moments

| ID | Idea | Exact mapping | Data status | Effort | Tier | Fast test |
|---|---|---|---|---|---|---|
| **M1** | **"Close your eyes" opening** | 10 s of black screen and real data sound → "Now open your eyes" → the frame fades in | ✅ built (BP-C1) | S | **V2** | ✅ |
| **M2** | **A human plays Bloop's score** | Export the verified notes of one track (D1 quartet or the Dhaka heat line) as MIDI/notation; a team member or local musician plays it on dotara, esraj or cello; show the exact line alongside | ⚙️ people | M | **V2** (if a musician is free) / HK | Pitch errors under a semitone over 16 bars |
| **M3** | **The eroded song** (interpretation mode) | A team-performed Tagore borsha melody (composition public domain since 2001; own recording) loses waveform data by a **stated** ratio (e.g. NW India GRACE anomaly / its 2003–06 range). Variant: a Paterson-style melting record of sea ice (5099). Labelled "Interpretation, not measurement". Never for Bangladesh's small signal or the "not wetter" result | 🟡 GRACE ✅; ethics test | M | RM | 5 listeners rate "communicates data" vs "manipulative"; ship only if most say the former |

**Count:** A 3 · B 8 · C 6 · D 5 · E 7 · F 5 · G 3 · H 6 · I 6 · J 6 · K 5 · L 3 · M 3 = **63**. Of these, 30 are NEW, 20 EXTEND an existing item and 13 are re-prioritised existing items. Folded-in variants (K1's IVR, G3's hydrophone, M3's melting record, J6's blind listener) are not counted separately.

### X. Cross-cutting ideas added during testing

| ID | Idea | Data status | Tier |
|---|---|---|---|
| **X1** | **Live event layer:** USGS quakes + EONET events + SWPC solar wind via the cache; DONKI optional | ✅ USGS, EONET, SWPC; ⛔ DONKI (503 ×3) | HK |
| **X2** | **Satellite-pass cues ("who is measuring now")**: CelesTrak + satellite.js (SGP4), checked against published passes; 5067 as the visual | ✅ G6 | HK (3D-5 orrery) |
| **X3** | **Every EIC area has a voice:** the nine areas each backed by ≥ 1 verified route | ✅ 9/9 (§4.7.1) | **V2** (the record carousel shows all 9) |

---
## 6.2 The 15 project architectures (v1 §3): now modes of one engine

| # | Architecture | Central interaction | Status now | Biggest weakness → repair |
|---|---|---|---|---|
| A | **Verified Earth Instrument** | Play any EIC frame; sound from inverted values; truth panel shows error vs source | **Built core** (5101, 4285) + 5176 ready | Feels technical → pair with E/D stories + C1 audible proof |
| B | **Earth Orchestra** | Several EIC tracks as voices: SST drone, rain percussion, fire hits, air breath, vegetation line | 9 voices now possible (§5.4); mixer built | Cacophony → solo/mute; default 2 voices + bed; measure separation |
| C | **Earth Detective** | Audio-first clues from a real event; find where and when | Amphan, Aug 2024 floods, Mandalay quake, Arnab are available | Game risk → every clue is a real frame value; reveal provenance |
| D | **Accessibility-first Earth Explorer** | Keyboard/touch/screen reader: gist → navigate → details | Basic built; J1/J2/J3 next | Needs BLV co-design → YPSA (J6) |
| E | **Monsoon Watch** | 30-min IMERG over South Asia/Bangladesh; time-lapse + latest | Built (time-lapse) | Narrow → the same engine works globally (global cube) |
| F | **Provenance Jukebox** | Pixel → value → file → satellite; GPM-constellation passes as cues | Provenance drawer built; CelesTrak ✅ | Orbit accuracy → check against published passes |
| G | **Uncertainty-aware Jukebox** | Confidence → clarity/loudness (MUR `dt_1km_data`, analysis error, IMERG quality) | `dt_1km_data` ✅ | Precedent exists → claim only the live-product application |
| H | **Two-Agency Duet** | IMERG vs GSMaP (r 0.95); MUR vs OSTIA/AMSR2 | ✅ data | Shared inputs → "algorithm disagreement, partly independent" |
| I | **EIC Exhibit Sound Layer** | Kiosk/hyperwall: visitors touch regions; room speakers or headphones | Concept | Can't test on a real hyperwall → simulate 7680×2160 |
| J | **Earth Time Machine** | Then vs now; ~2.5-year SST archive; anomaly mode | Then vs Now built; 5176 ready | Long records may not be EIC frames → label the source |
| K | **Human–AI Listening Lab** | Humans, an audio-language model and a deterministic detector answer the same questions | Research | No benchmark found → research-only extra |
| L | **Collaborative Jam** | Several users each control a voice/region in one session | Concept | Networking → optional |
| M | **Daily Earth Audio Bulletin** | Auto 60-s segment (sound + spoken summary) for radio/WhatsApp | K1 | Speech computed from data |
| N | **Young Explorer** | "Guess the ocean by ear", "find the storm" (Beginner/Youth tag) | Game built ("Warmer or Colder?") | Under-18 rule → adults on camera only |
| O | **Spatial Earth Soundscape** | Globe around the head (HRTF); phone gyroscope steers | 3D-1/3D-16 | Mobile support → progressive enhancement |

**Blueprints that were proposed:**
- **"Verified Earth Jukebox":** A + B + D + F + G, with E as the showcase. This is what was built.
- **Alt-1 "Monsoon Watch":** E + C + M + H. Regional depth; depends on D2, which passed.
- **Alt-2 "EIC Exhibit Orchestra":** B + I + O + N. Exhibit-ready; validation is lighter unless the truth panel is kept.

**Part 8 recommends a fusion:** the Verified Earth Jukebox core, presented as a 3D jukebox world, with Alt-1 and Alt-2 elements as modes.

## 6.3 The 34-feature inventory (v1 §4) with current class

| # | Feature | Then | **Now** | Maps to |
|---|---|---|---|---|
| 1 | Frame-locked playback | NOW | **Built** | — |
| 2 | Colorbar inversion engine (linear + log) | NOW | **Built** (SST, rain); anomaly ready | — |
| 3 | Truth panel | NOW | **Built** (update the plot) | C1, C3 |
| 4 | Audio legend | NOW | Built (BP-A4); upgrade to C2 | C2 |
| 5 | Mapping Spec page | NOW | **Built** | A2 |
| 6 | Keyboard + spoken details | NOW | **Built** (basic) | J1 |
| 7 | Gist sweep from location | NOW | **Built** | B1 |
| 8 | Synced visual cursor | NOW | **Built** | — |
| 9 | Rain via IMERG `flatalpha` | CORE-OK | **Built + verified** | — |
| 10 | Fires (5113) percussion | CORE-OK | HK (FIRMS values) | B6 |
| 11 | NDVI slow voice | OPT | HK (catalogue route; 5544 stale) | D3 |
| 12 | Air-quality breath (GEOS-CF) | CORE-OK | V2/HK (values; no frame inversion) | B7, E5 |
| 13 | Mixer solo/mute | CORE-OK | **Built** | — |
| 14 | Spoken 3×3 summaries | CORE-OK | V2/HK | BP-B5/B6 |
| 15 | Grounded AI Q&A | CORE-OK | HK (AI-1/AI-2) | §6.8 |
| 16 | Automatic colorbar reading (CV + vision model) | CORE-OK | HK/RM (AI-5) | — |
| 17 | Uncertainty as clarity | CORE-OK | HK | C5 |
| 18 | Two-agency duet | OPT | **V2/HK** (r 0.95) | F1, F2 |
| 19 | Provenance click-through | CORE-OK | **Built** | — |
| 20 | Satellite-pass cues (SGP4) | OPT | HK | X2, 3D-5 |
| 21 | Music vs precise mode | CORE-OK | V2 (presets) | J2 |
| 22 | Raga time/season encoding | OPT | V2 (H1) | H1–H4 |
| 23 | Style skins | OPT | HK | H5 |
| 24 | Anomaly mode (`sst_anomaly`/5176) | CORE-OK | **V2** | B3 |
| 25 | Extreme pings | NOW | **Built** | — |
| 26 | Touch-drag continuous sound (TactualPlot precedent; needs practice) | CORE-OK | HK | — |
| 27 | Vibration (Android) | OPT | HK | J5 |
| 28 | HRTF spatial audio | OPT | HK (3D) | 3D-1, 3D-7 |
| 29 | Kiosk/hyperwall mode | OPT | HK after 28 Oct | K3 |
| 30 | Daily audio bulletin | OPT | HK | K1 |
| 31 | Young Explorer mini-games | OPT | HK | §6.9 |
| 32 | In-app listening study (consented) | CORE-OK | **V2 (pilot)** | C6 |
| 33 | Mapping optimisation from listener data | RESEARCH | RM | — |
| 34 | Rain nowcast (optical flow; pySTEPS) | RESEARCH | RM (GSMaP/RIKEN nowcast exists) | — |
| — | AI-generated music as the data sound | **NO** | NO (allowed only as a separate, labelled interpretation mode) | — |
| — | Prithvi-WxC in the core loop | RESEARCH only | RESEARCH only (2.3B parameters; no Jukebox need) | — |

## 6.4 The 17 unusual combinations (v1 §5)

| # | Combination | Status |
|---|---|---|
| 1 | Verified SST + analysis-age clarity (`dt_1km_data`) + spatial audio | Data ✅ |
| 2 | IMERG + GSMaP in the other ear | ✅ r 0.95 |
| 3 | VIIRS fires + GEOS-CF PM2.5 + wind (5148): fire starts, smoke "breathes" downwind | Fires ✅, PM2.5 values ✅, wind frame ✗ (use GEOS-CF wind values) |
| 4 | Frame-locked cursor + known-answer anomaly test (labelled synthetic hotspot) | ⚙️ (Hotspot Hunt) |
| 5 | Satellite passes + IMERG freshness: a new rain "note" arrives with a GPM pass | CelesTrak ✅ |
| 6 | Raga season encoding + IMERG monsoon onset | ⚙️ H1 |
| 7 | AltGeoViz summaries + grounded AI Q&A + keyboard: an Umwelt-like shared cursor | ⚙️ |
| 8 | Automatic colorbar reading + truth panel: "N of M EIC products pass" | 11 frame-pairable items (10 after L4); 3 pass, 3 dropped |
| 9 | Earth Detective + provenance reveal | ⚙️ |
| 10 | Daily bulletin + Bangla narration + community radio | K1 |
| 11 | Kiosk + multi-touch + orchestra mixer | K3 |
| 12 | Music vs precise mode + in-app study | J2 + C6 |
| 13 | Anomaly SST + then vs now + culture skins: an "ocean memory" suite | 5176 ✅ |
| 14 | Mapping optimisation + Young Explorer (games as magnitude-estimation trials, consented adults) | RM |
| 15 | MUR vs OSTIA duet + GHRSST ensemble spread | OSTIA ✅; GMPE data access unknown |
| 16 | Human vs audio-LLM listening on the same verified sound | Research |
| 17 | Hyperwall layout + HRTF + phone as personal headphones | 3D-17 |

**Radical idea matrix (v1 §5b), still valid:**

| Theme | Rows |
|---|---|
| Rain | IMERG(+GSMaP) monsoon onset with two ears; predict the next frames |
| Ocean | MUR + `dt_1km_data` "where NASA didn't look"; MUR anomaly archive "the ocean remembers" |
| Fire | Fires + PM2.5 + wind "trace the smoke" |
| Satellites | GPM constellation "catch the satellite" |
| Testing | A synthetic injected hotspot (labelled) as a detection test |
| Whole Earth | 25 EIC products as the whole-Earth orchestra with an "N of M pass" scoreboard |

## 6.5 Idea parking lot (never deleted)

| Idea | Origin | Status |
|---|---|---|
| Cultural idiom as musical language | Sayqal | Adapted as H-family (culture encodes time and style; values locked) |
| Long time depth | Sayqal | J architecture, #24, global cube |
| TEMPO air quality | Stack Underflow | Not over Bangladesh: contrast line only |
| GIBS exact colormaps | Stack Underflow, mcgibs | **Used** (G7, K15) |
| Kids and storytelling | Planet Buddy | N, K4 |
| Orbital mechanics | Orbit team | F, X2, 3D-5 |
| POWER/GRACE series | Build guide | "Your location over decades" context (POWER solar only) |
| Physical walk-through installation (UWB) | Astral Arias 2023 | Kiosk + 3D-17 if hardware exists |
| K-means clustering for structure | Area Six 2023 | Structure the gist sweep by clusters; test |
| Glasses/microcontroller device | BlindX 2023 | Future |
| Theme sets (e.g. "love") | Cinta 2023 | Curated story playlist |
| Lightning as sparse percussion | Research | **E4 has data** (LIS/OTD climatology) |
| Space weather / geomagnetic sound | ESA Swarm "sound of Earth's magnetic field" (2023 resources) | X1 (SWPC ✅) |
| Prithvi-WxC "Earth memory" similarity search | NASA–IBM | Research only |
| VR/WebXR | 2025 Deep Dive lineage | 3D-16 |
| Frame-to-Spectrum (inverse FFT of value profiles) | Proposal 2 | OPT secondary overview |
| Multi-player Earth Jam | L architecture | OPT |
| Spectrum-to-timbre (PACE hyperspectral bands as additive partials) | Catalogue | PK (high novelty, high effort) |
| NOAA hydrophone ocean bed | Catalogue | G3 variant |
| EMFISIS plasma-wave audio | Catalogue | PK |
| Rain nowcast track | #34 | RM |
| "Bloop" name hook from the famous underwater "bloop" recording | Ideas doc | **Unverified: find a primary NOAA source before mentioning it anywhere** |

## 6.6 The seven sound-design proposals (v1 §23.1–23.3) and their verdicts

| Proposal | Verdict | Rule / repair | Class now |
|---|---|---|---|
| 1. **Anomaly Choir** (deviation from baseline; consonant near normal, dissonant when unusual) | Core mode | Official baselines only (IMERG climatology via 4897; MUR `sst_anomaly`/5176); a few discrete bands; symmetric (cold = warm); dissonance = "unusual", not "bad". Novelty CONTRADICTED (HadCRUT3 panning; USPTO 9918679), which **supports** the design | V2 (5176 passed) |
| 2. **Frame-to-Spectrum** (inverse FFT per frame) | Secondary overview | Spectralise the *converted value profile* (pole-to-pole or a transect), never raw RGB. No novelty claim (STRAUSS Spectraliser; Cinta). Spectral audification carries information (Trayford 2023: 58 listeners) | OPT |
| 3. **Elemental Jukebox** (crackle / patter / whoosh, strictly mapped) | **Default sound style** | Rain → patter density (IMERG); fire → crackle (FIRMS); wind → whoosh (GEOS-CF values, not the 5148 frame) | Built (rain) → HK |
| 4. **Musified Earth** (rule-based generative score, game-style) | Stretch layer | Exact data layer + a musical scaffold that follows it; **the music may never resolve or smooth away an extreme**; precise mode always available (Nagai 2024 string quartet includes hand-written, non-data parts) | RM → A3 |
| 5. **Geo-Spatial Choir** (panning by map position) | Channel | = #28 | HK (3D) |
| 6. **Citizen Ear** | Keep | Auto-checked flags; labels; never promise discoveries | HK (L2) |
| 7. **Multi-Instrument Planet** (one family per EIC theme + mixer) | Base layer | Only themes with verified voices: **now all nine** | V2 (carousel) |

## 6.7 Ten more concepts (v1 §23.4)

| # | Concept | Status |
|---|---|---|
| 1 | **Change Choir:** sonify the difference between consecutive 30-min IMERG frames; storms move and grow | ✅ sequence exists → HK |
| 2 | **Threshold bells:** a bell where the ocean crosses the SST level commonly cited for tropical-cyclone formation (**verify the threshold from a primary source**) | HK |
| 3 | **Listening transect:** draw a line (Dhaka → Bay) and hear the values along it | HK |
| 4 | **Honest silence:** no-data and cloud-gap areas are silent or muffled; clarity follows recency | Built (silence) + C5 |
| 5 | **Two-clock Earth:** slow daily SST drone + fast 30-min rain rhythm; the daily storm cycle becomes audible | V2 (both tracks exist) |
| 6 | **Personal soundmark:** your location today vs its normal, as a 10-s shareable clip | HK (L1) |
| 7 | **"Explain this sound":** grounded AI explains *why* a region sounds dissonant, using code-computed numbers | HK (AI-1) |
| 8 | **Before/after duet:** the same place today and a year ago, left and right ears | HK (needs a frame archive: 5101 ~2.5 yr; 5315 we archive) |
| 9 | **Ensemble honesty meter:** chord width follows NASA–JAXA disagreement | ✅ F1 |
| 10 | **Listening-legend warm-up:** an automatic 30-s tutorial before any mode (Chandra's study shows people misread sonifications without one) | V2 (C2) |

## 6.8 AI / agentic features (v1 §24): "AI never produces a number"

| # | Feature | What happens | Precedent | Class now |
|---|---|---|---|---|
| AI-1 | **Check the AI by ear** | The AI answers ("heaviest rain near Dhaka is south-east"), then plays that region so the user verifies it by listening; the truth panel shows the NASA value | MAIDR meets AI (ASSETS 2024): blind users asked for ways to verify AI answers | HK |
| AI-2 | **Ask the Earth** (voice agent) | Spoken question → agent fetches the frame → engine converts → cursor moves → sound → spoken answer with source | NASA/Microsoft Earth Copilot (open source, MCP server); Talk2Data | HK |
| AI-3 | **AI vs Verified** | A frontier vision model reads a value off the EIC picture; shown beside the engine and the NASA source | Multimodal models misread colormap legends (arXiv 2601.12585; ThermEval) | **Run as an experiment first**; show measured results only. A strong 30-s moment if the gap is large [HYP] |
| AI-4 | **Self-checking daily sonic tour** | Agents plan → narrate → **a verifier checks every number** against the value grids → a 60-s tour synced with frames; events found by scientific rules (Hobday heatwaves) | Data Player (TVCG 2023); DataReel | Stretch |
| AI-5 | **Self-teaching tracks** | An agent reads an SVS page, finds frames and colorbar; a vision model reads **tick labels only**; the truth test decides admission | Poco et al. 2018 | Stretch (our tick detector already reads 5176's 9 ticks) |
| AI-6 | **Jukebox MCP server** | `get_value`, `play_region`, `verify_track`, so any AI assistant can "play the Earth" with verified notes | Earth Copilot MCP | OPT |

**Guardrails:** no AI-generated numbers · every answer cites its source · the app works without AI · AI use disclosed on the project page (including AI coding help).

## 6.9 Games (v1 §22): score = accuracy against real data

**Rules:**
- Points only for answers that match the values.
- Every round ends with the truth: frame, value, NASA file.
- Playable by ear and keyboard.
- With consent, rounds double as evidence.
- Kids: no personal data, no public names, no minors on video.

| Game | How it works | Data (status) | Class now |
|---|---|---|---|
| **Warmer or Colder?** | Hear two ocean regions; pick the warmer | 5101 ✅ | **Built** (+ blindfold mode BP-C5) |
| **Guess the Place by Ear** | Hear a region; tap where; score by distance | SST, rain ✅ | HK |
| **Will It Rain Here?** | Last few 30-min IMERG frames around a city; predict the next; checked automatically against the real next frame | 4285 ✅ | HK |
| **Earth Detective** | Audio case file from a real event (Amphan; Aug 2024 floods); find where and when | ✅ | HK |
| **Hotspot Hunt** | Find a **synthetic, labelled** hotspot hidden in real SST, by ear / eye / both | ⚙️ | HK (known-answer detection test) |
| **Two Agencies, One Storm** | NASA left, JAXA right; find where they disagree | ✅ r 0.95 | HK |
| **Catch the Satellite** | Predict when a GPM satellite passes; hear it arrive | CelesTrak ✅ | HK |
| **Earth Jam** (multiplayer) | Each player controls one Earth system; goal: "play fire → smoke" | Fires, PM2.5 values | OPT |
| **Ocean Thermometer** (young explorers) | Hold a key to "dip" into the ocean; warm or cold; badges | 5101 ✅ | HK |

## 6.10 The comparison catalogue (v1 §25): every audible "then vs now"

**Rules:**
1. Windows, not single years.
2. Define "erratic" before listening.
3. State the baseline.
4. Pre-register the list and include a control.
5. Flag sensor switches.
6. An event is not a trend.
7. Blind ear test "which is later?" (report % even if low).
8. Say whether each item is frame-paired or context.

Status updated with run data. **[D]** = documented in the literature; **[C]** = compute it ourselves.

| # | Comparison | Data | Status now |
|---|---|---|---|
| A1 | Bangladesh hot season 1981–90 vs 2016–25 | ~~POWER~~ → **GISTEMP** | ✅ **+1.37 °C** (POWER failed) |
| A2 | Humid heat (wet-bulb/heat index) then vs now | POWER ✗ → ERA5 (Open-Meteo) | [C], needs an ERA5 check |
| A3 | Monsoon rainy-day rhythm 2001–05 vs 2021–25 | IMERG daily | [C] (pre-register "erratic") |
| A4 | Bay pre-cyclone SST (Apr–May) 2003–07 vs 2021–25 | MUR; SVS 5600 if it passes the checklist | [C] |
| A5 | Groundwater bass, NW India vs Bangladesh | GRACE | ✅ (+ wells r 0.93) |
| A6 | Ice sheets losing mass | GRACE Greenland/Antarctica | [D]; global cube has West Greenland |
| A7 | Arctic September sea ice 1979 vs recent | NSIDC v4 ✅ | [D] |
| A8 | Global temperature arc since 1880 | GISTEMP ✅ | D2 prologue |
| A9 | CO2 rise with seasonal breathing | Mauna Loa ✅ (+OCO-2) | [D] |
| A10 | Greenness: Sundarbans, CHT, Madhupur | MODIS NDVI | ✅ P4 (+ control Dhaka) |
| A11 | Fire seasons: Punjab Oct–Nov, CHT Mar–Apr, 2003 vs 2023 (MODIS only) | FIRMS ✅ | ✅ P2 numbers |
| A12 | Bangladesh at night 2012 vs 2025 | Black Marble (switch to VJ146) | [C] |
| A13 | Dhaka urban heat island 2003 vs 2023, core vs rural ring (L/R ears) | MODIS LST / ECOSTRESS | [C] |
| A14 | Bay sea level 1993 vs now | Altimetry (GMSL ✅ global) | [C] regional |
| A15 | Sunlight reaching the ground 1984–93 vs 2016–25 | POWER solar (r 0.85 vs ERA5) | [C]; the aerosol link is a hypothesis |
| A16 | Himalayan snow cover 2001–05 vs 2021–25 | MODIS/VIIRS snow ✅ | [C] |
| B1 | Eastern Bangladesh floods, Aug 2024 | IMERG + GRACE-FO + NDVI + OPERA | Event; OPERA S1-only redo |
| B2 | **Cyclone crossing the Bay + cold wake** | IMERG + MUR | ✅ **Amphan −2.79/−3.92 °C**; frame-paired: recent storm |
| B3 | COVID lockdown air, Apr 2019 vs Apr 2020 | OMI NO2 (GIBS decodes OMI AOD) | [C] for Dhaka |
| B4 | Refugee-camp land change, Cox's Bazar 2016 vs 2018 | Landsat/NDVI | **Sensitive: include only with care** |
| B5 | Pakistan floods 2022 | IMERG, GRACE-FO | [D] event |
| B6 | Australia Black Summer 2019–20 | FIRMS + aerosols + NDVI | [D] event |
| B7 | El Niño vs La Niña | SST + IMERG | [D] |
| B8 | South Asian heatwave (e.g. Apr 2024) vs climatology | ~~POWER~~ → ERA5/MODIS LST | [C] |
| B9 | Winter smog Delhi–Dhaka | GEOS-CF/MERRA-2 | [C] |
| B10 | Haor flash floods (Sylhet 2017/2022) | IMERG + NDVI (+ SWOT for 2023) | [C] |
| C1 | Monsoon switching on (May → June) | IMERG | [C] |
| C2 | Afternoon land storms vs night-time sea rain | IMERG 30-min | [C] (G1 diurnal) |
| C3 | The planet breathing CO2 | Mauna Loa ✅ | [D] |
| C4 | Rice-season green waves (aman/boro) | NDVI | ✅ Bogura peaks |
| C5 | Dhaka winter vs monsoon air | GEOS-CF/MERRA-2/ground | MERRA-2 Aug 16–23 µg/m³ ✅; winter [C] |
| C6 | Day vs night surface temperature, city vs village | MODIS LST | [C] |
| C7 | Daylight year: Dhaka vs Oslo | POWER insolation / CERES | [D physics] |
| D1 | Dhaka vs a village: heat, NO2, night lights | LST, OMI/TROPOMI, Black Marble | [C] |
| D2 | Two deltas: Bangladesh vs the Netherlands | Altimetry, IMERG | [C] |
| D3 | Arctic vs tropics warming | GISTEMP (global cube: Svalbard) | [D] |
| D4 | Wettest vs driest: Meghalaya vs Atacama | IMERG | [D]; a good legend demo |
| D5 | Sundarbans vs CHT greenness | NDVI | [C] |
| D6 | Bay of Bengal vs Arabian Sea cyclone fuel | SST | [C] |
| E1 | NASA IMERG vs JAXA GSMaP, same storm | ✅ r 0.95 | Built-ready |
| E2 | MUR vs UK Met Office OSTIA | ✅ 30.10 vs 29.76 | Ready |
| E3 | MODIS vs VIIRS fire counts | FIRMS (VIIRS ≈ 3×) | [D] |
| E4 | Reanalysis vs satellite rain at one point | POWER (MERRA-2) vs IMERG | [C]; the P1b story |
| **E5** | **EIC frame vs source dataset in two ears / unison** | 5101 + MUR | ✅ **0.31 °C** → C1 |
| **E6** | Satellite vs citizen ground observation | GLOBE duet | ✅ CSV route |
| F1 | Two futures for Dhaka (spread = chord width) | NEX-GDDP | 1 model so far |
| F2 | Monsoon rainfall futures (wide spread) | NEX-GDDP pr | [C] |
| F3 | Did the models get 2015–2025 right? | ~~POWER~~ → GISTEMP/GPCP vs NEX-GDDP | [C] |
| G1 | The year you were born vs today (5-year windows) | GISTEMP/GPCP (global cube) | [C] |
| G2 | Your grandparents' Dhaka vs yours | GISTEMP | ✅ (the killer demo) |
| G3 | A farmer's calendar, then vs now | ~~POWER~~ → IMERG + GISTEMP | [C] |
| H1 | A day on Earth vs a day on Mars | Curiosity REMS (access unverified) | "Next Frontier" tie-in |
| H2 | Sun's 11-year cycle vs Earth's warming | Irradiance + GISTEMP | Careful framing only |
| H3 | Who measured today? | 5067 + CelesTrak ✅ | X2 |
| I1 | Cloudy vs clear: clarity follows freshness | `dt_1km_data` ✅ | C5 |
| I2 | The GRACE gap: 11 months of neutral texture | ✅ | Guardrail 6 |
| I3 | Model spread as chord width | NEX-GDDP | D4 |
| I4 | Control comparison: a place that barely changed | ✅ (NDVI Dhaka control) | C4 |

## 6.11 Two additions from v1 §26

**Earth Ear ID (personal hearing calibration).**
- 60-s tone check: ~8 bands plus a loudness ceiling.
- Remaps output **monotonically**; the truth panel is untouched.
- Shows "your range: X–Y Hz".
- Evidence:
  - GerontoVis: presbycusis is more complex than volume.
  - ICAD 2024: design for varied hearing.
  - TUS pilot: 400–1400 Hz may work as well as 65–1480 Hz (small sample).
- Rules: not a medical audiogram; safe start; on-device only; study records "calibrated: yes/no".
- Contribution **C9** → idea J4.

**GLOBE ground-observation duet.**
- Matches are within 15 min of a satellite pass (GOES/Himawari/Meteosat/Aqua/Terra/CALIPSO), over 1 million matches since 2017, CERES FLASHFlux latency under 7 days, CSV releases.
- Repairs:
  - archive / delayed duet, not live;
  - match the protocol to the track (rain gauge ↔ IMERG, air temperature ↔ GEOS/ERA5, land cover ↔ NDVI, clouds ↔ GLOBE's own match);
  - state the scale mismatch (point vs 10 km vs 0.4°);
  - "second perspective", not truth;
  - quality flags and credit.
- Contribution **C10** → idea F5, comparison E6.

## 6.12 Story structures and user journeys (v1 §16–17)

**Stories that come from real data:**
- "Can you hear the monsoon arriving?"
- "Where did NASA not look?"
- "Two agencies, one storm"
- "The ocean remembers"
- "Who measured this?"
- **New:**
  - "The scar Amphan left" (−2.8 °C)
  - "The river that sings 8 metres" (Jamuna)
  - "Hotter, not wetter, and the water underground is falling" (killer demo)
  - "Three instruments, three answers" (Dhaka air)
  - "The gauge went silent in 2003" (sea level)
  - "The forest you can walk through" (GEDI)

| User | First 60 seconds | Deeper use |
|---|---|---|
| First-time visitor | Bloop drop + extremes legend + gist sweep from their location | Record carousel / orchestra |
| Scientist | Truth panel; proof in unison; provenance; duets | Uncertainty mode; download value grids |
| Student | Guided warm-up; "Warmer or Colder?" | Earth Detective cases; lesson pack |
| Child (Beginner/Youth) | "Guess by ear" | Badges (no personal data) |
| Blind/low-vision user | Screen-reader landing; keypad gist → navigate → details; spoken summaries | Ask the Earth by voice; daily bulletin |
| General public | Monsoon Watch / "today's Earth" record | Share a 10-s postcard |
| EIC visitor (kiosk) | Touch a region; room sound | Multi-visitor orchestra |
| Bangladeshi radio listener | 60-s Bangla bulletin | IVR district menu |

## 6.13 Scientific contribution map (v1 §12 + §26)

| # | Contribution | What's still missing (our opening) | Status |
|---|---|---|---|
| C1 | Frame-locked, verified sonification of EIC products with published per-track error | Nobody ties EIC frames → values → source error → sound | **Shown:** SST 0.31 °C, rain ≈27%, anomaly 91% sign |
| C2 | Audio vs visual vs both for live Earth frames, sighted + BLV | Diaz-Merced's synced-cursor condition on EO | Planned pilot |
| C3 | Live uncertainty sonification from NASA quality fields | Live MUR `dt_1km_data` | Field ✅ |
| C4 | Audible disagreement between agencies | Sound + interaction (GMPE is visual only) | ✅ data (r 0.95) |
| C5 | Audible provenance | Data-linked, explorable (Earth Pulse is art) | CelesTrak ✅ |
| C6 | Mapping optimised on listener performance | Held-out testing on EIC tracks | RM |
| C7 | Automatic verified legend reading across the EIC catalogue | EIC products validated against sources | Tick detector works (5176, 9/9) |
| C8 | Culture encodes time/season, not values | Measure whether it helps or hurts | H1 test |
| C9 | Personal hearing calibration | Generic vs calibrated arm | J4 |
| C10 | Satellite vs citizen observation duet | Bangladesh GLOBE density | ✅ 831 obs |
| **C11 (new)** | **Audible verification itself (beats = error)** | No precedent found | ✅ engine |
| **C12 (new)** | **A per-area "every EIC area has a verified voice" audit** | No public audit of which EIC products can be decoded or verified | J0 + K15 |

---
# PART 7: 3D, spatial and physical ideas

**Provenance note.** All 18 original 3D ideas are recovered and included here: 3D-1 to 3D-28 merged with the original list. §7.4 maps each original number to its ID. Entries marked ◆ were added when the list was rebuilt from the verified data. **The original rule still applies:** the 3D object is design, but every motion, height and colour that carries meaning comes from a verified value, and the audio-first path stays complete without 3D.

**Design law for 3D.** The 3D world is a **navigation and storytelling layer** over the same value grids. It must never:
- move a value;
- encode data in perspective size or loudness by distance (guardrail 4);
- block the audio-only path.

Every 3D view has a "flat 2D" fallback and full keyboard control.

## 7.1 The ideas

| ID | Idea | What you see | What you hear (mapping) | Verified data | Build | Effort | Tier |
|---|---|---|---|---|---|---|---|
| **3D-1** ★ | **Turntable Earth + record carousel** (the hero object) | The Earth is a vinyl record spinning on a jukebox turntable. The EIC frame is the record's label/texture: the 2:1 SST or rain frame wraps the sphere. A fixed **tone-arm needle** is the sweep cursor: the groove = a latitude band; rotation = longitude. A **glass jukebox carousel** holds **9 records, one per EIC area** (X3), plus duet records (NASA × JAXA). **A robotic arm picks a record and drops it on the platter**; the needle drops; the frame swaps. **Each record's label shows the dataset, frame time and measured error.** Longitude becomes time and stereo position as the globe turns; the challenge is literally "the Earth Jukebox", so this makes the name physical | Under the needle, the existing voice rules. Needle drop = Bloop drop (A1). Rotation speed = sweep speed (re-synthesised, I2). Carousel moves = the station dial (I1): static between records | 5101, 4285, 5176 frames; all 9 area voices (§4.7.1) | three.js: `SphereGeometry` + frame as an equirectangular texture (same lat/lon as our grids); raycast → lat/lon → `valueAt()`; a home-made jukebox model (low-poly; **no branded jukebox design**) | M | **V2** (sphere + needle + carousel of 3–4 records) / HK (all 9) |
| **3D-2** ★ | **Amphan's cold scar** | The Bay of Bengal as a relief: SST → surface colour + slight height. Amphan's track (IBTrACS) is drawn; the 30-min rain spiral (IMERG) passes; **behind it the ocean sinks into a cold trench** | The SST drone drops as the scar appears: **−2.79 °C mean, −3.92 °C deepest** (≈ 1.7 / 2.4 semitones on the global scale, larger on the zoomed axis). Rain voices swell and pass | K11 ✅; IBTrACS ✅; IMERG ✅. Frame-paired version: a recent storm (Arnab / Montha) | three.js plane mesh with MUR-derived height; GSAP timeline | M | **V2** (Amphan as a labelled MUR story) |
| **3D-3** ★ | **The playable delta** | Bangladesh in 3D: the Padma/Jamuna/Meghna as glowing strings; the ground as a translucent slab over an aquifer | **Rivers are strings:** pitch = SWOT water-surface height on a shared metre scale (reach 43499600141 swings **8.06 m** over 36 passes); pluck a river to hear its season. **Ground = GRACE bass** (shared scale): a translucent underground water table sits **beside NW India's on one shared scale**, so NW India's far bigger drop is visible and audible. The aquifer level breathes with the wells' seasonal cycle (r +0.93; 2.7 m wells vs 41 cm GRACE). Rain particles fall at IMERG's measured density | E6 ✅, K8 ✅, GRACE ✅, IMERG ✅ | three.js + geoBoundaries outline (CC BY 3.0 IGO) + river polylines (SWORD reach geometry) | M–L | **V2** (1 river string + rain) / HK |
| **3D-4** ★ | **Tactile 3D-printed records** | Real discs you can hold, exported as real STL files: **groove depth or ridge height = data** (e.g. a year of GRACE water storage, Dhaka heat 1981→2025, GRACE NW India vs Bangladesh on a shared scale, the Jamuna season). Also a **raised map of Bangladesh's soil moisture** (SMAP 0.30 Feb vs 0.43 Aug). A blind student holds the data while hearing it. This goes beyond a screen: the 2023 accessibility winner, Arcobaleno, stayed on screen. Braille/raised labels. Each record has a QR/NFC tag that plays the same data in the app | Touching = reading; the app plays the matching sonification (same values) | GISTEMP, GRACE, SWOT ✅ | Python `numpy-stl` from the context JSON → STL; print in Chattogram (makerspace/CUET) or use swell paper (J6) | M | HK (bring 2–3 records to the hackathon; with YPSA for co-design) |
| **3D-5** ★ | **Satellite orrery** ("who is measuring now") | Earth with the real satellites in orbit from CelesTrak (Terra, Aqua, Suomi NPP, NOAA-20/21, GPM, SMAP, SWOT, PACE, Landsat 9) via satellite.js SGP4; 5067 "Earth Observing Fleet" as reference | Each satellite is an instrument; when it passes over Bangladesh it plays a soft cue + speaks its mission; a GPM pass "brings" a new rain note (X2). **S-NPP falls silent on 2 Nov**: the orrery can say so honestly | G6 ✅ | satellite.js; refresh elements every 2 h (stop on any non-200: CelesTrak policy) | M | HK |
| 3D-6 | **The jukebox cabinet as the interface** | A 3D jukebox (own design) whose 9 selection buttons are the EIC areas; the record shelf is the carousel; the cabinet light strip pulses **only** with the current voice's value (redundant, not decorative) | Button press = earcon (H6 leitmotif); the cabinet speaker is the stereo field | All voices | three.js; also the kiosk (K3) skin | M | HK |
| 3D-7 | **Sound terrain (walk the data)** | The current frame becomes a height field (value → height). You walk across it in first person or orbit it | Nearby peaks play with HRTF spatial audio; the value under your feet is the main voice; I5 approach-and-listen fades by proximity (gain only, fixed data loudness) | Any grid ✅ | three.js `PlaneGeometry` displacement + Web Audio `PannerNode` (HRTF) | M | HK |
| 3D-8 | **Exploded Earth mixing desk** (incl. the atmosphere onion) | The planet pulls apart into shells; each is a mixer channel. **Original shells:** air (PM2.5 and NO2); land (forest height and NDVI); ocean (temperature and chlorophyll); underground water (GRACE). **Added:** a haze ring set (ground vs CAMS vs GEOS-CF), an energy shell (CERES) and a space-weather top. Each shell has a **VU meter showing its live value** | **Drag a shell out to solo it.** Energy shell: **in 190.6 vs out 168.6 + 198.0 W/m²** as two beating tones (imbalance = beat rate). Haze shell: the B7 filter | K2 ✅, L6 ✅, SWPC ✅ | three.js nested spheres | M | HK |
| 3D-9 | **Forest of three lidars** (canopy cathedral) | Walk through a 3D Sundarbans (plus Lawachara 17.2 m, Madhupur 7.1 m). Tree heights come from **three sources: the CMS mangrove map (10.2 m at the centre), GEDI L3 (6.0/9.9/2.8 m) and ICESat-2 (7.9 m, n = 2)**. The original idea uses only points where all three agree within a few metres. ⚠️ **Our values don't yet agree everywhere**, so a matching-points test comes first (pick the points, report the spread). Dhaka 17.0 m is shown as "buildings, not forest": an honest control | **Each source has its own timbre; agreement sounds as unison** (same logic as C1). Height → pitch (organ-pipe partial); biomass 67 Mg/ha → thickness/timbre. **Head-tracked spatial audio on headphones**: you hear the forest around you. SVS 4950 is the backdrop visual | L1–L3 ✅ | Instanced cylinders | S–M | HK |
| 3D-10 | **City of light voices** | Dhaka, Chattogram and Khulna as extruded light towers from Black Marble radiance (Dhaka ≈ 25–32 nW·cm⁻²·sr⁻¹) | More light → more shimmering voices (E7); cloud-blocked days are **neutral texture**, not darkness | E5 ✅ (switch to VJ146) | Extruded hex grid | M | HK |
| 3D-11 | **Aquifer cross-section** | A cutaway block of ground: wells as glass tubes whose water rises and falls through the year (2.7 m swing), the GRACE layer as a thin, slowly sinking water table | Bass = GRACE (shared scale); bubbles = wells' seasonal cycle; the GRACE gap = a neutral tick | K8 ✅, GRACE ✅ | three.js | S–M | HK (part of 3D-3) |
| 3D-12 | **Monsoon clock tower / tala wheel** | A 12-month wheel; rain columns per month (GPCP/IMERG); a hand sweeps the year; sam marked at June | Tala clock (H4); rain density per month; the "not wetter" comparison plays two wheels identically (C4) | GPCP/GPCC ✅ | Radial bars | S | HK |
| 3D-13 | **Two-futures fork** | A timeline path that splits in 2026 into SSP2-4.5 and SSP5-8.5 branches; branch **width = model spread** | Chord width = spread (D4); median = pitch | 🟡 one model so far (36.1 °C) | Tube geometry | M | RM |
| 3D-14 | **Sea-level glass + the silent gauge** | A glass column filling to the NASA-SSH index (≈ 11.6 cm, rising ≈ 3.4 mm/yr as reported; units/reference to confirm); beside it the Hiron Point gauge column, which stops at 2003 | D5: the gauge voice goes silent after 2003 | K1 ✅ (units open), F12 ✅ | Simple | S | HK |
| 3D-15 | **Sweet-water tongue** | The freshwater plume as a translucent tongue spreading south from the delta after the monsoon (SMAP) | Fresher → higher, purer tone (E6); 15.8 vs 21.8 psu | E4 ✅ | Animated mesh | M | HK |
| 3D-16 | **Earth in your room (WebXR / AR)** | On Android, place the turntable Earth on a real table; the phone becomes the stethoscope (I3) | Tempo + pitch under the phone's aim; HRTF as you walk around | Any | WebXR (progressive enhancement; iOS Safari limited) | M | RM / HK stretch |
| 3D-17 | **Hyperwall / kiosk 3D mode** | 7680×2160 layout: the turntable Earth centre, records left, truth panel right; multi-touch | K3; multi-visitor orchestra (Alt-2) | Any | CSS layout + three.js | M | HK (after 28 Oct) |
| 3D-18 | **The proof helix** (verification you can see) | Two waveforms (frame-derived and source-derived) twist into one helix; when they agree they merge; the error shows as the helix's beat twist | C1 proof in unison, visualised in sync | I1 ✅ | Shader or line geometry | S | **V2** (the 8-second "trust" shot) |
| 3D-19 | **Coral heat reef** (St Martin's) | A small reef model whose colour pales as Degree Heating Weeks rise (1.4–2.1 → 3.2–4.0 °C-weeks in 9 days) | F3 tremolo depth = DHW | F2 ✅ | Simple | S | HK |
| 3D-20 | **Crop heartbeat field** | A paddy field near Bogura whose height and green follow NDVI through the year (peaks > 0.5 in Oct, May, Jun) | Slow pad = NDVI; peaks as heartbeats | K9 ✅ | Instanced grass | S | HK |
| 3D-21 | **Haze dome over Dhaka** | A translucent dome whose opacity = PM2.5; three rings show ground 72 / CAMS 127 / GEOS-CF 50 | B7 filter closes as the dome thickens; three-instrument disagreement as three tones | K2 ✅ (refresh hourly) | Sphere shader | S | V2/HK |
| 3D-23 | **Music-box cylinder year** (original #3) | The globe becomes a rotating pin cylinder; each pin = a real event on its date: cyclone landfalls (IBTrACS), the August 2024 flood (OPERA), fire-weather extremes (5315 archive) | Turning it plays the year (idea I4) | IBTrACS ✅, OPERA ✅, 5315 archive (from 26 Oct) | three.js cylinder + pins | M | HK |
| 3D-24 | **Morning thunder towers** (original #10) | Thunderclouds grow over Bangladesh on a 24-hour × 12-month clock from NASA's LIS/OTD lightning climatology, peaking on pre-monsoon mornings | Drum hits = flash rates (idea E4); no death "toll bells" | E16 ✅ (24-step variables) | Instanced clouds on a radial clock | M | HK |
| 3D-25 | **Snow-globe Bangladesh** (original #12) | A glass globe of Bangladesh. **Shake the phone and the month changes**; rain particles follow IMERG; the glass fogs with PM2.5 (**modelled values, labelled**) | Rain density + B7 haze filter for that month | IMERG ✅; GEOS-CF/MERRA-2 ✅ | DeviceMotion (Android; iOS needs permission) + three.js | S–M | HK |
| 3D-26 | **NASA × JAXA twin globes** (original #16) | Two globes play the same monsoon: one from IMERG, one from GSMaP | The more they disagree, the wider the notes (chord width, F1); "partly independent" said aloud. **Unblocked: the GSMaP read now works** (r 0.95, K10) | K10 ✅ | Two spheres, shared camera | S–M | **V2** (as a duet record) / HK |
| 3D-27 | **Time-tunnel prologue** (original #17) | Fly through rings of years, 1880 → 2025, coloured and pitched by GISTEMP: a 20-s doorway before the globe appears; **Crawford credited** | D2 prologue (0.03 °C per semitone → 59 semitones) | E9 ✅ | Ring tunnel + camera path | S | **V2** (optional opener) |
| 3D-28 | **Ghost Earths** (original #18) | 1981–90 and 2016–25 as two translucent overlaid planets; they **drift apart where the climate changed** | Each plays its window (heat pitch, rain density, GRACE bass on shared scales); the separation is the anomaly | Global cube ✅ (GISTEMP/GPCP/GRACE, 42 places) | Two spheres, vertex offset by change | M | HK |
| 3D-22 | **People under the sound** | Population density (GPW) as a field of points under every voice | Optional weighting in K5 district digests ("how many people live under this rain") | L7 ✅ | Points | S | RM |

★ = from the original shortlist.

## 7.2 Recommended 3D scope (internal heuristic)

- **Video 2 (by the 9 Nov freeze):** 3D-1 turntable Earth with needle and a 3–4-record carousel (ocean, rain, anomaly, NASA × JAXA, which can be shown as the 3D-26 twin globes) · 3D-2 Amphan cold scar · 3D-18 proof helix · optionally 3D-3 with one river string and the 3D-27 time-tunnel opener.
  - **Why:** they're the most visual, they reuse existing grids, and each carries a verified number.
- **Also before the freeze, if on schedule (moved up now that Video 2 is due 13 Nov):** the full 9-record carousel, 3D-3 playable delta + aquifer, 3D-5 orrery, 3D-4 one printed record.
- **Hackathon / later:** anything not finished above; 3D-8 mixing desk; 3D-23 music box; 3D-24 thunder towers; 3D-25 snow globe; 3D-28 ghost Earths; 3D-3 playable delta with the aquifer (3D-11); 3D-5 orrery; 3D-9 canopy; 3D-8 onion; 3D-4 printed records in hand (co-designed with YPSA, if a session happens).
- **Roadmap:** 3D-13, 3D-16, 3D-22.

## 7.3 3D build notes

- **Texture mapping:** our grids and the 2:1 EIC frames are equirectangular (row 0 = 90° N, col 0 = 180° W). In three.js, a `SphereGeometry` UV maps directly; offset by 0.5 in u so that 180° W lines up.
- **Picking:** raycast the hit point → convert to lat/lon → `valueAt(track, lat, lon)`: the same code path as 2D.
- **Performance:** downsample display textures (2048×1024 WebP). Keep audio on the main graph. Target 60 fps on a mid-range Android; reduced motion turns rotation off.
- **Audio in 3D:** `PannerNode` with `panningModel = "HRTF"` only for positional cues. Main data voices keep stereo-by-longitude so legibility doesn't depend on camera angle.
- **Accessibility:** every 3D control has a keyboard equivalent (R = records, arrows = rotate the needle by 1°, Enter = speak). The screen reader announces the record and the needle position.
- **Licences:** model everything ourselves or use CC0 assets. No recognisable branded jukebox, no NASA logo misuse. Credit SVS for textures.

## 7.4 Original 18 → book IDs (all recovered)

| Original # | Original idea | Book ID |
|---|---|---|
| 1 | The turntable Earth | 3D-1 |
| 2 | The record carousel of nine (robotic arm, labels with dataset/frame time/error) | 3D-1 |
| 3 | Music-box cylinder year | 3D-23 (+ idea I4) |
| 4 | Exploded Earth mixing desk | 3D-8 |
| 5 | The delta you can play | 3D-3 (+ 3D-11) |
| 6 | Forest of three lidars | 3D-9 |
| 7 | Amphan's cold scar | 3D-2 |
| 8 | Light columns of Dhaka | 3D-10 |
| 9 | St Martin's coral glass | 3D-19 |
| 10 | Morning thunder towers | 3D-24 |
| 11 | 3D-printable tactile records (+ soil-moisture relief) | 3D-4 |
| 12 | Snow-globe Bangladesh | 3D-25 |
| 13 | AR jukebox on your desk + hyperwall kiosk version | 3D-16 + 3D-17 |
| 14 | Sea-level glass (11.6 cm, ~3.4 mm/yr; Hiron Point tube stops in 2003) | 3D-14 |
| 15 | Satellite orrery | 3D-5 |
| 16 | NASA × JAXA twin globes | 3D-26 |
| 17 | Time-tunnel prologue | 3D-27 |
| 18 | Ghost Earths | 3D-28 |

◆ **Added during the rebuild:** 3D-6 jukebox cabinet UI, 3D-7 sound terrain, 3D-11 aquifer cross-section, 3D-12 monsoon tala wheel, 3D-13 two-futures fork, 3D-15 sweet-water tongue, 3D-18 proof helix, 3D-20 crop-heartbeat field, 3D-21 haze dome, 3D-22 people under the sound.

**The original shortlist** (internal judgement, not a judging prediction) is the same as §7.2:
- 1 + 2 turntable Earth and record carousel: the identity;
- 7 Amphan: the most verified cause-and-effect story;
- 5 playable delta: the Bangladesh story;
- 11 tactile records: the accessibility leap;
- 15 orrery: live and unique.

---
# PART 8: The flagship experience

This is the provisional recommendation. It is an internal heuristic built from the evidence above; the team decides. It fuses the built "Verified Earth Jukebox" core with the 3D jukebox world and the strongest stories. Each piece is reversible: a mode can be dropped without touching the engine.

## 8.1 The first 60 seconds (any visitor)

1. **Black screen, "Close your eyes"** (M1). 10 s of real ocean + rain sound from the latest frames.
2. **The Bloop drop** (A1): one water drop whose pitch is today's Bay of Bengal temperature, spoken: "Bay of Bengal, 29.x °C, NASA MUR via the EIC frame."
3. **The turntable Earth fades in** (3D-1). The needle sits on the Bay; the EIC SST frame is the record.
4. **Extremes-first legend** (C2), 8 s: hottest/coldest, wettest/driest, each spoken.
5. **The needle sweeps** (B1, with iSonic ticks). Arrow keys or drag take over at any moment.
6. **"Proof in unison"** (C1 + 3D-18). One keypress plays the frame tone and the NASA file tone together; the helix merges; caption: "0.31 °C median ≈ a fifth of a semitone".

## 8.2 Modes (tabs), all on one value grid

| Mode | What it contains | Ideas |
|---|---|---|
| **Explore** | Turntable Earth or flat map; keypad regions; Listen/Analyze presets; zoom-the-ear axis; speak value; provenance; truth panel | B1, J1, J2, J3, C3, A2 |
| **Records** (the jukebox) | 9 EIC-area records + duet records; each record = a voice with a provenance badge (NASA / JAXA / NOAA / Copernicus / ground) and "frame-paired" or "context" | X3, I1, 3D-1, 3D-6 |
| **Stories** | Amphan's cold scar · The river that sings 8 m · Hotter, not wetter (Dhaka then vs now) · Three instruments, three answers (Dhaka air) · Follow the water (first movements) · The gauge went silent in 2003 · Coral heat at St Martin's | 3D-2, 3D-3, E3, D1, C4, E5/B7, E1, D5, F3 |
| **Then vs Now** | Comparison Player (sequence / duet / overlay) with the disclosure panel; ear-test logger | §5.8, C6, §6.10 |
| **Duets** | NASA × JAXA rain (r 0.95); SST triad; ground vs models; GLOBE sky duet; frame vs file | F1, F2, E5, F5, C1 |
| **Play** | Warmer or Colder? · Will It Rain Here? · Earth Detective · Hotspot Hunt · Catch the Satellite | §6.9 |
| **Listen** (radio) | Daily 60-s Bangla/English bulletin; sea-area poem; district digest | K1, K2, K5 |
| **Kiosk** | 7680×2160 layout, multi-touch, room audio | K3, 3D-17 |

Global controls:
- language EN/বাংলা;
- Describe and captions;
- Earth Ear ID;
- mute/solo mixer;
- data-age badge;
- "How we know" (truth + Mapping panel).

## 8.3 Built feature list (team build plan IDs, prefixed BP-)

| Group | Features |
|---|---|
| Core | **BP-A1** frame-locked player · **A2** live sound (ocean, rain, snow) · **A3** truth panel · **A4** mapping spec + audio legend (0/10/20/30 °C; light/heavy rain; snow) + 30-s warm-up · **A5** keyboard + speech + screen reader · **A6** gist sweep from Dhaka · **A7** two-voice orchestra + mixer · **A8** honest silence + stereo by longitude · **A9** Warmer or Colder? |
| Creative A | **BP-C1** close your eyes · **C2** pipeline X-ray · **C7** satellite whisper · **C9** sonic identity |
| Should + creative B | **BP-C4** storm time-lapse · **B1** Comparison Player · **B2+C6** GRACE "water that disappeared" · **B3** FIRMS percussion · **B4** provenance drawer · **B5/B6** extreme pings + spoken area summary · **C3** Story Mode (60–90 s) · **H1** Place History · **H2** variability → timbre, seasonality → rhythm · **H3** scrubbing chart with playhead |
| Polish | **BP-C8** Bangla/English · **H4** caption bar · **H5** Describe mode (confirm it exists) · **C5** blindfold challenge · accessibility pass |
| Teasers | GLOBE duet (now built as `globe_duet.json`) · Earth Ear ID lite · 5176 anomaly clip (**now verified**) · Earth postcard |
| Merged PRs | Global history cube (42 places, click anywhere) · Bangladesh ensemble timeline |

## 8.4 Bangla and local identity

- Full UI strings in বাংলা. Recorded Bangla narration for Story mode and the bulletin; use browser Bangla TTS only if the browser check finds a bn-BD/bn-IN voice.
- Bengali musical layers are value-safe: H1 Megh drone (monsoon frames), H4 tala clock, H3 gridlines, H2 meend landing exactly, H5 synthesised ektara/dotara/bansuri/khol.
- **A Bengali musician signs off before any layer ships.** No sacred sounds; no warning-like sounds (guardrail 9).
- Places in the stories: Dhaka, Chattogram, Khulna, Sylhet, Rajshahi, Bogura, Sundarbans, Madhupur, Lawachara, St Martin's Island, Jamuna/Padma/Meghna, Feni–Noakhali–Cumilla, the CHT.

## 8.5 Accessibility (beyond the must-haves in §5.7)

- Screen-reader landing page that explains the jukebox in 3 sentences, then the keypad map.
- An audio-only path through Explore, Records, Stories and Play.
- Presets: Listen / Analyze / Low-frequency / Slow.
- Text for exact values; sound for trends (guardrail 5).
- Haptics on Android (J5).
- Tactile records and a swell-paper delta (3D-4, J6).
- Co-design with YPSA before claiming "built with blind users". Until then the claim is "built on published BLV research".

---

# PART 9: Validation and human evidence

## 9.1 Machine validation (done → to do)

| Check | Status | Next |
|---|---|---|
| SST inversion vs MUR | 0.31 °C [TR] | Re-run on the refreshed frame (L1 step 10) and on a held-out older frame: is the bias stable? |
| Rain inversion vs IMERG | ≈27%, phase 100% [TR] | Held-out frame |
| Anomaly vs CRW | 91% / 0.79 / −0.31 [R2–R3] | Show the offset on screen |
| Three-way check (EIC frame vs GIBS `sourceValue` vs source file) | GIBS MUR25 decodes 100% [R1–R2] | Build `truth/threeway.json` at the 60 points |
| Engine invariants | I1–I4 PASS [R2] | Unit tests in CI |
| Latency (frame-to-sound) | T3 PASS [TR] | Measure on a mid-range Android with 3D on |
| Freshness | Frames fresh at source; **deployed copy stale** | Daily cron + `freshness.json` + A2 rerun |
| Shared-scale mapping | **A3 WARN** | Fix → rerun A3 |
| Browser capabilities (CORS, canvas, Bangla voices, vibration, AudioWorklet) | Not run | `bloop_browser_checks.html` on 3 devices |
| AI answer benchmark (~50 questions, code-computed answers) | Not built | Only if AI-1/AI-2 ship |
| AI vs Verified (vision model reading colorbars) | Not run | Experiment first (AI-3) |
| Satellite pass times | Not run | Compare SGP4 with published passes |

## 9.2 Human evidence: the ear-test pilot (before the 9 Nov freeze)

**Purpose:** give Video 2 a real, labelled pilot number. Small n is reported as small n.

**Pre-registered protocol.** Write it in the repo before running.
- **Participants:** about 20 adults (two weeks is now available; 10 is the minimum) (18+), consented, anonymous; no filming of minors; record "calibrated yes/no" only.
- **Tasks** (randomised order, counterbalanced):
  1. **Compare:** "Warmer or Colder?" over 5 pairs (SST, zoomed axis). Pass if ≥ 80% correct.
  2. **Extremes legend:** after C2, judge 4 random pixels as "closer to hot or cold". Pass if ≥ 80%.
  3. **Which fell further?** (D1, shared scale): pass if ≥ 4/5 per person.
  4. **Which is later?** (C4 monsoon windows). **Near chance is the expected, honest result.** Report it.
  5. **Error ranking** (C1): rank 3 frame/source pairs by beat rate. Pass if ≥ 2/3 rank correctly.
  6. **Sweep direction** (B1): "warm water east or west?". Pass if ≥ 4/5.
- **Conditions** (if time): audio only vs visual only vs both, with the synced cursor (Diaz-Merced condition).
- **Log:** raw counts, published in the repo (`tests/human_pilot.csv`).

## 9.3 BLV co-design (J6)

- Contact YPSA (Chattogram) **this week** for a one-hour co-design session.
- Follow Accessible Oceans practice: co-design first, then testing.
- Consent forms in Bangla. No filming without explicit permission.
- Tasks: find the warmest region with the keypad; identify the rain vs snow timbre; use Describe; rate the presets.
- What to report: task success, time and quotes (with permission).
- **If no session happens:** say "built on published BLV research (iSonic, Umwelt, MAIDR)". Never claim user testing that didn't happen.

## 9.4 The known-answer detection test (Hotspot Hunt)

- Inject a **synthetic, clearly labelled** hotspot into a copy of the SST grid. This is not NASA data.
- Measure detection by ear, by eye and by both, using the same mapping.
- It is honest science, with no claim that "ears beat eyes" unless our data shows it.

## 9.5 Ethics and honesty

- Under-18 participants: none on camera; tests with minors only with guardian consent, and never filmed.
- Earth Ear ID data stays on the device.
- Consent text states what is stored (anonymous answers only).
- Reporting rule: report every pre-registered result, including the failures.

---
# PART 10: Videos, project page, submission

## 10.1 Video 2 (240 s): local judging, due 13 Nov 6:30 PM (confirmed by the organizers, 27 Oct)

**Must contain** [V]:
- team name;
- **every member named** (on screen and in the voice-over);
- the problem and the challenge statement;
- the solution **plus a working demo**;
- **NASA data usage stated out loud**;
- English subtitles;
- no one under 18;
- credits for every third-party asset;
- under 240 s (over-length videos are cut off).

Upload to YouTube, put the link in the Google Form, and upload the file to the Local Lead's Drive. **It's due on hackathon day 1, so upload by Thu 12 Nov**; the venue's bandwidth is not something to rely on.

**Script plan** (WHO → WHY → WHAT → HOW). Aim for 3:50. Every number comes from §4.8.

| Time | Block | Shot | Voice-over gist | Ideas |
|---|---|---|---|---|
| 0:00–0:12 | WHO hook | Black screen; real ocean + rain sound; "Close your eyes… this is NASA's Earth, right now. Now open them." The **turntable Earth** fades in under the needle | — | M1, 3D-1 |
| 0:12–0:40 | WHO | Team PTSD, every member's name and role over the Bloop drop + 4-note motif; "CSE students from Chattogram, a monsoon country, who checked every sound against NASA's own data" | — | A1, C9 |
| 0:40–1:00 | WHY | The official challenge text on screen for 3–4 s; "EIC's visualizations are for eyes only." Who it affects: blind and low-vision people, anyone who learns by ear (use a WHO statistic only after checking it on the WHO site; source on screen) | — | — |
| 1:00–1:40 | WHY: killer data point | **Dhaka then vs now**, from the app: heat pitch rises **+1.37 °C**; the monsoon plays *plainly*: "not wetter, GPCP −9%, GPCC −12%"; the **GRACE bass on one shared scale**: NW India falls ~9× further than Bangladesh; the gap plays as a neutral tick: "no satellite in orbit". One line: **"Hotter, not wetter, and the water underground is falling."** | — | D1, C4, D2 (optional 5-s prologue) |
| 1:40–2:10 | WHAT: how it works | Pixel → colorbar → value → sound (animations A2–A5 then the app). "**The sound comes from the EIC frames themselves** (SVS 5101 sea surface temperature, SVS 4285 IMERG rain), and we **checked** them against NASA MUR and IMERG" | Name the datasets out loud | C3 |
| 2:10–2:30 | WHAT: trust you can hear | **Proof in unison:** the frame tone and the NASA file tone in one ear; the helix merges; "**0.31 °C** median error: about a fifth of a semitone. Rain: within about 27%, and right about *where* it rains at every point we checked." | — | C1, 3D-18 |
| 2:30–3:00 | WHAT: the jukebox | Record carousel: 9 records, one per EIC area. Drop the needle on 3 of them: **Amphan's cold scar** (−2.8 °C), **the Jamuna sings 8 metres** (SWOT), **NASA × JAXA rain duet** (r 0.95, "partly independent") | Say "JAXA" and "Japan's space agency" | 3D-2, E3, F1 |
| 3:00–3:15 | WHAT: proof with people | Ear-test pilot: "10 people, [x]% correct by ear" (only real counts); a blindfolded **adult** teammate plays Warmer or Colder? | — | C6, BP-C5 |
| 3:15–3:45 | HOW: impact + needs | Bangla mode playing; daily Bangla bulletin clip (K1) for community radio; EIC kiosk mock (K3); "What we need: a blind and low-vision partner organisation (we've contacted YPSA), and mentors for the listening study." Future: hear anywhere on Earth (global cube, built) · uncertainty you can hear · Ask the Earth (AI that never invents numbers) · museums and classrooms | — | K1, K3, J6, G, AI-2 |
| 3:45–3:52 | Close | The live app on the turntable; Letter to the future: "Bay of Bengal, [date]: [x] °C, [y] °C above normal. Measured by NASA. Checked by Bloop." Tagline: **"Hear what NASA is showing, and trust what you hear."** | — | L3 |

**Wording rules:**
- Say "latest", not "today's".
- Say "the sound is generated live".
- Say nothing about features that aren't in the app on recording day.
- Don't mention NASA POWER, except optionally as "we tested a popular dataset and dropped it because it disagreed with independent records".
- Never say 0.85.

**Animation plan** (each 4–8 s, followed immediately by the same thing working in the app; use the app's colours and font):

| # | Animation | Then show from the app |
|---|---|---|
| A1 | A NASA map fades to black; only sound remains ("What if you couldn't see this?") | — |
| A2 | The map splits into pixels; one lights up with its lat/lon | Cursor on the ocean frame |
| A3 | The pixel's colour flies to the colorbar, slides to its match, the value pops out | Hover readout |
| A4 | Rain has two legends (rain/snow); a snow pixel becomes a bell | Rain track over snow |
| A5 | Temperature slider ↔ pitch; rain intensity ↔ drops | Sweep with sound |
| A6 | West → left ear, east → right | Moving east–west with headphones |
| A7 | Silence = no data: the waveform goes flat over land | Crossing land |
| A8 | Map value vs NASA value converging; "0.31 °C", "~27%" | Truth panel + proof in unison |
| A9 | Then vs now: heat tone rising; GRACE bass sinking on a shared scale; the gap as a tick | Then vs Now screen |
| A10 | Zoom out from Bangladesh to the globe, points lighting up | Global cube (built) |

**NASA data to name explicitly:**

| Role | Dataset |
|---|---|
| Frames that make the sound | NASA EIC visualizations by SVS: **SVS 5101** (SST), **SVS 4285** (IMERG rain), **SVS 5176** (SST anomaly) |
| Checking ocean / rain | **MUR SST** (NASA/JPL PO.DAAC); **GPM IMERG** (NASA–JAXA, GES DISC) |
| Then vs now | **NASA GISTEMP v4** (heat); **GPCP v2.3** (NASA-led) + **GPCC** rain gauges (Germany's weather service, DWD); **GRACE/GRACE-FO** (NASA/JPL) |
| Stories | **SWOT** (NASA–CNES; river heights) · IBTrACS (NOAA) + MUR (Amphan) |
| Partners | **JAXA GSMaP**; NOAA Coral Reef Watch; ground stations via OpenAQ; Copernicus CAMS (if the air story is shown) |
| Credit (on screen) | "Visualizations: NASA's Scientific Visualization Studio (SVS 5101, 4285, 5176) for the NASA Earth Information Center." |

## 10.2 Video 3 (30 s): global judging, due 14 Nov 12:00 PM (aim for 09:00)

**Must contain:** team name, every member named, problem + challenge, **a working demo**, NASA data stated, English subtitles. Global judges see only this video and the project page.

**Recommended beat sheet:**

| Time | Beat |
|---|---|
| 0–3 s | Black screen; a rain sound builds; caption "This is NASA data." |
| 3–9 s | The turntable Earth with the IMERG frame; the needle drops on the Bay of Bengal; the rain rhythm follows the needle |
| 9–16 s | Proof in unison: "Pixel colour says [x] °C. NASA's file says [y] °C." (fill both from one real truth-test point) The helix merges; "0.31 °C median error · rain within ~27%" |
| 16–24 s | Two records: Amphan's cold scar (−2.8 °C) → NASA × JAXA duet (r 0.95). Caption: "9 EIC areas · every voice checked" |
| 24–30 s | Team PTSD names on a strip; "Bloop: hear what NASA is showing, and trust what you hear." SVS credit |

**The three 30-s designs from v1 §15** (alternatives; numbers updated):
1. **"Proof you can hear"** (A + D + G): black screen + rain → IMERG frame with the cursor over Bangladesh → "pixel says X, IMERG says Y" + truth panel + uncertainty as clarity → a blind listener answers by ear ("[x]% correct in our study", only if real).
2. **"The monsoon, as two agencies hear it"** (E + H + F): monsoon time-lapse → left ear NASA IMERG, right ear JAXA GSMaP → a GPM satellite passes and a new note arrives: "Hear the Earth, and the spacecraft that measured it."
3. **"Play the planet"** (B + I + N): kiosk view; touch the ocean; add fires, then smoke drifting downwind (fire → smoke across EIC areas) → "Find the heatwave by ear"; truth panel in the corner.

## 10.3 Recording checklist

- [ ] Screen recording with system audio (OBS); a separate clean voice-over.
- [ ] English subtitles (Bangla optional).
- [ ] SVS credit visible; datasets named out loud.
- [ ] No copyrighted music: the sonification is the soundtrack. Credit any template.
- [ ] No one under 18 on camera or by name or voice.
- [ ] Every number matches §4.8 and the app JSON.
- [ ] Data refreshed the day of recording (A2 PASS).
- [ ] Length under 4:00 (aim 3:50) / exactly ≤ 30 s.
- [ ] Test the YouTube link in a private window.

## 10.4 Project page (Space Apps Connect opens 2 Nov)

- [ ] Challenge #14 named + category.
- [ ] Every member listed with photo and role; team photo.
- [ ] Public repo link (works in a private window).
- [ ] Description that follows the PROBLEM → WHY → NASA DATA → INSIGHT → SOLUTION → EVIDENCE → IMPACT → FUTURE chain.
- [ ] Data list with every dataset and its provenance badge.
- [ ] "How we know" section (truth numbers, independence notes).
- [ ] **Use of AI** section: coding help, writing, translation; in-app AI (if any) never produces numbers.
- [ ] Video 3 link; demo link (bloop-ptsd.vercel.app).
- [ ] Keep it current through the judging window (Dec–Jan).

## 10.5 Deployed-app checklist before any recording (from the video review)

1. **Loading and health:** no console errors; data age badge OK.
2. **Start screen wording:** "latest", frame time shown.
3. **Explore, ocean:** readout = `valueAt()`.
4. **Explore, rain and snow:** phase timbres.
5. **Keyboard and accessibility:** full keyboard run.
6. **Sweep and time-lapse.**
7. **Story Mode:** numbers from JSON.
8. **Then vs Now:** the exact captions, plus the shared GRACE scale.
9. **Truth panel:** 0.31 °C, new plot.
10. **Mapping panel and legend.**
11. **Bangla.**
12. **Phones:** Android Chrome, iPhone Safari.
13. **Things that must NOT be there:** 0.85; "today's"; unbuilt features presented as built.
14. **Screen recordings to capture:** the hook, X-ray, unison, time-lapse, then vs now, carousel, Bangla close.

---
# PART 11: Build plan

## 11.1 Priorities (internal heuristic: verified + visible + cheap first)

**Tier V2: must exist on screen by the Video 2 feature freeze, Mon 9 Nov, 18:00** (Video 2 is due 13 Nov, 6:30 PM)
1. Data refresh + daily cron + data-age badge (A2 PASS).
2. GRACE shared scale (A3 PASS) + neutral gap texture.
3. **C1 proof in unison** + **3D-18 helix** + C3 X-ray tail.
4. **3D-1 turntable Earth** + needle + carousel with 3–4 records (Ocean, Rain, Anomaly/normal tone B3, NASA × JAXA duet F1).
5. **3D-2 Amphan cold scar** (labelled MUR story).
6. **E3 Jamuna river string** (1 reach; 3D-3 lite).
7. A1 Bloop drop on the J3 zoomed axis · C2 extremes legend · J3 zoom axis.
8. C4 honest-null wording polish · D2 prologue (optional 20 s).
9. C6 ear-test logger + pilot with about 10 adults.
10. L3 letter to the future · H1 Megh drone (if a musician signs off; otherwise skip) · G3 own rain recording bed.
11. B7 ground-voice haze record (ground 72 / CAMS 127 / GEOS 50, refreshed) as the 5th record.

**Moved up from HK into V2** because the extra 12 days allow it (a stretch, in this order):
- all 9 area records (X3);
- 3D-3 playable delta + aquifer;
- 3D-5 satellite orrery;
- F3 coral record;
- K1 Bangla bulletin clip;
- J1/J2 keypad and presets;
- one 3D-4 printed record;
- the YPSA session (if booked), so the video can show co-design honestly.

**Tier HK: 2–14 Nov**
- **Data:** S-NPP → NOAA-20/21 switch verified after 2 Nov.
- **Records:** complete the 9 area records (X3), adding air, forest (3D-9), fire (B6/B8), energy (CERES/Black Marble), sea level (D5), agriculture (crop heartbeat), water (playable delta 3D-3 + aquifer 3D-11).
- **Stories:** F2 triad (same-day) · E2 S1-only redo · E6 plume · E4 thunder score · B5 frame-paired recent storm · D3 three voices.
- **Satellites and live:** 3D-5 orrery + X2 · X1 live events.
- **Broadcast and access:** K1 bulletin (recorded Bangla) · K2 poem · K5 district digest · J1/J2 keypad + presets · J4 Earth Ear ID · J5 haptics · J6 YPSA session + 3D-4 printed records.
- **Musical and sharing:** H2–H6 musical layers (signed off) · L1 postcards · L2 Citizen Ear.
- **Games:** Will It Rain Here? · Earth Detective · Hotspot Hunt.
- **Statement-driven:** K3 kiosk + 3D-17, if the 28 Oct statement points at hardware.
- **Optional AI:** AI-1 check the AI by ear and AI-3 AI vs Verified, as experiments.
- **Overnight:** start the G1 IMERG overnight job now.

**Tier RM:** D4 (5-model futures) · F4 NISAR · E7 · M3 · I6 · 3D-13/16/22 · #33 mapping optimisation · #34 nowcast · AI-4/5/6 · Earth Jam · lesson pack K4.

## 11.2 Lanes

| Lane | Owner | Responsibility |
|---|---|---|
| **L1 Data/Pipeline** | Dipika | Pipeline, cron, new context JSONs, truth tests, S-NPP switch, freshness, data contract additions |
| **L2 Audio** | — | `mapping.json`, voices, C1 unison, drop, drone, river string, mix, guardrails |
| **L3 Interface/3D/Accessibility** | — | three.js turntable + carousel + scenes, keyboard, panels, Bangla, presets, browser checks |
| **L4 Story/Video/QA/People** | — | Script, animations, narration EN/BN, ear-test pilot, YPSA and musician, recording, project page |
| (5th member) | — | Pair with L3 on 3D, or own the pilot and the people tasks |

## 11.3 Day by day to Video 2 (due Fri 13 Nov, 6:30 PM)

**Phase 1: core (Tue 27 Oct – Mon 2 Nov)**

| Day | L1 Data | L2 Audio | L3 Interface / 3D | L4 Story / QA / people |
|---|---|---|---|---|
| **Tue 27 Oct** | `run_all.py`, commit, redeploy; GitHub Actions daily cron (frames + truth); rerun A2 | `mapping.json` shared GRACE range −70…+35 cm + gap texture; rerun A3; J3 zoom axis | three.js spike: sphere + 5101 texture + raycast → `valueAt()` + needle | Script v2 from §10.1; **email YPSA**; ask a Bengali musician; **you:** Embassy files, FFWC email, regenerate the NASA key |
| **Wed 28** (statement day) | **All hands, 2 h:** read the full statement + partner resources; update §1.1 and §4 · then `cold_wake_amphan.json`, `swot_reaches.json`, `duet_rain.json` (extend to Jun–Sep), `air_dhaka.json` (hourly cron) | C1 unison; B3 normal tone; A1 drop | Carousel with records (Ocean, Rain); proof helix 3D-18 | Storyboard animations A1–A10; consent form (Bangla/English); book ~20 pilot adults |
| **Thu 29** | `sst_anom.bin` (5176); `threeway.json`; `freshness.json` | River-string voice (E3); Amphan story audio; F1 duet audio | Amphan cold scar scene; records 3–4; data-age badge | Pilot protocol written in the repo (pre-registered) |
| **Fri 30 – Sat 31** | Prepare the S-NPP switch (NOAA-20/21 short names); more SWOT reaches | Mix pass 1; C2 legend; L3 letter; G3 own rain recording | Integration of records 1–4; keyboard parity in 3D; Android performance test | Pilot session 1 (~10 people) |
| **Sun 1 – Mon 2 Nov** | **S-NPP ends 2 Nov, 13:00 UTC**: switch Black Marble/FIRMS/NDVI; project page skeleton (Connect opens 2 Nov) | Haze record (B7) | Records 5–6 | Pilot session 2; first rough cut of Video 2 from the current app |

**Phase 2: breadth (Tue 3 – Sun 8 Nov)**

| Window | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| Tue 3 – Wed 4 | Rerun E5, E12, C5113, K4 (post-S-NPP); forest/energy/sea-level/coral JSONs | Forest, energy, sea-level voices | Records 7–9; playable delta + aquifer (3D-3/3D-11) | K1 Bangla bulletin recordings; musician session (H1 sign-off) |
| Thu 5 – Fri 6 | F2 triad same-day; E2 S1-only redo; `live/sats.json` | Orrery cues (X2); H1 drone (if signed off) | Satellite orrery (3D-5); J1 keypad + J2 presets | **YPSA co-design session** (if booked); print one tactile record (3D-4) |
| Sat 7 – Sun 8 | Freshness + spot checks on everything | Full mix pass 2 | Bug bash; reduced motion; Bangla pass | Script v3 with the real pilot numbers; voice-over draft |

**Phase 3: freeze and record (Mon 9 – Thu 12 Nov)**

| Day | Action |
|---|---|
| **Mon 9, 18:00** | **Video 2 feature freeze.** QA checklist §10.5 + §11.7 |
| Tue 10 | Data refresh (A2 PASS that day); record screen clips, the blindfolded-adult game, voice-over |
| Wed 11 | Edit, subtitles (English required), check ≤ 3:52; draft the 30-s video from the same footage |
| **Thu 12** | **Upload Video 2** (YouTube + Form + Drive) and test the links in a private window; 30-s video near-final; project page complete; offline copies of every dataset + the app for the venue |

**Fallbacks if behind:** keep ① ② ③ ④ (records 1–3) ⑦ ⑨. Drop the moved-up stretch items first, then the river string, the haze record and the drone. If 3D is unstable, record the turntable as a clip **of the real app scene** and keep the 2D map live.

## 11.4 After the upload

The hackathon weekend is for the **live demo, the 30-s video and the project page**. Don't use it for new core features. If the 28 Oct statement asks for something (kiosk/hardware), plan it into Phase 2, not the weekend.

## 11.5 Hackathon run of show (Asia/Dhaka; confirm with the Local Lead)

| When | Our action |
|---|---|
| Fri 13, 07:00–11:30 | Register; NASA site team setup; mentor round (video + page) |
| Fri 13, 18:30 | **Video 2 deadline** (already uploaded on 12 Nov; check the Drive copy is there) |
| Fri 13, 22:00–23:00 | 30-s video + NASA page feedback; finish both |
| Sat 14, 09:00 | **Final 30-s upload** (rule: 12:00) |
| Sat 14, 11:00 | Local judging (240 Seconds of Glory) |
| Sat 14, 18:00 | Closing |

## 11.6 Dependencies

- `lut_params` → `convert_*` → grids → `data.js` → views + `audio.js` → explore / sweep / game → X-ray, whisper, unison → time-lapse → Story → video.
- Context JSON → demo JSON → compare / history → Then vs Now → video.
- Fresh data (A2) → anything recorded.
- Shared scale (A3) → the killer demo recording.
- three.js `valueAt` bridge → carousel → scenes.
- Pilot protocol written → pilot run → numbers in the video.
- Musician sign-off → H-layers shipped.
- YPSA consent → any "tested with blind users" claim.

## 11.7 Definition of done (QA)

- [ ] `spotcheck.py`: 10 SST + 10 rain points PASS; anomaly points PASS.
- [ ] Readout = `valueAt()` at 5 random points (2D **and** 3D).
- [ ] No clicks/pops; volume capped; limiter on.
- [ ] Keyboard-only full run (Explore, Records, a Story, a Game).
- [ ] The truth panel shows the exact §13 wording; the plot is updated.
- [ ] No console errors (Chrome, Edge, Android Chrome).
- [ ] Every spoken/shown number is read from JSON.
- [ ] Disclosure panel on every comparison; frame time everywhere; data-age badge.
- [ ] Captions + Describe in both languages.
- [ ] Concept-only items labelled "coming next".
- [ ] Credits visible (footer + README).
- [ ] A2 and A3 PASS on the day of recording.

## 11.8 Decisions the team still has to make (decision framework)

| Decision | Options | Evidence for / against | Reversibility | What would change it | Provisional judgment |
|---|---|---|---|---|---|
| **Showcase story for Video 2** | (a) Dhaka then vs now (built) · (b) Amphan cold scar · (c) Jamuna river · (d) Dhaka air | (a) is built and verified, but needs the A3 fix. (b) is dramatic and verified (MUR), but not frame-paired. (c) is verified but has one reach. (d) changes hourly, and the model disagreement needs careful wording | High (all are modes) | 28 Oct statement emphasis; pilot results | Lead with (a) in WHY; (b) and (c) as records in WHAT |
| **Depth vs breadth** | 3–4 polished records vs all 9 by the 9 Nov freeze | Creativity and Presentation reward execution; X3 rewards breadth | Medium | Progress by Mon 2 Nov | 4–6 polished first; all 9 only if each passes QA by 8 Nov |
| **"Next Frontier" hook to feature** | Provenance / satellites (F, 3D-5) · multi-agency duet (H, F1) · uncertainty (G, C5) | F1 has a verified number (r 0.95); 3D-5 is visual; C5 has its data | High | Statement; mentor feedback | F1 in V2; 3D-5 at HK |
| **Culture layer in V2** | Include H1 drone / skip | Zero fidelity cost if tested; needs a musician | High | Musician availability | Include only if signed off by 6 Nov |
| **3D in V2** | Live 3D scene / pre-rendered clip of the app / 2D only | 3D lifts Creativity and Presentation; adds performance risk | High | Android performance test (30–31 Oct) | Live if 60 fps; otherwise a clip of the real scene |
| **AI feature** | None / AI-1 check by ear / AI-3 experiment | AI adds risk; "never produces numbers" is a differentiator | High | Statement asks for AI? | None in V2; AI-3 as an experiment at HK |
| **Kiosk mode** | Build / skip | 2024 statement precedent | High | 28 Oct statement | Decide 28 Oct |

**What would change direction:**
- **The 28 Oct statement names products or hardware.** Re-prioritise K3 and the frame-paired items.
- **Pilot listeners fail the shared-scale or extremes tests.** Simplify to fewer voices before adding families.
- **YPSA agrees.** Raise J1, J6 and 3D-4 above the musical layers.
- **The 5113 feed stops after S-NPP.** The fire record goes FIRMS-only.
- **The A3 fix is impossible before recording.** Don't show the GRACE comparison as a "which fell further" claim.

**Catalogue "next tier"** (if time allows): SMAP salinity plume, Black Marble Dhaka (VNP46 vs VJ146), NEX-GDDP NCSS for Dhaka, the GMSL/PSMSL 1993–2003 overlap, a seismic clip (done), 5099 sea ice.

---

# PART 12: Risk register

| Risk | Type | Severity | Mitigation |
|---|---|---|---|
| Deployed data stale on recording day | Data | **Serious** | Daily cron; A2 rerun before recording; data-age badge |
| GRACE per-series scale in the killer demo | Validity | **Serious** | Fix `mapping.json`; A3 rerun |
| **S-NPP products stop 2 Nov** (Black Marble VNP46, FIRMS SNPP, VNP14IMG, VNP13, VIIRS EVI GIBS layer; 5113 partly) | Data | **Serious** for HK | Switch to NOAA-20/21 now; rerun after 2 Nov; caption sensor changes |
| 28 Oct statement pins products, hardware or audience | Scope | Moderate | The engine is product-agnostic; kiosk + 3D-17 ready; re-run the clause table the same day |
| 3D hurts performance or accessibility | UX | Moderate | 2D fallback; reduced motion; keyboard parity; test on a mid-range Android |
| Too many voices / feature soup | UX | Moderate | Records = one voice at a time by default; 2 voices + bed max; modes, not products |
| Claims outrun evidence ("ears detect better", "tested with blind users") | Credibility | **Serious** | §13 rules; pilot reported as pilot; YPSA claim only after a session |
| Rubric "Creativity" caps an idea everyone has | Competition | Serious | Lead with C1, the turntable, the river string, Amphan; execution quality |
| A musician-led competitor with more polish (Track A done very well) | Competition | Serious | Sound design time on Fri; own recordings; the Bengali layers; mix polish |
| Video 2 due on hackathon day 1 (13 Nov, 18:30) | Schedule | Moderate | Upload on 12 Nov; don't rely on venue bandwidth |
| Data for the video recorded after S-NPP ends | Data | Moderate | NOAA-20/21 switch done by 4 Nov; refresh on recording day |
| Pre-hackathon work rule conflict (FAQ vs Local Lead) | Rules | Moderate | Written confirmation; dated work log |
| SVS feed stalls | Data | Moderate | Cached frames with their date |
| Air-quality numbers change hourly | Validity | Moderate | Show the timestamp; recompute at the shown time |
| DONKI down | Data | Minor | SWPC only |
| CelesTrak firewall on errors | Ops | Minor | Stop on non-200; cache 2 h |
| OpenAQ/FIRMS keys leaking | Security | Serious | Server-side only; redaction in scripts; regenerate if exposed |
| Bangla TTS missing on devices | UX | Moderate | Recorded team voice |
| Cultural misuse | Ethics | Moderate | Musician sign-off; no sacred or warning sounds |
| AI hallucination | Trust | Moderate | Tool-call architecture; numbers only from the engine; benchmark |
| Licences (xeno-canto NC, Freesound, Chandra, P-Tree, BMD) | Legal | Minor–moderate | Own recordings; per-file checks; don't embed Chandra; NOAA AWS Himawari; no BMD republishing |
| Under-18 on video | Rules | Minor | Adults only |
| Terra/Aqua shutdown timing | Data | Minor (now) | VIIRS continuity notes |
| Venue bandwidth at the hackathon | Ops | Moderate | Offline copies of every dataset and the built app |

---
# PART 13: Honesty rules, exact wording, credits, licences, AI disclosure

## 13.1 Honesty rules

1. No number appears unless it comes from our grids, JSON or tests (§4.8).
2. Anything not working is labelled "concept" or "coming next".
3. "Real time" means the sound is generated live; the data is near-real-time; the frame time is always shown.
4. Comparisons use multi-year windows; single years are labelled "example years".
5. Never claim "sound beats sight", "more erratic rain", or any novelty in the §3.2 not-new list.
6. POWER is never used for long-term claims.
7. No bias correction until held-out frames confirm the offsets are stable.
8. Every voice says whether it is frame-paired or context, and whether it is a measurement or a model.
9. Shared inputs are said out loud ("partly independent").
10. Events are not trends.
11. Human-testing claims only after the tests: pilot numbers reported as pilot; "built with blind users" only after YPSA.
12. AI never produces numbers.

## 13.2 Exact on-screen wording

| Where | Text |
|---|---|
| Truth panel (SST) | "Checked against NASA MUR SST: median error 0.31 °C (60 ocean points)." |
| Truth panel (rain) | "Checked against NASA IMERG (Late run): typically within ~27% (150 rain points, one frame); agreed on where it was raining at every sampled point." |
| Truth panel (anomaly) | "SST anomaly checked against NOAA Coral Reef Watch: same sign at 91% of 1,101 points; reads 0.31 °C cooler (different baselines)." |
| Proof in unison | "Two tones: one from the EIC picture, one from NASA's file. Beats mean they disagree. 0.31 °C ≈ a fifth of a semitone." |
| Frame label | "EIC frame: [product], [date time UTC]. Sound generated live from this frame." |
| Data age | "Latest available: [age]" |
| Heat comparison | "Dhaka, April–May: +1.37 °C (NASA GISTEMP, 1981–1990 vs 2016–2025, 10 years each)." |
| Rain comparison | "Dhaka, June–September: not wetter. GPCP −9% (1981–1990 vs 2016–2025); rain gauges (GPCC) −12% (1981–1990 vs 2010–2019)." |
| Water comparison | "Water storage (GRACE): Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm (2003–06 vs 2021–24). One shared scale. Ticking = no satellite in orbit (Jul 2017–May 2018)." |
| Amphan | "Cyclone Amphan (May 2020): the Bay of Bengal cooled 2.8 °C on average along its track, up to 3.9 °C (NASA MUR, 3 days before vs 3 days after). One event, not a trend." |
| Jamuna | "Jamuna, SWOT reach 43499600141: 8.06 m between lowest and highest of 36 passes (Jun 2025–Jan 2026). Each note is one satellite pass." |
| NASA × JAXA | "NASA IMERG and JAXA GSMaP: day-to-day r = 0.95 over [n] days at Dhaka. Partly independent: both use GPM microwave satellites." |
| Dhaka air | "Dhaka PM2.5 at [time]: ground stations [x] µg/m³ (median of [n]); Copernicus CAMS [y] (model); NASA GEOS-CF [z] (model)." |
| Wells × GRACE | "1,268 Bangladesh wells and GRACE share the same seasonal rhythm (r = +0.93). Seasonal cycle only." |
| Fires | "Example years, same sensor (MODIS): CHT Mar–Apr 4,954 (2003) vs 4,033 (2023)." |
| GLOBE | "Citizen observers vs satellite: two perspectives, not right vs wrong." |
| Earth Ear ID | "Comfort check, not a hearing test." |
| Model badge | "Model estimate" |
| Bulletin | "For learning, not an official warning." |
| Interpretation mode | "Interpretation, not measurement." |
| Gaps | "No satellite in orbit" / "The monitor went quiet (4 March 2025)" |

## 13.3 Credits (footer, README, project page)

- **Visualizations:** NASA's Scientific Visualization Studio (SVS 5101, 4285, 5176, and others as used) for the NASA Earth Information Center.
- **NASA data:**
  - MUR SST (NASA/JPL PO.DAAC); GPM IMERG (NASA/JAXA, GES DISC);
  - GRACE/GRACE-FO JPL mascons RL06.3Mv04 (NASA/JPL PO.DAAC; use its acknowledgement text);
  - NASA GISTEMP v4 (GISTEMP Team, NASA GISS); GPCP v2.3 (Adler et al.; via NOAA PSL);
  - SWOT (NASA/CNES, PO.DAAC); SMAP; NASA FIRMS (LANCE/ESDIS); MODIS MOD13Q1 (ORNL DAAC);
  - GEDI, CMS mangroves (ORNL DAAC); ICESat-2 (NSIDC); CERES (ASDC);
  - Black Marble (LAADS); GEOS-CF and MERRA-2 (GMAO); NASA GLOBE Program;
  - SEDAC GPW (CIESIN); NASA-SSH; OPERA; NISAR (NASA–ISRO, ASF).
- **Partner and other sources:**
  - "GSMaP data by JAXA" (JAXA Earth API);
  - NOAA Coral Reef Watch, OISST, IBTrACS, GML Mauna Loa;
  - UK Met Office OSTIA;
  - Copernicus CAMS/GloFAS/ERA5 (via Open-Meteo, CC BY 4.0; ECMWF/Copernicus);
  - GPCC (Deutscher Wetterdienst; via NOAA PSL);
  - OpenAQ and Bangladesh DoE stations; US Embassy Dhaka (EPA files);
  - HydroShare wells (CC BY 4.0); geoBoundaries (CC BY 3.0 IGO);
  - PSMSL; USGS; EarthScope/NSF (waveforms); CelesTrak;
  - GBIF (if used); ACAG/WUSTL (CC BY 4.0).
- **Partner-agency note:** IMERG comes from the joint NASA–JAXA GPM mission. MUR includes JAXA AMSR2 and EUMETSAT OSI SAF inputs.

## 13.4 Licences and reuse

- **Our code:** MIT (public repository).
- **SVS frames:** reusable with credit (Check B; NASA reproduction guidelines).
- **Audio:** generated by our code; our own field recordings; any CC file licensed per file (xeno-canto Doel recordings are NC-SA: non-commercial, credit, share-alike).
- **Don't embed** Chandra/NASA sonification audio (no licence found).
- **Don't re-serve** Himawari P-Tree data or BMD paid data.
- **Tagore:** compositions are public domain; recordings are not.
- **Strudel:** check the licence (possibly AGPL) before embedding.

## 13.5 AI disclosure (project page "Use of AI")

- List the AI tools used for coding help, research, writing and translation.
- In-app AI (if shipped): tool-calling only. Numbers come from the engine. Every answer cites its source. The app works without AI.

---

# PART 14: Open questions and the cheapest checks

| Item | Status | Cheapest check |
|---|---|---|
| What the 28 Oct statement adds (products, hardware, audience) | [UNK] | Read it on 28 Oct; update §1.1 |
| Which partner datasets the official #14 resources name | [UNK] | Same day; add them to §4 and prioritise them |
| Video 2 date | **Resolved:** 13 Nov, 6:30 PM (organizers, 27 Oct) | — |
| Pre-hackathon work rule | Conflict | Ask the Local Lead in writing |
| GMSL file units and reference period | Open | Read the file header |
| CRW Degree Heating Week alert thresholds | Open | Read the CRW product page |
| Which Bogura NDVI peak is aman vs boro | Open | Ask an agronomist (BRRI/BAU contact) |
| Where Cyclone Arnab is / was | Open | EONET event geometry + IBTrACS |
| C5147 / C5148 at the frame's own time (run 4) | Number not carried into these notes | Check the run-4 `REPORT.md` |
| PACE chlorophyll value after the fix (run 4) | Same | Same |
| ECOSTRESS ET value (L5, run 4) | Same | Same |
| Which GIBS layer filled the 7th EIC area after the energy fix | Same | Same |
| Freesound CC0 results after widening to 5 queries (run 4) | Same | Same |
| VEDA 6/8 and GHG 3/6: which collections and values | Same | `samples/` from run 4 |
| Whether 4950's 16:9 global render contains a flat map that can be cropped | Untested | One test: crop the map area, rank-test against GEDI L3 |
| Does SVS 5113 keep updating after S-NPP ends? | [UNK] | List its frames folder on 3 Nov |
| NOAA-20/21 short names for Black Marble and NDVI | [PV] (VJ146A2 ✅) | CMR keyword search |
| Bangla browser voices on demo devices | [UNK] | `bloop_browser_checks.html` |
| GIBS canvas pixel read from our origin | [UNK] | Browser checks |
| Simultaneous-stream limit (≈ 3–4) | UV (no primary source) | The pilot itself (2 vs 3 vs 4 voices) |
| Pitch and tempo JNDs | UV | A psychoacoustics text (e.g. Moore) before quoting any number |
| Polarity for rain density, salinity, NDVI, FWI | No study found | 5-person magnitude-estimation mini-test |
| Meend idiom, a 12-beat tala, Bhatiali association, conch use | UV | 15 min with a Bengali musician |
| Tagore US copyright for 1931–41 publications | UV | Perform from pre-1930 notation or use a team melody |
| Marine-heatwave threshold source (Hobday 2016) | To source | Read the paper; get a percentile climatology |
| Cyclone-formation SST threshold | To source | A primary source before any "threshold bell" |
| Arcobaleno's mapping and judge comments; 2024 sound winners | Not accessible | Open the Space Apps pages in a normal browser |
| Full Arcand et al. 2024 results; Accessible Oceans participant numbers | Abstracts only | Read the full papers |
| The "Bloop" name hook (famous underwater recording) | Unchecked | Find a primary NOAA source, or don't mention it |
| YPSA's willingness | [UNK] | One email or call this week |
| Women participation bonus eligibility | Team knows | Confirm on the team page |

---
# APPENDIX A: Test-by-test ledger (all 161 tests; latest result)

**Suite:** `bloop_data_tests.py` / notebooks v3–v3_4.
- Runs 1–2: 25–26 Oct, all tests.
- Run 3: 46 tests.
- Run 4: 17 tests + group L.
- Run 5: K2, K8, K10, L4, L6, L7.
- Run 6: L4.

Status is the latest run in which the test ran.

### A. Deployed app

| ID | Test | Latest | Result |
|---|---|---|---|
| A1 | App publishes the data files (paths from the JS bundle; GitHub fallback) | **PASS** (R3) | All 14 files + `mapping.json` served from bloop-ptsd.vercel.app (R1–R2 404s were the old deploy) |
| A2 | Truth numbers current (0.31, not 0.85) and frames fresh | **WARN** (R4) | SST frame 31.5 d, rain 29.4 d old → refresh + cron |
| A3 | GRACE uses one shared scale | **WARN** (R4) | `runtimeRange p5-p95` per series; data spans BD −30.6…+32.2, NW India −68.8…+25.6 cm |

### B. SVS Daily Visualizations (newest-file age, R2)

| ID | Item | Latest | Detail |
|---|---|---|---|
| B0 | Gallery list | PASS | 23 items; no new, none missing |
| B4285 | IMERG NRT | PASS | 0.23 d; 4 folders; 4 colorbars |
| B4897 | Seasonal IMERG variation | WARN | No dated file found; check by hand |
| B5046 | Arctic sea ice by year | WARN | 1,305 d |
| B5064 | Antarctic sea ice by year | WARN | 1,305 d |
| B5067 | Earth Observing Fleet – Now | WARN | Undated by listing |
| B5072 | Atlantic hurricane wind plots | WARN | Undated |
| B5099 | Polar sea ice two-year | PASS | 0.93 d |
| B5101 | SST NRT | PASS | 0.81 d; 7 colorbars |
| B5113 | VIIRS fires | PASS | 0.89 d |
| B5120 | GOES East/West | PASS | 0.1 d |
| B5147 | GEOS-FP near-surface temperature | WARN | Undated by listing (page updated 26 Oct) |
| B5148 | GEOS-FP wind | WARN | Undated |
| B5149 | GEOS-FP precipitation + clouds | WARN | Undated |
| B5150 | GEOS-FP humidity | WARN | Undated |
| B5151 | PM2.5 | WARN | 136.8 d |
| B5152 | O3 | WARN | 136.8 d |
| B5153 | CO | WARN | 136.8 d |
| B5154 | NOx | WARN | 136.8 d |
| B5176 | SST anomaly | PASS | 3.33 d; 2 colorbars |
| B5315 | Fire-weather forecast | PASS | 0.06 d |
| B5544 | NDVI | WARN | 135.3 d |
| B5577 | SDO Sun This Week | WARN | Undated |
| B5584 | Landslide exposure | PASS | 0.17 d |

### C. Frame inversion

| ID | Test | Latest | Result |
|---|---|---|---|
| C5176 | Anomaly vs CRW | WARN (by threshold; usable) | n 1,500; sign 91% (n 1,101 with \|a\| ≥ 0.5); ρ 0.79; median −0.31 °C (\|·\| 0.46); ticks 9/9 |
| C5151 | PM2.5 frame vs GEOS-CF | WARN → **drop** | 1 point (1%) matched the colour scale |
| C5147 | Temperature frame vs GEOS-CF | WARN (R3) → retried R4 | 100% matched, ρ 0.68 (model time 30 Oct, not the frame's time) |
| C5148 | Wind frame vs GEOS-CF | WARN (R3) → retried R4 | 69% matched, ρ 0.40 |
| C5150 | Humidity frames | PASS | 1 MP4 + 14 PNG; no frames folder |
| C5113 | Fire hot pixels vs FIRMS | WARN | Tile ρ 0.60 (R2) / 0.62 (R3); CHT 5-day: 2–3 |
| C5315 | FWI classes, Bangladesh, archive | PASS | 6 distinct classes; 93% decode; all BD points "very low"; archive saved |
| C5584 | Landslide freshness | PASS | 0.17 d |
| C5544 | NDVI freshness | WARN | 135.3 d → use E10 / D08–D09 |

### D. NASA catalogue sweep (CMR; newest granule age, R2–R3)

| ID | Collection | Latest | Newest / note |
|---|---|---|---|
| D01 | MUR SST v4.1 | PASS | 1.46 d |
| D02 | IMERG Late HH (`GPM_3IMERGHHL`) | PASS | 0.63 d |
| D03 | IMERG Early HH | PASS | 0.21 d |
| D04 | IMERG Final HH | WARN | Ends 30 Sep 2025 (390 d) |
| D05 | IMERG Late daily | PASS | 1.33 d |
| D06 | GRACE/GRACE-FO mascon RL06.3 v4 CRI | PASS | 16 Jul 2026 (101 d) |
| D07 | MERRA-2 M2T1NXAER | PASS | 24 d |
| D08 | MOD13Q1 NDVI | PASS | 10 d |
| D09 | VNP13A1 NDVI | PASS | 10 d (**SNPP**) |
| D10 | VNP46A2 Black Marble | PASS | 8.3 d (**SNPP**) |
| D11 | VJ146A2 Black Marble (NOAA-20) | PASS | 8.3 d |
| D12 | VNP46A1 | PASS | 1.3 d (**SNPP**) |
| D13 | SMAP SSS JPL 8-day V5 | PASS | 4.8 d |
| D14 | SMAP SM L3 enhanced (`SPL3SMP_E`) | PASS | 1.3 d |
| D15 | OPERA DSWx-S1 | PASS | 1.3 d |
| D16 | OPERA DSWx-HLS | PASS | 2.1 d |
| D17 | OPERA DIST-ALERT | PASS | 2.1 d |
| D18 | SWOT RiverSP Version D | PASS | 5 d |
| D19 | LHASA v2 (GES DISC) | WARN | Ends 10 Feb 2021 |
| D20 | MCDWD flood NRT | PASS | 0.33 d |
| D21 | TROPOMI NO2 NRT | PASS | 1 d |
| D22 | EMIT CH4 plumes | WARN | Newest 23 Jan 2023 |
| D23 | OCO-2 Lite | WARN | 89 d |
| D24 | ISS-LIS | PASS | Ended 2023 (as expected) |
| D25 | LIS/OTD diurnal climatology (`lolrdc`) | PASS | Static (to 2014) |
| D26 | ECOSTRESS LST | PASS | 4.5 d |
| D27 | PACE OCI L3M BGC NRT | PASS | 1.3 d |
| D28 | NEX-GDDP-CMIP6 in CMR | FAIL (expected) | Served from NCCS THREDDS + S3 (E13 works) |
| D29 | NASA-SSH GMSL indicator | PASS | 13 d |
| D30 | CMS global mangrove canopy | PASS | Static |
| D31 | CYGNSS L2 | PASS | 5.3 d |
| D32 | GEDI L2A | PASS | 323 d |
| D33 | HLS L30 | PASS | 2.2 d |
| D34 | VNP14IMG_NRT | PASS | 0.49 d (**SNPP**) |
| D35 | AMSR2 REMSS L3U RT | WARN | 7.6 d |
| D36 | OSTIA | PASS | 0.33 d |
| D37 | SEDAC GPW v4.11 | PASS | 2020 product |
| D38 | CERES SYN1deg | WARN | 86 d |
| D39 | GLDAS Noah 0.25° 3-h | WARN | 86 d |
| D40 | VIIRS snow VJ210A1 | PASS | 0.49 d |
| D41 | ICESat-2 ATL08 | PASS | 115 d |
| D42 | MAIAC MCD19A2 | PASS | 4.4 d |
| D43 | ECOSTRESS ET (`ECO_L3T_JET`) | PASS | 19 d |

### E. NASA values (Earthdata Login)

| ID | Test | Latest | Result |
|---|---|---|---|
| E1 | MUR vars at Bay points | PASS | Variables present; Bay span 1.16 °C = 0.7 st |
| E2 | IMERG point-series speed | WARN | 2.84 s/file → 13.8 h per cell-year |
| E3 | MERRA-2 PM2.5 Dhaka | PASS | 22.8 µg/m³ (27 Aug); 16.1 (26 Aug, R1) |
| E4 | SMAP SSS Oct vs Apr | PASS | 15.81 vs 21.78 psu |
| E5 | Black Marble Dhaka | PASS (R3) | Daily 30.7 / — / 32.2 / 25.5 / 28.2 / —; monthly ≈ 32.3 |
| E6 | SWOT reaches + Hydrocron | PASS (R3) | 1/5 reaches ≥ 3 m: 43499600141 (36 passes, 8.06 m); CORS `*` |
| E7 | OPERA Aug 2024 | PASS (R3, caveat) | 0.000 (HLS) / 0.081 (HLS) / 0.798 (S1): mixed sensors |
| E8 | GLOBE API Bangladesh | WARN | HTTP 202, 0 rows |
| E9 | GISTEMP global annual | PASS | 146 years; 59 semitones on Crawford's step |
| E10 | ORNL MODIS + VIIRS NDVI | PASS | MODIS to A2026241; VIIRS (ORNL) stops A2024145 |
| E11 | AERONET Dhaka + Bhola | PASS | 255 / 320 L1.5 days; last 26 Oct 2026 |
| E12 | FIRMS key + CHT/Punjab counts | PASS | Limit 5,000/10 min; CHT NOAA-21 2; Punjab SNPP 49+ |
| E13 | NEX-GDDP Dhaka 2081 | PASS | 61 days; Apr–May 2081 mean tasmax 36.1 °C (1 model, SSP5-8.5) |
| E14 | SST triad | WARN | MUR 30.18 (22 Oct) vs AMSR2 31.39 (17 Oct); not like-for-like |
| E15 | Mauna Loa CO2 | PASS | 426.96 ppm (24 Oct) |
| E16 | LIS/OTD diurnal variable | PASS | 6 variables with a 24-step axis |
| E17 | LHASA granule | PASS (old) | 2015 granule; `p_landslide` |
| E18 | ACAG | PASS | 6 versions; 25 links (download by hand) |

### F. Partner / other agencies

| ID | Test | Latest | Result |
|---|---|---|---|
| F1 | JAXA Earth API + STAC | PASS | 8 GSMaP + 8 SST collections; Python installed; STAC 200 |
| F2 | CRW DHW St Martin's | PASS | 68/81 valid; 3.23–3.99 °C-weeks (24 Oct) |
| F3 | OISST via ERDDAP | PASS | 29.98 °C (10 Oct) |
| F4 | Himawari-9 / GK2A on AWS | PASS | Newest 0.2 h |
| F5 | Open-Meteo CAMS/GloFAS/ERA5 | PASS | CAMS 32–36; GloFAS ≈ 2,343–2,414 m³/s; CORS `*` |
| F6 | CDS ERA5 | SKIP | No key |
| F7 | ADS CAMS | SKIP | No key |
| F8 | EWDS GloFAS | SKIP | No key |
| F9 | NISAR over the Sundarbans | PASS | 10 products; newest 23 Oct 2026; ~6.6 GB each |
| F10 | Sea Ice Index v4 | PASS | Arctic 6.717 M km² (17 Oct) |
| F11 | IBTrACS NI | PASS | 62,864 rows; recent Bay storms listed |
| F12 | PSMSL gauges | PASS | Hiron Point 1983–2003; Cox's Bazar 1978–2000; Chittagong 1983–1992 (metric) |
| F13 | USGS + EarthScope WAV | PASS | Mandalay M7.7 at IU.CHTO → WAV |
| F14 | OpenAQ locations | PASS | Dhaka 15, Chattogram 0 |
| F15 | WAQI | WARN | DoE @538612 200; Embassy @8781 404; values need a token |
| F16 | Embassy EPA files | WARN | 403 for scripts: download by hand |
| F17 | xeno-canto Doel | WARN | 4 recordings, all NC-SA |
| F18 | Freesound CC0 rain | PASS (R3; widened in R4) | 0 CC0 for one query (R3); 5 queries in R4 |
| F19 | NOAA passive acoustic bucket | PASS | Prefixes listed |

### G. Live keyless APIs

| ID | Test | Latest | Result |
|---|---|---|---|
| G1 | USGS feed | PASS | 20 significant quakes this month; `*` |
| G2 | GEOS-CF Zarr PM2.5 Dhaka | PASS | v1 ana 248.8 (2 Jan 2026, ended); v2 ana 111.7 (24 Oct) / 105.3 (25 Oct); v2 fcst 54.3 |
| G3 | EONET | PASS | 50 open events; `*` |
| G4 | SWPC RTSW | PASS | New fields incl. `proton_speed` |
| G5 | DONKI | **FAIL** | 503 (R2–R4), even with a key |
| G6 | CelesTrak | PASS | Terra, Aqua, SNPP, NOAA-20/21, GPM, SMAP, SWOT, PACE, Landsat 9 |
| G7 | GIBS layers + colormap decode | PASS | MUR25: 216 entries; 100% decode; tile `*` |
| G8 | VEDA + GHG Center STAC | PASS | 247 / 37 collections |
| G9 | POWER reachability | PASS | `*` (excluded for long-term claims) |

### H. Bangladesh local

| ID | Test | Latest | Result |
|---|---|---|---|
| H1 | FFWC API + data.gov.bd | WARN | `api3.ffwc.gov.bd` unreachable; main site 200 |
| H2 | BMD portals | PASS | 200 (display only) |
| H3 | HydroShare wells | PASS | 2 resources |
| H4 | geoBoundaries ADM2 | PASS | 64 districts; CC BY 3.0 IGO |
| H5 | Disasters Charter 905 / 762 | WARN | Timeouts (open in a browser) |

### I. Engine math

| ID | Test | Latest | Result |
|---|---|---|---|
| I1 | Proof in unison | PASS | Beat = \|f1−f2\|; 0.31 °C = 0.19 st |
| I2 | Scrub re-synthesis | PASS | Identical at 0.5/1/4× |
| I3 | Swara + meend | PASS | 0.0000 cents max over 200 values |
| I4 | Shared water scale | PASS | 9.4× shared vs 1.5× per series |

### J. EIC gallery

| ID | Test | Latest | Result |
|---|---|---|---|
| J0 | EIC inventory | PASS | 72 items; 11 frame-pairable; `samples/J0_eic_inventory.csv` |
| J1 | Beauty pieces | PASS → corrected by L4 | 4950 looked pairable; it is not (16:9 renders) |

### K. One value test per EIC area (+ extras)

| ID | Test | Latest | Result |
|---|---|---|---|
| K1 | NASA-SSH GMSL | PASS | 1,752 rows; last 11.58 (units open) |
| K2 | Dhaka PM2.5: ground vs CAMS vs GEOS-CF | **PASS** (R5) | Ground 72.2 (11 stations ≤ 6 h) vs CAMS 127.1 vs GEOS-CF v2 50.4; ratios 1.76 / 0.70 |
| K3 | PACE chlorophyll + GBIF + mangrove granules | PASS (R3; PACE re-run R4) | GBIF 16,679 Doel records with a monthly profile; mangrove tiles found |
| K4 | FIRMS national 10-day | PASS | 0 / 0 / 0 |
| K5 | GHG Center point values | WARN (R3) → R4 | 0/6 (S3 403) → **3/6** via TiTiler |
| K6 | POWER solar vs ERA5 | PASS | r 0.85; −0.44 kWh/m²/day |
| K7 | EONET + LANCE flood | PASS | 367 events incl. TC Arnab (25 Oct 2026); flood granule |
| K8 | Wells × GRACE | **PASS** (R5) | 1,268 stations; seasonal r +0.93; 2.7 m vs 41 cm |
| K9 | Bogura NDVI | PASS | Peaks > 0.5: 16 Oct 2025, 9 May 2026, 10 Jun 2026 |
| K10 | IMERG × GSMaP | **PASS** (R5) | 10 pairs; r 0.95 |
| K11 | Amphan cold wake | PASS | Mean −2.79; strongest −3.92 °C (12 points) |
| K12 | Remal night lights, Khulna | PASS (inconclusive) | Min 4.17; min/median 0.47; clouds |
| K13 | SMAP soil moisture seasons | WARN (R3) → **PASS** (R4) | 0.304 (Feb) vs 0.427 (Aug) |
| K14 | Worldview snapshot | PASS | 200, JPEG, `*` |
| K15 | GIBS decodable per area | PASS | 7/9 areas; no fire or GHG layer |
| K16 | VEDA point values | WARN (R3) → R4 | 0/8 → **6/8** via TiTiler |
| K17 | Partner holdings in CMR | PASS | JAXA/ESA/ISRO 0 (use their own services); LPCLOUD 760; USGS_EROS 1 |
| K18 | Giovanni | PASS | UI 200; API 403 |

### L. Gaps closed

| ID | Test | Latest | Result |
|---|---|---|---|
| L1 | CMS Bangladesh mangrove height + biomass | PASS (R4) | Sundarbans centre 10.2 m, 67 Mg/ha (2000-era baseline) |
| L2 | GEDI L3 + L4B | PASS (R4) | Sundarbans 6.0/9.9/2.8 m; Madhupur 7.1; Lawachara 17.2; Dhaka 17.0 |
| L3 | ICESat-2 ATL08 Sundarbans | PASS (R4) | Median 7.9 m (n = 2) |
| L4 | 4950 frame vs GEDI | **WARN (R6, expected)** | 127 files, 39 images, 2 colorbars, 35 large, 0 flat 2:1; 16:9 render folders |
| L5 | ECOSTRESS ET at Dhaka pixels | R4 (not rerun) | Value in the run-4 report |
| L6 | CERES SYN1deg Dhaka (HDF4) | **PASS** (R5) | SW down 190.6; TOA SW up 168.6; TOA LW up 198.0 W/m² |
| L7 | GPW population | **PASS** (R5) | Dhaka 7,920; Chattogram 4,018; Khulna 1,056 /km² (30′) |

**Browser checks** (`bloop_browser_checks.html`): CORS per API from our origin, GIBS canvas pixel read, Bangla voices, vibration, Web Audio features. **Not run yet.**

**Earlier team tests** (Sep, [TR]):
- A prior art: CONTINUE · B reuse: PASS · C SST: PASS (old 0.85 → now 0.31) · D rain qualifies: PASS · D2 rain fidelity: PASS.
- T1 browser access: SVS blocked · T2 frame inventory · T3 sound responsiveness: PASS.
- P1 POWER: speed FAIL · P1b POWER cross-check: FAILED · P2 FIRMS: PASS · P3 GRACE: PASS · P4 NDVI: PASS · P5 GLOBE: PASS via CSV.

---
# APPENDIX B: Research and precedent library

## B.1 NASA / EIC ecosystem

- **EIC exhibits.** Hyperwalls at NASA HQ, the Smithsonian NMNH and Kennedy Space Center, with "dashboards with real-time data on Earth systems".
  - HQ's "Earth Pulse" is an LED sculpture tracking communications between Earth missions and ground stations ([earth.gov](https://earth.gov/visit/exhibit/nasa-hq)).
  - Visitors are "greeted by chirping birds and other natural sounds", and visualizations are "updated as often as six minutes" ([NASA](https://science.nasa.gov/science-research/earth-science/nasas-new-exhibit-showcases-our-home-planet-and-climate/)).
  - EIC content is shared with museums, planetariums, libraries and schools ([NISE Net slides, Oct 2025](https://www.nisenet.org/sites/default/files/catalog/uploads/10-7-25_-_diy_nasa_exhibits_master_slides.pdf)).
- **Nine EIC focus areas:** sea level, air quality, biodiversity, wildfires, greenhouse gases, energy, disasters, water resources, agriculture ([SVS hyperwall playlist](https://svs.gsfc.nasa.gov/gallery/hyperwall-power-playlist-earth-science/)).
- **SVS.**
  - [Daily Visualizations gallery](https://svs.gsfc.nasa.gov/gallery/daily-visualizations/) and [EIC gallery](https://svs.gsfc.nasa.gov/gallery/earth-information-center/).
  - The public JSON API (e.g. [/api/4285](https://svs.gsfc.nasa.gov/api/4285)) returns titles, alt text and file lists.
  - [SVS 14983 "Cosmic Echoes"](https://svs.gsfc.nasa.gov/14983) puts Landsat crop data into audio.
- **GIBS/Worldview.**
  - MUR SST and MUR anomaly layers; 30-min IMERG ([release note](https://wiki.earthdata.nasa.gov/x/eRWECg); [IMERG explainer](https://ceosr.science.gmu.edu/global-rainfall-at-your-fingertips/): mid-period rates in mm/h, ~5 h latency).
  - Colormaps carry a `sourceValue` per colour.
- **NASA sonification.**
  - [Chandra "A Universe of Sound"](https://chandra.si.edu/sound/listen.html): "a translation of the data, not a reimagining"; one instrument per layer ([blog](https://chandra.harvard.edu/blog/node/899)).
  - Perseus shifted up 57–58 octaves ([Chandra 2022](https://chandra.harvard.edu/photo/2022/sonify5/)).
  - [SYSTEM Sounds Earth Day](https://www.system-sounds.com/earth-day/); Goddard "Sounds of the Sea".
  - [Earthdata NDVI "From Data to Melody"](https://www.earthdata.nasa.gov/news/blog/from-data-melody-data-sonification-its-role-open-science): higher NDVI = lower notes.
  - [SOHO "Sounds of the Sun"](https://www.nasa.gov/solar-system/sounds-of-the-sun/): 40 days sped up 42,000×.
  - [HARP volunteers found events by ear](https://science.nasa.gov/get-involved/citizen-science/volunteers-discover-rare-space-weather-events-using-their-ears/).
- **Space Apps.**
  - [2023 winners (Arcobaleno, Global Connection)](https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners).
  - [2024: 9,996 submissions, 10 winners](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/).
  - [2025 winners](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/): none mention sound.
  - [2018 Soundiverse](https://2018.spaceappschallenge.org/challenges/help-others-discover-earth/artify-earth/teams/spart/project).
  - [AstroSonix, 6th of 71 locally](https://eng.pw.edu.pl/News/An-app-that-allows-you-to-hear-images-from-space).
  - [2013 "Listening to the Stars"](https://2013.spaceappschallenge.org/challenge/listening-to-the-stars).
  - [UWC ISAK 2024 local placement](https://uwcisak.jp/blog/news-events/uwc-isak-japan-students-shine-at-nasa-space-app-challenge-japan/).
- **2026 theme and partners:** [NASA SMD release (via astrobiology.com)](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/), 17 Space Agency Partners (Angola, Bahrain, Brazil, CSA, ESA, ISRO, ASI, JAXA, KASA, MBRSC, CONAE, NASRDA, Paraguay, Senegal, Spain, Turkey, UKSA). CNES, DLR, NOAA, USGS, JMA, KMA and the UK Met Office are not partners: count them as "other agency".

## B.2 Academic: sonification, accessibility, perception

| Work | Finding | Use |
|---|---|---|
| iSonic, Zhao et al. (TOCHI 2008) [link](https://dl.acm.org/doi/10.1145/1352782.1352786), [PDF](https://www.cs.umd.edu/users/ben/papers/Zhao2008Data.pdf) | 7 blind users, 42 h; gist → navigate → filter → details; **95% vs 33% (Excel)** task success | Keypad map, gist sweep, classify mode |
| Umwelt, Zong et al. (CHI 2024) [doi](https://doi.org/10.1145/3613904.3641996), [arXiv](https://arxiv.org/html/2403.00106v2) | Vis + sonification + text as equal views; sound for trends, text for values; "min/max hard if not impossible from sonification" | Shared cursor; speech for exact values |
| MAIDR, Seo et al. (CHI 2024) [arXiv](https://arxiv.org/abs/2403.00717) | Braille/text/sonification/review modes; 11 blind participants; SUS 70–81; high-frequency hearing loss gained more from text | Modality keys; low-band preset |
| MAIDR meets AI (ASSETS 2024) [link](https://dl.acm.org/doi/fullHtml/10.1145/3663548.3675660) | Blind users want to verify AI answers | Check the AI by ear |
| AltGeoViz (VIS 2024) [arXiv](https://arxiv.org/abs/2406.13853) | Dynamic 3×3 alt text for map views | Spoken area summaries |
| VizAbility (UIST 2024) [doi](https://doi.org/10.1145/3654777.3676414) | LLM Q&A with structured outputs; 87.39% classification | Grounded Q&A pattern |
| Walker 2002; Walker & Mauney 2010 [PubMed](https://pubmed.ncbi.nlm.nih.gov/12570096/), [ACM](https://dl.acm.org/doi/abs/10.1145/1714458.1714459), [PDF](https://wirelessrerc.gatech.edu/sites/default/files/publications/walker_et_al_-_a_comparison_of_sonification_mappings.pdf) | Polarity by dimension; **BLV 10/10 positive frequency:temperature**; sighted 11–6; slope 0.64; tempo:temperature BLV 6 vs 2; cross-group r 0.818 | Polarity guardrail; J3 zoom; I3 |
| Arcand et al. 2024 [doi](https://doi.org/10.3389/fcomm.2024.1288896); [astrobites](https://astrobites.org/2024/06/28/tuning-in-to-the-sound-of-the-universe/) | 3,184 participants; self-reported learning, enjoyment and trust; misunderstandings without explanation | Legends required; our task accuracy is a different kind of evidence |
| Tucker Brown et al. 2022 [arXiv](https://arxiv.org/pdf/2209.04465) | **No significant benefit** from adding sound for detection; sound alone worse; Diaz-Merced 2013: benefit only with a synced visual cursor | Don't claim ears beat eyes; synced cursor |
| Bearman 2013 [Zenodo](https://zenodo.org/records/13809573), [paper](https://ueaeprints.uea.ac.uk/33330/1/Bearman_paper.pdf); Fisher 1994; Ballatore 2018 | Uncertainty sonification exists; loudness/order/clarity intuitive; phi 0.680 → 0.768 | C5 |
| Audiovisual semiotics of uncertainty (2025) [arXiv](https://arxiv.org/html/2505.14379) | Loudness suits uncertainty; redundant AV helped | C5 |
| Chundury et al. (TACCESS 2026) [doi](https://doi.org/10.1145/3798100) | Finger-drag with continuous sound is intuitive but needs practice | Touch mode + tutorial |
| Lindborg et al. 2022, 32 climate sonifications [link](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.1020102/full) | Arbitrary-feeling sound is ineffective; calls for listening tests | Ecological sounds; C6 |
| Enge et al. [arXiv](https://arxiv.org/abs/2402.16558) | ~1/3 of audiovisual sonification papers have no evaluation | C6 |
| Nature Reviews Earth & Environment 2024 [link](https://www.nature.com/articles/s43017-023-00512-y) | Sonification for Earth-science communication | Framing |
| Erie (CHI 2024) [arXiv](https://arxiv.org/abs/2402.00156), [repo](https://github.com/see-mike-out/erie-web) | Declarative sonification + auditory legends | `mapping.json` spec |
| STRAUSS (JOSS 2025) [repo](https://github.com/james-trayford/strauss), [paper](https://arxiv.org/pdf/2311.16847) | Python sonification + TTS; Spectraliser does inverse spectrograms | Offline renders; not novel |
| Trayford et al. 2023 [RASTI](https://doi.org/10.1093/rasti/rzad021) | 58 listeners' ratings of spectral audifications correlate with measured quantities | Frame-to-spectrum validity |
| Zanella et al. 2022 [Nature Astronomy](https://www.nature.com/articles/s41550-022-01721-z); [UNOOSA 2023](https://www.unoosa.org/documents/pdf/Space4PersonswithDisabilites/UNOOSA_Special_Report_on_Sonification_2023.pdf) | Lack of standardisation is a "major limitation" | Publish our spec |
| Hermann's criteria [sonification.de](https://sonification.de/?p=39); Handbook ch. 15 [link](https://sonification.de/handbook/chapters/chapter15) | Systematic, reproducible; beating reference tones; quantised scales for categories | C1, B3, B8 |
| Neuhoff et al. [link](https://repository.gatech.edu/entities/publication/b42c37f0-ff76-47b9-833e-24b977198d26) | Pitch–loudness interaction; rising loudness overestimated | Guardrail 4 |
| Pulse oximetry auditory display [Arizona](https://experts.arizona.edu/en/publications/evaluation-of-an-enhanced-pulse-oximeter-auditory-display-a-simul/) | Range changes found 100% in 3.3 s vs 73.2% in 27.4 s | B4, F3 |
| GerontoVis [arXiv](https://arxiv.org/pdf/2403.13173); ICAD 2024 paper 35 [PDF](https://icad2024.icad.org/wp-content/uploads/2024/06/ICAD_2024_paper_35.pdf); TUS thesis [link](https://research.tus.ie/en/publications/developing-a-framework-for-the-perceptually-congruent-sonificatio/) | Presbycusis; design for varied hearing; 400–1400 Hz may suffice | Earth Ear ID |
| Accessible Oceans (NSF) [PDF](https://informalscience.org/wp-content/uploads/2023/12/AccessibleOceans_2115751.pdf) | Co-design with BLV, then 3 schools for the blind + 4 informal venues | J6 method |
| LightSound [Smithsonian](https://www.smithsonianmag.com/smart-news/this-handheld-device-allows-blind-people-to-experience-the-solar-eclipse-with-their-ears-180984062/); [CNN](https://edition.cnn.com/2024/04/06/world/lightsound-device-eclipse-visually-impaired-scn) | Timbre switches by regime; ~900 devices in 2024 | B4 |
| Eclipse Soundscapes [BAAS](https://baas.aas.org/pub/2024n7i124p03) | 7,190+ participants | L1, F5 |
| Copernicus GC referee (Earth System Music) [RC2](https://gc.copernicus.org/preprints/gc-2019-28/gc-2019-28-RC2.pdf) | Wants value anchors, silences between datasets, evidence; flags "biased interpretation" | A2, C2, C4, E1 |
| ENSO → gamelan [arXiv 2602.14560](https://arxiv.org/html/2602.14560) | No perceptual validation | H-family invariant |
| Multimodal models misread legends [arXiv 2601.12585](https://arxiv.org/pdf/2601.12585); [ThermEval](https://arxiv.org/pdf/2602.14989) | Offset and decimal errors | AI-3 |
| Data Player [arXiv](https://arxiv.org/pdf/2308.04703); DataReel [arXiv](https://arxiv.org/pdf/2604.25220); Earth Copilot [repo](https://github.com/microsoft/Earth-Copilot/blob/main/README.md); Talk2Data [arXiv](https://arxiv.org/html/2511.18405v1) | Plan/generate/verify agents; NASA–Microsoft agents with MCP | AI-2, AI-4, AI-6 |
| Colour inversion prior art: mcgibs, `unmap`, Poco/Mayhua/Heer 2018, [arXiv 2507.20632](https://arxiv.org/abs/2507.20632) | Colour → value exists; none starts from EIC frames, validates vs the source, or makes sound | §3.2 not-new list |

## B.3 Artists and works

| Work | Lesson |
|---|---|
| Daniel Crawford, *A Song of Our Warming Planet* (2013) [MPR](https://www.mprnews.org/story/2013/07/09/how-a-university-of-minnesota-student-set-global-warming-to-music); *Planetary Bands* quartet (2015) [Eos](https://eos.org/articles/musical-composition-conveys-climate-change-data) | ~0.03 °C per semitone, coldest year lowest; one instrument per latitude band on a **shared** step; "visceral response" |
| Loud Numbers (Geere & Quick) [Ableton](https://www.ableton.com/fr/blog/sound-the-alarm-data-sonification-as-a-tool-for-climate-action) | Time series first; simple mappings; test extremes; atmosphere for emotion; hotter = louder + rougher; "End of the Road" thins to silence as loss; Maeder: COP21 audience already convinced |
| Bernie Krause [Hyperallergic](https://hyperallergic.com/bernie-krause-great-animal-orchestra) | Biophony/geophony/anthrophony; the same meadow, June 1988 vs June 1989 |
| Katie Paterson, *Langjökull, Snæfellsjökull, Solheimajökull* [site](https://katiepaterson.org/?p=199) | Ice records played until they melt |
| Martin et al., familiar audio degraded by the Living Planet Index (n = 13) [St Andrews](https://research-portal.st-andrews.ac.uk/en/publications/representing-biodiversity-decline-data-by-manipulating-familiar-a/) | Stronger emotion than a static graph |
| Brian Foo, *Two Trains* [Hyperallergic](https://hyperallergic.com/data-driven-music-to-for-the-disharmony-of-new-yorks-income-inequality) | Instrument count follows data over 48 segments |
| Jamie Perera, 12,000 years live [CLIMARTE](https://climarte.org/project/jamie-perera-performance/) | Compression as a doorway |
| Nagai string quartet (iScience 2024) [phys.org](https://phys.org/news/2024-04-driven-music-climate.html); de Mora *Earth System Allegro* [EGU23](https://presentations.copernicus.org/EGU23/EGU23-8540_presentation.pdf) | Musification with composer intervention |
| HadCRUT3 deviation panning [Duke](https://people.duke.edu/~scott1/climate.html); USPTO 9918679 | Deviation mapping precedent; discrete levels easier to learn |
| Leah Barclay, *River Listening* [ISEA 2024](https://isea2024.isea-international.org/river-listening/) | River framing |
| Jana Winderen hydrophone works [Onassis](https://onassis.org/whats-on/climate-culture/audiovisual-works/spring-bloom-in-the-marginal-ice-zone) | Real signal + data |
| No Man's Sky "Pulse" (Paul Weir) [Audiokinetic](https://www.audiokinetic.com/en/blog/behind-the-sound-of-no-mans-sky-a-qa-with-paul-weir-on-procedural-audio) | Rules choose curated fragments |
| Farnell, *Designing Sound* [MIT Press](https://mitpressbookstore.mit.edu/book/9780262014410) | Procedural fire/rain/instruments |
| Okjökull plaque [Al Jazeera](https://www.aljazeera.com/news/2019/8/18/iceland-bids-farewell-to-first-glacier-lost-to-climate-change) | "A letter to the future… 415 ppm" |
| Pratyay Raha, *MetaMangrovis* [Goethe-Institut](https://goethe.de/ins/in/en/sta/ban/ueb/rex/exr/rah.html) | Sundarbans sound art, not data-driven |

## B.4 Bangladesh context

- **Cyclone Preparedness Programme:** 76,000 volunteers; radio, TV, text and mosque speakers; deaths fell from ~500,000 (1970) to 26 (Amphan 2020), an outcome of the whole system ([TBS](https://www.tbsnews.net/thoughts/50-years-cyclone-preparedness-success-saving-lives-not-livelihood-368398)).
- **During Mora:**
  - Red Crescent megaphone warnings ([Red Cross](https://www.redcross.org/about-us/news-and-events/news/Early-warning-saves-lives-as-Cyclone-Mora-strikes-Bangladesh-and-Sri-Lanka.html));
  - **176 hours** of community radio from 7 stations, including Sagor Giri 99.2 in Sitakund, with BMD updates every 15 min ([Citizen's Platform](https://bdplatform4sdgs.net/community-radio-stations-coastal-areas-bangladesh-broadcast-176-hours-radio-programs-address-cyclone-storm-mora/));
  - the 2013 hotline was criticised for lacking localised alerts ([PreventionWeb](https://www.preventionweb.net/go/33001)).
- **YPSA (Chattogram):** Bangla accessible audio; over 80% of team members have disabilities ([Zero Project](https://zeroproject.org/view/project/2694365d-9217-eb11-a813-0022489b3a6d)). Blindness affects 1.0% of people aged 40+ ([IAPB](https://www.iapb.org/fr/blog/bangladesh-fresh-evidence-on-blindness-and-visual-impairment/)).
- **Lightning:**
  - 69% of Bangladesh lightning is pre-monsoon, with the strongest sunrise-to-midday peak anywhere ([NASA EO](https://science.nasa.gov/earth/earth-observatory/assessing-lightning-risk-in-south-asia-149447));
  - ≥ 3,835 deaths 2015–2025 and ≥ 74 in 2026 by 28 Apr (DDM figures via TBS); no national ground lightning network ([TBS](https://www.tbsnews.net/features/panorama/bangladeshs-fatal-lightning-strikes-are-no-longer-just-natural-hazard-1424301)).
- **SWOT imaged flooded Sylhet** on 8 Oct 2023 ([JPL PIA26343](https://www.jpl.nasa.gov/images/pia26343-swot-captures-flooding-in-bangladesh/)).
- **Air:**
  - Embassy annual means 79.7–98.0 µg/m³ ([PMC10581604](https://pmc.ncbi.nlm.nih.gov/articles/PMC10581604)); feed halted 4 Mar 2025 ([ADN/AP](https://www.adn.com/nation-world/2025/03/05/state-department-halts-global-monitoring-of-air-pollution));
  - DoE CAMS network launched 19 Nov 2023 ([Daily Star](https://www.thedailystar.net/tech-startup/news/real-time-air-quality-tracking-launched-across-bangladesh-3474436));
  - MERRA-2 underestimates by about −27 µg/m³ a year over India, with daily r ≈ 0.6 ([Navinya 2020](https://doaj.org/article/01dd57e659014a00a3f05ca82d86b0af));
  - Dhaka MAIAC AOD: 0.79 in winter vs 0.55 in autumn ([Springer 2025](https://link.springer.com/article/10.1007/s11270-025-08023-w));
  - MERRA-2 vs AERONET R² 0.72 ([Zaman, ACAM 2023](https://www.acom.ucar.edu/webt/ACAM/2023/presentations/O6.03_Zaman.pdf)).
- **Rain:** GSMaP V8 vs 35 BMD gauges: daily r 0.50, monthly r 0.94 ([IPWG 2024](https://www.eorc.jaxa.jp/IPWG/meetings/tokyo-2024/pdf/Session10/flash_talk/10.18_Assessment%20of%20Global%20Satellite%20Mapping%20of%20Precipitation%20Data%20for%20Rainfall%20Measurement%20in%20Bangladesh_Rafiuddin,%20M.%20M.%20Rafiuddin.pdf)). IMERG overestimates intense-event occurrence against 31 gauges ([CGIAR](https://www.cgiar.org/research/publication/intense-precipitation-events-during-the-monsoon-season-in-bangladesh-as-captured-by-satellite-based-products)).
- **Sea level:** JPL reports a 2024 rise of 0.59 cm/yr vs 0.43 expected ([JPL](https://www.jpl.nasa.gov/news/nasa-analysis-shows-unexpected-amount-of-sea-level-rise-in-2024/)), covered in Bangladesh media ([Financial Express](https://thefinancialexpress.com.bd/environment/nasa-analysis-shows-unexpected-sea-level-rise-in-2024)).
- **Culture:**
  - Raga Megh / Malhar for the monsoon, Basant / Bahar for spring ([Megh](https://en.wikipedia.org/wiki/Megh_(raga)); [Eos](https://eos.org/opinions/the-melodies-of-monsoons-weather-in-indian-classical-music): the associations are "mostly subjective");
  - Tagore compositions are public domain (copyright expired 2001) ([Dhaka Tribune](https://www.dhakatribune.com/feature/152394/influence-of-tagore-in-contemporary-music)).
- **Not reached (don't cite yet):** SPARRSO, BARC, BRRI, CEGIS (verified in another chat: riverbank-erosion predictions since 2004), IMD, CPCB, RIMES, ICIMOD RDS, cpp.gov.bd, iNaturalist, eBird.

## B.5 The four criticisms Bloop designs against

1. **Opacity, blending and bias** (the GC referee) → A2, C2, C4, E1 silences.
2. **Wrong audience** (Maeder: COP21 listeners were already convinced) → BLV, radio and kiosk audiences.
3. **No listening tests** (Lindborg; Enge) → C6 pilot.
4. **Cultural scales without perceptual validation** (gamelan) → the H-family invariant + the H1 accuracy test.

## B.6 Frontier technology: useful vs decorative (v1 §9)

| Technology | Job in Bloop | Verdict |
|---|---|---|
| WebGL/WebGPU shader inversion | Per-pixel conversion at frame rate | CORE-OK (needs a performance test) |
| Web Audio + AudioWorklet | Low-latency synthesis | Use |
| three.js / WebXR | 3D jukebox world; AR | V2 (three.js); WebXR RM |
| Vision model + CV colorbar reader | Scale to the EIC catalogue (ticks only; truth-gated) | CORE-OK/stretch |
| LLM with tool calls | Ask the Earth; check the AI by ear | HK optional |
| LLM phrasing of summaries | Fluency | OPT (templates first) |
| Web Speech (TTS/ASR) | Spoken values, voice control | Use (recorded Bangla fallback) |
| HRTF spatial audio | Direction | HK (3D) |
| SGP4 (satellite.js) + CelesTrak | Satellite cues | HK (satellite.js was corrected to match CelesTrak's reference, per CelesTrak's [SGP4 tutorial](https://celestrak.org/software/tutorials/sgp4.php)) |
| Bayesian optimisation of mapping | Tune on listener data | RM |
| pySTEPS optical-flow nowcast | Rain forecast track | RM |
| Audio-language models as listeners | Human vs AI lab | Research |
| Prithvi-WxC / Prithvi-EO [HF](https://huggingface.co/ibm-nasa-geospatial/Prithvi-WxC-1.0-2300M) | "Earth memory" similarity | Research only |
| Generative music models | Labelled interpretation mode only | NO for data |
| Numpy-STL / 3D printing | Tactile records | HK |

---

# APPENDIX C: Keys, setup, rerunning the tests

## C.1 Keys (Colab Secrets or environment variables; never in cells, never committed)

| Name | Needed for | Where |
|---|---|---|
| `EARTHDATA_USERNAME` / `EARTHDATA_PASSWORD` | All E/K/L value tests | urs.earthdata.nasa.gov (approve **NASA GESDISC DATA ARCHIVE**) |
| `FIRMS_MAP_KEY` | C5113, E12, K4 | FIRMS API page ("MAP_KEY", free). Replace with `PASTE_YOUR_MAP_KEY` before committing anything |
| `OPENAQ_API_KEY` | F14, K2 | explore.openaq.org account → API key. **Server-side only** in the app |
| `NASA_API_KEY` | G5 (DONKI, optional) | api.nasa.gov. **Regenerate it**: the old key appeared in run-3 output |
| `XC_API_KEY` | F17 | xeno-canto account (API v3) |
| `FREESOUND_TOKEN` | F18 | freesound.org/apiv2/apply |
| `WAQI_TOKEN` | F15 (optional) | aqicn.org/data-platform/token |
| `CDSAPI_KEY`, `ADSAPI_KEY`, `EWDSAPI_KEY` | F6–F8 (optional; F5 covers these keyless) | Copernicus accounts; accept each dataset's licence first |
| `FFWC_TOKEN` | H1 | After registering at api.support@bwdb.gov.bd |
| `HYDROCRON_TOKEN` | E6 (not needed in our runs) | — |

The script masks every configured secret value, plus `api_key=` / `token=` / FIRMS URL keys, in all printed and saved output.

## C.2 Running

- **Colab:** upload the latest notebook (`bloop_data_tests_v3_4.ipynb`), add the Secrets, run all.
- **Subsets:**
  - the last cell takes `run([...])`;
  - a single letter runs a group (`run(['K'])`);
  - otherwise IDs are exact (`run(['A2','A3'])`).
- **Speed:** `BLOOP_SKIP_HEAVY=1` skips big downloads; `BLOOP_MODE=FULL` uses bigger samples.
- **App overrides:** `BLOOP_APP_DATA`, `BLOOP_APP_MAPPING` if the app moves its data.
- **Terminal:** `python bloop_data_tests.py A2 A3 --no-install`.
- **Outputs:** `bloop_test_results/REPORT.md`, `results.csv`, `results.json`, `samples/`, plus `fwi_archive/`.
- **Next runs:**
  - `run(['A2','A3'])` after the refresh and the mapping fix;
  - `run(['E5','E12','C5113','K4'])` after 2 Nov (S-NPP);
  - `run(['C5315'])` daily.
- **Browser checks:** put `bloop_browser_checks.html` in `public/` and open it on the deployed site (laptop Chrome, Android, iPhone). "Run all checks", then "Copy results JSON".

## C.3 Security constraints

Never commit keys, `.nc`, `.exr` or `.HDF5` files · keep Earthdata credentials out of the repo · OpenAQ and FIRMS keys stay server-side · use the email address only for identification.

---

# APPENDIX D: Glossary

| Term | Meaning |
|---|---|
| EIC | NASA's Earth Information Center: exhibits and dashboards; its daily visualizations are made by SVS |
| SVS | NASA's Scientific Visualization Studio |
| Frame | One image of a visualization at one time |
| Colorbar / LUT | The legend mapping colours to values; our lookup table reverses it |
| Colorbar inversion | Colour → physical value |
| Equirectangular | Flat 2:1 world map (longitude → x, latitude → y) |
| Frame-paired / context | Sound from the EIC frame on screen / from a related dataset, not the frame |
| Proof in unison | Frame tone and source tone together; beats = disagreement |
| Honest silence / neutral texture | Silence for no data / a quiet tick for missing records |
| MUR / IMERG / GRACE / GISTEMP / GPCP / GPCC | NASA/JPL SST · NASA–JAXA rain · gravity-based water storage · station temperature · satellite + gauge rain · gauge-only rain |
| SWOT / Hydrocron / SWORD | NASA–CNES water-height mission / its time-series API / its river reach database |
| GEOS-CF / MERRA-2 / CAMS | NASA model forecast / NASA reanalysis / Copernicus model |
| CRW / DHW | NOAA Coral Reef Watch / Degree Heating Weeks |
| GSMaP | JAXA's satellite rain product |
| FWI | Fire Weather Index |
| CORS | Browser rule that controls which sites may read another site's data |
| BLV | Blind and low-vision |
| HRTF | Head-related transfer function (3D audio) |
| Swara / meend / tala / sam / theka | Note of a raga / glide between notes / rhythmic cycle / its first beat / drum pattern |
| Anomaly | Difference from a stated normal |

---

*End of the Master Build Book. When the 28 Oct statement lands, update §1.1, §1.5, §4.9 (the partner list) and Part 11 first.*
