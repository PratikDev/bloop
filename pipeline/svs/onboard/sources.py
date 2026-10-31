"""Automatic validation-source lookup for onboarding: product keywords → a source that returns a 1° field for a date.
Built from Phases 1–4 (docs/related/CANDIDATES.md): most variables come from GIBS, decoded exactly through its colormap
XML (svs/gibs.py) — the same NASA product family SVS draws from, so the rung is stated per entry. First match wins; an
item whose words match nothing, or whose date the source does not cover, gets 'no validation source' (never blocks).
Each entry: (pattern, name, rung, fetch(date) → 1° array, unit)."""
import datetime as dt, re
import numpy as np
from .. import gibs

DEG = 1.0

def from_gibs(layer, scale=1.0, offset=0.0):
    def fetch(when):
        vals, _ = gibs.field(layer, when.strftime("%Y-%m-%d"))
        return gibs.regrid(vals, DEG) * scale + offset
    return fetch

def from_gibs_timed(daily, half_hourly):
    """A sub-daily frame (a time of day in its date) reads the 30-minute layer at that half hour; a date reads the daily one."""
    def fetch(when):
        if when.hour or when.minute:
            t = when.replace(minute=30 * (when.minute // 30), second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")
            vals, _ = gibs.field(half_hourly, t)
        else:
            vals, _ = gibs.field(daily, when.strftime("%Y-%m-%d"))
        return gibs.regrid(vals, DEG)
    return fetch

def from_geosfp(collection, variables, combine="value", scale=1.0, offset=0.0):
    def fetch(when):
        from ..records.eic.run import model_field                    # GEOS-FP on NCCS OPeNDAP (its rolling window)
        f, _ = model_field((collection, variables, combine, scale, offset), when)
        return np.nanmean(f.reshape(180, 2, 360, 2), axis=(1, 3))
    return fetch

def to_1deg(lat, lon, a):
    """Points (lat, lon, value) → mean per 1° cell (row 0 = north, col 0 = 180° W)."""
    i = np.clip((90 - lat).astype(int), 0, 179); j = np.clip(((lon + 180) % 360).astype(int), 0, 359)
    s, n = np.zeros((180, 360)), np.zeros((180, 360)); ok = np.isfinite(a)
    np.add.at(s, (i[ok], j[ok]), a[ok]); np.add.at(n, (i[ok], j[ok]), 1)
    return np.where(n > 0, s / np.maximum(n, 1), np.nan)

def from_ghg(when):
    from ..records.co2.gradient import ghg_day                       # GHG Center daily XCO2 (2015 – Feb 2022, CC0)
    lat, x = ghg_day(when.date())                                     # native 361 × 576 grid, flattened, 0.625° in longitude
    lon = np.tile(-180.3125 + (np.arange(576) + 0.5) * 0.625, 361)
    return to_1deg(lat, lon, x)

SOURCES = [
    (r"lightning|flash", "LIS/OTD HRFC climatology (GIBS)", "independent satellites, other years",
     lambda when: gibs.regrid(gibs.field("LIS_High_Resolution_Full_Climatology_Combined_Flash_Rate_Climatology", "1995-05-04")[0], DEG), "flashes/km²/yr"),
    (r"sea surface temperature anomal|SST anomal", "MUR SST anomaly (GIBS)", "same product family (GHRSST MUR)",
     from_gibs("GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies"), "°C"),
    (r"sea surface temperature|surface (currents and )?temperatures?|\bSST\b", "MUR SST (GIBS)", "independent satellite analysis (GHRSST MUR)", from_gibs("GHRSST_L4_MUR_Sea_Surface_Temperature"), "°C"),
    (r"salinity|SSS\b", "SMAP SSS 8-day (GIBS)", "independent satellite", from_gibs("SMAP_L3_Sea_Surface_Salinity_CAP_8Day_RunningMean"), "PSU"),
    (r"precipitation|rainfall|\brain\b|IMERG|GPM\b", "IMERG precipitation rate (GIBS)", "same product (IMERG)",
     from_gibs_timed("IMERG_Precipitation_Rate", "IMERG_Precipitation_Rate_30min"), "mm/hr"),
    (r"brown carbon|smoke forecast", "GEOS-FP brown-carbon AOD (OPeNDAP)", "same model (GEOS-FP)",
     from_geosfp("tavg3_2d_aer_Nx", ("brexttau",)), "AOD"),
    (r"aerosol optical depth|\bAOD\b|aerosol(?! index)", "MODIS combined AOD (GIBS)", "independent satellite", from_gibs("MODIS_Combined_Value_Added_AOD"), "AOD"),
    (r"aerosol index", "OMPS NOAA-20 aerosol index (GIBS)", "independent satellite", from_gibs("OMPS_NOAA20_NadirMapper_AerosolIndex_380"), "index"),
    (r"nitrogen dioxide|\bNO2\b", "OMI tropospheric NO2 (GIBS)", "independent satellite", from_gibs("OMI_Nitrogen_Dioxide_Tropo_Column"), "molecules/cm²"),
    (r"carbon monoxide|\bCO\b", "AIRS CO 500 hPa (GIBS)", "independent satellite", from_gibs("AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day"), "ppbv"),
    (r"carbon dioxide|\bCO2\b|XCO2", "GHG Center OCO-2/GEOS XCO2", "model assimilating an independent satellite", from_ghg, "ppm"),
    (r"NDVI|vegetation index|greenness", "VIIRS NOAA-20 NDVI 8-day (GIBS)", "independent satellite", from_gibs("VIIRS_NOAA20_NDVI_8Day"), "NDVI"),
    (r"land surface temperature|\bLST\b", "MODIS Terra LST daily (GIBS)", "independent satellite",
     from_gibs("MODIS_Terra_L3_Land_Surface_Temp_Daily_Day", offset=-273.15), "°C"),
    (r"sea ice (concentration|extent|minimum|cover)|(polar|arctic|antarctic) sea ice", "MUR sea-ice concentration (GIBS)", "independent satellite analysis", from_gibs("GHRSST_L4_MUR_Sea_Ice_Concentration"), "%"),
    (r"chlorophyll", "MODIS Aqua chlorophyll-a (GIBS)", "independent satellite", from_gibs("MODIS_Aqua_L2_Chlorophyll_A"), "mg/m³"),
    (r"near-surface temperature|2-?m(eter)? temperature|air temperature", "GEOS-FP T2M (OPeNDAP)", "same model (GEOS-FP)",
     from_geosfp("tavg1_2d_slv_Nx", ("t2m",), offset=-273.15), "°C"),
]

def lookup(words):
    """(name, rung, fetch, unit) of the first source whose pattern matches the item's words, or None."""
    return next(((n, r, f, u) for rx, n, r, f, u in SOURCES if re.search(rx, words, re.I)), None)
