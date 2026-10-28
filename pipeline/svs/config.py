"""Paths and limits for the official-resources pipeline, defined once. Raw downloads live in data_raw/ (git-ignored,
on the repo's drive); temp files are pointed there too so nothing large lands on the system drive."""
import os
from pathlib import Path
from core import env  # noqa: F401  (.env.local before anything reads a secret)

PIPE = Path(__file__).resolve().parents[1]
REPO = PIPE.parent
DATA_RAW = Path(os.environ.get("BLOOP_DATA_RAW", REPO / "data_raw"))
CACHE = PIPE / "svs" / "cache"
FIXTURES = PIPE / "svs" / "fixtures"
PUBLIC_OFFICIAL = REPO / "public" / "data" / "official"
DOCS_OFFICIAL = REPO / "docs" / "official"
LINKS_DOC = REPO / "docs" / "official_resources_links.md"

RAW_CAP_BYTES = int(float(os.environ.get("BLOOP_RAW_CAP_GB", "20")) * 1e9)
RECORD_BUDGET_BYTES = 25_000_000           # per record in public/data/official/<id>/
SVS = "https://svs.gsfc.nasa.gov"
UA = {"User-Agent": "Bloop-official-resources/1.0 (NASA Space Apps 2026, team PTSD)"}

for d in (DATA_RAW, DATA_RAW / "_tmp", CACHE):
    d.mkdir(parents=True, exist_ok=True)
for k in ("TMP", "TEMP", "TMPDIR"):
    os.environ[k] = str(DATA_RAW / "_tmp")

def raw_dir(*parts):
    p = DATA_RAW.joinpath(*map(str, parts))
    p.mkdir(parents=True, exist_ok=True)
    return p
