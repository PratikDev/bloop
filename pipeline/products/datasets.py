"""Every source dataset once: its agency badge and whether it is a measurement or a model (guardrail 15), plus the
inputs it shares with others (book §4.6). Products list these; the app shows them as badges."""
from dataclasses import dataclass

AGENCIES = ("NASA", "JAXA", "NOAA", "Copernicus", "ground", "other")
KINDS = ("measurement", "model", "inventory")

@dataclass(frozen=True)
class Dataset:
    id: str
    name: str
    agency: str
    kind: str
    shares_inputs_with: tuple[str, ...] = ()
    url: str | None = None   # the dataset's landing page or DOI, taken from the file itself, the SVS page or our fetch code; None = not available
    provider: str | None = None   # who provides it, when the name's last bracket doesn't say (the app's credits read it)

    def __post_init__(self):
        assert self.agency in AGENCIES and self.kind in KINDS, self

    def as_json(self):
        return {"id": self.id, "name": self.name, "agency": self.agency, "kind": self.kind,
                "shares_inputs_with": list(self.shares_inputs_with), "url": self.url, "provider": self.provider}

# EIC frames (SVS)
SVS5101 = Dataset("svs5101", "EIC frame: SVS 5101 sea surface temperature (from MUR)", "NASA", "measurement", ("mur",))
SVS4285 = Dataset("svs4285", "EIC frame: SVS 4285 IMERG precipitation", "NASA", "measurement", ("imerg",))
SVS5176 = Dataset("svs5176", "EIC frame: SVS 5176 SST anomaly (from MUR)", "NASA", "measurement", ("mur",))
SVS5315 = Dataset("svs5315", "EIC frame: SVS 5315 Fire Weather Index, 1-day forecast (NASA GISS GlobalFWI)", "NASA", "model")
SVS5584 = Dataset("svs5584", "EIC frame: SVS 5584 landslide exposure (LHASA)", "NASA", "model")
SVS5113 = Dataset("svs5113", "EIC frame: SVS 5113 VIIRS active fires", "NASA", "measurement", ("firms",))
# Official Challenge #14 resources (pipeline/svs): archive animations of models
SVS5533 = Dataset("svs5533", "EIC frames: SVS 5533 / 5518 Air Quality Model Runs", "NASA", "model", ("geoscf",))
SVS3912 = Dataset("svs3912", "EIC frames: SVS 3912 Global Sea Surface Currents and Temperature", "NASA", "model", ("ecco2",))
EIC_EARTHNOW = Dataset("eic_earthnow", "EIC frames: SVS Earth Now dashboard (GEOS-FP / GEOS-CF) and NRT NDVI", "NASA", "model", ("geosfp", "geoscf"))
EIC_NDVI = Dataset("eic_ndvi", "EIC frames: SVS 5544 near-real-time NDVI (S-NPP VIIRS)", "NASA", "measurement")
SVS4960 = Dataset("svs4960", "EIC frames: SVS 4960 A 3D View of an Atmospheric River (MERRA-2)", "NASA", "model", ("merra2",))
EIC_PATTERNS = Dataset("eic_patterns", "EIC Content Database preview images (class B: pattern, not values)", "NASA", "measurement")
SVS5425 = Dataset("svs5425", "EIC frames: SVS 5425 Perpetual Ocean 2 (ECCO)", "NASA", "model", ("ecco",))
ECCO = Dataset("ecco", "ECCO ocean state estimate (NASA/JPL)", "NASA", "model", url="https://www.ecco-group.org")
RELATED_MODEL = Dataset("svs_related_model", "SVS related visualizations (model or reanalysis), onboarded by svs.onboard", "NASA", "model")
RELATED_OBS = Dataset("svs_related_obs", "SVS related visualizations (observations), onboarded by svs.onboard", "NASA", "measurement")
SVS13786 = Dataset("svs13786", "SVS 13786 Data Sonification: Caldwell 73 (SYSTEM Sounds; Hubble image)", "NASA", "measurement")
SVS5196 = Dataset("svs5196", "EIC frames: SVS 5196 / 5436 DYAMOND Global Carbon Dioxide", "NASA", "model", ("dyamond",))
SVS4950 = Dataset("svs4950", "EIC frames: SVS 4950 GEDI Forest Height", "NASA", "measurement", ("gedi",))
SVS5669 = Dataset("svs5669", "EIC frames: SVS 5669 / 5572 GEOS Aerosols (GEOS-FP)", "NASA", "model", ("geosfp",))
SVS5011 = Dataset("svs5011", "EIC frames: SVS 5011 Lightning Events Detected from the ISS 2017–2023", "NASA", "measurement", ("isslis",))
SVS5313 = Dataset("svs5313", "EIC frames: SVS 5313 / 5276 / 5475 Change in Night Lights 2012–2023", "NASA", "measurement", ("vnp46a4",))

# NASA source files and services
MUR = Dataset("mur", "MUR SST v4.1 (NASA/JPL PO.DAAC)", "NASA", "measurement", url="https://doi.org/10.5067/GHGMR-4FJ04")
IMERG = Dataset("imerg", "GPM IMERG half-hourly V07 (NASA/JAXA, GES DISC)", "NASA", "measurement", url="https://doi.org/10.5067/GPM/IMERG/3B-HH/07")
GIBS_MUR = Dataset("gibs_mur", "GIBS MUR SST layer, colormap sourceValue (NASA EOSDIS)", "NASA", "measurement", ("mur",), url="https://nasa-gibs.github.io/gibs-api-docs/")
FIRMS_N21 = Dataset("firms_viirs_noaa21_nrt", "NASA FIRMS VIIRS NOAA-21 NRT", "NASA", "measurement", url="https://firms.modaps.eosdis.nasa.gov/", provider="NASA FIRMS (LANCE/ESDIS)")
FIRMS_N20 = Dataset("firms_viirs_noaa20_nrt", "NASA FIRMS VIIRS NOAA-20 NRT", "NASA", "measurement", url="https://firms.modaps.eosdis.nasa.gov/", provider="NASA FIRMS (LANCE/ESDIS)")
FIRMS_MODIS_NRT = Dataset("firms_modis_nrt", "NASA FIRMS MODIS NRT", "NASA", "measurement", url="https://firms.modaps.eosdis.nasa.gov/", provider="NASA FIRMS (LANCE/ESDIS)")
FIRMS_HISTORY = Dataset("firms_history", "NASA FIRMS archive (MODIS_SP, VIIRS_SNPP_SP)", "NASA", "measurement", url="https://firms.modaps.eosdis.nasa.gov/", provider="NASA FIRMS (LANCE/ESDIS)")
BLACK_MARBLE_N20 = Dataset("vj146a2", "Black Marble VJ146A2, NOAA-20 VIIRS (NASA LAADS)", "NASA", "measurement")
GRACE = Dataset("grace", "GRACE/GRACE-FO JPL mascons RL06.3 v4 (NASA/JPL PO.DAAC)", "NASA", "measurement", url="https://doi.org/10.5067/TEMSC-3JC634")
GISTEMP = Dataset("gistemp", "NASA GISTEMP v4", "NASA", "measurement", url="https://data.giss.nasa.gov/gistemp/", provider="NASA Goddard Institute for Space Studies")
GPCP = Dataset("gpcp", "GPCP v2.3 (via NOAA PSL)", "NASA", "measurement", url="https://psl.noaa.gov/data/gridded/data.gpcp.html")
GPCC = Dataset("gpcc", "GPCC full v2020 rain gauges (DWD, via NOAA PSL)", "other", "measurement", url="https://opendata.dwd.de/climate_environment/GPCC/html/fulldata-monthly_v2020_doi_download.html")
MODIS_NDVI = Dataset("mod13q1", "MODIS MOD13Q1 NDVI (ORNL DAAC)", "NASA", "measurement")
GLOBE = Dataset("globe", "NASA GLOBE Program cloud observations", "ground", "measurement", provider="NASA GLOBE Program")
GEOSCF = Dataset("geoscf", "NASA GEOS-CF composition model (GMAO)", "NASA", "model", url="https://gmao.gsfc.nasa.gov/gmao-products/geos-cf/")
ECCO2 = Dataset("ecco2", "ECCO2 ocean model (MIT/JPL)", "NASA", "model", url="https://www.ecco-group.org")
DYAMOND = Dataset("dyamond", "GEOS–MITgcm DYAMOND coupled nature run (NASA GMAO)", "NASA", "model")
GEDI = Dataset("gedi", "GEDI L2B/L3 canopy height (NASA, ORNL DAAC)", "NASA", "measurement", url="https://doi.org/10.5067/GEDI/GEDI02_B.002")
GEOSFP = Dataset("geosfp", "NASA GEOS-FP forward-processing model (GMAO)", "NASA", "model", url="https://fluid.nccs.nasa.gov/weather/")
MERRA2 = Dataset("merra2", "NASA MERRA-2 reanalysis (GMAO, GES DISC)", "NASA", "model", url="https://gmao.gsfc.nasa.gov/gmao-products/merra-2/")
ISSLIS = Dataset("isslis", "ISS LIS quality-controlled science data V3 (NASA GHRC DAAC)", "NASA", "measurement", url="https://www.earthdata.nasa.gov/data/catalog/ghrc-daac-isslis-v3-fin-3")
VNP46A4 = Dataset("vnp46a4", "Black Marble VNP46A4 v2 annual night lights, S-NPP VIIRS (NASA LAADS)", "NASA", "measurement", url="https://doi.org/10.5067/VIIRS/VNP46A4.002")
OSCAR = Dataset("oscar", "OSCAR L4 surface currents, final v2.0 (ESR, NASA PO.DAAC)", "NASA", "measurement", url="https://doi.org/10.5067/OSCAR-25F20")

# Partner / other agencies
CRW = Dataset("crw", "NOAA Coral Reef Watch SST anomaly and Degree Heating Weeks (5 km)", "NOAA", "measurement", url="https://coastwatch.noaa.gov/erddap/griddap/noaacrwdhwDaily", provider="NOAA Coral Reef Watch")
# Related records that are not SVS pages (pipeline/svs/onboard): the service the record reads
GIBS = Dataset("gibs", "NASA GIBS imagery layers, decoded from each layer's colormap (NASA EOSDIS)", "NASA", "measurement",
               url="https://nasa-gibs.github.io/gibs-api-docs/")
OISST = Dataset("oisst", "NOAA NCEI OISST v2.1 (via NOAA CoastWatch ERDDAP)", "NOAA", "measurement",
                url="https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg_LonPM180")
