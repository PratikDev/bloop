"""Record health: inventory (every record and its manifest), per-record checks (files, values, labels, links), freshness
against each source, archive drift against pipeline/svs/cache, and the report (docs/HEALTH.md, public/data/meta/health.json).
Checks only: nothing here refreshes data (pipeline/refresh_live.py does). Run from pipeline/: python -m health"""
