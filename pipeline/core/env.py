"""Loads the repo's .env.local into os.environ (values are never printed). Variables already set win, so CI secrets
override the local file."""
import os
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[2] / ".env.local"

def load_env(path=ENV_FILE):
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.removeprefix("export ").strip(), v.strip().strip('"').strip("'"))

load_env()
