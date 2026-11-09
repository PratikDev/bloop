"""Dead dataset links: replaced in the url and the description, or marked unavailable with the dataset name kept."""
import unittest
from svs.dataset_links import FIXES, UNAVAILABLE, fix_dataset, fix_record

DEAD_WITH_NEW = next(u for u, (new, _) in FIXES.items() if new)
DEAD_NO_NEW = next(u for u, (new, _) in FIXES.items() if new is None)


class Fix(unittest.TestCase):
    def test_replaced(self):
        d = fix_dataset({"name": "X", "url": DEAD_WITH_NEW, "description": f"made from ({DEAD_WITH_NEW})."})
        self.assertEqual(d["url"], FIXES[DEAD_WITH_NEW][0])
        self.assertNotIn(DEAD_WITH_NEW, d["description"])
        self.assertNotIn("link", d)

    def test_unavailable_keeps_name(self):
        d = fix_dataset({"name": "ISS LIS V1", "url": DEAD_NO_NEW})
        self.assertEqual(d["name"], "ISS LIS V1")
        self.assertIsNone(d["url"])
        self.assertTrue(d["link"].startswith(UNAVAILABLE))

    def test_live_link_untouched(self):
        d = {"name": "Y", "url": "https://svs.gsfc.nasa.gov/5011/", "description": "text"}
        self.assertEqual(fix_dataset(d), d)

    def test_record_without_datasets(self):
        self.assertEqual(fix_record({"id": 1, "datasets": []}), {"id": 1, "datasets": []})
        self.assertEqual(fix_record({"id": 1, "datasets": [{"url": DEAD_WITH_NEW}]})["datasets"][0]["url"], FIXES[DEAD_WITH_NEW][0])


if __name__ == "__main__":
    unittest.main()
