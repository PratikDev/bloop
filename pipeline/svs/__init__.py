"""Official Challenge #14 resources as data: the shared toolkit (docs/official/README.md). Run from pipeline/."""
import os, sys
from pathlib import Path

os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")     # OpenCV reads it once, at its first EXR decode (frames.py)
# Extra libraries (librosa, imagecodecs) live outside the repo and off the system drive: <repo>/../tools/pylib, appended
# last so the environment's own packages (numpy, scipy, OpenCV) always win.
_PYLIB = Path(os.environ.get("BLOOP_PYLIB", Path(__file__).resolve().parents[3] / "tools" / "pylib"))
if _PYLIB.is_dir() and str(_PYLIB) not in sys.path: sys.path.append(str(_PYLIB))
