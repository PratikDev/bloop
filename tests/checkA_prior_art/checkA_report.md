# Check A: prior art

Question: has anyone already built EIC frame -> value -> verification against the source dataset -> sound?
Result: **CONTINUE**. No exact match found.

The full Check A research report was not saved as a file. Its findings are recorded in
`docs/JUKEBOX_RESEARCH_AND_BLUEPRINT.md` (section 0 "Our own evidence so far", 1.1, 1.3 and 1.5), summarised here:

- Colour-to-value inversion itself has prior art:
  - mcgibs: reverse-maps GIBS pixel colours via the layer's colormap.
  - Poco, Mayhua & Heer (TVCG 2018): legend extraction with OCR.
  - arXiv 2507.20632: colormap recovery without a legend.
  - `unmap` (two repos).
- None of these starts from EIC/SVS frames, validates against the declared source dataset, or makes sound.
- GIBS publishes machine-readable colormaps with a `sourceValue` per colour.
- NASA sonification work exists (Chandra "A Universe of Sound", SYSTEM Sounds 2020, Goddard "Sounds of the Sea",
  Earthdata "From Data to Melody"), but none inverts EIC frames and checks them against the source data.
- Closest 2026 signal: the Pundra repo "The-Earth-Information-Jukebox" sonifies numeric series
  (MODIS, GISTEMP, OCO-2, GRACE, SMAP); EIC is mentioned only as motivation.
