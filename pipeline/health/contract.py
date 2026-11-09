"""The contract-15 schema for official records, read from src/types/contract-15/official.ts itself (its interfaces and
literal unions), so the check never drifts from the types the app compiles against. validate(obj, "OfficialManifest")
returns a list of problems ("" paths for the root)."""
import re
from functools import lru_cache
from svs.config import REPO

TS = REPO / "src" / "types" / "contract-15" / "official.ts"
MEMBER = re.compile(r"^\s*(\w+)(\?)?:\s*(.+?);?\s*(?://.*)?$")

def _strip_comments(text):
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)

@lru_cache(maxsize=1)
def schema():
    text = _strip_comments(TS.read_text(encoding="utf-8"))
    aliases = {}
    for name, body in re.findall(r"export type (\w+)\s*=\s*([^;]+);", text):
        aliases[name] = set(re.findall(r'"([^"]+)"', body))
    interfaces = {}
    for name, base, body in re.findall(r"export interface (\w+)(?: extends (\w+))?\s*\{(.*?)\n\}", text, flags=re.S):
        members, depth = {}, 0
        for line in body.splitlines():
            line = re.sub(r"//.*", "", line).rstrip()
            if not line.strip(): continue
            if depth == 0:
                m = MEMBER.match(line)
                if m: members[m[1]] = (m[3].strip().rstrip(";"), bool(m[2]))
            depth += line.count("{") - line.count("}")
        interfaces[name] = (base, members)
    return aliases, interfaces

def _members(name):
    aliases, interfaces = schema()
    base, own = interfaces[name]
    return {**(_members(base) if base else {}), **own}

def _check(v, t, path, out):
    aliases, interfaces = schema()
    t = t.strip()
    if t.endswith("| null") or t.startswith("null |"):
        if v is None: return
        t = t.replace("| null", "").replace("null |", "").strip()
    if t.startswith("{"): ok = isinstance(v, dict)
    elif t.startswith("Record<"): ok = isinstance(v, dict)
    elif t.startswith("[") and t.endswith("]"): ok = isinstance(v, list) and len(v) == t.count(",") + 1
    elif t.endswith("[]"):
        if not isinstance(v, list): out.append(f"{path}: not a list"); return
        for i, x in enumerate(v): _check(x, t[:-2], f"{path}[{i}]", out)
        return
    elif t == "string": ok = isinstance(v, str)
    elif t == "number": ok = isinstance(v, (int, float)) and not isinstance(v, bool)
    elif t == "boolean": ok = isinstance(v, bool)
    elif t in ("unknown", "any"): ok = True
    elif re.fullmatch(r"\d+", t): ok = v == int(t)
    elif '"' in t: ok = v in set(re.findall(r'"([^"]+)"', t))
    elif t in aliases: ok = v in aliases[t]
    elif t in interfaces:
        out.extend(validate(v, t, path)); return
    else: ok = True                                           # a type this mirror does not model: not judged
    if not ok: out.append(f"{path}: {str(v)[:60]!r} is not {t}")

def validate(obj, name, path=""):
    if not isinstance(obj, dict): return [f"{path or name}: not an object"]
    out = []
    for key, (t, optional) in _members(name).items():
        if key not in obj:
            if not optional: out.append(f"{path}.{key}: missing")
            continue
        _check(obj[key], t, f"{path}.{key}", out)
    return out
