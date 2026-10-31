"""Rapid onboarding (Phase 6): python -m svs.onboard <svs_id | SVS URL | gibs:Layer[@date]> turns one new item into a
related record end to end; see __main__.py."""

LIVE = {5624: 2.0, 5650: 2.0}            # daily-updated SVS items, re-onboarded by the daily GitHub Action: id → staleness limit (days)
