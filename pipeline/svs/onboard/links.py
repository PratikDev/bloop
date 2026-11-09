"""Phase 6: keep the 'related' table of docs/official_resources_links.md complete — every SVS ID the related-datasets plan
names and every related record, so that on 13 Nov any of them is promoted to the official table by moving one line.
Existing rows (and their 'Why' text) are kept; new rows say what Bloop holds for the ID (record and status, or the plan
step). The official table and all other text are left as they are.
Usage (from pipeline/): python -m svs.onboard.links"""
import json, re
from ..config import CACHE, LINKS_DOC
from ..discover import API
from ..discover_plan import PLAN
from ..resources import official_ids

HEAD = "## Related items"

def main():
    text = LINKS_DOC.read_text(encoding="utf-8")
    start = text.index(HEAD)
    end = text.index("\n## ", start + len(HEAD)) if "\n## " in text[start + len(HEAD):] else len(text)
    block = text[start:end]
    lines = block.splitlines()
    table = [l for l in lines if l.startswith("|")]
    head, rows = table[:2], table[2:]
    have = {int(c.split("|")[1].strip()) for c in rows if c.split("|")[1].strip().isdigit()}
    reg = {r["svs_id"]: r for r in json.loads((CACHE / "related_records.json").read_text(encoding="utf-8")) if r["svs_id"]}
    official = set(official_ids())
    new = []
    for sid in sorted((set(PLAN) | set(reg)) - have - official):
        p = API / f"{sid}.json"
        title = json.loads(p.read_text(encoding="utf-8")).get("title") if p.exists() else (reg.get(sid) or {}).get("title", "")
        why = (f"record `{reg[sid]['record']}` ({reg[sid]['status']}; {reg[sid]['focus']})" if sid in reg else f"plan {PLAN[sid]} (not ingested)")
        new.append(f"| {sid} | {(title or '').replace('|', '/')} | https://svs.gsfc.nasa.gov/{sid} | {why} |")
    notes = [l for l in lines[1:] if l.strip() and not l.startswith("|")]          # the section's text below its heading
    out = "\n".join([lines[0], "", *head, *rows, *new, "", *notes, ""])
    LINKS_DOC.write_text(text[:start] + out + text[end:], encoding="utf-8")
    print(f"related table: {len(rows)} kept, {len(new)} added")

if __name__ == "__main__":
    main()
