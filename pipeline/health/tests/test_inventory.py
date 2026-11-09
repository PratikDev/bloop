"""The record inventory is complete: every manifest under public/data/official|related (and every data file the app reads)
is owned by a listed record, and every listed record has its manifest. Run from pipeline/:
python -m unittest discover -s health/tests -t ."""
import unittest
from health.inventory import CATEGORIES, problems, records

class Inventory(unittest.TestCase):
    def test_every_manifest_listed_and_every_record_has_one(self):
        self.assertEqual(problems(), [], "inventory incomplete")

    def test_categories_known_and_ids_unique(self):
        rs = records()
        self.assertEqual({r.category for r in rs} - set(CATEGORIES), set())
        ids = [r.id for r in rs]
        self.assertEqual(len(ids), len(set(ids)), "duplicate record id")

if __name__ == "__main__":
    unittest.main()
