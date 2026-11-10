# Raw SVS downloads not onboarded (P6 triage, 10 Nov 2026)

Seven SVS items sit in `data_raw/` (or in `pipeline/svs/cache/`) but never became records. Read from each item's
`pipeline/svs/cache/<id>.json` (the SVS API page: title, description, media, frame folders) and the files in
`data_raw/<id>/`. The bar for onboarding in this pass: a clean, colorbarred, flat-map (2:1 equirectangular) EIC item
that `python -m svs.onboard <id>` can take in about an hour. None met it, so no record was added.

| SVS | What it is | Colorbar | Frames | Projection | Why it wasn't onboarded |
|---|---|---|---|---|---|
| 30028 | Earth at Night 2012 (Suomi NPP VIIRS city-lights composite, Apr + Oct 2012) | No | One still (no frame series); `data_raw/30028` holds the manifest only | Flat map (still) | No colour bar, so no radiance can be read back; one 2012 S-NPP composite that the 2012–2023 night-lights record (lights_5313) already covers; S-NPP stopped on 2 Nov 2026, and P4's measured night lights come from NOAA-20 (VJ146A2). |
| 5022 | OCO-2 gridded global CO₂, Jan 2015 – Feb 2022 (Level 3) | Animated, burned into a separate annotation layer (no colour-bar file) | 10 frame folders on SVS; none on disk | 16:9 (3840×2160) globe/map composition, not a 2:1 flat map | Not a flat map, and the colour bar moves with the frames (no fixed bar to decode against); CO₂ is already played by co2_5196. |
| 5075 | Near Real-Time Global Biosphere (latest 2.5 years: land NDVI + ocean chlorophyll) | Yes (NDVI bar, `ndvi_colorbar.tif`) | 6 frame folders; the dated plate carrée is a 113 MB MP4 only; none on disk | Flat map, 4096×2048 | Two variables on one picture (NDVI on land, chlorophyll at sea) with one listed bar, frames only inside a video: more than an hour to onboard honestly; NDVI near real time is already eic_5544. Candidate for a later pass (land part only). |
| 5273 | Atmospheric CO₂ tagged by source, for Science On a Sphere (GEOS model) | An SOS legend image with four tagged sources | 10 frame folders; none on disk | Sphere (SOS) equirectangular | Four sources blended into one colour per pixel: no single value per colour to decode; CO₂ is already co2_5196. |
| 5479 | Perpetual Ocean 2: flat maps of temperature and salinity at depth (flows above 600 m drawn white) | No bars listed (only pixels on 5425's bars decode) | Probe and validation frames on disk: `frames/`, `grids.npz`, `glorys.json`, `twin.json` | Flat map, 4096×2048 | Used as validation, not as a record: its frames are ocean2_5425's checks d_depth_temperature, d_depth_salinity and e_glorys12_depth (vs NOAA WOA23 and GLORYS12; `official/ocean2_5425/validation.json`). Now credited in that record's How we got this ("Also checked with"). |
| 5505 | Perpetual Ocean 2: equirectangular "beauty" version | No | 3 frame folders; none on disk | Flat map, 2048×1024 | A beauty render with no colour bar (pattern only); the same model and period as ocean2_5425, which already plays it with values. |
| 5552 | Science On a Sphere: Aerosols in the Air (GEOS) | No (aerosol types as colours) | 5 frame folders; none on disk | Sphere (SOS) equirectangular | No colour bar; the aerosol types are already decoded and played by aerosols_5669 (5669 + 5572). |

`python -m svs.onboard` was not run: no item met the bar (and its downloads go into `data_raw/`, which this build may
not write to outside its scratch folder).
