"""Copernicus Data Space Ecosystem (Sentinel-5P TROPOMI; Copernicus Sentinel data terms): OData catalogue search and
product download. Credentials: CDSE_USERNAME / CDSE_PASSWORD from .env.local (never printed; the access token lives only
in memory). Usage: search(filter) → [product rows]; download(row, path) → path (via a .part file, so an interrupted
download is never reused)."""
import os
import requests
import core.env  # noqa: F401

TOKEN = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CATALOGUE = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
ZIPPER = "https://zipper.dataspace.copernicus.eu/odata/v1/Products({id})/$value"

def token():
    r = requests.post(TOKEN, data={"grant_type": "password", "client_id": "cdse-public",
                                   "username": os.environ["CDSE_USERNAME"], "password": os.environ["CDSE_PASSWORD"]}, timeout=60)
    r.raise_for_status()
    return r.json()["access_token"]

def search(odata_filter, top=50):
    r = requests.get(CATALOGUE, params={"$filter": odata_filter, "$top": top, "$orderby": "ContentDate/Start"}, timeout=120)
    r.raise_for_status()
    return r.json()["value"]

def download(row, path):
    if path.exists(): return path
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_suffix(path.suffix + ".part")
    with requests.get(ZIPPER.format(id=row["Id"]), headers={"Authorization": f"Bearer {token()}"}, stream=True, timeout=600) as r:
        r.raise_for_status()
        with open(part, "wb") as fh:
            for chunk in r.iter_content(1 << 20): fh.write(chunk)
    part.replace(path)
    return path
