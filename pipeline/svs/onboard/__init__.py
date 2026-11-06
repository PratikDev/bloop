"""Rapid onboarding (Phase 6): python -m svs.onboard <svs_id | SVS URL | gibs:Layer[@date]> turns one new item into a
related record end to end; see __main__.py."""

LIVE = {5624: 2.0, 5650: 2.0}            # daily-updated SVS items, re-onboarded by the daily GitHub Action: id → staleness limit (days)

# Related records kept off the Related shelf (feature flag: the app shows them only with NEXT_PUBLIC_SHOW_HIDDEN_RELATED=1;
# the health check lists them in docs/HEALTH.md instead of playing them). Measured on the re-decode of 7 Nov 2026 (fresh
# SVS frames): values in almost no cells, and no cell with a value at every step, so a needle reads "no value" as it plays.
HIDDEN = {
    "rel_4445": "too sparse to play: values in 0.03–0.4 % of cells per step, none at every step (re-decoded 7 Nov 2026)",
    "rel_4658": "too sparse to play: values in 0.3–0.9 % of cells per step, none at every step (re-decoded 7 Nov 2026)",
    "rel_4939": "too sparse to play: 99 % of cells on the first frame, 0.1–0.6 % on the last two (the 3D camera leaves the map), "
          "none at every step (re-decoded 7 Nov 2026)",
}
