"""EIC Content Database class-A items (docs/official/EIC_INVENTORY.md) not already decoded by a Bloop product: the GEOS-FP
Earth Now dashboard layers (rolling 2048×1024 frames, a burned-in date box) and the NRT NDVI. One frame per item; each
becomes record eic_<id>. Validation, where an archive exists: GEOS-FP (same model) at the frame's hour on NCCS OPeNDAP;
the GEOS-CF chemistry layers against GEOS-CF v2 analysis (same model; v1's archive ends 2 Jan 2026, v2 analysis is on NCCS
OPeNDAP from 4 Aug 2025); the NDVI has none (its key has no values). The model hour must equal the frame's hour (± 1 h)."""

FP = "https://opendap.nccs.nasa.gov/dods/GEOS-5/fp/0.25_deg/assim/"
CF2 = "https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/v2/ana/"
AUTO = "auto"                            # mixing ratio (v/v) → ppbv when the field is < 1e-3, else as stored (as svs.records.air.truth)
FRAME_INDEX = 200                        # of the rolling 372: about two weeks old, so the model archive has the hour
GRID_DEG = 0.5

# id: (short name, unit, model spec or None, why none). Model spec: (collection, variables, combine, scale, offset[, base URL]).
ITEMS = {
    5147: ("Near-surface temperature", "°C", ("tavg1_2d_slv_Nx", ("t2m",), "value", 1.0, -273.15), None),
    5148: ("Near-surface wind speed", "m/s", ("tavg1_2d_slv_Nx", ("u2m", "v2m"), "magnitude", 1.0, 0.0), None),
    5149: ("Precipitation", "mm", ("tavg1_2d_flx_Nx", ("prectot",), "value", 3600.0, 0.0), None),
    5150: ("Near-surface humidity", "g/kg", ("tavg1_2d_slv_Nx", ("qv2m",), "value", 1000.0, 0.0), None),
    5151: ("PM2.5 (GEOS-CF)", "µg/m³", ("chm_tavg_1hr_glo_L1440x721_slv", ("pm25_rh35",), "value", AUTO, 0.0, CF2), None),
    5152: ("Near-surface ozone (GEOS-CF)", "ppbv", ("chm_tavg_1hr_glo_L1440x721_slv", ("o3",), "value", AUTO, 0.0, CF2), None),
    5153: ("Carbon monoxide (GEOS-CF)", "ppbv", ("chm_tavg_1hr_glo_L1440x721_slv", ("co",), "value", AUTO, 0.0, CF2), None),
    5154: ("Nitrogen oxides (GEOS-CF)", "ppbv", ("chm_tavg_1hr_glo_L1440x721_slv", ("no", "no2"), "sum", AUTO, 0.0, CF2), None),
    5544: ("NDVI, near real time", "relative", None, "the key's labels are words (Low, High): no values to compare"),
}

# Per-item decode settings (default: run.MAX_DIST and no fill colour). The NDVI (measured on its 13 Jun 2026 frame): the
# ocean is one flat blue not on the key (62 % of the frame), masked as no data so it does not push the decode into chroma
# mode (which lost every forest); its darkest greens are drawn darker than the key's darkest colour (eastern US 13,49,14
# vs the key's end 2,69,28: 25 apart), so it matches within 30. Snow (255,255,255) and ice (255,235,231) stay > 45 from
# the key and read as no value.
DECODE = {5544: {"max_dist": 30.0, "fill_rgb": ((8, 123, 176),)}}
