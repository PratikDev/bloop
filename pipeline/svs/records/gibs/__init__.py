"""Phase 3: one generic GIBS record, rel_gibs — any GIBS raster layer, any date, decoded exactly from the layer's colormap
XML (svs/gibs.py). PRESET is the Worldview layers the EIC dashboards embed (40509, 40529, 40531), with NOAA-20 in place
of S-NPP where both exist (S-NPP is retired for current products after 2 Nov 2026). Vector layers (active fires) have no
colormap and are listed, not decoded."""

RECORD = "rel_gibs"
PRESET = {
    "VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance": ("Night lights (VIIRS NOAA-20 day/night band)", "energy"),
    "VIIRS_NOAA20_Thermal_Anomalies_375m_All": ("Active fires (VIIRS NOAA-20)", "wildfires"),
    "IMERG_Precipitation_Rate": ("Rain and snow rate (IMERG)", "water resources"),
    "GHRSST_L4_MUR_Sea_Surface_Temperature": ("Sea surface temperature (MUR)", "water resources"),
    "MODIS_Terra_L3_Land_Surface_Temp_Daily_Day": ("Land surface temperature, day (MODIS Terra)", "other"),
    "GHRSST_L4_MUR_Sea_Ice_Concentration": ("Sea ice concentration (MUR)", "sea level"),
    "MODIS_Combined_Value_Added_AOD": ("Aerosol optical depth (MODIS combined)", "air quality"),
    "OMI_Aerosol_Index": ("Aerosol index (OMI)", "air quality"),
    "AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day": ("Carbon monoxide, 500 hPa (AIRS)", "air quality"),
    "OMI_Nitrogen_Dioxide_Tropo_Column": ("Tropospheric NO2 (OMI)", "air quality"),
    "VIIRS_NOAA20_AOD_Deep_Blue_Land_Ocean": ("Aerosol optical depth (VIIRS NOAA-20 Deep Blue)", "air quality"),
    "VIIRS_NOAA20_NDVI_8Day": ("Vegetation index, 8-day (VIIRS NOAA-20)", "agriculture"),
    "MODIS_Aqua_L2_Chlorophyll_A": ("Chlorophyll-a (MODIS Aqua)", "biodiversity"),
    "SMAP_L3_Sea_Surface_Salinity_CAP_8Day_RunningMean": ("Sea surface salinity, 8-day (SMAP)", "water resources"),
    "LIS_High_Resolution_Full_Climatology_Combined_Flash_Rate_Climatology": ("Lightning flash rate climatology (LIS/OTD)", "disasters"),
}
GRID_DEG = 0.5
PIPELINE_TEST = "GHRSST_L4_MUR_Sea_Surface_Temperature"     # decoded from GIBS vs MUR25 read directly (3912's source)
