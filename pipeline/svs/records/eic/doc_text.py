"""Method and limit sentences for docs/official/<id>.md of EIC class-A records; every number is a slot filled from the record's files."""

METHOD = [
    "EIC class-A item (docs/official/EIC_INVENTORY.md): one frame ({frame}) of {frame_set}; time from the {how}.",
    "Key {bar}: labels {ticks}, scale {scale}. Values by {mode} inversion (matcher {matcher}, max distance {max_dist}); {decoded} of "
    "map pixels decode; {masked}; 0.5° cell means.",
]

LIMITS = [
    "One frame: the record is a snapshot of a rolling, near-real-time layer, not a time series.",
    "{status}.",
]

def slots(m, checks):
    cb, d = m["colorbar"], m["decode"]
    l = m["layers"][0]
    return {"frame": m["frame"], "frame_set": m["frame_set"], "how": m["frame_times"]["source"], "bar": m["colorbar_file"],
            "ticks": ", ".join(t["text"] for t in cb.get("ticks", [])) or "none (words)", "scale": cb["scale"], "mode": d["mode"],
            "matcher": d["matcher"], "max_dist": d["max_dist"], "decoded": f"{d['decoded_share']:.1%}",
            "masked": ("date box masked" if "w_dates" in m["frame_set"] else "logo and date boxes masked")
                      + "".join(f"; flat fill {'/'.join(map(str, c))} masked as no data" for c in d.get("fill_rgb", [])),
            "status": f"Status: {l['status']}" + (f" ({l['statement']})" if l.get("statement") else "")}
