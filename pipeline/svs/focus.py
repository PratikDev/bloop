"""The EIC focus areas (the 2024 statement's nine) and the official resource each related item belongs beside, by rule
on the item's own words (title, keywords, dataset names). One table, used by Phase 0's candidate list and by the app's
Official → Related grouping. First match wins; anything else is 'other' (stated, not forced into a theme)."""
import re

FOCUS = (("wildfires", r"wildfire|\bfire|burn(ed)? area|smoke"),
         ("air quality", r"air quality|pollut|PM ?2\.5|nitrogen dioxide|\bNO2\b|\bNOx\b|ozone|TEMPO|aerosol|carbon monoxide"),
         ("greenhouse gases", r"carbon dioxide|\bCO2\b|CO₂|methane|\bCH4\b|nitrous|\bN2O\b|greenhouse|ODIAC|OCO-?[23]|carbon (flux|budget)"),
         ("sea level", r"sea level|GMSL|altimet|SWOT|porthole"),
         ("energy", r"night ?lights?|Black Marble|power (outage|loss)|electric"),
         ("disasters", r"hurricane|cyclone|typhoon|flood|landslide|disaster|tornado|outage|earthquake|tsunami|lightning|derecho"),
         ("water resources", r"precipitation|\brain|snow|IMERG|GPM\b|atmospheric river|water vapo|groundwater|GRACE|soil moisture|drought|"
                             r"water (cycle|storage)|basin|river|salinity|ocean|current|sea surface|SST"),
         ("agriculture", r"crop|agricultur|farm|irrigat|cropland|NDVI|vegetation index"),
         ("biodiversity", r"biodiversity|forest|GEDI|canopy|biosphere|habitat|species|mangrove|vegetation|coral"))

# Which official resource an item sits beside (the record the app already has for that theme).
OFFICIAL = (("5011", r"lightning"), ("13786", r"sonif|sound|music"), ("5196", r"carbon dioxide|\bCO2\b|CO₂|methane|greenhouse|ODIAC|OCO"),
            ("5669", r"aerosol|smoke|dust"), ("5533", r"air quality|pollut|PM ?2\.5|\bNO2\b|ozone|TEMPO|carbon monoxide"),
            ("4950", r"forest|GEDI|canopy|biomass|biosphere|vegetation"), ("5313", r"night ?lights?|Black Marble"),
            ("4960", r"atmospheric river|water vapo|precipitation|\brain|IMERG|snow"),
            ("5425", r"salinity|deep ocean|Perpetual Ocean"), ("3912", r"ocean|current|sea surface|SST|ECCO"),
            ("4993", r"wildfire|\bfire|burn"))

def words(rec):
    return " ".join([rec.get("title") or "", " ".join(map(str, rec.get("keywords") or [])),
                     " ".join(d.get("name") or "" for d in rec.get("datasets") or [])])

def focus(rec):
    t = words(rec)
    return next((name for name, rx in FOCUS if re.search(rx, t, re.I)), "other")

def official(rec):
    t = words(rec)
    return next((sid for sid, rx in OFFICIAL if re.search(rx, t, re.I)), None)
