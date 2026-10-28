"""Spotcheck for the additive products (called at the end of spotcheck.py). FAIL = a contract or integrity problem, or a
book acceptance value that fails badly (docs/data-integration-plan.md §4.1: stop and ask). INFO = the book's value next
to the fresh one: reported, never forced. A product whose file is missing is a WARN (it is optional)."""
from . import meta, ocean, truth, fire, disasters, energy

def run_all(check):
    for area in (meta, truth, ocean, fire, disasters, energy):
        area.run(check)
