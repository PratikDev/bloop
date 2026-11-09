"""One check result, the shape every health module returns: {"check", "ok", "note"}; ok None = not applicable/not run."""

def res(check, ok, note=""):
    return {"check": check, "ok": None if ok is None else bool(ok), "note": str(note)[:400]}

def failed(results):
    return [r for r in results if r["ok"] is False]
