# Pre-wire Bloop for NASA's likely additions

NASA's most probable additions to the Challenge #14 list are more SVS IDs from the EIC gallery tree it already curates, not new datasets. The six EIC dashboard sub-galleries hold about 35 visualization IDs that the 2026 list did not name. The Daily Visualizations gallery holds 23 more. One EIC beauty piece, 4993 (Dixie Fire spread), sits in the gallery but is missing from the named list ([SVS API 40467](https://svs.gsfc.nasa.gov/api/40467)).

The best Tier 1 targets are siblings that supply what the official items lack:

- **SVS 5436** gives DYAMOND CO2 as 8192×4096 2:1 frames with a timestamp file ([SVS API 5436](https://svs.gsfc.nasa.gov/api/5436)).
- **SVS 5479** gives Perpetual Ocean 2 temperature and salinity as 4096×2048 equirectangular frames ([SVS API 5479](https://svs.gsfc.nasa.gov/api/5479)).
- **SVS 5624** is a GEOS-FP smoke forecast, updated daily, with EIC colorbars ([SVS API 5624](https://svs.gsfc.nasa.gov/api/5624)).
- **SVS 5650** is the June 2026 IMERG near-real-time item ([SVS 5650](https://svs.gsfc.nasa.gov/5650/)).
- **SVS 3144** is a 0.5° lightning flash-rate map with a numeric colorbar ([SVS API 3144](https://svs.gsfc.nasa.gov/api/3144)).

The validation layer (Tier 2) needs four corrections:

- **5533** must be checked against **GEOS-CF v1**, not v2 ([GEE GEOS-CF v1](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v1_rpl_tavg1hr?authuser=0)).
- **4950** must be checked against **GEDI L2B RH100**, not L3 ([SVS 4950](https://svs.gsfc.nasa.gov/4950)).
- **5425** must be checked against a 3-D ocean product at **600 m and deeper**, not surface SST ([SVS API 5425](https://svs.gsfc.nasa.gov/api/5425)).
- **5011** must be checked against **ISS LIS V2/V3**. That record ended on 16 Nov 2023 ([data.gov ISS LIS V2](https://catalog.data.gov/dataset/quality-controlled-lightning-imaging-sensor-lis-on-international-space-station-iss-science)).

Among other agencies (Tier 3), these routes are open and verified: CAMS EAC4 and ERA5 (both CC-BY), JAXA's keyless Earth API and GSMaP, ESA CCI SST, NOAA OISST on ERDDAP, and Copernicus GLORYS12. JAXA's Himawari P-Tree data forbids redistribution.

All pages were read on 29 Oct 2026 through a fetch tool, because the sandbox proxy blocked direct SVS and CMR access. About 40 SVS pages and most CMR IDs therefore remain unverified. Nothing here is evidence of what NASA will actually add.

The NASA announcement also says partner datasets were released on 28 Oct ([Astrobiology.com](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/)), which conflicts with the team's assumption of 13 Nov. Checking the Challenge #14 Resources tab today is the cheapest action that could change these plans.

## How to read the tables: tiers, labels and shorthand

The tiers are internal pre-incorporation priorities. They are not predictions of NASA's actions or of judging.

**Tiers**

- **T1** is a NASA visual likely to be added that Bloop can frame-pair.
- **T1·low** is a NASA visual that is only a movie, only a graph, or has no colorbar. It is usable, but costlier to invert.
- **T2** is raw-value validation or companion data.
- **T3** is an other-agency or partner source.

**Status labels**, carried over from the research notes

- **VERIFIED**: read on the cited page on 29 Oct 2026, or on 12 Oct for items carried over from the earlier catalogue.
- **PV (partially verified)**: the item exists, but the ID or key fields came from search-result URLs or titles.
- **UNVERIFIED**: prior knowledge, or not opened.

**Format codes**

- **FP**: frames plus a colorbar with a numeric range.
- **FP-2:1**: FP with an equirectangular flat map.
- **F**: frames with no usable colorbar.
- **M**: movie only.
- **G**: graph or curve.
- **RAW**: values only.

**Licence shorthand**

- **SVS-PD**: SVS states "All of our content is in the public domain (unless otherwise noted)". It warns that some music is licensed and asks for an item-level credit line ([SVS help](https://svs.gsfc.nasa.gov/help/)).
- **EOSDIS-open**: "openly shared, without restriction" ([Earthdata M2T1NXAER](https://earthdata.nasa.gov/data/catalog/ges-disc-m2t1nxaer-5.12.4)).
- **USG**: US Government work.
- **n/s**: not stated on the page read.

## Thirty-five unnamed IDs already sit inside the EIC tree

The 2026 list mostly names EIC beauty pieces. Each of the gallery's six cards leads to more curated IDs, so these are the cheapest IDs for NASA to add. Past lists show a drift from gallery URLs toward specific IDs:

- **2024 "Connected Earth"** listed the EIC gallery, Data Pathfinders, Images of Change and earth.gov, plus ESA and CSA wildfire items.
- **2025 "Deep Dive"** listed earth.gov, the EIC gallery, SVS 5432 (PACE), SVS 5519 (SWOT), the Earthdata Ocean topic, CSA SWOT/RCM and INPE CPTEC.
- **2026** lists about 10 IDs.

Every 2024 statement also carried "More resources may be added". These points come from captured challenge pages (Tier C) in the internal project doc `NASA_Space_Apps_Summary_to_Statement_Analysis_2022-2025.md`, Appendix B. They were not re-fetched live.

| Gallery (ID) | Child SVS IDs and contents | Status |
|---|---|---|
| EIC Content Database ([40467](https://svs.gsfc.nasa.gov/api/40467)) | Overview; 6 dashboards (below); videos 40487 Hurricanes, 40484 Agriculture, 14700 Biodiversity, 14606 Fire, 14696 GHG, 14568 Methane, 14507 Jane Goodall, 14713 Coastal Resilience; beauty pieces 3912, 4950, **4993 Dixie Fire**, 4960, 5011, 5313, 5196, 5425, 5533; B-roll 14371; link to Daily (40512) | VERIFIED |
| Earth Now ([40509](https://svs.gsfc.nasa.gov/api/40509)) | Worldview links without IDs: Terra true colour, Black Marble, geostationary, active fires, rain and snow, SST, LST, Arctic and Antarctic sea ice. GEOS-FP weather 5147–5150, AQ 5151–5154, GOES true colour 5120 | VERIFIED |
| Climate Vital Signs ([40473](https://svs.gsfc.nasa.gov/api/40473)) | 5099 polar sea ice, 5111 ocean heat since 1957, 5119 OCO-2 + Keeling, 5190 Climate Spiral, 5207 temperature anomalies 1880–2023, 5191 temperature graph, 5209 zonal anomalies, 5382 Arctic minimum 2024, 5235 Sea Level Through a Porthole | VERIFIED |
| Greenhouse Gases ([40477](https://svs.gsfc.nasa.gov/api/40477)) | Media groups 33547 (wetland CH4) and 33600 (US CH4); 5047 NEE; 5115 CO2; 5116 CH4; 5118 CH4 trends; 5117 N2O; 5119; 5121 ODIAC; 5126 NOAA AGGI | VERIFIED |
| CO2 Sources and Sinks ([40479](https://svs.gsfc.nasa.gov/api/40479)) | 5110 CO2 tagged by source, 5081 national CO2 budgets, 5121; 5273 is the SOS version of 5110 | VERIFIED |
| Air Quality ([40529](https://svs.gsfc.nasa.gov/api/40529)) | Worldview links (SNPP fires, Aqua CO, Aura NO2, SNPP AOD); 5151–5154; TEMPO group 5175, 4810, 5107; Eyes on Earth Aqua and Aura | VERIFIED |
| Wildland Fires ([40531](https://svs.gsfc.nasa.gov/api/40531)) | Links to Worldview VIIRS, FIRMS, NOAA smoke forecast, FIRMS Red Flags; 5315 fire weather; **5453 US annual burned area**; 5113 VIIRS fires | VERIFIED |
| Daily Visualizations ([40512](https://svs.gsfc.nasa.gov/gallery/daily-visualizations)) | 23 items: 4285, 5067, 5113, 5101, 5120, 4897, 5046, 5064, 5099, 5072, 5147–5154, 5176, 5315, 5584, 5544, 5577. Page updated 10 Aug 2026; 5650 not listed | VERIFIED |
| Legacy Main Dashboard ([40476](https://svs.gsfc.nasa.gov/api/40476)) | Arctic sea ice spiral, 5057, 5101, **5087 water-cycle extremes**, **5075 NRT global biosphere**, Fleet Now, 5113, 5106, 5120, Worldview Tours 5180 and 5179 | VERIFIED |
| Air Quality in DC ([40483](https://svs.gsfc.nasa.gov/api/40483)) | 10977, 4764, 5104, 5070, 5107, 5067 | VERIFIED |
| Hyperwall Power Playlist, Earth ([40503](https://svs.gsfc.nasa.gov/api/40503)) | 40512, 5120, 30763, 30878/30877, 5468, 5276, 4920, 5258, 5208, 4654, 4519, 4806, 5147–5154. "Agriculture and Land Use" group is empty. The API response was truncated, so later groups were not read | PV |
| Agriculture video featured list ([40484](https://svs.gsfc.nasa.gov/api/40484)) | 10480, 13417, 12647, 20322, 30521, **5098**, **4968**, **5087**, 10721, 31196, 4170, **4889** | VERIFIED |
| Coastal Resilience video ([14713](https://svs.gsfc.nasa.gov/api/14713)) | Built on 5221 GMSL, 5235 Porthole and 5207; 7680×2160 plus two 2160×2160 circles | VERIFIED |

The earth.gov hyperwall package names a fourth dashboard, **"Disasters"**, which has no SVS gallery under 40467 ([earth.gov hyperwall package](https://earth.gov/visit/package/hyperwall)). Slides from August 2026 list the EIC touchscreen apps, including **"Air Quality Orchestra"** and the Hometown Dashboard ([FDLP slides](https://fdlp.gov/sites/default/files/training/20260827-wn-nasa-earth-exhibits-programming-libraries-slides.pdf)). Air Quality Orchestra is the closest official precedent to a jukebox, but it has no public page. If NASA adds disaster or sound content, it may come from earth.gov rather than SVS. That is a HYPOTHESIS.

## 13786: five SYSTEM Sounds siblings, and a "radius" that may mean size

SVS 13786 says a radar-like sweep plays the image and **"the radius of the stars is mapped to pitch"**. The whole image plays as a choir, orange and red stars play on marimba, and blue stars on glockenspiel. The page describes no brightness mapping ([SVS 13786](https://svs.gsfc.nasa.gov/13786)).

"Radius" can mean a star's size, not its distance from the cluster centre. That reading would explain Bloop's ρ≈0 result for a radius-from-centre test (INTERPRETATION). The summary also said "stars farther out sound higher", which may be the fetch tool's own paraphrase, so check the wording verbatim.

Every SVS sonification ships as video only. Audio has to be demuxed from the MP4.

| Candidate | Access | Released | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| [13786](https://svs.gsfc.nasa.gov/13786) Caldwell 73 / NGC 1851 (official) | SVS page; `api/13786` | 23 Dec 2020; updated 3 May 2023 | M: MP4/WebM 1920×1920, SRT, JPG stills; no audio file | No explicit licence; NASA guidelines; credit "NASA's Goddard Space Flight Center" | Correlate extracted note pitch against star blob **area or flux** along the sweep, not radius from centre | Official · VERIFIED |
| [13893](https://svs.gsfc.nasa.gov/13893) Hubble Ultra Deep Field | SVS | 3 Aug 2021 | M: MP4 12 MB, WebM, SRT/VTT | SVS-PD presumed | SYSTEM Sounds gives pitch = galaxy colour, volume = apparent size ([SYSTEM Sounds](https://www.system-sounds.com/nasa/)) | T1 · VERIFIED |
| 13997 NGC 2392; 13998 Butterfly; 13999 Bubble Nebula | Cross-linked from [13786](https://svs.gsfc.nasa.gov/13786) | n/s | M presumed | SVS-PD presumed | Mappings unread | T1 · PV |
| 13061 Hubble Treasure Trove | Cross-linked from [13893](https://svs.gsfc.nasa.gov/13893) | n/s | M presumed | — | Mapping unread | T1 · PV |

## 3912: a per-frame date file makes the ECCO2 family the easiest to validate

SVS 3912 covers 25 Mar 2007 to 3 Mar 2008. It offers equirectangular frames at 6840×3420 and 2048×1024 (`orig/` and `with_colorbar/`) and a colorbar running from 0 to 32 °C. It also has **`flat_ecco2_dates.txt`**, which pairs each frame with an exact date ([SVS API 3912](https://svs.gsfc.nasa.gov/api/3912)).

ECCO2 is a model that assimilates data. Expect agreement at large scales, not eddy by eddy (INTERPRETATION). Access to the ECCO2 source is fragile: ECCO Drive returned errors in Sep 2025 and again in Mar 2026, and support pointed users to APDRC and data.nas.nasa.gov/ecco ([ecco-support Sep 2025](https://mailman.mit.edu/pipermail/ecco-support/2025-September/000825.html); [Mar 2026](https://mailman.mit.edu/pipermail/ecco-support/2026-March/000840.html)).

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| [3913](https://svs.gsfc.nasa.gov/api/3913) Gulf Stream currents + SST | SVS | ECCO2; released 15 Feb 2012 | FP (regional): `6840x2304_80x27_30p/gulf_flow_sst_alpha/`, white version, 3420×1152, 15 tiles; colorbar ≤0 → 17 → ≥33 °C | SVS-PD | MUR, OISST | T1 · VERIFIED |
| [3821](https://svs.gsfc.nasa.gov/api/3821) Flat-map flows with SST | SVS | 10 Jan 2005 to ~2006 | F, 2:1: `4096x2048_2x1_30p`; colorbar has **no numeric range** | SVS-PD | Rank only, unless the range can be recovered | T1·low · VERIFIED |
| [3827](https://svs.gsfc.nasa.gov/api/3827) Perpetual Ocean (2011) | SVS | Jun 2005–Dec 2007 (the dataset entry says 06/2006) | F: 1920×1080, white flows, no colorbar | SVS-PD | Currents only (OSCAR, drifters) | T1·low · VERIFIED |
| 10953 Swirling Seas; 10841; 3820 Mediterranean; 4802; 12738 | Listed as related on [3912](https://svs.gsfc.nasa.gov/api/3912) and [3827](https://svs.gsfc.nasa.gov/api/3827) | n/s | Not opened | — | — | T1 · UNVERIFIED |
| ECCO2 Cube92 (source model) | APDRC; data.nas.nasa.gov/ecco | Matches the 2007–08 window | RAW | n/s | Same-model test of the inversion | T2 · PV (mirrors not fetched) |
| MUR-JPL-L4-GLOB-v4.1, C1996881146-POCLOUD, DOI 10.5067/GHGMR-4FJ04 ([titiler-cmr](https://developmentseed.org/titiler-cmr/dev/examples/xarray_backend_example)) | PO.DAAC, Earthdata login | Daily from 2002 | RAW netCDF | EOSDIS-open | Observational SST for 3912 | T2 · VERIFIED |
| ECCO_L4_TEMP_SALINITY_05DEG_DAILY_V4R4 ([Earthdata](https://www.earthdata.nasa.gov/data/catalog/pocloud-ecco-l4-temp-salinity-05deg-daily-v4r4-v4r4)) | PO.DAAC cloud | 1992-01-01 → 2018-01-01, daily, 0.5° | RAW | EOSDIS-open | Independent state estimate; covers 3912 but not 5425 | T2 · VERIFIED |
| OSCAR_L4_OC_FINAL_V2.0, C2098858642-POCLOUD, DOI 10.5067/OSCAR-25F20 ([PO.DAAC](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_FINAL_V2.0)) | PO.DAAC; AWS Open Data | 1993 → 2026-01-17, daily, 0.25°. Interim version ~1-month latency, NRT ~2 days | RAW netCDF-4; PO.DAAC also has an OSCAR current-speed animation | EOSDIS-open | Current speed along streak pixels | T2 · VERIFIED |
| NOAA OISST v2.1, ERDDAP `ncdcOisst21Agg` ([ERDDAP](https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.html)); NRT `ncdcOisst21NrtAgg_LonPM180` | No key | 1981-09-01 → 2026-10-12, daily, 0.25° | RAW, or **PNG on request**, so it can be frame-paired | Free use and redistribution | Second-agency SST; a test of the pipeline itself | T3 · VERIFIED |
| NOAA GDP hourly drifters, `drifter_hourly_qc`, DOI 10.25921/x46c-3620 ([AOML](https://www.aoml.noaa.gov/phod/gdp/hourly_data.php)) | ERDDAP; AWS | 3 Oct 1987 → 31 Oct 2022, hourly | RAW: in-situ velocity and SST | n/s (NOAA) | In-situ check of whether the flows are real | T3 · VERIFIED |
| ESA CCI SST v3.0 L4, DOI 10.5285/4a9654136a7148e39b7feb56f8bb02d2 ([CEDA](https://catalogue.ceda.ac.uk/uuid/4a9654136a7148e39b7feb56f8bb02d2/)) | CEDA, OPeNDAP | 1980 → present (ICDR ~1 month behind), daily, 0.05° | RAW | CC BY 4.0 | Partner-agency SST | T3 · VERIFIED |
| OSTIA NRT, SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001, DOI 10.48670/moi-00165 ([CMEMS](https://data.marine.copernicus.eu/product/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/description)) | Copernicus Marine | 2024-01-17 → 2026-10-28, daily, 0.05° | RAW | Copernicus Marine licence | Live SST only; does not overlap 3912 | T3 · VERIFIED |
| JAXA GCOM-C SGLI L3 SST V3, GEE `JAXA/GCOM-C/L3/OCEAN/SST/V3` ([GEE](https://developers.google.com/earth-engine/datasets/catalog/JAXA_GCOM-C_L3_OCEAN_SST_V3?authuser=9)); AMSR2 L2 SST ([FedEO](https://fedeo.ceos.org/series/concepts/mim/144/GCOM-W_AMSR2_L2_SST)) | GEE; G-Portal (account needed to download) | n/s | RAW | JAXA terms | Partner SST (AMSR2 is microwave) | T3 · PV |

## 5313: night-light siblings carry sign, not numbers

SVS 5313 renders the Black Marble change from 2012 to 2023 in purple (more light) and orange (less light) with **no numeric colorbar**. Its dataset entry, "Black Marble: Next Generation" (SVS dataset 1176), names no product level ([SVS 5313](https://svs.gsfc.nasa.gov/5313)). Its only frame set is 7680×2160 at 32:9.

Validation therefore stays at sign and rank against VNP46A4 yearly differences, as in Bloop's existing 90.9% sign-agreement test. The SOS sibling 5475 is the best route to per-pixel geolocation.

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| 5276 Night Lights 2012–2023, original (India and Ukraine pop-outs) | Related on [5313](https://svs.gsfc.nasa.gov/5313); in 40503 | Annual 2012–2023 | Frames unverified | SVS-PD | VNP46A4 | T1 · PV |
| **5475** SOS: Night Lights change 2012–2023 | Related on [5313](https://svs.gsfc.nasa.gov/5313) | Same | Equirectangular flat map (stated); frames and colorbar unverified | SVS-PD | VNP46A4 per pixel | T1 · PV |
| 5477 SOS: day/night cycle with Blue Marble and Black Marble | Related on [5313](https://svs.gsfc.nasa.gov/5313) | n/s | Unverified | SVS-PD | Context only | T1·low · PV |
| 30919 "A Changing Earth at Night" | [SVS API 30919](https://svs.gsfc.nasa.gov/api/30919) (search hit) | n/s | Unread | — | — | T1 · UNVERIFIED |
| 4658 Black Marble: Puerto Rico disaster recovery; 12616 Black Marble Puerto Rico video | [4658](https://svs.gsfc.nasa.gov/4658/); [12616 transcript](https://svs.gsfc.nasa.gov/vis/a010000/a012600/a012616/12616_BlackMarblePR_FINAL-transcript.html) | Hurricane Maria event | Unread | SVS-PD | VNP46A2 daily | T1 · PV (search-listed) |
| NASA Disasters ArcGIS: Beryl `Power_Loss_Maps`; Helene `blackmarble_hd_augusta` ([Beryl](https://maps.disasters.nasa.gov/ags03/rest/services/hurricane_beryl_2024/Power_Loss_Maps/MapServer/layers); [Helene](https://maps.disasters.nasa.gov/ags04/rest/services/hurricane_helene_2024/blackmarble_hd_augusta_MIL1/MapServer?f=pjson)) | REST map service | 2024 events | RAW or map service | n/s | Outage-as-silence events | T2 · PV |
| VNP46A1–A4 (S-NPP) and VJ146A1–A4 (NOAA-20) ([LAADS](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/science-domain/nighttime-lights/)) | LAADS, Earthdata login | S-NPP from 19 Jan 2012; NOAA-20 from 5 Jan 2018; daily (A1, A2), monthly (A3), yearly (A4); 15 arc-second | RAW. The HDF5 tile format is UNVERIFIED | EOSDIS-open | **VNP46A4 2012 vs 2023** is the primary pair; VJ146A4 cross-checks 2018–2023 | T2 · VERIFIED (DOIs and CMR IDs not read) |
| Black Marble Collection 2 note | [LAADS alert](https://ladsweb.modaps.eosdis.nasa.gov/alerts-and-issues/171686); [User Guide C2.0](https://www.earthdata.nasa.gov/s3fs-public/2025-05/BlackMarbleUserGuide_Collection2.0.pdf) | S-NPP v1.0 production stopped after 31 Jan 2025 | — | — | Use Collection 2 files | T2 · PV |
| EOG VIIRS VNL annual, GEE `NOAA/VIIRS/DNB/ANNUAL_V21` ([GEE](https://developers.google.cn/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_ANNUAL_V21)) | GEE | Annual from 2012 | RAW | CC BY 4.0 widely reported but UNVERIFIED | Independent processing of the same sensor | T3 · PV |
| SDGSAT-1 Glimmer (10 m night lights) | Literature only ([MDPI RS 16:4298](https://mdpi-res.com/d_attachment/remotesensing/remotesensing-16-04298/article_deploy/remotesensing-16-04298.pdf)) | n/s | RAW | Access policy unread | Dhaka detail | T3 · UNVERIFIED |

## 5669/5572: clean aerosol frames, a daily smoke twin and a same-model validator

SVS 5572 is the most inversion-friendly official item. Its flat 6480×3240 2:1 `Aerosols/` frames are label-free. Labels and annotations come as separate transparent `Annotations/` overlays. The page includes a 1500×300 colorbar, `Aerosols_cbar.png`. The source is GEOS-FP, 1 Aug to 14 or 15 Sep 2024; the page gives both end dates ([SVS API 5572](https://svs.gsfc.nasa.gov/api/5572)).

The strongest validator is the same model's **`tavg3_2d_aer_Nx`** collection, which SVS 5624 names as the home of total and brown-carbon AOD ([SVS API 5624](https://svs.gsfc.nasa.gov/api/5624)). The team saw a weak match with MERRA-2 for dust and smoke. That fits a mismatch between modelling systems (MERRA-2 runs GEOS 5.12.4) better than an inversion failure (INTERPRETATION). Testing against GEOS-FP first separates the two explanations.

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| 5669 GEOS Aerosols (2025) (official) | [search hit](https://svs.gsfc.nasa.gov/5669) | n/s | From team notes; not re-fetched | SVS-PD | GEOS-FP | Official · PV |
| 5552 SOS: Aerosols in the Air (alternate of 5572) | [search hit](https://svs.gsfc.nasa.gov/5552); [NOAA SOS entry](https://sos.noaa.gov/catalog/datasets/aerosols-in-the-air/) | As 5572 | Probably 2:1; not fetched | SVS-PD; SOS educational | GEOS-FP | T1 · UNVERIFIED |
| **5624** Global Smoke Forecast (daily updated) | [SVS API 5624](https://svs.gsfc.nasa.gov/api/5624) | Released 29 May 2026; **updated 29 Oct 2026**; yesterday to +4 days | 4096×2048 MP4 (no frame set); colorbars `WildfireSmokeIntensity_colorbar.png` and `_withbox` (EIC), both 528×165; brown-carbon AOD scale 0–1 | SVS-PD | GEOS-FP `tavg3_2d_aer_Nx` forecasts | **T1 · VERIFIED** (the "live" aerosol layer) |
| 5557 Largest US wildfires 2025 (daily); 2026 version 5639 | [SVS API 5557](https://svs.gsfc.nasa.gov/api/5557); [5639](https://svs.gsfc.nasa.gov/api/5639) | Released 8 Sep 2025 | FireContext PNG 2048×1024; GEOS black-carbon MP4 4096×2048; AQ and weather 1700×800; fire perimeters; `_prev_versions/` frames; scale burned in | "freely and openly available for public use" | GEOS-FP; FEDS perimeters | T1 · VERIFIED (5639 PV) |
| 5665 Canadian smoke, 14–20 Jul 2026 | [SVS API 5665](https://svs.gsfc.nasa.gov/api/5665) | Released 20 Jul 2026 | M: 3840×2160 MP4 and PNG; no colorbar | SVS-PD | GEOS-CAM and the GEOS-FP 2 km Replay have no public route found | T1·low · VERIFIED |
| 5668 Pacific Northwest wildfires | [SVS API 5668](https://svs.gsfc.nasa.gov/api/5668) | Released 6 Aug 2026 | No frames or colorbar | SVS-PD | — | T1·low · VERIFIED |
| 14899 Inside the Visualization: Aerosols; 5664; 5666; 5631; 5594; 5597; 5598; 5601; 5568; 5558; 14894 | Related on [5572](https://svs.gsfc.nasa.gov/api/5572) and [5665](https://svs.gsfc.nasa.gov/api/5665) | n/s | Titles only | — | — | T1 · UNVERIFIED |
| GEOS-FP `tavg3_2d_aer_Nx` (total and brown-carbon AOD; portal `das/` and `forecasts/`) | NCCS portal ([per 5624](https://svs.gsfc.nasa.gov/api/5624)) | 3-hourly | RAW. Variable names are assumed by analogy with MERRA-2 | n/s | **Same-model test of the 5572 inversion** | T2 · PV |
| GEOS-FP `inst3_2d_gas_Nx` (`aodana`, `aodinc`) | [NCCS OPeNDAP](https://opendap.nccs.nasa.gov/dods/GEOS-5/fp/0.25_deg/assim/inst3_2d_gas_Nx.info) | 00Z 1 Dec 2017 → 09Z 12 Oct 2026, 3-hourly, 0.25°×0.3125° | RAW OPeNDAP | n/s | Total AOD analysis | T2 · VERIFIED |
| MERRA-2 M2T1NXAER (tavg1_2d_aer_Nx), C1276812830-GES_DISC (PV) ([Earthdata](https://earthdata.nasa.gov/data/catalog/ges-disc-m2t1nxaer-5.12.4)) | GES DISC | 1980 → ~3 weeks ago, hourly | RAW: DUEXTTAU, SSEXTTAU, OCEXTTAU, BCEXTTAU, SUEXTTAU and others; TOTEXTTAU unconfirmed | EOSDIS-open | Same model family, older version | T2 · VERIFIED (ID PV) |
| GEOS-CF v1 `AOD550_*` and speciated PM2.5 | [GEE v1](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v1_rpl_tavg1hr?authuser=0) | 2018 → 2026-01-02, hourly | RAW | Any purpose | Third aerosol-type check (GEOS-Chem chemistry) | T2 · VERIFIED |
| GIBS aerosol layers: `MODIS_Combined_Value_Added_AOD` (from 2013-01-31), `OMI_Aerosol_Index`, `MODIS_Terra_Aerosol`, `MODIS_Aqua_Aerosol`, `OMI_Aerosol_Optical_Depth`, `OMI_Absorbing_Aerosol_Optical_Depth`, `AIRS_Dust_Score` ([Earthdata wiki](https://wiki.earthdata.nasa.gov/x/0IXbAQ)) | GIBS WMTS with `TIME=` | NRT to present | FP via GIBS colormap XML and legends | n/s | Independent satellite frames for the same 2024 dates ("model vs satellite" listening) | T1 · VERIFIED (legend availability per layer unchecked) |
| VIIRS Deep Blue `AERDB_L2_VIIRS_SNPP` v2.1; `AERDB_D3_VIIRS_NOAA20` v2/v2.1 (daily 1°) | [Earthdata](https://www.earthdata.nasa.gov/data/catalog/laads-aerdb-d3-viirs-noaa20-2.1); [LAADS](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/AERDB_D3_VIIRS_NOAA20) | Unread | RAW | — | MODIS continuity | T2 · PV |
| CAMS EAC4 reanalysis ([ADS](https://forum.ecmwf.int/t/cams-global-reanalysis-eac4-data-from-september-to-december-2025-now-available-on-the-ads/15099)) | ADS `cams-global-reanalysis-eac4` and `-monthly` | 2003 → Dec 2025, ~80 km | RAW | **CC-BY since 2 Jul 2025** ([ECMWF](https://forum.ecmwf.int/t/cc-by-licence-to-replace-licence-to-use-copernicus-products-on-02-july-2025/13464)) | A different model, independent of GEOS. The earlier catalogue noted CAMS assimilates MODIS AOD | T3 · VERIFIED |
| JAXA Himawari P-Tree aerosol (AOT 500 nm, Ångström exponent) ([user guide](https://www.eorc.jaxa.jp/ptree/userguide.html)) | Registration | 10-min L2; 1-hour, 1-day and 1-month L3; 5 km; 60S–60N, 70E–150W | RAW NetCDF | **Non-profit only; no redistribution** ([terms](https://www.eorc.jaxa.jp/ptree/terms.html)) | Offline checks only | T3 · VERIFIED |
| NOAA HMS smoke polygons ([NESDIS](https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Smoke_Polygons)) | HTTPS directory | Daily | GeoTIFF, KML, Shapefile | n/s | Smoke present/absent mask for North American stories (coverage unconfirmed) | T3 · VERIFIED |

## 5425: the colours describe water at 600 m and deeper, and 5479 supplies flat frames

On SVS 5425, flows shallower than 600 m are drawn **white**. Only flows at 600 m and deeper are coloured, on bars of −3 to 22 °C (beauty), 0 to 25 °C (temperature) and 33 to 36 (salinity). The period is 2021–2023 ([SVS API 5425](https://svs.gsfc.nasa.gov/api/5425)). Comparing these colours with surface SST or SMAP would be scientifically wrong.

ECCO V4r4 ends in 2017, so **Copernicus GLORYS12** at the matching depth is the practical independent check. The ECCO2 source is the ideal same-model check, if a mirror is reachable. **SVS 5479** gives the same model run as separate 4096×2048 equirectangular temperature and salinity frame folders, so pixel-to-coordinate mapping is direct ([SVS API 5479](https://svs.gsfc.nasa.gov/api/5479)).

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| **5479** Ocean currents, equirectangular (for SOS) | [SVS API 5479](https://svs.gsfc.nasa.gov/api/5479) | 2021–2023; released 30 May 2025 | FP-2:1: `frames/4096x2048_2x1_30p/{beauty,temperature,salinity}/`. Only a beauty colorbar is listed; reusing the 5425 bars is an inference to check | SVS-PD | GLORYS12 at ≥600 m | **T1 · VERIFIED** |
| 5505 Perpetual Ocean 2: Equirectangular | [SVS API 5505](https://svs.gsfc.nasa.gov/api/5505) | Released 25 Mar 2024. Text says 2021–23; the dataset entry says 13 Nov 2022–25 Dec 2023 | 7,201 frames at 16384×8192 (more than 7 TB), 9600×3240, 7680×2160; beauty colorbar only | SVS-PD | As 5479 | T1 · VERIFIED |
| 5529 Polar views | [SVS API 5529](https://svs.gsfc.nasa.gov/api/5529) | Released 25 Apr 2025 | F: 5760×3240 and 9600×3240; no colorbar | SVS-PD | — | T1·low · VERIFIED |
| 14745 "An Ocean in Motion" (SIGGRAPH 2025) | Related on [5425](https://svs.gsfc.nasa.gov/api/5425) | n/s | Produced video; not checked | — | — | T1·low · UNVERIFIED |
| [4353](https://svs.gsfc.nasa.gov/api/4353) Aquarius SSS 2011–2015 | SVS | Sep 2011–May 2015 | FP-2:1: `flatmap_4k/`, `flatmap_no_timeCbar_4k/`, Mollweide; colorbar 30–40 PSU | SVS-PD | SMAP or ESA CCI SSS (surface) | T1 · VERIFIED |
| [4332](https://svs.gsfc.nasa.gov/api/4332) Aquarius SST 2011–2015 | SVS | 7 Sep 2011–20 May 2015 | FP-2:1, same layout; colorbar −2 to 45 °C. The credit field wrongly says SSS | SVS-PD | MUR, OISST | T1 · VERIFIED |
| [4814](https://svs.gsfc.nasa.gov/api/4814) Earth Day 2020 SSS; 4234, 4045, 4046, 4050, 4233 (other Aquarius items) | SVS | 2011–2014 | 4814: frames, no colorbar; others not opened | SVS-PD | — | T1·low · VERIFIED / UNVERIFIED |
| GLORYS12, GLOBAL_MULTIYEAR_PHY_001_030, DOI 10.48670/moi-00021 ([CMEMS](https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description)) | Copernicus Marine (free account; `copernicusmarine` toolbox) | 1993 → 2026-09-22, daily and monthly, 1/12°, 50 levels | RAW: temperature, salinity, u/v, SSH, mixed-layer depth | Copernicus Marine licence | **Best independent check of the 5425/5479 deep colours** | T3 · VERIFIED |
| ECCO2 Cube92 (source) | APDRC; data.nas.nasa.gov/ecco ([ecco-support](https://mailman.mit.edu/pipermail/ecco-support/2026-March/000840.html)) | 2021–23 run | RAW | n/s | Same model | T2 · PV |
| ECCO V4r4 monthly temperature/salinity; `ECCO_L4_SSH_05DEG_DAILY_V4R4B` ([PO.DAAC](https://podaac.jpl.nasa.gov/dataset/ECCO_L4_SSH_05DEG_DAILY_V4R4B)) | PO.DAAC | To 2017 | RAW | EOSDIS-open | No overlap with 5425 | T2 · VERIFIED |
| SMAP_JPL_L3_SSS_CAP_8DAY-RUNNINGMEAN_V5, C2208422957-POCLOUD ([Earthdata](https://www.earthdata.nasa.gov/data/catalog/pocloud-smap-jpl-l3-sss-cap-8day-runningmean-v5-5.0)); RSS SMAP L3 8-day V5.3 ([data.gov](https://catalog.data.gov/dataset/rss-smap-level-3-sea-surface-salinity-standard-mapped-image-8-day-running-mean-v5-3-valida)) | PO.DAAC | 8-day running mean; granules seen for 2019 and 2024 | RAW | EOSDIS-open | Surface salinity, for Aquarius-type frames only | T2 · VERIFIED |
| ESA CCI SSS v5.5, Northern Hemisphere monthly ([CEDA](https://catalogue.ceda.ac.uk/uuid/3d3e52e597fe40b0ab5984cc0ee82de3/)); ICDC v2.31, DOI 10.5285/4ce685bff631459fb2a30faa699f3fc5 ([ICDC](https://www.geo.uni-hamburg.de/en/service/icdc/data/ocean/esa-cci-sea-surface-salinity.html)) | CEDA | v5.5 NH: 2010–2023 at 16–90°N (so only the northern Bay of Bengal); v2.31: 2010–2019 | RAW | ESA CCI terms ("Any" use) | Partner surface salinity | T3 · VERIFIED |

## 5533/5518: the Jul–Sep 2024 frames can only be checked against GEOS-CF v1

SVS 5533 covers 1 Jul to 14 Sep 2024. It provides labelled sphere and map frame sets at 5760×3240 (1,800 and 1,801 frames) and a 7680×2160 EIC set of 4,502 frames. The page lists **no colorbar file** ([SVS 5533](https://svs.gsfc.nasa.gov/5533)), so the scale has to be read by OCR from the label band. That makes colorbar recovery riskier than for 5151.

GEOS-CF v2 has **no data before 2025-08-04**. The v1 collection runs from 2018-01-01 to 2026-01-02, and v2 "will not be back-processed" ([GEE v1](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v1_rpl_tavg1hr?authuser=0); [GEE v2](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v2_fcst_htf?hl=zh-cn)). The v2 release date is in conflict: one Earth Engine page says October 2025 and the other says January 2026. This is preserved unresolved.

v1 carries both `PM25_RH35_GCC` (µg m⁻³) and `PM25_RH35_GOCART` (kg m⁻³). That allows a 30-minute regression test of the HYPOTHESIS that the team's 0.313× PM2.5 scale puzzle comes from the frames encoding a different band or averaging.

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| 5518 SOS: Air Quality Model Runs (official alternate) | [search hit](https://svs.gsfc.nasa.gov/5518) | As 5533 | Probably 2:1; not fetched | SVS-PD | GEOS-CF v1 | Official · UNVERIFIED |
| [14439](https://svs.gsfc.nasa.gov/api/14439) Air Pollution Model Runs | SVS | Released 24 Oct 2023 | M: 2048×1024 MP4/MOV/WebM, 720×360 GIF; no frames or colorbar | SVS-PD | GEOS-CF v1 | T1·low · VERIFIED |
| 5151–5154 GEOS-CF PM2.5, O3, CO, NOx (daily) | [SVS API 5151](https://svs.gsfc.nasa.gov/api/5151) | Released 2023-09-26; daily | FP: 2048×1024 2:1 12p; PM2.5 colorbar 528×125 | SVS-PD | **GEOS-CF v2** for recent frames | T1 · VERIFIED (already in Bloop) |
| [5142](https://svs.gsfc.nasa.gov/api/5142) TEMPO NO2 over North America; 5175 additional views; 5566 three cases; [5303](https://svs.gsfc.nasa.gov/5303) data release | SVS | Hourly from 2 Aug 2023 | 5142: eight regional 3840×2160 60p frame sets; no colorbar | SVS-PD | TEMPO L3 | T1·low · VERIFIED (5175, 5566 PV) |
| 4810, 5107, 5104, 5070, 4764, 10977 | In [40529](https://svs.gsfc.nasa.gov/api/40529) and [40483](https://svs.gsfc.nasa.gov/api/40483) | US-focused | Not opened | SVS-PD | — | T1 · UNVERIFIED |
| GEOS-CF v1, GEE `NASA/GEOS-CF/v1/rpl/tavg1hr` | [GEE](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v1_rpl_tavg1hr?authuser=0) | 2018-01-01 → 2026-01-02T11Z, hourly (stamped :30), 0.25° | RAW: PM25 GCC and GOCART, speciated PM, NO/NO2/O3/CO/SO2, column fields, AOD550, met fields | "any purpose without prior permission" | **The only correct target for 5533** | T2 · VERIFIED |
| GEOS-CF v2, GEE `NASA/GEOS-CF/v2/fcst/htf` (also `v2/ana/htf`) | [GEE](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v2_fcst_htf?hl=zh-cn) | 2025-08-04 → 2026-10-26, 15-minute | RAW: CO, NO2, O3, PM25_RH35, SO2 | As above | 5151–5154 only; analyse separately from v1 | T2 · VERIFIED (ana PV) |
| GEOS-CF v2 routes: NCCS datashare, OPeNDAP, CFAPI (by email), **S3 Zarr `smce-geos-cf-public`**, FLUID, CF Map Tool | [GMAO access](https://gmao.gsfc.nasa.gov/gmao-products/geos-cf/data-access_geos-cf) | Latest version | RAW (Zarr; JSON/ASCII/Excel exports) | n/s | — | T2 · VERIFIED (v1 paths on NCCS unconfirmed) |
| TEMPO_NO2_L3_V04, DOI 10.5067/IS-40e/TEMPO/NO2_L3.004 ([ASDC](https://asdc.larc.nasa.gov/project/TEMPO/TEMPO_NO2_L3_V04)); GEE `NASA/TEMPO/NO2_L3_V4` (PV) | ASDC | From 2023-08-02; one file per East–West scan | RAW netCDF-4 (provisional) | EOSDIS | Column NO2 spatial pattern for the North American part of 5533 | T2 · VERIFIED |
| GIBS `AIRS_CO_Total_Column_Day/Night` (from 2013-05-08), `MLS_CO_215hPa`, OMI SO2 layers ([wiki](https://wiki.earthdata.nasa.gov/x/0IXbAQ)) | GIBS | NRT to present | FP via colormap XML | n/s | Satellite CO frames for the same dates | T1 · VERIFIED |
| CAMS EAC4 (see 5572) | ADS | Covers Jul–Sep 2024 | RAW | CC-BY | Independent model | T3 · VERIFIED |
| Sentinel-5P TROPOMI, GEE `COPERNICUS/S5P/OFFL/L3_NO2`; `L3_CO` (PV) | [GEE](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_NO2?authuser=1) | 2018-06-28 → 2026-10-17, ~1.1 km | RAW (includes `absorbing_aerosol_index`) | Copernicus Sentinel terms | Independent satellite; covers Bangladesh | T3 · VERIFIED |
| OpenAQ v3 (`/v3/locations`, per-location licences) ([docs](https://docs.openaq.org/resources/locations)); Bangladesh DoE 16-station network since 19 Nov 2023 ([Daily Star](https://www.thedailystar.net/tech-startup/news/real-time-air-quality-tracking-launched-across-bangladesh-3474436)) | API key (OpenAQ); DoE has no API found | Hourly | RAW points | Varies per location | Ground rung of the independence ladder | T3 · VERIFIED |

Each agreement figure should name its rung on the **independence ladder**, from least to most independent: GEOS-CF v1 or GEOS-FP (same model) → MERRA-2 (same family) → CAMS EAC4 (different model) → TROPOMI and MODIS/VIIRS (independent observations) → ground stations (INTERPRETATION, following project rule §7).

## 5196: the SOS twin 5436 turns camera views into a 2:1 map

SVS 5196 offers only camera views: a globe orbit, US zooms and a 9600×3240 hyperwall set. Several of its frame sets list zero items ([SVS 5196](https://svs.gsfc.nasa.gov/5196)). **SVS 5436**, its Science On A Sphere version, provides 8192×4096 frames, a Globe Viewer 2:1 set, a **CO2 volume layer with no background**, a separate surface layer, **`dyamond_timestamps.txt`**, and the same colorbar, `dyamondCbar_6-27-2024a.png` ([SVS API 5436](https://svs.gsfc.nasa.gov/api/5436)).

The equirectangular layout is very probable (SOS convention) but should be confirmed with Bloop's coastline-IoU check. The colorbar includes opacity transfer functions, so values recovered from the volume render stay **relative**, not column ppm.

DYAMOND is a free-running run for Jan–Mar 2020. It cannot match day-to-day weather, so checks should target spatial patterns and gradients by latitude band (INTERPRETATION).

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| **5436** DYAMOND CO2 for SOS | [SVS API 5436](https://svs.gsfc.nasa.gov/api/5436) | Jan–Mar 2020; released 4 Jul 2025 | FP-2:1 at 8192×4096; timestamp file; volume-only layer | SVS-PD | OCO-2 Lite zonal gradients; GHG Center daily XCO2 pattern | **T1 · VERIFIED** |
| 5333 DYAMOND for Fulldome; [14631](https://svs.gsfc.nasa.gov/api/14631) "Model Behavior" video; 5682 (no title) | SVS | 2020 run | 5333 not fetched; 14631 is a 3840×2160 video with captions | SVS-PD | — | T1·low · PV |
| [5115](https://svs.gsfc.nasa.gov/5115) Global Atmospheric CO2 (2021) | In 40477 | 1 Jan–31 Dec 2021 | Volumetric frames 1920×1920, 4096×1080 timeline, 5760×3240 `GHGVolumetric_EICComposite`; **no colorbar** | SVS-PD | OCO-2 GEOS v10r | T1 · VERIFIED |
| [5110](https://svs.gsfc.nasa.gov/api/5110) CO2 tagged by source (2021); 5273 SOS version | In 40479 | 2021 | Equirectangular global frame set at 1920×1080 (four sources); sphere decals; legend and timeline frames; no colorbar | SVS-PD | ODIAC; GHG Center | T1 · VERIFIED (5273 PV) |
| [4514](https://svs.gsfc.nasa.gov/4514) CO2 from GMAO with assimilated OCO-2 | SVS | 1 Aug 2014–23 Aug 2015 | FP: `final_no_dates` and `final_with_labels` at 3840×2160, 2,851 frames each; `cbar_improved.png` 1218×288 | SVS-PD | OCO-2 Lite V11.2r | T1 · VERIFIED |
| 4949 Global CO2 2020–2021 and 4983 (its hyperwall version); 5234 AIRS CO2 2002–Oct 2023; 5119/5194 OCO-2 + Keeling; 5022 OCO-2 gridded CO2; 5116/5118 CH4; 5117 N2O; 5121 ODIAC; 5081; 5047; 5126 AGGI | Related on [5115](https://svs.gsfc.nasa.gov/5115); 40477/40479 | Various | Not opened (4949 redirect loop) | SVS-PD | GHG Center STAC | T1 · UNVERIFIED |
| OCO2_L2_Lite_FP V11.2r, DOI 10.5067/70K2B2W8MNGY; C2912085112-GES_DISC (PV) | [data.nasa.gov](https://data.nasa.gov/dataset/oco-2-level-2-bias-corrected-xco2-and-other-select-fields-from-the-full-physics-retrieval--bbaa9) | 2014-06-01 → 2026-06-03, daily files | RAW (sparse soundings) | USG | Observational latitude-band gradients | T2 · VERIFIED (ID PV) |
| GHG Center `oco2geos-co2-daygrid-v10r` | [STAC](https://earth.gov/ghgcenter/api/stac/collections/oco2geos-co2-daygrid-v10r) | 2015-01-01 → 2022-02-28, daily, 0.5°×0.625° | RAW COG (`xco2`, `xco2prec`); render colormap magma, rescale 412–422 | **CC0-1.0** | Gridded pattern test for 5196/5436 and 5115 | T2 · VERIFIED |
| OCO2_GEOS_L3CO2_DAY v10r (the GES DISC counterpart) | [data.gov](https://catalog.data.gov/dataset/oco-2-geos-level-3-daily-0-5x0-625-assimilated-co2-v10r-oco2-geos-l3co2-day-at-ges-disc-2b85f) | Daily | RAW | USG | Same as above | T2 · VERIFIED |
| NOAA GML Mauna Loa CO2 (`co2_daily_mlo.txt`, weekly, monthly, annual, growth rate) | [GML](https://gml.noaa.gov/ccgg/trends/data.html) | Daily | RAW txt/csv | Credit Lan (NOAA) and Keeling (Scripps) | Background level | T3 · VERIFIED |
| GOSAT/GOSAT-2 (NIES GDAS) | [NIES](https://data2.gosat.nies.go.jp/index_en.html) | Monthly L2 maps; L4B animations | Gallery images plus RAW | Registration; data policy | Partner-adjacent CO2/CH4 | T3 · VERIFIED (route) |

## 5011: a movie-only visual over a V2/V3 record that ended on 16 Nov 2023

SVS 5011 lists **"Quality Controlled LIS on ISS Science Data V1"** as its source and uses a 10-day roving window from Jan 2017 to Jul 2023. It provides only movies, including a 7680×2160 EIC wall version and a 4096×2048 SOS movie, with **no frame folders and no colorbar** ([SVS API 5011](https://svs.gsfc.nasa.gov/api/5011)). The SOS movie is described as starting in Mar 2017 rather than Jan 2017. Its only linked item is **14802, a National Symphony Orchestra concert**, which is prior art for musical use.

The current record is V2 and a reprocessed V3, both running from 2017-03-01 to 2023-11-16. The GHRC near-real-time plots show a **60–90°E gap** caused by communications drop-outs ([GHRC LANCE](https://lance.nsstc.nasa.gov/iss-lis/index.html)). That gap sits next to Bangladesh and could partly explain the weak 0.59 correlation per region (HYPOTHESIS: check whether the QC data share the gap). Comparing against flash rates normalised by view time is scientifically sounder than raw counts.

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| [3144](https://svs.gsfc.nasa.gov/api/3144) Global Lightning Flash Rate Density (WMS) | SVS | OTD 1995–1999 plus TRMM LIS 1998–Dec 2002 | **FP-2:1: 720×360 at 0.5°**; `lightdens_bar.png` from <10 to >100 flashes/km²/yr | SVS-PD | **LIS/OTD HRFC on the identical 0.5° grid** | **T1 · VERIFIED** |
| 3143 Global Lightning Accumulation (WMS); 186–189 TRMM 1998 daily, monthly and cumulative | [archived keyword list](https://webarchive.library.unt.edu/web/20090814024514/http://svs.gsfc.nasa.gov/search/Keyword/Lightning.html); [186](https://svs.gsfc.nasa.gov/186) | 1998 | 186: movies up to 960×540, no colorbar | SVS-PD | TRMM LIS V4 | T1·low · PV |
| ISS LIS V2, DOI 10.5067/LIS/ISSLIS/DATA111, **C2303212754-GHRC_DAAC** | [data.gov](https://catalog.data.gov/dataset/quality-controlled-lightning-imaging-sensor-lis-on-international-space-station-iss-science) | 2017-03-01 → 2023-11-16, ±55° | RAW HDF-4/netCDF-4 plus GIF browse | USG | Compare only Mar 2017–Jul 2023 | T2 · VERIFIED |
| ISS LIS V3 (`ghrc-daac-isslis-v3-fin-3`); Backgrounds V2 | [Earthdata](https://www.earthdata.nasa.gov/data/catalog/ghrc-daac-isslis-v3-fin-3); [data.gov](https://catalog-beta.data.gov/dataset/quality-controlled-lightning-imaging-sensor-lis-on-international-space-station-iss-backgro) | Same | RAW | USG | Preferred, once the V3 DOI is known | T2 · PV |
| NRT ISS LIS V2, DOI 10.5067/LIS/ISSLIS/DATA109 | [DOI](https://dx.doi.org/10.5067/LIS/ISSLIS/DATA109) | 4 Oct 2021 – 16 Nov 2023, **retired** | — | — | Do not use | T2 · VERIFIED |
| TRMM LIS V4, DOI 10.5067/LIS/LIS/DATA201, **C1983762329-GHRC_DAAC** | [data.gov](https://catalog.data.gov/dataset/lightning-imaging-sensor-lis-on-trmm-science-data-v4) | 1998-01-01 → 2015-04-08, ±40° | RAW | USG | Long climatology | T2 · VERIFIED |
| LIS/OTD HRFC V2.3.2015, DOI 10.5067/LIS/LIS-OTD/DATA302 (one link says DATA311), **C1995863244-GHRC_DAAC** | [data.gov](https://catalog.data.gov/dataset/lis-otd-0-5-degree-high-resolution-full-climatology-hrfc-v2-3-2015) | 1995-05-04 → 2014-12-31, 0.5° | RAW HDF/netCDF-4 | USG | Pairs with 3144 | T2 · VERIFIED |
| LRACTS, DOI 10.5067/LIS/LIS-OTD/DATA306, **C1995863430-GHRC_DAAC**; LRFC; plus the HRAC, HRMC, HRSC, LRDC, LRAC, LRADC, LRTS and LRMTS family | [data.gov](https://catalog.data.gov/dataset/lis-otd-2-5-degree-low-resolution-annual-climatology-time-series-lracts-v2-3-2015); [GHRC doc](https://ghrc.nsstc.nasa.gov/pub/lis/climatology/LIS-OTD/HRAC/doc/LISOTD_climatology_dataset.pdf) | 2.5° products; LRACTS **ships an MP4 animation** | RAW (+M) | USG | Seasonal and diurnal sonification | T2 · VERIFIED |
| GIBS TRMM LIS layers: "Lightning Flashes (Raw)", "Flash Rate", "Monthly Mean" | [AmeriGEOSS](https://data.amerigeoss.org/dataset/lightning-flash-rate-monthly-mean-lis-trmm-from-nasa-gibs2) | n/s | FP via GIBS (layer IDs not given) | n/s | TRMM LIS | T1 · PV |
| NOAA GOES-R GLM L2 (LCFA), DOI 10.7289/V5KH0KK6 | [data.gov](https://catalog.data.gov/dataset/noaa-goes-r-series-geostationary-lightning-mapper-glm-level-2-lightning-detection-events-g); AWS `noaa-goes16..19` | 20-second files | RAW | CC0 1.0 | Americas only; does not reach Bangladesh (INFERRED from geometry) | T3 · VERIFIED |
| EUMETSAT MTG Lightning Imager (LFL, LGR, AF/AFA/AFR) | [EGUsphere preprint](https://egusphere.copernicus.org/preprints/2026/egusphere-2026-3386/egusphere-2026-3386-manuscript-version4.pdf) | NRT since 31 Oct 2024 | RAW | Open on the EUMETSAT Data Store | Europe and Africa; Bangladesh very likely out of view (INFERENCE) | T3 · VERIFIED |
| CMA FY-4 LMI (FY-4A and FY-4C, 7.8 km) | [NSMC](https://nsmc.org.cn/nsmc/en/instrument/LMI.html) | FY-4A views China in spring and autumn | RAW | Openness unverified | The only geostationary imager near South Asia | T3 · PV |

The Bangladesh science hook is a 1998–2014 TRMM LIS climatology. It puts **69.2% of flashes in the pre-monsoon season**, with a maximum near 72 fl/km²/yr in the north and northeast ([Curtin espace](https://espace.curtin.edu.au/handle/20.500.11937/63056)). BMD runs 8 sensors, but no public data portal was found ([Daily Star 2018](https://www.thedailystar.net/country/bangladesh-first-lightning-strikes-forecast-system-soon-1575778)).

## 4960: frames and colorbar exist, and 5650 replaces 4285 for rain

SVS 4960 is frame-ready. It has 3840×2160, 9600×3240 and 7680×2160 sets, the colorbar `atmo_rivers_cbars01.png` and a date-only overlay frame set. It gives **no date range** for its MERRA-2 data and lists no related items ([SVS API 4960](https://svs.gsfc.nasa.gov/api/4960)). Siblings found by search add IMERG rain, and one of them, 4939, is not MERRA-2 at all.

**SVS 5650**, released 5 Jun 2026, is a newer IMERG near-real-time item with flat 3600×1800 alpha frames. It is not in the Daily gallery as of its 10 Aug update, which still lists 4285 ([SVS 5650](https://svs.gsfc.nasa.gov/5650/)).

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| **5650** NRT Global Precipitation (GPM) | [SVS 5650](https://svs.gsfc.nasa.gov/5650/) | "Most currently available"; updated 24 Aug 2026 | FP-2:1: 2048×1024 annotated_flat, Robinson, composite (~900 frames each); 3600×1800 flat_alpha; rain and snow colorbars, white and black, 440×90 | SVS-PD | IMERG Early/Late V07 | **T1 · VERIFIED** |
| [4372](https://svs.gsfc.nasa.gov/4372) IMERG global rates (new colorbar) | SVS | Jun–Sep 2015; 5,858 frames per set | FP-2:1: 3600×1800 `numbers_with_alpha/`, `dates_with_alpha/` | SVS-PD | IMERG Final V07 | T1 · VERIFIED |
| [4445](https://svs.gsfc.nasa.gov/4445) El Niño atmospheric river, Jan 2016 | SVS | Jan 2016 | FP (rain): 1920×1080 and 3840×2160; `rainbarblack3.png`, `snowbarblack2.png` | SVS-PD | IMERG; MERRA-2 water vapour | T1 · VERIFIED |
| [4417](https://svs.gsfc.nasa.gov/4417) 2014–2015 atmospheric river | SVS | 1 Oct 2014–31 Mar 2015 | F: zoomIn and globalView, 4,369 frames at 1920×1080; no colorbar | SVS-PD | MERRA, IMERG | T1·low · VERIFIED |
| [4939](https://svs.gsfc.nasa.gov/api/4939) 3D water vapour atmospheric river | SVS | 25–28 Jan 2021 | Frame folders listed with 0 items; `TPW_colorbar.tif` | SVS-PD | **NOAA-20/S-NPP ATMS MiRS, not MERRA-2** | T1·low · VERIFIED |
| [5180](https://svs.gsfc.nasa.gov/api/5180) Worldview Tour: atmospheric rivers; 4334, 4416, 4555, 4547, 1016; GMAO July 2018 atmospheric-river video ([GMAO](https://gmao.gsfc.nasa.gov/gmao-products/merra-2/videos_merra-2)) | SVS; GMAO | Various | 5180 is a .mov screen capture; others not fetched | SVS-PD | — | T1·low · PV/UNVERIFIED |
| MERRA-2 M2I1NXINT, DOI 10.5067/G0U6NGQ3BLE0, **C1276812821-GES_DISC** | [data.nasa.gov](https://data.nasa.gov/dataset/merra-2-inst1-2d-int-nx-2d1-hourlyinstantaneoussingle-levelassimilationvertically-integrat-87cc2) | 1980 → ~3 weeks ago, hourly, 0.625°×0.5° | RAW (total precipitable water vapour, ice, liquid) | USG | Same-model water-vapour channel | T2 · VERIFIED |
| MERRA-2 M2T1NXINT (hourly time-averaged); monthly tavgM_2d_int_Nx and instM_2d_int_Nx | [Earthdata](https://earthdata.nasa.gov/data/catalog/ges-disc-m2t1nxint-5.12.4); [forum](https://forum.earthdata.nasa.gov/viewtopic.php?p=23558) | Hourly; monthly | RAW. IVT = √(UFLXQV²+VFLXQV²), but whether the **hourly** file carries UFLXQV/VFLXQV is unconfirmed | USG | IVT magnitude | T2 · PV |
| IMERG V07 Early (GPM_3IMERGHHE), DOI 10.5067/GPM/IMERG/3B-HH-E/07, C2723758340-GES_DISC; Final (GPM_3IMERGHH), DOI 10.5067/GPM/IMERG/3B-HH/07, C2723754847-GES_DISC (inferred); Late (GPM_3IMERGHHL) | [Early](https://data.nasa.gov/dataset/gpm-imerg-early-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghhe-at--e91fc); [Final](https://data.nasa.gov/dataset/gpm-imerg-final-precipitation-l3-half-hourly-0-1-degree-x-0-1-degree-v07-gpm-3imerghh-at-g-fb698) | Early ~4 h latency; Final Jun 2000 → ~4 months latency | RAW | USG | 5650, 4372, 4445 | T2 · VERIFIED (Late DOI unread) |
| AIRS3STD V7.0 (`TotH2OVap_MW_A`) | [Earthdata](https://www.earthdata.nasa.gov/es/data/catalog/ges-disc-airs3std-7.0?page=2%2C0) | Daily, 1° | RAW | EOSDIS-open | Independent water-vapour observation | T2 · VERIFIED |
| Atmospheric-river catalogues: UCLA Dataverse (Guan & Waliser), ARTMIP Tier 1, ERA5 AR catalogue (PANGAEA 10.1594/PANGAEA.957161) | [UCLA](https://dataverse.ucla.edu/dataverse/ar); [ARTMIP](https://ckanprod.data-commons.k8s.ucar.edu/dataset/b78ab7aa-3b7f-40ac-bbaf-7901a9108b5b); [PANGAEA](https://doi.pangaea.de/10.1594/PANGAEA.957161) | Event catalogues | RAW | n/s | "Is this an atmospheric river?" label check | T3 · PV |
| ERA5 hourly single levels, DOI 10.24381/cds.adbb2d47 | [CDS](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) | 1940 → ~5 days ago, 0.25° | RAW (IVT variable names unconfirmed) | **CC-BY** | Second reanalysis; partly independent | T3 · VERIFIED |
| JAXA GSMaP v8, GEE `JAXA/GPM_L3/GSMaP/v8/operational`, DOI 10.57746/EO.01gs73bkt358gfpy92y2qns5e9 | [GEE](https://developers.google.com/earth-engine/datasets/catalog/JAXA_GPM_L3_GSMaP_v8_operational?authuser=2) | 1998-01-01 → 2026-10-26, hourly, 0.1° | RAW (`hourlyPrecipRate`, gauge-corrected band) | Acknowledge JAXA; cite papers | Partner rain duet; shares GPM inputs | T3 · VERIFIED |
| ISRO INSAT-3DS (MOSDAC): HEM, IMC, IMR rainfall, GPI, UTH, TPW | [MOSDAC PDF](https://mosdac.gov.in/docs/INSAT-3DS_Operational_Products_V1.pdf) | Operational | RAW | Terms unread | Partner rain and water vapour over South Asia | T3 · PV |

## 4950: the source is GEDI L2B RH100 with three possible colorbars

SVS 4950 is built from **"Relative Height [GEDI]" (SVS dataset 1131), derived from the L2B RH100 product**. No L3 or gridded product is listed. It comes in **three colorbar versions: 0–40 m, 0–50 m and 0–75 m**. Heights are exaggerated in 3D. The global view uses April 2019 to April 2020, though other text on the page says April 2018 to April 2019 ([SVS 4950](https://svs.gsfc.nasa.gov/4950)).

The team's median of 31.2 m against 5.7 m for all GEDI L3 land cells is therefore best explained in this order (INTERPRETATION):

1. A colorbar mismatch, worth up to ×1.9.
2. Forest-biased sampling of coloured pixels compared with all land cells.
3. 3D shading.
4. Period differences.

The first experiment is to identify the embedded colorbar. Then re-decode only flat pixels and compare against L2B RH100 footprints gridded to the frame for the same year.

| Candidate | Access | Period · cadence | Format | Licence | Validation pairing | Tier · status |
|---|---|---|---|---|---|---|
| [5095](https://svs.gsfc.nasa.gov/5095) USFS/GEDI Old Growth Forest | SVS | Released 20 Apr 2023; updated 23 Jun 2025; same dataset 1131 | 3840×2160 sets including "noLegend" variants, but all list 0 items; no numeric colorbar | SVS-PD | L2B RH100; USFS FIA | T1·low · VERIFIED |
| [14804](https://svs.gsfc.nasa.gov/14804) Global Biomass, GEDI and ICESat-2 | SVS | Released 27 Mar 2025 | M: 4K and 1080p, global and polar; no frames | SVS-PD | GEDI L4B | T1·low · VERIFIED |
| 13114 GEDI overview | [captions file](https://svs.gsfc.nasa.gov/vis/a010000/a013100/a013114/13114_GEDI_overview-captions.en_US.srt) | n/s | Video | SVS-PD | — | T1·low · PV |
| GEDI L2B footprints (GEDI02_B) and L2A (GEDI02_A) | LP DAAC | Mission from Apr 2019 | RAW HDF5 footprints | EOSDIS | **The correct pair for 4950** | T2 · UNVERIFIED (the DOIs 10.5067/GEDI/GEDI02_B.002 and GEDI02_A.002 are prior knowledge) |
| GEDI L4B gridded aboveground biomass v2.1, DOI **10.3334/ORNLDAAC/2299**; GEE `LARSE/GEDI/GEDI04_B_002` (v2, search-listed) | [ORNL DAAC](https://daac.ornl.gov/cgi-bin/dsviewer.pl?ds_id=2299); [GEE](https://developers.google.com/earth-engine/datasets/catalog/LARSE_GEDI_GEDI04_B_002) | Gridded | RAW | EOSDIS | Pairs with 14804 | T2 · VERIFIED (GEE PV) |
| CMS global mangrove canopy height and biomass (TanDEM-X + GEDI) | [ORNL guide](https://daac.ornl.gov/CMS/guides/CMS_Global_Mangrove_Forest_Ht.html) (read 12 Oct) | 2015; 12 m | RAW | EOSDIS | Sundarbans at the low end of the 0–40 m bar (HYPOTHESIS) | T2 · VERIFIED (DOI unread) |
| NISAR L-band (NASA–ISRO) | [ASF](https://hyp3-docs.asf.alaska.edu/nisar-docs/availability-overview/) | Provisional L0–L3 since 20 Jul 2026, for acquisitions from 17 Jun 2026; **permanent gap 27 Jul–10 Aug 2026**; S-band on ISRO Bhoonidhi | RAW SAR; no forest product | n/s | Future-potential mention only | T2/T3 · VERIFIED |
| ESA BIOMASS (P-band) Level-1a | [ESA MAAP](https://catalog.maap.eo.esa.int/catalogue/series/eo:organisationName/ESA@ESRIN/BiomassLevel1a) | Entries from 2025 to Apr 2026 | RAW SAR. An "open to all" claim comes only from an aggregator | n/s | Context only, unless a gridded biomass or height map is confirmed | T3 · PV |

The global GEDI L3 IDs (ORNL ds 1865/1952), ICESat-2 ATL08/ATL18, ESA CCI Biomass, ESA WorldCover, the JAXA PALSAR-2 forest/non-forest map and the GLAD, ETH and Meta canopy-height maps all remain UNVERIFIED.

## Nine focus areas, uneven depth: sea level and greenhouse gases are deep, energy is thin

The 2024 statement asked teams to connect the **nine EIC focus areas** (internal doc, Tier C). Mapping the EIC tree onto those themes shows where NASA has ready material to add and where Bloop would have to bring its own. Energy has no dashboard. The only EIC proxy found is night lights (5313/5276) ([SVS API 40467](https://svs.gsfc.nasa.gov/api/40467)).

| Focus area | Candidate NASA visuals (gallery) | Frame pairing | Raw or companion data | Tier · status |
|---|---|---|---|---|
| Sea level | 5235 Porthole (40473); [5221](https://svs.gsfc.nasa.gov/api/5221) GMSL 1993–2023 (3840×2160 frames, a graph, no colorbar); [5611](https://svs.gsfc.nasa.gov/5611) GMSL 1993–2025 (30 Jan 2026; MP4/PNG; square 2160² version; date range on the page is inconsistent); [5516](https://svs.gsfc.nasa.gov/5516), [5312](https://svs.gsfc.nasa.gov/5312), [4853](https://svs.gsfc.nasa.gov/4853/), [4345](https://svs.gsfc.nasa.gov/vis/a000000/a004300/a004345/frames/1920x1080_16x9_60p/SLR_3dGlobe/) (3D globe frames); 14713 video | G: series-value sonification, not pixel inversion | Zenodo 7702315 (cited on 5611); MEaSUREs SSHA V2205 (5-day, 1/6°) ([PO.DAAC](https://podaac.jpl.nasa.gov/dataset/SEA_SURFACE_HEIGHT_ALT_GRIDS_L4_2SATS_5DAY_6THDEG_V_JPL2205)); SWOT L2 LR SSH D C3233945000-POCLOUD, D Basic C3233942270-POCLOUD, 2.0 Basic C2799465428-POCLOUD ([CMR](https://cmr.earthdata.nasa.gov/virtual-directory/collections/C3233945000-POCLOUD/spatial/4/443)); earth.gov/sealevel; sealevel.nasa.gov tools ([index](https://sealevel.nasa.gov/data/tools)) | T1 (5235, 5221, 5611) · VERIFIED (5235 frames unverified); T2 · VERIFIED |
| Wildfires | **4993 Dixie Fire** (EIC beauty piece); 5453 US burned area (40531); 5113 VIIRS fires; 5315 fire weather; 5557/5639; [5597](https://svs.gsfc.nasa.gov/5597), [5601](https://svs.gsfc.nasa.gov/5601); 14606 video | 5557 has frames with a burned-in scale; others unverified | FIRMS (already held); FEDS OGC API; NOAA HMS; ESA CCI Fire and the Sentinel-3 World Fire Atlas (on the 2024 list) | T1 · VERIFIED in tree / frames UNVERIFIED |
| Agriculture and water | 5087 water-cycle extremes; 5098 root-zone wetness vs groundwater; 4889 basin water storage; 4968 Iowa cropland; 5544 NDVI NRT; 4170 GPM constellation; 10480 GRACE; 13417 Landsat croplands | Unverified | GRACE, MODIS NDVI (already held); JAXA Earth API NDVI and soil moisture | T1 · UNVERIFIED frames |
| Biodiversity | 4950 (already listed); **5075 NRT global biosphere** (40476); 14700 and 14507 videos; 5095 | Unverified | GEDI L2B/L4B | T1 · UNVERIFIED frames |
| Greenhouse gases | 5115, 5116, 5117, 5118, 5047, 5110, 5121, 5126, 5081, 5119, 5273; media groups 33547/33600; 5041 (on the earth.gov GHG theme page) ([earth.gov](https://earth.gov/themes/greenhouse-gases)) | 5115 and 5110: frames, no colorbar | GHG Center STAC (below) | T1 · VERIFIED (5115, 5110) |
| Climate vital signs | 5190 Climate Spiral; 5191 graph; 5207; 5209 zonal; 5111 ocean heat (Spilhaus); 5382 Arctic minimum 2024; 5099; 5057 | Mostly graphs or spirals (INFERENCE) | GISTEMP (already held); NSIDC | T1 · UNVERIFIED frames |
| Air quality | 5151–5154, 5175, 5142, 5104, 5070, 4764, 10977, 4810, 5107 | 5151 FP | GEOS-CF v1/v2, TEMPO, TROPOMI | T1 · mixed |
| Energy | 5313 and 5276 night lights only | Sign only | Black Marble | — |
| Disasters | "Disasters" dashboard (earth.gov package, no SVS gallery); 5584 landslide exposure; 5072 hurricane plots; 40487 hurricanes video; 5468 2024 Atlantic hurricane season; 4658 and 12616 Black Marble Puerto Rico | 5584 has frames but no numeric bar (earlier catalogue) | NASA Disasters ArcGIS services | T1 · PV |

## GIBS colormap XML is the only machine-readable colorbar in reach

The cross-cutting catalogues differ in one way that matters to Bloop: whether colour can be turned back into value without OCR. **GIBS** publishes a value-per-colour XML for each layer, plus SVG and PNG legends, on time-enabled WMTS and WMS ([GIBS docs](https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/)). Worldview layers are already embedded in three EIC dashboards. **NEO was decommissioned in September 2026**, and NASA points its users to Earth Observatory Global Maps, Worldview, Giovanni, AppEEARS and GIBS ([NASA NEO](https://science.nasa.gov/earth/nasa-earth-observations-neo/)). A 2026 list that once would have named NEO will more probably name one of those (INFERENCE).

| Catalogue | Access route | Content | Pairing | Licence | Tier · status |
|---|---|---|---|---|---|
| **GIBS / Worldview** | Colormaps `https://gibs.earthdata.nasa.gov/colormaps/v1.3/<Layer>.xml`; legends `.../legends/<Layer>_H.png\|_H.svg\|_V.svg`; WMTS `.../wmts/epsg4326/best/wmts.cgi?TIME=YYYY-MM-DD`; vector `GetLegendGraphic` ([docs](https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/)) | All Worldview layers, including those embedded in [40509](https://svs.gsfc.nasa.gov/api/40509), [40529](https://svs.gsfc.nasa.gov/api/40529) and [40531](https://svs.gsfc.nasa.gov/api/40531) | FP with an exact value table | Not stated on the docs page | **T1 · VERIFIED** (most layer IDs unchecked) |
| **VEDA** | STAC `https://openveda.cloud/api/stac`; raster `/api/raster/docs`; features `/api/features/docs`; `tilejson.json` per item; time-stepping goes through STAC (XYZ/WMTS do not support time series) ([VEDA docs](https://docs.openveda.cloud/user-guide/data-services/apis/index.html)) | COG collections | RAW and rendered tiles | "© CC-By NASA" | T2 · VERIFIED |
| **US GHG Center** (earth.gov) | STAC `https://earth.gov/ghgcenter/api/stac/`; raster `/api/raster/docs`; built on veda-backend; beta ([API docs](https://us-ghg-center.github.io/ghgc-docs/services/apis.html)) | `oco2geos-co2-daygrid-v10r` VERIFIED. **Unconfirmed IDs**: odiac-ffco2-monthgrid-v2024, emit-ch4plume-v2, goes-ch4plume-v1, gra2pes-ghg-monthgrid-v1, micasa-carbonflux-daygrid-v1, lpjeosim-wetlandch4-grid-v1, ct-ch4-monthgrid-v2025, epa-ch4emission-grid-v2express, vulcan-ffco2-yeargrid-v4, eccodarwin-co2flux-monthgrid-v5, sedac-popdensity-yeargrid5yr-v4.11 | RAW COG; second decoding path for 5115/5116/5121 | "© CC-By US GHG Center"; item-level CC0 seen | T2 · PV |
| **earth.gov** | Hyperwall package (Earth Now, Wild Fires, Disasters, Air Quality, Earth Portraits, Stakeholder Shorts), obtained via hq-eic@mail.nasa.gov ([package](https://earth.gov/visit/package/hyperwall); [NISE Net](https://www.nisenet.org/sites/default/files/catalog/uploads/10-7-25_-_diy_nasa_exhibits_master_slides.pdf)); theme pages; /sealevel; Mobile Climate Mapper; Hometown Dashboard ([Smithsonian page](https://earth.gov/visit/exhibit/smithsonian-museum)) | Packaged EIC content | Frames on request only | earth.gov terms of service; no CC licence | T1 · VERIFIED |
| **Earth Observatory Global Maps** | [Global Maps](https://science.nasa.gov/earth/earth-observatory/global-maps/) | 26 monthly entries: 15 single variables (AOD, CO, chlorophyll, fire, LST, SST, rainfall, vegetation and others) and 11 pairs (Fire & CO, SST anomaly & rainfall, and others); updated 17 Nov 2025 | Frames and colorbars **unknown**; the pairs suit two-voice sonification | Not stated | T1 · PV |
| **NOAA Science On a Sphere** | [SOS catalog](https://sos-data.woc.noaa.gov/catalog/datasets/) | About 500 datasets (44 pages of 12) in 7 categories, with keyword filters for sea level rise, biodiversity, energy and forest fire; SVS makes SOS versions of EIC items | 2:1 globe imagery by design; download form unverified | "free for public use… intended for educational use only"; partner restrictions per dataset | T3 · VERIFIED |
| **Copernicus Climate Pulse** | [C3S](https://climate.copernicus.eu/climate-pulse-tool-take-temperature-our-planet-glance) | ERA5 daily air temperature and SST, absolute and anomaly (vs 1991–2020); maps from 1979, series from 1940; ~2-day latency | CSV plus image per graphic | Not stated on the page | T3 · VERIFIED |
| Data Pathfinders, Images of Change, Earthdata Ocean topic | Named on the 2024 and 2025 lists (internal doc, Tier C) | Generic NASA entry points | — | — | T2 · PV |

## Sonification precedents are video-only and mostly astronomical

NASA's sonification corpus offers documented mappings, not reusable audio. Chandra's "A Universe of Sound" indexes **44 sonifications** at `chandra.harvard.edu/sound/<slug>.html`, with per-layer MP4s and no licence on the index page ([Chandra index](https://chandra.harvard.edu/sound/index.html)). Its Galactic Center page states the grammar Bloop can cite as compatible with its own: a left-to-right scan, height → pitch, intensity → volume, and one instrument per telescope ([Galactic Center](https://chandra.harvard.edu/sound/gcenter.html)).

The closest Earth analogues have no public data mapping or audio stems: the EIC's Air Quality Orchestra, SYSTEM Sounds' Earth Day piece, the JPL Sound Wall, and the NSO concert linked from 5011.

| Reference | What it is | Access · format | Licence | Use for Bloop | Tier · status |
|---|---|---|---|---|---|
| Chandra "A Universe of Sound" (44 items, plus Space Jam code activity, Sonification Symphony, SN1987A p5 app) | [Index](https://chandra.harvard.edu/sound/index.html); [sonify7](https://chandra.si.edu/photo/2023/sonify7/); [sonify9](https://chandra.harvard.edu/photo/2024/sonify9/) | Per-layer MP4 | Not stated | Mapping precedent; citation only | T1 · VERIFIED |
| Arcand et al., "A Universe of Sound" pipeline and audience study | [arXiv 2403.18082](https://arxiv.org/pdf/2403.18082); [Frontiers 2024](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1288896/full) | Paper | — | Evaluation design | — · VERIFIED |
| SYSTEM Sounds "NASA's View of Earth, in Music" (for the 50th Earth Day) | [SYSTEM Sounds](https://www.system-sounds.com/earth-day) | YouTube/Instagram | n/s | Each mission is a note; pitch = number of data collections; instrument families = Earth spheres; drone = global temperature map | T1 · VERIFIED |
| JPL Sound Wall (SXSW 2025, ocean currents and temperature) | [SYSTEM Sounds NASA](https://www.system-sounds.com/nasa/) | Installation | — | Closest Earth/ocean exhibit; no mapping published | — · VERIFIED |
| 14802 "Earth to Space" NSO concert | Linked from [5011](https://svs.gsfc.nasa.gov/api/5011) | Product page | — | Prior art: 5011 has already been used musically | T1 · VERIFIED |
| EIC "Air Quality Orchestra" touchscreen app | [FDLP slides](https://fdlp.gov/sites/default/files/training/20260827-wn-nasa-earth-exhibits-programming-libraries-slides.pdf) | No public page | — | The most direct official precedent; check whether it is named on 13 Nov | T1 · PV |
| ESA Swarm "Sound of Earth's magnetic flip" and related releases | [ESA](https://esa.int/ESA_Multimedia/Videos/2024/10/Sound_of_Earth_s_magnetic_flip_41_000_years_ago) | MP4 (1:20) | **"No ESA licences available"**; no modification | Cite and link only | T3 · VERIFIED |
| STRAUSS v1.0.3 (spatialisation, TTS captions) | [PyPI](https://pypi.org/project/strauss/); [JOSS](https://www.theoj.org/joss-papers/joss.07875/10.21105.joss.07875.pdf) | Python | MIT | Citable engine or comparator | — · VERIFIED |
| Astronify 0.11 (STScI) | [PyPI](https://pypi.org/project/astronify) | Python, time series only | BSD-3 | 1-D series (CO2, GMSL) | — · VERIFIED |
| Prior Space Apps sound challenges: 2013 "Listening to the Stars", 2014/2015 "Space-y Sounds", 2020 "Space Sounds", 2023 "Immersed in the Sounds of Space" | [2013](https://2013.spaceappschallenge.org/challenge/listening-to-the-stars); [2014](https://2014.spaceappschallenge.org/challenge/can-you-hear-me-now-space-y-sounds/); [2023 nominee write-up](https://jerry1249756.github.io/projects/3_project) | Resource lists not retrieved. The internal doc records the 2023 list (Tier C): NASA "From Space to Sound", Hubble fly-throughs, EO-1 Hyperion, MRO CRISM, WISE, and ESA's magnetic-field sound | — | Possible re-listing of "From Space to Sound" | — · PV |

## Partners: JAXA and ESA have open routes; most others are unchecked

The 2026 partner list, as reprinted from NASA's announcement, has **17 agencies**: Angola, Bahrain, AEB (Brazil), CSA, ESA, ISRO, ASI, JAXA, KASA, MBRSC, CONAE, NASRDA, Paraguay, Senegal, the Spanish Space Agency, the Turkish Space Agency and UKSA. **CNES and KARI are absent** ([Astrobiology.com](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/)). The official partner page is robots-blocked for the fetch tool.

Past Earth-themed lists filled partner slots mostly with CSA and ESA (internal doc, Tier C), so CSA and ESA items are the likeliest partner additions (INFERENCE). For Bangladesh, coverage matters as much as openness:

- **No Bangladesh coverage:** TEMPO (North America), NOAA HMS, GOES GLM and very probably MTG-LI.
- **Edge of view:** Himawari's disk reaches only 70°E, so Bangladesh sits near its western limb with large viewing angles ([P-Tree guide](https://www.eorc.jaxa.jp/ptree/userguide.html)).

| Agency | Route and products | Pairing | Licence | Tier · status |
|---|---|---|---|---|
| **JAXA** (partner) | Earth API: more than 100 COG datasets with STAC metadata (GSMaP, GCOM-C LST, NDVI, SST, chlorophyll-a, GCOM-W soil moisture and sea ice, ALOS DSM); Python v0.1.6 and JS v2.0.1 ([JAXA Earth API](https://data.earth.jaxa.jp/en)); GSMaP v8 on GEE; Himawari P-Tree | RAW COG that renders easily to frame plus colorbar; no colorbars mentioned | "No restrictions" on registration, keys or usage count; licence per dataset in STAC; **P-Tree: no redistribution** | T3 · VERIFIED |
| **ESA** (partner) | CCI Open Data Portal: 27 ECVs via OPeNDAP, WMS, WCS, HTTPS and FTP ([ESA Climate Office](https://climate.esa.int/en/data/aboutdata)); CCI SST v3.0, CCI SSS, CCI Fire; BIOMASS L1a on MAAP; Swarm sounds; the "Climate from Space" app (unverified) | WMS legends **inferred, not verified** | CCI SST CC BY 4.0; CCI licence text at [EDS](https://eds.hub.copernicus.eu/licences/cci) not read | T3 · VERIFIED (routes) |
| **CSA** (partner) | 36,500 RADARSAT-1 images free via NRCan EODMS; open-data hub asc-csa.gc.ca/opendata; RCM ([GoC](https://www.canada.ca/en/space-agency/news/2019/03/open-data-over-36000-historical-radarsat-1-satellite-images-of-the-earth-now-available-to-the-public.html); [RCM entry](https://data.asc-csa.gc.ca/en/dataset/64927856-8o0t-5u1o-987izna480aa45)); 2024/2025 lists also had SWOT, MOPITT, SCISAT and FireSmoke Canada (Tier C) | Greyscale SAR is a poor colorbar candidate | Not named on the page | T3 · VERIFIED |
| **ISRO** (partner) | MOSDAC (INSAT-3DS rainfall, UTH, TPW), Bhuvan, Bhoonidhi (NISAR S-band) ([MOSDAC guidelines](https://www.mosdac.gov.in/look/DOCS/mosdac-data-guidelines_english.pdf); [Bhoonidhi](https://www.nrsc.gov.in/nrscnew/assets/pdf/brochures/Bhoonidhi_Brochure_2025.pdf)) | RAW | Terms not read | T3 · PV |
| AEB/INPE, ASI, KASA, MBRSC, UKSA, CONAE, Spain and the others | INPE CPTEC appeared on the 2025 list (Tier C) | — | — | T3 · UNVERIFIED |
| NOAA (not a partner) | OISST, CRW DHW (`noaacrwdhwDaily`, 1985-03-25 → 2025-04-03 on that server, which conflicts with "NRT" status ([ERDDAP](https://coastwatch.noaa.gov/erddap/info/noaacrwdhwDaily/index.html))), GDP drifters, GML, HMS, GLM, SOS, AGGI (5126) | ERDDAP PNG makes OISST frame-pairable | Mostly free use | T3 · VERIFIED |
| Copernicus / ECMWF (not a partner) | CAMS EAC4, CAMS NRT on GEE (`ECMWF/CAMS/NRT`, PV), ERA5, GLORYS12, OSTIA, TROPOMI, Climate Pulse. "CAMS greenhouse gases" are coming to paid ECMWF Dissemination ([ECMWF forum](https://forum.ecmwf.int/tag/cams)) | RAW | **CC-BY** on ADS and CDS since 2 Jul 2025 | T3 · VERIFIED |
| EUMETSAT; CMA/NSMC; Bangladesh DoE and BMD; US Embassy Dhaka (AirNow) | MTG-LI; FY-4 LMI; DoE 16-station AQI; BMD 8 lightning sensors | RAW | DoE and BMD have no open API found | T3 · PV |

## Corrections to current Bloop records

Most of Bloop's validation anomalies trace to a mismatch in **product identity** (wrong version, level, depth or mapping) rather than to colour inversion. Each correction below is tied to the page that supports it.

| # | Record as it stands | Finding | Action | Source |
|---|---|---|---|---|
| 1 | 4950 validated against GEDI L3 (median 31.2 m vs 5.7 m) | Built from **GEDI L2B RH100**; three colorbars (0–40, 0–50, 0–75 m); height exaggerated; global view Apr 2019–Apr 2020 (page inconsistent) | Identify the embedded colorbar; decode only flat pixels; compare with L2B RH100 gridded to the frame for the same year | [SVS 4950](https://svs.gsfc.nasa.gov/4950) |
| 2 | 5196 treated as camera views that cannot be geolocated | **5436** has 8192×4096 2:1 frames, a volume-only layer, a timestamp file and the same colorbar | Ingest 5436; run the coastline-IoU check; label values "relative" | [SVS API 5436](https://svs.gsfc.nasa.gov/api/5436) |
| 3 | 5425 colours read as ocean temperature and salinity (surface implied) | Colours show **≥600 m** water; flows above 600 m are white; bars are −3–22 °C, 0–25 °C and 33–36 | Mask white pixels; validate against GLORYS12 or ECCO2 at depth; use the **5479** flat frames | [SVS API 5425](https://svs.gsfc.nasa.gov/api/5425); [5479](https://svs.gsfc.nasa.gov/api/5479) |
| 4 | 13786 mapping assumed to be radius from centre → pitch (ρ≈0) | The page says "the radius of the stars is mapped to pitch", which can mean star size | Retest pitch against blob area or flux; quote the page verbatim before putting it on a slide | [SVS 13786](https://svs.gsfc.nasa.gov/13786) |
| 5 | 5011 validated against ISS LIS without a version | Page lists **V1**. V2 (C2303212754-GHRC_DAAC) and V3 exist to **16 Nov 2023**; the visual ends **31 Jul 2023**; no frames or colorbar; SOS movie start conflicts (Mar vs Jan 2017) | Use V2/V3, Mar 2017–Jul 2023 only; normalise by view time; test the 60–90°E gap | [SVS API 5011](https://svs.gsfc.nasa.gov/api/5011); [data.gov](https://catalog.data.gov/dataset/quality-controlled-lightning-imaging-sensor-lis-on-international-space-station-iss-science); [GHRC LANCE](https://lance.nsstc.nasa.gov/iss-lis/index.html) |
| 6 | Earlier catalogue: "validate 5151 against GEOS-CF v2 Zarr", also applied to 5533 | v2 starts **2025-08-04**; 5533 (Jul–Sep 2024) needs **v1** (GEE `NASA/GEOS-CF/v1/rpl/tavg1hr`); 5533 lists **no colorbar file**; v2 release date conflicts (Oct 2025 vs Jan 2026) | Split validation by version; OCR the 5533 label band; never splice v1 and v2 | [GEE v1](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v1_rpl_tavg1hr?authuser=0); [SVS 5533](https://svs.gsfc.nasa.gov/5533) |
| 7 | PM2.5 scale factor 0.313× unexplained | v1 has both `PM25_RH35_GCC` (µg/m³) and `PM25_RH35_GOCART` (kg/m³) | 30-minute regression of recovered pixels on both bands for the same hour (HYPOTHESIS) | [GEE v1](https://developers.google.com/earth-engine/datasets/catalog/NASA_GEOS-CF_v1_rpl_tavg1hr?authuser=0) |
| 8 | 5572 aerosols validated against MERRA-2 (weak for dust and smoke) | Same-model target is GEOS-FP `tavg3_2d_aer_Nx`; `Aerosols/` frames are label-free, with a separate `Annotations/` overlay | Test against GEOS-FP first; read the MERRA-2 gap as a possible difference between modelling systems | [SVS API 5572](https://svs.gsfc.nasa.gov/api/5572); [5624](https://svs.gsfc.nasa.gov/api/5624) |
| 9 | No live aerosol layer | **5624** Global Smoke Forecast, updated daily (last on 29 Oct 2026), with EIC colorbars at 528×165 | Add it as the "now" voice beside 5572/5669; extract frames from the MP4 | [SVS API 5624](https://svs.gsfc.nasa.gov/api/5624) |
| 10 | Rain frames from 4285 | **5650** (5 Jun 2026) is the newer IMERG NRT item, with 3600×1800 flat alpha frames | Support both; check which ID the list cites after 13 Nov | [SVS 5650](https://svs.gsfc.nasa.gov/5650/) |
| 11 | NEO as a fallback source | **NEO decommissioned in Sept 2026** | Use GIBS colormap XML, Worldview or Global Maps instead | [NASA NEO](https://science.nasa.gov/earth/nasa-earth-observations-neo/) |
| 12 | 4939 assumed to be a MERRA-2 sibling of 4960 | 4939 uses NOAA-20/S-NPP **ATMS MiRS** total precipitable water | Treat it as an independent-sensor sibling | [SVS API 4939](https://svs.gsfc.nasa.gov/api/4939) |
| 13 | EIC beauty pieces assumed to equal the list | **4993 Dixie Fire spread** is in the gallery but not named | Pre-incorporate it as the most likely single addition | [SVS API 40467](https://svs.gsfc.nasa.gov/api/40467) |
| 14 | 5313 decoded as a value field | No numeric colorbar; dataset names no product level; S-NPP v1.0 production stopped after 31 Jan 2025 | Keep sign and rank claims only; validate with Collection 2 VNP46A4 | [SVS 5313](https://svs.gsfc.nasa.gov/5313); [LAADS alert](https://ladsweb.modaps.eosdis.nasa.gov/alerts-and-issues/171686) |
| 15 | 3912 paired by frame index | `flat_ecco2_dates.txt` gives exact per-frame dates; 6840×3420 equirectangular frames | Pair by date file; MUR as observational check | [SVS API 3912](https://svs.gsfc.nasa.gov/api/3912) |
| 16 | 5505 period taken as 2021–23 | Text says 2021–2023; dataset entry says 13 Nov 2022–25 Dec 2023 | Preserve the conflict; read the dates layer | [SVS API 5505](https://svs.gsfc.nasa.gov/api/5505) |
| 17 | Official list assumed hidden until 13 Nov | Announcement: "October 28: Full challenge statements released, including NASA and Space Agency Partner data sets" | Check the Challenge #14 Resources tab now | [Astrobiology.com](https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/) |
| 18 | Partner voices that assume regional coverage | TEMPO covers S10–N80, W170–W10 only; GLM and MTG-LI do not reach about 90°E (INFERENCE); Himawari P-Tree forbids redistribution | Use TROPOMI, CAMS and GSMaP for Bangladesh; keep P-Tree offline | [ASDC TEMPO](https://asdc.larc.nasa.gov/project/TEMPO/TEMPO_NO2_L3_V04); [P-Tree terms](https://www.eorc.jaxa.jp/ptree/terms.html) |

## Unverified items to check live from a normal machine

The sandbox proxy returned HTTP 403 for svs.gsfc.nasa.gov, cmr.earthdata.nasa.gov, PO.DAAC, GIBS and ERDDAP from the shell. SVS search and spaceappschallenge.org were also blocked for the fetch tool. Each check below takes about a minute in a browser, or one call of Bloop's `svs_api.py`.

| Item | What to confirm | How |
|---|---|---|
| Challenge #14 resources and partner contributions | Whether the 28 Oct release already lists partner datasets | spaceappschallenge.org/2026, Challenge #14 Resources tab |
| SOS twins 5518, 5552, 5475, 5273, 5333 | 2:1 layout, frame folders, colorbars, label files | `https://svs.gsfc.nasa.gov/api/<id>` |
| 5669, 4949, 4983, 5682, 14899, 5566, 5175, 5631, 5639 | Titles, frames, colorbars | Same |
| EIC focus-area children 5235, 5087, 5075, 5453, 5115/5116/5117/5118, 5047, 5190, 5209, 5111, 5098, 4889, 5516, 14700, 40487, 4993 | Frames, colorbar, 2:1 map | Same |
| Night-light and forest siblings 5276, 5477, 30919, 4658, 12616 | Frames and colorbar | Same |
| Atmospheric-river, rain and ocean siblings 4334, 4416, 4555, 4547, 1016, 4382, 4285, 10953, 10841, 3820, 14745, 12738, 4234, 4045, 4046 | Frames and colorbar | Same |
| 5479 temperature and salinity colorbars | Whether they are separate files or reuse the 5425 bars | `api/5479`; compare pixel colours |
| 4950 EIC version | Which of the three colorbars the EIC frames use | `api/4950` file list |
| Untested listings: the truncated tail of 40503 (Hyperwall Power Playlist), and SVS-wide keyword searches | Missing items | `api/40503`; `api/search/?search=sonification`, `biodiversity`, `energy`, `flood`, `drought`, `sea level`, `lightning` |
| CMR IDs and DOIs: VNP46A1–A4, VJ146A1–A4 (and whether NOAA-21 VJ246 exists), GEDI02_A/B, GEDI L3 and L4A, ATL08/ATL18, CMS mangrove DOI, M2I3NVAER, M2T1NXINT (DOI and whether hourly UFLXQV/VFLXQV exist), ISS LIS V3 DOI, IMERG Late DOI, ECCO V4r4 velocity, MUR25, Aquarius L3, RSS SMAP V6.0, NASA-SSH, SWOT L3/L4 | Exact IDs and periods | `https://cmr.earthdata.nasa.gov/search/collections.json?short_name=<name>` |
| Partially verified IDs: C1276812830-GES_DISC (M2T1NXAER), C2912085112-GES_DISC (OCO-2 Lite 11.2r), C2723754847-GES_DISC (IMERG Final) | Collection identity | CMR concept lookup |
| Unopened atmosphere products: MOD04/MYD04, MCD19A2, OMNO2d, OMSO2e, OMPS SO2, MOPITT MOP03J, AIRS CO L3, CALIPSO `CAL_LID_L2_05kmAPro`, OCO3_L2_Lite_FP, TEMPO O3TOT/HCHO L3 | Existence and versions | CMR |
| GIBS layer IDs for Black Marble, VIIRS DNB, MUR SST/anomaly, IMERG, SMAP SSS, chlorophyll, LIS, NDVI, NO2, VIIRS fires | Exact names and colormap XML | WMTS GetCapabilities |
| GHG Center collection IDs | Exact STAC IDs | `earth.gov/ghgcenter/api/stac/collections` |
| GEOS-CF v1 NCCS and OPeNDAP paths; GEOS-FP `tavg3_2d_aer_Nx` variable names; the v2 release-date conflict | Paths and variables | NCCS portal; GMAO file spec |
| Earth Observatory Global Maps after NEO's retirement | Downloadable monthly PNGs and colorbars | Browser |
| Licences: ESA CCI (EDS text), Himawari on NOAA AWS, FY-4 LMI openness, Blitzortung, TwoTone, Chandra/SAO audio, EOG VNL (CC BY 4.0?), MOSDAC, Bhuvan, INCOIS | Reuse terms | Each licence page |
| Coverage: NOAA HMS extent; GLM and MTG-LI longitudes; whether QC ISS LIS data share the 60–90°E gap | Bangladesh relevance | One file's lat/lon range each |
| Conflicts: CRW DHW ERDDAP ending in 2025; LIS/OTD HRFC DATA302 vs DATA311 | Which is current | ERDDAP; DOI resolver |
| Other-agency items not opened: CMEMS MULTIOBS_GLO_PHY_MYNRT_015_003, SEALEVEL_GLO_PHY_L4_NRT_008_046 / MY_008_047, GLOBAL_ANALYSISFORECAST_PHY_001_024, SMOS L3/L4, OSI SAF SST, OceanSat-3, CAMS EGG4 | IDs and periods | Provider catalogues |
| 2023 "Immersed in the Sounds of Space" resource list; nasa.gov "From Space to Sound" | Which items recur | Browser |

## Conclusion

The strategic pattern is simpler than the catalogue suggests. NASA's official items are mostly hyperwall cuts. Behind several of them sits a **Science On a Sphere or equirectangular twin**: 5436 for 5196, 5479 and 5505 for 5425, 5475 for 5313, 5518 for 5533, 5552 for 5572, and 5273 for 5110. These twins usually give the flat 2:1 geometry that Bloop's validation loop needs. A generic "find the SOS twin, ingest the 2:1 frames, inherit the hyperwall colorbar" step would therefore cover new additions faster than hand-tuning each one. That is an INFERENCE from six observed cases, to be tested on the first item NASA adds.

The second takeaway is about credibility. Bloop's weak or puzzling validation numbers cluster where the comparison product was wrong: L3 instead of L2B, v2 instead of v1, surface instead of 600 m, V1 instead of V2/V3, radius instead of size. They do not cluster where the colour inversion is hardest. Putting "product-identity check" ahead of every agreement score, and naming its rung on the independence ladder, turns those corrections into an evidence story judges can follow. The cheapest move today is to check whether the 28 Oct partner release has already happened.
