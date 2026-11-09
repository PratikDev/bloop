"""Dataset links on SVS pages that no longer resolve, each with its current official URL or None ("link unavailable", the
dataset name kept). Applied to every SVS record as it is read (svs_api.fetch_record), so new manifests carry the fixed
links; `python -m svs.dataset_links` applies it to the manifests already shipped. Checked 7 Nov 2026 (docs/HEALTH.md
listed them as not resolving; each probed again over IPv4, and the replacement probed before it was written here).
Usage (from pipeline/): python -m svs.dataset_links"""
import json
from .config import PUBLIC_OFFICIAL, PUBLIC_RELATED

UNAVAILABLE = "link unavailable"

# dead URL → (replacement or None, why)
FIXES = {
    "http://podaac.jpl.nasa.gov/dataset/MERGED_TP_J1_OSTM_OST_ALL_V51":
        ("https://podaac.jpl.nasa.gov/dataset/MERGED_TP_J1_OSTM_OST_ALL_V51", "PO.DAAC answers only over https (same page)"),
    "https://ghrcdrive.nsstc.nasa.gov/pub/lis/iss/data/science/final/nc/":
        (None, "the ISS LIS Science Data V1 folder does not connect and V1 is no longer in NASA CMR (only V2 and V3), so no DOI to give"),
    "https://tempo.si.edu/":
        ("https://www.cfa.harvard.edu/facilities-technology/telescopes-instruments/tempo",
         "tempo.si.edu fails its TLS handshake; the TEMPO instrument page of the Center for Astrophysics | Harvard & Smithsonian (TEMPO's lead)"),
    "https://www.avl.class.noaa.gov/saa/products/search?datatype_family=JPSS_SND":
        ("https://www.class.noaa.gov/", "the avl.class host does not connect; NOAA CLASS's portal (JPSS Sounder Products, JPSS_SND, is chosen there)"),
    "https://www.avl.class.noaa.gov/saa/products/search?sub_id=0&datatype_family=JPSS_SND&submit.x=17&submit.y=8":
        ("https://www.class.noaa.gov/", "the avl.class host does not connect; NOAA CLASS's portal (JPSS Sounder Products, JPSS_SND, is chosen there)"),
}

def fix_dataset(d):
    """One SVS dataset entry with a dead link replaced in its url and its description; unchanged when nothing is dead."""
    url = d.get("url")
    out = dict(d)
    for old, (new, _) in FIXES.items():
        if out.get("description") and old in out["description"]:
            out["description"] = out["description"].replace(old, new or f"{UNAVAILABLE}: {old}")
    if url in FIXES:
        new, why = FIXES[url]
        out["url"] = new
        if new is None: out["link"] = f"{UNAVAILABLE} ({why})"
    return out

def fix_record(rec):
    """An SVS record (svs_api.normalise form) with its datasets' dead links fixed."""
    return {**rec, "datasets": [fix_dataset(d) for d in rec.get("datasets") or []]} if rec.get("datasets") else rec

def apply_to_shipped():
    """Rewrites the `datasets` of every shipped official and related manifest that holds a dead link; → changed paths."""
    changed = []
    for p in sorted([*PUBLIC_OFFICIAL.glob("*/manifest.json"), *PUBLIC_RELATED.glob("*/manifest.json")]):
        m = json.loads(p.read_text(encoding="utf-8"))
        fixed = [fix_dataset(d) for d in m.get("datasets") or []]
        if fixed != (m.get("datasets") or []):
            m["datasets"] = fixed
            p.write_text(json.dumps(m, indent=1, ensure_ascii=False), encoding="utf-8")
            changed.append(p)
    return changed

if __name__ == "__main__":
    for p in apply_to_shipped(): print(f"fixed dataset links in {p.parent.parent.name}/{p.parent.name}/manifest.json")
