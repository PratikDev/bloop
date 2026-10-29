"""EIC Content Database class-A items (docs/official/EIC_INVENTORY.md) not already decoded by a Bloop product: the GEOS-FP
Earth Now dashboard layers (rolling 2048×1024 frames, a burned-in date box) and the NRT NDVI. One frame per item; each
becomes record eic_<id>. Validation, where an archive exists: GEOS-FP (same model) at the frame's hour on NCCS OPeNDAP;
the GEOS-CF chemistry layers have none (GEOS-CF v1's archive ends 2 Jan 2026), nor has the NDVI (its key has no values)."""

FP = "https://opendap.nccs.nasa.gov/dods/GEOS-5/fp/0.25_deg/assim/"
FRAME_INDEX = 200                        # of the rolling 372: about two weeks old, so the model archive has the hour
GRID_DEG = 0.5

# id: (short name, unit, model spec or None, why none). Model spec: (collection, variables, combine, scale, offset).
ITEMS = {
    5147: ("Near-surface temperature", "°C", ("tavg1_2d_slv_Nx", ("t2m",), "value", 1.0, -273.15), None),
    5148: ("Near-surface wind speed", "m/s", ("tavg1_2d_slv_Nx", ("u2m", "v2m"), "magnitude", 1.0, 0.0), None),
    5149: ("Precipitation", "mm", ("tavg1_2d_flx_Nx", ("prectot",), "value", 3600.0, 0.0), None),
    5150: ("Near-surface humidity", "g/kg", ("tavg1_2d_slv_Nx", ("qv2m",), "value", 1000.0, 0.0), None),
    5151: ("PM2.5 (GEOS-CF)", "µg/m³", None, "GEOS-CF v1's public archive ends 2 Jan 2026; the frame is from Oct 2026"),
    5152: ("Near-surface ozone (GEOS-CF)", "ppbv", None, "GEOS-CF v1's public archive ends 2 Jan 2026; the frame is from Oct 2026"),
    5153: ("Carbon monoxide (GEOS-CF)", "ppbv", None, "GEOS-CF v1's public archive ends 2 Jan 2026; the frame is from Oct 2026"),
    5154: ("Nitrogen oxides (GEOS-CF)", "ppbv", None, "GEOS-CF v1's public archive ends 2 Jan 2026; the frame is from Oct 2026"),
    5544: ("NDVI, near real time", "relative", None, "the key's labels are words (Low, High): no values to compare"),
}
