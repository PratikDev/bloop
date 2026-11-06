"""python -m health [--offline] [--app] [--strict] | --rerender   (from pipeline/; npm run health runs it with --app)
Steps 1–3 of the record audit without refreshing anything: inventory and completeness, per-record checks (files,
values, labels, links), freshness against each source, S-NPP status, archive drift; with --app, the browser checks
(e2e/health-records.e2e.ts, Chromium and Firefox) read the plan this writes and their results are merged.
Writes docs/HEALTH.md and public/data/meta/health.json. --offline skips every network check and only prints (it never
replaces the full report). --strict exits 1 on any
failure (default: 0, so a morning run never blocks on a source being down). --rerender rewrites both reports from the
saved health.json with the current link rules (no network, no browser)."""
import contextlib, datetime as dt, json, os, shutil, subprocess, sys, time
import requests
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict
from svs.config import DATA_RAW, REPO
from . import archive, files, freshness, inventory, labels, links, report, values
from .app import APP, BROWSERS, results as app_results
from .result import res

PLAN = DATA_RAW / "_tmp" / "health" / "plan.json"
PROD_PORT = 3100
WORKERS = 6                                          # browser pages at once (one record each)

def say(msg):
    print(f"[health {time.strftime('%H:%M:%S')}] {msg}", flush=True)

@contextlib.contextmanager
def production_server():
    """A production build of the app served on PROD_PORT for the browser checks (the dev server compiles each page on
    demand, which made the checks three times slower); stopped afterwards. Falls back to the dev server if the build fails."""
    bun, bunx = shutil.which("bun") or "bun", shutil.which("bunx") or "bunx"        # bun.cmd / bunx.cmd shims on Windows
    say("production build for the app checks")
    if subprocess.run([bun, "run", "build"], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT).returncode:
        say("build failed: the app checks use the dev server"); yield "http://localhost:3000"; return
    url = f"http://localhost:{PROD_PORT}"
    srv = subprocess.Popen([bunx, "next", "start", "-p", str(PROD_PORT)], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    try:
        for _ in range(120):
            try:
                if requests.get(url, timeout=5).ok: break
            except requests.RequestException: time.sleep(1)
        yield url
    finally:                                             # on Windows bunx.cmd is a shim: stop the server's whole tree
        if os.name == "nt": subprocess.run(["taskkill", "/PID", str(srv.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else: srv.terminate()
        try: srv.wait(20)
        except subprocess.TimeoutExpired: srv.kill()

def app_checks(plan):
    """Runs the Playwright spec (it reads PLAN, writes app-<browser>.json); → {record: {browser: result}}."""
    PLAN.parent.mkdir(parents=True, exist_ok=True)
    PLAN.write_text(json.dumps(plan, indent=1), encoding="utf-8")
    for b in BROWSERS: shutil.rmtree(APP / f"app-{b}", ignore_errors=True)
    npx = shutil.which("bunx") or "bunx"
    cmd = [npx, "playwright", "test", "e2e/health-records.e2e.ts", "--workers", str(WORKERS), "--reporter=dot",
           *[f"--project={b}" for b in BROWSERS]]
    with production_server() as url:
        say(f"app checks on {url}: " + " ".join(cmd[1:]))
        subprocess.run(cmd, cwd=REPO, env={**os.environ, "BLOOP_URL": url})
    return app_results()

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
    offline, with_app = "--offline" in argv, "--app" in argv
    t0 = time.time()
    recs = inventory.records()
    gaps = inventory.problems(recs)
    say(f"inventory: {len(recs)} records; completeness {'OK' if not gaps else f'{len(gaps)} problems'}")
    rows, plan = [], {}
    for r in recs:
        checks = files.check(r)
        vr, p = values.check(r)
        checks += vr + labels.check(r)
        rows.append({**{k: v for k, v in asdict(r).items() if k != "notes"}, "notes": list(r.notes), "checks": checks})
    hidden = []                                           # kept off the Related shelf (svs/onboard HIDDEN): listed, not played
    for idx in ("official", "related"):                   # every playable record the app lists, by its index title
        for row in json.loads((inventory.DATA / idx / "index.json").read_text(encoding="utf-8"))["records"]:
            if row.get("hidden"): hidden.append({"record": row["record"], "title": row["title"], "reason": row["hidden"]}); continue
            plan[row["record"]] = {**values.plan_for(f"{idx}/{row['manifest']}"), "title": row["title"], "tab": idx}
    say(f"files, values, labels: {sum(len(r['checks']) for r in rows)} checks; app plan {len(plan)} records")
    net, app = {}, {}
    if not offline:                                      # the browser checks run alongside the network checks
        all_urls = sorted({u for r in recs for u in links.urls_for(r)})
        with ThreadPoolExecutor(5) as ex:
            app_job = ex.submit(app_checks, plan) if with_app else None
            jobs = {"links": ex.submit(links.resolve, all_urls), "freshness": ex.submit(freshness.table),
                    "snpp": ex.submit(freshness.snpp), "archive": ex.submit(archive.run, recs)}
            for k, f in jobs.items():
                try: net[k] = f.result()
                except Exception as e: net[k] = None; say(f"{k} failed: {e.__class__.__name__}: {e}")
            say(f"network checks done ({len(all_urls)} links)")
            app = app_job.result() if app_job else {}
    fresh = {f["record"]: f for f in net.get("freshness") or []}
    for row, r in zip(rows, recs):
        if net.get("links") is not None: row["checks"] += links.check(r, net["links"])
        f = fresh.get(r.id) or fresh.get(r.product or "")
        if f:
            row.update(last_data_utc=f["shipped_utc"], source_latest_utc=f["source_latest_utc"], lag_days=f["lag_days"])
            if f["behind_limit"]: row["checks"].append(res("fresh within its limit", False, f"lag {f['lag_days']} d > limit {f['limit_days']} d"))
        key = r.id if r.id in app else (r.manifest.split("/")[1] if r.manifest.count("/") == 2 and r.kind == "official" else None)
        if key in app:
            got = app[key]
            row["app_plays"] = "yes" if all(v.get("plays") for v in got.values()) and len(got) == len(BROWSERS) else "no"
            for b, v in got.items():
                row["checks"].append(res(f"app ({b}): plays, labels, no console errors", v.get("ok"), v.get("note", "")))
        elif key in plan:
            row["app_plays"] = "not run"
        elif any(h["record"] == r.id for h in hidden):
            row["app_plays"] = "hidden from the shelf"
    doc = {"generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "seconds": round(time.time() - t0),
           "completeness": gaps, "records": rows, "freshness": net.get("freshness") or [], "snpp": net.get("snpp"),
           "archive": net.get("archive") or [], "links": net.get("links") or {}, "hidden": hidden,
           "app": {"summary": f"{sum(1 for v in app.values() if all(x.get('ok') for x in v.values()))} of {len(app)} records pass in "
                              f"{', '.join(BROWSERS)}" if app else None}}
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
