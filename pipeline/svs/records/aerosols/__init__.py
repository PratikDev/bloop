"""SVS 5669 GEOS Aerosols (2025): one still, 19 Aug 2025 20:00 UTC (GEOS-FP), with a categorical key (black carbon, dust,
sea salt, sulfate) and no values. 5572 / 5552 are the animated versions (Aug–Sep 2024) of the same rendering; the record
is the 5669 still (asset rule: the largest still ≤ 7680 px), labelled by aerosol type."""

SID = 5669
ALTS = (5572, 5552)
RECORD = "aerosols_5669"
BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005669/"
STILL = "Aerosols_2025-08-19T20_00_00_7680x4320.png"
KEY = "Aerosols_cbar.png"
TYPES = ("sea salt", "dust", "smoke", "sulfate")          # the labelling page's classes; smoke = the key's black carbon
GRID_DEG = 1.0
