"""context/nightlights.json (Black Marble VJ146A2, NOAA-20)."""
from .common import header_problems, info, load

def run(check):
    d = load("context/nightlights.json")
    if d is None: return
    probs = header_problems(d, "nightlights")
    if not d["short_name"].startswith("VJ1"):
        probs.append(f"{d['short_name']} is not NOAA-20")
    for n, c in d["cities"].items():
        k = len(c["days"])
        if not (len(c["radiance"]) == len(c["valid_share"]) == len(c["cloud_masked"]) == k):
            probs.append(f"{n} lists differ in length")
        if any((r is None) != m for r, m in zip(c["radiance"], c["cloud_masked"])):
            probs.append(f"{n}: a null radiance must be (only) a cloud-masked night")
    check("context/nightlights.json: NOAA-20, lists aligned, clouds flagged not filled", not probs, f"{probs}")
    dh = d["cities"].get("Dhaka", {})
    clear = [r for r in dh.get("radiance", []) if r is not None]
    info("Black Marble Dhaka (E5 → VJ146A2)", f"{len(clear)} clear nights of {len(dh.get('days', []))}; range "
         f"{min(clear) if clear else None}–{max(clear) if clear else None} nW·cm⁻²·sr⁻¹ (book, S-NPP: ≈ 25–32)")
