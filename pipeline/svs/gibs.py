"""NASA GIBS (Worldview's imagery service) as data: any raster layer, any date, decoded exactly through the layer's own
colormap XML (v1.3: each entry an RGB and the value interval it stands for) — no OCR, no curve fit. A pixel whose colour
is not an entry (anti-aliasing never happens: GIBS tiles are palette PNGs) or is a no-data entry stays NaN. Layers whose
entries carry labels but no values (classifications) decode to their class index and are 'pattern only'.
  caps      — the EPSG:4326 'best' WMTS capabilities (cached in data_raw/related/gibs_caps.xml);
  mosaic    — every tile of one tile-matrix level (level 1: 0.28125°/px, 3×2 tiles of 512 px), cropped to −180…180, ±90;
  field     — (values H×W float32, info) for a layer and date.
Licence: GIBS imagery is NASA data, 'openly shared, without restriction' (EOSDIS data policy); credit the source product.
Usage: field("GHRSST_L4_MUR_Sea_Surface_Temperature", "2026-10-28")."""
import io, re
import xml.etree.ElementTree as ET
import numpy as np
import requests
from PIL import Image
from .config import UA, raw_dir

CAPS = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml"
NS = {"w": "http://www.opengis.net/wmts/1.0", "ows": "http://www.opengis.net/ows/1.1", "xlink": "http://www.w3.org/1999/xlink"}
DEG_PER_SCALE = 0.28e-3 / 111319.490793                   # OGC: 0.28 mm pixels; metres per degree at the equator
NUM = re.compile(r"[-+]?(?:\d*\.?\d+(?:[eE][-+]?\d+)?|INF)")
_ROOT = None

def caps():
    global _ROOT
    if _ROOT is None:
        p = raw_dir("related") / "gibs_caps.xml"
        if not p.exists(): p.write_bytes(requests.get(CAPS, headers=UA, timeout=300).content)
        _ROOT = ET.parse(p).getroot()
    return _ROOT

def layers():
    return [l.findtext("ows:Identifier", namespaces=NS) for l in caps().iterfind(".//w:Contents/w:Layer", NS)]

def info(layer):
    L = next((l for l in caps().iterfind(".//w:Contents/w:Layer", NS) if l.findtext("ows:Identifier", namespaces=NS) == layer), None)
    if L is None: raise KeyError(f"GIBS has no layer {layer!r}")
    tms = L.find("w:TileMatrixSetLink/w:TileMatrixSet", NS).text
    time = L.find("w:Dimension[ows:Identifier='Time']", NS)
    meta = [m.get(f"{{{NS['xlink']}}}href") for m in L.iterfind("ows:Metadata", NS)]
    return {"id": layer, "title": L.findtext("ows:Title", namespaces=NS), "format": L.findtext("w:Format", namespaces=NS), "tms": tms,
            "template": L.find("w:ResourceURL", NS).get("template"), "default_time": time.findtext("w:Default", namespaces=NS) if time is not None else None,
            "time_values": [v.text for v in time.iterfind("w:Value", NS)] if time is not None else [],
            "colormap": next((u for u in meta if u and "colormaps/v1.3" in u), None)}

def matrices(tms):
    S = next(s for s in caps().iterfind(".//w:Contents/w:TileMatrixSet", NS) if s.findtext("ows:Identifier", namespaces=NS) == tms)
    return [{"id": m.findtext("ows:Identifier", namespaces=NS), "deg": float(m.findtext("w:ScaleDenominator", namespaces=NS)) * DEG_PER_SCALE,
             "tile": int(m.findtext("w:TileWidth", namespaces=NS)), "cols": int(m.findtext("w:MatrixWidth", namespaces=NS)),
             "rows": int(m.findtext("w:MatrixHeight", namespaces=NS))} for m in S.iterfind("w:TileMatrix", NS)]

def colormap(url):
    """{(r, g, b): value} for value entries, {(r, g, b): class index} for label-only entries, and the map's metadata."""
    return parse_colormap(requests.get(url, headers=UA, timeout=120).content)

def parse_colormap(xml):
    root = ET.fromstring(xml)
    lut, classes, units, titles = {}, {}, None, []
    for cm in root.iter("ColorMap"):
        titles.append(cm.get("title")); units = units or cm.get("units")
        for i, e in enumerate(cm.iter("ColorMapEntry")):
            if e.get("transparent") == "true" or e.get("nodata") == "true": continue
            rgb = tuple(int(x) for x in e.get("rgb").split(","))
            v = e.get("value")
            if v:
                nums = [float(x.replace("INF", "inf")) for x in NUM.findall(v)]
                finite = [x for x in nums if np.isfinite(x)]
                if finite: lut[rgb] = float(np.mean(finite)) if len(finite) == len(nums) else finite[0]
            else:
                classes[rgb] = i
    return {"values": lut, "classes": classes, "units": units, "titles": titles}

def mosaic(layer, date, level=1):
    """Global RGBA (row 0 = 90° N, col 0 = 180° W) at one tile-matrix level, cached as a PNG in data_raw."""
    inf = info(layer)
    m = next(x for x in matrices(inf["tms"]) if x["id"] == str(level))
    path = raw_dir("related", "gibs", layer) / f"{date.replace(':', '')}_L{level}.png"     # times carry ':' (not in Windows names)
    if path.exists(): return np.asarray(Image.open(path).convert("RGBA")), m
    ext = "png" if "png" in (inf["format"] or "") else "jpg"
    canvas = np.zeros((m["rows"] * m["tile"], m["cols"] * m["tile"], 4), np.uint8)
    for r in range(m["rows"]):
        for c in range(m["cols"]):
            url = inf["template"].replace("{Time}", date).replace("{TileMatrixSet}", inf["tms"]).replace("{TileMatrix}", str(level)) \
                                 .replace("{TileRow}", str(r)).replace("{TileCol}", str(c)).rsplit(".", 1)[0] + f".{ext}"
            x = requests.get(url, headers=UA, timeout=120)
            if x.status_code != 200 or not x.headers.get("content-type", "").startswith("image"): continue
            canvas[r * m["tile"]:(r + 1) * m["tile"], c * m["tile"]:(c + 1) * m["tile"]] = np.asarray(Image.open(io.BytesIO(x.content)).convert("RGBA"))
    W, H = round(360 / m["deg"]), round(180 / m["deg"])
    out = canvas[:H, :W]
    Image.fromarray(out).save(path)
    return out, m

def field(layer, date, level=1):
    """(values float32 with NaN, info): exact colour → value through the colormap XML."""
    inf = info(layer)
    if not inf["colormap"]: raise ValueError(f"{layer}: no colormap XML (imagery or vector layer): pattern only")
    cmap = colormap(inf["colormap"])
    rgba, m = mosaic(layer, date, level)
    keys = (rgba[..., 0].astype(np.int64) << 16) | (rgba[..., 1].astype(np.int64) << 8) | rgba[..., 2]
    table = cmap["values"] or cmap["classes"]
    ks = np.array([(r << 16) | (g << 8) | b for r, g, b in table], np.int64)
    vs = np.array(list(table.values()), np.float64)
    order = np.argsort(ks); ks, vs = ks[order], vs[order]
    idx = np.clip(np.searchsorted(ks, keys), 0, len(ks) - 1)
    hit = (ks[idx] == keys) & (rgba[..., 3] > 0)
    vals = np.where(hit, vs[idx], np.nan).astype(np.float32)
    opaque = rgba[..., 3] > 0
    return vals, {**inf, "date": date, "level": level, "deg_per_px": m["deg"], "units": cmap["units"], "kind": "values" if cmap["values"] else "classes",
                  "entries": len(table), "matched_share_of_opaque": float(hit[opaque].mean()) if opaque.any() else 0.0,
                  "titles": cmap["titles"]}

def regrid(vals, deg):
    """Area-weighted mean of the decoded pixels in each deg° cell (row 0 = north, col 0 = 180° W); pixel and cell sizes
    need not divide (0.28125° pixels into 1° cells)."""
    import cv2
    size = (int(round(360 / deg)), int(round(180 / deg)))
    ok = np.isfinite(vals)
    s = cv2.resize(np.where(ok, vals, 0).astype(np.float32), size, interpolation=cv2.INTER_AREA)
    n = cv2.resize(ok.astype(np.float32), size, interpolation=cv2.INTER_AREA)
    return np.where(n > 0.25, s / np.maximum(n, 1e-9), np.nan)
