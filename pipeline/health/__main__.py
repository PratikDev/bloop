"""python -m health [--offline] [--strict] | --rerender   (from pipeline/; npm run health)
Steps 1–3 of the record audit without refreshing anything: inventory and completeness, per-record checks (files,
values, labels, links), freshness against each source, S-NPP status, archive drift.
Writes docs/HEALTH.md and public/data/meta/health.json. --offline skips every network check and only prints (it never
replaces the full report). --strict exits 1 on any
failure (default: 0, so a morning run never blocks on a source being down). --rerender rewrites both reports from the
saved health.json with the current link rules (no network, no browser)."""
import datetime as dt, json, sys, time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict
from . import archive, files, freshness, inventory, labels, links, report, values
from .result import res

def say(msg):
    print(f"[health {time.strftime('%H:%M:%S')}] {msg}", flush=True)

def rerender():
    """docs/HEALTH.md and health.json again from the saved run: each record's link check redone from the stored statuses."""
    doc = json.loads((inventory.DATA / "meta" / "health.json").read_text(encoding="utf-8"))
    recs = {r.id: r for r in inventory.records()}
    for row in doc["records"]:
        if row["id"] in recs and doc.get("links"):
            row["checks"] = [c for c in row["checks"] if c["check"] != "links resolve"] + links.check(recs[row["id"]], doc["links"])
    report.write(doc)
    failed = sum(1 for r in doc["records"] if any(c["ok"] is False for c in r["checks"]))
    say(f"rewrote docs/HEALTH.md and public/data/meta/health.json from the run of {doc['generated_utc']}; {failed} records with a failure")
    return 0

def main(argv):
    if "--rerender" in argv: return rerender()
    offline = "--offline" in argv
    t0 = time.time()
    recs = inventory.records()
    gaps = inventory.problems(recs)
    say(f"inventory: {len(recs)} records; completeness {'OK' if not gaps else f'{len(gaps)} problems'}")
    rows = []
    for r in recs:
        checks = files.check(r)
        vr, _ = values.check(r)
        checks += vr + labels.check(r)
        rows.append({**{k: v for k, v in asdict(r).items() if k != "notes"}, "notes": list(r.notes), "checks": checks})
    hidden = []                                           # kept off the Related shelf (svs/onboard HIDDEN): listed, not played
    for idx in ("official", "related"):
        for row in json.loads((inventory.DATA / idx / "index.json").read_text(encoding="utf-8"))["records"]:
            if row.get("hidden"): hidden.append({"record": row["record"], "title": row["title"], "reason": row["hidden"]})
    say(f"files, values, labels: {sum(len(r['checks']) for r in rows)} checks")
    net = {}
    if not offline:
        all_urls = sorted({u for r in recs for u in links.urls_for(r)})
        with ThreadPoolExecutor(5) as ex:
            jobs = {"links": ex.submit(links.resolve, all_urls), "freshness": ex.submit(freshness.table),
                    "snpp": ex.submit(freshness.snpp), "archive": ex.submit(archive.run, recs)}
            for k, f in jobs.items():
                try: net[k] = f.result()
                except Exception as e: net[k] = None; say(f"{k} failed: {e.__class__.__name__}: {e}")
            say(f"network checks done ({len(all_urls)} links)")
    fresh = {f["record"]: f for f in net.get("freshness") or []}
    for row, r in zip(rows, recs):
        if net.get("links") is not None: row["checks"] += links.check(r, net["links"])
        f = fresh.get(r.id) or fresh.get(r.product or "")
        if f:
            row.update(last_data_utc=f["shipped_utc"], source_latest_utc=f["source_latest_utc"], lag_days=f["lag_days"])
            if f["behind_limit"]: row["checks"].append(res("fresh within its limit", False, f"lag {f['lag_days']} d > limit {f['limit_days']} d"))
        if any(h["record"] == r.id for h in hidden):
            row["app_plays"] = "hidden from the shelf"
    doc = {"generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "seconds": round(time.time() - t0),
           "completeness": gaps, "records": rows, "freshness": net.get("freshness") or [], "snpp": net.get("snpp"),
           "archive": net.get("archive") or [], "links": net.get("links") or {}, "hidden": hidden}
    failed = sum(1 for r in rows if any(c["ok"] is False for c in r["checks"])) + len(gaps)
    if offline:                                          # a partial run never replaces the full report
        for r in rows:
            for c in r["checks"]:
                if c["ok"] is False: say(f"FAIL {r['id']}: {c['check']}: {c['note'][:160]}")
        say(f"offline checks in {doc['seconds']} s; {failed} records with a failure (reports not written)")
        return 1 if "--strict" in argv and failed else 0
    report.write(doc)
    say(f"wrote docs/HEALTH.md and public/data/meta/health.json in {doc['seconds']} s; {failed} records with a failure")
    return 1 if "--strict" in argv and failed else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
