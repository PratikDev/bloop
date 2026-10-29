"""SVS 5196 DYAMOND Global Carbon Dioxide (GEOS–MITgcm nature run, Jan–Mar 2020). 5196's own frames are globe views;
its Science On a Sphere version 5436 has 2:1 layers (asset rule): the CO2 volume alone (8192×4096 EXR with alpha, no
background), the Earth surface alone (for the georeference), a per-frame date file and the colorbar with its colour and
opacity transfer functions (380–460 ppm). N_FRAMES volume frames, evenly spaced, are streamed (download, reduce, delete)."""

SID = 5196
ALT = 5436
RECORD = "co2_5196"
BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005436/"
VOLUME = BASE + "frames/8192x4096_2x1_30p/dyamondPointCloud_10-8-2024a_dyamond_co2_sos_volume_8k/"
SURFACE = BASE + "frames/8192x4096_2x1_30p/dyamondPointCloud_1-29-2025a_dyamond_co2_sos_surface_8k/"
COLORBAR = BASE + "dyamondCbar_6-27-2024a.png"
DATES = BASE + "dyamond_timestamps.txt"
N_FRAMES = 12
GRID_DEG = 0.5
