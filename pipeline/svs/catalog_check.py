"""Phase 0, data side: every CMR collection and GIBS layer the related-datasets report names, looked up live.
CMR (collections.umm_json): by concept ID, short name (every version) or keyword → concept ID, short name, version, DOI,
temporal extents, title, provider; where the report states a value (period end, DOI) it is compared and the difference
recorded. GIBS: the EPSG:4326 'best' WMTS GetCapabilities, matched against LAYER_GROUPS; each matched raster layer's
colormap XML (v1.3) is fetched and summarised (entries, entries with values, units, value range).
Writes data_raw/related/catalog.json (the summary rows go into related_candidates.json via discover_report.py).
Usage (from pipeline/): python -m svs.catalog_check"""
import json, re
import xml.etree.ElementTree as ET
import requests
from core.log import say
from .config import UA, raw_dir

CMR = "https://cmr.earthdata.nasa.gov/search/collections.umm_json"
GIBS_CAPS = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml"

# The report's "check live" list and every CMR ID it gives. Expected values are the report's own (null = none given).
SHORT_NAMES = ["VNP46A1", "VNP46A2", "VNP46A3", "VNP46A4", "VJ146A1", "VJ146A2", "VJ146A3", "VJ146A4", "VJ246A1", "VJ246A2", "VJ246A3",
               "VJ246A4", "GEDI02_A", "GEDI02_B", "GEDI_L3_LandSurface_Metrics_V2", "GEDI_L4A_AGB_Density_V2_1",
               "GEDI_L4B_Gridded_Biomass_V2_1", "ATL08", "ATL18", "M2I3NVAER", "M2T1NXINT", "M2I1NXINT", "M2T1NXAER", "GPM_3IMERGHHE",
               "GPM_3IMERGHHL", "GPM_3IMERGHH", "GPM_3IMERGDE", "GPM_3IMERGDL", "GPM_3IMERGDF", "ECCO_L4_TEMP_SALINITY_05DEG_DAILY_V4R4",
               "ECCO_L4_OCEAN_VEL_05DEG_DAILY_V4R4", "ECCO_L4_SSH_05DEG_DAILY_V4R4B", "MUR-JPL-L4-GLOB-v4.1", "MUR25-JPL-L4-GLOB-v04.2",
               "AQUARIUS_L3_SSS_SMI_MONTHLY_V5", "AQUARIUS_L3_SSS_SMI_7DAY-RUNNINGMEAN_V5", "SMAP_RSS_L3_SSS_SMI_8DAY-RUNNINGMEAN_V6",
               "SMAP_RSS_L3_SSS_SMI_8DAY-RUNNINGMEAN_V5", "SMAP_JPL_L3_SSS_CAP_8DAY-RUNNINGMEAN_V5", "NASA_SSH_REF_SIMPLE_GRID_V1",
               "SEA_SURFACE_HEIGHT_ALT_GRIDS_L4_2SATS_5DAY_6THDEG_V_JPL2205", "OSCAR_L4_OC_FINAL_V2.0", "OSCAR_L4_OC_INTERIM_V2.0",
               "OSCAR_L4_OC_NRT_V2.0", "OCO2_L2_Lite_FP", "OCO2_GEOS_L3CO2_DAY", "OCO3_L2_Lite_FP", "AIRS3STD", "TEMPO_NO2_L3",
               "TEMPO_O3TOT_L3", "TEMPO_HCHO_L3", "MOD04_L2", "MYD04_L2", "MCD19A2", "OMNO2d", "OMSO2e", "OMPS_NPP_NMSO2_PCA_L2", "MOP03J",
               "CAL_LID_L2_05kmAPro-Standard-V4-51", "AERDB_D3_VIIRS_NOAA20", "AERDB_L2_VIIRS_SNPP", "isslis_v2_fin", "isslis_v3_fin",
               "lohrfc", "lolracts"]
CONCEPTS = {"C1996881146-POCLOUD": {"what": "MUR v4.1", "doi": "10.5067/GHGMR-4FJ04"},
            "C2098858642-POCLOUD": {"what": "OSCAR Final v2.0", "doi": "10.5067/OSCAR-25F20", "end": "2026-01-17"},
            "C2303212754-GHRC_DAAC": {"what": "ISS LIS V2", "doi": "10.5067/LIS/ISSLIS/DATA111", "start": "2017-03-01", "end": "2023-11-16"},
            "C1983762329-GHRC_DAAC": {"what": "TRMM LIS V4", "doi": "10.5067/LIS/LIS/DATA201", "start": "1998-01-01", "end": "2015-04-08"},
            "C1995863244-GHRC_DAAC": {"what": "LIS/OTD HRFC", "doi": "10.5067/LIS/LIS-OTD/DATA302"},
            "C1995863430-GHRC_DAAC": {"what": "LIS/OTD LRACTS", "doi": "10.5067/LIS/LIS-OTD/DATA306"},
            "C1276812821-GES_DISC": {"what": "MERRA-2 M2I1NXINT", "doi": "10.5067/G0U6NGQ3BLE0"},
            "C1276812830-GES_DISC": {"what": "MERRA-2 M2T1NXAER"},
            "C2912085112-GES_DISC": {"what": "OCO-2 Lite FP V11.2r", "doi": "10.5067/70K2B2W8MNGY"},
            "C2723758340-GES_DISC": {"what": "IMERG Early V07", "doi": "10.5067/GPM/IMERG/3B-HH-E/07"},
            "C2723754847-GES_DISC": {"what": "IMERG Final V07", "doi": "10.5067/GPM/IMERG/3B-HH/07"},
            "C2208422957-POCLOUD": {"what": "SMAP JPL SSS CAP 8-day V5"},
            "C3233945000-POCLOUD": {"what": "SWOT L2 LR SSH (D)"}, "C3233942270-POCLOUD": {"what": "SWOT L2 LR SSH Basic (D)"},
            "C2799465428-POCLOUD": {"what": "SWOT L2 LR SSH 2.0 Basic"}}
KEYWORDS = {"ISS LIS V3": "Lightning Imaging Sensor International Space Station V3", "CMS mangrove height": "CMS global mangrove canopy height",
            "SWOT L3/L4": "SWOT Level 3 sea surface height", "ISS LIS backgrounds": "ISS LIS backgrounds",
            "GEDI L3": "GEDI L3 gridded land surface metrics", "GEDI L4A": "GEDI L4A footprint level aboveground biomass density",
            "GEDI L4B": "GEDI L4B gridded aboveground biomass density"}
DOIS = ["10.3334/ORNLDAAC/2299"]                              # GEDI L4B v2.1 per the report

# GIBS: one group per dashboard layer family in the plan (Phase 3); patterns match identifiers.
LAYER_GROUPS = {"Black Marble / VIIRS DNB": r"Black_Marble|DayNightBand", "active fires": r"Thermal_Anomalies|Fires",
                "IMERG rain/snow": r"IMERG", "MUR SST": r"MUR", "LST": r"Land_Surface_Temp", "sea ice": r"Sea_Ice",
                "AOD (MODIS combined)": r"MODIS_Combined_Value_Added_AOD", "OMI aerosol index": r"OMI_Aerosol_Index",
                "AIRS CO": r"AIRS.*(CO_|Carbon_Monoxide)", "Aura NO2": r"OMI_Nitrogen_Dioxide", "SNPP AOD": r"VIIRS_SNPP.*(Aerosol|AOD)",
                "NDVI": r"NDVI", "chlorophyll": r"Chlorophyll", "SMAP SSS": r"SMAP.*(Salinity|SSS)", "lightning (TRMM LIS)": r"LIS|Lightning"}

# Other-agency routes (T3): reachable from this machine? (licence text is read where the page states it)
T3_ROUTES = {"NOAA OISST v2.1 ERDDAP": "https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg_LonPM180.das",
             "NOAA GDP hourly drifters ERDDAP": "https://erddap.aoml.noaa.gov/hdb/erddap/tabledap/drifter_hourly_qc.das",
             "NOAA GML Mauna Loa CO2": "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt",
             "JAXA Earth API catalog": "https://data.earth.jaxa.jp/stac/cog/v1/catalog.json",
             "ESA CCI SST v3.0 (CEDA)": "https://catalogue.ceda.ac.uk/uuid/4a9654136a7148e39b7feb56f8bb02d2/",
             "Copernicus Marine GLORYS12": "https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description",
             "Copernicus Marine OSTIA NRT": "https://data.marine.copernicus.eu/product/SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/description",
             "CDS ERA5 single levels": "https://cds.climate.copernicus.eu/api/catalogue/v1/collections/reanalysis-era5-single-levels",
             "ADS CAMS EAC4": "https://ads.atmosphere.copernicus.eu/api/catalogue/v1/collections/cams-global-reanalysis-eac4",
             "Copernicus Data Space (Sentinel-5P)": "https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name%20eq%20%27SENTINEL-5P%27&$top=1",
             "ISRO MOSDAC": "https://www.mosdac.gov.in/", "GHG Center STAC": "https://earth.gov/ghgcenter/api/stac/collections",
             "VEDA STAC": "https://openveda.cloud/api/stac/collections", "NOAA GOES-19 GLM (AWS)": "https://noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=GLM-L2-LCFA/&max-keys=1"}

def routes():
    out = {}
    for k, url in T3_ROUTES.items():
        try:
            r = requests.get(url, headers=UA, timeout=90)
            out[k] = {"url": url, "http": r.status_code, "bytes": len(r.content),
                      "licence": next((m.group(0)[:160] for m in [re.search(r"(?i)(licen[cs]e|CC[- ]BY[^\"<]{0,40}|terms of use)[^<\"]{0,120}", r.text)] if m), None)}
        except Exception as e:
            out[k] = {"url": url, "http": None, "error": f"{e.__class__.__name__}: {str(e)[:100]}"}
    return out

def stac_ids(url):
    """Every collection ID, following the STAC 'next' links."""
    ids = []
    while url:
        js = requests.get(url, headers=UA, timeout=120).json()
        ids += [c["id"] for c in js.get("collections", [])]
        url = next((l["href"] for l in js.get("links", []) if l.get("rel") == "next"), None)
    return sorted(set(ids))

def umm(params):
    r = requests.get(CMR, params={**params, "page_size": 50}, headers=UA, timeout=120)
    r.raise_for_status()
    out = []
    for it in r.json()["items"]:
        u, m = it["umm"], it["meta"]
        spans = [(x.get("BeginningDateTime"), x.get("EndingDateTime")) for t in u.get("TemporalExtents", []) for x in t.get("RangeDateTimes", [])]
        out.append({"concept_id": m["concept-id"], "provider": m["provider-id"], "short_name": u["ShortName"], "version": u["Version"],
                    "doi": (u.get("DOI") or {}).get("DOI"), "title": u.get("EntryTitle"),
                    "start": min((s for s, _ in spans if s), default=None), "end": None if any(e is None for _, e in spans) else max((e for _, e in spans), default=None)})
    return out

def compare(row, exp):
    diff = {}
    if exp.get("doi") and row["doi"] and exp["doi"].lower() != row["doi"].lower(): diff["doi"] = {"report": exp["doi"], "live": row["doi"]}
    for k in ("start", "end"):
        if exp.get(k) and (row[k] or "")[:10] != exp[k]: diff[k] = {"report": exp[k], "live": (row[k] or "ongoing")[:10]}
    return diff

def cmr():
    out = {"concepts": {}, "short_names": {}, "keywords": {}}
    for cid, exp in CONCEPTS.items():
        rows = umm({"concept_id": cid})
        out["concepts"][cid] = {**exp, "found": bool(rows), **(rows[0] if rows else {}), "differs": compare(rows[0], exp) if rows else {}}
    out["short_names_note"] = "GEDI L3/L4 short names are looked up by keyword and DOI below (the guessed names are not CMR's)"
    for sn in SHORT_NAMES:
        rows = sorted(umm({"short_name": sn}), key=lambda r: r["version"])
        out["short_names"][sn] = {"found": bool(rows), "versions": rows, "latest": rows[-1] if rows else None}
    for k, q in KEYWORDS.items():
        out["keywords"][k] = umm({"keyword": q})[:8]
    out["dois"] = {d: umm({"doi": d}) for d in DOIS}
    return out

def colormap(url):
    """GIBS colormap XML v1.3 → entries, value entries, units, value range (None when the layer has no value table)."""
    try:
        root = ET.fromstring(requests.get(url, headers=UA, timeout=120).content)
    except Exception as e:
        return {"error": str(e)[:120]}
    maps = []
    for cm in root.iter("ColorMap"):
        ents = list(cm.iter("ColorMapEntry"))
        vals = [e.get("value") for e in ents if e.get("value") and e.get("transparent") != "true"]
        nums = [float(x) for v in vals for x in re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", v)]
        maps.append({"title": cm.get("title"), "units": cm.get("units"), "entries": len(ents), "value_entries": len(vals),
                     "range": [min(nums), max(nums)] if nums else None})
    return {"maps": maps, "has_values": any(m["value_entries"] for m in maps)}

def gibs():
    caps = ET.fromstring(requests.get(GIBS_CAPS, headers=UA, timeout=300).content)
    ns = {"w": "http://www.opengis.net/wmts/1.0", "ows": "http://www.opengis.net/ows/1.1", "xlink": "http://www.w3.org/1999/xlink"}
    layers = []
    for L in caps.iterfind(".//w:Contents/w:Layer", ns):
        ident = L.findtext("ows:Identifier", namespaces=ns)
        meta = [m.get("{http://www.w3.org/1999/xlink}href") for m in L.iterfind("ows:Metadata", ns)]
        time = L.find("w:Dimension[ows:Identifier='Time']", ns)
        layers.append({"id": ident, "title": L.findtext("ows:Title", namespaces=ns),
                       "format": L.findtext("w:Format", namespaces=ns), "colormap": next((u for u in meta if u and "colormaps/v1.3" in u), None),
                       "time_default": time.findtext("w:Default", namespaces=ns) if time is not None else None,
                       "time_values": [v.text for v in time.iterfind("w:Value", ns)][:3] if time is not None else []})
    out = {"layer_count": len(layers), "groups": {}}
    for g, pat in LAYER_GROUPS.items():
        hits = [l for l in layers if re.search(pat, l["id"])]
        for l in hits[:12]:
            if l["colormap"]: l["colormap_summary"] = colormap(l["colormap"])
        out["groups"][g] = {"pattern": pat, "matches": len(hits), "layers": hits[:12]}
    return out

def main():
    out = {"cmr": cmr()}
    say(f"cmr: {sum(v['found'] for v in out['cmr']['short_names'].values())}/{len(SHORT_NAMES)} short names, "
        f"{sum(v['found'] for v in out['cmr']['concepts'].values())}/{len(CONCEPTS)} concept IDs")
    out["gibs"] = gibs()
    out["routes"] = routes()
    out["stac"] = {k: stac_ids(u) for k, u in (("ghg_center", T3_ROUTES["GHG Center STAC"]), ("veda", T3_ROUTES["VEDA STAC"]))}
    say("routes: " + ", ".join(f"{k} {v.get('http')}" for k, v in out["routes"].items()))
    say(f"gibs: {out['gibs']['layer_count']} layers; " + ", ".join(f"{g} {v['matches']}" for g, v in out["gibs"]["groups"].items()))
    (raw_dir("related") / "catalog.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

if __name__ == "__main__":
    main()
