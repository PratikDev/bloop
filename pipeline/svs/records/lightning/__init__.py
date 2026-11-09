"""SVS 5011 Lightning Events Detected from the ISS (LIS on the ISS, Jan 2017 – Jul 2023, 10-day roving window). The asset
rule's 1920×1080 sphere movie has no flat map; the page's Science On a Sphere movie is a 2:1 equirectangular map of the
same events (4096×2048, 60 fps), so it is the one decoded (docs/official/5011_assets.md, override recorded there).
Lightning events are drawn as yellow dots over a grey base map; there is no colorbar: an event is present or not."""

SID = 5011
RECORD = "lightning_5011"
MOVIE = "https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005011/iss_lightning_sos_yearly_07312023_2048p60.mp4"
ISSLIS = "C3838944284-GHRC_DAAC"           # Quality Controlled ISS LIS Science Data V3 (isslis_v3_fin); its start is the period start
GRID_DEG = 1.0
WINDOW_DAYS = 10
REGIONS = {"Bangladesh": None,             # core/places.py BD_BBOX
           "Congo basin": (10, -5, 30, 5), "Lake Maracaibo": (-72.5, 8.5, -70.5, 11.0), "Himalayan foothills": (70, 27, 90, 33)}

def period():
    """(start, end): ISS LIS V3's first day (CMR) and the movie's own end date (…_07312023_…)."""
    import datetime as dt, re
    from svs import cmr
    begin = cmr.collection(ISSLIS)["TemporalExtents"][0]["RangeDateTimes"][0]["BeginningDateTime"][:10]
    m, d, y = re.search(r"_(\d{2})(\d{2})(\d{4})_", MOVIE).groups()
    utc = dt.timezone.utc
    return dt.datetime.fromisoformat(begin).replace(tzinfo=utc), dt.datetime(int(y), int(m), int(d), tzinfo=utc)

def regions():
    from core.places import BD_BBOX
    return {k: (v or BD_BBOX) for k, v in REGIONS.items()}
