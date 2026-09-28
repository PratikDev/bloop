"""Optional step (additive): the same heat + rain 'then vs now' for every city in the context files.
Output: public/data/demo/cities_then_now.json (CitiesThenNowFile, contract section 13).
Uses build_demo.py's own functions and caption templates, so formatting is identical to the Dhaka demo.
Cities sharing a dataset grid cell: the first city in the list (Dhaka first) is the reference; the others get
same_record_as = that city and a caption sentence saying it is the same record. The reference city's captions are unchanged,
so Dhaka's stay exactly as in Section 16.
Failure handling (this step must never block the pipeline): a city that fails a data check is left out and reported; if Dhaka
fails, or no city succeeds, the old output file is removed (so no stale file disagrees with the Dhaka demo) and the script
exits 1 - run_all.py treats that as a warning."""
import sys
from common import *
from build_demo import load_context, city_blocks, DataCheckError

OUT = PUBLIC / "demo" / "cities_then_now.json"

def main():
    gis, gp, gc, _ = load_context()
    names = list(gis["cells"].keys())
    names = ["Dhaka"] + [n for n in names if n != "Dhaka"] if "Dhaka" in names else names
    def cell(ctx, n): return (ctx["cells"][n]["lat"], ctx["cells"][n]["lon"])
    def sharing(ctx, n): return [o for o in names if o != n and cell(ctx, o) == cell(ctx, n)]
    def reference(ctx, n):                     # first city in the list with the same cell, if it isn't n itself
        first = next(o for o in names if cell(ctx, o) == cell(ctx, n))
        return None if first == n else first
    cities, failed = [], []
    for n in names:
        heat_same = reference(gis, n)
        gp_same, gc_same = reference(gp, n), reference(gc, n)
        rain_same = gp_same if gp_same and gp_same == gc_same else None
        try:
            h, r = city_blocks(n, gis, gp, gc, heat_same, rain_same)
        except (DataCheckError, KeyError, ValueError, ZeroDivisionError) as e:
            failed.append(str(e)); print(f"  SKIPPED {e}"); continue
        h["cell"] = {"lat": gis["cells"][n]["lat"], "lon": gis["cells"][n]["lon"]}
        h["shares_cell_with"] = sharing(gis, n); h["same_record_as"] = heat_same
        for key, ctx, same in (("gpcp", gp, gp_same), ("gpcc", gc, gc_same)):
            r[key]["cell"] = {"lat": ctx["cells"][n]["lat"], "lon": ctx["cells"][n]["lon"]}
            r[key]["shares_cell_with"] = sharing(ctx, n); r[key]["same_record_as"] = same
        cities.append({"name": n, "cross_checked": n == "Dhaka", "heat": h, "rain": r})
        print(f"  {n:10s} {h['caption']}\n  {'':10s} {r['caption']}")
    if not cities or cities[0]["name"] != "Dhaka":
        if OUT.exists(): OUT.unlink()
        print(f"FAIL: Dhaka could not be built ({failed}) - removed any old cities file so it can't disagree with the demo.")
        sys.exit(1)
    write_json(OUT, {
        "title": "Bangladesh cities then vs now",
        "note": "Same method and caption templates as Dhaka. Only Dhaka's heat and rain were cross-checked against independent "
                "records (P1b); other cities are computed, not individually cross-checked. Values come from each dataset's nearest "
                "grid cell, so some cities share a cell (see shares_cell_with / same_record_as) and are then the same record.",
        "water_note": "GRACE water storage is a national record (Bangladesh box); see dhaka_then_now.json water.",
        "cities": cities, "generated_utc": now_utc()})
    print(f"Wrote public/data/demo/cities_then_now.json ({len(cities)} cities)")
    if failed:
        print(f"WARN: {len(failed)} city/cities left out: {failed}"); sys.exit(1)

if __name__ == "__main__":
    main()
