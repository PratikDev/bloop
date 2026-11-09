"""Nov 13: diff the revealed resource list against ours. Paste the Resources tab (text or links) into a file; every SVS ID
in it is classed as: already official (docs/official_resources_links.md 'official' table), already a related record
(promote: move its row into the official table — one line), already a live product or official record of another ID,
or new (run python -m svs.onboard <id>). Prints the exact commands.
Usage (from pipeline/): python -m svs.onboard.diff <pasted.txt>"""
import json, re, sys
from ..eic import decoded_by
from ..config import record_dir
from ..resources import ids_in, official_ids, records

def ids(text):
    """SVS links, plus bare 4–5 digit numbers that are not years (1900–2100)."""
    bare = {int(x) for x in re.findall(r"(?<![\d.])(\d{4,5})(?![\d.])", text)}
    return sorted(set(ids_in(text)) | {x for x in bare if not 1900 <= x <= 2100})

def main(path):
    found = ids(open(path, encoding="utf-8").read())
    official, recs, live = set(official_ids()), records(), decoded_by()
    rows = {"official": [], "promote": [], "covered": [], "new": []}
    for sid in found:
        if sid in official: rows["official"].append(sid)
        elif (record_dir(f"rel_{sid}") / "manifest.json").exists(): rows["promote"].append((sid, f"rel_{sid}"))
        elif sid in recs or sid in live: rows["covered"].append((sid, recs[sid]["record"] if sid in recs else f"product {live[sid]}"))
        else: rows["new"].append(sid)
    print(f"{len(found)} SVS IDs in {path}")
    print(f"already official ({len(rows['official'])}): {rows['official']}")
    print(f"related record exists — move its row into the official table ({len(rows['promote'])}): {rows['promote']}")
    print(f"covered by another record or a live product ({len(rows['covered'])}): {rows['covered']}")
    print(f"new ({len(rows['new'])}):")
    for sid in rows["new"]: print(f"  python -m svs.onboard {sid} --frames 3")
    print(json.dumps({k: v for k, v in rows.items()}, default=str))

if __name__ == "__main__":
    main(sys.argv[1])
