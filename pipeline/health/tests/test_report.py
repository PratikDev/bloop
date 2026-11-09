"""The report never prints a local path, and never mangles a URL while looking for one; it lists the hidden records."""
import json
import unittest
from health.report import LOCAL, _scrub_all, markdown


class Scrub(unittest.TestCase):
    def test_local_paths_go(self):
        for s in ("C:\\Users\\someone\\x.json", "D:/Jukebox/nasa-sac/data_raw/a.png", "/home/someone/notes", "/tmp/x"):
            self.assertEqual(LOCAL.sub("<local path>", s), "<local path>", s)

    def test_urls_stay(self):
        for s in ("https://svs.gsfc.nasa.gov/5101/", "http://example.org/tmp/a", "https://doi.org/10.5067/X (403)"):
            self.assertEqual(LOCAL.sub("<local path>", s), s)

    def test_json_stays_valid(self):
        doc = {"links": {"https://a.org/x": 403, "https://b.org/y": "ReadTimeout"}, "note": "file D:\\data\\x.png missing"}
        out = _scrub_all(doc)
        self.assertEqual(out["links"], doc["links"])
        self.assertEqual(out["note"], "file <local path> missing")
        json.loads(json.dumps(out))


class Hidden(unittest.TestCase):
    DOC = {"generated_utc": "2026-11-07T00:00Z", "records": [], "freshness": [], "links": {}}

    def test_hidden_records_listed_with_reason(self):
        md = markdown({**self.DOC, "hidden": [{"record": "rel_1", "title": "A | B", "reason": "too sparse to play"}]})
        self.assertIn("| rel_1 | A / B | too sparse to play |", hidden_section(md))

    def test_none_hidden(self):
        self.assertIn("None.", hidden_section(markdown(self.DOC)))


def hidden_section(md):
    return md.split("## Hidden from the Related shelf")[1].split("\n## ")[0]


if __name__ == "__main__":
    unittest.main()
