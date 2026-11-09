"""Weekly watch (Part E): (1) the challenge's Resources tab against the official table of docs/official_resources_links.md
(SVS IDs added or removed, and whether the EIC gallery link is still there); (2) the EIC gallery tree, re-read through
the SVS API, against pipeline/svs/cache/eic_inventory.json (items added or removed). Prints a Markdown report and exits
1 when anything differs, so the workflow opens an issue. Run by .github/workflows/official-resources-watch.yml (scheduled
workflows run only from the default branch, main).
Usage (from pipeline/): python -m svs.watch"""
import json, shutil, sys, tempfile
from . import eic, fetch
from .config import CACHE
from .resources import ids_in, official_ids, official_rows

TAB = "https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/?tab=resources"

def resources_tab():
    try:
        html = fetch.text(TAB)
    except Exception as e:                                  # a page we cannot read is reported, never treated as "no change"
        return {"error": f"{e.__class__.__name__}: {e}"}
    on_tab, listed = set(ids_in(html)), set(official_ids())
    if not on_tab:                                           # the list is drawn by script: nothing to compare, say so
        return {"error": "the served page carries no SVS links (its resource list is rendered by script); compare by hand"}
    eic_link = next((r[2] for r in official_rows() if r[0] == "EIC-DB"), "")
    return {"added": sorted(on_tab - listed), "removed": sorted(listed - on_tab), "eic_link_on_tab": bool(eic_link) and eic_link.rstrip("/") in html}

def eic_tree():
    """Crawl with an empty gallery cache (fresh API reads), compare with the committed inventory."""
    tmp = tempfile.mkdtemp()
    saved = {p.name: shutil.copy(p, tmp) for p in CACHE.glob("gallery_*.json")}
    try:
        for p in CACHE.glob("gallery_*.json"): p.unlink()
        now = set(eic.crawl())
    finally:
        for p in CACHE.glob("gallery_*.json"): p.unlink()
        for name in saved: shutil.copy(f"{tmp}/{name}", CACHE / name)
        shutil.rmtree(tmp, ignore_errors=True)
    had = {r["id"] for r in json.loads((CACHE / "eic_inventory.json").read_text(encoding="utf-8"))["items"]}
    return {"added": sorted(now - had), "removed": sorted(had - now)}

def main():
    tab, tree = resources_tab(), eic_tree()
    changed = bool(tab.get("error") or tab.get("added") or tab.get("removed") or not tab.get("eic_link_on_tab", True)
                   or tree["added"] or tree["removed"])
    lines = ["# Official resources watch", "", f"Resources tab: {TAB}", ""]
    lines += ([f"- Could not read the Resources tab: {tab['error']}"] if tab.get("error") else
              [f"- SVS IDs on the tab but not in the official table: {tab['added'] or 'none'}",
               f"- SVS IDs in the official table but not on the tab: {tab['removed'] or 'none'}",
               f"- EIC gallery link still on the tab: {tab['eic_link_on_tab']}"])
    lines += ["", f"EIC gallery ({eic.URL}):", f"- items added since the inventory: {tree['added'] or 'none'}",
              f"- items removed since the inventory: {tree['removed'] or 'none'}", "",
              "Action: " + ("update docs/official_resources_links.md and re-run `python -m svs.eic`, then process new items." if changed else "none.")]
    print("\n".join(lines))
    return 1 if changed else 0

if __name__ == "__main__":
    sys.exit(main())
