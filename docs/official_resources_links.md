# Official Challenge #14 resources: links

Challenge #14, "The Earth Information Jukebox" (NASA Space Apps 2026).

**About this file:**
- It is rebuilt from our verified notes of 28 Oct 2026, not copied from the Resources tab. Every SVS link below was re-checked on 29 Oct 2026.
- **Before committing:**
  1. Open the challenge's Resources tab and compare it line by line with this list.
  2. Paste the **EIC Content Database** link where marked.
  3. Add anything new; the statement says more resources may be added.

The completeness test reads the `official` table below. Rows in the `related` table are optional extras and are not tested.

## Official resources (tested for completeness)

| svs_id | Title (as on SVS) | Link | API | Kind |
|---|---|---|---|---|
| EIC-DB | EIC Content Database ("videos and images as data for processing the audio files") | https://svs.gsfc.nasa.gov/gallery/earth-information-center/ | https://svs.gsfc.nasa.gov/api/40467 | catalogue |
| 13786 | Data Sonification: Caldwell 73 | https://svs.gsfc.nasa.gov/13786 | https://svs.gsfc.nasa.gov/api/13786 | sonification (method reference) |
| 3912 | Global Sea Surface Currents and Temperature | https://svs.gsfc.nasa.gov/3912 | https://svs.gsfc.nasa.gov/api/3912 | model (ECCO2) |
| 5313 | Change in Night Lights between 2012 and 2023 – EIC Version | https://svs.gsfc.nasa.gov/5313 | https://svs.gsfc.nasa.gov/api/5313 | observation (Black Marble, S-NPP VIIRS) |
| 5669 | GEOS Aerosols (2025) | https://svs.gsfc.nasa.gov/5669 | https://svs.gsfc.nasa.gov/api/5669 | model (GEOS-FP) |
| 5572 | GEOS Aerosols | https://svs.gsfc.nasa.gov/5572 | https://svs.gsfc.nasa.gov/api/5572 | model (GEOS-FP) |
| 5425 | Perpetual Ocean 2: Western Boundary Currents | https://svs.gsfc.nasa.gov/5425 | https://svs.gsfc.nasa.gov/api/5425 | model (ECCO-2) |
| 5533 | Air Quality Model Runs | https://svs.gsfc.nasa.gov/5533 | https://svs.gsfc.nasa.gov/api/5533 | model (GEOS-CF) |
| 5518 | Science On A Sphere: Air Quality Model Runs | https://svs.gsfc.nasa.gov/5518 | https://svs.gsfc.nasa.gov/api/5518 | model (GEOS-CF) |
| 5196 | DYAMOND Global Carbon Dioxide | https://svs.gsfc.nasa.gov/5196 | https://svs.gsfc.nasa.gov/api/5196 | model (GEOS–MITgcm nature run) |
| 5011 | Lightning Events Detected from the International Space Station (ISS) 2017–2023 | https://svs.gsfc.nasa.gov/5011 | https://svs.gsfc.nasa.gov/api/5011 | observation (ISS-LIS) |
| 4960 | A 3D View of an Atmospheric River | https://svs.gsfc.nasa.gov/4960 | https://svs.gsfc.nasa.gov/api/4960 | reanalysis (MERRA-2) |
| 4950 | GEDI Forest Height | https://svs.gsfc.nasa.gov/4950 | https://svs.gsfc.nasa.gov/api/4950 | observation (GEDI lidar) |

**Check against the Resources tab:** we recorded 5533/5518 and 5669/5572 as pairs. If the tab lists only one of a pair, move the other to the table below.

## Related items (optional, not on the official list; use for georeferencing or extra frames)

| svs_id | Title | Link | Why |
|---|---|---|---|
| 5276 | Change in Night Lights between 2012 and 2023 | https://svs.gsfc.nasa.gov/5276 | Main (non-EIC) version of 5313 |
| 5475 | SOS – Change in Night Lights between 2012 and 2023 | https://svs.gsfc.nasa.gov/5475 | Science On a Sphere version; may give equirectangular frames for georeferencing |
| 5436 | DYAMOND Global Carbon Dioxide for Science On A Sphere | https://svs.gsfc.nasa.gov/5436 | A possible 2:1 version of 5196 |
| 14439 | Air Pollution Model Runs | https://svs.gsfc.nasa.gov/14439 | Related GEOS-CF item |
| 5552 | Science On A Sphere: Aerosols in the Air | https://svs.gsfc.nasa.gov/5552 | A possible 2:1 aerosol version |
| 3827 | Perpetual Ocean | https://svs.gsfc.nasa.gov/3827 | The original 2011 Perpetual Ocean |
| 3821 | Flat Map Ocean Current Flows with Sea Surface Temperatures (SST) | https://svs.gsfc.nasa.gov/3821 | A flat-map current flows item |

**Already used as Bloop's live daily layer** (not part of this list): 5101 (SST NRT), 4285, 5176, 5315.

## Validation sources referenced in the prompt (confirm collection names in code)

| Used for | Source |
|---|---|
| 3912, 5425 SST | MUR SST (PO.DAAC) |
| 3912, 5425 currents | OSCAR surface currents (PO.DAAC) |
| 5425 salinity | SMAP sea surface salinity (PO.DAAC) |
| 5011 | ISS LIS lightning science data (GHRC DAAC). Catalogue entry found: https://www.earthdata.nasa.gov/data/catalog/ghrc-daac-isslis-v3-fin-3 |
| 5313 | Black Marble annual composites VNP46A4 (+ VJ146A4) (LAADS) |
| 5533/5518 | GEOS-CF archive; OpenAQ Dhaka stations |
| 5669/5572 | GEOS-FP or MERRA-2 M2T1NXAER |
| 4960 | MERRA-2 M2T1NXINT |
| 4950 | GEDI L3 gridded canopy height (ORNL DAAC) |
| 5196 (context only) | NOAA GML Mauna Loa monthly CO2 |
