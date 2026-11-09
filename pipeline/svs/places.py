"""Named places the official records need beyond core/places.py, geocoded once with OpenStreetMap Nominatim and cached in
pipeline/svs/cache/geocode.json (coordinates © OpenStreetMap contributors, ODbL; the record credits them)."""
import json
from .config import CACHE
from .fetch import _SESSION

NOMINATIM = "https://nominatim.openstreetmap.org/search"
CREDIT = "Place coordinates © OpenStreetMap contributors (ODbL), via Nominatim."

def geocode(query):
    """(lat, lon) of the first Nominatim hit for `query`, cached by query."""
    path = CACHE / "geocode.json"
    cache = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    if query not in cache:
        r = _SESSION.get(NOMINATIM, params={"q": query, "format": "json", "limit": 1}, timeout=60)          # the session carries the UA
        r.raise_for_status()
        hit = r.json()[0]
        cache[query] = {"lat": float(hit["lat"]), "lon": float(hit["lon"]), "display_name": hit["display_name"], "osm_id": hit.get("osm_id")}
        path.write_text(json.dumps(cache, indent=1, ensure_ascii=False), encoding="utf-8")
    return cache[query]["lat"], cache[query]["lon"]
