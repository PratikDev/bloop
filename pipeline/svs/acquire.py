"""Shared acquisition steps: a chosen frame set's file list (ordered by frame number) and whole-file fetching of a
subset of it, two polite workers at a time, one failed frame never stopping the run."""
from concurrent.futures import ThreadPoolExecutor
from core.log import say
from . import frames, svs_api

def layer_files(frame_set):
    files = svs_api.list_folder(frame_set["url"], depth=0)["files"]
    return sorted(files, key=lambda r: frames.frame_number(r["name"]))

def run_jobs(work, jobs, workers=2, every=50, label=""):
    done = {"n": 0, "failed": []}
    def safe(job):
        try:
            work(job)
        except Exception as e:
            done["failed"].append(job); say(f"FAILED {label} {job}: {e}")
            return
        done["n"] += 1
        if done["n"] % every == 0: say(f"{label}: {done['n']}/{len(jobs)} done")
    with ThreadPoolExecutor(max_workers=workers) as ex:
        list(ex.map(safe, jobs))
    say(f"{label}: finished {done['n']}/{len(jobs)}; failed {len(done['failed'])} (re-run to retry)")
    return done

def fetch_full(fetcher, files, indices, dest_dir, workers=2, label=""):
    """Whole frames → dest_dir/<name>; skips frames already fetched (manifest) or already decoded (<name>.done)."""
    def work(i):
        f = files[i]
        if (dest_dir / f"{f['name']}.done").exists(): return
        fetcher.get(f["url"], dest_dir / f["name"], expect_bytes=f["bytes"] or 8_000_000)
    return run_jobs(work, list(indices), workers, label=label)
