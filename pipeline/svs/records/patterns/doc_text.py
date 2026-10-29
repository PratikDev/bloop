"""Method and limit sentences for the EIC pattern record's doc; every number is a slot filled from the record's files."""

METHOD = [
    "The {n} EIC class-B items (docs/official/EIC_INVENTORY.md) that no other record or Bloop product covers: for each, its SVS "
    "preview image (the smallest ≥ 1000 px wide), read as brightness on a picture grid {w} cells across.",
]

LIMITS = [
    "Pattern, not values: these pictures have no numeric key or no map position, so nothing here is a measurement.",
]

def slots(m, checks):
    return {"n": len(m["layers"]), "w": m["size"]["choice"]["width"]}
