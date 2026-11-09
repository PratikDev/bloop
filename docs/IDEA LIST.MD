
#creative
1. The literal jukebox — don't just borrow the name, build the object
Vinyl/record interface: each "track" is a place + time window (e.g., "Sundarbans, 2026" or "Arctic, 1985 vs. 2026"). Selecting a record visually "drops the needle" and the sonification plays — ties your UI directly to the challenge's own title instead of defaulting to a dashboard.
Time-machine flip: let the user flip through decades of the same region like flipping through an old jukebox's song list — "hear how Earth's song for this coastline has changed." Strong demo moment: play 1985 vs. 2026 back to back.
Radio-DJ framing: a narrator voice (even simple TTS) introduces each track — "Now spinning: Arctic Requiem, Side B" — adds warmth and a hook for a 240-second video instead of silent data-viz narration.



2. World-instrument atlas — the standout differentiator

Instead of one abstract synth palette everywhere, map each region's data to that region's own traditional instrumentation. Nobody else at this hackathon will think to do this, and it directly answers the brief's "accessible, engaging" language better than tone-mapping ever will:

Sundarbans/Bangladesh monsoon & cyclone intensity → tabla building tempo + bansuri flute swells (and this is a region you can speak to with actual authority, which matters in a judged pitch)
Amazon deforestation → percussion density thinning out as canopy-loss data increases — the silence becomes the data
Sahel/Sahara desertification → kora or desert-blues guitar fading into dry, sparse plucks
Arctic ice melt → sparse bowed strings / glass harmonica, each crack event triggering a literal struck-glass sample
This reframes "sonification" as "giving each part of the planet back its own voice" rather than imposing one Western-orchestral palette on the whole Earth — a genuinely new argument to make in your pitch.



6. Participatory layer
"Flag this moment": let listeners mark instants where the sound "feels wrong" against historical baseline — turns the demo into a discovery narrative (echoes the real HARP/MUSICS case of sonification revealing something a plot missed) rather than a passive playback.
Remix mode: expose a few mapping knobs (which dataset → pitch vs. rhythm vs. timbre) so judges can "remix" a track live during the pitch — a concrete, tactile moment in a 5-minute demo beats a pre-rendered video alone.



7. nasa cosmic exploration data sonification ***
8. Different sorts of earth data available in nasa for example : • Atmosphere: Air quality, clouds, aerosols, temperature profiles, and weather measurements (including data from instruments like VIIRS and MODIS).
• Land Surface: Topography, land cover/use, soil moisture, vegetation indices, surface temperature, and thermal/fire anomalies.
• Oceans: Sea surface temperature, ocean color, sea level rise, and marine currents.
• Cryosphere: Ice sheets, glaciers, sea ice concentration, and snow accumulation rates.
• Terrestrial Hydrosphere: Groundwater, river discharge, and global water cycle components.
• Biosphere & Biological Classification: Ecosystem dynamics, carbon cycle tracking, and habitat monitoring.
• Solid Earth: Geodesy, earthquakes, volcanoes, and crustal motion data from projects like the Space Geodesy Project (SLR, ILRS).
• Human Dimensions: Data assessing how human activities and infrastructure interact with or impact the global environment
[these are from google search]






#bloop sonification data catalogue (upgrade based on other team entries)
# Bloop sonification data catalogue

**Bottom line.** For Challenge #14, Bloop's strongest data position comes from four things. **First, more frames from the same NASA Daily Visualizations gallery it already inverts** (23 items in total, 7 of them missing from the team's earlier list). **Second, the NASA source datasets behind those frames**, used to check the inverted values. **Third, at least one partner-agency "duet"**, led by NASA IMERG × JAXA GSMaP. **Fourth, Bangladesh ground truth with honest gaps.** A bigger list of themed playlists would not add as much.

Planet FM's headline "Dhaka daily AQI 2000–2026" cannot be an observed record. No NASA product gives observed daily surface PM2.5 for Dhaka back to 2000. Public ground monitoring starts in about 2002 (Bangladesh DoE, with gaps) and 2016 (US Embassy, whose feed stopped on 4 March 2025). So that line is either modelled or stitched from several sources. Bloop can replace it with a three-layer, provenance-labelled air track.

The research found no precedent, NASA or Space Apps, that turns visualization colours back into physical values, checks them against the source data, and pairs the sound with EIC frames. On the pages checked, that gap is Bloop's differentiator. A second same-challenge competitor (a GISTEMP-based "Earth Jukebox" on GitHub) confirms that a temperature-to-pitch line is the default solution teams reach for.

**Two cautions.** First, **every CORS status in this report is UNVERIFIED**: no `Access-Control-Allow-Origin` header could be observed from the research sandbox, so a 10-minute browser test comes before any build decision. Second, several sources retired or changed in 2026: the IRIS audio service, the SWPC solar-wind files, SMAP mid-2026 data, NISAR (a summer gap), the Terra/Aqua/Aura satellites, and the US Embassy feed. Building on them unknowingly would undermine the verification story. None of this guarantees an award. It improves how defensible Bloop's data use is.

Evidence labels used throughout: **VERIFIED** (an official or primary page was read on 2026-10-12), **PARTIALLY VERIFIED** (the item exists but key fields were not confirmed, or the source is secondary), **UNVERIFIED** (prior knowledge only), **INFERRED / INTERPRETATION** (reasoning from evidence), **HYPOTHESIS** (needs a test). Priorities (P1–P4) are internal heuristics, not predictions of judging.

---

## What Bloop already has (not re-recommended)

These results were reported by the team and were not re-verified in this research. They are the baseline that everything below builds on.

| Asset | What it gives Bloop | Team-reported result |
|---|---|---|
| SVS 5101 MUR SST frames | Daily SST frames, colour-inverted | Median error 0.31 °C at 60 points against MUR; latest check 0.32 °C |
| SVS 4285 IMERG rain frames + 48-frame time-lapse | 30-min global rain frames | Within ~27% of IMERG Late; 100% rain/no-rain agreement |
| GISTEMP | Dhaka warming story | +1.37 °C for Apr–May, 1981–90 vs 2016–25 |
| GPCP / GPCC | Monsoon rain trend | −9% (GPCP) and −12% (GPCC) |
| GRACE | Water-storage decline | Bangladesh +0.83 → −5.82 cm; NW India +8.71 → −53.63 cm |
| FIRMS | Fire events | Chittagong Hill Tracts (CHT) and Punjab |
| MODIS NDVI | Vegetation | 3 points |
| GLOBE Clouds | Citizen-science ground truth | 831 Bangladesh observations in 2025 |
| Global cube | 3D display | — |
| **Excluded:** NASA POWER | — | Failed a Dhaka long-term cross-check; not used for long-term claims |
| **Constraint:** SVS blocks browser CORS | — | A Python pipeline pre-processes the frames |

---

## Planet FM's 2000–2026 AQI line has to be modelled or stitched

### Verdict on the competitor claim

**There is no NASA product that gives an *observed* daily surface PM2.5 or AQI series for Dhaka back to 2000** (INTERPRETATION built on VERIFIED parts). The closest NASA product is **MERRA-2**. It runs hourly from 1980 to about three weeks ago, but it is a model reanalysis, not a measurement ([GEE MERRA-2 aerosols](https://developers.google.com/earth-engine/datasets/catalog/NASA_GSFC_MERRA_aer_2?authuser=0)). Its standard PM2.5 formula is (DUSMASS25 + OCSMASS + BCSMASS + SSSMASS25 + 1.375·SO4SMASS) × 1e9. That formula has no nitrate term, and GES DISC staff warn the reanalysis "shouldn't be used to validate other products" ([Earthdata Forum](https://forum.earthdata.nasa.gov/viewtopic.php?p=15229)). Over 20 Indian stations, MERRA-2 PM2.5 **underestimated by about −27 µg/m³ a year** and counted 11% exceedance days against 34% observed, with daily r≈0.6 and monthly r≈0.96 ([Navinya et al. 2020](https://doaj.org/article/01dd57e659014a00a3f05ca82d86b0af)). Satellite-derived ACAG PM2.5 exists only as **monthly and annual** values for 1998–2023 ([WUSTL ACAG](https://sites.wustl.edu/acag/datasets/surface-pm2-5)). "AQI" is a regulatory index computed from ground concentrations; it is not a NASA product.

The ground record has three segments, and none spans 2000–2026:

- **US Embassy Dhaka monitor.** Installed in 2015, with peer-reviewed hourly analysis for 2016–2021. That analysis found annual means of 79.7–98.0 µg/m³, January means of 180–210 and July/August means of 26–30, plus gaps in Jan–Feb 2016 and Sep–Oct 2018 ([PMC10581604](https://pmc.ncbi.nlm.nih.gov/articles/PMC10581604)). The State Department **stopped transmitting embassy data on 4 March 2025** ([Anchorage Daily News/AP](https://www.adn.com/nation-world/2025/03/05/state-department-halts-global-monitoring-of-air-pollution)). The WAQI mirror for the station shows "Not Available" since that date ([aqicn @008781](https://aqicn.org/city/@008781)).
- **DoE continuous monitoring.** Annual means are reported from 2002, but only second-hand, and 2016 data capture was just 64% ([PMC10581604](https://pmc.ncbi.nlm.nih.gov/articles/PMC10581604)).
- **DoE real-time CAMS AQI network.** Launched on 19 Nov 2023 with 16–17 stations, including Agrabad in Chattogram ([Daily Star](https://www.thedailystar.net/tech-startup/news/real-time-air-quality-tracking-launched-across-bangladesh-3474436)).

A "daily AQI 2000–2026" line for Dhaka is therefore necessarily either a model or reanalysis (MERRA-2, CAMS or similar) or a splice of ground segments. The 2000–2001 portion has no public ground source that this research found. *Which* of these Planet FM used is a **HYPOTHESIS**: its source is not stated in the material available. Bloop should not accuse it of fabrication. It should simply show its own provenance.

### The honest three-layer alternative

| Layer | Source | Span | Label in the app | Status |
|---|---|---|---|---|
| (a) Model backbone | MERRA-2 M2T1NXAER, Dhaka grid cell, daily PM2.5 using the GES DISC formula | 2000 → about 3 weeks ago | "NASA MERRA-2 reanalysis estimate (biased low in South Asia)" | VERIFIED dataset; bias is an India proxy |
| (b) Satellite anchor | ACAG V6.GL.02.04, monthly at 0.01° (CC BY 4.0) | 1998–2023 | "Satellite-derived, ground-calibrated" | VERIFIED |
| (c) Ground truth | US Embassy hourly data (EPA figure data at `pasteur.epa.gov/uploads/10.23719/1528454/` ([data.gov](https://catalog.data.gov/dataset/characterizing-variations-in-ambient-pm2-5-concentrations-at-the-u-s-embassy-in-dhaka-bang)) and per-year AirNow files ([GHDx 2016](https://ghdx.healthdata.org/record/bangladesh-dhaka-airnow-air-quality-data-2016))), plus DoE CAMS stations via WAQI ([aqicn A538612](https://aqicn.org/station/@538612/)) | Embassy 2016 – Mar 2025; DoE Nov 2023 → | "Ground monitor (measured)" | PARTIALLY VERIFIED: the Excel files were not opened, and current DoE readings were not visible |
| (+) "Now" voice | GEOS-CF v2 forecast PM2.5 (0.25°, 5-day), shown as SVS 5151 frames | Rolling | "NASA forecast of this week's air" | VERIFIED |

**How to present it.** Report the bias between layers (a) and (c) where they overlap. Convert to AQI only from bias-corrected daily means, and name the standard used. The DoE/WAQI page says Bangladesh's National Air Quality Management Plan 2024–2030 cites USEPA breakpoints (PARTIALLY VERIFIED). Gaps should play as **audible silence**, including "the monitor went quiet" on 4 March 2025. The Embassy data's roughly 5–6× swing from monsoon (~30 µg/m³) to winter (~170 µg/m³) is large enough to drive a filter-cutoff or noise-density voice without exaggeration.

**Fast test (≤60 min).** Pull MERRA-2 PM2.5 for the Dhaka cell for 2016–2021. Correlate it with the Embassy daily means. Report the slope, bias and r. If daily r falls far below the ~0.6 India benchmark, demote layer (a) to monthly resolution.

### The second competitor is stronger than Planet FM, and still has no frames

A public 2026 prototype for the same challenge, `jaherunhasanrimon/NasaSpaceApp1stPrototype_Earth-Jukebox-Listen-to-a-Changing-Planet`, works like this ([GitHub](https://github.com/jaherunhasanrimon/NasaSpaceApp1stPrototype_Earth-Jukebox-Listen-to-a-Changing-Planet)):

- It bundles 146 annual GISTEMP v4 values (1880–2025) and makes no runtime API calls.
- It maps a −0.5 to +1.3 °C anomaly onto an 11-step C-major pentatonic scale and a 400–4000 Hz low-pass filter.
- It plays 4 years per second.
- It has solid accessibility features (keyboard navigation, high-contrast theme, aria-live).

It says its values are "verified" but does not explain how, and it does not pair sound with EIC frames (VERIFIED as stated in the README; one commit at fetch time). It is the clearest "Track A" baseline: one global series, pentatonic pitch, no frames.

Against both competitors, the differentiating features are frame pairing, value-level verification and live layers. They are not about which theme gets sonified (INTERPRETATION). Whether that team is in the Bangladesh local event is unknown.

---

## Tier 1: 21 more gallery items beside the two Bloop already decodes

The SVS Daily Visualizations gallery holds **exactly 23 items** and was updated on 2026-08-10. It mentions the EIC but links no EIC sub-gallery ([SVS gallery](https://svs.gsfc.nasa.gov/gallery/daily-visualizations/), VERIFIED). Two format families are relevant:

- **"EIC 4K" family:** 5101, 5113, 5176 and 5544. 4096×2048 or 8640×4320 at 30p, EXR or PNG, often with a no-dates variant.
- **"GMAO hwtool" family:** 5147–5154. 2048×1024 at 12p, with burned-in dates and labels that must be masked before inverting, and separate PNG colorbars (INFERRED from 5147/5151).

A caution on freshness: **the SVS `update_date` on a page may reflect metadata edits rather than new frames.** Freshness has to be confirmed by listing the newest file in each frames directory (HYPOTHESIS to test).

| SVS ID | Product (source) | Frame format (from SVS API) | Updated stamp | Bangladesh relevance | Sonification fit | Verify inverted values against | Status | Priority |
|---|---|---|---|---|---|---|---|---|
| [5176](https://svs.gsfc.nasa.gov/api/5176) | SST anomaly, MUR v4.1, ~1 day latency | 4096×2048 in four variants (`sst_mur_anomaly`, `_pacific`, `_nodates`, `_robinson`); `*_most_recent.exr`; colorbar −4 to +4 °C blue-white-red, also as `sst_mur_anomaly_auto_colorbar_01.exr` | 2026-08-31 (freshness to check) | Bay of Bengal marine heat; companion to 5101 | Diverging map: pitch bends above or below a reference tone, so "warmer than normal" is heard relative to normal (positive temperature polarity is supported by [Walker et al.](https://wirelessrerc.gatech.edu/sites/default/files/publications/walker_et_al_-_a_comparison_of_sonification_mappings.pdf)) | NOAA CRW 5 km SSTA ([CRW](https://coralreefwatch.noaa.gov/product/5km/)), a different agency and analysis; plus internal consistency with 5101 | VERIFIED | **P1** |
| [5151](https://svs.gsfc.nasa.gov/api/5151) | PM2.5, GEOS-CF | `frames/2048x1024_2x1_12p/MC01_stage4_GMAO_pm25_…`; `PM2.5_colorbar.png` and `_plain.png` (528×125); units and range must be read from the image | 2026-10-11 | Dhaka winter haze; the honest replacement for Planet FM's AQI line | Low-pass "muffling" plus grain density as haze rises | Raw GEOS-CF v2 `PM25_RH35` from the public Zarr store (same model, which tests the inversion) and DoE ground stations (independent) | VERIFIED | **P1** |
| 5152 / 5153 / 5154 | Near-surface O3, CO, NOx (GEOS-CF) | Gallery-listed; layout inferred to match 5151 | Not fetched | Brick-kiln and traffic signals (unverified for Bangladesh) | Separate instrument voices per pollutant | GEOS-CF v2 Zarr bands CO, NO2, O3; TROPOMI NRT (partner, independent sensor) | PARTIALLY VERIFIED | P2 |
| [5147](https://svs.gsfc.nasa.gov/api/5147) | GEOS-FP near-surface temperature | `MC01_stage3_GMAO_near_surface_temperature_2048x1024_…`; two 528×165 colorbars. **Metadata says 3 m, description says 2 m** | 2026-09-30 | Heat-wave context | Pitch (positive polarity) | Model-to-model checks are not independent; prefer station data | VERIFIED | P3 |
| 5148 / 5149 | GEOS-FP 10 m wind; precipitation and clouds | Gallery-listed | Not fetched | Cyclone and monsoon context | Wind as noise or filter; clouds as pad | IMERG (already have) for precipitation | PARTIALLY VERIFIED | P3 |
| [5150](https://svs.gsfc.nasa.gov/api/5150) | GEOS-FP near-surface humidity, last 2 weeks | **MP4 only** (2048×1024) plus PNG stills; frames must be extracted from the MP4; colorbars provided | 2026-10-11 | Heat stress with temperature | Timbre "wetness" | — | VERIFIED | P3 |
| [5113](https://svs.gsfc.nasa.gov/api/5113) | VIIRS active fires (SNPP + NOAA-21), 375 m, 5-day fire radiative power (FRP) window | `frames/4096x2048_2x1_30p/EIC/` (reported 824 items) and `/SoaS/` (no dates, for a sphere); `VIIRS_fires_latest.exr`/`.png`; no colorbar file | 2026-09-23 | CHT jhum burning; Punjab residue fires | Sparse percussive events; FRP sets loudness | FIRMS points (already have) for the same dates | VERIFIED | **P1** (pairs with existing FIRMS) |
| [5315](https://svs.gsfc.nasa.gov/api/5315) | Experimental Fire Weather Index (GISS GlobalFWI on GEOS-5), 1-day forecast | Single `FWI_forecast_latest.png` (2160×1080); no archive or colorbar; categories <10 / 10–20 / 20–40 / 40–50 / 50–70 / >70 | 2026-10-11 | Pre-monsoon CHT and Indo-Gangetic dryness | Six categories → six discrete harmonic states | 5113/FIRMS fire occurrence on the following days (a forecast-vs-outcome check) | VERIFIED | P2 |
| [5584](https://svs.gsfc.nasa.gov/api/5584) | Global landslide exposure (LHASA, driven by GPM and SMAP) | `landslides_daily.png` plus `frames/archive/`; three categories, no numeric bar | **2026-01-07 (likely stale)** | Chattogram hills, Cox's Bazar camps | Threshold-triggered rumble | LHASA v2 nowcast from GES DISC (see the water section) | VERIFIED (stale) | P3 unless refreshed |
| [5544](https://svs.gsfc.nasa.gov/api/5544) | NDVI, SNPP VIIRS NRT | `8640x4320` equirectangular and Robinson (undated, the highest resolution in the gallery); `4096x2048` dated variants; `NDVI_colorbar.png` with no stated range | 2026-10-11, but **the team earlier saw data ~104 days old** | Aman/boro crop cycle; Sundarbans | Brightness or partial count | The team's 3 MODIS NDVI points | VERIFIED (freshness unresolved) | P2 |
| 4897 | Seasonal IMERG variation | Gallery-listed | Not fetched | Monsoon onset | Slow seasonal arc | GPCP/GPCC (already have) | PARTIALLY VERIFIED | P3 |
| 5046 / 5064 / 5099 | Arctic and Antarctic daily sea ice by year; two-year polar history | Gallery-listed; **5046/5064 blurbs say "2022"** | Not fetched | Far cause → Bangladesh sea level | Arctic left, Antarctic right in stereo; deficit heard as detune | NSIDC Sea Ice Index v4 (daily, 25 km) ([NSIDC G02135](https://nsidc.org/data/g02135)) | PARTIALLY VERIFIED | P3 (5099 first) |
| 5120 | NOAA GOES-East/West true colour, past 5 days | Gallery-listed; description mentions only GOES-16 | Not fetched | **Probably none.** GOES sits over the Americas, so Bangladesh is out of view (INFERRED; orbital longitudes UNVERIFIED this session) | Global-contrast cloud texture only | — | PARTIALLY VERIFIED | P4 |
| 5072 | Atlantic hurricane wind-speed plots | Charts, not maps | Not fetched | None (Atlantic) | Not invertible as a field | — | PARTIALLY VERIFIED | P4 |
| 5067 | Earth Observing Fleet – Now | Still updated every 10 min; daily video | Not fetched | "Who is watching Bangladesh" | Rhythmic layer for satellite passes (pairs with CelesTrak) | — | PARTIALLY VERIFIED | P3 |
| 5577 | SDO Sun This Week | Animation of the Sun, not Earth | Not fetched | Indirect (space weather) | Opening "source of energy" motif, paired with SWPC data | NOAA SWPC Kp and solar wind | PARTIALLY VERIFIED | P4 |

**Value services that could remove the need for colour inversion (all UNVERIFIED except the GHG Center landing page).**

- **U.S. GHG Center STAC API.** Live at `https://earth.gov/ghgcenter/api/stac/`. It runs STAC 1.0.0 with collections, item-search, CQL2 filter and queryables, and shows no raster link on the landing page ([GHG Center STAC](https://earth.gov/ghgcenter/api/stac/), VERIFIED). Its collection list was not fetched.
- **VEDA.** Built on eoAPI, which adds a TiTiler raster service ([EGU24-12004](https://meetingorganizer.copernicus.org/EGU24/EGU24-12004.html)). The endpoint paths (`openveda.cloud/api/stac`, `/api/raster`), TiTiler point and statistics routes, and GIBS per-layer colormap XML are **UNVERIFIED** prior knowledge.
- **GIBS layer names.** The candidate names that would mirror 5101/5176/4285/5113 (e.g. `GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies`, `IMERG_Precipitation_Rate`) are also UNVERIFIED and must be checked against GetCapabilities.
- **Why this matters.** If any of these return raw values with CORS, Bloop gains a *second, independent decoding path* for the same frame: colour inversion vs a server value. That is a stronger verification story than one path alone (INTERPRETATION).
- **Long-term EIC visualizations** (sea level, CO2, Black Marble, methane) were not catalogued by SVS ID. None are in the daily gallery, and no IDs are claimed here. ISS-LIS 2017–2023 has an SVS page, [SVS 5011](https://svs.gsfc.nasa.gov/5011/) (search-only).

---

## NASA source datasets that turn sound into evidence

Every dataset below is a "story" or verification layer that sits under the frames. Unless stated otherwise, **CORS is UNVERIFIED** and the safe route is Bloop's existing Python pipeline writing compact JSON to the app's own origin.

### Water: rain to river to flood to landslide

| Dataset | Measures / cadence | Access / auth / CORS | Bangladesh relevance | Sonification → cross-check | Status | Priority |
|---|---|---|---|---|---|---|
| **OPERA DSWx-S1 Bangladesh, Aug 2024** (NASA Disasters) | Surface water from Sentinel-1 radar, 30 m. Classes: water / not-water / **inundated vegetation**. Dates 5 May, 9 Aug and 21 Aug 2024. Extent 88.60–92.18°E, 20.90–26.11°N. Labelled "preliminary and unvalidated" ([ImageServer pjson](https://gis.earthdata.nasa.gov/gis05/rest/services/DISASTERS_202408_FLOOD_BANGLADESH/2423_opera_dswx_s1/ImageServer?f=pjson)) | ArcGIS ImageServer supports statistics and histograms, max 1,000 records; no login stated; CORS UNVERIFIED. Second service: [maps.disasters.nasa.gov](https://maps.disasters.nasa.gov/ags03/rest/services/bangladesh_floods_202408/aria_opera_dswx/MapServer) | NASA-curated Bangladesh event (Feni/Noakhali/Cumilla) | Three chords (before / during / peak). Inundated vegetation gets a muffled timbre (water radar sees but optical misses) → LANCE optical flood for the same dates, Charter 905 maps, FFWC gauges | VERIFIED | **P1** |
| **LANCE Global Flood Product** (MCDWD_L3_NRT; VIIRS VCDWD_L3_NRT daily, VCDWDG hourly cumulative) | ~250 m, 1/2/3-day composites; MODIS archive 2003–2025; VIIRS Release 1.1 Dec 2025 as the MODIS replacement ([Earthdata](https://www.earthdata.nasa.gov/global-flood-product)) | GeoTIFF/HDF tiles; **Earthdata Login** to download; latency in hours not stated | Daily monsoon flooding nationwide | Drone amplitude follows *anomalous* water only (reference water excluded) → OPERA radar, FFWC | VERIFIED | P2 |
| **SWOT Hydrocron** | River-reach (10 km) and node (~200 m) water-surface elevation and width; default collection Version D; CSV/GeoJSON ([Hydrocron docs](https://podaac.github.io/hydrocron/); [Earthdata tool](https://www.earthdata.nasa.gov/data/tools/hydrocron)) | Base URL `soto.podaac.earthdatacloud.nasa.gov/hydrocron/v1/timeseries` **UNVERIFIED**; auth UNVERIFIED; SWORD IDs change between versions | Jamuna/Padma/Meghna monsoon rise. JPL imaged flooded Sylhet on 8 Oct 2023: "the vast majority of the land area … is flooded" ([JPL PIA26343](https://www.jpl.nasa.gov/images/pia26343-swot-captures-flooding-in-bangladesh/)) | Each reach is one note; the chord rises with the monsoon; sparse ~21-day sampling heard honestly as sparse notes → FFWC gauge *changes* (datums differ) | PARTIALLY VERIFIED | P2 (test first) |
| **LHASA v2 landslide nowcast** | ML hazard probability, 1 km, daily, 60°N–60°S, ≥5 h latency, "openly shared, without restriction" ([Earthdata catalog](https://www.earthdata.nasa.gov/data/catalog/ges-disc-global-landslide-nowcast-2.0.0)) | GES DISC; point/WMS route UNVERIFIED | CHT and Cox's Bazar camps; takes IMERG as input → a coherent rain-to-hazard chain | Rumble triggered only above a threshold, so silence means safe → NASA Global Landslide Catalog/COOLR (access UNVERIFIED) | PARTIALLY VERIFIED | P2 |
| **SMAP L3 soil moisture** (SPL3SMP v9) | 36 km, daily, from 31 Mar 2015 ([NSIDC](https://nsidc.org/data/SPL3SMP)) | Earthdata Login; AppEEARS, Harmony, S3 | Barind/Rajshahi dry belt vs haor basin; unreliable over open water and dense vegetation (prior knowledge) | Dry crackle vs wet legato → JAXA AMSR2 (a true two-sensor duet) | VERIFIED; **14 May – 28 Jul 2026 under reprocessing** | P3 |
| **NISAR** (NASA–ISRO L-band SAR) | Provisional calibrated L0–L3 products from 17 Jun 2026; L1–L3 latency 36–72 h ([ASF](https://nisar-docs.asf.alaska.edu/availability-overview/)) | ASF Vertex / `asf_search`; large SAR files | Mangroves, haor, subsidence. **ISRO is a 2026 partner**, so this is a joint-mission "spotlight" (INFERRED) | One pre-processed image, not a live voice | VERIFIED status | P3 (spotlight only) |
| **CYGNSS** | Ocean winds including in cyclones; flood inundation ([EOSPSO](https://eospso.gsfc.nasa.gov/missions/cyclone-global-navigation-satellite-system-evm-1)) | PO.DAAC; number of active satellites in 2026 unknown | Cyclone Remal (May 2024) track | Wind as noise cutoff → IBTrACS | PARTIALLY VERIFIED | P3 |
| GLDAS / FLDAS / GFMS / Giovanni / AppEEARS / MODIS snow / Landsat-HLS / OPERA DIST | Various | Not checked this session | Groundwater, erosion, upstream snow | — | UNVERIFIED | Check before use |

**The "follow the water" arc.** IMERG rain (have) → GRACE storage (have) → SWOT river height → OPERA flood extent → SMAP salinity plume → sea level. Each step follows water through the Ganges–Brahmaputra–Meghna (GBM) system to the sea, so the arc is physically coherent (INTERPRETATION). It is also the strongest Bangladesh-specific narrative in the catalogue.

### Ocean, sea level, cryosphere and coast

| Dataset | Measures / cadence | Access / auth / CORS | Bangladesh relevance | Sonification → cross-check | Status | Priority |
|---|---|---|---|---|---|---|
| **SMAP sea-surface salinity**, JPL L3 CAP 8-day V5.0 (CMR C2208422957-POCLOUD) | 8-day running mean; monthly V5.0 and RSS V5.3 variants also exist ([data.gov](https://catalog.data.gov/dataset/jpl-smap-level-3-cap-sea-surface-salinity-standard-mapped-image-8-day-running-mean-v5-0-va)) | PO.DAAC; short name UNVERIFIED | GBM freshwater plume in the northern Bay (plume values UNVERIFIED; papers not read) | Fresher water = higher, "sweeter" tone; post-monsoon N→S pan → ESA SMOS (independent L-band), Argo | VERIFIED dataset | P2 |
| **NASA altimetry GMSL** | 2024 rise of 0.59 cm/yr vs 0.43 expected; rate more than doubled since 1993; ~10 cm total ([JPL](https://www.jpl.nasa.gov/news/nasa-analysis-shows-unexpected-amount-of-sea-level-rise-in-2024/)) | PO.DAAC file and Sea Level Projection Tool UNVERIFIED (sealevel.nasa.gov blocked) | Bangladesh media covered the 2024 jump ([Financial Express](https://thefinancialexpress.com.bd/environment/nasa-analysis-shows-unexpected-sea-level-rise-in-2024)). **Delta subsidence means altimetry ≠ what villages experience** | Slowly rising pitch with annual vibrato → PSMSL Hiron Point / Cox's Bazar for 1993–2003 only | VERIFIED global numbers | P2 |
| **PACE OCI** | Hyperspectral ocean colour; NRT page exists ([Earthdata PACE NRT](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/pace/near-real-time-data)) | OB.DAAC; details UNVERIFIED | Sediment plume vs open Bay; Case-2 waters bias chlorophyll (prior knowledge) | **Spectrum-to-timbre**: each band is a partial in an additive synth → MODIS-Aqua/VIIRS chlorophyll (partly independent) | PARTIALLY VERIFIED | P3 (high novelty, high effort) |
| **NSIDC Sea Ice Index v4** (NOAA/NSIDC) | Daily, 25 km, now AMSR2 input; reduced to "Basic" service level ([NSIDC](https://nsidc.org/data/g02135)) | HTTPS `noaadata.apps.nsidc.org/NOAA/G02135/`; v4 CSV filename UNVERIFIED | Only via sea level | Two-voice stereo → OSI SAF; **do not voice the v3→v4 splice as a real jump** | VERIFIED | P3 |
| **CMS mangrove canopy height 2015** (TanDEM-X + GEDI) | 12 m; R² 0.93, RMSE 2.4 m vs GEDI ([ORNL DAAC](https://daac.ornl.gov/CMS/guides/CMS_Global_Mangrove_Forest_Ht.html)) | ORNL DAAC | Sundarbans (values not yet extracted) | Coast-to-inland "skyline melody" intro → GEDI L2A footprints | VERIFIED | P3 |
| ICESat-2, GEDI L4A, OSCAR, SSH anomaly, MODIS chlorophyll | — | Not checked | Context | — | UNVERIFIED | — |

### Atmosphere, air, greenhouse gases, lightning and light

| Dataset | Measures / cadence | Access / auth / CORS | Bangladesh relevance | Sonification → cross-check | Status | Priority |
|---|---|---|---|---|---|---|
| **GEOS-CF v2** | 0.25° O3, CO, NO2, SO2 and PM2.5; daily 5-day forecasts; v2 introduced Oct 2025 (**do not splice with v1**); bands include `PM25_RH35` ([GEE v2](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v2_fcst_htf?hl=en)). v1 aerosols were biased high by ~20–50% ([ESPO](https://espo.nasa.gov/node/80002)) | **Public** NCCS datashare, OPeNDAP, S3 Zarr `smce-geos-cf-public`, and the FLUID point export (JSON); no login mentioned ([GMAO access](https://gmao.gsfc.nasa.gov/gmao-products/geos-cf/data-access_geos-cf)) | Dhaka "this week's air" | 120-beat phrase over the 5-day forecast → DoE ground stations | VERIFIED | **P1** (value source for 5151–5154) |
| **MERRA-2 aerosols** (M2T1NXAER) | Hourly from 1980, ~3-week lag; BC, OC, SO4, dust, sea salt, AOD | GES DISC / GEE; Earthdata Login | Bangladesh MERRA-2 AOD vs AERONET R²=0.72, better than the two MODIS instruments ([Zaman ACAM 2023](https://www.acom.ucar.edu/webt/ACAM/2023/presentations/O6.03_Zaman.pdf)) | **One instrument per component** (black carbon (BC) drone, dust rasp, sea-salt shimmer) → AERONET fine-mode fraction | VERIFIED | **P1** (layer a) |
| **ACAG / SEDAC PM2.5** | Monthly and annual, 1998–2023, 0.01°; CC BY 4.0 | Box, AWS, satpm25data.net | Dhaka long-term anchor | Slow bass contour → Embassy annual means | VERIFIED | P1 (layer b) |
| **MAIAC AOD** (MCD19A2) | Daily 1 km column AOD, Terra/Aqua | GEE / LP DAAC | Dhaka AOD is 0.79 in winter vs 0.55 in autumn ([Springer 2025](https://link.springer.com/article/10.1007/s11270-025-08023-w)) | Reverb wet/dry → AERONET Dhaka University / Bhola. **Plan for VIIRS continuity** | PARTIALLY VERIFIED | P2 |
| **AERONET Dhaka University (2012) and Bhola (2013)** | Sun-photometer AOD; Dhaka aerosol ~75% anthropogenic vs ~37% at Bhola ([York CAC](https://cac.yorku.ca/2013/05/abdus-salam-establishes-2nd-aeronet-station-in-bangladesh); [Zaman](https://www.acom.ucar.edu/webt/ACAM/2023/presentations/O6.03_Zaman.pdf)) | aeronet.gsfc.nasa.gov blocked fetching (robots); L2.0 years unknown | The only NASA ground network in Bangladesh | Ground voice for the haze duet | PARTIALLY VERIFIED | P2 |
| **VIIRS Black Marble** (VNP46A1–A4; NOAA-20 VJ146 from 2018) | ~500 m, daily/monthly/yearly from Jan 2012; NRT ~3 h via LANCE ([User Guide](https://www.earthdata.nasa.gov/s3fs-public/2025-05/BlackMarbleUserGuide_Collection2.0.pdf)) | LAADS/LANCE; Earthdata Login | Dhaka/Chattogram growth; Eid and storm blackouts | More light → more voices; outages → rests → cross-check VNP46 vs VJ146 (independent sensor) | VERIFIED | P2 |
| **TRMM-LIS (1997–2015) and ISS-LIS (2017–2023)** | Lightning climatology; **ended, no Asian successor** ([Earthdata](https://www.earthdata.nasa.gov/learn/articles/lis-data-record-ends)) | GHRC | 69% of Bangladesh lightning falls pre-monsoon; strongest sunrise-to-midday peak anywhere; 300+ deaths a year ([NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/assessing-lightning-risk-in-south-asia-149447)) | Seasonal "score" of percussive density with a "morning storm" motif → DDM death counts as low "toll" events | VERIFIED | P2 |
| **EMIT methane plumes** (L2B, 60 m, V002) | ±54° latitude; open; gap Sep 2022 – Jan 2023 ([Earthdata](https://www.earthdata.nasa.gov/data/catalog/lpcloud-emitl2bch4plm-002)) | LP DAAC / VISIONS portal | Matuail landfill reported at ~4 t CH4/h ([Dhaka Tribune](https://www.dhakatribune.com/bangladesh/245495/dhaka-landfill-emits-4-tons-of-methane-per-hour)); not attributed to EMIT; **no EMIT Bangladesh plume confirmed** | Plume as a rising swell | PARTIALLY VERIFIED | P3 (check the portal) |
| **OCO-2/3 XCO2** | OSCAR lists OCO-2 operational, end of life "≥2026" ([WMO OSCAR](https://space.oscar.wmo.int/satellites/view/oco_2)); FY26 budget proposed termination ([Eos](https://eos.org/research-and-developments/nasa-planning-for-unauthorized-shutdown-of-carbon-monitoring-satellites)) | GES DISC; also GHG Center (UNVERIFIED) | Global background | Rising pedal tone → NOAA Mauna Loa (independent, in-situ) | PARTIALLY VERIFIED | P3 |
| **TEMPO** | Hourly NO2/HCHO; NRT V02 has no ozone ([ASDC](https://asdc.larc.nasa.gov/news/tempo-v04-standard-and-near-real-time-v02-level-1-2-and-3-product-release)) | ASDC | **North America only** ([tempo.si.edu](https://tempo.si.edu/)) | Contrast track only: "South Asia has no NASA geostationary air-quality eye" | VERIFIED | P4 |
| TROPOMI on GES DISC | NO2 NRT within ~3 h; archive kept ~10 days ([Earthdata](https://www.earthdata.nasa.gov/data/catalog/ges-disc-s5p-l2-no2-hir-nrt-2)) | GES DISC; Earthdata Login | Brick kilns (unverified) | Partner voice (ESA) | VERIFIED | P2 (see duets) |
| OMI, AIRS, CERES, Pandora | — | — | Pandora: none found in Bangladesh | — | UNVERIFIED | — |

### Heat, land and the future

| Dataset | Measures / cadence | Access | Bangladesh use | Sonification → cross-check | Status | Priority |
|---|---|---|---|---|---|---|
| **NEX-GDDP-CMIP6** | 0.25° daily, four SSPs, 38 TB; THREDDS NCSS point subsetting at `ds.nccs.nasa.gov/thredds/ncss/grid/` ([NCCS](https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6)) | NCSS (small CSV) or S3 | Dhaka days above 35 °C to 2100 | SSP2-4.5 vs SSP5-8.5 as diverging rhythms; **always show the ensemble spread** → historical part vs GISTEMP (have) | VERIFIED route | P2 |
| **ECOSTRESS LST** (70 m) | ISS overpasses at irregular times; V3 L1 released ([Earthdata alert](https://www.earthdata.nasa.gov/data/alerts-outages/ecostress-version-3-level-1-data-products-released)) | LP DAAC | Dhaka urban-heat transect | Hot chord across the city → MODIS LST | PARTIALLY VERIFIED (2026 status unknown) | P3 |
| EONET v3 | Natural-event catalogue; `/layers` links events to GIBS layers; "not an official source for precise" positions ([EONET](https://eonet.gsfc.nasa.gov/docs/v3)) | Keyless; CORS UNVERIFIED | Bangladesh/Bay bbox | Event chimes tied to frames | PARTIALLY VERIFIED | P2 (see APIs) |

---

## Partner-agency duets: JAXA and ESA lead, and the local rubric pays for them

**Who counts as a partner.** The 2026 Space Agency Partner list has **17 names**: Angola, Bahrain, Brazil, CSA, ESA, ISRO, ASI (Italy), JAXA, KASA (Korea), MBRSC (UAE), CONAE (Argentina), NASRDA (Nigeria), Paraguay, Senegal, Spain, Turkey and UKSA ([astrobiology.com reproduction of the NASA release](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/)). That source is PARTIALLY VERIFIED: it is secondary, and spaceappschallenge.org blocked automated fetching. The team's Participants Guide independently gives "17 in 2026", which is consistent. **CNES, DLR, Australia, Mexico, NOAA, USGS, JMA, KMA and the UK Met Office are not Space Agency Partners.** They still count as "other agency or third-party" sources.

**What the rubric rewards.** The Bangladesh score sheet gives **5/5 on NASA data usage for "NASA open data plus other agency or third-party sources, clearly shown"**. It also asks under Relevance (20 points): "Is this NASA-data-first, or just NASA-data-added?" (Participants Guide, project doc). Partner voices must therefore sit *on top of* a NASA-central core. Whether Global judges apply the same "other agency" bonus is unknown.

**Timing.** Partner datasets for Challenge #14 are released on **28 Oct 2026**. The Bangladesh hackathon runs 13–14 Nov and global judging starts 16 Nov ([astrobiology.com](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/); Participants Guide). Any partner dataset named in the official resources should take precedence over this list.

### Duet table: independence must be stated, not assumed

| Duet | NASA voice | Partner / other voice | Cadence | Shared inputs (state these out loud) | Status | Priority |
|---|---|---|---|---|---|---|
| **Rain over Bangladesh** | IMERG (have) | **JAXA GSMaP**. NOW: 0-hour latency, half-hourly. NRT: hourly, 4-hour latency ([JAXA FAQ](https://sharaku.eorc.jaxa.jp/GSMaP/faq/GSMaP_faq06.html)). Hourly 0.1° archive from 1998 needs G-Portal registration; commercial use allowed with credit ([JAXA EOLP](https://eolp.jaxa.jp/GSMaP_Hourly.html)) | Minutes to hours | **Both use the GPM passive-microwave constellation**, so they are only partly independent | VERIFIED | **P1** |
| Rain vs ground | IMERG | Literature: GSMaP V8 vs 35 BMD gauges gave daily r 0.50 and monthly r 0.94 ([IPWG 2024](https://www.eorc.jaxa.jp/IPWG/meetings/tokyo-2024/pdf/Session10/flash_talk/10.18_Assessment%20of%20Global%20Satellite%20Mapping%20of%20Precipitation%20Data%20for%20Rainfall%20Measurement%20in%20Bangladesh_Rafiuddin,%20M.%20M.%20Rafiuddin.pdf)). IMERG overestimates intense-event occurrence against 31 gauges ([CGIAR](https://www.cgiar.org/research/publication/intense-precipitation-events-during-the-monsoon-season-in-bangladesh-as-captured-by-satellite-based-products)) | Daily | Independent (in-situ) | VERIFIED (flash talk / abstract) | Use as published context |
| **Bay of Bengal SST chord** | MUR 5101/5176 | NOAA OISST (0.25°, ~2-week lag on ERDDAP; "may be used and redistributed for free") ([ERDDAP](https://coastwatch.pfeg.noaa.gov/erddap/info/ncdcOisst21Agg/index.html)); UK Met Office OSTIA ([CMEMS](https://data.marine.copernicus.eu/product/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/description)); JAXA SGLI/AMSR2 SST ([JAXA Earth catalog](https://data.earth.jaxa.jp/app/mcp/catalog.v2.md)); Himawari SST 2 km every 10 min ([P-Tree](https://www.eorc.jaxa.jp/ptree/userguide.html)) | Daily (Himawari hourly) | L4 blends share infrared inputs; **AMSR2 microwave is the most independent** | VERIFIED | **P1** (JAXA AMSR2 voice) |
| Haze over Dhaka | MAIAC/VIIRS AOD, MERRA-2, GEOS-CF | JAXA Himawari AOT (10-min, 5 km, daytime); CAMS AOD/PM2.5 (0.4°, 00/12 UTC, CC-BY) ([ADS](https://ads.atmosphere.copernicus.eu/datasets/cams-global-atmospheric-composition-forecasts)); TROPOMI NO2 (ESA) | Minutes to daily | **CAMS assimilates MODIS AOD, so it is not independent of NASA.** Himawari and ground data are independent | VERIFIED | P2 |
| Soil moisture | SMAP | JAXA AMSR2 (daily from 2012-07-03, ~11 km, keyless JAXA Earth API) | Daily | **ESA CCI SM merges AMSR2 and SMAP**, so do not count it as a third independent voice | VERIFIED | P3 |
| River flood | OPERA, LANCE, IMERG, SWOT | GloFAS v5.0 (EWDS, daily, CEMS-FLOODS licence) ([EWDS](https://ewds.climate.copernicus.eu/datasets/cems-glofas-historical)); Hydroweb (3 days after a pass; **CNES is not a partner**) ([Hydroweb](https://hydroweb.next.theia-land.fr/catalog/details/HYDROWEB_RIVERS_OPE)); FFWC gauges | Daily | Model vs altimetry vs gauge: three different measurement types | VERIFIED | P2 |
| Clouds and convection | GIBS VIIRS/MODIS; GLOBE (have) | Himawari-9 via NOAA AWS (10-min full disk from 2015; attribution requested) ([AWS](https://registry.opendata.aws/noaa-himawari)); GK2A (KMA, `noaa-gk2a-pds`) ([AWS](https://registry.opendata.aws/noaa-gk2a-pds)); Meteosat-9 IODC (15 min, oblique view, "best-effort") ([EUMETSAT](https://eumetsat.int/msg-services)) | 10 min | Different satellites, same physics | VERIFIED | P3 (needs server-side decoding) |
| Coral heat stress | 5176 anomaly | NOAA CRW DHW/BAA, 5 km daily from 1985 | Daily | Independent analysis | VERIFIED | P2 (St Martin's Island framing; Bangladesh not mentioned on the CRW page) |
| CO2 background | OCO-2/3 | NOAA GML Mauna Loa daily CSV ([GML](https://gml.noaa.gov/ccgg/trends/data.html)) | Daily | Satellite column vs in-situ: independent | VERIFIED | P3 |
| Cyclones | IMERG, CYGNSS | IBTrACS v04r01 (NI basin; recent storms provisional) ([NCEI](https://www.ncei.noaa.gov/news/tropical-cyclone-database-updated-twice-weekly)) | Twice weekly (another NCEI page says three times a week or weekly: **CONFLICT preserved**) | Best track blends agency estimates | VERIFIED | P2 |
| Joint mission | NISAR | ISRO (a partner); MOSDAC Level-2 NRT after sign-up; foreign-user terms unknown ([MOSDAC FAQ](https://www.mosdac.gov.in/faq-page)) | 36–72 h | One mission, two agencies | PARTIALLY VERIFIED | P3 |
| Radar | — | CSA RCM via EODMS; licence listed inconsistently ([CSA](https://data.asc-csa.gc.ca/en/dataset/64927856-8o0t-5u1o-987izna480aa45)) | — | — | PARTIALLY VERIFIED | P4 |
| Reanalysis | MERRA-2 | ERA5 (hourly from 1940, ~5-day lag, CC-BY) ([CDS](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels)) | Daily | Both are reanalyses assimilating overlapping observations | VERIFIED | P3 |

**The JAXA Earth API is the lowest-friction partner route.** It has "no restrictions" on registration, keys or usage count, and per-dataset licences sit in STAC records. It also ships a browser JS library (`jaxa.earth.umd.js` v2.0.1) tested on Chrome, Edge, Safari and Firefox ([data.earth.jaxa.jp](https://data.earth.jaxa.jp/en); [JS for browsers](https://data.earth.jaxa.jp/api/javascript/v2.0.1/en/docs/documents/For_Browsers.html)). Two limits apply: its GSMaP is **daily or coarser, not real-time** ([catalog](https://data.earth.jaxa.jp/app/mcp/catalog.v2.md)), and the catalogue contradicts itself on SGLI resolution (CONFLICT preserved).

**JAXA's P-Tree Himawari products carry a no-redistribution clause:** "You cannot redistribute the data to the third parties" ([P-Tree registration](https://www.eorc.jaxa.jp/ptree/registration_top.html)). A public web app that re-serves P-Tree values could breach it. Use the NOAA AWS copy (JMA data under NOAA NODD terms) instead, or contact the P-Tree Secretariat.

---

## Bangladesh ground truth exists, with registration, fees and end dates

| Source | What / span | Access constraint | Pairs with | Status | Priority |
|---|---|---|---|---|---|
| **US Embassy Dhaka PM2.5** | Hourly 2016 → **feed halted 4 Mar 2025** | EPA figure Excel files ([data.gov](https://catalog.data.gov/dataset/characterizing-variations-in-ambient-pm2-5-concentrations-at-the-u-s-embassy-in-dhaka-bang)); AirNow per-year files (whether they are still downloadable is UNVERIFIED) | MERRA-2, GEOS-CF, ACAG | VERIFIED | P1 |
| **DoE CAMS AQI network** | 16–17 stations, including Agrabad (Chattogram), from Nov 2023; PM2.5, PM10, O3, SO2, NOx, CO | Via WAQI mirror (data "unvalidated at time of publication"); DoE portal URL for hourly downloads not found | GEOS-CF 5151 inversion | PARTIALLY VERIFIED | P1 |
| **FFWC (BWDB) API** | Real-time and historical water levels, 24/48-h forecasts, warnings ([api.ffwc.gov.bd](https://api.ffwc.gov.bd/)); core endpoint `https://api3.ffwc.gov.bd/data_load/` named ([api3](https://api3.ffwc.gov.bd)) | **Documentation only after registration** (api.support@bwdb.gov.bd), which may take days; schema and CORS unknown | SWOT, OPERA, GloFAS, IMERG lag | VERIFIED existence | **P1: register today** |
| data.gov.bd "Daily Water Levels Data" | FFWC-sourced snapshot ([data.gov.bd](https://data.gov.bd/dataset/daily-water-levels-data/resource/a25f536d-b12c-4b5f-9f60-884d695e4fe1)) | No licence or period stated; may be stale | FFWC fallback | PARTIALLY VERIFIED | P2 |
| BWDB groundwater wells | ~1,023 wells, weekly | **Online request and payment** ([arXiv 2511.22378](https://arxiv.org/pdf/2511.22378)) | GRACE (have) | VERIFIED | P4 (use HydroShare instead) |
| **HydroShare groundwater (CC BY 4.0)** | Monthly levels at ~1,300 locations, 2000–2014 ([HydroShare](https://hydroshare.org/resource/231886df055e40f2a8186c16753f77f0/)) | Open | **GRACE vs wells is published methodology** (arXiv 2511.22378) | VERIFIED landing page | **P1** (verifies the GRACE claim already made) |
| **BMD** | live6 pages: radar, satellite, AWS, warnings, cyclone signals, NWP ([live6](https://live6.bmd.gov.bd/)) | Climate Data Portal is **paid** (e.g. Tk 800/item + Tk 100/station + Tk 100/5 yr + 15% VAT), ≥5 working days, and **redistribution prohibited** under the Meteorological Act ([BMD portal](https://dataportal.bmd.gov.bd/)) | Live context only; cyclone signal scale → discrete intensity steps | VERIFIED | P3 (links/screenshots only) |
| **PSMSL tide gauges** | Hiron Point RLR 1983–2003; Cox's Bazar RLR 1978–2000 (metric to 2006, "extreme caution"); Chittagong 1983–1992 "NOT RESEARCH QUALITY" ([PSMSL 1451](https://psmsl.org/data/obtaining/stations/1451.php); [1476](https://psmsl.org/data/obtaining/stations/1476.php); [1573](https://psmsl.org/data/obtaining/stations/1573.php)) | Open; **records end 2003–06**; UHSLC recency unverified | Altimetry only for 1993–2003 | VERIFIED | P3 |
| Disasters Charter 762 (Sylhet 2022) and 905 (eastern floods Aug 2024) | Satellite flood-extent maps ([762](https://download.disasterscharter.org/web/guest/activations/-/article/flood-large-in-bangladesh-activation-762-); [905](https://download.disasterscharter.org/web/guest/activations/-/article/flood-in-bangladesh-activation-905-)) | Open map products | OPERA DSWx-S1 Aug 2024 | VERIFIED | P1 (with OPERA) |
| DDM lightning deaths | ≥3,835 deaths 2015–2025; ≥74 in 2026 by 28 Apr; no national ground lightning network ([TBS](https://www.tbsnews.net/features/panorama/bangladeshs-fatal-lightning-strikes-are-no-longer-just-natural-hazard-1424301)) | News citing DDM; official table not found | LIS climatology | VERIFIED (secondary) | P2 |
| GLOBE Bangladesh | Programme relaunch ([GLOBE](https://globe.gov/web/bangladesh)) | Open | GLOBE Clouds (have) | PARTIALLY VERIFIED | Have |
| Not reached | SPARRSO, BARC, BRRI, CEGIS, IMD, CPCB, RIMES, ICIMOD RDS, BWDB hydrology portal, cpp.gov.bd, iNaturalist, eBird counts | — | — | UNVERIFIED | Do not cite yet |

---

## Real-time keyless APIs are plentiful, but none has proven CORS

**Recommended architecture (INFERRED).** A small server, serverless cache or GitHub Action fetches each feed at its allowed cadence and writes same-origin JSON. That removes CORS, rate-limit, `DEMO_KEY` and ban risks in one step, and it matches the Python pipeline Bloop already runs for SVS. Describe satellite layers as "latest available", not "real-time".

| API | Auth / limits | Cadence | CORS evidence | Bloop use | Status |
|---|---|---|---|---|---|
| USGS earthquake GeoJSON summary feeds ([USGS](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)) | None; a GeoJSONP fallback exists | "Updated every minute" (official) vs "every few minutes" (secondary) | Indirect: Esri's official sample loads it in-browser ([ArcGIS](https://developers.arcgis.com/javascript/latest/sample-code/layers-geojson/)) | Percussive event layer: magnitude → loudness, depth → pitch, Myanmar-arc pan. USGS is not NASA and not a partner | PARTIALLY VERIFIED |
| NASA EONET v3 | None stated | Event-driven | UNVERIFIED | Bay/Bangladesh bbox event chimes; `/layers` links events to frames | PARTIALLY VERIFIED |
| NOAA SWPC `services.swpc.noaa.gov` ([SWPC](https://www.spaceweather.gov/content/data-access)) | None | 1-min RTSW | UNVERIFIED | Kp → tension; GOES X-ray → log-scaled crackle; use with SDO 5577 | VERIFIED (endpoints) — **see traps for the 2026 format change** |
| Open-Meteo ([terms](https://open-meteo.com/en/terms)) | No key; <10k calls/day, non-commercial, CC BY 4.0 | Hourly | UNVERIFIED | Sanity reference for inverted rain and temperature; **a wrapper, so show ECMWF/Copernicus provenance** | VERIFIED terms |
| JAXA Earth API | No key, no count limit | Daily or coarser | Library designed for in-browser COG fetch (INFERRED) | Partner voice: AMSR2, SGLI, GSMaP daily | VERIFIED |
| NOAA GML Mauna Loa CSV | None | Daily | UNVERIFIED | CO2 pedal tone | VERIFIED file paths |
| NOAA ERDDAP (OISST, CRW) | None | Daily | UNVERIFIED | SST chord; CRW SSTA check for 5176 | VERIFIED datasets |
| GEOS-CF S3 Zarr / NCCS datashare | Public | Daily runs | UNVERIFIED | Value source behind 5151–5154 | VERIFIED public |
| GIBS WMTS | No auth step described ([Earthdata wiki](https://wiki.earthdata.nasa.gov/x/mgnXCw)) | Hours | **UNVERIFIED, and this is Bloop's most important CORS question**: browser `getImageData` on a tile requires ACAO plus `crossOrigin="anonymous"`, or the canvas is tainted ([Corsfix](https://corsfix.com/blog/tainted-canvas)) | Browser-side inversion of live tiles | PARTIALLY VERIFIED |
| CelesTrak GP JSON ([policy](https://celestrak.org/usage-policy.php)) | None, but **any non-200 response must stop querying, or the IP is firewalled**; download once per 2-h update | 2 h | UNVERIFIED | "Which satellite made this frame is overhead now" (satellite.js) | VERIFIED policy |
| api.nasa.gov (DONKI etc.) | **DEMO_KEY: 30 requests/h and 50/day per IP**; a free key allows 1,000/h ([api.data.gov](https://api.data.gov/docs/developer-manual/)) | — | UNVERIFIED | Space-weather drone, proxied | VERIFIED limits |
| OpenAQ v3 | **Key required**; the docs say to treat it like a password ([OpenAQ](https://docs.openaq.org/using-the-api/api-key)) | Hourly | n/a | Proxy only; also Planet FM's territory | VERIFIED |
| FIRMS, NASA POWER, CMR, GDACS, ReliefWeb, Smithsonian GVP | FIRMS needs a MAP_KEY in the URL | — | UNVERIFIED | — | UNVERIFIED |
| Open-Notify `iss-now.json` | Plain `http://` | — | Browsers block mixed content from HTTPS pages | Avoid | INFERRED |

---

## Natively audio data: three honest layers, licences mostly unconfirmed

**Context from precedent.** NASA's sonification precedents are curated, pre-rendered audio. Chandra's "A Universe of Sound" maps image position to time and pitch and brightness to volume, assigns one instrument per wavelength, publishes separate layers, and worked with blind and low-vision (BLV) consultants ([Chandra](https://chandra.si.edu/sound/); [NASA Science](https://science.nasa.gov/open-science/astronomy-data-sonification/)). SOHO's "Sounds of the Sun" is an *audification*: 40 days of Doppler velocity sped up 42,000 times ([NASA](https://www.nasa.gov/solar-system/sounds-of-the-sun/)). None of the pages found describes live data, value-level verification, or EIC frame pairing. A Space Apps sonification precedent also exists: "Arcobaleno" won Global Connection in 2023 ([NASA Science](https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners/)).

| Source | What it is | Access / licence | Bangladesh fit | Recommendation | Status |
|---|---|---|---|---|---|
| **Seismic audification** (EarthScope FDSN dataselect, miniSEED) | Real ground motion, sped up: the same method class as SOHO | `irisws-audio` and `irisws-timeseries` were **retired 2026-08-26**; build audio from miniSEED with ObsPy → NumPy → WAV ([EarthScope](https://www.earthscope.org/news/retirement-of-the-irisws-timeseries-web-service/)) | A real regional quake; nearby station not identified | **P2**: pre-render one clip; label as NSF/EarthScope, secondary layer | VERIFIED retirement |
| NOAA NCEI Passive Acoustic Data | Hydrophone WAV/FLAC from NRS, ADEON, SanctSound; GCS bucket `noaa-passive-bioacoustic` ([NCEI](https://www.ncei.noaa.gov/products/passive-acoustic-data)) | No explicit licence; cite DOI 10.25921/PF0H-SQ72; fair-use PDF not read | Mostly US sites (INFERRED) | P3, global framing only | VERIFIED |
| EMFISIS plasma-wave audio (U. Iowa) | Van Allen Probes chorus and whistlers ([archive](https://space.physics.uiowa.edu/plasma-wave/rbsp/audio/archives.html)) | Licence not checked | Space, not Earth | P4 | PARTIALLY VERIFIED |
| Xeno-canto birds | Over 1M recordings; CC licence varies per recording, some NC/ND ([Wikipedia](https://en.wikipedia.org/wiki/Xeno-canto)) | Use CC BY / CC BY-SA only, credit each recordist | Sundarbans soundscape (Bangladesh recordings not verified) | P3, labelled "soundscape context, not data" | PARTIALLY VERIFIED |
| Chandra/NASA sonification audio | Curated pieces | **Licence not found; do not embed** | — | Cite as precedent only | VERIFIED existence |
| Astronify (STScI) | Python sonification library, BSD-3 ([docs](https://astronify.readthedocs.io/en/latest/)) | Open | Tool, not data | Optional | VERIFIED |

**Mapping evidence.** Positive polarity for temperature (hotter = higher pitch) is preferred by both blind (10–0) and sighted (11–6) listeners in Walker & Mauney's study, with cross-group polarity agreement r = 0.818 and a small blind sample ([Walker et al. PDF](https://wirelessrerc.gatech.edu/sites/default/files/publications/walker_et_al_-_a_comparison_of_sonification_mappings.pdf)). Recent work favours declarative specs (Erie, [arXiv 2402.00156](https://arxiv.org/pdf/2402.00156)) and sound plus speech or text for BLV users ([MIT Umwelt](https://news.mit.edu/2024/umwelt-enables-interactive-accessible-charts-creation-blind-low-vision-users-0327)). No peer-reviewed source was found for "rain → note density"; that mapping is an INTERPRETATION. Recommended: one variable per pitch channel, a spoken anchor ("29.4 °C, verified against MUR"), and published per-layer stems in the Chandra style.

---

## Shortlist: ten tests, each under an hour, before any build

The ranking is an internal heuristic that weighs verification strength, Bangladesh relevance, frame pairing and effort. It is not a prediction of judging.

| # | Addition | Why it ranks here | Fastest validation test (hypothesis → pass condition) |
|---|---|---|---|
| 1 | **5176 SST anomaly** with 5101 | Same pipeline and EXR family; adds "relative to normal"; has an EXR colorbar | Invert `sst_mur_anomaly_nodates_most_recent.exr` at the existing 60 points. Compare with NOAA CRW SSTA for the same date. **Pass:** sign agreement ≥90% and median difference small relative to the ±4 °C scale. Also list the frames directory to confirm the newest date despite the 08-31 stamp. (30 min) |
| 2 | **5151 PM2.5 frames + GEOS-CF v2 values + DoE ground** | Replaces Planet FM's weakest claim with a three-way check (frame → model value → ground) | Mask labels, invert the Dhaka and Chattogram pixels of the latest frame, and compare with Zarr `PM25_RH35` at the same hour. **Pass:** within the colorbar quantisation step. Then compare with the DoE station via WAQI and *report* the bias rather than tuning it away. (45 min) |
| 3 | **IMERG × JAXA GSMaP duet** | JAXA is a 2026 partner; GPM partners; Bangladesh literature exists | Pull GSMaP daily for Jun–Sep 2024 over Bangladesh via JAXA Earth API, against IMERG daily. **Pass:** monthly correlation high and daily lower, consistent with the published gauge pattern. Say "partly independent". (45 min) |
| 4 | **Three-layer Dhaka air track** (MERRA-2 + ACAG + Embassy) | The direct, honest answer to "AQI 2000–2026" | MERRA-2 Dhaka cell vs Embassy daily 2016–2021. **Pass:** r near or above the ~0.6 India benchmark; publish the bias. **Fail:** downgrade to monthly. (60 min) |
| 5 | **OPERA DSWx-S1 Aug 2024 + Charter 905 + LANCE** | A NASA-curated Bangladesh event; radar sees under cloud | `computeStatisticsHistograms` on the ImageServer for the three dates. **Pass:** water plus inundated-vegetation fraction rises from 5 May → 9 Aug → 21 Aug. (30 min) |
| 6 | **5113 fire frames** paired with existing FIRMS | Frame pairing for a layer Bloop already verifies | Count 5113 hot pixels in the CHT box vs FIRMS points for the same 5-day window. **Pass:** same order of magnitude and the same clusters. (30 min) |
| 7 | **HydroShare wells × GRACE** | Ground-verifies a claim already on stage | Average CC-BY monthly levels 2002–2014 over Bangladesh and correlate with GRACE anomalies. **Pass:** a clear shared seasonal cycle and trend direction. (60 min) |
| 8 | **SWOT Hydrocron** (Jamuna/Padma) | New mission with a small API | 3–5 reaches, Jun 2024 – Jan 2025. **Pass:** water-surface-elevation (WSE) amplitude ≥3 m with ≥8 valid passes per reach. **Fail:** demote to spotlight. (60 min) |
| 9 | **5315 fire weather + LIS lightning seasonal score** | Categorical and climatological voices that suit percussion | 5315: download today's PNG and map six categories at three points (10 min). LIS: confirm the GHRC climatology file for Bangladesh exists (20 min) |
| 10 | **Live event layer** (USGS + EONET + SWPC RTSW) via the cache | Real-time feel without fragile browser calls | Run the browser CORS test below; if it fails, use the GitHub Action cache. (20 min) |

Next tier, if time allows: SMAP salinity plume, Black Marble Dhaka (VNP46 vs VJ146), NEX-GDDP NCSS for Dhaka, the GMSL/PSMSL 1993–2003 overlap, a seismic audification clip, and 5099 sea ice.

### What is still UNVERIFIED, and the minutes it takes to check

| Unverified item | Check | Time |
|---|---|---|
| **CORS for every API** (USGS, EONET, SWPC, Open-Meteo, JAXA Earth, GML, ERDDAP, GEOS-CF S3, CMR, Hydrocron, FFWC, POWER) | From the deployed Bloop origin, in DevTools: `fetch(URL).then(r=>console.log(r.status, r.headers.get('access-control-allow-origin')))` | 10 min |
| **GIBS tile pixel access** | `img.crossOrigin='anonymous'` → draw to canvas → `getImageData` on one GIBS tile; a tainted-canvas error means server-side inversion is required | 5 min |
| GIBS layer names and colormap XML | Fetch the WMTS GetCapabilities and search for the MUR SST, MUR anomaly, IMERG and VIIRS thermal anomaly layers | 10 min |
| VEDA STAC/raster and GHG Center collections | Open the `openveda.cloud` STAC and `earth.gov/ghgcenter/api/stac/collections` in a browser; look for COG point/statistics routes | 10 min |
| SVS freshness for 5101, 5113, 5176, 5544, 4285 and the 5147–5154 layouts | List the newest file in each `frames/` directory with the pipeline | 10 min |
| 5120 coverage and 5046/5064 years | Fetch `svs.gsfc.nasa.gov/api/5120`, `/5046` and `/5064` | 5 min |
| SWPC new paths | Fetch `json/rtsw/rtsw_wind_1m.json` and check the `proton_speed` field | 2 min |
| Official partner page, judging criteria, Challenge #14 resources | Open spaceappschallenge.org in a normal browser; recheck on 28 Oct | 10 min |
| AERONET Dhaka L2.0 years; OpenAQ Dhaka locations; UHSLC 134/136 recency | Browser visits | 15 min |
| Hydrocron base URL and auth; LHASA point/WMS route; PACE L3 names; SMAP SSS short name | One CMR `collections.json?short_name=` query each, plus one Hydrocron call | 15 min |
| EMIT plumes over Bangladesh | VISIONS portal search, Dhaka bbox | 10 min |

---

## Traps that would quietly break the verification story

**Retired or changed feeds.**
- **IRIS audio and timeseries services retired on 2026-08-26.** Build audio from miniSEED instead ([EarthScope](https://www.earthscope.org/news/retirement-of-the-irisws-timeseries-web-service/)).
- **SWPC Service Change Notice 26-21.** Around 31 Mar 2026, the Kp, Dst and F10.7 files switched to key-value objects. Around 30 Apr 2026, the legacy `products/solar-wind/mag-*`, `plasma-*` and `ephemerides.json` files were removed in favour of `json/rtsw/*`, with `density` renamed to `proton_density` and `speed` to `proton_speed` ([NWS SCN 26-21](https://www.weather.gov/media/notification/pdf_2026/scn26-21_Data_Format_Changes_Impacting_SWPC_Products.pdf)). Tutorials that use `plasma-7-day.json` now break.
- **US Embassy Dhaka feed halted on 4 Mar 2025.**

**Ending or at-risk missions.**
- **Terra and Aqua "begin shutting down in late 2026 or early 2027"** ([Earthdata](https://www.earthdata.nasa.gov/data/alerts-outages/transition-from-modis-viirs)). A separate report gives Terra/Aqua/Aura end of life as 2027–2028 ([Washington Technology](https://www.washingtontechnology.com/contracts/2026/01/nasa-eyes-partnerships-extend-lives-three-aging-earth-observation-satellites/410554/)). That is CONFLICT preserved: shutdown start vs end of life. MODIS NDVI, MAIAC, AIRS, CERES-Terra/Aqua and OMI therefore need a VIIRS continuity note.
- **CALIPSO ended on 1 Aug 2023** ([Earthdata](https://www.earthdata.nasa.gov/data/alerts-outages/calipso-final-data-products)).
- **LIS ended in 2023 with no Asian successor.** GOES GLM cannot see Bangladesh (INFERRED).
- **OCO-2/3 faced proposed FY26 termination**, with the final outcome unconfirmed.

**Data gaps and reprocessing windows.**
- **SMAP standard products for 14 May – 28 Jul 2026 are being reprocessed**, and NRT products from that window will not be replaced ([NSIDC](https://nsidc.org/data/SPL3SMP)).
- **NISAR has a permanent gap from 27 Jul to 10 Aug 2026**, overlapping the monsoon peak. Its products are provisional, with validated reprocessing by the end of 2026 ([ASF](https://nisar-docs.asf.alaska.edu/availability-overview/)).

**Licensing and access.**
- **Himawari P-Tree prohibits redistribution.** Use the NOAA AWS copy instead.
- **BMD paid data cannot be republished.**
- **OpenAQ keys must not ship in client code.**
- **DEMO_KEY allows 50 requests per day**, which audience reloads would exhaust.
- **CelesTrak firewalls clients that ignore errors.**

**"Independent" duets that share inputs.**
- IMERG and GSMaP share GPM passive-microwave data.
- CAMS assimilates MODIS AOD.
- ESA CCI soil moisture merges SMAP and AMSR2.
- L4 SST blends share infrared inputs.
- Open-Meteo repackages ECMWF/Copernicus data.
- MERRA-2 is a reanalysis that GES DISC says should not validate other products.
- NASA POWER is already excluded for long-term claims.

Under the project's Independence Rule, a shared-input agreement counts as *partial* confirmation only.

**Structural breaks and labelling.**
- **GEOS-CF v1 → v2 (Oct 2025)** and **NSIDC v3 → v4 (AMSR2 input)** must not be spliced silently.
- **SVS page stamps ≠ data freshness.** 5584 looks stale (Jan 2026), and 5544 data previously lagged about 104 days.
- **5147 says both 2 m and 3 m.**
- **OPERA DSWx-S1 is "preliminary and unvalidated".**
- **EONET is not a precise positional source.**
- **Altimetry does not include delta subsidence.**
- **Bangladesh tide gauges end in 2003–06**, so they cannot verify present-day sea-level rise.
- **SWORD IDs changed between Hydrocron versions.**
- **TEMPO does not cover Bangladesh.**

---

## Conclusion

The catalogue changes where Bloop's advantage comes from. Adding themes is not the lever. A data source adds value only if it can be checked by something that does not share its inputs. Read that way, the most valuable additions are paired checks: 5176 against CRW, 5151 against GEOS-CF values and DoE stations, IMERG against GSMaP, OPERA against Charter maps and FFWC, and GRACE against CC-BY well records. The fact that SVS frames and their source models are both public means Bloop can show *two decoding paths to the same number*. No precedent found in this research does that. Admitting shared inputs out loud ("partly independent") is the epistemic standard Planet FM's unsourced AQI line and the GISTEMP prototype's unexplained "verified" label do not meet.

The binding constraints are now logistical rather than scientific. They are the untested CORS behaviour, FFWC registration lead time, and the 28 Oct release of official partner resources, which may name preferred datasets. Two actions are cheap and change decisions: register with FFWC today, and run the 15-minute browser CORS and pixel-access test from the deployed origin. Then run the ten shortlist tests in order and drop any layer that fails. That keeps the build aligned with what the evidence supports, and keeps the demo's claims at or below what Bloop has actually verified.