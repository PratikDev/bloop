"""SVS 5533 / 5518 Air Quality Model Runs (GEOS-CF, 1 Jul – 14 Sep 2024). Frames come from 5518's 2:1 species layers
(the asset rule in svs/choose.py); 5533 is the presentation version and the record's headline ID."""
import datetime as dt

SID, ALT = 5533, 5518
BD_BOX = (88.0, 20.0, 93.0, 27.0)          # W, S, E, N: the full-resolution Bangladesh box (task spec)
CROP_MARGIN = 1.0                          # degrees kept around the box so resampling never runs off the crop
FULL_EVERY = 3                             # full global frames every 3 h (global daily product + validation)
PERIOD = (dt.datetime(2024, 7, 1, tzinfo=dt.timezone.utc), dt.datetime(2024, 9, 14, tzinfo=dt.timezone.utc))
SPECIES = {"PM2.5_Layer": "pm25", "CarbonMonoxide_Layer": "co", "NitrogenOxides_Layer": "nox", "Ozone_Layer": "o3"}
