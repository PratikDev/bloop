"""Phase 5: sonification precedents as method evidence (not data). For each reference: what it maps to what, quoted
verbatim from its own page (sentences naming pitch, volume, instruments, scanning or notes), the URL, the credit, the
licence where the page or package states one, and whether Bloop's grammar is consistent with it. Bloop's grammar (book
§7): a value sets pitch (exponential: equal steps sound equal), the reading moves in time or under a needle, one voice per
variable, silence where there is no data, model and observation in distinct timbre families.
No audio is downloaded or redistributed. Writes docs/related/SONIFICATION_PRECEDENTS.md.
Usage (from pipeline/): python -m svs.precedents"""
import json, re
import requests
from core.log import say
from .config import REPO, UA
from .discover import record

MAPPING_RX = re.compile(r"pitch|volume|loud|instrument|marimba|glockenspiel|piano|choir|strings|synth|note|tone|frequenc|"
                        r"scan|sweep|left to right|mapped|sonif|melod|chord|drum|bass", re.I)
SVS = (13786, 13893, 13997, 13998, 13999, 13061, 14802)
PAGES = {"Chandra 'A Universe of Sound' (index)": "https://chandra.harvard.edu/sound/index.html",
         "Chandra: Galactic Center sonification": "https://chandra.harvard.edu/sound/gcenter.html",
         "SYSTEM Sounds: NASA's View of Earth, in Music (Earth Day)": "https://www.system-sounds.com/earth-day",
         "SYSTEM Sounds: NASA work (JPL Sound Wall)": "https://www.system-sounds.com/nasa/"}
SOUND_PAGE = re.compile(r'href="(?:https?://chandra\.[a-z.]+)?(?:/sound/)?([a-z0-9_]+)\.html"')   # the index links its pages relatively
PACKAGES = {"STRAUSS": "https://pypi.org/pypi/strauss/json", "Astronify": "https://pypi.org/pypi/astronify/json"}

def sentences(text, rx=MAPPING_RX, n=4):
    flat = " ".join(re.sub(r"<[^>]+>", " ", text or "").split())
    return [s for s in re.split(r"(?<=[.!?])\s+", flat) if rx.search(s) and 20 < len(s) < 400][:n]

def verdict(quotes):
    q = " ".join(quotes).lower()
    pitch = bool(re.search(r"pitch|frequenc|higher|lower", q))
    scan = bool(re.search(r"scan|sweep|left to right|moves|time", q))
    loud = bool(re.search(r"volume|loud|bright", q))
    if pitch and scan: return "consistent: a value sets pitch while the reading moves" + ("; also maps loudness (Bloop keeps level fixed)" if loud else "")
    if pitch: return "partly: value → pitch as in Bloop; no traversal stated"
    if loud: return "differs: loudness carries the value (Bloop uses pitch)"
    return "not stated on the page"

def main():
    rows = []
    for sid in SVS:
        r = record(sid)
        q = sentences(r.get("full_text"))
        rows.append({"what": f"SVS {sid}: {r.get('title')}", "url": r.get("url"), "credit": "; ".join(f"{k}: {', '.join(v[:2])}" for k, v in list(r.get("credits_by_role", {}).items())[:2]),
                     "licence": "SVS: public domain unless noted; music may be licensed (svs.gsfc.nasa.gov/help)", "quotes": q, "verdict": verdict(q)})
    for name, url in PAGES.items():
        try:
            t = requests.get(url, headers=UA, timeout=90).text
            q = sentences(t)
            pages = set(SOUND_PAGE.findall(t)) - {"index"}
            extra = f" ({len(pages)} sonification pages linked)" if "index" in url else ""
            lic = next((m.group(0)[:160] for m in [re.search(r"(?i)(copyright|licen[cs]e|terms of use|all rights reserved)[^<]{0,120}", t)] if m), "not stated")
        except Exception as e:
            q, extra, lic = [], f" (could not read: {e.__class__.__name__})", "unknown"
        rows.append({"what": name + extra, "url": url, "credit": "Chandra X-ray Center (SAO/NASA)" if "chandra" in url else "SYSTEM Sounds (M. Russo, A. Santaguida)",
                     "licence": lic, "quotes": q, "verdict": verdict(q)})
    rows.append({"what": "EIC 'Air Quality Orchestra' touchscreen app", "url": "https://fdlp.gov/sites/default/files/training/20260827-wn-nasa-earth-exhibits-programming-libraries-slides.pdf",
                 "credit": "NASA Earth Information Center", "licence": "no public page", "quotes": [], "verdict": "name only: no public mapping to compare"})
    rows.append({"what": "ESA Swarm: Sound of Earth's magnetic flip", "url": "https://esa.int/ESA_Multimedia/Videos/2024/10/Sound_of_Earth_s_magnetic_flip_41_000_years_ago",
                 "credit": "ESA", "licence": "'No ESA licences available': link only, no remixing", "quotes": [], "verdict": "cited only"})
    for name, url in PACKAGES.items():
        try:
            info = requests.get(url, headers=UA, timeout=60).json()["info"]
            lic = info.get("license_expression") or info.get("license") or next((c.split("::")[-1].strip() for c in info.get("classifiers", []) if c.startswith("License")), "not stated")
            rows.append({"what": f"{name} {info['version']} (Python package, comparator)", "url": f"https://pypi.org/project/{name.lower()}/",
                         "credit": info.get("author") or "", "licence": lic[:60], "quotes": [info.get("summary") or ""],
                         "verdict": "comparator only (not installed; would go to D:\\Jukebox\\tools\\pylib)"})
        except Exception as e:
            rows.append({"what": name, "url": url, "credit": "", "licence": f"could not read ({e.__class__.__name__})", "quotes": [], "verdict": "comparator only"})
    L = ["# Sonification precedents (method evidence, not data)", "", "Generated by `pipeline/svs/precedents.py`. Quotes are verbatim from "
         "each page; no audio is downloaded or redistributed. Bloop's grammar: a value sets pitch (equal steps sound equal), the reading "
         "moves in time or under a needle, one voice per variable, silence where there is no data, model and observation in different "
         "timbre families.", "", "| Reference | What it maps (verbatim) | Credit | Licence | Bloop's grammar |", "|---|---|---|---|---|"]
    for r in rows:
        q = " / ".join(f"“{x}”" for x in r["quotes"]).replace("|", "/") or "—"
        L.append(f"| [{r['what']}]({r['url']}) | {q[:700]} | {r['credit'][:80]} | {r['licence'][:120].replace('|', '/')} | {r['verdict']} |")
    (REPO / "docs" / "related" / "SONIFICATION_PRECEDENTS.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    say(f"precedents: {len(rows)} rows")

if __name__ == "__main__":
    main()
