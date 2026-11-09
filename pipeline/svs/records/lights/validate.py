"""Validate 5313 against NASA Black Marble VNP46A4 2012 and 2023 (the product the visualization was made from, so this
tests the decoding) on the tiles truth.py chose from the frame alone. Fixed before any VNP46A4 cell was read:
  lit     — a VIIRS cell is lit when either year reaches LIT_RAD;
  change  — VIIRS log10((r2023 + LIT_RAD) / (r2012 + LIT_RAD)); its sign is the direction;
(a) direction: share of lit cells with a visible frame change (|change| ≥ VISIBLE) whose sign matches VIIRS's
    (provisional ≥ 70 %), also per sign and per tile; (a2) the same for strong change (|change| ≥ STRONG);
(b) Spearman of the frame's change and the VIIRS log ratio over lit decoded cells (no threshold: the scale is relative);
(c) annual frames: Spearman of the frame's brightness and VIIRS radiance in 2012 and in 2023 (no threshold: no colorbar);
(d) Bangladesh: Dhaka, Chattogram (core/places.py) and the Padma Bridge (OSM): frame change and VIIRS radiances.
Usage (from pipeline/): python -m svs.records.lights.validate"""
import json
import numpy as np
from core.log import say
from core.places import CITY_CELLS
from svs import validate as V
from svs.config import raw_dir
from svs.places import CREDIT as OSM_CREDIT, geocode
from . import GRID_DEG, RECORD, SID, STRONG, YEARS
from .truth import COLLECTION, OUT as TRUTH, VISIBLE, tile_name

ROOT = raw_dir(SID)
LIT_RAD = 0.5                    # nW·cm⁻²·sr⁻¹
SOURCE = f"NASA Black Marble VNP46A4 v2, AllAngle_Composite_Snow_Free, {YEARS[0]} and {YEARS[1]} (LAADS {COLLECTION})"

def tile_cells(a, name):
    h, v = int(name[1:3]), int(name[4:6])
    return a[..., v * 100:(v + 1) * 100, h * 100:(h + 1) * 100]

def sign_stats(s, r, keep):
    s, r = s[keep], r[keep]
    agree = np.sign(s) == np.sign(r)
    out = {"n": int(keep.sum()), "agreement": float(agree.mean()) if keep.any() else None}
    for name, m in (("frame_lights_out", s < 0), ("frame_new_lights", s > 0)):
        out[name] = {"n": int(m.sum()), "agreement": float(agree[m].mean()) if m.any() else None}
    return out

def site(lat, lon, change, tiles):
    i, j = int((90 - lat) / GRID_DEG), int((lon + 180) / GRID_DEG)
    name = tile_name(j // 100, i // 100)
    if name not in tiles: return None
    t = tiles[name]; li, lj = i % 100, j % 100
    nb = lambda a: float(np.nanmean(a[max(0, li - 1):li + 2, max(0, lj - 1):lj + 2]))
    return {"tile": name, "frame_change_cell": float(change[i, j]), "frame_change_3x3": float(np.nanmean(change[max(0, i - 1):i + 2, max(0, j - 1):j + 2])),
            f"viirs_{YEARS[0]}_3x3": nb(t[0]), f"viirs_{YEARS[1]}_3x3": nb(t[1]),
            "viirs_log10_ratio_3x3": float(np.log10((nb(t[1]) + LIT_RAD) / (nb(t[0]) + LIT_RAD)))}

def main():
    g = np.load(ROOT / "grid.npz"); ann = np.load(ROOT / "annual.npz")
    years = list(ann["years"])
    meta = json.loads((TRUTH / "vnp46a4.json").read_text(encoding="utf-8"))
    tiles = {t: [np.load(TRUTH / f"{t}_{y}.npz")["radiance"] for y in YEARS] for t in meta["tiles"]}
    S, R, LIT, B = [], [], [], {y: ([], []) for y in YEARS}
    per_tile = {}
    for t, (x12, x23) in tiles.items():
        s = tile_cells(g["change"], t)
        r = np.log10((x23 + LIT_RAD) / (x12 + LIT_RAD))
        lit = (np.fmax(x12, x23) >= LIT_RAD) & np.isfinite(r)
        S.append(s.ravel()); R.append(r.ravel()); LIT.append(lit.ravel())
        per_tile[t] = sign_stats(s, r, lit & (np.abs(np.nan_to_num(s)) >= VISIBLE))
        for y, x in zip(YEARS, (x12, x23)):
            b = tile_cells(ann["brightness"][years.index(y)], t)
            B[y][0].append(b[lit].ravel()); B[y][1].append(x[lit].ravel())
    s, r, lit = np.concatenate(S), np.concatenate(R), np.concatenate(LIT)
    dec = lit & np.isfinite(s)
    vis, strong = dec & (np.abs(np.nan_to_num(s)) >= VISIBLE), dec & (np.abs(np.nan_to_num(s)) >= STRONG)
    a, a2 = sign_stats(s, r, vis), sign_stats(s, r, strong)
    checks = [V.check(RECORD, "a_direction_vnp46a4", f"Direction of change (frame |change| ≥ {VISIBLE}) vs VNP46A4 {YEARS[0]}→{YEARS[1]}",
                      source=SOURCE, threshold="sign agreement ≥ 70 % (provisional)", passed=bool(a["agreement"] is not None and a["agreement"] >= 0.7),
                      metrics={**a, "lit_rad": LIT_RAD, "tiles": meta["tiles"], "per_tile": per_tile},
                      note="Same source data (the visualization was made from Black Marble), so this tests the decoding of direction."),
              V.check(RECORD, "a2_direction_strong", f"Direction of strong change (|change| ≥ {STRONG}) vs VNP46A4", source=SOURCE,
                      threshold="sign agreement ≥ 70 % (provisional)", passed=bool(a2["agreement"] is not None and a2["agreement"] >= 0.7), metrics=a2,
                      note="JPEG chroma subsampling desaturates small lights toward 'no change', so few cells reach this level."),
              V.check(RECORD, "b_rank_change", "Rank of the frame's change vs the VIIRS log ratio (lit decoded cells)", source=SOURCE,
                      passed=None, metrics=dict(zip(("spearman", "n"), V.spearman(s[dec], r[dec]))),
                      note="No threshold: the colorbar has no numbers, so only rank and sign can be compared.")]
    rank = {f"spearman_{y}": V.spearman(np.concatenate(B[y][0]), np.concatenate(B[y][1]))[0] for y in YEARS}
    checks.append(V.check(RECORD, "c_annual_brightness", "Annual frames: brightness vs VNP46A4 radiance, same year (lit cells)", source=SOURCE,
                          passed=None, metrics={**rank, "n": int(lit.sum())}, note="No threshold: the annual frames have no colorbar (relative brightness)."))
    places = {**{k: CITY_CELLS[k] for k in ("Dhaka", "Chattogram")}, "Padma Bridge": geocode("Padma Bridge, Bangladesh")}
    sites = {k: site(lat, lon, g["change"], tiles) for k, (lat, lon) in places.items()}
    checks.append(V.check(RECORD, "d_bangladesh_sites", "Bangladesh: Dhaka, Chattogram and the Padma Bridge (3×3 cells, 0.3°)", source=SOURCE,
                          kind="context", passed=None, metrics=sites, note=f"Context, no threshold. {OSM_CREDIT}"))
    V.save(RECORD, checks)
    say(f"(a) direction: {a['agreement']:.1%} of {a['n']} cells (out {a['frame_lights_out']}, new {a['frame_new_lights']}); "
        f"(a2) strong: {a2['agreement']}; (b) Spearman {checks[2]['metrics']['spearman']:.3f}; (c) {rank}")
    for k, v in sites.items(): say(f"(d) {k}: {v}")

if __name__ == "__main__":
    main()
