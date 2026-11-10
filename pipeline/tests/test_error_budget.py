"""public/data/meta/error_budget.json is exactly what pipeline/stats/error_budget.py makes from the mapping files and
the validation table today (no hand edits, no stale numbers). Run: cd pipeline && python -m unittest tests.test_error_budget"""
import json
import unittest

from stats import error_budget


class ErrorBudgetFile(unittest.TestCase):
    def test_file_equals_recomputation(self):
        shipped = json.loads(error_budget.OUT.read_text(encoding="utf8"))
        self.assertEqual(shipped, json.loads(json.dumps(error_budget.build(), ensure_ascii=False)))

    def test_unknown_error_is_never_zero(self):
        for a in error_budget.build()["axes"]:
            if a["error_source"] is None:
                self.assertIsNone(a["error"], a["id"])
                self.assertIsNone(a["cents"], a["id"])


if __name__ == "__main__":
    unittest.main()
