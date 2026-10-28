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
