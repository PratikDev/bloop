"""Three readings of the same ocean points (book §5.3 truth/threeway.json): the EIC frame (SVS 5101), NASA's GIBS MUR
layer decoded through its colormap (`value` intervals in °C; idea G7) and the MUR file itself. Points and MUR values
come from truth/sst_pairs.json (verify_latest.py), so all three share one set of places and one MUR day.
Usage (from pipeline/): python -m products.ocean.threeway"""
import io, json, re
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
from common import PUBLIC
from core.ref import T
from core.header import header, publish_json
from core.log import say, main_guard

LAYER = "GHRSST_L4_MUR_Sea_Surface_Temperature"
WMS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
W, H = 4096, 2048                 # = the 5101 frame's own size, so each point is read at the same pixel

def colormap_href():
    cap = T.http("https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi", params={"SERVICE": "WMTS", "REQUEST": "GetCapabilities"}, timeout=180)
    ns = {"ows": "http://www.opengis.net/ows/1.1"}
    for L in ET.fromstring(cap.content).iter("{http://www.opengis.net/wmts/1.0}Layer"):
        if L.find("ows:Identifier", ns).text == LAYER:
            hrefs = [m.get("{http://www.w3.org/1999/xlink}href") or "" for m in L.findall("ows:Metadata", ns)]
            return sorted(h for h in hrefs if "colormap" in h)[-1]          # newest colormap version
    raise RuntimeError(f"GIBS layer {LAYER} not in capabilities")

def colormap(href):
    """rgb → (low, high) °C for every data entry, the colours of GIBS's own "No Data" map, and the declared units."""
    cm = ET.fromstring(T.http(href, timeout=60).content)
    table, no_data, units = {}, set(), None
    for c in cm.iter():
        if not c.tag.endswith("ColorMap"):
            continue
        if c.get("units"):
            units = c.get("units")
            for e in c.iter():       # "[14.55,14.70)", and the open ends "[-INF,0.00)" / "[32.00,+INF)"
                m = e.get("rgb") and re.match(r"\[([-+\w.]+),([-+\w.]+)\)", e.get("value") or "")
                if m:
                    table[tuple(int(x) for x in e.get("rgb").split(","))] = (float(m.group(1)), float(m.group(2)))
        else:
            no_data |= {tuple(int(x) for x in e.get("rgb").split(",")) for e in c.iter() if e.get("rgb")}
    return table, no_data, units

def main():
    pairs = json.load(open(PUBLIC / "truth" / "sst_pairs.json"))
    day = pairs["check"]["date"]
    href = colormap_href(); table, no_data, units = colormap(href)
    r = T.http(WMS, params=dict(SERVICE="WMS", REQUEST="GetMap", VERSION="1.1.1", LAYERS=LAYER, SRS="EPSG:4326", STYLES="",
                                BBOX="-180,-90,180,90", WIDTH=W, HEIGHT=H, FORMAT="image/png", TIME=day), timeout=300)
    if r.status_code != 200 or not r.headers.get("Content-Type", "").startswith("image/"):
        raise RuntimeError(f"GIBS WMS {r.status_code} {r.headers.get('Content-Type')}")
    img = np.asarray(Image.open(io.BytesIO(r.content)).convert("RGBA"))
    opaque = img[img[:, :, 3] > 0][:, :3]
    sample = opaque[:: max(1, len(opaque) // 20000)]
    known = set(table) | no_data
    decode_share = float(np.mean([tuple(int(x) for x in p) in known for p in sample])) if len(sample) else 0.0
    points = []
    for p in pairs["pairs"]:
        x, y = T.latlon_to_px(p["lat"], p["lon"], W, H)
        rgba = img[y, x]
        lohi = table.get(tuple(int(v) for v in rgba[:3])) if rgba[3] > 0 else None
        bounded = lohi is not None and np.isfinite(lohi).all()
        points.append({"lat": p["lat"], "lon": p["lon"], "frame": p["frame"], "file": p["file"],
                       "gibs": round((lohi[0] + lohi[1]) / 2, 3) if bounded else None,
                       "gibs_bin": [None if not np.isfinite(v) else v for v in lohi] if lohi else None,
                       "gibs_beyond": None if lohi is None or bounded else ("below" if not np.isfinite(lohi[0]) else "above")})
    ok = [q for q in points if q["gibs"] is not None]
    med = lambda a, b: round(float(np.median([abs(q[a] - q[b]) for q in ok])), 3) if ok else None
    bins = sorted({round(h - l, 3) for l, h in table.values() if np.isfinite(h - l)})
    layer_range = [min(l for l, h in table.values() if np.isfinite(l)), max(h for l, h in table.values() if np.isfinite(h))]
    say(f"GIBS {LAYER} {day}: decode {decode_share:.1%}; points with a GIBS value {len(ok)}/{len(points)}; "
        f"median |frame−file| {med('frame', 'file')}, |gibs−file| {med('gibs', 'file')}, |frame−gibs| {med('frame', 'gibs')} {units}")
    publish_json("truth/threeway.json", {
        **header("threeway", pairs["frame_time_utc"]), "units": units, "mur_date": day, "gibs_layer": LAYER,
        "gibs_colormap": href, "gibs_bin_widths": bins, "gibs_range": layer_range, "gibs_decode_share": round(decode_share, 4),
        "summary": {"n": len(points), "n_gibs": len(ok), "n_beyond_gibs_range": sum(q["gibs_beyond"] is not None for q in points),
                    "median_abs_frame_vs_file": med("frame", "file"),
                    "median_abs_gibs_vs_file": med("gibs", "file"), "median_abs_frame_vs_gibs": med("frame", "gibs")},
        "points": points,
    })

if __name__ == "__main__":
    main_guard(main)
