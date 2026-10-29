"""Every product the app reads, in one table: outputs, cadence, freshness limit, badges, credit (book §13.3 wording)
and disclosure. core/header.py writes these into each new file; build_freshness.py turns them into
public/data/meta/freshness.json. Products with module=None are built by the core scripts (fetch_latest → build_*)."""
from dataclasses import dataclass
from . import datasets as D

CADENCES = ("daily", "weekly", "static", "live")
PAIRINGS = ("frame-paired", "context")

@dataclass(frozen=True)
class Product:
    id: str
    title: str
    outputs: tuple[str, ...]            # paths under public/data; outputs[0] carries the header
    cadence: str
    pairing: str
    datasets: tuple[D.Dataset, ...]
    credit: str = ""                    # "" = the output file's own `credit` field (core products)
    disclosure: str = ""
    module: str | None = None           # products.<area>.<name>; None = built by a core script
    limit_days: float | None = None     # None = baseline / climatology: never presented as current
    period_keys: tuple[str, str] | None = None   # first and last date in outputs[0], shown instead of an age (baselines)
    time_key: str = "source_time_utc"   # where outputs[0] keeps its newest source time ("a.b.-1.c" paths allowed)

    def __post_init__(self):
        assert self.cadence in CADENCES and self.pairing in PAIRINGS, self.id

SVS_CREDIT = "Visualization: NASA's Scientific Visualization Studio (SVS {id}) for the NASA Earth Information Center."

_ALL = [
    # ---- core (existing files; built by fetch_latest / convert_* / verify_latest / build_*) ----
    Product("sst", "Ocean temperature (EIC frame)", ("latest/sst.json", "latest/sst.bin", "latest/sst.webp"), "daily",
            "frame-paired", (D.SVS5101, D.MUR), limit_days=2, time_key="frame_time_utc"),
    Product("rain", "Rain and snow (EIC frame)", ("latest/rain.json", "latest/rain.bin", "latest/rain_phase.bin", "latest/rain.png"),
            "daily", "frame-paired", (D.SVS4285, D.IMERG), limit_days=2, time_key="frame_time_utc"),
    Product("sequence", "Storm time-lapse (48 EIC frames)", ("sequence/index.json",), "daily", "frame-paired",
            (D.SVS4285,), limit_days=2, time_key="frames.-1.time_utc"),
    Product("grace", "Water storage (GRACE)", ("context/grace.json",), "weekly", "context", (D.GRACE,),
            period_keys=("boxes.Bangladesh.months.0", "boxes.Bangladesh.months.-1")),
    Product("gistemp_bd", "Heat record (GISTEMP)", ("context/gistemp_bd.json",), "static", "context", (D.GISTEMP,),
            period_keys=("cells.Dhaka.months.0", "cells.Dhaka.months.-1")),
    Product("gpcp_bd", "Rain record (GPCP)", ("context/gpcp_bd.json",), "static", "context", (D.GPCP,),
            period_keys=("cells.Dhaka.months.0", "cells.Dhaka.months.-1")),
    Product("gpcc_bd", "Rain-gauge record (GPCC)", ("context/gpcc_bd.json",), "static", "context", (D.GPCC,),
            period_keys=("cells.Dhaka.months.0", "cells.Dhaka.months.-1")),
    Product("firms", "Fires: example years (FIRMS archive)", ("context/firms.json",), "static", "context", (D.FIRMS_HISTORY,)),
    Product("ndvi", "Greenness (MODIS NDVI)", ("context/ndvi.json",), "static", "context", (D.MODIS_NDVI,),
            period_keys=("points.Sundarbans.A.dates.0", "points.Sundarbans.B.dates.-1")),
    Product("globe_bd", "GLOBE cloud observations", ("context/globe_bd.json",), "static", "context", (D.GLOBE,),
            period_keys=("observations.0.Measurement Date (UTC)", "observations.-1.Measurement Date (UTC)")),

    # ---- truth (written by verify_latest.py, which also writes latest_check) ----
    Product("sst_pairs", "Frame vs file: ocean temperature", ("truth/sst_pairs.json",), "daily", "frame-paired", (D.SVS5101, D.MUR),
            credit="Data: MUR SST (NASA/JPL PO.DAAC). " + SVS_CREDIT.format(id=5101),
            disclosure="Each point: the temperature read from the EIC picture and NASA's MUR file at the same place.",
            limit_days=4),
    Product("rain_pairs", "Frame vs file: rain", ("truth/rain_pairs.json",), "daily", "frame-paired", (D.SVS4285, D.IMERG),
            credit="Data: GPM IMERG (NASA/JAXA, GES DISC). " + SVS_CREDIT.format(id=4285),
            disclosure="Each point: the rain rate read from the EIC picture and NASA's IMERG file at the same place and half-hour.",
            limit_days=3),
    Product("threeway", "Three readings of one ocean", ("truth/threeway.json",), "daily", "frame-paired", (D.SVS5101, D.GIBS_MUR, D.MUR),
            module="products.ocean.threeway",
            credit="Data: MUR SST (NASA/JPL PO.DAAC); GIBS (NASA EOSDIS). " + SVS_CREDIT.format(id=5101),
            disclosure="The EIC picture, NASA's GIBS map layer and the MUR file, read at the same points. GIBS and the picture "
                       "are both drawn from MUR, so this checks the decoding, not the ocean.", limit_days=4),

    # ---- ocean ----
    Product("sst_anom", "Ocean temperature vs normal (EIC frame)", ("latest/sst_anom.json", "latest/sst_anom.bin", "latest/sst_anom.webp"),
            "daily", "frame-paired", (D.SVS5176, D.MUR, D.CRW), module="products.ocean.sst_anom",
            credit=SVS_CREDIT.format(id=5176) + " Data: MUR SST (NASA/JPL PO.DAAC). Check: NOAA Coral Reef Watch.",
            disclosure="Anomaly = difference from MUR's own climatology. NOAA Coral Reef Watch uses a different baseline, "
                       "so an offset is expected.", limit_days=5, time_key="frame_time_utc"),
    Product("sst_dt", "Hours since a clear look (MUR)", ("latest/sst_dt.json", "latest/sst_dt.bin"), "daily", "context", (D.MUR,),
            module="products.ocean.sst_dt", credit="Data: MUR SST v4.1, dt_1km_data (NASA/JPL PO.DAAC).",
            disclosure="Hours between the analysis and the nearest 1 km infrared measurement. Long gaps (often clouds) "
                       "mean the value is filled in from other sensors.", limit_days=3),

    # ---- wildfires ----
    Product("fwi_class", "Tomorrow's fire weather (EIC frame)", ("latest/fwi_class.json", "latest/fwi_class.bin"), "daily",
            "frame-paired", (D.SVS5315,), module="products.fire.fwi",
            credit=SVS_CREDIT.format(id=5315) + " Data: NASA GISS GlobalFWI (experimental).",
            disclosure="An experimental 1-day forecast (a model), decoded from the picture's six legend classes.",
            limit_days=2, time_key="frame_time_utc"),
    Product("fwi_archive", "Fire-weather archive (our daily copies)", ("context/fwi_archive_index.json",), "daily", "frame-paired",
            (D.SVS5315,), module="products.fire.fwi", credit=SVS_CREDIT.format(id=5315),
            disclosure="SVS keeps no archive of this map, so Bloop saves one copy a day.", limit_days=2),
    Product("fires_frame", "Active fires (EIC frame, picture only)", ("latest/fires.json", "latest/fires.webp"), "daily",
            "frame-paired", (D.SVS5113,), module="products.fire.fires_frame",
            credit=SVS_CREDIT.format(id=5113) + " Data: VIIRS active fires (NASA FIRMS, LANCE/ESDIS).",
            disclosure="Shown as a picture only: its hot pixels agree only moderately with FIRMS, so the sound uses FIRMS counts.",
            limit_days=3, time_key="frame_time_utc"),
    Product("firms_daily", "Fires, recent days (FIRMS NOAA-20/21)", ("context/firms.json",), "daily", "context",
            (D.FIRMS_N21, D.FIRMS_N20, D.FIRMS_MODIS_NRT), module="products.fire.firms_daily",
            credit="NASA FIRMS (LANCE/ESDIS): VIIRS NOAA-21 and NOAA-20, MODIS.",
            disclosure="Daily fire detections in fixed boxes. VIIRS sees many more small fires than MODIS: compare a "
                       "sensor only with itself.", limit_days=2, time_key="daily.source_time_utc"),

    # ---- disasters ----
    Product("landslide_class", "Landslide exposure (EIC frame)", ("latest/landslide_class.json", "latest/landslide_class.bin"),
            "daily", "frame-paired", (D.SVS5584,), module="products.disasters.landslide",
            credit=SVS_CREDIT.format(id=5584) + " Data: NASA LHASA.",
            disclosure="A model nowcast of landslide exposure, decoded from the picture's legend classes.",
            limit_days=2, time_key="frame_time_utc"),

    # ---- energy ----
    Product("nightlights", "Night lights (Black Marble, NOAA-20)", ("context/nightlights.json",), "daily", "context",
            (D.BLACK_MARBLE_N20,), module="products.energy.nightlights",
            credit="NASA Black Marble VJ146A2 (NOAA-20 VIIRS), NASA LAADS DAAC.",
            disclosure="Median of {win}×{win} pixels around each city. Cloudy nights are flagged, not filled: clouds, not blackouts.",
            limit_days=14),

    # ---- official Challenge #14 resources (pipeline/svs; archive records: a period, never an age) ----
    Product("air_5533", "Air (model, Jul–Sep 2024)", ("official/air_5533/manifest.json",), "static", "frame-paired",
            (D.SVS5533, D.GEOSCF), credit=SVS_CREDIT.format(id="5533, 5518") + " Data: NASA GEOS-CF (GMAO), model output.",
            disclosure="Values read from the EIC frames' colours with each species' colorbar: a model run, not measurements.",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("currents_3912", "Currents & SST (model, 2007–08)", ("official/currents_3912/manifest.json",), "static", "frame-paired",
            (D.SVS3912, D.ECCO2, D.OSCAR), credit=SVS_CREDIT.format(id=3912) + " Data: ECCO2 ocean model (MIT/JPL). "
            "Currents voice: NASA OSCAR surface currents (ESR, PO.DAAC).",
            disclosure="Temperature read from the streak colours of a model. The currents you hear are NASA OSCAR surface "
                       "currents for the same days; how the drawn streaks move is visual texture, not water speed.",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("co2_5196", "CO₂ nature run (model, Jan–Mar 2020)", ("official/co2_5196/manifest.json",), "static", "frame-paired",
            (D.SVS5196, D.DYAMOND), credit=SVS_CREDIT.format(id="5196, 5436") + " Data: NASA GEOS–MITgcm DYAMOND nature run (GMAO).",
            disclosure="Relative ppm read from the volume render's colours with its colour and opacity transfer functions; a model "
                       "nature run, averaged along the view.",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("forest_4950", "Forest height (observation, GEDI)", ("official/forest_4950/manifest.json",), "static", "frame-paired",
            (D.SVS4950, D.GEDI), credit=SVS_CREDIT.format(id=4950) + " Data: NASA GEDI (University of Maryland, ORNL DAAC).",
            disclosure="Heights read from a lit 3D globe render with its colorbar; no map position, and the values are not "
                       "verified (pattern only).",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("aerosols_5669", "Aerosols by type (model, 19 Aug 2025)", ("official/aerosols_5669/manifest.json",), "static", "frame-paired",
            (D.SVS5669, D.GEOSFP), credit=SVS_CREDIT.format(id="5669, 5572") + " Data: NASA GEOS-FP (GMAO), model output.",
            disclosure="Aerosol type read from the picture's colours against its key; the key has no values, so density is "
                       "relative. A model, not measurements.",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("lightning_5011", "Lightning from the ISS (observation, 2017–23)", ("official/lightning_5011/manifest.json",), "static",
            "frame-paired", (D.SVS5011, D.ISSLIS), credit=SVS_CREDIT.format(id=5011) + " Data: NASA ISS LIS (GHRC DAAC).",
            disclosure="Flashes counted from the drawn marks, once each when they appear; the movie carries no dates, so the "
                       "times come from its seasons (approximate).",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("lights_5313", "Night lights 2012→2023 (observation)", ("official/lights_5313/manifest.json",), "static", "frame-paired",
            (D.SVS5313, D.VNP46A4), credit=SVS_CREDIT.format(id="5313, 5276, 5475") + " Data: NASA Black Marble (S-NPP VIIRS).",
            disclosure="Direction of change read from the change map's colours (relative: lights out … new lights); the annual "
                       "brightness is the picture's own, not radiance.",
            period_keys=("period.start", "period.end"), time_key="period.end"),
    Product("oscar_3912", "NASA OSCAR surface currents (2007–08)", ("official/currents_3912/manifest.json",), "static", "context",
            (D.OSCAR,), credit="NASA OSCAR L4 surface currents, final v2.0 (ESR, PO.DAAC); full citation in the record's voice sources.",
            disclosure="Satellite-derived surface currents for the same days as the 3912 record, averaged to its cells and steps.",
            period_keys=("period.start", "period.end"), time_key="period.end"),
]

PRODUCTS = {p.id: p for p in _ALL}
assert len(PRODUCTS) == len(_ALL), "duplicate product id"

def by_cadence(cadence):
    """Product modules to run for a cadence, each once and in table order."""
    seen, out = set(), []
    for p in _ALL:
        if p.module and p.module not in seen and (cadence == "all" or p.cadence == cadence):
            seen.add(p.module); out.append(p.module)
    return out
