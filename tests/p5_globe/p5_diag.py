# P5 diagnostic: what does the GLOBE API actually return?
import urllib.request, urllib.error
URLS = [
 "https://api.globe.gov/search/v1/measurement/protocol/measureddate/?protocols=sky_conditions&startdate=2025-03-01&enddate=2025-03-02&geojson=FALSE&sample=TRUE",
 "https://api.globe.gov/search/v1/measurement/protocol/measureddate/?protocols=sky_conditions&startdate=2025-03-01&enddate=2025-03-02&geojson=TRUE&sample=TRUE",
 "https://api.globe.gov/search/v1/measurement/protocol/measureddate/?protocols=aerosols&startdate=2010-01-01&enddate=2010-01-05&geojson=FALSE&sample=FALSE",
]
for u in URLS:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            body = r.read()
            print(f"\n{u}\n  status {r.status}, final URL {r.geturl()}\n  content-type {r.headers.get('content-type')}, {len(body)} bytes")
            print("  first 300 chars:", body[:300].decode("utf-8", "ignore").replace("\n", " "))
    except urllib.error.HTTPError as e:
        print(f"\n{u}\n  HTTP {e.code}: {e.read()[:300]!r}")
    except Exception as e:
        print(f"\n{u}\n  ERROR {e}")
