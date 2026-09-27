"""One-time: download Natural Earth 1:50m country borders (public domain) and save ONLY Bangladesh's outline to
pipeline/inputs/context/bangladesh_boundary.geojson, so the GLOBE duet can keep only observations inside Bangladesh.
Usage: python fetch_bd_boundary.py
Expect: 'Bangladesh: N polygon(s); bbox lon ~88.0..92.7, lat ~20.6..26.6' and PASS."""
import json, sys
from common import *

URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
data = json.loads(http_get(URL, timeout=300))
def prop(f, *keys):
    p = {k.lower(): v for k, v in f["properties"].items()}
    return next((p[k] for k in keys if k in p), None)
bd = [f for f in data["features"] if prop(f, "iso_a3", "adm0_a3") == "BGD" or str(prop(f, "admin", "name")).lower() == "bangladesh"]
if len(bd) != 1: sys.exit(f"FAIL: expected exactly one Bangladesh feature, found {len(bd)}")
geom = bd[0]["geometry"]
polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
pts = np.array([pt for poly in polys for ring in poly for pt in ring])
lo0, la0 = pts.min(0); lo1, la1 = pts.max(0)
out = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": "Bangladesh",
       "source": "Natural Earth 1:50m admin-0 countries (public domain)", "url": URL}, "geometry": geom}]}
write_json(INPUTS / "context" / "bangladesh_boundary.geojson", out)
print(f"Bangladesh: {len(polys)} polygon(s); bbox lon {lo0:.2f}..{lo1:.2f}, lat {la0:.2f}..{la1:.2f}")
ok = 87.5 < lo0 < 88.5 and 92.3 < lo1 < 93.0 and 20.3 < la0 < 21.0 and 26.3 < la1 < 26.9
print("PASS - saved inputs/context/bangladesh_boundary.geojson" if ok else "FAIL - bounding box not as expected; paste this output")
sys.exit(0 if ok else 1)
