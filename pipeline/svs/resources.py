"""The official Challenge #14 resource list, read from docs/official_resources_links.md (its 'official' table), and the
mapping from every SVS ID to the record that covers it (public/data/official/*/manifest.json svs_ids). Used by the
completeness test and the weekly watch."""
import json, re
from .config import CACHE, LINKS_DOC, PUBLIC_OFFICIAL

def official_rows():
    """[(svs_id or 'EIC-DB', title, link)] from the table under '## Official resources'."""
    text = LINKS_DOC.read_text(encoding="utf-8")
    block = text.split("## Official resources", 1)[1].split("\n## ", 1)[0]
    rows = []
    for line in block.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) >= 3 and (cells[0].isdigit() or cells[0] == "EIC-DB"): rows.append((cells[0], cells[1], cells[2]))
    return rows

def official_ids():
    return [int(r[0]) for r in official_rows() if r[0].isdigit()]

def eic_class_a():
    inv = json.loads((CACHE / "eic_inventory.json").read_text(encoding="utf-8"))
    return [r["id"] for r in inv["items"] if r["class"] == "A"]

def records():
    """{svs_id: manifest} for every official record (a record lists every SVS ID it is built from)."""
    out = {}
    for p in sorted(PUBLIC_OFFICIAL.glob("*/manifest.json")):
        m = json.loads(p.read_text(encoding="utf-8"))
        for sid in m["svs_ids"]: out.setdefault(sid, m)
    return out

SVS_ID_RX = re.compile(r"svs\.gsfc\.nasa\.gov/(?:(\d{4,5})(?=[/\"'\s?#]|$)|vis/a\d{6}/a\d{6}/a0*(\d+)/)")

def ids_in(text):
    return sorted({int(a or b) for a, b in SVS_ID_RX.findall(text)})
