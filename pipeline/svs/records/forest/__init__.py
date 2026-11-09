"""SVS 4950 GEDI Forest Height (GEDI on the ISS, Apr 2019 – Apr 2020): a lit, height-exaggerated 3D globe (16:9) with the
colorbar burned in ('Height Above Ground', 0–50 m). The four 3840×2160 print TIFs of the global view with its colorbar
(asset rule: the burned-in colorbar renders) are decoded; the globe view has no flat-map georeference (georef: none)."""

SID = 4950
RECORD = "forest_4950"
BASE = "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004950/"
STILLS = tuple(f"GEDI_global_w_colorbar_{n}_print.tif" for n in ("0230", "0600", "1055", "1900"))
L3 = ("C2153683336-ORNL_CLOUD",
      "https://data.ornldaac.earthdata.nasa.gov/protected/gedi/GEDI_L3_LandSurface_Metrics_V2/data/GEDI03_rh100_mean_2019108_2020287_002_02.tif")
