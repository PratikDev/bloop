"""SVS 4960 A 3D View of an Atmospheric River (MERRA-2): a narrated 3D camera flight; the blue shading is water vapour
transport (no colorbar for it), dates come from the separate date-only layer (OCR). The dates read are Oct–Dec 2010 (the
2021 in the frame names is the render date). Georeference: none (perspective 3D view)."""

SID = 4960
RECORD = "river_4960"
FRAMES = "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004960/frames/3840x2160_16x9_60p/"
DATES = "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004960/frames/1920x1080_16x9_60p/atmos_river_DATE_ONLY_rfm23_2021-12-10_1233/"
MERRA2_INT = "C1276812846-GES_DISC"
COAST_BOX = (-130, 30, -112, 50)          # W, S, E, N: US west coast landfall zone (MERRA-2 index box 240–280 × 80–110)
N_FRAMES = 24
