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

    def __post_init__(self):
        assert self.agency in AGENCIES and self.kind in KINDS, self

    def as_json(self):
        return {"id": self.id, "name": self.name, "agency": self.agency, "kind": self.kind,
                "shares_inputs_with": list(self.shares_inputs_with)}

# EIC frames (SVS)
SVS5101 = Dataset("svs5101", "EIC frame: SVS 5101 sea surface temperature (from MUR)", "NASA", "measurement", ("mur",))
SVS4285 = Dataset("svs4285", "EIC frame: SVS 4285 IMERG precipitation", "NASA", "measurement", ("imerg",))
SVS5176 = Dataset("svs5176", "EIC frame: SVS 5176 SST anomaly (from MUR)", "NASA", "measurement", ("mur",))
SVS5315 = Dataset("svs5315", "EIC frame: SVS 5315 Fire Weather Index, 1-day forecast (NASA GISS GlobalFWI)", "NASA", "model")
SVS5584 = Dataset("svs5584", "EIC frame: SVS 5584 landslide exposure (LHASA)", "NASA", "model")
SVS5113 = Dataset("svs5113", "EIC frame: SVS 5113 VIIRS active fires", "NASA", "measurement", ("firms",))

# NASA source files and services
MUR = Dataset("mur", "MUR SST v4.1 (NASA/JPL PO.DAAC)", "NASA", "measurement")
IMERG = Dataset("imerg", "GPM IMERG half-hourly V07 (NASA/JAXA, GES DISC)", "NASA", "measurement")
GIBS_MUR = Dataset("gibs_mur", "GIBS MUR SST layer, colormap sourceValue (NASA EOSDIS)", "NASA", "measurement", ("mur",))
FIRMS_N21 = Dataset("firms_viirs_noaa21_nrt", "NASA FIRMS VIIRS NOAA-21 NRT", "NASA", "measurement")
FIRMS_N20 = Dataset("firms_viirs_noaa20_nrt", "NASA FIRMS VIIRS NOAA-20 NRT", "NASA", "measurement")
FIRMS_MODIS_NRT = Dataset("firms_modis_nrt", "NASA FIRMS MODIS NRT", "NASA", "measurement")
FIRMS_HISTORY = Dataset("firms_history", "NASA FIRMS archive (MODIS_SP, VIIRS_SNPP_SP)", "NASA", "measurement")
BLACK_MARBLE_N20 = Dataset("vj146a2", "Black Marble VJ146A2, NOAA-20 VIIRS (NASA LAADS)", "NASA", "measurement")
GRACE = Dataset("grace", "GRACE/GRACE-FO JPL mascons RL06.3 v4 (NASA/JPL PO.DAAC)", "NASA", "measurement")
GISTEMP = Dataset("gistemp", "NASA GISTEMP v4", "NASA", "measurement")
GPCP = Dataset("gpcp", "GPCP v2.3 (via NOAA PSL)", "NASA", "measurement")
GPCC = Dataset("gpcc", "GPCC full v2020 rain gauges (DWD, via NOAA PSL)", "other", "measurement")
MODIS_NDVI = Dataset("mod13q1", "MODIS MOD13Q1 NDVI (ORNL DAAC)", "NASA", "measurement")
GLOBE = Dataset("globe", "NASA GLOBE Program cloud observations", "ground", "measurement")

# Partner / other agencies
CRW = Dataset("crw", "NOAA Coral Reef Watch SST anomaly and Degree Heating Weeks (5 km)", "NOAA", "measurement")
