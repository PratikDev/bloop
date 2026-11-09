"""SVS 5425 Perpetual Ocean 2: Western Boundary Currents (ECCO model, 2021–2023). One camera path over 19 001 frames per
layer (3840×2160 EXR): a rotating globe, then close views of the Kuroshio, the Agulhas Current and the Gulf Stream. The
layers are separate: temperature, salinity, land mask, dates, beauty (flow). Frame times come from the dates layer (OCR)."""

SID = 5425
BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005425/"
FRAMES = BASE + "frames/3840x2160_16x9_60p/"
LAYERS = {"dates": "dates", "land_mask": "land_mask", "temperature": "temperature", "salinity": "salinity", "beauty": "beauty_all_depths"}
COLORBARS = {"temperature": "perpetual_ocean2_CLOSE_101_cbar_temperature.png", "salinity": "perpetual_ocean2_CLOSE_100_salinity_cbar.png"}
PROBE_EVERY = 250
CURRENTS = {"Kuroshio": (125, 25, 160, 45), "Agulhas": (10, -45, 40, -25), "Gulf Stream": (-82, 25, -45, 45)}   # W, S, E, N
