"""SVS 5313 Change in Night Lights between 2012 and 2023, EIC version (Black Marble, S-NPP VIIRS). 5313's own frames are
a 7680×2160 EIC cut with zooms; its alternate versions carry the usable assets (asset rule, docs/official/5313.md):
  5276 — the lights-only change still (7680×4320, lights on black: no base map to unmix) and the change colorbar;
  5475 — the Science On a Sphere 2:1 frame (2048×1024, lights over a land base map) that fixes the georeference.
The colorbar's labels are words ('lights out', 'no change', 'new lights'): the record is relative change, −1 … +1."""

SID = 5313
ALTS = (5276, 5475)
RECORD = "lights_5313"
BASE_5276 = "https://svs.gsfc.nasa.gov/vis/a000000/a005200/a005276/"
STILL = "nightlights_flat_series_stills_8k_only_lights.change.jpg"
COLORBAR = "nightlights_change_colorbar.png"
FRAME_2X1 = ("https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005475/frames/2048x1024_2x1_30p/nightlights_change_2012-2024_KSC_SOS_plus2/"
             "nightlights_2012-2024_KSC_SOS_04_plus2_1259_2k.png")
YEARS = (2012, 2023)
GRID_DEG = 0.1
DARK_BOX = (-150, -40, -130, -20)    # W, S, E, N: open South Pacific, no lights; the still's own noise floor is read here
STRONG = 0.5                         # |relative change| a cell needs to count as a strong change (validation and stills)
