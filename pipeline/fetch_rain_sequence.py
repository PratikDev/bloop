"""Step 4: the last N half-hourly IMERG frames (default 48 = 24 h) for the storm time-lapse, at 1200x600.
Usage: python fetch_rain_sequence.py [N]"""
import sys, json
from common import *
from fetch_latest import frame_folders, pick_folder, list_files
from convert_rain import invert_rain, write_rain

def main():
    P = load_params(); c = P["rain"]
    n = int(sys.argv[1]) if len(sys.argv) > 1 else c["sequence_frames"]
    variant = json.load(open(WORK / "rain_variant.json"))["variant"] if (WORK / "rain_variant.json").exists() else None
    _, dirs = frame_folders(c["svs_id"])
    folder = pick_folder(dirs, c["folder_must_contain"], c["folder_must_not_contain"])[0]
    files = sorted([f for f in list_files(folder) if date_in(f)], key=date_in)[-n:]
    times = [date_in(f) for f in files]
    gaps = [(times[i] - times[i-1]).total_seconds() / 60 for i in range(1, len(times))]
    print(f"{len(files)} frames: {times[0]:%Y-%m-%d %H:%M} .. {times[-1]:%Y-%m-%d %H:%M} UTC; steps (min): {sorted(set(int(g) for g in gaps))}")
    out = PUBLIC / "sequence"
    for old in out.glob("rain_*"): old.unlink()
    index = []
    for i, f in enumerate(files):
        (RAW / "sequence").mkdir(exist_ok=True)
        local = download(folder + f, RAW / "sequence" / safe_name(f))
        rgb, alpha, rate, phase, d, unmatched, v, _ = invert_rain(local, P, variant=variant)
        stem = f"rain_{i:03d}"
        meta = {"product": "rain_sequence_frame", "index": i, "frame_time_utc": f"{times[i]:%Y-%m-%dT%H:%M:%SZ}",
                "source_file": f, "units": "mm/h", "credit": c["credit"]}
        write_rain(rate, phase, np.dstack([rgb, alpha]).astype(np.uint8), c["sequence_factor"], out, stem, meta, P, compact=True)
        vis = alpha > 0
        index.append({"index": i, "time_utc": meta["frame_time_utc"], "grid": f"{stem}.u8.gz", "png": f"{stem}.png",
                      "unmatched_pct": round(float(unmatched[vis].mean() * 100) if vis.any() else 0.0, 3)})
        print(f"  {stem}  {meta['frame_time_utc']}  unmatched {index[-1]['unmatched_pct']}%")
    write_json(out / "index.json", {"frames": index, "grid": {"width": 3600 // c["sequence_factor"], "height": 1800 // c["sequence_factor"],
                                                              "encoding": "uint8_log_phase (gzip); see any rain_XXX.json for the formula"},
                                    "step_minutes": 30, "credit": c["credit"], "generated_utc": now_utc(),
                                    "colorbar_variant": variant})
    total = sum(f.stat().st_size for f in out.glob("*") if f.is_file())
    print(f"Wrote {len(index)} frames + public/data/sequence/index.json ({total/1e6:.1f} MB)")
    if any(g != 30 for g in gaps): print("  NOTE: the sequence has irregular steps (see above); the app shows each frame's own time.")

if __name__ == "__main__":
    main()