"""Phase 4: companion and validation sources (fetched on demand; only small derived grids ever ship). One table, each row
confirmed live where a check exists (catalog.json from catalog_check.py; this module's own route checks), with its rung
on the independence ladder (same model → same family → different model → independent satellite → ground), the access
route, the licence, the account it needs (env var names only) and what in Bloop uses it. Writes
docs/related/COMPANION_SOURCES.md.
Usage (from pipeline/): python -m svs.companions"""
import json
import requests
from core.log import say
from .config import REPO, UA, raw_dir

# (name, CMR short name or route key, rung, access, licence, account env vars, used by)
NASA = [
    ("ECCO V4r4 temperature/salinity (daily 0.5°)", "ECCO_L4_TEMP_SALINITY_05DEG_DAILY_V4R4", "different model (state estimate)", "PO.DAAC cloud", "EOSDIS open", "", "3912 (period ends 2018)"),
    ("ECCO V4r4 ocean velocity", "ECCO_L4_OCEAN_VEL_05DEG_DAILY_V4R4", "different model", "PO.DAAC cloud", "EOSDIS open", "", "3912 flows (to 2018)"),
    ("OSCAR v2.0 Final", "OSCAR_L4_OC_FINAL_V2.0", "independent satellite-derived", "PO.DAAC", "EOSDIS open", "", "3912 currents voice"),
    ("OSCAR v2.0 Interim", "OSCAR_L4_OC_INTERIM_V2.0", "independent satellite-derived", "PO.DAAC", "EOSDIS open", "", "onboarding (currents)"),
    ("OSCAR v2.0 NRT", "OSCAR_L4_OC_NRT_V2.0", "independent satellite-derived", "PO.DAAC", "EOSDIS open", "", "onboarding (currents)"),
    ("MEaSUREs gridded SSH V2205", "SEA_SURFACE_HEIGHT_ALT_GRIDS_L4_2SATS_5DAY_6THDEG_V_JPL2205", "independent satellite", "PO.DAAC", "EOSDIS open", "", "sea-level items"),
    ("NASA-SSH simple grid v1", "NASA_SSH_REF_SIMPLE_GRID_V1", "independent satellite", "PO.DAAC", "EOSDIS open", "", "sea-level items"),
    ("SWOT L2 LR SSH 2.0 Basic", "C2799465428-POCLOUD", "independent satellite", "PO.DAAC", "EOSDIS open", "", "sea-level items"),
    ("MERRA-2 M2T1NXINT (UFLXQV/VFLXQV confirmed in use)", "M2T1NXINT", "reanalysis (same family as GEOS)", "GES DISC cloud OPeNDAP", "USG", "", "4960 IVT check"),
    ("MERRA-2 M2I1NXINT", "M2I1NXINT", "reanalysis", "GES DISC", "USG", "", "water-vapour items"),
    ("MERRA-2 M2T1NXAER", "M2T1NXAER", "same family (GEOS)", "GES DISC", "EOSDIS open", "", "5669 (same-family rung)"),
    ("GEOS-FP tavg3_2d_aer_Nx / inst3_2d_gas_Nx", "route:geosfp", "same model", "NCCS OPeNDAP (since Feb 2026) and portal archive", "NASA open", "", "5669/5572, 5624 smoke"),
    ("GEOS-CF v1 (to 2 Jan 2026)", "route:geoscf", "same model", "NCCS OPeNDAP", "any purpose", "", "5533 (never spliced with v2)"),
    ("TEMPO NO2 L3 V04", "TEMPO_NO2_L3", "independent satellite (North America only)", "ASDC", "EOSDIS", "", "TEMPO items (5142, 5175, 5303)"),
    ("OCO-2 Lite FP V11.2r (newest 11.3r)", "C2912085112-GES_DISC", "independent satellite", "GES DISC cloud OPeNDAP", "USG", "", "5196 gradient"),
    ("AIRS3STD v7.0", "AIRS3STD", "independent satellite", "GES DISC", "EOSDIS open", "", "water vapour / CO"),
    ("IMERG V07 Early (half-hourly)", "GPM_3IMERGHHE", "same product family", "GES DISC; GIBS 30-min layer", "USG", "", "5650, 4372"),
    ("IMERG V07 Late", "GPM_3IMERGHHL", "same product family", "GES DISC", "USG", "", "5650"),
    ("IMERG V07 Final (to Sep 2025)", "GPM_3IMERGHH", "same product family", "GES DISC", "USG", "", "4372 (2015)"),
    ("TRMM LIS V4", "C1983762329-GHRC_DAAC", "independent satellite", "GHRC", "USG", "", "lightning items"),
    ("LIS/OTD HRFC (also on GIBS)", "lohrfc", "independent satellites, other years", "GHRC; GIBS", "USG", "", "5011, 3144"),
    ("LIS/OTD LRACTS (ships an MP4)", "lolracts", "independent satellites", "GHRC", "USG", "", "seasonal lightning"),
    ("ISS LIS V3", "isslis_v3_fin", "independent satellite", "GHRC", "USG", "", "5011"),
    ("Black Marble VNP46A4 (Collection 2)", "VNP46A4", "same product", "LAADS", "EOSDIS open", "", "5313 (sign and rank)"),
    ("Black Marble VJ146A4 (NOAA-20)", "VJ146A4", "same product, other satellite", "LAADS", "EOSDIS open", "", "5313 cross-check"),
    ("Black Marble NOAA-21 (VJ246A2 only)", "VJ246A2", "same product", "LAADS", "EOSDIS open", "", "daily lights"),
    ("GEDI L2A / L2B (v002 used; v003 current)", "GEDI02_B", "same mission, footprints", "LP DAAC", "EOSDIS open", "", "4950"),
    ("GEDI L4B gridded biomass v2.1", "C2792577683-ORNL_CLOUD", "same mission, gridded", "ORNL DAAC", "EOSDIS open", "", "14804 biomass"),
    ("CMS mangrove canopy height", "route:cms_mangrove", "different mission (TanDEM-X + GEDI)", "ORNL DAAC (2251)", "EOSDIS open", "", "Sundarbans context"),
]
STAC = [("GHG Center (37 collections, incl. oco2geos-co2-daygrid-v10r CC0)", "ghg_center", "model assimilating OCO-2", "earth.gov/ghgcenter STAC + raster API", "CC0 / CC-BY per collection", "", "5196, CO2 onboarding"),
        ("VEDA (247 collections)", "veda", "various", "openveda.cloud STAC + raster API", "CC-BY NASA", "", "onboarding (on demand)")]
OTHER = [("JAXA Earth API (115 COG collections: GSMaP daily, GCOM-C LST/NDVI/aerosol, GCOM-W soil moisture)", "JAXA Earth API catalog", "independent satellite (partner)", "data.earth.jaxa.jp STAC, no key", "per dataset in STAC; P-Tree not used (no redistribution)", "", "partner rain duet with IMERG over Bangladesh"),
         ("ESA CCI SST v3.0", "ESA CCI SST v3.0 (CEDA)", "independent satellite (partner)", "CEDA OPeNDAP", "CC BY 4.0", "", "3912 partner SST"),
         ("Copernicus GLORYS12 (GLOBAL_MULTIYEAR_PHY_001_030)", "Copernicus Marine GLORYS12", "different model (at depth)", "copernicusmarine toolbox", "Copernicus Marine licence", "COPERNICUSMARINE_SERVICE_USERNAME, COPERNICUSMARINE_SERVICE_PASSWORD", "5425/5479 at ≥ 600 m (e_glorys12_depth)"),
         ("Copernicus OSTIA NRT", "Copernicus Marine OSTIA NRT", "independent satellite analysis", "copernicusmarine toolbox", "Copernicus Marine licence", "COPERNICUSMARINE_SERVICE_USERNAME, COPERNICUSMARINE_SERVICE_PASSWORD", "live SST (account in place; not wired yet)"),
         ("CAMS EAC4 reanalysis", "ADS CAMS EAC4", "different model", "ADS API (cdsapi)", "CC-BY (since 2 Jul 2025)", "ADSAPI_URL, ADSAPI_KEY", "5533 e_*_cams, 5669 a4/b4_*_cams (different-model rung)"),
         ("ERA5 single levels", "CDS ERA5 single levels", "second reanalysis", "CDS API (cdsapi)", "CC-BY", "CDSAPI_URL, CDSAPI_KEY", "4960 d/e/f_*_era5 (second reanalysis)"),
         ("Sentinel-5P TROPOMI NO2/CO/aerosol index", "Copernicus Data Space (Sentinel-5P)", "independent satellite (covers Bangladesh)", "NASA GES DISC cloud OPeNDAP (C2089270961-GES_DISC; same files); Copernicus Data Space optional (svs/cdse.py: a failed login is one warning and a skip)", "Copernicus Sentinel terms", "Earthdata login; CDSE_USERNAME, CDSE_PASSWORD", "5533 g_nox_tropomi (independent satellite)"),
         ("NOAA OISST v2.1 (ERDDAP; PNG maps)", "NOAA OISST v2.1 ERDDAP", "independent analysis (second agency)", "CoastWatch ERDDAP, no key", "NOAA: free use", "", "rel_oisst pipeline test"),
         ("NOAA GDP hourly drifters (drifter_hourly_qc)", "route:gdp", "in situ (ground rung for currents)", "erddap.aoml.noaa.gov/gdp/erddap, no key", "NOAA", "", "3912 flows (in situ)"),
         ("NOAA GML Mauna Loa CO2 / AGGI", "NOAA GML Mauna Loa CO2", "ground", "gml.noaa.gov text files", "free use with credit", "", "5196 context, 5119, 5126"),
         ("NOAA GOES-19 GLM (Americas only)", "NOAA GOES-19 GLM (AWS)", "independent satellite (no Bangladesh coverage)", "AWS noaa-goes19", "CC0 1.0", "", "lightning context, labelled"),
         ("NOAA WOA23 (1991–2020 normals at depth)", "route:woa23", "independent observations (climatology)", "NCEI THREDDS OPeNDAP, no key", "openly available", "", "5425/5479 depth check"),
         ("ISRO MOSDAC INSAT-3DS rainfall / TPW", "ISRO MOSDAC", "independent satellite (partner)", "MOSDAC (registration)", "terms not read: listed only", "MOSDAC registration (not set up)", "South Asia rain (not used)"),
         ("CSA RADARSAT-1 open images", "route:csa", "independent SAR (greyscale)", "NRCan EODMS", "Government of Canada open data", "", "listed only: no colorbar to read")]
EXTRA_ROUTES = {"gdp": "https://erddap.aoml.noaa.gov/gdp/erddap/tabledap/drifter_hourly_qc.das",
                "woa23": "https://www.ncei.noaa.gov/thredds-ocean/dodsC/woa23/DATA/temperature/netcdf/decav91C0/1.00/woa23_decav91C0_t00_01.nc.dds",
                "geosfp": "https://opendap.nccs.nasa.gov/dods/GEOS-5/fp/0.25_deg/assim/tavg3_2d_aer_Nx.info",
                "geoscf": "https://opendap.nccs.nasa.gov/dods/gmao/geos-cf/assim/chm_tavg_1hr_g1440x721_v1.info",
                "cms_mangrove": "https://cmr.earthdata.nasa.gov/search/collections.json?concept_id=C3170780533-ORNL_CLOUD",
                "csa": "https://www.eodms-sgdot.nrcan-rncan.gc.ca/"}

def live(key, cat):
    sn, con = cat["cmr"]["short_names"], cat["cmr"]["concepts"]
    if key in sn and sn[key]["found"]:
        l = sn[key]["latest"]; return f"{l['concept_id']} v{l['version']}, DOI {l['doi']}, {(l['start'] or '')[:10]} → {(l['end'] or 'ongoing')[:10]}"
    if key in con and con[key]["found"]:
        c = con[key]; return f"{key} v{c['version']}, DOI {c['doi']}, {(c['start'] or '')[:10]} → {(c['end'] or 'ongoing')[:10]}"
    for rows in [*cat["cmr"].get("keywords", {}).values(), *(cat["cmr"].get("dois") or {}).values()]:
        for r in rows:
            if r["concept_id"] == key: return f"{key} v{r['version']}, DOI {r['doi']}, {(r['start'] or '')[:10]} → {(r['end'] or 'ongoing')[:10]}"
    if key in cat.get("stac", {}): return f"{len(cat['stac'][key])} collections listed live"
    if key in cat.get("routes", {}): return f"route HTTP {cat['routes'][key].get('http')}"
    if key.startswith("route:"):
        url = EXTRA_ROUTES[key[6:]]
        try: return f"route HTTP {requests.get(url, headers=UA, timeout=90).status_code}"
        except Exception as e: return f"route unreachable ({e.__class__.__name__})"
    return "not confirmed"

def main():
    cat = json.loads((raw_dir("related") / "catalog.json").read_text(encoding="utf-8"))
    L = ["# Companion and validation sources (Phase 4)", "", "Generated by `pipeline/svs/companions.py` from live checks (CMR, STAC, provider "
         "routes). Raw files are fetched on demand into `data_raw/` and never shipped; only small derived grids reach `public/`. Each row "
         "names its rung on the independence ladder: same model → same family → different model → independent satellite → ground.", "",
         "| Source | Live identity | Rung | Access | Licence | Account (env vars) | Used by |", "|---|---|---|---|---|---|---|"]
    for group, rows in (("NASA (T2)", NASA), ("STAC catalogues (T2)", STAC), ("Other agencies (T3)", OTHER)):
        L.append(f"| **{group}** | | | | | | |")
        for name, key, rung, access, lic, acct, used in rows:
            L.append(f"| {name} | {live(key, cat)} | {rung} | {access} | {lic} | {acct or 'none'} | {used} |")
    L += ["", "## Accounts in `.env.local` (names only; all set 3 Nov 2026)", "",
          "- `COPERNICUSMARINE_SERVICE_USERNAME`, `COPERNICUSMARINE_SERVICE_PASSWORD` — Copernicus Marine (GLORYS12, OSTIA).",
          "- `CDSAPI_URL` (https://cds.climate.copernicus.eu/api), `CDSAPI_KEY` — Copernicus Climate Data Store (ERA5).",
          "- `ADSAPI_URL` (https://ads.atmosphere.copernicus.eu/api), `ADSAPI_KEY` — Atmosphere Data Store (CAMS EAC4).",
          "- `CDSE_USERNAME`, `CDSE_PASSWORD` — Copernicus Data Space Ecosystem (Sentinel-5P TROPOMI). Optional: the login works "
          "since 3 Nov, and if it fails svs/cdse.py logs one warning and skips; TROPOMI is read from NASA GES DISC with the "
          "Earthdata login (the same files), so nothing depends on it.", "",
          "Not used: JAXA Himawari P-Tree (no redistribution), ESA Swarm audio (no licence: link only)."]
    (REPO / "docs" / "related" / "COMPANION_SOURCES.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    say(f"companions: {len(NASA) + len(STAC) + len(OTHER)} sources")

if __name__ == "__main__":
    main()
