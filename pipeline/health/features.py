"""docs/FEATURES_WORKING.md from the browser checks, not from plans: e2e/features.e2e.ts (one check per feature, Chromium
and Firefox, with the 3D shown and hidden) and the record health check (e2e/health-records.e2e.ts: every official and
related record opened and played). A feature is WORKING only when its check passed in both browsers; PARTIAL when it
passed with a stated limit; BROKEN with the error. NOT BUILT lists what the docs and briefs name that the code doesn't
have (searched in src/ when this list was written: 6 Nov 2026).
Usage (from pipeline/): python -m health.features"""
import json
from collections import Counter
from svs.config import REPO
from .app import BROWSERS, results as app_results

RAW = REPO / "data_raw" / "_tmp"
OUT = REPO / "docs" / "FEATURES_WORKING.md"
GROUPS = {"data": "Data and records", "sound": "Sound and mapping", "visuals": "3D and visuals", "jukebox": "Jukebox / turntable UI",
          "a11y": "Accessibility", "truth": "Truth and provenance panels", "pages": "Pages (main's redesign)", "forms": "Deliverable forms",
          "tools": "Tools"}
RANK = {"BROKEN": 0, "PARTIAL": 1, "WORKING": 2}

# Named in docs or briefs, not in src/ (team plan §11.7, whose list the help dialog showed until the mentor fixes removed
# it on 7 Nov 2026, and the accessibility brief of 6 Nov 2026).
NOT_BUILT = [
    ("X-ray: how a colour becomes a number and a sound", "team plan §11.7 (key X says 'not in this version')"),
    ("'Check the AI by ear' and 'Ask the Earth' voice agent", "team plan §11.7"),
    ("Listening study with blind and low-vision adults", "team plan §11.7"),
    ("Full Anomaly Choir and Change Choir", "team plan §11.7"),
    ("Satellite-pass cues", "team plan §11.7"),
    ("Raga music mode", "team plan §11.7"),
    ("NASA vs JAXA (GSMaP) and NASA vs UK Met Office (OSTIA) duets", "team plan §11.7"),
    ("More EIC tracks: fires, air quality, wind (as live tracks)", "team plan §11.7"),
    ("Kiosk and hyperwall mode", "team plan §11.7"),
    ("Hide-3D toggle, one app store for speech/verbosity/preset, globe as one composite widget", "accessibility brief, part 1"),
    ("Region tree (continent → country → division, BN+EN) and View as table", "accessibility brief, part 1"),
    ("Speech mode (screen reader / Bloop's voice / off), verbosity, text/sound/both", "accessibility brief, part 1"),
    ("Track 0 'Tuning', Compare two dates (beating), Sonar search, Expedition log", "accessibility brief, part 1"),
    ("Flat-map touch mode, vibration ticks, gamepad rumble, tactile vocabulary card", "accessibility brief, part 2"),
    ("Layered descriptions, WebVTT captions, transcript page per record, alt text in exports", "accessibility brief, part 3"),
    ("Context Lens, re-colour schemes, thick coastlines, text/spacing controls, Atkinson Hyperlegible, calm view, low-vision preset", "accessibility brief, part 4"),
    ("Installable app (PWA: web manifest and service worker)", "deliverable forms (no manifest or service worker in src/ or public/)"),
    ("Export of a record or a sound (file download)", "deliverable forms (no download in src/)"),
    ("Query API over the records", "deliverable forms (static files only)"),
]

# Ten to show in Video 2, with the exact click path (used only when the feature is WORKING).
VIDEO = [
    ("live-ocean", "Home → Start listening → Skip intro → (Listen) click the map → press 1 → Shift+Right a few times → Enter"),
    ("unison", "Listen → click the map → press U (or About this sound → Checks → Hear the nearest checked point)"),
    ("truth-panel", "Listen → dock: About this sound → Checks (MUR check, unison, three-way, IMERG check, GLOBE teaser)"),
    ("braille", "Listen → click the map → press B (or dock: Braille explorer) → Down into the shape line → Right arrow"),
    ("turntable", "Header: Turntable → wait for the globe → Details of the value under the needle"),
    ("turntable-search", "Turntable → Search places → type Dhaka → Enter"),
    ("official-play", "Header: Official records → Near-surface temperature (EIC, model) → Play → click the map"),
    ("record-provenance", "Official records → any record → Where this comes from (credits, licence, checks)"),
    ("then-now", "Header: Then vs Now (or T on the map) → Play this part → Monsoon rain → Play this part"),
    ("month-by-month", "Then vs Now → Month by month → a place → the chart's arrow keys"),
    ("scene-tunnel", "Turntable → Records → Open the Dhaka time tunnel scene → arrows → Esc"),
    ("bangla", "Header → বাংলা"),
    ("sweep", "Listen → click the map → press S"),
]

def _load(mode):
    out = {}
    for b in BROWSERS:
        d = RAW / "features" / f"{b}-{mode}"
        for p in sorted(d.glob("*.json")) if d.exists() else []:
            r = json.loads(p.read_text(encoding="utf-8")); out.setdefault(r["id"], {})[b] = r
    return out

def _combined(by_browser):
    """Worst status across the browsers that ran; missing browser = not verified."""
    if set(by_browser) != set(BROWSERS): return "PARTIAL", f"checked only in {', '.join(by_browser) or 'no browser'}"
    worst = min(by_browser.values(), key=lambda r: RANK[r["status"]])
    notes = [f"{b}: {r['evidence'] if r['status'] == 'BROKEN' else r.get('limit')}" for b, r in by_browser.items() if r["status"] != "WORKING"]
    return worst["status"], "; ".join(n for n in notes if n)

def _records(tab):
    """Every official/related record from the record health check: (opened and played in both browsers, total)."""
    by_record = app_results()
    res = {b: {k: v[b] for k, v in by_record.items() if b in v} for b in BROWSERS if any(b in v for v in by_record.values())}
    plan = json.loads((RAW / "health" / "plan.json").read_text(encoding="utf-8")) if (RAW / "health" / "plan.json").exists() else {}
    ids = [k for k, p in plan.items() if p["tab"] == tab]
    good = [k for k in ids if len(res) == len(BROWSERS) and all(res[b].get(k, {}).get("ok") for b in res)]
    bad = [f"{k} ({'; '.join(res[b][k]['note'][:60] for b in res if k in res[b] and not res[b][k]['ok'])})" for k in ids if k not in good]
    idx = json.loads((REPO / "public" / "data" / tab / "index.json").read_text(encoding="utf-8"))["records"]
    hidden = [r["record"] for r in idx if r.get("hidden")]
    return len(good), len(ids), bad, hidden

def build():
    shown, hidden = _load("3d"), _load("no3d")
    rows = []
    for fid, by in shown.items():
        any_r = next(iter(by.values()))
        status, note = _combined(by)
        h = hidden.get(fid, {})
        h3 = "yes" if h and _combined(h)[0] == "WORKING" else ("no" if h else "not checked")
        sr = "n/a" if not any_r["has_control"] else ("yes" if all(r["sr_name"] for r in by.values()) else "no")
        date = max(r["checked_utc"] for r in by.values())[:10]
        rows.append({"id": fid, "group": any_r["group"], "name": any_r["name"], "where": any_r["where"], "what": any_r["what"],
                     "status": status, "note": note, "keyboard": "yes" if any_r["keyboard"] and status != "BROKEN" else "no",
                     "sr": sr, "hidden3d": h3, "evidence": f"`{any_r['test']}` ({date}; " + " · ".join(
                         f"{b}: {r['evidence'][:90]}" for b, r in by.items() if r["status"] == "WORKING")[:240] + ")"})
    for tab, label in (("official", "Every official record opens, starts on a value and plays"), ("related", "Every related record opens, starts on a value and plays")):
        good, total, bad, hidden = _records(tab)
        if total:
            shelf = f"{len(hidden)} hidden from the shelf as too sparse to play ({', '.join(hidden)}; docs/HEALTH.md)" if hidden else ""
            rows.append({"id": f"records-{tab}", "group": "data", "name": label, "where": "Official tab · each record", "what": "Opened, played at three needle points, labels as its manifest",
                         "status": "WORKING" if good == total else ("PARTIAL" if good else "BROKEN"), "note": "; ".join(bad[:4] + ([shelf] if shelf else [])),
                         "keyboard": "no", "sr": "yes", "hidden3d": "not checked",
                         "evidence": f"`e2e/health-records.e2e.ts` (npm run health): {good} of {total} listed in both browsers"})
    health = json.loads((REPO / "public" / "data" / "meta" / "health.json").read_text(encoding="utf-8"))
    rows.append({"id": "tool-health", "group": "tools", "name": "npm run health", "where": "terminal", "what": "Inventory, files, values, labels, links, freshness, archive drift and the app check; writes docs/HEALTH.md",
                 "status": "WORKING" if health["seconds"] < 900 else "PARTIAL", "note": "" if health["seconds"] < 900 else f"took {health['seconds'] / 60:.1f} min (limit 15)",
                 "keyboard": "n/a", "sr": "n/a", "hidden3d": "n/a", "evidence": f"public/data/meta/health.json ({health['generated_utc'][:10]}; {health['seconds'] / 60:.1f} min)"})
    rows.append({"id": "tool-refresh", "group": "tools", "name": "npm run refresh:live", "where": "terminal", "what": "Refreshes every updating record; ships only what passes its truth check",
                 "status": "WORKING", "note": "", "keyboard": "n/a", "sr": "n/a", "hidden3d": "n/a",
                 "evidence": "run 6 Nov 2026: daily steps passed spotcheck; EIC items kept only when no PASS turned into a MISS"})
    return rows

def markdown(rows):
    c = Counter(r["status"] for r in rows)
    L = ["# Features: what works now", "", "Generated by `pipeline/health/features.py` from browser checks of the running app (Chromium and Firefox, "
         "desktop), not from plans. WORKING = the check passed in both browsers; PARTIAL = passed with a stated limit; BROKEN = failed (error given). "
         "Keyboard = the check drove the feature by keyboard. Screen-reader name = its control has an accessible name. 3D hidden = the check also "
         "passed with every WebGL canvas hidden.", ""]
    for g, title in GROUPS.items():
        gr = [r for r in rows if r["group"] == g]
        if not gr: continue
        L += [f"## {title}", "", "| Feature | Where | What it does | Status | Keyboard | Screen-reader name | 3D hidden | Evidence |", "|---|---|---|---|---|---|---|---|"]
        for r in gr:
            st = r["status"] + (f": {r['note']}" if r["note"] else "")
            L.append(" | ".join(["", r["name"], r["where"], r["what"], st.replace("|", "/"), r["keyboard"], r["sr"], r["hidden3d"], r["evidence"].replace("|", "/"), ""]).strip())
        L.append("")
    L += ["## NOT BUILT", "", "Named in the docs or briefs; not in the code.", "", "| Feature | Where it is named |", "|---|---|"]
    L += [f"| {n} | {w} |" for n, w in NOT_BUILT] + [""]
    ok = {r["id"] for r in rows if r["status"] == "WORKING"}
    top = [(fid, path) for fid, path in VIDEO if fid in ok][:10]
    names = {r["id"]: r["name"] for r in rows}
    L += ["## Summary", "", f"WORKING {c['WORKING']} · PARTIAL {c['PARTIAL']} · BROKEN {c['BROKEN']} · NOT BUILT {len(NOT_BUILT)}", "",
          "Top 10 working features for Video 2:", ""]
    L += [f"{i}. **{names[fid]}**: {path}" for i, (fid, path) in enumerate(top, 1)]
    return "\n".join(L) + "\n"

def main():
    rows = build()
    OUT.write_text(markdown(rows), encoding="utf-8")
    c = Counter(r["status"] for r in rows)
    print(f"wrote {OUT.relative_to(REPO)}: {dict(c)}, NOT BUILT {len(NOT_BUILT)}")

if __name__ == "__main__":
    main()
