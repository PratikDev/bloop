"""The official Challenge #14 resource list, read from docs/official_resources_links.md (its 'official' table), and the
mapping from every SVS ID to the record that covers it (public/data/official/*/manifest.json svs_ids). Used by the
completeness test and the weekly watch."""
import json, re
from .config import CACHE, LINKS_DOC, PUBLIC_OFFICIAL, PUBLIC_RELATED, REPO

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
    """{svs_id: manifest} for every official record, then every related record (a record lists every SVS ID it is built
    from). A related ID moved into the official table on the day is covered by its related record: promotion is one line."""
    out = {}
    for p in [*sorted(PUBLIC_OFFICIAL.glob("*/manifest.json")), *sorted(PUBLIC_RELATED.glob("rel_*/manifest.json"))]:
        m = json.loads(p.read_text(encoding="utf-8"))
        for sid in m["svs_ids"]: out.setdefault(sid, m)
    return out

def doc_for(sid):
    """docs/official/<id>.md, or docs/related/<id>.md for an item onboarded as related."""
    for d in (REPO / "docs" / "official", REPO / "docs" / "related"):
        if (d / f"{sid}.md").exists(): return d / f"{sid}.md"
    return None

SVS_ID_RX = re.compile(r"svs\.gsfc\.nasa\.gov/(?:(\d{4,5})(?=[/\"'\s?#]|$)|vis/a\d{6}/a\d{6}/a0*(\d+)/)")

def ids_in(text):
    return sorted({int(a or b) for a, b in SVS_ID_RX.findall(text)})
