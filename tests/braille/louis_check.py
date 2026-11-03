"""BRAILLE_TEST_PROTOCOL.md checks b and c with NVDA's own liblouis (not a screen-reader viewer test).
Translates the value and shape lines Playwright saved (data_raw/_tmp/braille-lines-<browser>.json) exactly as NVDA
2026.3 does: its liblouis.dll and louis module (library.zip), the table list [<table>, "braille-patterns.cti"] and
mode |= dotsIO (braille/regions/base.pyc, louisHelper.pyc), keeping the low 8 bits of each cell as its dots.
  b) every Unicode braille cell (U+2800–U+28FF) in a line must come out as the same dots, one cell for one cell;
  c) numbers, decimal points, units, N/E and times: their cells and what the table back-translates them to.
Usage (from the repo root): python tests/braille/louis_check.py [chromium|firefox]  (NVDA folder: $BLOOP_NVDA)
Writes data_raw/_tmp/louis-check.json and prints a summary."""
import json, os, re, sys
NVDA = os.environ.get("BLOOP_NVDA", r"D:\Jukebox\tools\nvda")
os.add_dll_directory(NVDA)
sys.path.insert(0, os.path.join(NVDA, "library.zip"))
import louis  # noqa: E402  (NVDA's own wrapper, loading NVDA's liblouis.dll)

TABLES = {"UEB grade 1": "en-ueb-g1.ctb", "UEB grade 2": "en-ueb-g2.ctb", "Bengali": "bn.tbl"}
TABLE_DIR = os.path.join(NVDA, "louis", "tables")
BRAILLE = re.compile(r"[\u2800-\u28ff]")
TOKENS = re.compile(r"\d{1,2}:\d{2}|-?\d+(?:\.\d+)?[NSEW]?|deg C|°C|mm/h|ppbv|\(0-1\)|°|[A-Z]{2,}")

def table_list(name):
    return [os.path.join(TABLE_DIR, TABLES[name]), os.path.join(TABLE_DIR, "braille-patterns.cti")]

def translate(name, text):
    braille, _b2r, raw2b, _cur = louis.translate(table_list(name), text, mode=louis.dotsIO)
    return "".join(chr(0x2800 | (ord(c) & 0xFF)) for c in braille), raw2b

def back(name, cells):
    try:
        return louis.backTranslateString(table_list(name), cells, mode=louis.ucBrl)
    except Exception as e:  # noqa: BLE001
        return f"(no back-translation: {type(e).__name__})"

def pass_through(name, text):
    """Each input braille cell → the output cell it maps to (changed = different dots), and each run of braille cells
    → the output between its first and last cell (one-to-one = the identical run, no cell inserted or dropped)."""
    out, raw2b = translate(name, text)
    idx = [i for i, ch in enumerate(text) if BRAILLE.match(ch)]
    changed = [(i, text[i], out[raw2b[i]]) for i in idx if out[raw2b[i]] != text[i]]
    runs = list(re.finditer(r"[⠀-⣿]+", text))
    one_to_one = all(out[raw2b[m.start()]:raw2b[m.end() - 1] + 1] == m.group(0) for m in runs)
    return {"cells": len(idx), "changed": len(changed), "examples": changed[:3], "one_to_one": one_to_one}

def dots(ch):
    bits = ord(ch) - 0x2800
    return "".join(str(d) for d in range(1, 9) if bits & (1 << (d - 1))) or "0"

def main():
    browser = sys.argv[1] if len(sys.argv) > 1 else "chromium"
    data = json.load(open(os.path.join("data_raw", "_tmp", f"braille-lines-{browser}.json"), encoding="utf-8"))
    items = {f"live: {k}": v for k, v in data["live"].items()} | {f"official: {k}": v for k, v in data["official"].items()}
    items["map label (aria-label)"] = {"value": data["map"]["snapshot"].split('"')[1], "shape": ""}
    report = {"liblouis": louis.version(), "browser": browser, "tables": {}}
    for name in TABLES:
        t = {"b": {}, "c": {}}
        for label, v in items.items():
            for kind in ("value", "shape"):
                text = v[kind]
                if not text: continue
                if kind == "shape": t["b"][label] = pass_through(name, text)
                t.setdefault("lines", {})[f"{label} / {kind}"] = translate(name, text)[0]
            heading = v["shape"].splitlines()[0] if v["shape"] else ""
            for tok in sorted(set(TOKENS.findall(f"{v['value']} {heading}"))):
                if tok not in t["c"]:
                    cells = translate(name, tok)[0]
                    t["c"][tok] = {"cells": cells, "dots": " ".join(dots(c) for c in cells), "back": back(name, cells)}
        report["tables"][name] = t
    json.dump(report, open(os.path.join("data_raw", "_tmp", "louis-check.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("liblouis", report["liblouis"], "| lines from", browser)
    for name, t in report["tables"].items():
        cells = sum(x["cells"] for x in t["b"].values()); changed = sum(x["changed"] for x in t["b"].values())
        runs = all(x["one_to_one"] for x in t["b"].values())
        print(f"\n== {name}: check b: {cells - changed}/{cells} braille cells unchanged in {len(t['b'])} shape lines; runs one-to-one: {runs}")
        for tok, x in t["c"].items(): print(f"   {tok!r:>10} -> {x['cells']}  dots {x['dots']}  back: {x['back']!r}")

if __name__ == "__main__":
    main()
