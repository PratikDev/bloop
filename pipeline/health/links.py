"""Links: every SVS, CMR, DOI and source link in a record's doc (docs/official/<id>.md, docs/related/<id>.md) and in its
manifest (what the liner notes show) resolves: HTTP 200–399 after redirects. Each unique URL is requested once per run
(HEAD, then GET when a server refuses or drops HEAD), in parallel."""
import json, re
from concurrent.futures import ThreadPoolExecutor
import requests
import urllib3.util.connection
from svs.config import REPO, UA

# IPv4 only (for this process): a host with an IPv6 address this machine cannot route to (www.ncei.noaa.gov on 7 Nov 2026)
# made requests hang until the run's limit, while curl fell back to IPv4 and got 200. Every public server here has IPv4.
urllib3.util.connection.HAS_IPV6 = False
from .files import manifest
from .result import res

URL = re.compile(r"https?://[^\s)\]\"'<>`|,]+")
TIMEOUT = 12
WORKERS = 32
SKIP = ("localhost", "127.0.0.1", "example.com", "{", "opendap.nccs.nasa.gov/dods/")   # templates, and OPeNDAP roots (data endpoints, not pages)

def _clean(u):
    return u.rstrip(".;:!?*_")

def urls_for(rec):
    """Links in the record's doc(s) and manifest."""
    found = []
    for sid in rec.svs_ids:
        for d in ("official", "related"):
            p = REPO / "docs" / d / f"{sid}.md"
            if p.exists(): found += URL.findall(p.read_text(encoding="utf-8"))
    if rec.manifest.endswith("manifest.json") and rec.kind == "official" and rec.layer is None:
        found += URL.findall(json.dumps(manifest(rec.manifest), ensure_ascii=False))
    return sorted({_clean(u) for u in found if not any(s in u for s in SKIP)})

def _probe(url):
    s = requests.Session(); s.headers.update(UA)
    try:
        try: r = s.head(url, allow_redirects=True, timeout=TIMEOUT)
        except requests.ConnectionError: r = None             # some servers close the connection on HEAD and answer GET (NCEI)
        if r is None or r.status_code in (403, 405, 400, 404, 501) or r.status_code >= 500:
            r = s.get(url, allow_redirects=True, timeout=TIMEOUT, stream=True); r.close()
        return r.status_code
    except requests.RequestException as e:
        return f"{e.__class__.__name__}"

def resolve(urls):
    """{url: status code or error name}."""
    urls = sorted(set(urls))
    with ThreadPoolExecutor(WORKERS) as ex:
        return dict(zip(urls, ex.map(_probe, urls)))

def ok(status):
    return isinstance(status, int) and 200 <= status < 400

def refused(status):
    """403: the server refused this client (bot rules, or SVS refusing this machine after a day of fetches). The page may
    well exist and open in a browser, so it is unverified, not broken."""
    return status == 403

def check(rec, statuses):
    us = urls_for(rec)
    if not us: return [res("links resolve", None, "no links")]
    bad = [f"{u} ({statuses.get(u)})" for u in us if not ok(statuses.get(u)) and not refused(statuses.get(u))]
    no = [u for u in us if refused(statuses.get(u))]
    unverified = f"; {len(no)} refused automated requests (403), unverified" if no else ""
    if bad: return [res("links resolve", False, "; ".join(bad[:4]) + (f" (+{len(bad) - 4})" if len(bad) > 4 else "") + unverified)]
    return [res("links resolve", None if no else True, f"{len(us) - len(no)} of {len(us)} links resolve{unverified}")]
