"""Copernicus Data Space Ecosystem (Sentinel-5P TROPOMI; Copernicus Sentinel data terms): OData catalogue search and
product download. Optional everywhere: if the login fails (no account, wrong password, service down), token() logs one
warning and returns None, and download() skips (returns None); nothing that calls it may fail a refresh. The same
Sentinel-5P files come from NASA GES DISC with the Earthdata login (svs/records/air/tropomi.py).
Credentials: CDSE_USERNAME / CDSE_PASSWORD from .env.local, sent URL-encoded as form data; never printed or logged (the
access token lives only in memory). Usage: search(filter) → [product rows]; token() → str | None;
download(row, path) → path | None (via a .part file, so an interrupted download is never reused)."""
import os
from urllib.parse import urlencode
import requests
import core.env  # noqa: F401
from core.log import say

TOKEN = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CATALOGUE = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
ZIPPER = "https://zipper.dataspace.copernicus.eu/odata/v1/Products({id})/$value"

_warned = False

def _warn_once(reason):
    global _warned
    if not _warned:
        say(f"WARNING: CDSE login unavailable ({reason}); skipping the Copernicus Data Space step")
        _warned = True

def token():
    """An access token, or None (one warning, never the credentials) when the login can't be made."""
    user, password = os.environ.get("CDSE_USERNAME"), os.environ.get("CDSE_PASSWORD")
    if not user or not password:
        _warn_once("CDSE_USERNAME / CDSE_PASSWORD not set")
        return None
    body = urlencode({"client_id": "cdse-public", "grant_type": "password", "username": user, "password": password})
    try:
        r = requests.post(TOKEN, data=body, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=60)
    except requests.RequestException as e:
        _warn_once(type(e).__name__)
        return None
    if r.status_code != 200:
        try:
            detail = r.json().get("error_description") or r.json().get("error") or ""
        except ValueError:
            detail = ""
        _warn_once(f"HTTP {r.status_code}{f': {detail}' if detail else ''}")
        return None
    return r.json().get("access_token")

def search(odata_filter, top=50):
    r = requests.get(CATALOGUE, params={"$filter": odata_filter, "$top": top, "$orderby": "ContentDate/Start"}, timeout=120)
    r.raise_for_status()
    return r.json()["value"]

def download(row, path):
    if path.exists(): return path
    access = token()
    if access is None: return None
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_suffix(path.suffix + ".part")
    try:
        with requests.get(ZIPPER.format(id=row["Id"]), headers={"Authorization": f"Bearer {access}"}, stream=True, timeout=600) as r:
            r.raise_for_status()
            with open(part, "wb") as fh:
                for chunk in r.iter_content(1 << 20): fh.write(chunk)
    except requests.RequestException as e:
        part.unlink(missing_ok=True)
        say(f"WARNING: CDSE download of {row.get('Name', row['Id'])} failed ({type(e).__name__}); skipped")
        return None
    part.replace(path)
    return path
