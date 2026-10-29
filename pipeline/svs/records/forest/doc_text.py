"""Method and limit sentences for docs/official/4950.md; every number is a slot filled from the record's files."""

METHOD = [
    "Assets (`docs/official/4950_assets.md`): the four 3840×2160 print TIFs of the global view with its burned-in colorbar.",
    "Colorbar, read from each frame: ticks {ticks}; scale {scale}, {ppm} px per metre. {notes}",
    "Height: chroma-mode inversion (the globe is lit, so brightness follows the light) of land pixels (not blue ocean, not "
    "black space, not the colorbar), max distance {max_dist}; {share} of globe land pixels decode.",
    "No georeference: the stills are 3D globe views with exaggerated height. Layers stay on the picture's own grid.",
]

LIMITS = [
    "Pattern only: the decoded heights do not match GEDI L3 (median {mf} m vs {mg} m, KS {ks}): the lit render decodes mostly "
    "where tall columns face the light, so the decoded histogram is biased toward tall canopy.",
    "No map position: the needle moves across the picture, not across the Earth.",
]

def slots(m, checks):
    cb, a = m["colorbar"], checks["a_height_hist_gedi_l3"]["metrics"]
    return {"ticks": ", ".join(t["text"] for t in cb["ticks"]), "scale": cb["scale"], "ppm": f"{cb.get('px_per_unit', 0):.2f}",
            "notes": " ".join(cb["notes"]), "max_dist": m["decode"]["max_dist"], "share": f"{a['decoded_share_of_globe_land']:.1%}",
            "mf": f"{a['median_decoded_m']:.1f}", "mg": f"{a['median_l3_m']:.1f}", "ks": f"{a['ks']:.2f}"}
