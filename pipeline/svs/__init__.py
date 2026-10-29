"""Official Challenge #14 resources as data: the shared toolkit (docs/official/README.md). Run from pipeline/."""
import os

os.environ.setdefault("OPENCV_IO_ENABLE_OPENEXR", "1")     # OpenCV reads it once, at its first EXR decode (frames.py)
